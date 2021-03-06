let typingTimeout = null;

const SignInForm = (function() {
    // This function initializes the UI
    const initialize = function() {
        // Hide signin overlay
        $("#signin-overlay").hide();

        // Submit event for the signin form
        $("#signin-form").on("submit", (e) => {
            // Do not submit the form
            e.preventDefault();

            // Get the input fields
            const username = $("#signin-username").val().trim();
            const password = $("#signin-password").val().trim();

            // Send a signin request
            Authentication.signin(username, password,
                () => {
                    hide();
                    UserPanel.update(Authentication.getUser());
                    UserPanel.show();
                    GamePanel.initialize();

                    Socket.connect();
                },
                (error) => { $("#signin-message").text(error); }
            );
        });

        // Submit event for the register form
        $("#register-form").on("submit", (e) => {
            // Do not submit the form
            e.preventDefault();

            // Get the input fields
            const username = $("#register-username").val().trim();
            const password = $("#register-password").val().trim();
            const confirmPassword = $("#register-confirm").val().trim();

            // Password and confirmation does not match
            if (password != confirmPassword) {
                $("#register-message").text("Passwords do not match.");
                return;
            }

            // Send a register request
            Registration.register(username, password,
                () => {
                    $("#register-form").get(0).reset();
                    $("#register-message").text("You can sign in now.");
                },
                (error) => { $("#register-message").text(error); }
            );
        });
    };

    // This function shows the form
    const show = function() {
        $("#signin-overlay").fadeIn(500);
    };

    // This function hides the form
    const hide = function() {
        $("#signin-form").get(0).reset();
        $("#signin-message").text("");
        $("#register-message").text("");
        $("#signin-overlay").fadeOut(500);
    };

    return { initialize, show, hide };
})();

const UserPanel = (function() {
    // This function initializes the UI
    const initialize = function() {
        // Hide it
        $("#user-panel").hide();

        // Click event for the signout button
        $("#signout-button").on("click", () => {            
            // Remove all online users
            $("#online-users-area").empty();

            // Send a signout request
            Authentication.signout(
                () => {
                    Socket.disconnect();

                    hide();
                    SignInForm.show();
                }
            );
        });
    };

    // This function shows the form with the user
    const show = function(user) {
        $("#user-panel").show();
    };

    // This function hides the form
    const hide = function() {
        $("#user-panel").hide();
    };

    // This function updates the user panel
    const update = function(user) {
        if (user) {
            $("#user-panel .user-welcome").text("Welcome");
            $("#user-panel .user-name").html(user.username).css('font-weight', 'bold');
            $("#user-panel .user-highscore-msg").text("Your highscore is:");
            $("#user-panel .user-highscore").text(user.highscore);
        }
        else {
            $("#user-panel .user-name").html("");
            $("#user-panel .user-highscore").text("");
            $("#user-panel .user-highscore-msg").text("");
            $("#user-panel .user-highscore").text("");
        }
    };

    return { initialize, show, hide, update };
})();

const OnlineUsersPanel = (function() {
    // This function initializes the UI
    const initialize = function() {};

    // This function updates the online users panel
    const update = function(players) {
        const onlineUsersArea = $("#online-users-area");

		// Get the current user
        const currentUser = Authentication.getUser();
        console.log("Get current user successful, adding users one by one")

        // Add the user one-by-one
        for (const username in players) {
            if (username != currentUser.username) {
                const userDiv = onlineUsersArea.find("#username-" + username);

                if (userDiv.length == 0){
                    onlineUsersArea.append(
                        $("<div id='username-" + username + "'></div>")
                            .append(UI.getUserDisplay(username, players[username]))
                    );
                }
                console.log("1 user added");
            }
        }
        console.log("online user panel updated")
    };

    // Update the scoreboard for the online users
    const updateScoreboard = function(players) {
        let currUser = null;
        // Loop through the online users area and update each user's points
        $("#online-users-area").children().each(function() {
            $(this).children().each(function(){
                $(this).children().each(function(index){
                    if (index == 0){
                        currUser = $(this).text();
                    }
                    if (index == 2) {
                        $(this).text(players[currUser].points);
                    }
                    if (index == 6) {
                        $(this).text(players[currUser].highscore);
                        return false;     // break out of each loop
                    }
                });
            });
        })
    }

    // This function adds a user in the panel
	const addUser = function(username, user) {
        const onlineUsersArea = $("#online-users-area");
		
		// Find the user
		const userDiv = onlineUsersArea.find("#username-" + username);

        console.log("adding user: ", username)
		
		// Add the user only if the div does not exist
		if (userDiv.length == 0) {
			onlineUsersArea.append(
				$("<div id='username-" + username + "'></div>")
					.append(UI.getUserDisplay(username, user))
			);
		}
        console.log("Add users complete")
	};

    // This function removes a user from the panel
	const removeUser = function(user) {
        const onlineUsersArea = $("#online-users-area");
		
		// Find the user
		const userDiv = onlineUsersArea.find("#username-" + user.username);
		
        let length = userDiv.length;
		// Remove the user
		while (length > 0) {
            userDiv.remove();
            length--;
        }
	};

    return { initialize, update, updateScoreboard, addUser, removeUser };
})();

