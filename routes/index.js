/*
 ___  _____ ______   ________           ________  ________  ________  _______
|\  \|\   _ \  _   \|\   ____\         |\   ____\|\   __  \|\   __  \|\  ___ \
\ \  \ \  \\\__\ \  \ \  \___|_        \ \  \___|\ \  \|\  \ \  \|\  \ \   __/|
 \ \  \ \  \\|__| \  \ \_____  \        \ \  \    \ \  \\\  \ \   _  _\ \  \_|/__
  \ \  \ \  \    \ \  \|____|\  \        \ \  \____\ \  \\\  \ \  \\  \\ \  \_|\ \
   \ \__\ \__\    \ \__\____\_\  \        \ \_______\ \_______\ \__\\ _\\ \_______\
    \|__|\|__|     \|__|\_________\        \|_______|\|_______|\|__|\|__|\|_______|
                       \|_________|
2018 v1.0
https://github.com/InMarketingServices/ims_core

*/
var config = require('../config');
var express = require('express');
var router = express.Router();
var knex = require('knex').knex;
knex.knex = knex(config.connection);
var session = require('express-session');
var email = require("../lib/email");
var upload = require("../lib/upload");
var moment = require('moment');
var uuid = require('uuid');
var cm = require("../lib/contentmanager")
var formidable = require('formidable');
var cookieParser = require('cookie-parser');
var oauthSecret = config.oauthsecret;
var isLocalHost = require("../middleware/isLocalHost");
var checkUser = require("../middleware/user");
var ensureAuthenticated = require("../middleware/ensureAuthenticated")
var Mailgun = require("mailgun-js")
var util = require('util');
var fs = require('fs');
var AWS = require('aws-sdk');
var upload = require("../lib/upload")
var chalk = require("chalk");
var checkCaptcha = require("../middleware/checkCaptcha")
var bcrypt = require("bcryptjs");
var request = require('request');

//paypal gateway
braintree = require('braintree')
var gateway = braintree.connect({
    accessToken: config.paypal.token
  });

let controller = {
    current:"",
    title:config.seo.title,
    desc:config.seo.desc,
    og_title:config.seo.og_title,
    og_img:config.seo.og_image,
    nav:config.nav,
    footernav:config.footernav,
    meta:[],
}

router.use(isLocalHost(controller));
router.use(checkUser);

router.post('/paypal-error', express.json(), (req, res) => {
    const mailgun = new Mailgun({ apiKey: config.mailgun.key, domain: config.mailgun.domain });

    const data = {
		from: "admin@smokinwithsmithfield.com",
		to: "kazbaig@upshotmail.com",
		subject: "SWS Paypal Error",
		html: `<pre>${JSON.stringify(req.body, null, 2)}</pre>`
    };

    mailgun.messages().send(data, function(err, body) {
		if (err) {
			//console.log(now + " - got an error: ", err);
			res.status(500).json({ error: err });
		}
		else {
			//console.log(body);
			//console.log("email sent!");
			res.status(200).json({success:"email sent"});
		}
	});
})

router.get('/', async function(req, res) {
    let now = moment().format("YYYY-MM-DD HH:mm:ss");
    controller.current="";
    controller.title = "Smokin' With Smithfield";
    res.locals.hideBbqChampLogo = true;
    let last_sync = await knex("standings").select("last_sync").orderBy("last_sync", "desc").limit(1);
    controller.events = await knex("events")
        .select("*")
        .where("event_date",">=",now)
        .catch(err=>{console.log(err)})

    controller.standings = await knex("standings")
        .select("*")
        .orderBy("place", "asc")
        .where({
            last_sync:last_sync[0].last_sync
        })
        .limit(10)
        .catch(err=>{console.log(err)})

    // temp for static leaderboard
    controller.standings = [
        {"place":"Grand Champion","team_name":"Rio Valley Meats BBQ","head_cook":"Fred Robles"},
        {"place":"Reserve Grand Champion","team_name":"BUCKSHOT BBQ – TX","head_cook":"Jayde Henley"},
        {"place":"3rd","team_name":"IOWA'S SMOKEY D'S BBQ","head_cook":"Darren Warth"},
        {"place":"4th","team_name":"Cajun Blaze","head_cook":"Adam Gautreau"},
        {"place":"5th","team_name":"SHAKE 'N BAKE BBQ","head_cook":"Tim Scheer"},
        {"place":"6th","team_name":"Heavy Smoke","head_cook":"Chris Schafer"},
    ];

    res.render('homepage', controller)

});

router.get('/healthcheck', function(req, res, next) {
    res.status(200).send("ok").end();
})

router.get('/email-confirm', async function(req, res, next) {
    if(process.env.OPENENDPOINTS) {
        var users = [];
        knex('users')
        .select("email","firstname")
        .whereNull('dupe')
        .whereNull('confirmed')
        .then(function(data){

            // this is for testing
            // var options={
            //     email: 'dmreese03@gmail.com',
            //     firstname: 'Dionne',
            //     code: '7'
            // }
            // email.sendEmail("confirm_team", options)
            // var options2={
            //     email: 'dionne.reese@edgemarketingnet.com',
            //     firstname: 'Dionne',
            //     code: '7'
            // }
            // email.sendEmail("confirm_team", options2)

            // This is to create a code for each user to be able to confirm their old accounts.
            //For some reason the uuid function was not generating unique values inside of the main for loop below
            for (var i = 0; i < data.length; i++) {
                var code = uuid.v1();
                data[i].code = code;
            }
            console.log(data.length);
            console.log(data[0]);
            //Add confirm code generated above to database for emails
            for (var i = 0; i < data.length; i++) {
                if(data[i].email.length>0){
                    console.log("EMAIL INFO:");
                    console.log(data[i]);
                    knex('users')
                    .select()
                    .where({
                        email: data[i].email
                    })
                    .update({
                        confirm_code: data[i].code
                    })
                    .catch(function(err){
                        console.log(err)
                    })
                }
            }
            //create options object and add to 'users' array
            for (var i = 0; i < data.length; i++) {
                var options = {
                    email: data[i].email,
                    firstname: data[i].firstname,
                    code: data[i].code
                }
                console.log("options:");
                console.log(options);
                users.push(options);
            }
            //send out email to every user
            users.forEach(user => {
                console.log("sending email to:");
                console.log(user);
                email.sendEmail("confirm_team", user);
                console.log("email sent");
            })
            res.send(users);
        })
        .catch(function(err){
            console.log(err)
        })
    } else {
        res.send("endpoint closed");
    }
})

