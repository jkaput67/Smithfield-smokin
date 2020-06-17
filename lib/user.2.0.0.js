"use strict";
/*
Main user CRUD
Version 2.0.0

*/
var config = require("../config");
var knex = require("knex").knex;
knex.knex = knex(config.connection);
var bcrypt = require("bcryptjs");
var jwt = require("jsonwebtoken");
var moment = require("moment");
var uuid = require("uuid");
var chalk = require("chalk");
var emailModule = require("./email");
var util = require('util');

function checkUser(username, msg) {
	__logMsg("Check Users");
	return new Promise(function(resolve, reject) {
		knex("users")
			.where({ email: username })
			.then(function(data) {
				__logMsg(data);
				if (data.length > 0) {
					__logMsg("checkuser: user exists");

					resolve(data[0].user_id);
				} else {
					__logMsg("checkuser: new user");
					resolve("new user");
				}
			})
			.catch(err => {
				reject(err);
			});
	});
}

function checkPassword(username, password, msg) {
	__logMsg("checking password");
	__logMsg("username: " + username);
	__logMsg("password: " + password);
	return new Promise(function(resolve, reject) {
		knex("users")
			.where({ email: username })
			.then(function(data) {
				__logMsg("user data: ");
				__logMsg(data);
				bcrypt.compare(password, data[0].password, function(err, res) {
					__logMsg(res);
					if (res) {
						reject(err);
					} else {
						// Passwords match
						resolve("match");
					}
				});
			});
	});
}
 
function newUser(userInfo, ip, ua) {
	__logMsg("new user!");
	// __logMsg(userInfo);
	console.log(userInfo);
	var now = moment().format("YYYY-MM-DD HH:mm:ss");
	var pass;
	var type = "email";
	if (userInfo.password) {
		pass = bcrypt.hashSync(userInfo.password, 10);
	}
	if (userInfo.__network) {
		type = userInfo.__network;
	}
	return new Promise(function(resolve, reject) {
		if (userInfo) {
			//if no user exists insert a new user
			knex("users")
				.insert({
					email: userInfo.email,
					password: pass,
					firstname: userInfo.firstname,
					lastname: userInfo.lastname,
					created: now,
					updated: now,
					oauthID: userInfo.__id,
					oauthType: type,
					ip:ip,
					ua:ua
				})
				.then(function(data) {
					__logMsg("made a user: ");
					__logMsg(data);
					resolve(data[0]);
				})
				.catch(reason => {
					reject(reason);
				});
		} else {
			__logMsg("no user info sent");
			reject("Failed to create user");
		}
	});
}

async function getUserInfo(username) {
	return new Promise(async function(resolve, reject) {
		let user = []
		user = await knex("users")
			.select("*")
			.where({ email: username })
			.catch(err => {
				console.log(err);
			});
		let role = await knex("roles").where({ user_id: user[0].user_id }).catch(err=>{console.log(err)});
		if (role[0]) {
			user[0].role = role[0].role;
		} else {
			user[0].role = "none";
		}
		if(user){
			resolve(user);
		}
		else{
			reject("no user")
		}
		
	});
}


function changePassword(user, code, password) {
	__logMsg(user);
	__logMsg(code);
	__logMsg(password);
	//get the stored code, join on user ids
	return new Promise(function(resolve, reject) {
		knex("forgot_password")
			.join("users", "users.user_id", "=", "forgot_password.user_id")
			.where({
				code: code,
				email: user
			})
			.then(function(data) {
				if (data.length != 0) {
					let pass = bcrypt.hashSync(password, 10);
					__logMsg("updating password");
					__logMsg(pass);

					knex("users")
						.where({
							email: user
						})
						.update({
							password: pass
						})
						.then(function(pass) {
							knex("forgot_password")
								.where({
									code: code
								})
								.del()
								.then(function(del) {
									__logMsg("deleted code");
								});
							//send confirmation email
							resolve("updated");
						})
						.catch(function(err) {
							reject(err);
						});
				} else {
					__logMsg("not updated");
					resolve("No code found");
				}
			})
			.catch(function(err) {
				reject(err);
			});
	});
}
function sendPasswordReset(email) {
	let code = uuid.v1();
	var now = moment().format("YYYY-MM-DD HH:mm:ss");
	let userObject;
	__logMsg("Password Reset");
	__logMsg(code);
	__logMsg(email);
	return new Promise(function(resolve, reject) {
		checkUser(email)
			.then(user_id => {
				console.log("USER ID " + user_id);
				if (user_id) {
					//user exists, send email
					__logMsg("user exists, send email")
					return knex("users")
						.select("*")
						.where({
							email
						})
						.catch(err=>{console.log(err)})
				} 
				else {
					__logMsg("No user found. Cannot reset. Rejecting.");
					reject("No user");
				}
			})
			.then(user => {
				userObject = user[0];
				__logMsg("users  INFORMATION");
				__logMsg(userObject);
				if (user[0].oauthType == "email") {
					return knex("forgot_password")
						.returning(["id", "code"])
						.insert({
							user_id: user[0].user_id,
							code: code,
							issued_date: now
						});
				} 
				else {
					resolve("sso user");
				}
			})
			.then(forgotCredentialsID => {
				__logMsg("Forgot my password!")
				__logMsg(userObject)
				userObject.code = code;
				userObject.firstname = userObject.firstname;
				userObject.email = userObject.email
				emailModule.sendEmail("forgot_password", userObject);
				resolve("sent email");
			})
			.catch(err => {
				reject(err);
				__logMsg(err);
			});
	});
}

function ensureAuthenticated(req, res, next) {}

/*-- internal functions --*/
function __setPass(user, pass) {}
function __encodeToken() {}
function __decodeToken() {}
function __logMsg(msg) {
	//only log on dev and stage
	if (
		!process.env.NODE_ENV ||
		process.env.NODE_ENV == "" ||
		process.env.NODE_ENV == "stage"
	) {
		if(typeof msg === "object"){
			console.log(chalk.green(util.inspect(msg, {colors:true, depth:null})));
		}
		else{
			console.log(chalk.green(msg));	
		}
		
	}
}
function __generatePasswordHash(pass) {
	/* if (pass){
      //create hashed password
      bcrypt.genSalt(10, (err, salt) => {
        bcrypt.hash(pass, salt, (err, hash) => {
          if (err)
            return(err);
          else {
            return hash
          }
        }); //end hash
      }); //end salt
    } else {
     return ('');
    } */
}
function __comparePassword(plaintextpass, hash) {
	bcrypt.compare(plaintextpass, hash, function(err, res) {
		if (err) return err;
		else return res;
	});
}
module.exports = {
	checkUser,
	newUser,
	changePassword,
	ensureAuthenticated,
	checkPassword,
	getUserInfo,
	sendPasswordReset,
};
