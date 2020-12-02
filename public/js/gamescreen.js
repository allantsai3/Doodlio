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

const inkBar = document.getElementById('ink-bar');
const totalInk = 3000;
let currentInk = 0;

let timeInterval; // id for turn timer
let pickTimer; // id for timer for picking a word

let drawingBool = false;
let drawingDotBool = false;
let prevX = 0;
let prevY = 0;
let currX = 0;
let currY = 0;

let canDraw = false;
let hasInk = true;
// Temporary feature for development
let forceDraw = false;

// eslint-disable-next-line no-undef
const socket = io();

$('#forceDrawing').click(() => {
	forceDraw = !forceDraw;
	console.log(`canDraw: ${forceDraw}`);
});

// Drawing functions
function changeBrushColor(color, eraserBool) {
	if (canDraw || forceDraw) {
		penColor = color;
		if (!eraserBool) {
			brushIndicator.style.backgroundColor = color;
		}
	}
}

function changeBrushSize(thickness) {
	if (canDraw || forceDraw) {
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

function updateInkProgress() {
	let percentage = 100 - Math.round((currentInk / totalInk) * 100);

	if (percentage <= 0) {
		percentage = 0;
		hasInk = false;
	}

	// inkBar.innerHTML = `${percentage}%`;
	// inkBar.style.width = `${percentage}%`;
	// inkBar.ariaValuenow = percentage;
	socket.emit('updateInk', percentage);
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
		forceDraw,
	};

	socket.emit('draw', data);
}

function GetPos(type, event) {
	if (canDraw || forceDraw) {
		if (hasInk === false) {
			return;
		}

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
				currentInk = currentInk + Math.abs(currX - prevX) + Math.abs(currY - prevY);
				draw();
				updateInkProgress();
			}
		}
	}
}

function clearBoard() {
	if (canDraw || forceDraw) {
		ctx.clearRect(0, 0, canvas.width, canvas.height);
		socket.emit('clear');
	}
}

function fillBoard() {
	if (canDraw || forceDraw) {
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
	changeBrushColor('white', true);
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

socket.on('clear', () => {
	ctx.clearRect(0, 0, canvas.width, canvas.height);
});

socket.on('fill', (color) => {
	ctx.fillStyle = color;
	ctx.fillRect(0, 0, canvas.width, canvas.height);
});

socket.on('updateInk', (percentage) => {
	inkBar.innerHTML = `${percentage}%`;
	inkBar.style.width = `${percentage}%`;
	inkBar.ariaValuenow = percentage;
});

socket.on('gamestate', (data) => {
	canDraw = (socket.id === data.currentDrawingPlayer);
	$('#currentDrawingPlayer').text(data.currentDrawingPlayer);
});

socket.on('wordPrompt', (word) => {
	$('#word').text(word);
});

socket.on('turntimer', (time) => {
	if (timeInterval != null) {
		window.clearInterval(timeInterval);
		socket.emit('clear');
		socket.emit('updateInk', 100);
		currentInk = 0;
		hasInk = true;
	}
	document.getElementById('gameTimer').innerHTML = time;
	timeInterval = window.setInterval(() => {
		let timeLeft = parseInt(document.getElementById('gameTimer').innerHTML, 10);
		// console.log(timeLeft);
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
	console.log(chosenWord);
}

socket.on('wordModal', (words) => {
	for (let i = 0; i < words.length; i += 1) {
		document.getElementById(`word${i}`).innerHTML = words[i];
	}
	document.getElementById('pickWordTimer').innerHTML = 10;
	$('#wordModal').modal({ backdrop: 'static', keyboard: false });
	pickTimer = window.setInterval(() => {
		let timeLeft = parseInt(document.getElementById('pickWordTimer').innerHTML, 10);
		// console.log(timeLeft);
		timeLeft -= 1;
		document.getElementById('pickWordTimer').innerHTML = timeLeft;
		if (timeLeft <= 0) {
			pickWord(Math.floor(Math.random() * 3));
		}
	}, 1000);
});

// Chat functions
$('#chat-form').submit((e) => {
	console.log('submitting form');
	if ($('#chat-input').val().trim() === '') {
		return false;
	}
	// Prevent page from reloading
	e.preventDefault();
	// Emit message to server
	socket.emit('chatMessage', $('#chat-input').val());
	// Reset input field
	$('#chat-form')[0].reset();
	return false;
});

// Update Chat DOM
socket.on('chatMessage', (msg) => {
	$('#messages').append($('<li>').text(msg));
});

socket.on('serverMessage', (msg) => {
	$('#messages').append($('<li>').text(`${msg}`).css('color', 'grey'));
});

socket.on('playerDisconnect', (msg) => {
	$('#messages').append($('<li>').text(`${msg}`).css('color', 'red'));
});

// Update Player List DOM of individual room
socket.on('updatePlayer', (playerList) => {
	$('#playerList').text('');
	playerList.forEach((user) => {
		// $('#playerList').append($('<li>').attr('class', 'list-group-item').text(`${user}`));
		$('#playerList').append($('<li>').text(`${user}`));
	});
});