router.get('/confirm-team/:code?', function(req, res, next) {
  controller.current= "confirm_team";
  controller.intent="confirm_team";
  controller.title = "Smokin With Smithfield | Confirm Your Team"
  res.locals.hideBbqChampLogo = true;
  req.session.code = req.params.code
  knex('users')
  .select("*")
  .where({confirm_code:req.params.code})
  .whereNull('confirmed')
  .then(function(data){
    console.log(data)
    if(data.length>0){
      res.locals.values = data[0];
      req.session.email = data[0].email
      res.render("subpage", controller)
    } else {
      //ALREADY CONFIRMED
      controller.intent="team_already_confirmed";
      res.render("subpage", controller)
    }
  }).catch(function(err){console.log(err)})
})

router.post('/confirming_team', checkReferer, function(req, res, next) {

  console.log(req.session)
  if(req.session.email==req.body.email||req.session.code==req.body.code){
    if(req.body.password==req.body.password2){
      let pass = bcrypt.hashSync(req.body.password, 10);

      knex("users")
      .where({
        confirm_code:req.body.confirm_code
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
        numberOfMembers: req.body.numberOfMembers,
        confirmed: "confirmed"
      })
      .then(function(data){
        controller.intent="team_confirmed";
        res.render("subpage", controller)
      })
      .catch(function(err){console.log(err)})


    } else {
      // fail return back to the sign up, with passwords do not match.
    }
  } else {
    // failed session / hidden field match.
    // error page - sorry were having problems click here to contact us about your probelem
  }
  console.log(req.body);
  //check if password 1 and 2 are the same
  //then bcrypt it



  // let pass = bcrypt.hashSync(password, 10);


  //if error return to page with error message else
  //send to thank you page - your info has been updated click here to login to the site.

  //on login check to see of confirmed is null, if it is then send them to a page where they enter their email and resend the confirm code.
})
function checkReferer(req,res,next){
    let ref = req.headers.referer
    let now = new moment.tz("America/New_York");
    let ip = req.header('x-forwarded-for') || req.connection.remoteAddress;
    if(req.session.user){
        next()
    }
    if(req.headers.referer != undefined || ref.indexOf("request-code") != -1){
        next()
    }
    else{
        console.log("no referrers - direct request: " + ip + " | " + now)
        next(new Error("Bad Referer"))
    }
}
router.get('/about', function(req, res, next) {
    controller.current= "about";
    controller.intent="about";
    controller.title = "about us"
    res.locals.hideBbqChampLogo = true;

});
router.get("/faq", function(req,res,next){
    controller.current= "faq";
    controller.intent = "faq"
    controller.title = "Smokin With Smithfield | Frequently Asked Questions"
    res.locals.hideBbqChampLogo = true;
    res.render("subpage", controller)
})

router.get('/where-to-buy', function(req, res, next) {
    controller.current= "where-to-buy";
    controller.intent="where-to-buy";
    controller.title = "Smokin With Smithfield | Where to Buy Smithfield Fresh Pork"
    res.locals.hideBbqChampLogo = true;
    knex("wheretobuy")
    .select("storename")
    .then(function(stores){
        controller.stores = stores
        res.render('subpage', controller);
    })
});

router.get('/committed-cooks', async function(req, res, next) {
    controller.current= "committed-cooks";
    controller.intent="committed-cooks";
    controller.title = "Smokin With Smithfield | Committed Cooks Program"
    res.locals.hideBbqChampLogo = true;
    console.log(req.user)
    knex("prizes")
    .select("*")
    .then(function(prizes){
        controller.prizes = prizes
        knex("cook_application")
        .select("team_name", "event_name", "event_date", "first_place_in","img_url")
        .whereNotNull("img_url")
        .andWhere("approved", 1)
        .andWhere("submitted_at",">","2019-01-01 00:00:01")
        .andWhere("event_date","REGEXP"," 20(19|[2-9][0-9])$")
        .orderByRaw('RAND()')
        .limit(20)
        .then(function(data){
            /*
            generate paypal token and pass it to the front end
            test info:
            steve-buyer-1@jwilbur.com
            Test1234

            steve@jwilbur.com

            https://sandbox.paypal.com
           */
            gateway.clientToken.generate({}, function (err, response) {
                controller.winners = data;
                controller.ppToken = response.clientToken;
                res.render('subpage', controller);
            });
        })
    })
});

