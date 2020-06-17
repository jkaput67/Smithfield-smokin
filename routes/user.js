/*-----------------------------
This is a partial rewrite of the authra module. This will hopefully make the process
more streamlined, flexible, and more importantly - readable. The main issue with
the existing module is how opaque it is - it provides both routes and functionality.
It should also make it easier to customize, and overall less fragile.

This uses one route to handle multiple intents, and a single view to handle various
actions.

This route will offer both traditional postings, as well as allow ajax posts.

This keeps the main routes visible instead of registering hidden routes in
node_module middleware.

This will also allow typeahead and autocomplete to work properly in the IDE. This
will promote better discoverability.

The google social auth is fully documented, the other auths follow the same patterns.

-------------------------------*/

//inits
var config = require("../config");
var express = require("express");
var router = express.Router();
var knex = require("knex").knex;
knex.knex = knex(config.connection);
var request = require("request");
var moment = require("moment");
var uuid = require("uuid");
var Mailgun = require("mailgun-js");
var fs = require("fs");
var path = require("path");
var session = require("express-session");
var passport = require("passport");
var FacebookStrategy = require("passport-facebook").Strategy;
var GoogleStrategy = require("passport-google-oauth20").Strategy;
var TwitterStrategy = require("passport-twitter").Strategy;
var LocalStrategy = require("passport-local").Strategy;
var user = require("../lib/user.2.0.0");
var token = require("../lib/token");
var email = require("../lib/email");
var jwt = require("jsonwebtoken");
var cookieParser = require("cookie-parser");
var chalk = require("chalk");
var isLocalHost = require("../middleware/isLocalHost");
var crypto = require("crypto")

var oauthSecret = config.oauthsecret;
let controller = {
	current: "user",
	title: config.seo.title,
	desc: config.seo.desc,
	og_title: config.seo.og_title,
	og_img: config.seo.og_image,
	nav: config.nav,
	footernav:config.footernav,
	meta:[],
};

router.use(isLocalHost(controller));

router.post("/callback", function(req,res,next){
	//for testing
	res.json(req.body).end()
})


/*--passport setup-----------*/
//social registration
//facebook
passport.use(
	new FacebookStrategy(
		{
			clientID: config.facebook.app_id,
			clientSecret: config.facebook.secret,
			callbackURL:
				config.facebook.callback_url_domain + "/user/oauth/facebook/callback",
			profileFields: ["id", "displayName", "name", "email"]
		},
		function(accessToken, refreshToken, profile, cb) {
			//select or create user and create access token for them
			//console.log('facebook passport callback');
			return cb(null, profile);
		}
	)
);

//google
passport.use(
	new GoogleStrategy(
		{
			clientID: config.google.client_id,
			clientSecret: config.google.secret,
			callbackURL:
				config.google.callback_url_domain + "/user/oauth/google/callback",
			profileFields: ["id", "displayName", "emails"]
		},
		function(accessToken, refreshToken, profile, cb) {
			//console.log('google passport callback');
			//console.log(profile);
			//When cb function is invoked, it informs passport to move on to the next stage of authentication
			// first argument for errors, and second argument is for what you want to pass into the passport auth
			return cb(null, profile);
		}
	)
);

//twitter
passport.use(
	new TwitterStrategy(
		{
			consumerKey: config.twitter.consumer_key,
			consumerSecret: config.twitter.secret,
			callbackURL:
				config.twitter.callback_url_domain + "/user/oauth/twitter/callback",
			includeEmail: true
		},
		function(token, tokenSecret, profile, cb) {
			//console.log('twitter passport callback');
			//When cb function is invoked, it informs passport to move on to the next stage of authentication
			// first argument for errors, and second argument is for what you want to pass into the passport auth
			return cb(null, profile);
		}
	)
);

//the first argument of serializeUser is the information passed into the cb function when the strategy was instantiated
//second argument when invoked notifies passport that we can proceed to the next phase of authentication
// the first argument of the cb function is for errors, and the second argument is what you want to be attached to the cookie/session
passport.serializeUser(function(user, cb) {
	cb(null, user);
});

