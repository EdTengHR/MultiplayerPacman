var player1State;
let p2AnimationId;

initPlayer2Screen = function(canvas){
	var ctx = initializeCanvas(canvas);

	player1State = {
		X: 60,
		Y: 60,
		lastPressedKey: 37,
		direction: 'left',
		dots: [],
		phase: false
	}

	player2State = {
		X: 340,
		Y: 220,
		lastPressedKey: 39,
		direction: 'right',
		phase: false
	}

	window.addEventListener("keydown", function(e){
		player2State = updatePlayer2(player2State, e.keyCode)
	})

	function tickPlayer2Screen(){
		checkGameOver(player2State, player1State)
		player2State = updatePlayer2(player2State, player2State.lastPressedKey)
		clear(ctx);
		draw(ctx, player1State);
		drawP2(ctx, player2State);
		p2AnimationId = window.requestAnimationFrame(tickPlayer2Screen);
	}

	p2AnimationId = window.requestAnimationFrame(tickPlayer2Screen);
	
}

function checkGameOver(player2State, player1State){
	var xDiff = Math.abs(player2State.X - player1State.X)
	var yDiff = Math.abs(player2State.Y - player1State.Y)
	
	// If touching player 1, then win game
	if(xDiff >= 0 && xDiff <= 15 && yDiff >= 0 && yDiff <= 15){
		// Add game over sound
		let mySound = new Audio('./sound/endgame-sound.wav');
		mySound.play();

		// Send update to server to let server know p2 won
		Socket.gameOver('Player2');
	}
}

// Update player 2's position on player 2's canvas
function updatePlayer2(player2State, keyCode){
	// If key pressed was space bar (activating / deactivating cheat mode)
	if (keyCode == 32){
		player2State.phase = !player2State.phase;
		console.log("cheat mode:", player2State.phase);
		keyCode = player2State.lastPressedKey;		// reassigning keycode to the last pressed key so player keeps moving
	}

	player2State = updatePlayerPosition(player2State, keyCode, config.KEY_DIRECTIONS[keyCode], false)
	return player2State;
}

// Update player 1's state for player 2 - player 1's state is used every tick to draw p1 on p2's screen
function updatePlayer1ForPlayer2(data){
	player1State = updateP1StateForP2(data)
}

// Function to update player 1's state
function updateP1StateForP2(data){
	player1State.X = data.X
	player1State.Y = data.Y
	player1State.phase = data.phase
	
	var diff = data.direction == 'right' || data.direction == 'down' ? 2 : -2
	if(data.direction == 'right' || data.direction == 'left'){
		eatDots(player1State, false, diff, false)
		player1State = updatePlayerDirection(player1State, data.keyCode, data.direction);	
	}
	else{
		eatDots(player1State, true, diff, false)
		player1State = updatePlayerDirection(player1State, data.keyCode, data.direction);
	}
	return player1State;
}

// Draw player 2
function drawP2(ctx, player2State){
	//ctx.fillStyle = '#D0342B'
	//ctx.fillStyle = '#FF0000'
	
//	let radius = config.PACMAN.radius

	// Draw player 2 here
//	ctx.arc(player2State.X, player2State.Y, radius, 0, 2 * Math.PI, false);
//	ctx.fill();

this.x = player2State.X - 20;
 this.y = player2State.Y + 10;
 
 ctx.beginPath();
 ctx.strokeStyle="black";
 ctx.lineWidth="1";
 ctx.fillStyle="white";
 ctx.beginPath(); 
 ctx.moveTo(this.x, this.y);
 ctx.quadraticCurveTo(this.x + 19, this.y - 65, this.x + 40, this.y);
 ctx.moveTo(this.x, this.y);
 ctx.quadraticCurveTo(this.x + 3, this.y + 10, this.x + 10, this.y);
 ctx.moveTo(this.x + 10, this.y);
 ctx.quadraticCurveTo(this.x + 12, this.y +10, this.x + 20, this.y);
 ctx.moveTo(this.x + 20, this.y);
 ctx.quadraticCurveTo(this.x + 22, this.y + 10, this.x + 30, this.y);
 ctx.moveTo(this.x + 30, this.y);
 ctx.quadraticCurveTo(this.x + 35, this.y +10, this.x + 40, this.y);
 ctx.strokeStyle = 'black';
 ctx.stroke();
 ctx.fill();
 ctx.closePath();
 ctx.fillStyle = "black";
 ctx.beginPath();
 ctx.arc(this.x + 14, this.y - 20, 2, 0, Math.PI * 8, true);
 ctx.strokeStyle = 'black';
 ctx.stroke();
 ctx.fill();
 ctx.beginPath();
 ctx.arc(this.x + 25, this.y - 20, 2, 0, Math.PI * 8, true);
 ctx.strokeStyle = 'black';
 ctx.stroke();
 ctx.fill();

}

function stopP2Animation(){
	console.log("Stop p2 animation called")
	window.cancelAnimationFrame(p2AnimationId);
}