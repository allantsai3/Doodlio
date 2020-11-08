const express = require('express');

const router = express.Router();
const passport = require('../config/passport.js');
const db = require('../server/database');

router.get('/logout', (req, res) => {
	req.logout();
	res.redirect('/');
});

function authSuccess(req, res) {
	res.redirect('/');
}

router.get('/google',
	passport.authenticate('google', { scope: ['profile', 'email'] }));

router.get('/google/callback',
	passport.authenticate('google'), authSuccess);

router.post('/', (req, res) => {
	req.user.username = req.body.uname;

	const con = db.connectDB();
	con.query(`UPDATE User SET username='${req.user.username}' WHERE email='${req.user.email}'`, (err, result) => {
		if (err) {
			console.log(err);
		} else {
			res.status(result);
			res.redirect('/');
		}
	});
});

module.exports = router;
