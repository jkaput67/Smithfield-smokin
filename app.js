var express = require("express");
var path = require("path");
var favicon = require("serve-favicon");
var logger = require("morgan");
var cookieParser = require("cookie-parser");
var bodyParser = require("body-parser");
var config = require("./config.js");
var app = express();
app.disable('x-powered-by');
var chalk = require("chalk");
var knex = require("knex");
knex.knex = knex(config.connection);
var isAdmin = require("./middleware/isAdmin");
require("https").globalAgent.options.rejectUnauthorized = false;
var flash = require('connect-flash');

var session = require('express-session');
var KnexSessionStore = require('connect-session-knex')(session);
var store = new KnexSessionStore({
    knex: knex.knex
});

//var bcrypt = require("bcrypt");
var bearerToken = require("express-bearer-token");
var passport = require("passport");
var FacebookStrategy = require("passport-facebook").Strategy;
var GoogleStrategy = require("passport-google-oauth20").Strategy;
var TwitterStrategy = require("passport-twitter").Strategy;
var LocalStrategy = require("passport-local").Strategy;
var RememberMeStrategy = require('passport-remember-me').Strategy;


var user = require("./routes/user");
var admin = require("./routes/admin");
var routes = require("./routes/index");
// var setup = require("./routes/setup");
var cron = require("./routes/cron");

app.use(flash());
// uncomment after placing your favicon in /public
// app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')))
app.use(logger("dev"));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, "public")));

app.use(
    session({ 
        secret: 'A6B92F1B69DA43426BFF3942A9445', 
		//cookie: { maxAge: 7 * 24 * 60 * 60 * 1000 }, //1 week
		cookie:{maxAge: 5 * 60 * 1000}, //five minutes
        resave: true,
        saveUninitialized: true,
        store:store,
    })
);

app.use(function(req, res, next) {
	res.header('Access-Control-Allow-Origin', "http://localhost:3005");
	res.header('Access-Control-Allow-Credentials', true);
	res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
	next();
  });


app.use(function(req, res, next){
	res.locals.captcha = config.recaptcha.SiteKey;
	next();
});

app.use(passport.initialize());
app.use(passport.session());
app.use(bearerToken());
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "pug");
app.use("/user", user);
app.use("/admin", admin);
app.use("/cron", cron);
// app.use("/setup", setup);
app.use("/", routes);


app.use(function (req, res, next) {
	//404 handler
	res
	.status(404)
	.format({
		'text/plain': () => {
			res.send({message: 'not found Data'});
		},
		'text/html': () => {
			let controller = {
				intent:"404",
				title:"Four Oh Four",
				desc:config.seo.desc,
				og_title:config.seo.og_title,
				og_img:config.seo.og_image,
				nav:config.nav,
				footernav:config.footernav,
				meta:[],
			}
			res.render('subpage', controller);
		},
		'application/json': () => {
			res.json({message: 'not found'});
		},
		'default': () => {
			res.status(406).send('Not Acceptable');
		}

	})
})

//force https
if (process.env.PORT) {
	app.use(function(req, res, next) {
		if (!req.secure || req.get("X-Forwarded-Proto") !== "https") {
			res.redirect("https://" + req.get("Host") + req.url);
		} else next();
	});
}

module.exports = app;
console.log(chalk.green("-----------------------------------"));
console.log(chalk.green("========<Server Started>==========="));
console.log(chalk.green("-----------------------------------"));

