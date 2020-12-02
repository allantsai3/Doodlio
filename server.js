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

const passport = require('passport');
const session = require('express-session');
const db = require('./server/database');
const helpers = require('./server/helpers');

const app = express();

const con = db.connectDB();
const wordBank = [];

// fetch words from database
con.query('SELECT Word FROM DefaultWordBank', (err, result) => {
	if (err) {
		console.log('error fetching from database: database servers or proxy may not be on!');
	} else {
		for (let i = 0; i < result.length; i += 1) {
			wordBank.push(result[i].Word);
		}
		console.log(wordBank.length); // should be 345 for now
	}
});

app.use(logger('dev'));
app.use(express.json());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.engine('html', require('ejs').renderFile);

app.set('view engine', 'ejs');
app.use(session({ secret: 'MySecret', resave: false, saveUninitialized: true }));

app.use(passport.initialize());
app.use(passport.session());

app.use('/auth', require('./routes/auth'));

// Move to database
const rooms = {};
const intervalHandles = {};

const turnTime = 5000;

// Define paths
app.get('/', (req, res) => {
	res.render('home', { user: req.user });
});

// Save drawing
app.post('/save', (req, res) => {
	con.query(`INSERT INTO Gallery (email, date, image)
	VALUES('${req.user.email}', NOW(), '${req.body.url}')`, (err, result) => {
		if (err) {
			console.log(err);
			res.status(500).send(err.sqlMessage);
		} else {
			const msg = `Query OK, ${result.affectedRows} affected`;
			res.status(200).send(msg);
		}
	});
});

// Show drawings on gallery
app.post('/show', (req, res) => {
	con.query(`SELECT date, image FROM Gallery WHERE email='${req.user.email}'
	AND date >= NOW() - INTERVAL 3 DAY`, (err, result) => {
		if (err) {
			console.log(err);
			res.status(500).send(err.sqlMessage);
		} else {
			const imgArr = [];
			for (let i = 0; i < result.length; i += 1) {
				const { date } = result[i];
				const img = result[i].image;
				imgArr.push({ date, url: img });
			}
			res.status(200).send(imgArr);
		}
	});
});

// Post request instead of using sockets since we don't need constant updates
app.post('/', (req, res) => {
	const {
		body: { code = '' },
	} = req;

	// store username in cookie
	res.cookie('user', req.user.username, { httpOnly: true, sameSite: true, maxAge: 1000 * 600 });

	// Room are 4 digits long
	if (code.length === 4) {
		console.log(`valid room code entered: ${code}`);
		if (code in rooms) {
			console.log('found an existing room');
			res.cookie('roomCode', code, { httpOnly: true, sameSite: true, maxAge: 1000 * 600 });
			res.render('gamescreen', { user: req.user });
		} else {
			console.log('creating new room...');
			rooms[code] = helpers.createRoom();
			// Set cookie (expires after 10 minutes)
			res.cookie('roomCode', code, {
				httpOnly: true,
				sameSite: true,
				maxAge: 1000 * 600,
			});
			res.render('gamescreen', { user: req.user });
		}
	} else {
		console.log('Invalid room code');
		res.render('home', { user: req.user });
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

	// Parse cookie for username
	const user = decodeURI(helpers.getCookie(cookie, 'user'));
	console.log(user);

	console.log(`socket id: ${id}, joining room with code: ${code}`);
	socket.join(code);
	helpers.addPlayerToRoom(id, rooms, code);

	// Broadcast when a user connects, update player list
	io.to(code).emit('serverMessage', `${id} has joined the room`);
	io.to(code).emit('updatePlayer', rooms[code].players);

	// If room has 3+ people and not already started, start the game
	if (rooms[code].playerCount >= 3 && rooms[code].started === false) {
		rooms[code].started = true;
		helpers.startGame(rooms, code, io, wordBank);
	}

	// listen for chatMessage
	socket.on('chatMessage', (msg) => {
		// emit back to clients in same room, replace id with Nickname later
		io.to(code).emit('chatMessage', `${id}: ${msg}`);
	});

	socket.on('draw', (data) => {
		// Check if the current user can draw
		if (data.forceDraw || (id === rooms[code].currentlyDrawing && rooms[code].started)) {
			io.to(code).emit('draw', data);
		}
	});

	socket.on('clear', () => {
		io.to(code).emit('clear');
	});

	socket.on('fill', (color) => {
		io.to(code).emit('fill', color);
	});

	// Once the drawer picks a word, start the turn
	socket.on('wordPicked', (word) => {
		rooms[code].currentWordToDraw = word;
		console.log(word);
		intervalHandles[code] = helpers.startTurn(turnTime, rooms, code, io, wordBank);
	});

	socket.on('disconnect', () => {
		console.log('user disconnected');
		io.to(code).emit('playerDisconnect', `${id} has left the room`);
		helpers.removePlayerFromRoom(id, rooms, code, intervalHandles, io);
	});
});
