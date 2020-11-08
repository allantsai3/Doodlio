// Module dependencies.
const createError = require('http-errors');
const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');
const logger = require('morgan');
const debug = require('debug')('demo:server');
const http = require('http');
const socketio = require('socket.io');
const helpers = require('./server/helpers');
const db = require('./server/database');

const app = express();

const con = db.connectDB();
con.query('SELECT * FROM Gallery', (err, result) => {
	if (err) {
		console.log('error fetching from database: database servers or proxy may not be on!');
	}
	console.log(result);
});

app.use(logger('dev'));
app.use(express.json());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.engine('html', require('ejs').renderFile);

app.set('view engine', 'html');

// Dynamic content: store on server
const rooms = {};
const intervalHandles = {};

// Define paths
app.get('/', (req, res) => {
	res.render('home.html');
});

// Post request instead of using sockets since we don't need constant updates
app.post('/', (req, res) => {
	const {
		body: { code = '' },
	} = req;

	// Room are 4 digits long
	if (code.length === 4) {
		console.log(`valid room code entered: ${code}`);
		if (code in rooms) {
			console.log('found an existing room');
			res.cookie('roomCode', code, { httpOnly: true, sameSite: true, maxAge: 1000 * 600 });
			res.render('gamescreen.html');
		} else {
			console.log('creating new room...');
			rooms[code] = helpers.createRoom();
			// Set cookie (expires after 10 minutes)
			res.cookie('roomCode', code, {
				httpOnly: true,
				sameSite: true,
				maxAge: 1000 * 600,
			});
			res.render('gamescreen.html');
		}
	} else {
		console.log('Invalid room code');
		res.render('home.html');
	}
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

	const bind = typeof port === 'string' ? `Pipe ${port}` : `Port ${port}`;

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
	const bind = typeof addr === 'string' ? `pipe ${addr}` : `port ${addr.port}`;
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
	socket.emit('serverMessage', 'Welcome to Doodl.io!');

	const { id, handshake: { headers: { cookie = '' } = {} } = {} } = socket;

	// Parse cookie for room code
	const code = helpers.getCookie(cookie, 'roomCode');

	console.log(`socket id: ${id}, joining room with code: ${code}`);
	socket.join(code);
	helpers.addPlayerToRoom(id, rooms, code);

	// Broadcast when a user connects, update player list
	io.to(code).emit('serverMessage', `${id} has joined the room`);
	io.to(code).emit('updatePlayer', rooms[code].players);

	// If room has 3+ people and not already started, start the game
	if (rooms[code].playerCount >= 3 && rooms[code].started === false) {
		rooms[code].started = true;
		intervalHandles[code] = helpers.startGame(5000, rooms, code, io);
	}

	// listen for chatMessage
	socket.on('chatMessage', (msg) => {
		// emit back to clients in same room, replace id with Nickname later
		io.to(code).emit('chatMessage', `${id}: ${msg}`);
	});

	socket.on('draw', (data) => {
		io.to(code).emit('draw', data);
		// // Check if the current user can draw
		// if ((id === rooms[code].currentlyDrawing && rooms[code].started)) {
		// 	io.to(code).emit('draw', data);
		// }
	});

	socket.on('disconnect', () => {
		console.log('user disconnected');
		io.to(code).emit('playerDisconnect', `${id} has left the room`);
		helpers.removePlayerFromRoom(id, rooms, code, intervalHandles, io);
	});
});
