const Socket = (function() {
    // This stores the current Socket.IO socket
    let socket = null;

    // This function gets the socket from the module
    const getSocket = function() {
        return socket;
    };

    // This function connects the server and initializes the socket
    const connect = function() {
        socket = io();

        // Wait for the socket to connect successfully
        socket.on("connect", () => {
            // Get the list of online users 
            socket.emit("get users");
        });

        // Update users
        socket.on("users", (players) => {
            players = JSON.parse(players);

            OnlineUsersPanel.update(players);
        });

        // Add a user
        socket.on("add user", (username, user) => {
            user = JSON.parse(user);
            // Add the online user
            OnlineUsersPanel.addUser(username, user);
        });

        // Remove a user
        socket.on("remove user", (user) => {
            user = JSON.parse(user);

            OnlineUsersPanel.removeUser(user);
        });

        // New game created event
        socket.on("new game created", (data) => {
            GamePanel.initGame(data);
        })

        // Player 2 joins the room event
        socket.on("p2 joined room", (data) => {
            $('#waiting').html('Player joined!')
            let canvas = document.getElementById('p1-canvas')
			initPlayer1Screen(canvas);
        })

        // Set up player 2's canvas
        socket.on("init p2 canvas", (data) => {
            var canvas = document.getElementById('p2-canvas')
            initPlayer2Screen(canvas);
        })



        // Show the gameover screen and the winner
        socket.on("show gameover screen", (winner) => {
            $("#game-panel").html($("#game-over-template").html())
		    $('#winner').html(winner)
        })

        socket.on('pacmanMoved', pacmanMoved);
    };

    const createNewGame = function() {
        if (socket && socket.connected) {
            console.log("emitting create game")
            socket.emit("create game");
        }
    }

    const startGame = function(){
        if (socket && socket.connected) {
            let data = {
                gameId: $('#inputGameId').val()
            }
            console.log("emitting p2 joined game")
            socket.emit('p2 joined game', data);
        }
    }

    const p1Moved = function() {

    }

    const p2Moved = function() {
        
    }

    // This function disconnects the socket from the server
    const disconnect = function() {
        socket.disconnect();
        socket = null;
    };

    // This function sends a post message event to the server
    const postMessage = function(content) {
        if (socket && socket.connected) {
            socket.emit("post message", content);
        }
    };

    // This function sends a 'typing' event to the server
    const userTyping = function() {
        if (socket && socket.connected) {
            socket.emit("user typing");
        }
    }

    return { getSocket, connect, createNewGame, startGame, p1Moved, p2Moved, disconnect, postMessage, userTyping };
})();
