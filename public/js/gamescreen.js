const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
const penCap = 'round';
let penThickness = 5;
let penColor = 'black';
const brushColors = document.querySelectorAll('.brush-colors');
const brushSizes = document.querySelectorAll('.brush-sizes-imgs');
const clear = document.getElementById('clear-canvas');
const eraser = document.getElementById('eraser');
const fill = document.getElementById('fill');
const brushIndicator = document.getElementById('brush-indicator');
const brush = document.getElementById('brush');
const chatAutoScroll = document.querySelector('.chat-messages');
const gameOptionsForm = document.getElementById('gameOptionsForm');
const roundTime = document.getElementById('roundTime');
const roundNumber = document.getElementById('numberOfRounds');
canvas.width = 540;
canvas.height = 540;

let timeInterval; // id for turn timer
let pickTimer; // id for timer for picking a word

let drawingBool = false;
let drawingDotBool = false;
let prevX = 0;
let prevY = 0;
let currX = 0;
let currY = 0;

let canDraw = false;

// eslint-disable-next-line no-undef
const socket = io();

$('#startGame').click((e) => {
	const roundTimeVal = roundTime.value;
	const roundNumberVal = roundNumber.value;
	if (gameOptionsForm.checkValidity() === true) {
		socket.emit('startGame', { roundTime: roundTimeVal, roundNumber: roundNumberVal });
		e.preventDefault();
		e.stopPropagation();
		$('#gameOptionsModal').modal('hide');
		// Disable game options button once game starts successfully
		$('#gameOptions').prop('disabled', true);
	}
});

$('#gameOptions').click(() => {
	$('#gameOptionsModal').modal('toggle');
});

// Drawing functions
function drawTemp(color, cap, thickness, data) {
	ctx.beginPath();
	ctx.strokeStyle = color;
	ctx.lineWidth = thickness;
	ctx.lineCap = cap;
	ctx.moveTo(data.prevX, data.prevY);
	ctx.lineTo(data.currX, data.currY);
	ctx.stroke();
	ctx.closePath();
}

function changeBrushColor(color, eraserBool) {
	if (canDraw) {
		penColor = color;
		if (!eraserBool) {
			brushIndicator.style.backgroundColor = color;
		}
	}
}

function changeBrushSize(thickness) {
	if (canDraw) {
		if (thickness === 'smallest') {
			penThickness = 5;
		} if (thickness === 'small') {
			penThickness = 15;
		} if (thickness === 'large') {
			penThickness = 25;
		} if (thickness === 'largest') {
			penThickness = 35;
		}
	}
}

function draw() {
	ctx.beginPath();
	ctx.strokeStyle = penColor;
	ctx.lineWidth = penThickness;
	ctx.lineCap = penCap;
	ctx.moveTo(prevX, prevY);
	ctx.lineTo(currX, currY);
	ctx.stroke();
	ctx.closePath();

	const data = {
		penColor,
		penThickness,
		penCap,
		prevX,
		prevY,
		currX,
		currY,
	};

	socket.emit('draw', data);
}

function GetPos(type, event) {
	if (canDraw) {
		if (type === 'down') {
			prevX = currX;
			prevY = currY;
			currX = event.pageX - canvas.offsetLeft;
			currY = event.pageY - canvas.offsetTop;

			drawingBool = true;
			drawingDotBool = true;

			if (drawingDotBool) {
				ctx.beginPath();
				ctx.strokeStyle = penColor;
				ctx.lineWidth = penThickness;
				ctx.lineCap = penCap;
				ctx.moveTo(currX, currY);
				ctx.lineTo(currX, currY);
				ctx.stroke();
				ctx.closePath();
				drawingDotBool = false;

				const data = {
					penColor,
					penThickness,
					penCap,
					prevX: currX,
					prevY: currY,
					currX,
					currY,
				};

				socket.emit('draw', data);
			}
		}
		if (type === 'up' || type === 'out') {
			drawingBool = false;
		}
		if (type === 'move') {
			if (drawingBool) {
				prevX = currX;
				prevY = currY;
				currX = event.pageX - canvas.offsetLeft;
				currY = event.pageY - canvas.offsetTop;
				draw();
			}
		}
	}
}

function clearBoard() {
	if (canDraw) {
		ctx.clearRect(0, 0, canvas.width, canvas.height);
		socket.emit('clear');
	}
}

function fillBoard() {
	if (canDraw) {
		ctx.fillStyle = brushIndicator.style.backgroundColor;
		ctx.fillRect(0, 0, canvas.width, canvas.height);
		socket.emit('fill', brushIndicator.style.backgroundColor);
	}
}

canvas.addEventListener('mousemove', (event) => {
	GetPos('move', event);
});
canvas.addEventListener('mousedown', (event) => {
	GetPos('down', event);
});
canvas.addEventListener('mouseup', (event) => {
	GetPos('up', event);
});
canvas.addEventListener('mouseout', (event) => {
	GetPos('out', event);
});
brushColors.forEach((el) => el.addEventListener('click', (event) => {
	changeBrushColor(event.target.id, false);
}));
brushSizes.forEach((el) => el.addEventListener('click', (event) => {
	changeBrushSize(event.target.id);
}));
clear.addEventListener('click', () => {
	clearBoard();
});
eraser.addEventListener('click', () => {
	changeBrushColor('#d8dee9', true);
});
fill.addEventListener('click', () => {
	fillBoard();
});
brush.addEventListener('click', () => {
	changeBrushColor(brushIndicator.style.backgroundColor, false);
});