//the first argument of serializeUser is the information passed into the cb function when the strategy was instantiated
//second argument when invoked notifies passport that we can proceed to the next phase of authentication
// the first argument of the cb function is for errors, and the second argument is what you want to be extracted from the cookie/session
passport.deserializeUser(function(obj, cb) {
	cb(null, obj);
});

/*------- oauth routes ------*/
//google oauth request
router.get("/oauth/google/", function(req, res) {
	//get next url from the view or set it to blank
	//the callback will get this as req.query.state, and can then route to the next url
	var nexturl = nexturl ? "" : req.query.nexturl;
	req.session.user_id = ""; //clear any user ids in the session
	req.session.keyid = uuid.v1();
	stateObj = {
		key: req.session.keyid,
		nexturl: nexturl
	};

	//make a jwt token from our stateobj and the secret
	var state = jwt.sign(stateObj, oauthSecret);

	passport.authenticate("google", {
		scope: [
			"https://www.googleapis.com/auth/userinfo.email",
			"https://www.googleapis.com/auth/plus.login",
			"https://www.googleapis.com/auth/userinfo.profile"
		],
		state: state
	})(req, res);
});

//google oauth callback route
router.get(	"/oauth/google/callback",
	passport.authenticate("google", { failureRedirect: "/user" }),
	function(req, res, next) {
		/*
    This is the return path from the oauth. It should have a req.query.state,
    which is a jwt
    */
		var decoded = jwt.verify(req.query.state, oauthSecret);
		if (decoded.key != req.session.keyid) {
			//console.log("bad key");
			res
				.status("401")
				.send("Error")
				.end();
			return;
		}
		//console.log("email" + req.user.emails[0].value);
		user
			.checkUser(req.user.emails[0].value)
			.then(user_id => {
				if(user_id == "new user"){
					res.locals.loggedin = false
					res.redirect("/user/sociallogin");
				}
				else {
					res.locals.user = req.user
					res.locals.loggedin = true
					if (decoded.nexturl) {
						//this is the redirect from the state
						res.redirect(decoded.nexturl);
					} else {
						//default redirect
						res.redirect("/");
					}
				}
			})
			.catch(function(err) {
				console.log(err);
			});
	}
);

router.get("/oauth/facebook", function(req, res, next) {
	var nexturl = nexturl ? "" : req.query.nexturl;
	req.session.user_id = ""; //clear any user ids in the session
	req.session.keyid = uuid.v1();
	stateObj = {
		key: req.session.keyid,
		nexturl: nexturl
	};
	var state = jwt.sign(stateObj, oauthSecret);

	//makes a request to facebook with the state object appended to the query params
	passport.authenticate("facebook", {
		state: state
	})(req, res);
});

router.get("/oauth/facebook/callback",
	passport.authenticate("facebook", { failureRedirect: "/user" }),
	function(req, res, next) {
		/*
		This is the return path from the oauth. It should have a req.query.state,
		which is a jwt
		*/
		var decoded = jwt.verify(req.query.state, oauthSecret);
		if (decoded.key != req.session.keyid) {
			//console.log("bad key");
			res
				.status("401")
				.send("Error")
				.end();
			return;
		}
		//console.log("Facebook callback: \nemail " + req.user.emails[0].value);
		user
		.checkUser(req.user.emails[0].value)
		.then(user_id => {
			//console.log("Facebook login:\nuser id: " + user_id)
			if(user_id == "new user"){
				req.session.loggedin = false;
				res.redirect("/user/sociallogin");
			}
			else {
				req.session.loggedin = true;
				res.locals.user = req.user
				if (decoded.nexturl) {
					//this is the redirect from the state
					res.redirect(decoded.nexturl);
				} else {
					//default redirect
					res.redirect("/");
				}
			}
		})
		.catch(function(err) {
			console.log(err);
		});
	}
);

router.get("/oauth/twitter", function(req, res, next) {
	var nexturl = nexturl ? "" : req.query.nexturl;
	req.session.user_id = ""; //clear any user ids in the session
	req.session.keyid = uuid.v1();
	stateObj = {
		key: req.session.keyid,
		nexturl: nexturl
	};
	//make a jwt token from our stateobj and the secret
	var state = jwt.sign(stateObj, oauthSecret);
	passport.authenticate("twitter", {
		state: state
	})(req, res, next);
});

