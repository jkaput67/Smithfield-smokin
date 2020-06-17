/*
==================================================
 Site Config

 If the site has a database, most of these values
 will be set in the options table. The only options
 that would need to be hard coded here would be the
 database set up.

 For static sites, set options here.
==================================================
*/
require('dotenv').config()

var config = {};
const chalk = require("chalk");

var dbHost = "";
var dbUser = "";
var dbPass = "";
var dbName = "";
var paypalInfo = {};

var callbackUrl = "";
var dbdebug = false;
if ( !process.env.NODE_ENV || process.env.NODE_ENV == "" || process.env.NODE_ENV == "stage") {
	dbHost = "";
	dbUser = "";
	dbPass = "";
	dbName = "";
	callbackUrl = "";
	dbdebug = false;
	config.domainname = "";
	config.contactemail = "";
	if (process.env.NODE_ENV === "stage") {
		config.domainURL = "";
	} else {
		config.domainURL = "";
	}
}
else {
	callbackUrl = "";
	dbHost="";
  	dbname=''
	dbUser = "";
	dbPass = "";
	dbName = "";
	dbdebug = false;
	config.domainname = "";
	config.contactemail = "";
	paypalInfo = {
		token: 'access_token$production$p65j4gyqxy3bkjbr$c8163a010a2ba68252718dcc64e3d188',
		account: 'steve@jwilbur.com',
		expires: '14 Feb 2027'
	};
	config.domainURL = "";
}
console.log(chalk.green("DB host: "+dbHost))

var callbackUrl = process.env.CALLBACK_URL;
var dbHost = process.env.RDS_HOSTNAME || "localhost";
var dbUser = process.env.RDS_USERNAME || "smokin";
var dbPass = process.env.RDS_PASSWORD || "password";
var dbName = process.env.RDS_DB_NAME || "smokin";
config.contactemail = process.env.CONTACTEMAIL;
config.additionalContactEmails = ['katie.ancheta@edgemarketingnet.com', 'stephen.black@edgemarketingnet.com'];

paypalInfo = {
	token: process.env.BRAINTREE_TOKEN,
	account: process.env.BRAINTREE_ACCOUNT,
	expires: process.env.BRAINTREE_EXPIRES
};

config.domainname = process.env.CALLBACK_URL;

config.connection = {
	client: "mysql",
	connection: {
		host: dbHost,
		user: dbUser,
		password: dbPass,
		database: dbName,
		typeCast: function castField(field, useDefaultTypeCasting) {
			// We only want to cast bit fields that have a single-bit in them. If the field
			// has more than one bit, then we cannot assume it is supposed to be a Boolean.
			if (field.type === "BIT" && field.length === 1) {
				var bytes = field.buffer();
				// A Buffer in Node represents a collection of 8-bit unsigned integers.
				// Therefore, our single "bit field" comes back as the bits '0000 0001',
				// which is equivalent to the number 1.
				return bytes && bytes[0] === 1 ? 1 : 0;
			}
			return useDefaultTypeCasting();
		}
	},
	debug: dbdebug
};

//all of the following config items should ultimately be moved to ENV variables or an options table in the database.

config.namespace="smokin_"

//OAuth secret key
/*
generate an X number of random bytes by using this in a node console:
crypto.randomBytes(64, (err, buf) => {
    if (err) throw err;
   console.log(`${buf.length} bytes of random data: ${buf.toString('hex')}`);
});
*/
config.oauthsecret = "5F7ED19F244FA2264E3BADC73D2F6";

//nav
config.nav = {
	home: {
		label: "home",
		link: "/"
	},
	/*race: {
		label: "National Barbecue Championship",
		link: "/national-barbecue-championship"
	},*/
	Committed:{
		label:"Committed Cooks",
		link:"/committed-cooks"
	},
	grants:{
		label: "Grant Program",
		link:"/grant-program"
	},
	// home: {
	// 	label: "Judging Application",
	// 	link: "/judging-application"
	// },
	// where:{
	// 	label:"Where to Buy",
	// 	link:"/where-to-buy"
	// },
};


config.footernav = {
	home:{label:"Home",link:"/"},
	//nbb:{label:"National Barbecue Championship",link:"/national-barbecue-championship"},
	cc:{label:"Committed Cooks",link:"/committed-cooks"},
	grant:{label:"Grant Program",link:"/grant-program"},
	// where:{label:"Where to Buy",link:"/where-to-buy"},
	// faq:{label:"FAQs",link:"/faq"},
	smithfield:{label:"Smithfield.com",link:"http://www.smithfield.com"},
	contact:{label:"Contact Us",link:"#contact",cssclass:"modaltrigger contact"},
	privacy:{label:"Privacy Policy",link:"/privacy-policy/"},
	caliprivacy:{label:"California Privacy",link: "https://www.smithfieldfoods.com/ca-privacy-policy"},
	copy:{label:"&copy;2020 Smithfield",link:""},
};


//SEO defaults
config.seo = {
	baseUrl:"https://"+ config.domainname,
	title: "Smokin With Smithfield | National Barbeque Championship",
    desc: "Smoke the competition with the #SmokinWithSmithfield National Barbecue Championship, & check out which teams are winning on our leaderboard!",
	og_title: "Smokin With Smithfield | National Barbecue Championship",
	og_image: "https://"+ config.domainname + "/images/SWS_NBC_SocialShare_2019.jpg",
	twitter: "Smoke the competition with the #SmokinWithSmithfield National Barbecue Championship! View leaderboards, enter our grant program & more!"
};

//apis and utilities
config.aws = {
	AWS_ACCESS_KEY: process.env.AWS_ACCESS_KEY || "",
	AWS_SECRET_KEY: process.env.AWS_SECRET_KEY || "",
	S3_BUCKET: process.env.S3_BUCKET_NAME || ""
};

config.mailgun = {
	key: process.env.MAILGUN_KEY,
	domain: process.env.MAILGUN_DOMAIN,
	images:{
		logo:process.env.MAILGUN_LOGO,
		header:process.env.MAILGUN_HEADER,
		footer:process.env.MAILGUN_FOOTER
	},
	sitename:process.env.MAILGUN_SITENAME,
};

config.recaptcha = {
	SiteKey: process.env.CAPTCHAKEY,
	Secret: process.env.CAPTCHASECRET
};

//social information
config.facebook = {
	active: true,
	role: "readonly",
	app_id: process.env.FB_APP_ID,
	secret: process.env.FB_SECRET,
	callback_url_domain: callbackUrl
};

config.google = {
	active: true,
	role: "readonly",
	client_id: process.env.GOOGLE_CLIENT_ID,
	secret: process.env.GOOGLE_SECRET,
	callback_url_domain: callbackUrl,
	recaptcha: process.env.CAPTCHASECRET
};

config.twitter = {
	active: true,
	role: "readonly",
	consumer_key: process.env.TWITTER_CONSUMER_KEY,
	secret: process.env.TWITTER_SECRET,
	callback_url_domain: callbackUrl
};

config.paypal = paypalInfo;


config.tokenExpiration = 43200; //expiration in minutes
module.exports = config;
