const penThickness = 20;
const canvasElem = document.getElementById('canvas');
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
function getMousePosition(canvas, event) {
	const rect = canvas.getBoundingClientRect();
	const x = event.clientX - rect.left;
	const y = event.clientY - rect.top;
	const ctx = canvas.getContext('2d');
	if (canDraw || forceDraw) {
		ctx.fillRect(x, y, penThickness, penThickness);
		socket.emit('draw', { xpos: x, ypos: y, forceDraw });
	}
}

canvasElem.addEventListener('mousedown', (e) => {
	getMousePosition(canvasElem, e);
});

socket.on('draw', (data) => {
	const ctx = canvasElem.getContext('2d');
	ctx.fillRect(data.x, data.y, penThickness, penThickness);
});

socket.on('gamestate', (data) => {
	canDraw = (socket.id === data.currentDrawingPlayer);
	$('#currentDrawingPlayer').text(data.currentDrawingPlayer);
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