router.get("/oauth/twitter/callback",
	passport.authenticate("twitter", { failureRedirect: "/user" }),
	function(req, res, next) {
		/*
		Twitter
		*/
		//console.log("Twitter Signin: \n  email " + req.user.emails[0].value);
		user
			.checkUser(req.user.emails[0].value)
			.then(user_id => {
				if(user_id == "new user"){
					req.session.loggedin = false
					res.redirect("/user/sociallogin");
				}
				else {
					req.session.loggedin = true;
					res.locals.user = req.user
					res.redirect("/");
				}
			})
			.catch(function(err) {
				console.log(err);
			});
	}
);

/*--local email/pass auth route--*/
passport.use("local",new LocalStrategy({
			usernameField: "email",
			passwordField: "password",
			passReqToCallback: true,
		},
		function(req, username, password, done) {
			//console.log("local strategy")
			//console.log(username)
			//console.log(password)
			user
			.checkUser(username)
			.then(user_id => {
				//console.log(user_id)
				if(user_id=="new user"){
					//a non-user trying to log in
					return done(null, false);
				}
				else{
					user
					.checkPassword(username, password)
					.then(data => {
						//console.log(data);
						//console.log("bad password");
						return done(null, false);
					})
					.catch(data => {
						user
						.getUserInfo(username)
						.then(function(data) {
							//console.log(data)
							//we can hook custom user properties in here.
							user.displayName = data[0].firstname + " " + data[0].lastname;
							user.role = data[0].role || ""
							user.user_id = data[0].user_id;
							req.session.loggedin = true;
							return done(null, user);
						});
					});
				}
			})
			.catch(data => {
				//console.log("no user");
				return done(null, false);
			});
		}
	)
);

router.all("/local/login",
	passport.authenticate("local", {
		//successRedirect: '/',
		failureRedirect: "/user",
		session:true
	}),
	function(req, res, next) {
		//console.log("local login route");
		//console.log(req.user);
		//console.log(req.body);
		res.locals.user = req.user
        res.locals.loggedin = req.session.loggedin
		if (req.body.remember_me == "true") {
			//user has stated that they want to stay logged in. make them a token, dump it into the DB and save
			//a cookie with the same token. Use a JWT so that we can verify their claims later.

			let rememberToken = crypto.randomBytes(40).toString('hex');
			let now = moment()
			//console.log(chalk.magenta("saving token " + rememberToken));
			//set some dates the OG way because cookies are weird
			let exp = 14 * 24 * 3600000 //2 weeks
			var date = new Date();
			date.setDate(date.getDate() + 14);
			stateObj = {
				user: req.user.user_id,
				displayName: user.displayName,
				claim: rememberToken,
				exp: Math.floor(date/1000)
			};
			var state = jwt.sign(stateObj, oauthSecret);

			//save token
			knex("tokens")
				.insert({
					access_token: rememberToken,
					valid: 1,
					expiration: now.add(2, 'weeks').format("YYYY-MM-DD HH:mm:ss"),
					created_at: now.format("YYYY-MM-DD HH:mm:ss"),
					user_id: req.user.user_id,
				})
				.then(token=>{})
				.catch(err=>{console.log(err)});
			res.cookie(config.namespace+"rememberme", state, { maxAge: exp, httpOnly: true });
		}

		if (req.body.__nexturl) {
			res.status(200).redirect(req.body.__nexturl);
		}
		else {
			res.redirect("/");
		}
	}
);

passport.use("cookielogin",
	new LocalStrategy({
		usernameField: "email",
		passwordField: "token",
		passReqToCallback: true,
	},
	function(req, username, password, done) {
		//pulling in the user id and the token as username and pass because that is what the localstrategy passes.
		//
		//console.log(req.body)
		//console.log(chalk.blue("found a cookie"))
		//console.log(chalk.blue(req.cookies[config.namespace+"rememberme"]))
		knex("tokens")
		.select("firstname", "lastname","tokens.user_id")
		.join("users", "users.user_id","=","tokens.user_id")
		.where({
			'tokens.user_id': username,
			access_token: password,
			firstname:req.body.first_name,
			lastname: req.body.last_name
		})
		.then(function(user){
			knex("roles")
			.select("role")
			.where({
				user_id: username
			})
			.join("role_types", "roles.role","=","role_types.label")
			.then(function(role){
				console.log(user)
				console.log(role)
				user.displayName = returningUser[0].firstname + " " + returningUser[0].lastname;
				user.user_id = returningUser[0].user_id;
				user.role ? role[0].role : "none"
				req.session.loggedin = true;
				return done(null, user);
			})
			.catch(err=>{console.log(err)})
		})
		.catch(err=>{
			console.log(err);
			console.log("no user");
			return done(null, false);
		})
	})
)

