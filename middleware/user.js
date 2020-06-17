var config = require("../config")
var chalk = require("chalk")
var util = require("util")

module.exports = (req, res, next) => {
    //__logMsg(req.originalUrl)
    //exposes the user to the res.locals and sets the logged in state
	if (req.user) {
        __logMsg("User Session Active")
        __logMsg(req.user)
        res.locals.user = req.user
        res.locals.loggedin = req.session.loggedin
        next();
    }
    else if(req.cookies[config.namespace+"rememberme"]){
        //user has previously requested that we remember them, but the req user session has expired. 
        __logMsg("Found a User cookie")
        res.status(307).redirect("/user/local/logmein?nextUrl=" + req.originalUrl)
    }
    else{
        //haven't found a user or a cookie. Just move along until they sign in
        __logMsg("No cookie, No user");
        next()
    }
};
function __logMsg(msg, lineNumber) {
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