socket.on('draw', (data) => {
	ctx.beginPath();
	ctx.strokeStyle = data.penColor;
	ctx.lineWidth = data.penThickness;
	ctx.lineCap = data.penCap;
	ctx.moveTo(data.prevX, data.prevY);
	ctx.lineTo(data.currX, data.currY);
	ctx.stroke();
	ctx.closePath();
});

socket.on('drawArr', (dataObj) => {
	Object.keys(dataObj).forEach((Colorkey) => {
		// Set background color
		if (Colorkey === 'fill') {
			ctx.fillStyle = dataObj[Colorkey];
			ctx.fillRect(0, 0, canvas.width, canvas.height);
		} else {
			Object.keys(dataObj[Colorkey]).forEach((Pencapkey) => {
				Object.keys(dataObj[Colorkey][Pencapkey]).forEach((PenThicknesskey) => {
					const {
						[Colorkey]: {
							[Pencapkey]: {
								[PenThicknesskey]: dataArr,
							},
						},
					} = dataObj;

					dataArr.forEach((data) => {
						drawTemp(Colorkey, Pencapkey, PenThicknesskey, data);
					});
				});
			});
		}
	});
});

socket.on('clear', () => {
	ctx.clearRect(0, 0, canvas.width, canvas.height);
});

socket.on('fill', (color) => {
	ctx.fillStyle = color;
	ctx.fillRect(0, 0, canvas.width, canvas.height);
});

socket.on('gamestate', (data) => {
	const {
		currentDrawingPlayer: {
			id,
			username,
		},
	} = data;
	canDraw = (socket.id === id);
	$('#currentDrawingPlayer').text(username);
});

socket.on('wordPrompt', (word) => {
	$('#word').text(word);
});

socket.on('stopDrawing', () => {
	canDraw = false;
});

socket.on('turntimer', (time) => {
	if (timeInterval != null) {
		window.clearInterval(timeInterval);
	}

	document.getElementById('gameTimer').innerHTML = time;
	timeInterval = window.setInterval(() => {
		let timeLeft = parseInt(document.getElementById('gameTimer').innerHTML, 10);
		timeLeft -= 1;
		document.getElementById('gameTimer').innerHTML = timeLeft;
		if (timeLeft <= 0) window.clearInterval(timeInterval);
	}, 1000);
});

// eslint-disable-next-line no-unused-vars
function pickWord(n) {
	if (pickTimer != null) {
		window.clearInterval(pickTimer);
	}
	const chosenWord = document.getElementById(`word${n}`).innerHTML;
	$('#wordModal').modal('hide');
	socket.emit('wordPicked', chosenWord);
}

socket.on('wordModal', (words) => {
	for (let i = 0; i < words.length; i += 1) {
		document.getElementById(`word${i}`).innerHTML = words[i];
	}
	document.getElementById('pickWordTimer').innerHTML = 10;
	$('#wordModal').modal({ backdrop: 'static', keyboard: false });
	pickTimer = window.setInterval(() => {
		let timeLeft = parseInt(document.getElementById('pickWordTimer').innerHTML, 10);
		timeLeft -= 1;
		document.getElementById('pickWordTimer').innerHTML = timeLeft;
		if (timeLeft <= 0) {
			pickWord(Math.floor(Math.random() * 3));
		}
	}, 1000);
});

// Chat functions
$('#chat-form').submit((e) => {
	if ($('#chat-input').val().trim() === '') {
		return false;
	}
	// Prevent page from reloading
	e.preventDefault();
	let playerScore = document.getElementById('gameTimer').innerHTML;
	if (playerScore == null) playerScore = 0;
	// Emit message to server
	socket.emit('messageTyped', { msg: $('#chat-input').val(), score: playerScore });
	// Reset input field
	$('#chat-form')[0].reset();
	return false;
});

// Update Chat DOM
socket.on('chatMessage', (msg) => {
	$('#messages').append($('<li>').text(msg));
	chatAutoScroll.scrollTop = chatAutoScroll.scrollHeight;
});

socket.on('guessedWord', (msg) => {
	$('#messages').append($('<li>').text(`${msg}`).css('color', 'green'));
	chatAutoScroll.scrollTop = chatAutoScroll.scrollHeight;
});

socket.on('updateScore', (score) => {
	document.getElementById('playerScore').innerHTML = score;
});

socket.on('serverMessage', (msg) => {
	$('#messages').append($('<li>').text(`${msg}`).css('color', 'grey'));
	chatAutoScroll.scrollTop = chatAutoScroll.scrollHeight;
});

socket.on('playerDisconnect', (msg) => {
	$('#messages').append($('<li>').text(`${msg}`).css('color', 'red'));
	chatAutoScroll.scrollTop = chatAutoScroll.scrollHeight;
});

// Update Player List DOM of individual room
socket.on('updatePlayer', (data) => {
	$('#playerList').text('');
	let i = 0;
	data.playerList.forEach((user) => {
		$('#playerList').append($('<li>').text(`${user}: ${data.playerScores[i]}`));
		i += 1;
	});
});