router.all('/local/logmein', function(req, res, next) {
	//console.log("logging in")
	if(!req.cookies[config.namespace+"rememberme"]){
		//no cookie. get out of this route!
		res.redirect("/")
	}
	passport.authenticate('cookielogin', function(err, user, info) {
		jwt.verify(req.cookies[config.namespace+"rememberme"], config.oauthsecret, async function(err,decoded){
			//console.log(decoded)
			if(err){
                //someone is screwing with the cookie. it didn't pass verification, so lets clear the cookie and throw an error
                console.log("jwt verification failed. Someone got hacky.")
                console.log(err)
                res.clearCookie(config.domainname+"_rememberme");
                res.status(501).send(`<html><title>${config.seo.title}</title><body><h1>ERROR</h1></body>`).end();
            }
            else{
				//console.log("passed jwt check")
				//console.log(req.headers)
				//console.log(chalk.red("came from " + req.headers.referer))
				//console.log(chalk.red("next " + req.query.nextUrl))
				let nextUrl = req.query.nextUrl || "/";
				knex("tokens")
					.select("firstname", "lastname","tokens.user_id")
					.join("users", "users.user_id","=","tokens.user_id")
					.where({
						'tokens.user_id': decoded.user,
						access_token: decoded.claim,
						firstname: decoded.displayName.split(" ")[0],
						lastname: decoded.displayName.split(" ")[1]
					})
					.then(function(user){
						if(!user){
							res.clearCookie(config.domainname+"_rememberme");
							res.redirect("/")
						}
						knex("roles")
						.select("role")
						.where({
							user_id: user[0].user_id
						})
						.join("role_types", "roles.role","=","role_types.label")
						.then(function(role){
							//console.log(user)
							//console.log(role)
							let theUser = {}
							theUser.displayName = user[0].firstname + " " + user[0].lastname;
							theUser.user_id = user[0].user_id;
							let theRole="none";
							if(role.length != 0){
								theRole=role[0].role;
							}
							theUser.role = theRole;
							req.logIn(theUser, function(err) {
								//console.log("cookie based log in")
								//console.log(theUser)
								if (err) { return next(err); }
								else{
									req.session.loggedin = true;
									let rememberToken = crypto.randomBytes(40).toString('hex');
									let now = moment()
									//set some dates the OG way because cookies are weird
									let exp = 14 * 24 * 3600000 //2 weeks
									var date = new Date();
									date.setDate(date.getDate() + 14);
									stateObj = {
										user: theUser.user_id,
										displayName: theUser.displayName,
										claim: rememberToken,
										exp: Math.floor(date/1000)
									};
									var state = jwt.sign(stateObj, oauthSecret);
									knex("tokens").update({updated_at: now.format("YYYY-MM-DD HH:mm:ss"),access_token: rememberToken,expiration: now.add(2, 'weeks').format("YYYY-MM-DD HH:mm:ss"),}).where({user_id: req.user.user_id,}).then(token=>{}).catch(err=>{console.log(err)});
									res.cookie(config.namespace+"rememberme", state, { maxAge: exp, httpOnly: true });
									return res.redirect(nextUrl)
								}
							})
						})
						.catch(err=>{console.log(err)})
					})
					.catch(err=>{
						//console.log("no user");
						console.log(err);
						return done(null, false);
					})
			}
		});
	})(req, res, next);
});

router.get("/logout", function(req, res, next) {
	if(req.user){
		knex("tokens")
		.where({
			user_id: req.user.user_id,
		})
		.del()
		.catch(err=>{console.log(err)})
	}
	res.clearCookie(config.namespace+"rememberme");
	req.session.loggedin = false
	res.locals.user = ""
	req.logOut();
	req.session.destroy(function (err) {
		res.redirect('/'); //Inside a callback… bulletproof!
	});
	 
});

