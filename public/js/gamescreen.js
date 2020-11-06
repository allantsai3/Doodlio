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
	$('#currentDrawingPlayer').text(canDraw);
});

// Chat functions
$('form').submit((e) => {
	console.log('submitting form');
	// Prevent page from reloading
	e.preventDefault();
	socket.emit('chat message', $('#m').val());
	$('#m').val('');
	return false;
});