router.post("/sharemywin",function(req,res,next){
    controller.current= "committed-cooks";
    controller.intent="submit-win";
    controller.title = "Smokin With Smithfield | Committed Cooks Program"
    res.locals.hideBbqChampLogo = true;
    let ip_address = req.header('x-forwarded-for') || req.connection.remoteAddress;
    var form = new formidable.IncomingForm();
    form.parse(req, function(err, fields, files) {
        console.log(util.inspect({fields: fields, files: files}));
        knex('cook_application')
        .select()
        .then(function(){
            var s3_img_url;
            if(files.photo_file.name){
                let id=uuid.v1();
                let extension = files.photo_file.name.substring(files.photo_file.name.lastIndexOf('.'));
                uploadToS3(files.photo_file, id, extension);
                s3_img_url = "https://"+config.aws.S3_BUCKET+".s3.amazonaws.com/"+id+extension
                console.log("img url: " + s3_img_url);
            }
            else{
                console.log("no image");
            }

            knex('cook_application').insert({
                cook_name: fields.cook_name,
                team_name: fields.team_name,
                contact_address:fields.contact_address,
                contact_phone:fields.contact_phone,
                contact_email: fields.contact_email,
                event_name:fields.event_name,
                event_date:fields.event_date,
                first_place_in:fields.first_place_in,
                prize_selection:fields.prize_selection,
                img_url: s3_img_url,
                a180: fields.a180,
                ip:ip_address,
                submitted_at: moment().format('YYYY-MM-DD HH:mm:ss'),
            })
            .then(function(){
                console.log("added to database")
                res.render('subpage', controller);
            })
            .catch(function(err){console.log(err)})

            knex('prizes').select()
            .where("prize_name", fields.prize_selection )
            .increment('prize_hold', 1)
            .then(function(){
                console.log("updated hold quantity")
            })
            .catch(function(err){console.log(err)})
        })
      })
})

router.post("/committed-cooks-application", function(req,res,next){
    //ajax post
    //redirects on the front end if successfull
    console.log("Committed Cooks submission");
    //console.log(req.body)
    let ip = req.header('x-forwarded-for') || req.connection.remoteAddress;
    let has_paid = "false"
    let transaction = "";
    let now = moment().format("YYYY-MM-DD HH:mm:ss");
    knex("committed_cooks")
    .select("*")
    .insert({
        first_name: req.body.first_name,
        last_name: req.body.last_name,
        email: req.body.email,
        contact_address: req.body.contact_address,
        contact_city: req.body.contact_city,
        contact_state: req.body.contact_state,
        contact_zipcode: req.body.contact_zipcode,
        phone: req.body.phone,
        team_name: req.body.team_name,
        number_of_team_members: req.body.number_of_team_members,
        number_of_team_members_othertext: req.body.number_of_team_members_othertext,
        sanctioning_body: Array.isArray(req.body.sanctioning_body) ? req.body.sanctioning_body.join('|') : req.body.sanctioning_body,
        sanctioning_body_othertext: req.body.sanctioning_body_othertext,
        sanctioning_body_number_name: req.body.sanctioning_body_number_name,
        sanctioning_body_number: req.body.sanctioning_body_number,
        website: req.body.website,
        instagram: req.body.instagram,
        food_service_operator: !isNaN(parseInt(req.body.food_service_operator)) ? parseInt(req.body.food_service_operator) : 0,
        business_name: req.body.business_name,
        business_address: req.body.business_address,
        business_city: req.body.business_city,
        business_state: req.body.business_state,
        business_zipcode: req.body.business_zipcode,
        products_opt_in: !isNaN(parseInt(req.body.products_opt_in)) ? parseInt(req.body.products_opt_in) : 0,
        mailing_list_opt_in: !isNaN(parseInt(req.body.mailing_list_opt_in)) ? parseInt(req.body.mailing_list_opt_in) : 0,
        bbqcup_opt_in: req.body.bbqcup_opt_in,
        readtandc: req.body.readtandc,
        submit_date: now,
        ip_address:ip,
        ua: req.headers['user-agent'],
    })
    .returning("id")
    .then(function(data){
        res.json({success:data})
    })
    .catch(function(err){
        console.log(err)
        res.status(500).json({error:"There was a problem"})
    })
})

router.post("/committed-cooks-payment", function(req,res,next){
    // sendreport(req.body.id);
    console.log("Committed Cooks paypal submission");
    //console.log(req.body)
    let saleRequest = {
        amount: 25.00,
        merchantAccountId: "USD",
        paymentMethodNonce: req.body.nonce,
        descriptor: {
        name: "smthfld*committedcooks"
        },
        options: {
        submitForSettlement: true,
        paypal: {
            description: "Smithfield BBQ Registration"
        }
        }
    };
    gateway.transaction.sale(saleRequest, function (err, result) {
        if(!result.success){
            //something went wrong
            console.log(err);
            //res.status(500).json({error:"Something went wrong. Please retry your submission"})
        }
        else{
            transaction=JSON.stringify(result.transaction);
            //update paypal result
            knex("committed_cooks")
                .select("*")
                .where({
                    id:req.body.id,
                    email:req.body.email
                })
                .update({
                    paypal_transaction: transaction,
                    has_paid: true
                })
                .then(function(pdata){
                    res.status(200).json({success:"success"})
                    sendreport(req.body.id)
                })
        }
    });
})


router.get("/committed-cooks-thanks",function(req,res,next){
    controller.current= "committed-cooks-thanks";
    controller.intent="committed-cooks-thanks";
    controller.title = "Smokin With Smithfield | Committed Cooks Program"
    res.locals.hideBbqChampLogo = true;
    res.render('subpage', controller);
});

// router.get("/grant-success",function(req,res,next){
//     controller.current= "grant-success";
//     controller.intent="grant-success";
//     controller.title = "Smokin With Smithfield | Grants"
//     res.locals.hideBbqChampLogo = true;
//     res.render('subpage', controller);
// });

