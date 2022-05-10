var player2State;

initPlayer1Screen = function(canvas){
	var ctx = initializeCanvas(canvas);

	var state = {
		X: 60,
		Y: 60,
		lastPressedKey: 37,
		direction: 'left',
		dots: [],
		points: 0
	}

	player2State = {
		X: 340,
		Y: 220,
		lastPressedKey: 37,
		p2Direction: 'left'
	}

	window.addEventListener("keydown", function(e){
		state = update(state, e.keyCode)
	})

	function tick(){
		state = update(state, state.lastPressedKey)
		clear(ctx);
		draw(ctx, state);
		drawP2(ctx, player2State);
		window.requestAnimationFrame(tick);
	}

	window.requestAnimationFrame(tick);
	
}

function initializeCanvas(canvas){
	canvas.width = config.BOX_WIDTH * config.GRID[0].length
	canvas.height = config.BOX_HEIGHT * config.GRID.length
	return canvas.getContext('2d');
}

function clear(ctx){
	ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
}

function update(state, keyCode){
	state = updatePlayerPosition(state, keyCode, config.KEY_DIRECTIONS[keyCode], true)
	return state;
}

// Update a player's position variables, send socket messages depending on situation - change isPacman
function updatePlayerPosition(state, keyCode, direction, isPlayer1){

	// Find the differential in x or y
	// If player is heading in positive xy directions, set diff to 2, o.w. set diff to -2
	var diff = direction == 'right' || direction == 'down' ? 2 : -2

	// Check if direction is along x axis, then check y axis
	if(direction == 'right' || direction == 'left'){

		// Check if the move is allowed and adjust positions accordingly.
		// Since direction is along x axis, have to check wall positions at X axis, and adjust according to Y axis
		if(moveAllowed(state, 'X', 'Y', direction)){
			state.X += diff

			// Update the player's direction based on the keycode input
			state = updatePlayerDirection(state, keyCode, direction);
			if(isPlayer1){
				eatDots(state, false, diff)

				// Send keycode input information to server to update positions
				Socket.p1Moved(state, keyCode, direction);
			}
			else{

				// Send keycode input information to server to update positions
				Socket.p2Moved(state, keyCode, direction)
			}
		}
	}
	else{
		if(moveAllowed(state, 'Y', 'X', direction)){
			state.Y += diff
			state = updatePlayerDirection(state, keyCode, direction);
			if(isPlayer1){
				eatDots(state, true, diff)
				Socket.p1Moved(state, keyCode, direction);
			}
			else{
				Socket.p2Moved(state, keyCode, direction)
			}
		}
	}
	return state;
}

// Update a player's direction variables
function updatePlayerDirection(state, keyCode, direction){
	state.lastPressedKey = keyCode
	state.direction = direction
	return state
}

// Draw the game, including its borders and dots
function draw(ctx, state){
	drawBorder(ctx, state);
	drawDots(ctx, state);
	drawPacman(ctx, state);
}

// Draw borders based on the grid lines provided in the game config file
// This is also where the dot positions in the game are stored
// Note when debugging: j represents x axis, since i/j are row/column
function drawBorder(ctx, state){
	for(var i=0; i<config.GRID.length-1; i++){
		for(var j=0; j<config.GRID[i].length-1; j++){
			// If the element to the right is not the same, draw a line to the right
			if(config.GRID[i][j] != config.GRID[i][j+1]){
				console.log("i =", i, "j =", j);
				drawLine(ctx, j*config.BOX_WIDTH, i*config.BOX_WIDTH, true)
			}
			// If the element below is not the same, draw a horizontal line below it
			if(config.GRID[i][j]!= config.GRID[i+1][j]){
				console.log("i =", i, "j =", j);
				drawLine(ctx, j*config.BOX_WIDTH, i*config.BOX_WIDTH, false)
			}
			// Store dots co-ordinates
			if(config.GRID[i][j] == 1){
				storeDotPosition(state, i, j)
			}
		}
	}
}

// Helper function to draw lines on canvas, used when drawing the borders
function drawLine(ctx, x, y, isVertical){
	ctx.strokeStyle = '#0033ff';
	ctx.beginPath();

	if(isVertical){
		ctx.moveTo(x + config.BOX_WIDTH, y);
		ctx.lineTo(x + config.BOX_WIDTH, y + config.BOX_HEIGHT);	
	}
	else{
		ctx.moveTo(x, y + config.BOX_HEIGHT);
		ctx.lineTo(x + config.BOX_WIDTH, y + config.BOX_HEIGHT);
	}

	ctx.stroke();
}

// Helper function to store the position of dots in the game
function storeDotPosition(state, i, j){
	dotX = (j*config.BOX_WIDTH) + config.BOX_WIDTH/2
	dotY = (i*config.BOX_WIDTH) + config.BOX_WIDTH/2
	if(!state.dots[dotX + " " + dotY]){
		// Don't store a dot at the starting position for player 1
		if (!(i == 1 && j == 1))
			state.dots[dotX + " " + dotY] = {'x': dotX, 'y': dotY, 'eaten': false}
	}
}

