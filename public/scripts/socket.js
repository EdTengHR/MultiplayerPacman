const Socket = (function() {
    // This stores the current Socket.IO socket
    let socket = null;
    let playerId = 0;

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
            playerId = 1;
            GamePanel.initGame(data);
        })

        // Player 2 joins the room event
        socket.on("p2 joined room", (newPlayer) => {
            GamePanel.p2JoinsRoom(newPlayer);

            // Assign player1's specific canvas and initialize it
            let canvas = document.getElementById('p1-canvas')
			initPlayer1Screen(canvas);
        })

        // Set up player 2's canvas
        socket.on("init p2 canvas", (data) => {
            // Identify current player as player 2
            playerId = 2;

            GamePanel.initP2Canvas(data);

            // Assign player2's specific canvas and intialize it
            var canvas = document.getElementById('p2-canvas')
            initPlayer2Screen(canvas);
        })

        // Show the gameover screen and the winner
        socket.on("show gameover screen", (data, players) => {
            // Cancel game animation frames for both players
            if (playerId == 1){
                stopP1Animation();
            }
            if (playerId == 2){
                stopP2Animation();
            }

            if (Authentication.getUser().username != data.winner){
                socket.emit("loser leaves room")
            }

            GamePanel.gameOver(data, players);
        })

        // P2 needs to update p1's position on p2's canvas
        socket.on("update p1", (data) => {
            updatePlayer1ForPlayer2(data);
        });

        // P1 needs to update p2's position on p1's canvas
        socket.on("update p2", (data) => {
            updatePlayer2ForPlayer1(data);
        });

        // Update the scoreboard for all users
        socket.on("update scores", (players) => {
            players = JSON.parse(players);
            OnlineUsersPanel.updateScoreboard(players);
        })
    };

    const createNewGame = function() {
        if (socket && socket.connected) {
            socket.emit("create game");
        }
    }

    const startGame = function(){
        if (socket && socket.connected) {
            gameId = $('#inputGameId').val()
            let data = {
                gameId: gameId,
            }
            let mySound = new Audio('./sound/start-sound.wav');
            mySound.play();
            socket.emit('p2 joined game', data);
        }
    }

    const p1Moved = function(state, keycode, direction) {
        socket.emit("p1 moved", {X: state.X, Y: state.Y, phase: state.phase, keyCode: keycode, direction: direction})
    }

    const p2Moved = function(state, keycode, direction) {
        socket.emit('p2 moved', {X: state.X, Y: state.Y, phase: state.phase, keyCode: keycode, direction: direction})
    }

    const scoredPoint = function(point) {
        socket.emit("player scores", point);
    }

    const gameOver = function(winner) {
        socket.emit("gameover", winner);
    }

    // This function disconnects the socket from the server
    const disconnect = function() {
        socket.disconnect();
        socket = null;
    };

    const restartGame = function() {
        GamePanel.restartGame(playerId);
    }

    const restart = function(gameId) {
        // Reset the player's id
        playerId = 0;
        socket.emit("leave room", (gameId));
    }

    return { getSocket, connect, createNewGame, startGame, p1Moved, p2Moved, scoredPoint, gameOver, disconnect, restartGame, restart };
})();