/*------- main GET handler ------*/
router.get("/:intent?/:code?", function(req, res, next) {
	if(req.session.loggedin == true){
		//user is already logged in. Send them back home.
		res.status(200).redirect("/");
	}
	/*
    intent is the various actions that a user would want to take, such as
    logging in or registering.

    Without the intent set, the page will render the registration form

    The optional `code` parameter is used for password resets.
    */

	//console.log(req.params);
	//console.log(res.locals);
	//console.log(req.session);
	//console.log(controller)
	let errors = [];
	let values = [];

	//defaults
	controller.nextUrl = req.query.state;
	controller.intent = req.params.intent;
	res.locals.code = req.params.code;
	controller.values = req.body;

	switch (req.params.intent) {
		case "success":
			//has successfully registered
			controller.title = "Success!";
			res.render("user", controller);
			break;
		case "login":
			//wants to login
			controller.current = "user/login";
            controller.title = "Login";
            res.locals.hideBbqChampLogo = true;
			res.render("user", controller);
			break;
		case "forgotpassword":
			if (req.params.code) {
				//check if code exists
				knex("forgot_password")
					.select("*")
					.where({
						code: req.params.code
					})
					.then(function(code) {
						if (code.length != 0) {
							controller.intent = "resetpassword";
                            controller.title = "Password Recovery - Enter New Password";
                            res.locals.hideBbqChampLogo = true; 
							req.session.code = req.params.code;
						} else {
							controller.title = "Password Recovery - Error";
						}
						res.render("user", controller);
					})
					.catch(function(err) {
						console.log(err);
					});
			} else {
                controller.title = "Password Recovery - Recover Password";
                res.locals.hideBbqChampLogo = true; 

				res.render("user", controller);
			}
			break;
		case "sociallogin":
			//console.log("user "+req.user.id)
			controller.current = "user/register"
			res.locals.nextUrl = req.query.state;
			res.locals.user = req.user;
			res.locals.provider = req.user.provider
			res.locals.id = req.user.id
			switch(req.user.provider){
				case "twitter":
					let twit = JSON.parse(req.user._raw)
					res.locals.firstname = twit.name
					break
				case "facebook":
					res.locals.firstname = req.user.name.givenName
					res.locals.lastname = req.user.name.familyName
					break
				case "google":
					let goog = JSON.parse(req.user._raw)
					res.locals.firstname = goog.name.givenName
					res.locals.lastname = goog.name.familyName
					break
			}

			res.locals.email = req.user.emails[0].value;
			controller.title = "Connection successful!";
			res.render("user", controller);
			break;
		case "profile":
			controller.title = "User Profile";
			res.render("user", controller);
			break;
		case "register":
			res.redirect("/");
		default:
			controller.current = "user/register";
			controller.title = "Log in / Register";
			res.render("user", controller);
			break;
	}
});

