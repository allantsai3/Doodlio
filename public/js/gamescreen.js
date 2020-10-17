function getMousePosition(canvas, event) {
	const rect = canvas.getBoundingClientRect();
	const x = event.clientX - rect.left;
	const y = event.clientY - rect.top;
	console.log(`Coordinate x: ${x}`,
		`Coordinate y: ${y}`);
	// eslint-disable-next-line no-use-before-define
	socket.emit('draw position', { xpos: x, ypos: y });
}

const canvasElem = document.getElementById('canvas');

canvasElem.addEventListener('mousedown', (e) => {
	getMousePosition(canvasElem, e);
});

// eslint-disable-next-line no-undef
const socket = io();
$('form').submit((e) => {
	console.log('submitting form');
	// Prevent page from reloading
	e.preventDefault();
	socket.emit('chat message', $('#m').val());
	$('#m').val('');
	return false;
});
