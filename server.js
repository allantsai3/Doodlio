// Module dependencies.
const createError = require('http-errors');
const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const logger = require('morgan');
const debug = require('debug')('demo:server');
const http = require('http');
const socketio = require('socket.io');

const app = express();

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.engine('html', require('ejs').renderFile);

app.set('view engine', 'html');

// Define paths
app.get('/', (req, res) => {
	res.render('home.html');
});

app.get('/:page', (req, res) => {
	res.render(`${req.params.page}.html`);
});

// catch 404 and forward to error handler
app.use((req, res, next) => {
	next(createError(404));
});

// error handler
app.use((err, req, res) => {
	// set locals, only providing error in development
	res.locals.message = err.message;
	res.locals.error = req.app.get('env') === 'development' ? err : {};

	// render the error page
	res.status(err.status || 500);

	console.log('rendering error page');
	res.render('error.html');
});

// Normalize a port into a number, string, or false.
function normalizePort(val) {
	const port = parseInt(val, 10);

	// eslint-disable-next-line no-restricted-globals
	if (isNaN(port)) {
		// named pipe
		return val;
	}

	if (port >= 0) {
	// port number
		return port;
	}

	return false;
}

// Get port from environment and store in Express.
const port = normalizePort(process.env.PORT || '3000');
app.set('port', port);

// Create HTTP server.
const server = http.createServer(app);

// Event listener for HTTP server "error" event.
function onError(error) {
	if (error.syscall !== 'listen') {
		throw error;
	}

	const bind = typeof port === 'string'
		? `Pipe ${port}`
		: `Port ${port}`;

	// handle specific listen errors with friendly messages
	switch (error.code) {
	case 'EACCES':
		console.error(`${bind} requires elevated privileges`);
		process.exit(1);
		break;
	case 'EADDRINUSE':
		console.error(`${bind} is already in use`);
		process.exit(1);
		break;
	default:
		throw error;
	}
}

// Event listener for HTTP server "listening" event.
function onListening() {
	const addr = server.address();
	const bind = typeof addr === 'string'
		? `pipe ${addr}`
		: `port ${addr.port}`;
	debug(`Listening on ${bind}`);
}

// Listen on provided port, on all network interfaces.
server.listen(port, () => {
	console.log(`listening on *:${port}`);
});
server.on('error', onError);
server.on('listening', onListening);

// Create socket.io instance
const io = socketio(server);

// Listen on connection event for incoming sockets
io.on('connection', (socket) => {
	console.log('a user connected');
	socket.on('chat message', (msg) => {
		console.log(`message: ${msg}`);
	});

	socket.on('draw position', (pos) => {
		console.log(`draw position: x: ${pos.xpos} y: ${pos.ypos}`);
	});

	socket.on('room code', (code) => {
		if (code.length === 4) {
			console.log(`valid room code entered: ${code}`);
		}
	});

	socket.on('disconnect', () => {
		console.log('user disconnected');
	});
});
