const express = require("express");

const bcrypt = require("bcrypt");
const fs = require("fs");
const session = require("express-session");

// Create the Express app
const app = express();

// Use the 'public' folder to serve static files
app.use(express.static("public"));

// Use the json middleware to parse JSON data
app.use(express.json());

// Use the session middleware to maintain sessions
const gameSession = session({
    secret: "game",
    resave: false,
    saveUninitialized: false,
    rolling: true,
    cookie: { maxAge: 300000 }
});
app.use(gameSession);

// This helper function checks whether the text only contains word characters
function containWordCharsOnly(text) {
    return /^\w+$/.test(text);
}

// Handle the /register endpoint
// Not exactly signing in, this just requires users to enter their desired username
app.post("/register", (req, res) => {
    // Get the JSON data from the body
    const { username } = req.body;
    const users = JSON.parse(fs.readFileSync("./data/users.json"));

    if (username === ""){
        res.json({ status: "error", error: "Username cannot be empty"});
        return;
    }
    if (!containWordCharsOnly(username)){
        res.json({ status: "error", error: "Username can only contain letters, numbers, or underscore"});
        return;
    }
    if (username in users){
        res.json({ status: "error", error: "Username already exists"});
        return;
    }
    
    users[username] = {
        lives: 3,
        points: 0
    };

    fs.writeFileSync("./data/users.json", JSON.stringify(users, null, " "))
    req.session.user = { username }
    res.json({ status: "success" });
});

// Handle the /signout endpoint
app.get("/signout", (req, res) => {
    delete req.session.user;
    res.json({ status: "success" });
});


const { createServer } = require("http");
const { Server } = require("socket.io");
const httpServer = createServer(app);
const io = new Server(httpServer);

io.use((socket, next) => {
    gameSession(socket.request, {}, next);
})

// Current players in the lobby
const players = {};
let numPlayers = 0;
let alivePlayers = 0;

io.on("connection", (socket) => {
    const newUser = socket.request.session.user
    if (newUser != undefined){ 
        players[newUser.username] = {
            lives: 3,
            points: 0
        }
        numPlayers += 1;
        alivePlayers += 1;
        io.emit("add user", JSON.stringify(newUser));
    }   

    socket.on("disconnect", () => {
        // A user disconnects from the server
        if (newUser != undefined){
            delete players[newUser.username];
            numPlayers -= 1;
            alivePlayers -= 1;
            io.emit("remove user", JSON.stringify(newUser));
            console.log(players)
        }
    })

    socket.on("get users", () => {
        // Send the online users back to the browser
        socket.emit("users", JSON.stringify(players))
    })

    socket.on("update position", (x, y) => {
        const newPos = {
            user: newUser.username,
            xPos: x,
            yPos: y
        }
        io.emit("update player positions", JSON.stringify(newPos));
    })

    socket.on("player scores", () => {
        players[newUser.username].points += 1;
        io.emit("update scores", JSON.stringify(players));
    })

    socket.on("player loses life", () => {
        players[newUser.username].lives -= 1;
        if (players[newUser.username].lives == 0){
            alivePlayers -= 1;
            if ((alivePlayers == 1 && numPlayers > 1) || 
                    (alivePlayers == 0 && numPlayers == 1))
                io.emit("game over", JSON.stringify(players));
            else
                io.emit("player died", JSON.stringify(newUser));
        }
        else
            io.emit("update lives", JSON.stringify(players));
    })
    
    socket.on("game over", () => {
        // Send player data (including lives + points) to webpage when game is over
        io.emit("game over", JSON.stringify(players));
    })
})

// Use a web server to listen at port 8000
httpServer.listen(8000, () => {
    console.log("Starting pacman server...");
});
