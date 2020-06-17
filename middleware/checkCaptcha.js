var ims_utils = require("../lib/ims_utilities")
var request = require("request")
var config = require("../config")
/* 
Captcha Testing Middleware
Place in any route that requires captcha testing. 
On a successful captcha test, middleware will move on to the next route.
If unsuccessful, it will return various errors.

On localhost, this middleware will skip verification all together.
*/
module.exports = (req, res, next) => {
	console.log("checking captcha")
	let err = new Error;
	let captcha = req.body['g-recaptcha-response'];
	if (req.session.dev == true) {
		//don't test if we are local. Internal network acts like a MitM, and will not work
		ims_utils.logMsg('Captcha disabled on localhost.');
		next()
	} 
	else if (captcha === undefined || captcha === '' || captcha === null) {
        //no captcha included, return error
		err.message = 'Captcha missing from req body'
		next(err);
	} 
	else {
		//test captcha
		var verificationUrl =
			'https://www.google.com/recaptcha/api/siteverify?secret=' +
			config.recaptcha.Secret +
			'&response=' +
			captcha;
		request(verificationUrl, function(error, response, body) {
			/* console.log('url: ' + verificationUrl);
			console.log('body: ' + body);
			console.log('response: ' + response);
			console.log('error: ' + error); */
			if(error){
				err.message=error
				next(err)
			}
			try {
				body = JSON.parse(body);
			} 
			catch (error) {
				ims_utils.logMsg(err)
				err.message="Recaptcha Request Error"
				next(err);
			}
			if (body.success !== undefined && !body.success) {
				ims_utils.logMsg(err)
				err.message="Unsuccessful reCaptcha Test"
				next(err);
			} 
			else {
				next()
			}
		});
	}
}