router.post("/:action", async function(req, res, next) {

	res.locals.errors = []
	let errors=[]
	controller.values = req.body;
	let ip = req.headers["X-Forwarded-For"] || req.headers["x-forwarded-for"] || req.connection.remoteAddress;
	let ua = req.headers['user-agent'];

	switch (req.params.action) {
		case "sociallogin":
			//common error tests
			errors.push(testEmpty(req.body.overAge, "Must check age"));
			errors.push(testEmpty(req.body.rules, "Must agree to rules"));
			errors.push(validateEmail(req.body.email, "Invalid Email"));
			errors.push(testEmpty(req.body.firstname, "First Name is empty"));
			errors.push(testEmpty(req.body.lastname, "Last Name is empty"));
			res.locals.provider = req.body.__network
			res.locals.id = req.body.__id
			controller.current = "user/register"
			errors = errors.filter(function(x) {
				return x !== (undefined || null || "");
			});
			if (errors.length == 0) {
				//no errors? then try to create a user.
				user
				.newUser(req.body, ip, ua)
				.then(data => {
					//console.log("success");
					res.locals.loggedin = true
					console.log(req.body.__nexturl);
					if (req.body.__nexturl) {
						res.redirect(req.body.__nexturl);
					} else {
						res.redirect("/");
					}
				})
				.catch(error => {
					console.log(error);
					controller.title="Something went wrong. Please review the errors"
					controller.intent = "sociallogin"
					res.locals.errors = error;
					res.render("user",controller);
				});
			}
			else{
				//uh oh, something is missing/wrong.
				controller.title="Please correct the following errors"
				controller.intent = "sociallogin"
				res.locals.errors = errors;
				res.render("user",controller);
			}
			break;
		case "passwordreset":
			 user
			.sendPasswordReset(req.body.email)
			.then(function(message) {
				//user exists, send email
				//console.log("RETURNED FROM FLOW");
				//console.log(user);
				if (message !== "sso user") {
					console.log("reset, " + message)
					controller.title = "Password Recovery - Recovery Email Sent";
					controller.intent = "forgotpassword-sent";
					//console.log(email);
					res.render("user", controller);
				}
				else {
					//they are an sso user
					controller.title = "Password Recovery - Error";
					controller.intent = "forgotpassword-sso";
					res.render("user", controller);
				}
			})
			.catch(function(err) {
				console.log(err);
				//user does not exist. send them a message offering to sign up
				//don't show an error mssg, as that could leak info
				controller.title = "Password Recovery - Recovery Email Sent";
				controller.intent = "forgotpassword-sent";
				res.render("user", controller);
			});
			break;
		case "newpassword":
			res.locals.code = req.body.code;
			res.locals.confirm_email = req.body.confirm_email;

			let err = [];
			err.push(
				matchFeilds(
					req.body.newpass,
					req.body.confirmNewPassword,
					"Passwords don't match"
				)
			);
			err = err.filter(function(x) {
				return x !== (undefined || null || "");
			});

			if (err.length == 0) {
				user
					.checkUser(req.body.confirm_email)
					.then(function(user_id) {
						user
							.changePassword(
								req.body.confirm_email,
								req.body.code,
								req.body.newpass
							)
							.then(function(resolve) {
								res.redirect("/user/login");
							})
							.catch(function(err) {
								console.log(err);
							});
					})
					.catch(function(err) {
						console.log(err);
					});
			}
			else {
				controller.errMssg = err;
				controller.intent = "resetpassword";
				controller.title = "Password Recovery - Enter New Password";
				req.session.code = req.params.code;
				res.render("user", controller);
			}
			break;
		default:
			//register
			//common error tests
			//errors.push(testEmpty(req.body.overAge, "Must check age"));
			errors.push(testEmpty(req.body.certify, "Must certify"));
			errors.push(validateEmail(req.body.email, "Invalid Email"));
			errors.push(testEmpty(req.body.firstname, "First Name is empty"));
			errors.push(testEmpty(req.body.lastname, "Last Name is empty"));
			errors.push(testEmpty(req.body.password, "Password was empty"));
			errors.push(testEmpty(req.body.password2, "Confirm Password was empty"));
			errors.push(
				matchFeilds(
					req.body.password,
					req.body.password2,
					"Passwords don't match"
				)
			);
			errors.push;
			//remove empty array elements
			errors = errors.filter(function(x) {
				return x !== (undefined || null || "");
			});

			if (errors.length == 0) {
				//no errors so far, lets test the captcha
				testCaptcha(req.body["g-recaptcha-response"], req)
				.then(function(msg){
					if(msg=="success"){
						//check the user, and if they don't exist make a user
						user
						.checkUser(req.body.email)
						.then(user_id => {
							if (user_id !== "new user") {
								//we have a user with this email already, so show them a message for reset or login
								errors.push(
									'We already have this email. Did you want to <a href="/user/login">Login</a> or did you <a href="/user/forgotpassword">forget your password</a>?'
								);
								res.locals.errors = errors;
								res.render("user", controller);
							} else {
								//no user found, so lets make a new user
								user
									.newUser(req.body, ip, ua)
									.then(function(user_id) {
										//optional additional signin feilds
										knex("users")
										.where({
											user_id:user_id
										})
										.update({
											address1:req.body.street,
											city: req.body.city,
											state:req.body.state,
											zip:req.body.zip,
											phone: req.body.phone,
											team_name: req.body.team_name,
											cooknumber:JSON.stringify(req.body.cooknumber),
											social: req.body.social,
											optin: req.body.optin,
											certify: req.body.certify,
											confirmed: "confirmed",
											numberOfMembers: req.body.numberOfMembers,
											edge_id: user_id
										})
										.then(function(data){
											email.sendEmail("bbqdata-registration", {
												email: "mark@bbqdata.com",
												user: {
													email: req.body.email,
													firstname: req.body.firstname,
													lastname: req.body.lastname,
													address1:req.body.street,
													city: req.body.city,
													state:req.body.state,
													zip:req.body.zip,
													phone: req.body.phone,
													team_name: req.body.team_name,
													cooknumber:JSON.stringify(req.body.cooknumber),
													numberOfMembers: req.body.numberOfMembers,
												}
											});
										})
										.catch(function(err){console.log(err)})

										//fire registration email here.
										//console.log("sending registration email")
										var options={
											email: req.body.email,
											firstname: req.body.firstname
										}
										//Uncomment this line before pushing to staging/production
										email.sendEmail("registration", options)
										//user created, lets post to the passport route
										res.redirect(307, "/user/local/login");
									})
									.catch(function(reason) {
										//something went wrong.
										//console.log(reason);
										res.send(reason).end();
									});
							}
						})
						.catch(function(err) {
							console.log(err);
						});
					}
					else{
						controller.title = "Please correct the following errors";
						let err =[]
						err.push(msg)
						res.locals.errors = err;
						res.render("user", controller);
					}

				})
				.catch(function(err){
					console.log(err)
				})
				//check the user, and if they don't exist make a user
			}
			else{
				//submission did not pass. some sort of error(s) occurred.
				controller.title = "Please correct the following errors";
				res.locals.errors = errors;
				res.render("user", controller);
			}
			break;
	}
});

