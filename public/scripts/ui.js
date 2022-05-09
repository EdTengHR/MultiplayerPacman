let typingTimeout = null;

const SignInForm = (function() {
    // This function initializes the UI
    const initialize = function() {
        // Populate the avatar selection
        Avatar.populate($("#register-avatar"));
        
        // Hide it
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
            const avatar   = $("#register-avatar").val();
            const name     = $("#register-name").val().trim();
            const password = $("#register-password").val().trim();
            const confirmPassword = $("#register-confirm").val().trim();

            // Password and confirmation does not match
            if (password != confirmPassword) {
                $("#register-message").text("Passwords do not match.");
                return;
            }

            // Send a register request
            Registration.register(username, avatar, name, password,
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

    return { initialize, update, addUser, removeUser };
})();

const GamePanel = (function() {
	// This stores the chat area
    let gamePanel = null;

    // This function initializes the UI
    const initialize = function() {
		// Set up the chat area
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
		$('#gameId').html(data.gameId)
    }

    
    const update = function(data) { 
        
    };

    return { initialize, initGame, update };
})();

const UI = (function() {
    // This function gets the user display
    const getUserDisplay = function(username, user) {
        console.log("user: ", user);
        return $("<div class='field-content row shadow'></div>")
            .append($("<span class='user-username'>" + username + "</span>"))
            .append($("<div class='spacer-2'>" + "</div>"))
            .append($("<span class='user-points'>" + user.points + "</span>"))
            .append($("<div class='spacer-3'>" + "</div>"))
            .append($("<span class='user-lives'>" + user.lives + "</span>"))
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
