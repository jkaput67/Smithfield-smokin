var chalk = require("chalk")
module.exports = function(controller) {
	return (req, res, next) => {
        if(req.hostname == "localhost"){
            console.log(chalk.cyan("<--Running on Localhost-->"))
            //this will register a locals variable and set a session key so that you can test and dev on localhost.
            res.locals.dev = true
            req.session.dev = true
        }
        next();
	};
};
