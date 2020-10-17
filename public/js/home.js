// eslint-disable-next-line no-undef
const socket = io();
$('form').submit((e) => {
	console.log('submitting form');
	// Prevent page from reloading
	e.preventDefault();
	socket.emit('room code', $('#code').val());
	$('#code').val('');
	return false;
});
