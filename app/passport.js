// Take care of authorization - app/passport.js

var GoogleStrategy = require('passport-google-oauth').OAuth2Strategy,
	datejs = require('../node_modules/datejs/date.js'),
	uuid = require('node-uuid');

// load user model
var flash = require('connect-flash'),
	User = require('../models/user.js'),
	configAuth = require('./auth.js');

// var getSunday = function(currentDate) {
// 	var date = Date(currentDate),
// 		currentDay = date.getDay(),
// 		diff = date.getDate() - currentDay;
// 		return new Date(date.setDate(diff));
// }

module.exports = function(passport) {

	// Serialize user
	passport.serializeUser(function(user, done) {
		done(null, user.id);
	});

	// Deserialize user
	passport.deserializeUser(function(id, done) {
		User.findById(id, function(err, user) {
			done(err, user);
		});
	});

	passport.use(new GoogleStrategy({
		clientID: configAuth.googleAuth.clientID,
		clientSecret: configAuth.googleAuth.clientSecret,
		callbackURL: configAuth.googleAuth.callbackURL,
		scope: ['profile', 'email', 'https://www.googleapis.com/auth/calendar']
	},
	function(token, refreshToken, profile, done) {
		process.nextTick(function() {
			User.findOne({ 'google.id': profile.id }, function(err, user) {
				if (err) {
					return done(err);
				}

				if (user) {
					return done(null, user);
				} else {
					var newUser = new User();
					// save information from the profile to the database
					newUser.google.id = profile.id;
					newUser.google.token = token;
					newUser.google.refreshToken = refreshToken;
					newUser.google.name = profile.displayName;
					newUser.google.email = profile.emails[0].value;
					newUser.google.uuid = uuid.v1();
					newUser.google.events = [];

					// save the new user to database
					newUser.save(function(err) {
						if (err) {
							throw err;
						}
						return done(null, newUser);
					});
				}
			});
		});
	}));
}