// Parses the cookie to determine what room the user joined
function getCookie(cookies, name) {
	let roomCode;
	cookies.split('; ').some((cookie) => {
		const splitCookie = cookie.split('=');
		const [cookieName, val] = splitCookie;
		if (cookieName === name) {
			roomCode = val;
			return true;
		}
		return false;
	});
	return roomCode;
}

function logActivity(rooms, code) {
	const {
		[code]: {
			playerCount = 0,
		} = {},
	} = rooms;
	console.log('--------------------------------------------');
	console.log(`Changes happened to room id: ${code} count: ${playerCount}`);
	console.log(`Rooms: ${JSON.stringify(rooms)}`);
	console.log('--------------------------------------------');
}

function changeDrawingPlayer(rooms, code, io) {
	const {
		[code]: {
			playerCount,
			currentlyDrawingIndex,
		} = {},
	} = rooms;

	const room = rooms[code];

	room.currentlyDrawingIndex += 1;
	if (currentlyDrawingIndex >= playerCount - 1) {
		room.currentlyDrawingIndex = 0;
	}

	room.currentlyDrawing = room.players[room.currentlyDrawingIndex];
	io.to(code).emit('gamestate', { currentDrawingPlayer: room.currentlyDrawing });
}

function startGame(time, rooms, code, io) {
	// Start count down for player
	// Execute player change immediately
	changeDrawingPlayer(rooms, code, io);
	return setInterval(() => {
		changeDrawingPlayer(rooms, code, io);
	}, time);
}

function createRoom() {
	const room = {
		started: false,
		players: [],
		playerCount: 0,
		currentlyDrawing: '',
		currentlyDrawingIndex: -1,
	};
	return room;
}

function addPlayerToRoom(id, rooms, code) {
	if (typeof rooms[code] === 'undefined') {
		// Can't find room (most likely due to server restart)
		// eslint-disable-next-line no-param-reassign
		rooms[code] = createRoom(rooms, code);
	}

	const room = rooms[code];

	room.playerCount += 1;
	room.players.push(id);
	logActivity(rooms, code);
}

function removePlayerFromRoom(id, rooms, code, intervalHandles, io) {
	const room = rooms[code];
	// Delete room if no players are left
	if (rooms[code].playerCount <= 1) {
		// eslint-disable-next-line no-param-reassign
		delete rooms[code];
		// delete timer handler and removing from tracking array
		clearInterval(intervalHandles[code]);
		// eslint-disable-next-line no-param-reassign
		delete intervalHandles[code];
	} else {
		room.playerCount -= 1;
		const index = rooms[code].players.indexOf(id);
		rooms[code].players.splice(index, 1);
		io.to(code).emit('updatePlayer', rooms[code].players);
	}
	logActivity(rooms, code);
}

module.exports = {
	getCookie,
	startGame,
	createRoom,
	addPlayerToRoom,
	removePlayerFromRoom,
	logActivity,
};
