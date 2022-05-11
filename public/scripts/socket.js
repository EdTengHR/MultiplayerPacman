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
            GamePanel.initGame(data);
        })

        // Player 2 joins the room event
        socket.on("p2 joined room", (newPlayer) => {
            // Identify current player as player 1
            playerId = 1;

            p = document.createElement("p");
            p.style.color = 'rgb(22, 218, 55)';
            p.style.fontSize = 'large';
            p.innerHTML = `Player 2 ${newPlayer} joined!`;
            $('#waiting').html(p)

            // Assign player1's specific canvas and initialize it
            let canvas = document.getElementById('p1-canvas')
			initPlayer1Screen(canvas);
        })

        // Set up player 2's canvas
        socket.on("init p2 canvas", (host) => {
            // Identify current player as player 2
            playerId = 2;

            p = document.createElement("p");
            p.style.color = 'rgb(22, 218, 55)';
            p.style.fontSize = 'large';
            p.innerHTML = `You have joined ${host}'s game!`;
            $('#hostPlayer').html(p);
            var x = document.getElementById("p2-button-text-p");
            x.style.display = 'none';
            var y = document.getElementById("p2-buttons");
            y.style.display = 'none';
            // Assign player2's specific canvas and intiailize it
            var canvas = document.getElementById('p2-canvas')
            initPlayer2Screen(canvas);
        })

        // Show the gameover screen and the winner
        socket.on("show gameover screen", (data, players) => {
            console.log(Authentication.getUser());
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

            // Add in game over template panel over
            $("#game-panel").html($("#game-over-template").html())
            p = document.createElement("p");
            p.style.color = 'rgb(22, 218, 55)';
            p.style.fontSize = 'large';
            p.innerHTML = data.winner +" wins!";
            p.style.textAlign = "center"
		    $('#winner').html(p)
            // Populate statistics section in game panel page

            let p1, p2;
            const playerArr = Object.entries(players).map((e) => ( { [e[0]]: e[1] } ));
            console.log(playerArr);
            p1 = playerArr[0];
            p2 = playerArr[1];
            console.log(p1);
            console.log(p2);
            console.log(p1.keys());
            console.log(p2.values());

            $('#player1-name').html(p1);
            $('#player2-name').html(p2);
            $('#player1-score').html(p1.highscore);
            $('#player2-score').html(p2.highscore);

        })

        // P2 needs to update p1's position on p2's canvas
        socket.on("update p1", (data) => {
            updatePlayer1ForPlayer2(data);
        });

        // P1 needs to update p2's position on p1's canvas
        socket.on("update p2", (data) => {
            updateP2InP1Screen(data);
        });

        // Update the scoreboard for all users
        socket.on("update scores", (players) => {
            players = JSON.parse(players);
            OnlineUsersPanel.updateScoreboard(players);
        })
    };

    const createNewGame = function() {
        if (socket && socket.connected) {
            console.log("emitting create game")
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
            console.log("emitting p2 joined game", data)
            socket.emit('p2 joined game', data);
        }
    }

    const p1Moved = function(state, keycode, direction) {
        socket.emit("p1 moved", {X: state.X, Y: state.Y, keyCode: keycode, direction: direction})
    }

    const p2Moved = function(state, keycode, direction) {
        socket.emit('p2 moved', {X: state.X, Y: state.Y, keyCode: keycode, direction: direction})
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

    return { getSocket, connect, createNewGame, startGame, p1Moved, p2Moved, scoredPoint, gameOver, disconnect, postMessage, userTyping };
})();
