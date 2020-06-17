var config = require("../config");
var knex = require("knex").knex;
knex.knex = knex(config.connection);
var chalk = require("chalk")
var util = require("util")

function promiseCaptcha(captcha, req) {
  /* 
    Promise based captcha checker 
    There is also a middleware captcha checker in /middleware
  */
	return new Promise(function(resolve, reject) {
		//var captcha = req.body['g-recaptcha-response']
		//console.log(req.params);
		//console.log(req.session);
		logMsg("Testing captcha: " + captcha);
		if (req.session.dev == true) {
			//don't test if we are local. Internal network acts like a MitM, and will not work
      logMsg("Captcha disabled on localhost");
			resolve("success");
		} 
		else if (captcha === undefined || captcha === "" || captcha === null) {
			//no captcha included, return error
			resolve("Please select captcha.");
		} 
		else {
			//test captcha
			var verificationUrl = "https://www.google.com/recaptcha/api/siteverify?secret=" + config.recaptcha.Secret +"&response=" + captcha;
			request(verificationUrl, function(error, response, body) {
				//console.log("url: " + verificationUrl);
				//console.log("body: " + body);
				//console.log("response: " + response);
				//console.log("error: " + error);
				
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

function logMsg(msg, lineNumber) {
	//only log on dev and stage
	if (!process.env.NODE_ENV || process.env.NODE_ENV == "" || process.env.NODE_ENV == "stage") {
        if(lineNumber){
            console.log(chalk.blue("Debug Line Number: " +lineNumber));
        }
		if(typeof msg === "object"){
			console.log(chalk.blue(util.inspect(msg, {colors:true, depth:null})));
		}
		else{
			console.log(chalk.blue(msg));	
		}
	}
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
	var re = /[a-zA-Z0-9!#$%&'*+\/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+\/=?^_`{|}~-]+)*@(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?/;
	if (re.test(email)) {
		return "";
	} else {
		return errMsg;
	}
}

//The de-facto unbiased shuffle algorithm is the Fisher-Yates (aka Knuth) Shuffle.
//https://stackoverflow.com/questions/2450954/how-to-randomize-shuffle-a-javascript-array
function shuffle(array) {
    var currentIndex = array.length, temporaryValue, randomIndex;
    // While there remain elements to shuffle...
    while (0 !== currentIndex) {
        // Pick a remaining element...
        randomIndex = Math.floor(Math.random() * currentIndex);
        currentIndex -= 1;
        // And swap it with the current element.
        temporaryValue = array[currentIndex];
        array[currentIndex] = array[randomIndex];
        array[randomIndex] = temporaryValue;
    }
    return array;
}
function getRandomInt(min, max) {
	min = Math.ceil(min);
	max = Math.floor(max);
	return Math.floor(Math.random() * (max - min)) + min; //The maximum is exclusive and the minimum is inclusive
}

module.exports = {
    promiseCaptcha,
    logMsg,
    shuffle,
    getRandomInt,
    testEmpty,
    validateEmail,
};