/* Team stuff */
router.get("/team/edit/:bbqdata_team_id?",ensureAuthenticated, getMyTeamId, function(req,res,next){
    if(req.user.role != "admin" && req.user.role != "headchef" || req.canedit != true){
        res.redirect("/")
    }
    else{
        knex("standings")
        .select(
            "bbqdata_team_id",
            "teams.team_name",
            "head_chef",
            "team_members",
            "last_points_contest_name",
            "last_points_earned",
            "place",
            "last_points_contest_placed"
        )
        .where({
            bbqdata_team_id: req.params.bbqdata_team_id
        })
        .join("teams", "teams.bbqdata_id","=", "bbqdata_team_id")
        .orderBy("last_points_contest_end_date", "asc")
        .then(teamdata=>{
            let cooknumber = ""
            if(req.cooknumber){
                cooknumber = JSON.parse(req.cooknumber)
            }
            res.locals.canedit = true
            res.locals.isediting =true
            res.locals.cooknumber = cooknumber
            controller.title = "SWS 2019 Race to the Cup | " + teamdata[0].team_name
            res.locals.hideBbqChampLogo = true;
            controller.intent = "team"
            controller.team_name= teamdata[0].team_name
            controller.team_id = teamdata[0].bbqdata_team_id
            controller.headchef = teamdata[0].head_chef
            controller.team = teamdata[0].team_members
            controller.events = removeDuplicates(teamdata, "last_points_contest_name")
            res.render("subpage", controller)
        })
        .catch(err=>{
            console.log(err)
        })
    }
})

router.post("/team/edit/:bbqdata_team_id?", ensureAuthenticated, getMyTeamId, function(req,res,next){
    if(req.headers.referer != undefined || ref.indexOf("/team/edit") != -1){
        if(req.params.bbqdata_team_id != req.team_id && req.user.role != "amin"){
            res.redirect("/")
        }
        knex("teams")
        .update({
            head_chef:req.body.headchefname,
            team_members:req.body.teammembers
        })
        .where({
            bbqdata_id:req.params.bbqdata_team_id
        })
        .then(success=>{
            controller.intent = "editsuccess"
            controller.title = "SWS 2019 Race to the Cup | Edit Successful!"
            res.locals.hideBbqChampLogo = true;
            res.locals.team_id = req.params.bbqdata_team_id
            res.render("subpage", controller)
        })
        
    }
    else{
        console.log("no referrers - direct request: " + ip + " | " + now)
        //res.redirect("/")
        res.json({error:"error!"})
    }
})

router.get("/team/:bbqdata_team_id?/:teamname?",getMyTeamId, async function(req,res, next){
    controller.current= "team";
    // let last_sync = await knex("bbq_events").select("last_sync").orderBy("last_sync", "desc").limit(1);
    // knex("bbq_events")
    // .select(
    //     "contest_name",
    //     "points",
    //     "contest_placed"
    // )
    // .where({
    //     bbqdata_team_id: req.params.bbqdata_team_id,
    //     last_sync: last_sync[0].last_sync,
    //     points_used: 1
    // })
    // .then(data => {
    //     controller.events = data
    // })
    knex("standings")
    .select(
        "bbqdata_team_id",
        "teams.team_name",
        "head_chef",
        "team_members",
        "last_points_contest_name",
        "last_points_earned",
        "place",
        "last_points_contest_placed"
    )
    .where({
        bbqdata_team_id: req.params.bbqdata_team_id
    })
    .join("teams", "teams.bbqdata_id","=", "bbqdata_team_id")
    .orderBy("last_points_contest_end_date", "asc")
    .then(teamdata=>{
        if(req.canedit == true){
            res.locals.canedit = true
            res.locals.cooknumber = req.cooknumber
        }
        controller.title = "SWS 2019 Race to the Cup | " + teamdata[0].team_name
        res.locals.hideBbqChampLogo = true;
        controller.intent = "team"
        controller.team_name= teamdata[0].team_name
        controller.team_id = teamdata[0].bbqdata_team_id
        controller.headchef = teamdata[0].head_chef
        controller.team = teamdata[0].team_members
        // controller.events = removeDuplicates(controller.events, "last_points_contest_name")

        var teamStandingsUrl = "https://bbqdata.com/v1/smithfield_team_details?bbqdata_team_id=" + controller.team_id + "&api_key=QmxtvQIfoiMiwbjmVf0Gvgtt"
        request(teamStandingsUrl, function (error, response, body) {
            if(error) {
                console.log('error:', error); 
            }
            console.log(body.replace(/\\/g,""));
            var points = JSON.parse(body.replace(/\\/g,"").replace("	\"","\""));
            console.log(points);
            var truePoints = points.points_details.filter(x => x.points_used === true);
            controller.events = truePoints;
            
            res.render("subpage", controller)
        });

    })
    .catch(err=>{
        console.log(err)
        controller.title = "SWS 2019 Race to the Cup | Not Team Found"
        res.locals.hideBbqChampLogo = true;
        controller.intent = "noteam"
        res.render("subpage", controller)
    })
});
function removeDuplicates(originalArray, prop) {
    var newArray = [];
    var lookupObject  = {};

    for(var i in originalArray) {
       lookupObject[originalArray[i][prop]] = originalArray[i];
    }

    for(i in lookupObject) {
        newArray.push(lookupObject[i]);
    }
     return newArray;
}
function getMyTeamId(req,res,next){
    if(!req.user || req.user.role != "headchef" && req.user.role != "admin"){
        next()
    }
    else if(req.user.role == "admin"){
        console.log("is an admin")
        req.canedit = true
        next()
    }
    else{
        console.log("is a head chef")
        knex("users")
        .select("team_id", "cooknumber")
        .limit(1)
        .where({
            team_id:req.params.bbqdata_team_id
        })
        .then(data=>{
            if(data[0] && data[0].team_id == req.params.bbqdata_team_id){
                req.canedit = true
                req.team_id = data[0].team_id
                req.cooknumber = data[0].cooknumber
            }
            next();
        })
        .catch(err=>{
            console.log(err)
            next()
        })
    }
}
/* End team stuff */

router.get("/privacy-policy", function(req,res,next){
    controller.current = "privacy";
    controller.intent = "privacy"
    controller.title = "Smokin With Smithfield | Privacy Policy"
    res.locals.hideBbqChampLogo = true;
    res.render("subpage", controller)
})