/*------- ajaxposts ------*/
//Will return 200 for ok, or various http error codes + messages
router.post("/ajax/:action", function(req, res, next) {
	//register
	//login
	//reset password
});







/*-------------------------
Functions and utilities
---------------------------*/


function testCaptcha(captcha, req) {
	return new Promise(function(resolve, reject) {
		//this needs to be promised-ified
		//var captcha = req.body['g-recaptcha-response']
		//console.log(req.params);
		//console.log(req.session);
		//console.log("Testing captcha: " + captcha);
		if (req.session.dev == true) {
			//don't test if we are local. Internal network acts like a MitM, and will not work
			console.log("Captcha disabled on localhost");
			resolve("success");
		}
		else if (captcha === undefined || captcha === "" || captcha === null) {
			//no captcha included, return error
			resolve("Please select captcha.");
		}
		else {
			//test captcha
			var verificationUrl = "https://www.google.com/recaptcha/api/siteverify?secret=" + config.google.recaptcha +"&response=" + captcha;
			request(verificationUrl, function(error, response, body) {
				console.log("url: " + verificationUrl);
				console.log("body: " + body);
				console.log("response: " + response);
				console.log("error: " + error);

 				try {
					body = JSON.parse(body);
				}
				catch (err) {
					reject(err);
				}
				if (body.success !== undefined && !body.success) {
					resolve("Captcha failed. Try again");
				}
				else {
					resolve("success");;
				}
			});
		}
	});
}

function testEmpty(value, errMsg) {
	if (value == "" || value == undefined) {
		return errMsg;
	} else {
		return "";
	}
}

function validateEmail(email, errMsg) {
	//console.log("checking email validity...");
	var re = /[a-z0-9!#$%&'*+\/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+\/=?^_`{|}~-]+)*@(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?/;
	if (re.test(email)) {
		return "";
	} else {
		return errMsg;
	}
}

function matchFeilds(field1, field2, errMsg) {
	if (
		field1 != field2 ||
		field1 == "" ||
		field2 == "" ||
		field1 == undefined ||
		field2 == undefined
	) {
		return errMsg;
	} else {
		return "";
	}
}


//return an ajax response
function checkIfUserExists(username, msg) {}

function testPassword(username, password) {}
module.exports = router;
console.log("  Users Loaded.");
