const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
const penThickness = 10; // default 20, changes when player clicks on another brush thickness
const penCap = 'round'; // makes the line circular
const penColor = 'black'; // default black, changes when player clicks on another brush color
const rect = canvas.getBoundingClientRect();

let drawing = false; // default false, changes when player is drawing?
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
function startPosition() { // user is currently drawing
	drawing = true;
}

function finishedPosition() { // user is finished drawing
	drawing = false;
	ctx.beginPath();
	socket.emit('finished', { forceDraw });
}

function draw(event) {
	if (drawing === false) return; // if player is not holding down the mouse

	if (canDraw || forceDraw) {
		ctx.lineWidth = penThickness;
		ctx.lineCap = penCap;
		ctx.strokeStyle = penColor;
		const x = event.pageX - rect.left;
		const y = event.pageY - rect.top;

		const data = {
			penThickness,
			penCap,
			penColor,
			x,
			y,
			forceDraw,
		};

		socket.emit('draw', data);

		ctx.lineTo(x, y);
		ctx.stroke();
		ctx.beginPath();
		ctx.moveTo(x, y);
	}
}

canvas.addEventListener('mousedown', startPosition); // on mouse down, drawing = true
canvas.addEventListener('mouseup', finishedPosition); // on mouse up, drawing = false
canvas.addEventListener('mousemove', draw);

socket.on('finished', () => {
	ctx.beginPath();
});

socket.on('draw', (data) => {
	ctx.lineWidth = data.penThickness;
	ctx.lineCap = data.penCap;
	ctx.strokeStyle = data.penColor;

	ctx.lineTo(data.x, data.y);
	ctx.stroke();
	ctx.beginPath();
	ctx.moveTo(data.x, data.y);
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