router.get('/national-barbecue-championship', async function(req, res, next) {
    controller.current= "race-to-the-cup";
    controller.intent="race"
    controller.title = "Smokin With Smithfield | SWW 2019 National Barbeque Championship"
    res.locals.hideBbqChampLogo = true;
    let last_sync = await knex("standings").select("last_sync").orderBy("last_sync", "desc").limit(1);
    res.locals.shareImg="https://http://www.smokinwithsmithfield.com/images/SWS_NBC_LeaderBoard.jpg"
    res.locals.description="Who’s on top? Check out our leaderboard to see who’s in the running to win the #SmokinWithSmithfield National Barbeque Championship!"
    //console.log(chalk.blue(last_sync[0].last_sync));

    controller.standings = await knex("standings")
        .select("*")
        .orderBy("place", "asc")
        .where({
            last_sync:last_sync[0].last_sync
        })
        .limit(30)

    controller.events = await knex("standings")
        .select("team_name", "last_points_contest_name", "points","bbqdata_team_id", "last_points_contest_end_date","last_points_contest_end_date", "last_points_contest_placed","orgs","last_points_contest_org")
        .orderBy("last_points_contest_end_date", "desc")
        .where({
            last_sync:last_sync[0].last_sync,
            last_points_contest_placed: 1
        })
        .offset(0)
        .limit(10)
        .catch(err=>{console.log(err)})

    controller.point_gainers = await knex("standings")
        .select("*")
        .where({
            last_sync:last_sync[0].last_sync
        })
        .orderBy("last_points_earned", "desc")
        .limit(10)

    // temp for static leaderboard
    controller.standings = [
        {"place":"Grand Champion","team_name":"Rio Valley Meats BBQ","head_cook":"Fred Robles"},
        {"place":"Reserve Grand Champion","team_name":"BUCKSHOT BBQ – TX","head_cook":"Jayde Henley"},
        {"place":"3rd","team_name":"IOWA'S SMOKEY D'S BBQ","head_cook":"Darren Warth"},
        {"place":"4th","team_name":"Cajun Blaze","head_cook":"Adam Gautreau"},
        {"place":"5th","team_name":"SHAKE 'N BAKE BBQ","head_cook":"Tim Scheer"},
        {"place":"6th","team_name":"Heavy Smoke","head_cook":"Chris Schafer"},
    ];
    
    console.log(controller);
    res.render("subpage", controller)

});

router.get("/events/:page?", async function(req,res,next){
    controller.current= "race-to-the-cup";
    controller.intent = "events"
    controller.title = "Smokin With Smithfield | SWS 2019 Recent Event Winners"
    res.locals.hideBbqChampLogo = true;
    let last_sync = await knex("standings").select("last_sync").orderBy("last_sync", "desc").limit(1);
    let standingsCount = await knex("standings").where({last_sync:last_sync[0].last_sync}).count('last_sync as count');
    controller.pages = Math.ceil(standingsCount[0].count / 10)
    controller.currentPage = req.params.page || 1
    let offset = (parseInt(req.params.page)-1) * 10
    if(req.params.page && req.params.page == 1){ offset = 0}

    res.locals.events = await knex("standings")
        .select("team_name", "last_points_contest_name", "points","bbqdata_team_id", "last_points_contest_end_date","last_points_contest_end_date", "last_points_contest_placed", "last_points_contest_org")
        .orderBy("last_points_contest_end_date", "desc")
        .where({
            last_sync:last_sync[0].last_sync
        })
        .offset(offset)
        .limit(10)
        .catch(err=>{console.log(err)})

    res.render("subpage", controller)
})

// router.get("/standings/:page?", async function(req,res,next){
//     controller.current= "race-to-the-cup";
//     controller.intent = "standings"
//     controller.title = "Smokin With Smithfield | Current Standings"
//     let last_sync = await knex("standings").select("last_sync").orderBy("last_sync", "desc").limit(1);
//     let standingsCount = await knex("standings").where({last_sync:last_sync[0].last_sync}).count('last_sync as count');
//     controller.pages = Math.ceil(standingsCount[0].count / 10)
//     controller.currentPage = req.params.page || 1
//     let offset = (parseInt(req.params.page)-1) * 10
//     if(req.params.page && req.params.page == 1){ offset = 0}



//     controller.standings = await knex("standings")
//         .select("*")
//         .orderBy("place", "asc")
//         .where({
//             last_sync:last_sync[0].last_sync
//         })
//         .offset(offset)
//         .limit(10)
//         .catch(err=>{console.log(err)})
//     //console.log(chalk.blue("got " + controller.pages + " pages"))

//     res.render("subpage", controller)
// })

router.post("/standings/results", async function(req,res,next){
    controller.current= "race-to-the-cup";
    controller.intent = "standings"
    controller.title = "Smokin With Smithfield | Results: " + req.body.search
    res.locals.hideBbqChampLogo = true;
    res.locals.search = req.body.search
    let last_sync = await knex("standings").select("last_sync").orderBy("last_sync", "desc").limit(1);
    controller.standings = await knex("standings")
        .select("*")
        .where({
            last_sync:last_sync[0].last_sync
        })
        .where('team_name', 'like', `%${req.body.search}%`)

    res.render("subpage", controller)
});


router.get("/pointchanges/:page?", async function(req,res,next){
    controller.current= "race-to-the-cup";
    controller.intent = "pointchanges"
    controller.title = "Smokin With Smithfield | Point Gainers"
    res.locals.hideBbqChampLogo = true;
    let last_sync = await knex("standings").select("last_sync").orderBy("last_sync", "desc").limit(1);
    let standingsCount = await knex("standings").where({last_sync:last_sync[0].last_sync}).count('last_sync as count');
    controller.pages = Math.ceil(standingsCount[0].count / 10)
    controller.currentPage = req.params.page || 1
    let offset = (parseInt(req.params.page)-1) * 10
    if(req.params.page && req.params.page == 1){ offset = 0}

    controller.pointchanges = await knex("standings")
        .select("team_name", "last_points_earned", "points","bbqdata_team_id")
        .orderBy("last_points_earned", "desc")
        .where({
            last_sync:last_sync[0].last_sync
        })
        .offset(offset)
        .limit(10)
        .catch(err=>{console.log(err)})


    res.render("subpage", controller)
})

