const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
const penThickness = 5; // default 20, changes when player clicks on another brush thickness
const penCap = 'round'; // makes the line circular
const penColor = 'black'; // default black, changes when player clicks on another brush color

let drawingBool = false;
let drawingDotBool = false;
let prevX = 0;
let prevY = 0;
let currX = 0;
let currY = 0;

let canDraw = false;
// Temporary feature for development
let forceDraw = false;

// eslint-disable-next-line no-undef
const socket = io();

$('#forceDrawing').click(() => {
	forceDraw = !forceDraw;
	console.log(`canDraw: ${forceDraw}`);
});

// Drawing functions
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
		if (type === 'down') {
			prevX = currX;
			prevY = currY;
			currX = event.clientX - canvas.offsetLeft;
			currY = event.clientY - canvas.offsetTop;

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
				currX = event.clientX - canvas.offsetLeft;
				currY = event.clientY - canvas.offsetTop;
				draw();
			}
		}
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

socket.on('gamestate', (data) => {
	canDraw = (socket.id === data.currentDrawingPlayer);
	$('#currentDrawingPlayer').text(data.currentDrawingPlayer);
});

socket.on('wordPrompt', (word) => {
	$('#word').text(word);
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