function drawDots(ctx, state){
	for(key in state.dots){
		if(!state.dots[key].eaten){
			ctx.fillStyle = '#FFFFFF';
			ctx.fillRect(state.dots[key].x, state.dots[key].y,5,5);	
		}		
	}
}

function drawPacman(ctx, state){
	ctx.beginPath();
	ctx.fillStyle = "#f2f000"
	ctx.strokeStyle="#000000"

	// Arc of pacman
	ctx.arc(state.X, state.Y, config.PACMAN.radius, config.PACMAN[state.direction].startAngle, config.PACMAN[state.direction].endAngle, false	)
	
	// Mouth
	ctx.lineTo(state.X + config.PACMAN[state.direction].dMouthX, state.Y+ config.PACMAN[state.direction].dMouthY)
	
	ctx.fill();
	ctx.stroke();
	
	// eyes
	ctx.beginPath();
	ctx.fillStyle = "#000000"
	ctx.arc(state.X + config.PACMAN[state.direction].dEyesX,	state.Y + config.PACMAN[state.direction].dEyesY, 2, 0, Math.PI*2, false)
	ctx.fill();
}

function eatDots(state, isVertical, diff){
	if(isVertical){
		dotY = state.Y + (diff * 4)
		key = state.dots[state.X + " " + dotY]
	}
	else{
		dotX = state.X + (diff * 4)
		key = state.dots[dotX + " " + state.Y]
	}
	
	if(key && !key.eaten){
		key.eaten = true
		state.points += 1
		pointValue = 1;
		Socket.scoredPoint(pointValue);
		if(state.points == Object.keys(state.dots).length)
			Socket.gameOver('Player1');
	}
}

// Runs collision detection to see if next move is allowed. Returns true if allowed
function moveAllowed(state, wallPosition, adjustPosition, direction){
	neighbors = getNeighbors(state, direction);

	// Stop if a wall is encountered
	if(!checkWall(neighbors, state[wallPosition], neighbors.diff))
		return false

	// Adjust player
	adjustPacman(neighbors, state, adjustPosition)
	return true
}

// Get the neighboring grids based on current position and direction
// Note down all diagonals in the direction, helps collision detection check later
function getNeighbors(state, direction){
	var xIndex = Math.floor(state.X/config.BOX_WIDTH);
	var yIndex = Math.floor(state.Y/config.BOX_WIDTH);
	neighbors = {}

	switch(direction){
		case 'right':
			neighbors.diff = 1
			neighbors.diagonal1 = config.GRID[yIndex + 1][xIndex + 1] // bottom right
			neighbors.diagonal1 = config.GRID[yIndex - 1][xIndex + 1] // top right
			break;
		case 'left':
			neighbors.diff = -1
			neighbors.diagonal1 = config.GRID[yIndex + 1][xIndex - 1] // bottom left
			neighbors.diagonal2 = config.GRID[yIndex - 1][xIndex - 1] // top left
			break;
		case 'down':
			neighbors.diff = 1
			neighbors.diagonal1 = config.GRID[yIndex + 1][xIndex - 1] // bottom left
			neighbors.diagonal2 = config.GRID[yIndex + 1][xIndex + 1] // bottom right
			break;
		case 'up':
			neighbors.diff = -1
			neighbors.diagonal1 = config.GRID[yIndex - 1][xIndex - 1] // top left
			neighbors.diagonal2 = config.GRID[yIndex - 1][xIndex + 1] // top right
			break;
	}

	if(direction == 'right' || direction == 'left')
		neighbors.nextBlock = config.GRID[yIndex][xIndex+neighbors.diff]	// Immediate next neighbor along x axis
	else
		neighbors.nextBlock = config.GRID[yIndex+neighbors.diff][xIndex]	// Immedate next neighbor along y axis

	neighbors.currentBlock = config.GRID[yIndex][xIndex]
	
	return neighbors
}

// Collision detection - use current position's neighbors
// Returns false when there is a wall and therefore we cannot continue
function checkWall(neighbors, position, diff){
	// When checking collision, scale the neighbor's diff by the player radius
	if((neighbors.currentBlock != neighbors.nextBlock) && ((position + (diff * config.PACMAN.radius)) % config.BOX_WIDTH == 0)){
		return false;
	}
	return true
}

function adjustPacman(neighbors, state, position){
	if((neighbors.currentBlock != neighbors.diagonal1 || neighbors.currentBlock != neighbors.diagonal2)){
		diff = state[position] % config.BOX_WIDTH
		if(diff < 20 || diff > 20)
			state[position] = (state[position] - (state[position] % config.BOX_WIDTH)) + 20
	}
}

function updateP2InP1Screen(data){
	player2State.X = data.X
	player2State.Y = data.Y
	
	// diff stored for f
	var diff = data.direction == 'right' || data.direction == 'down' ? 2 : -2
	if(data.direction == 'right' || data.direction == 'left'){
		player2State = updatePlayerDirection(player2State, data.keyCode, data.direction);	
	}
	else{
		player2State = updatePlayerDirection(player2State, data.keyCode, data.direction);
	}
	return player2State;
}