router.get("/grant-program", function(req,res,next){
    controller.current= "grants";
    controller.intent = "grants"
    controller.title = "Smokin With Smithfield | Grants"
    res.locals.hideBbqChampLogo = true;
    res.render("grant-form", controller)

})

// router.post("/grant", function(req,res,next){
//     console.log("Grant submission");
    
//     const { body } = req;
//     const {
//         first_name,
//         last_name,
//         phone,
//         email,
//         type_of_grant,
//         event_name,
//         event_date,
//         event_city,
//         event_state,
//         event_website,
//         event_how_long,
//         event_charities,
//         event_activities,
//         "event_activities-othertext": event_activities_othertext,
//         event_attendance,
//         event_open_to_public,
//         event_admission,
//         "event_admission-text": event_admission_text,
//         event_sanctioning,
//         event_automatic_qualifier,
//         "event_automatic_qualifier-text": event_automatic_qualifier_text,
//         event_teams,
//         event_judges,
//         event_entry_fee,
//         event_prize_purse,
//         event_prize_disbursed,
//         event_other_categories,
//         "event_other_categories-othertext": event_other_categories_othertext,
//         event_backyard_bbq,
//         "event_backyard_bbq-text": event_backyard_bbq_text,
//         event_brand_sponsors,
//         "event_brand_sponsors-text": event_brand_sponsors_text,
//         event_retail_partners,
//         "event_retail_partners-text": event_retail_partners_text,
//         event_promotion,
//         "event_promotion-website": event_promotion_website,
//         "event_promotion-socialmedia": event_promotion_socialmedia,
//         "event_promotion-othertext": event_promotion_othertext,
//         event_past_media_partners,
//         "event_past_media_partners-text": event_past_media_partners_text,
//         event_current_media_partners,
//         event_why_do_you_believe,
//         event_additional_documentation_ids,
//         event_additional_documentation_names
//     } = body;

//     const data = {
//         first_name,
//         last_name,
//         phone,
//         email,
//         type_of_grant,
//         event_name,
//         event_date,
//         event_city,
//         event_state,
//         event_website,
//         event_how_long,
//         event_charities,
//         event_activities: Array.isArray(event_activities) && event_activities.filter(o => !o.toLowerCase().startsWith('other')).join('|'),
//         "event_activities-othertext": event_activities_othertext,
//         event_attendance,
//         event_open_to_public,
//         event_admission,
//         "event_admission-text": event_admission_text,
//         event_sanctioning,
//         event_automatic_qualifier,
//         "event_automatic_qualifier-text": event_automatic_qualifier_text,
//         event_teams,
//         event_judges,
//         event_entry_fee,
//         event_prize_purse,
//         event_prize_disbursed,
//         event_other_categories: Array.isArray(event_other_categories) && event_other_categories.filter(o => !o.toLowerCase().startsWith('other')).join('|'),
//         "event_other_categories-othertext": event_other_categories_othertext,
//         event_backyard_bbq,
//         "event_backyard_bbq-text": event_backyard_bbq_text,
//         event_brand_sponsors,
//         "event_brand_sponsors-text": event_brand_sponsors_text,
//         event_retail_partners,
//         "event_retail_partners-text": event_retail_partners_text,
//         event_promotion: Array.isArray(event_promotion) && event_promotion.filter(o => !o.toLowerCase().startsWith('other')).join('|'),
//         "event_promotion-website": event_promotion_website,
//         "event_promotion-socialmedia": event_promotion_socialmedia,
//         "event_promotion-othertext": event_promotion_othertext,
//         event_past_media_partners,
//         "event_past_media_partners-text": event_past_media_partners_text,
//         event_current_media_partners,
//         event_why_do_you_believe,
//         event_additional_documentation_ids,
//         event_additional_documentation_names,
//         timestamp: moment().format("YYYY-MM-DD HH:mm:ss"),
//         year: 2020
//     }

//     knex("grant_applications")
//     .insert(data)
//     .then(function(){
//         res.redirect('/grant-success');
//     })
//     .catch(function(err){
//         console.log(err);
//         res.status(500).json({error:"There was a problem"})
//     });
// })

router.post('/s3upload', (req, res) => {
    new formidable.IncomingForm().parse(req, function(err, fields, files) {
        const { file } = files;

        if (!file) return res.status(422).json({error: 'Missing file'});

        const id = uuid.v1();
        const extension = file.name.substring(file.name.lastIndexOf('.'));

        uploadToS3(file, id, extension);

        res.json({ success: true, id: id + extension });
    });
});

// router.get('/judging-application', function(req, res, next) {
//     controller.current= "Judging Application";
//     controller.intent="judge";
//     controller.title = "Judging Application"
//     res.render("subpage", controller)
// });

// router.post('/judging-application', function(req, res, next){
//     console.log(req.body)
//     knex("judge_applications")
//     .insert({
//         first_name:req.body.first_name,
//         last_name:req.body.last_name,
//         contact_address:req.body.contact_address,
//         contact_city:req.body.contact_city,
//         contact_state:req.body.contact_state,
//         contact_zipcode:req.body.contact_zipcode,
//         phone:req.body.phone,
//         cellphone:req.body.cellphone,
//         email:req.body.email,
//         physically:req.body.physically,
//         present:req.body.present,
//         volunteer:req.body.volunteer,
//         judged:req.body.judged,
//         startedjudging:req.body.startedjudging,
//         master:req.body.master,
//         tablecaptain:req.body.tablecaptain,
//         captainnumber:req.body.captainnumber,
//         sanctioning_body:JSON.stringify(req.body.sanctioning_body),
//         sanctioning_body_othertext:req.body.sanctioning_body_othertext,
//         essay1:req.body.essay1,
//         essay2:req.body.essay2
//     })
//     .then(function(data){
//         controller.current= "Judging Application";
//         controller.intent="judge-success";
//         controller.title = "Judging Application Submission Success"
//         res.render("subpage", controller)
//     })
//     .catch(err=>{
//         console.log(err)
//         next(new Error("Can't insert to judge_applications"))
//     });

