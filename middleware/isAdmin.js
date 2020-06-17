module.exports = function(controller) {
	//Checks to make sure the user is an admin
	return (req, res, next) => {
		console.log("accessing admin section");
		res.locals.user = req.user;
		if (!req.user || req.user.role !== "admin" && req.user.role !== "accounts") {
			res.redirect("/");
		} 
		else {
			next();
		}
	};
};
