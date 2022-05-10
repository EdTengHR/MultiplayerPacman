var player1State;

initPlayer2Screen = function(canvas){
	var ctx = initializeCanvas(canvas);

	player1State = {
		X: 60,
		Y: 60,
		lastPressedKey: 37,
		direction: 'left',
		dots: []
	}

	player2State = {
		X: 340,
		Y: 220,
		lastPressedKey: 39,
		direction: 'right'
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
		window.requestAnimationFrame(tickPlayer2Screen);
	}

	window.requestAnimationFrame(tickPlayer2Screen);
	
}

function checkGameOver(player2State, player1State){
	var xDiff = Math.abs(player2State.X - player1State.X)
	var yDiff = Math.abs(player2State.Y - player1State.Y)
	
	if(xDiff >= 0 && xDiff <= 15 && yDiff >= 0 && yDiff <= 15){
		GamePanel.gameOver('Player2');
	}
}
function updatePlayer2(player2State, keyCode){
	player2State = updatePlayerPosition(player2State, keyCode, config.KEY_DIRECTIONS[keyCode], false)
	return player2State;
}

function updatePacmanInGhostScreen(data){
	player1State = updatePacmanPositionInGhostScreen(data)
}

function updatePacmanPositionInGhostScreen(data){
	player1State.X = data.X
	player1State.Y = data.Y
	

	var diff = data.direction == 'right' || data.direction == 'down' ? 2 : -2
	if(data.direction == 'right' || data.direction == 'left'){
		eatDots(player1State, false, diff)
		player1State = updatePlayerDirection(player1State, data.keyCode, data.direction);	
	}
	else{
		eatDots(player1State, true, diff)
		player1State = updatePlayerDirection(player1State, data.keyCode, data.direction);
	}
	return player1State;
}

function drawP2(ctx, player2State){
	ctx.fillStyle = '#D0342B'
	// Arc of ghost
	ctx.arc(player2State.X, player2State.Y, 20, 0, 2*Math.PI, false);
	ctx.fill();
}