var config = require("../config");
var Mailgun = require("mailgun-js");
var mailgun = new Mailgun({
	apiKey: config.mailgun.key,
	domain: config.mailgun.domain
});
var fs = require("fs");
var path = require("path");

var email = {};

function generateEmail(content, url) {
	return `<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
  <html>
    <head>
      <meta charset="utf-8">
      <title>Untitled</title>
      <style type="text/css">
        @media screen and (max-width: 600px) {
          table[class="contenttable"] {
            width: 100% !important;
          }
        }
        img {
          display: block;
          border-style: none;
          height:auto;
        }
        a { text-decoration: none;}

      </style>
      <!--[if mso]>
      <style type="text/css">
      body, table, td {font-family: Helvetica, HelveticaNeue, sans-serif !important;}
      </style>
      <![endif]-->
      <!--[if gte mso 9]>
        <style>
          sup { font-size: 100% !important; }
        </style>
      <![endif]-->
    </head>
    <body leftmargin="0" topmargin="0" marginwidth="0" marginheight="0" bgcolor="#ffffff" style="font-family: Helvetica, HelveticaNeue, sans-serif; color:#000000;">
      <table width="600" border="0" align="center" cellpadding="0" cellspacing="0"  class="contenttable">
        <tr>
          <td>
            <table bgcolor="#102a4d" width="100%" cellpadding="0" cellspacing="0"  border="0" >
              <tr>
                <td style="">
                  <img src="@@DOMAIN@@/images/email_header_2019.jpg" alt="Smokin' With Smithfield National Barbecue Championship" style="width:100%;"/>
								</td>
              </tr>
            </table>
          </td>
        </tr>
        <tr>
          <td style="padding:20px;">
            ${content}
          </td>
        </tr>
        <tr>
          <td cellpadding="0" cellspacing="0" align="center" style="font-size: 10px; background-color: #860106; color: #ffffff!important; padding: 20px;">Legalese: You are receiving this communication because you have opted in to the Smokin' With Smithfield National Barbecue Championship. For official Terms & Conditions, please visit <a href="https://smokinwithsmithfield.com" target="_blank" style="color:#fff;text-decoration: underline">smokinwithsmithfield.com</a>. Smithfield Foods, Inc, Copyright 2019.</td>
        </tr>
				<tr>
          <td style="background: #000;padding:10px 0 5px" align="center">
            <img src="@@DOMAIN@@/images/logos/smithfield.png" alt="Smithfield" style=""  align="absbottom"/>
          </td>
        </tr>
      </table>
    </body>
  </html>`;
}

email.sendEmail = function(template, options, next) {
	//read file from server
	//first check if it exists in cache (if possible)
	var fileName = "",
		subject = "";

	switch (template) {
		case "forgot_password":
			fileName = "Forgot_Password";
			subject = "Forgot your password? Let’s fix that.";
			break;
		case "registration":
			fileName = "Registration";
			subject = options.firstname + ", fire up those grills – you’re in!";
			break;
		case "confirm_team":
			fileName = "Confirm_Team";
			subject = "The Competition is Heating Up!";
			break;
		case "bbqdata-registration":
			fileName = "bbqdata-registration";
			subject = "New user registered for BBQ National Championships";
			break;
	}

	var emailPath = path.dirname(require.main.filename);
	console.log("Sending Email: " + template);
	fs.readFile(
		emailPath
			.replace("\\routes", "")
			.replace("/bin", "")
			.replace("\\bin", "")
			.replace("/routes", "") +
			"/emails/" +
			fileName +
			".html",
		"utf8",
		function(err, data) {
			if (err) {
				console.log(err);
				next(err);
			} else {
				var currUrl = config.domainURL;
				var body = generateEmail(data, currUrl);
				if (options.firstname) {
					body = body.replace(/@@FIRST_NAME@@/g, options.firstname);
				}
				if (template == "forgot_password") {
					body = body.replace(
						/@@LINK@@/g,
						config.domainname + "/user/forgotpassword/" + options.code
					);
				}
				else if(template == 'confirm_team'){
					body = body.replace(
						/@@LINK@@/g,
						config.domainname + "/confirm-team/" + options.code
					);
				} else if (template == 'bbqdata-registration') {
					body = body.replace(
						/@@EMAIL@@/g,
						options.user.email
					).replace(
						/@@FIRSTNAME@@/g,
						options.user.firstname
					).replace(
						/@@LASTNAME@@/g,
						options.user.lastname
					).replace(
						/@@ADDRESS1@@/g,
						options.user.address1
					).replace(
						/@@CITY@@/g,
						options.user.city
					).replace(
						/@@STATE@@/g,
						options.user.state
					).replace(
						/@@ZIP@@/g,
						options.user.zip
					).replace(
						/@@PHONE@@/g,
						options.user.phone
					).replace(
						/@@NUMBEROFMEMBERS@@/g,
						options.user.numberOfMembers
					).replace(
						/@@TEAMNAME@@/g,
						options.user.team_name
					).replace(
						/@@COOKNUMBER@@/g,
						options.user.cooknumber
					).replace(
						/@@JSON@@/g,
						JSON.stringify(options.user)
					)
				}
				else {
					body = body.replace(/@@LINK@@/g, currUrl);
				}
				body = body.replace(/@@DOMAIN@@/g, config.domainname);
				var data = {
					to: options.email,
					from: `notifications@${config.mailgun.domain}`,
					subject:subject,
					html: body
				};
				mailgun.messages().send(data, function(respErr, respBody) {
					if (respErr) {
						console.log(respErr)
						console.log(respBody)
					}
					else {
						console.log("sent email")
					}
				});
			}
		}
	);
};

module.exports = email;
