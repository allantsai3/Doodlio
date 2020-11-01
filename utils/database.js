// Database constants
const projectId = 'cmpt470project-294201';
const instanceId = 'database';
const databaseId = 'doodlio';

// Imports the Google Cloud client library
const { Spanner } = require('@google-cloud/spanner');

// Creates a client
const spanner = new Spanner({ projectId });

// Gets a reference to a Cloud Spanner instance and database
const instance = spanner.instance(instanceId);
const database = instance.database(databaseId);

const queries = {
	getLobbies: { sql: 'SELECT * FROM Lobby' },
};

async function executeSQL(query) {
	let rows = [];
	try {
		// Execute a simple SQL statement
		console.log('executing SQL');
		[rows] = await database.run(queries[query]);
		console.log(`Query: ${rows.length} found.`);
		rows.forEach((row) => console.log(row));
	} catch (err) {
		console.log(err);
	}
	return rows;
}

module.exports = {
	executeSQL,
};
