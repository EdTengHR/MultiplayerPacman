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
app.post("/register", (req, res) => {
    // Get the JSON data from the body
    const { username, password } = req.body;
    const users = JSON.parse(fs.readFileSync("./data/users.json"));

    if (username === "" || password === ""){
        res.json({ status: "error", error: "Username and password cannot be empty"});
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

    const hash = bcrypt.hashSync(password, 10);
    
    users[username] = {
        password: hash,
        highscore: 0
    };

    fs.writeFileSync("./data/users.json", JSON.stringify(users, null, " "))
    req.session.user = { username }
    res.json({ status: "success" });
});

// Handle the /signin endpoint
app.post("/signin", (req, res) => {

    const { username, password } = req.body;

    const users = JSON.parse(fs.readFileSync("./data/users.json"));

    if (username === ""){
        res.json({ status: "error", error: "Please enter your username"});
        return;
    }
    if (password === ""){
        res.json({ status: "error", error: "Please enter your password"});
        return;
    }
    if (!(username in users)){
        res.json({ status: "error", error: "Username not in database"});
        return;
    }
    const hashedPassword = users[username].password;
    if (!bcrypt.compareSync(password, hashedPassword)){
        res.json({ status: "error", error: "Password incorrect"});
        return;
    }
    let highscore = users[username].highscore;
    let lives = 3;
    let points = 0;
    //
    // G. Sending a success response with the user account
    //
    req.session.user = { username, highscore }
    res.json({ status: "success", user: {username, highscore} });
});

// Handle the /validate endpoint
app.get("/validate", (req, res) => {

    //
    // B. Getting req.session.user
    //
    if (req.session.user === undefined){
        res.json({ status: "error", error: "Not signed in"})
        return;
    }
    let user = req.session.user;

    //
    // D. Sending a success response with the user account
    //
    res.json({ status: "success", user: user})
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
let numPlayers = 0;     // This value is edited later on when p2 joins a room
let alivePlayers = 0;
let gameId = 0;
let host = null;

io.on("connection", (socket) => {
    const newUser = socket.request.session.user
    if (newUser != undefined){ 
        players[newUser.username] = {
            lives: 1,
            points: 0,
            highscore: newUser.highscore,
        }
        numPlayers += 1;
        alivePlayers += 1;
        console.log("New connection")
        console.log("Online users: ", players);
        io.emit("add user", newUser.username, JSON.stringify(players[newUser.username]));
        console.log("user added from server's io on connect");
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
        // Send the data of current players back to the browser
        socket.emit("users", JSON.stringify(players))
    })

    socket.on("create game", () => {
        let GameId = ( Math.random() * 100000 ) | 0;
        let data = {
            gameId: GameId
        }
        host = newUser.username
        socket.emit("new game created", data);
        console.log("Emitted create new game with data:", data)
        socket.join(GameId.toString());
        console.log("Game created with id:" + GameId);
    })


    socket.on("p2 joined game", (data) => {
        let room = socket.adapter.rooms.get(data.gameId);

        console.log(data);
        console.log("Player 2: ", newUser.username, " has joined the game!")

        if(room != undefined){
            numPlayers = Object.keys(room).length
            if(numPlayers == 2){
                socket.emit('notifyRoomFull', {})
            }
            else{
                // Broadcast for player 1 to initialize canvas
                io.sockets.in(data.gameId).emit('p2 joined room', newUser.username)
                socket.join(data.gameId)
                gameId = data.gameId;

                // Broadcast for player 2 to initialize canvas
                socket.emit('init p2 canvas', host)
            }
        }
    })

    // player movement broadcasts here
    socket.on("p1 moved", (data) => {
        socket.broadcast.to(gameId).emit('update p1', data);
    })

    socket.on("p2 moved", (data) => {
        socket.broadcast.to(gameId).emit('update p2', data);
    })

    socket.on("player scores", (point) => {
        players[newUser.username].points += point;
        io.sockets.in(gameId).emit('update scores', JSON.stringify(players))
    })

    // socket.on("player loses life", () => {
    //     players[newUser.username].lives -= 1;
    //     if (players[newUser.username].lives == 0){
    //         alivePlayers -= 1;
    //         if ((alivePlayers == 1 && numPlayers > 1) || 
    //                 (alivePlayers == 0 && numPlayers == 1)){
                
    //             // Send player data (including lives + points) to webpage when game is over
    //             const users = JSON.parse(fs.readFileSync("./data/users.json"));
                
    //             if (players[newUser.username].points > users[newUser.username].highscore){
    //                 users[newUser.username].highscore = players[newUser.username].points;
    //                 fs.writeFileSync("./data/users.json", JSON.stringify(msgs, null, " "));
    //             }

    //             io.emit("game over", JSON.stringify(players));
    //         }
    //         else
    //             socket.emit("player died", JSON.stringify(newUser));
    //     }
    //     else
    //         io.emit("update lives", JSON.stringify(players));
    // })
    
    socket.on("gameover", (winner) => {
        // Caller is the one who called the gameover (the player id that won)
        // Winner represents the actual username of the player that won
        let data = {
            winner: newUser.username,
            caller: winner
        }

        // this has to be here so that the winner actually receives the broadcast to show gameover screen
        io.sockets.in(gameId).emit('show gameover screen', data, players)

        // Winner leaves the socket room
        socket.leave(gameId)
        console.log(`winner ${newUser.username} left room`)
    })

    socket.on("loser leaves room", () => {
        socket.leave(gameId)
        console.log(`loser ${newUser.username} left room`)
        console.log(socket.adapter.rooms);
    })

    // socket.on("time up", () => {
    //     // Send player data (including lives + points) to webpage when game is over
    //     const users = JSON.parse(fs.readFileSync("./data/users.json"));
        
    //     if (players[newUser.username].points > users[newUser.username].highscore){
    //         users[newUser.username].highscore = players[newUser.username].points;
    //         fs.writeFileSync("./data/users.json", JSON.stringify(msgs, null, " "));
    //     }
        
    //     io.emit("game over", JSON.stringify(players));
    // })
})

// Use a web server to listen at port 8000
httpServer.listen(8000, () => {
    console.log("Starting pacman server...");
});