// });

/* CMS Routes */
//ghost page for sharing to facebook
router.get("/share/:url", function(req, res, next){
    //callback page for custom facebook shares.
    //renders a fake page full of social stuff for facebook and then redirects normal people to the page passed in
    console.log(req.params);
    res.render("share",{share:req.params})
});


//catch any unhandled urls, and try to find a cms entry
/*
Future plans - see if we can make functions out of these calls,
and make the routes more efficient
*/
router.get("/:slug", function(req, res, next){
    if(req.params.slug){
        //console.log("looking for a slug")
        cm.getPageBySlug(req.params.slug)
        .then(function(page){
            controller.intent = "content_single"
            controller.current = req.params.slug
            controller.title = page.title
            controller.content= page
            controller.template = page.template
            let meta = []
            if(page.meta){
                meta = JSON.parse(page.meta)
                controller.meta = meta[0]
            }
            res.render(page.template, controller);
        })
        .catch(function(err){
            //console.log(err)
            next()
        })
    }

})

//get a page with a parent
router.get("/:parent_slug/:slug", function(req,res,next){
    cm.getPageBySlug(req.params.slug)
    .then(function(page){
        controller.intent = "content_single"
        controller.current = req.params.parent_slug
        controller.title = page.title
        controller.content= page
        controller.template = page.template
        controller.parents= req.params.parent_slug
        let meta = []
        if(page.meta){
            meta = JSON.parse(page.meta)
            controller.meta = meta[0]
        }
        res.render(page.template, controller);
    })
    .catch(function(err){
        next()
    })
})

//get a page with two parents
router.get("/:parent_slug/:secondary/:slug", function(req,res,next){
    cm.getPageBySlug(req.params.slug)
    .then(function(page){
        controller.intent = "content_single"
        controller.current = req.params.parent_slug
        controller.title = page.title
        controller.content= page
        controller.template = page.template
        let meta = []
        if(page.meta){
            meta = JSON.parse(page.meta)
            controller.meta = meta[0]
        }
        controller.parents=[params.parent_slug, params.secondary]
        res.render(page.template, controller);
    })
    .catch(function(err){
        console.log(err)
        next()
    })
})

//get posts by post type
//since this rolls up everything with the same post type, it has it's own handler.
router.get("/:post_type", function(req,res,next){
    //console.log("looking for posts by type")
    controller.current= req.params.post_type
    knex("content_post_types")
    .select("*")
    .where({
        slug:req.params.post_type,
    })
    .then(function(posts){
        if(posts.length == 0){
            next()
        }
        else{
            console.log(posts)
            knex("content_manager")
            .select("status", "post_slug", "title", "post_excerpt","post_featured_thumbnail","post_type")
            .where({
                post_type:req.params.post_type,
                status: "publish",
            })
            .join("post_content","content_manager.post_contentID", "=", "post_content.content_id")
            .orderBy("post_order", "asc")
            .then(function(content){
                //console.log(content)
                controller.intent="content_multiple_bytype"
                controller.current = req.params.post_type
                controller.title=posts[0].title
                controller.parent = posts[0]
                let meta = []
                if(posts[0].meta){
                    meta = JSON.parse(posts[0].meta)
                    controller.meta = meta[0]
                }
                controller.content = content
                controller.template = req.params.post_type
                res.render(posts[0].template, controller);
            }).catch(function(err){
                console.log(err);
                res.redirect("/").end()
            })
        }
    })
})

router.get("/:post_type/:slug", function(req,res,next){
    //console.log("looking for a post type slug")
    knex("content_post_types")
    .select("*")
    .where({
        slug:req.params.post_type,
    })
    .then(function(posts){
        if(posts.length!=0){
            cm.getPageBySlug(req.params.slug)
            .then(function(page){
                console.log(page)
                controller.intent = "content_single"
                controller.current = req.params.post_type
                controller.title = page.title
                controller.content= page
                controller.template = page.template
                let meta = []
                if(page.meta){
                    meta = JSON.parse(page.meta)
                    controller.meta = meta[0]
                }
                res.render(page.template, controller);
            })
            .catch(function(err){
                console.log(err)
                next()
            })
        }
        else{
            next()
        }
    })
})

//ajax contact
router.post("/contact", checkCaptcha, function(req, res, next) {
    //ajax send a contact us email.
    //this may be replaced by zendesk in the future
    console.log(req.body)
    console.log(req.user)
    var api_key = config.mailgun.key
    var domain = config.mailgun.domain;
    var mailgun = new Mailgun({ apiKey: config.mailgun.key, domain: config.mailgun.domain });
    let now = new moment.tz("America/New_York");
    let ip = req.header('x-forwarded-for') || req.connection.remoteAddress;

    var subject = "Contact Us Request - " + config.domainname;
    var emailFrom = "admin@smokinwithsmithfield.com"
    if(req.body.reportaproblem){
        subject = "BBQ Team problem report - " + config.domainname;
        emailFrom = "BBQTeam@smokinwithsmithfield.com"
    }
	var emailTo = [config.contactemail, ...config.additionalContactEmails];
	
	var emailBody = `${req.body.message} <br/><br/>
	From: ${req.body.email} <br/><br/>
	Sent: ${now} <br/>
    UA: ${req.headers['user-agent']} <br/>
    IP Address: ${ip}
    `;
    if(req.user){
        emailBody += "<h4>Logged in user information:</h4>";
        emailBody += "User Name: " + req.user.displayName + "<br/>"
        emailBody += "User Id: " + req.user.user_id + "<br/>"
    }

	var data = {
		from: emailFrom,
		to: emailTo,
		subject: subject,
		html: emailBody
    };

	mailgun.messages().send(data, function(err, body) {
		if (err) {
			//console.log(now + " - got an error: ", err);
			res.status(500).json({ error: err });
		}
		else {
			//console.log(body);
			//console.log("email sent!");
			res.status(200).json({success:"email sent"});
		}
	});
});

