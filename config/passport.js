const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth2').Strategy;
const keys = require('./keys');
const db = require('../server/database');

passport.serializeUser((user, done) => {
	done(null, user);
});
passport.deserializeUser((user, done) => {
	done(null, user);
});

// Google strategy, maybe create local strategy later for guest users.
passport.use(new GoogleStrategy(
	{
		clientID: keys.google.clientID,
		clientSecret: keys.google.secret,
		callbackURL: '/auth/google/callback',
		passReqToCallback: true,
	}, ((request, accessToken, refreshToken, profile, done) => {
		const con = db.connectDB();

		con.query(`SELECT * FROM User WHERE email='${profile.email}'`, (err1, result) => {
			if (err1) {
				console.log(err1);
			}
			if (result.length === 0) {
				con.query(`INSERT INTO User (username, email) VALUES ('${profile.displayName}', '${profile.email}')`, (err2) => {
					if (err2) {
						console.log(err2);
					}
					const newUser = { username: profile.displayName, email: profile.email };
					done(null, newUser);
				});
			} else {
				const user = { username: result[0].username, email: result[0].email };
				done(null, user);
			}
		});
	}),
));

module.exports = passport;