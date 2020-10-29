const penThickness = 20;
const canvasElem = document.getElementById('canvas');

// eslint-disable-next-line no-undef
const socket = io();

// Drawing functions
function getMousePosition(canvas, event) {
	const rect = canvas.getBoundingClientRect();
	const x = event.clientX - rect.left;
	const y = event.clientY - rect.top;
	const ctx = canvas.getContext('2d');
	ctx.fillRect(x, y, penThickness, penThickness);
	// eslint-disable-next-line no-use-before-define
	socket.emit('draw', { xpos: x, ypos: y });
}

canvasElem.addEventListener('mousedown', (e) => {
	getMousePosition(canvasElem, e);
});

socket.on('draw', (data) => {
	const ctx = canvasElem.getContext('2d');
	ctx.fillRect(data.x, data.y, penThickness, penThickness);
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