//misc utilities
function sendreport(id){
    var mailgun = new Mailgun({ apiKey: config.mailgun.key, domain: config.mailgun.domain });
    let now = moment().format("YYYY-MM-DD HH:mm:ss");

    knex("committed_cooks")
    .select("*")
    .where({
        id:id
    })
    .then(function(report){
        let arr = report[0]
        let body = `
        <h1>New Committed Cooks Form Entry</h1>
        <p>The following information has been submitted:</p>
        <table>
            <tr><td>First Name:</td><td>${arr.first_name}</td></tr>
            <tr><td>Last Name:</td><td>${arr.last_name}</td></tr>
            <tr><td>Phone:</td><td>${arr.phone}</td></tr>
            <tr><td>Contact Address:</td><td>${arr.contact_address}</td></tr>
            <tr><td>Contact City:</td><td>${arr.contact_city}</td></tr>
            <tr><td>Contact State:</td><td>${arr.contact_state}</td></tr>
            <tr><td>Contact Zipcode:</td><td>${arr.contact_zipcode}</td></tr>
            <tr><td>Phone:</td><td>${arr.phone}</td></tr>
            <tr><td>Email:</td><td>${arr.email}</td></tr>
            <tr><td colspan="2"><hr/></td></tr>
            <tr><td>Team name:</td><td>${arr.team_name}</td></tr>
            <tr><td>Number of team_members:</td><td>${arr.number_of_team_members}</td></tr>
            <tr><td>More than six - Number of members:</td><td>${arr.number_of_team_members_othertext}</td></tr>
            <tr><td>Sanctioning body:</td><td>${arr.sanctioning_body}</td></tr>
            <tr><td>Unlisted Sanctioning Body:</td><td>${arr.sanctioning_body_othertext}</td></tr>
            <tr><td>Main Sanctioning Body: </td><td>${arr.sanctioning_body_number_name}</td></tr>
            <tr><td>Main Sactioning Body Head Cook Number: </td><td>${arr.sanctioning_body_number}</td></tr>
            <tr><td>Website:</td><td>${arr.website}</td></tr>
            <tr><td>Instagram: </td><td>${arr.instagram}</td></tr>
            <tr><td colspan="2"><hr/></td></tr>
            <tr><td>Food service operator:</td><td>${arr.food_service_operator}</td></tr>
            <tr><td>Business Name:</td><td>${arr.business_name}</td></tr>
            <tr><td>Business Address:</td><td>${arr.business_address}</td></tr>
            <tr><td>Business City: </td><td>${arr.business_city}</td></tr>
            <tr><td>Business state:</td><td>${arr.business_state}</td></tr>
            <tr><td>business Zipcode: </td><td>${arr.business_zipcode}</td></tr>
            <tr><td colspan="2"><hr/></td></tr>
            <tr><td>Products Opt In:</td><td>${arr.products_opt_in}</td></tr>
            <tr><td>Mailing List Opt In:</td><td>${arr.mailing_list_opt_in}</td></tr>
            <tr><td>BBQ Cup Opt In:</td><td>${arr.bbqcup_opt_in}</td></tr>
            <tr><td>Read The Terms and Conditions:</td><td>${arr.readtandc}</td></tr>
            <tr><td>Submit Tim: </td><td>${arr.now}</td></tr>
            <tr><td>Has Paid:</td><td>${arr.has_paid}</td></tr>
        </table>
        <hr/>
        <strong>Sender Info:</strong><br/>
        UA: ${arr.ua} <br/>
        IP Address: ${arr.ip_address}<br/>
        Sent Time: ${now}
        `

        var subject = "New Committed Cooks Form Entry";
        var emailTo = [
            'katie.ancheta@edgemarketingnet.com',
            'steve@jwilbur.com',
            'pam@jwilbur.com',
            'bbq@smithfield.com'
        ];
        // var emailTo = "nickjantz@upshotmail.com"
        var emailFrom = "committedcooks@smokinwithsmithfield.com"
        var emailBody = body;

        var data = {
            from: `committedcooks@${config.mailgun.domain}`,
            to: emailTo,
            subject: subject,
            html: emailBody
        };

        mailgun.messages().send(data, function(err, body) {
            if (err) {
                console.log(now + " - got an error: ", err);
                //res.status(500).json({ error: err });
            }
            else {
                //console.log(body);
                console.log("report sent!");
                //res.status(200).json({success:"email sent"});
            }
        });
    })
    .catch(err=>{console.log(err)})
}


function uploadToS3(file, uuid, ext) {
    //get file object from the request, the generated uuid, and the extension
    let s3bucket = new AWS.S3({
      accessKeyId: config.aws.AWS_ACCESS_KEY,
      secretAccessKey: config.aws.AWS_SECRET_KEY,
      Bucket: config.aws.S3_BUCKET,
    });
    var params = {
      Bucket: config.aws.S3_BUCKET,
      Key: uuid+ext,
      Body: fs.createReadStream(file.path),
    };
    s3bucket.upload(params, function (err, data) {
      if (err) {
        console.log('error in callback');
        console.log(err);
      }
      console.log('s3 upload success');
    });
}



console.log("  Index loaded");
module.exports = router;
