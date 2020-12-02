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
	console.log(`Rooms: ${Object.keys(rooms).length}`);
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

	if (room.currentlyDrawing.id !== '') {
		io.to(room.currentlyDrawing.id).emit('save');
	}

	room.currentDrawingState = {};
	room.currentlyDrawing = room.players[room.currentlyDrawingIndex];
	io.to(code).emit('gamestate', { currentDrawingPlayer: room.currentlyDrawing });
}

function generateRandomWords(wordBank) {
	// randomly generate 3 words
	const words = [];
	if (wordBank.length === 0) {
		words[0] = 'none';
		words[1] = 'none';
		words[2] = 'none';
	} else {
		while (words.length < 3) {
			const r = Math.floor(Math.random() * wordBank.length);
			if (words.indexOf(wordBank[r]) === -1) words.push(wordBank[r]);
		}
	}
	return words;
}

function startTurn(time, rooms, code, io, wordBank) {
	for (let i = 0; i < rooms[code].players.length; i += 1) {
		if (rooms[code].players[i] === rooms[code].currentlyDrawing) {
			io.to(rooms[code].players[i].id).emit('wordPrompt', `You are drawing: ${rooms[code].currentWordToDraw}`);
		} else {
			io.to(rooms[code].players[i].id).emit('wordPrompt', `Guess what's being drawn: ${rooms[code].currentWordToDraw.replace(/[a-z]/gi, '\xa0_').replace(/ /g, '\xa0\xa0').replace(/-/g, '\xa0-')}`);
		}
	}
	io.to(code).emit('turntimer', time / 1000);

	// Waits for turn to end before initializing the next turn
	return setTimeout(() => {
		io.to(code).emit('wordPrompt', `The word was: ${rooms[code].currentWordToDraw}`);
		changeDrawingPlayer(rooms, code, io);
		io.to(rooms[code].currentlyDrawing.id).emit('wordModal', generateRandomWords(wordBank));
	}, time);
}

function startGame(rooms, code, io, wordBank) {
	// Execute player change immediately
	changeDrawingPlayer(rooms, code, io);
	// Wait for drawer to pick one of three words
	io.to(rooms[code].currentlyDrawing.id).emit('wordModal', generateRandomWords(wordBank));
}

function createRoom() {
	const room = {
		started: false,
		players: [],
		playerCount: 0,
		currentlyDrawing: '',
		currentlyDrawingIndex: -1,
		currentWordToDraw: '',
		currentDrawingState: {},
		turnTimer: 60,
	};
	return room;
}

function addPlayerToRoom(id, user, rooms, code) {
	if (typeof rooms[code] === 'undefined') {
		// Can't find room (most likely due to server restart)
		// eslint-disable-next-line no-param-reassign
		rooms[code] = createRoom(rooms, code);
	}

	const room = rooms[code];

	room.playerCount += 1;
	room.players.push({ id, username: user });
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
		const index = rooms[code].players.map((player) => player.id).indexOf(id);
		rooms[code].players.splice(index, 1);
		io.to(code).emit('updatePlayer', rooms[code].players.map((player) => player.username));
	}
	logActivity(rooms, code);
}

function storeData(data, rooms, code) {
	// Creates a data structure in the form of
	// rooms[code] = {
	// 		currentDrawingState: {
	//			penColor: {
	// 				penCap: {
	//					penThickness: [
	// 						{ prev: {X, Y}, curr: {X, Y}}
	// 					]
	//				},
	// 			},
	// 		},
	// }
	const {
		penColor,
		penCap,
		penThickness,
		prevX,
		prevY,
		currX,
		currY,
	} = data;

	// Initialize the array if it doesn't exist
	if (!Object.prototype.hasOwnProperty.call(rooms[code].currentDrawingState, penColor)) {
		// eslint-disable-next-line no-param-reassign
		rooms[code].currentDrawingState[penColor] = {
			[penCap]: {
				[penThickness]: [],
			},
		};
	} else if (!Object.prototype.hasOwnProperty.call(
		rooms[code].currentDrawingState[penColor], penCap,
	)) {
		// eslint-disable-next-line no-param-reassign
		rooms[code].currentDrawingState[penColor][penCap] = {
			[penThickness]: [],
		};
	} else if (!Object.prototype.hasOwnProperty.call(
		rooms[code].currentDrawingState[penColor][penCap], penThickness,
	)) {
		// eslint-disable-next-line no-param-reassign
		rooms[code].currentDrawingState[penColor][penCap][penThickness] = [];
	}

	rooms[code].currentDrawingState[penColor][penCap][penThickness]
		.push({
			prevX, prevY, currX, currY,
		});
}

module.exports = {
	getCookie,
	startTurn,
	startGame,
	createRoom,
	addPlayerToRoom,
	removePlayerFromRoom,
	logActivity,
	storeData,
};