const GamePanel = (function() {
    let gamePanel = null;

    const initialize = function() {
		gamePanel = $("#game-panel");
        gamePanel.html($("#lobby-template").html());

        $("#btnCreateGame").on('click', () => {
            console.log("create game button clicked")
            Socket.createNewGame();
        });

		// Player 2's events
        // When p2 presses join game button, set their gamepanel's html to the join game template
		$("#btnJoinGame").on('click', () => {
            console.log("join game button clicked")
            gamePanel.html($("#join-game-template").html())
        });
        
		$("#btnStartGame").on('click', () => {
            console.log("start game button clicked")
            Socket.startGame()
        });
        
 	};

    const initGame = function(data) {
        gamePanel.html($("#create-game-template").html());
        p = document.createElement("p");
        p.style.color = 'rgb(22, 218, 55)';
        p.style.fontSize = 'large';
        p.innerHTML = 'Game ID: '+ data.gameId;
		$('#gameId').html(p);
    }

    const initP2Canvas = function(data) {
        p = document.createElement("p");
        p.style.color = 'rgb(22, 218, 55)';
        p.style.fontSize = 'large';
        p.innerHTML = `You have joined ${data.host}'s game!`;
        $('#hostPlayer').html(p);

        p2 = document.createElement("p");
        p2.style.color = 'rgb(22, 218, 55)';
        p2.style.fontSize = 'large';
        p2.innerHTML = `Game id: ${data.gameId}`;
        $('#p2-gameId').html(p2);

        var x = document.getElementById("p2-button-text-p");
        x.style.display = 'none';
        var y = document.getElementById("p2-buttons");
        y.style.display = 'none';
    }

    const p2JoinsRoom = function(newPlayer) {
        p = document.createElement("p");
        p.style.color = 'rgb(22, 218, 55)';
        p.style.fontSize = 'large';
        p.innerHTML = `Player 2 ${newPlayer} joined!`;
        $('#waiting').html(p)
    }

    const restartGame = function(playerId) {
        let gameId;
        if (playerId == 1){
            gameId = $("#gameId").first().text().substring(9);
            Socket.restart(gameId);
        }
        else if (playerId == 2){
            gameId = $("#p2-gameId").text().substring(9);
            Socket.restart(gameId);
        }

        let currUser = null;
        $("#online-users-area").children().each(function() {
            $(this).children().each(function(){
                $(this).children().each(function(index){
                    if (index == 2) {
                        $(this).text("0");
                        return false;     // break out of each loop
                    }
                });
            });
        })
        
        GamePanel.initialize();
    }

    const gameOver = function(data, players) {
        // Add in game over template panel over
        $("#game-panel").html($("#game-over-template").html())
        p = document.createElement("p");
        p.style.color = 'rgb(22, 218, 55)';
        p.style.fontSize = 'large';
        p.innerHTML = data.winner +" wins!";
        p.style.textAlign = "center"
        $('#winner').html(p)

        // Populate statistics section in game panel page
        let p1name,p1points,p1hScore,p2name,p2points,p2hScore;
        let myInfoName = [];
        let myInfoHScore = [];
        let myInfoScore = [];

        for(player in players){
            myInfoName.push(player);
            myInfoHScore.push(players[player].highscore);
            myInfoScore.push(players[player].points)
        }

        if(myInfoHScore[0]>=myInfoHScore[1]){//change to myInfoScore once implemented
            p1name = myInfoName[0];
            p1points = myInfoScore[0];
            p1hScore = myInfoHScore[0];
            p2name = myInfoName[1];
            p2points = myInfoScore[1];
            p2hScore = myInfoHScore[1];
        }else{
            p2name = myInfoName[0];
            p2points = myInfoScore[0];
            p2hScore = myInfoHScore[0];
            p1name = myInfoName[1];
            p1points = myInfoScore[1];
            p1hScore = myInfoHScore[1];
        }

        console.log(myInfoHScore);
        console.log(p1name, p2name, p1hScore, p2hScore);
        $('#player1-name').html(p1name);
        $('#player2-name').html(p2name);
        $('#player1-score').html(p1hScore);
        $('#player2-score').html(p2hScore);
    }
    
    return { initialize, initGame, initP2Canvas, p2JoinsRoom, restartGame, gameOver };
})();

const UI = (function() {
    // This function gets the user display
    const getUserDisplay = function(username, user) {
        console.log("user: ", user);
        return $("<div class='field-content row shadow'></div>")
            .append($("<span class='user-username'>" + username + "</span>"))
            .append($("<div class='spacer-2'>" + "</div>"))
            .append($("<span class='user-points'>" + user.points + "</span>"))
            .append($("<div class='spacer-4'>" + "</div>"))
            .append($("<span class='user-highscore'>" + user.highscore + "</span>"));         
    };

    // The components of the UI are put here
    const components = [SignInForm, UserPanel, OnlineUsersPanel];

    // This function initializes the UI
    const initialize = function() {
        // Initialize the components
        for (const component of components) {
            component.initialize();
        }
    };

    return { getUserDisplay, initialize };
})();
