//requires for this route
var express = require("express");
var router = express.Router();
var config = require("../config");
var knex = require("knex").knex;
knex.knex = knex(config.connection);
var moment = require("moment");
var timezonemoment = require("moment-timezone");
var request = require("request");
var fs = require("fs");
var formidable = require("formidable");
var util = require("util");
var uuid = require("uuid");
var jwt = require("jsonwebtoken");
var excel = require("node-excel-export");
var cookieParser = require("cookie-parser");
var jimp = require("jimp");
var uploader = require("../lib/upload");
var isAdmin = require("../middleware/isAdmin");
var cacheAdminItems = require("../middleware/cacheAdminItems");
var isLocalHost = require("../middleware/isLocalHost");
var checkUser = require("../middleware/user");
var bcrypt = require("bcryptjs");
var chalk = require("chalk")

//local variables for the route
var oauthSecret = config.oauthsecret;

let controller = {
	current: "admin",
	title: "Admin Panel",
	nav: config.nav,
	footernav:config.footernav,
	meta:[],
};

//middleware
router.use(checkUser);
router.use(isAdmin(controller));
router.use(cacheAdminItems(controller, knex));
router.use(isLocalHost(controller));


/* 
Welcome to the admin section.
*/

router.get("/", function(req, res, next) {
	controller.intent = "";
	res.render("admin", controller);
});


/* These are placeholder routes for future implementation*/
router.get("/menu-manager", function(req, res, next) {
	//manage active menus
	controller.user = req.user;
	controller.intent = "menu-manager";
	res.render("admin", controller);
});
router.get("/dumpster", function(req, res, next) {
	//manage trash
	controller.user = req.user;
	controller.intent = "dumpster";
	res.render("admin", controller);
});
router.get("/options", function(req, res, next) {
	//manage site options
	controller.user = req.user;
	controller.intent = "options";
	res.render("admin", controller);
});
router.get("/reports", function(req, res, next) {
	//manage site options
	controller.user = req.user;
	controller.intent = "reports";
	res.render("admin", controller);
});

//reports
const export_styles = {
	headerDark: {
	  fill: {
		fgColor: {
		  rgb: 'FF000000'
		}
	  },
	  font: {
		color: {
		  rgb: 'FFFFFFFF'
		},
		sz: 14,
		bold: true,
		underline: true
	  }
	},
	cellGreen: {
	  fill: {
		fgColor: {
		  rgb: 'FF00FF00'
		}
	  }
	},
	cellRed:{
	  fill:{
		fgColor:{
		  rgb:'FFFF0000'
		}
	  }
	}
};

router.get("/exports/registrations", function(req, res, next) {
	let now = new moment().format("YYYY-MM-DD-HH-mm-ss");
	knex('cook_application')
	.select('*')
	.where("id",">","152")
	.then(function(data) {
		var numOfEntries = Object.keys(data).length
		const specification = {
			cook_name: { // <- the key should match the actual data key 
			  displayName: 'Cook Name', // <- Here you specify the column header 
			  headerStyle: export_styles.headerDark, // <- Header style 
			  width: 120 // <- width in pixels 
			},
			team_name: {
			  displayName: 'Team name',
			  headerStyle: export_styles.headerDark,
			  width: 120
			},
			contact_address: {
			  displayName: 'Address',
			  headerStyle: export_styles.headerDark,
			  width: 220 // <- width in pixels 
			},
			contact_phone: {
			  displayName: 'Phone',
			  headerStyle: export_styles.headerDark,
			  width: 50 // <- width in pixels 
			},
			contact_email:{
			  displayName:"Email",
			  headerStyle: export_styles.headerDark,
			  width: 120},
			event_name:{
				displayName:"Event Name",
				headerStyle: export_styles.headerDark,
				width: 120},
			event_date:{
			  displayName:"Event Date",
			  headerStyle: export_styles.headerDark,
			  width: 120},
			first_place_in:{
			  displayName:"First Place In",
			  headerStyle: export_styles.headerDark,
			  width: 120},
			prize_selection:{
			  displayName:"Prize Selection",
			  headerStyle: export_styles.headerDark,
				width: 120},
			a180:{
				displayName:"Recieved A 180",
				headerStyle: export_styles.headerDark,
				width: 120},
			submitted_at:{
			  displayName:"Submitted At",
			  headerStyle: export_styles.headerDark,
			  width: 120},  
			approved:{
			  displayName: 'Status',
			  headerStyle: export_styles.headerDark,
			  cellFormat: function(value, row) { // <- Renderer function, you can access also any row.property 
				return (value == 1) ? 'Approved' : 'Denied';
			  },
			  cellStyle: function(value, row) { // <- style renderer function 
				// if the status is 1 then color in green else color in red 
				// Notice how we use another cell value to style the current one 
				return (value == 1) ? export_styles.cellGreen : export_styles.cellRed; // <- Inline cell style is possible  
			  },
			  width: 120
			}
		}
		var report = excel.buildExport([
			{
			  name: "cook_application",
			  specification: specification,
			  data: data
			}
		  ])
	
		  res.setHeader('Content-disposition', 'attachment; filename=cook_prize_applications_'+now+'.xlsx');
		  res.send(report)
	});
})

router.get("/exports/bbqchamp", function(req,res,next){
	let now = new moment().format("YYYY-MM-DD-HH-mm-ss");
	knex('national-bbq-cup').select('*').then(function(data) {
		var numOfEntries = Object.keys(data).length
		const specification = {
			first_name: { // <- the key should match the actual data key 
			  displayName: 'First Name', // <- Here you specify the column header 
			  headerStyle: export_styles.headerDark, // <- Header style 
			  width: 120 // <- width in pixels 
			},
			last_name: { 
			  displayName: 'Last Name', 
			  headerStyle: export_styles.headerDark, 
			  width: 120 
			},
			address: { 
			  displayName: 'Address', 
			  headerStyle: export_styles.headerDark, 
			  width: 120 
			},
			city: { 
			  displayName: 'City', 
			  headerStyle: export_styles.headerDark, 
			  width: 120 
			},
			state: { 
			  displayName: 'State', 
			  headerStyle: export_styles.headerDark, 
			  width: 120 
			},
			zip: { 
			  displayName: 'Zip', 
			  headerStyle: export_styles.headerDark, 
			  width: 120 
			},
			email: { 
			  displayName: 'Email', 
			  headerStyle: export_styles.headerDark, 
			  width: 120 
			},
			phone: { 
			  displayName: 'Phone', 
			  headerStyle: export_styles.headerDark, 
			  width: 120 
			},
			team: { 
			  displayName: 'Team', 
			  headerStyle: export_styles.headerDark, 
			  width: 120 
			},
			numberOfMembers: { 
			  displayName: 'Number of Members', 
			  headerStyle: export_styles.headerDark, 
			  width: 120 
			},
			sanctioning: { 
			  displayName: 'Sanctioning Body', 
			  headerStyle: export_styles.headerDark, 
			  width: 120 
			},
			submitted_time: { 
			  displayName: 'Submission Time', 
			  headerStyle: export_styles.headerDark, 
			  width: 120 
			},
			readtandc: { 
			  displayName: 'Read Terms&Conditions', 
			  headerStyle: export_styles.headerDark, 
			  width: 120 
			},
			KCBS: { 
			  displayName: 'KCBS #', 
			  headerStyle: export_styles.headerDark, 
			  width: 120 
			},
			IBCA: { 
			  displayName: 'IBCA #', 
			  headerStyle: export_styles.headerDark, 
			  width: 120 
			},
			FBA: { 
			  displayName: 'FBA #', 
			  headerStyle: export_styles.headerDark, 
			  width: 120 
			},
			socialwebsite: { 
			  displayName: 'Social Website', 
			  headerStyle: export_styles.headerDark, 
			  width: 120 
			},
	 
		}
		var report = excel.buildExport([
			{
			  name: "2019_grant_applications",
			  specification: specification,
			  data: data
			}
		])
		res.setHeader('Content-disposition', 'attachment; filename=2019_grant_applications'+now+'.xlsx');
		res.send(report)
	})
})

router.get("/exports/committed-cooks", function(req,res, next){
	let now = new moment().format("YYYY-MM-DD-HH-mm-ss");
	knex('committed_cooks')
	.select('*')
	.where({

	})
	.then(function(data) {
		var numOfEntries = Object.keys(data).length
		const specification = {
			first_name: { // <- the key should match the actual data key 
			  displayName: 'First Name', // <- Here you specify the column header 
			  headerStyle: export_styles.headerDark, // <- Header style 
			  width: 120 // <- width in pixels 
			},
			last_name: {  
			  displayName: 'Last Name',
			  headerStyle: export_styles.headerDark,
			  width: 120
			},
			email: {  
			  displayName: 'Email',
			  headerStyle: export_styles.headerDark,
			  width: 120
			},
			food_service_operator: {  
			  displayName: 'Food Service Operator',
			  headerStyle: export_styles.headerDark,
			  width: 120
			},
			mailing_list_opt_in: {  
			  displayName: 'Mailing List opt in',
			  headerStyle: export_styles.headerDark,
			  width: 120
			},
			products_opt_in: {  
			  displayName: 'Products Opt in',
			  headerStyle: export_styles.headerDark,
			  width: 120
			},
			number_of_team_members: {  
			  displayName: 'Number of team members',
			  headerStyle: export_styles.headerDark,
			  width: 120
			},
			phone: {  
			  displayName: 'Phone',
			  headerStyle: export_styles.headerDark,
			  width: 120
			},
			sanctioning_body: {  
			  displayName: 'Sanctioning Body',
			  headerStyle: export_styles.headerDark,
			  width: 120
			},
			sanctioning_body_number_name: {  
			  displayName: 'Sanctioning Body Name',
			  headerStyle: export_styles.headerDark,
			  width: 120
			},
			sanctioning_body_number: {  
			  displayName: 'Sanctioning body number',
			  headerStyle: export_styles.headerDark,
			  width: 120
			},
			team_name: {  
			  displayName: 'Team Name',
			  headerStyle: export_styles.headerDark,
			  width: 120
			},
			website: {  
			  displayName: 'Website',
			  headerStyle: export_styles.headerDark,
			  width: 120
			},
			has_paid: {  
			  displayName: 'Has Paid',
			  headerStyle: export_styles.headerDark,
			  width: 120
			},
			contact_address: {  
			  displayName: 'Address',
			  headerStyle: export_styles.headerDark,
			  width: 120
			},
			contact_city: {  
			  displayName: 'City',
			  headerStyle: export_styles.headerDark,
			  width: 120
			},
			contact_state: {  
			  displayName: 'State',
			  headerStyle: export_styles.headerDark,
			  width: 120
			},
			contact_zipcode: {  
			  displayName: 'Zip',
			  headerStyle: export_styles.headerDark,
			  width: 120
			},
			business_address: {  
			  displayName: 'Business Address',
			  headerStyle: export_styles.headerDark,
			  width: 120
			},
			business_city: {  
			  displayName: 'Business City',
			  headerStyle: export_styles.headerDark,
			  width: 120
			},
			business_state: {  
			  displayName: 'Business State',
			  headerStyle: export_styles.headerDark,
			  width: 120
			},
			business_zipcode: {  
			  displayName: 'Business Zip',
			  headerStyle: export_styles.headerDark,
			  width: 120
			},
			business_name: {  
			  displayName: 'Business Name',
			  headerStyle: export_styles.headerDark,
			  width: 120
			},
			'number_of_team_members-othertext': {  
			  displayName: 'Team Members info',
			  headerStyle: export_styles.headerDark,
			  width: 120
			},
			'sanctioning_body-othertext': {  
			  displayName: 'Santioning body info',
			  headerStyle: export_styles.headerDark,
			  width: 120
			},
			submit_date: {  
			  displayName: 'Submit Date',
			  headerStyle: export_styles.headerDark,
			  width: 120
			},
			instagram: {  
			  displayName: 'Instagram',
			  headerStyle: export_styles.headerDark,
			  width: 120
			},
			readtandc: {  
			  displayName: 'Read T&C',
			  headerStyle: export_styles.headerDark,
			  width: 120
			},
			bbqcup_opt_in: {  
			  displayName: 'BBQ Cup opt in',
			  headerStyle: export_styles.headerDark,
			  width: 120
			},
		  }
		  //console.log(data)
	
		  var report = excel.buildExport([
			{
			  name: "2019_grant_applications",
			  specification: specification,
			  data: data
			}
		  ])
	
		  res.setHeader('Content-disposition', 'attachment; filename=committed_cooks'+now+'.xlsx');
		  res.send(report)
	});
})

router.get("/exports/grants", function(req,res,next){
	let now = new moment().format("YYYY-MM-DD-HH-mm-ss");
	knex('grant_applications').select('*').then(function(data) {
		var numOfEntries = Object.keys(data).length
		const specification = {
			first_name: { // <- the key should match the actual data key 
			  displayName: 'First Name', // <- Here you specify the column header 
			  headerStyle: export_styles.headerDark, // <- Header style 
			  width: 120 // <- width in pixels 
			},
			last_name: {
			  displayName: 'Last Name',
			  headerStyle: export_styles.headerDark,
			  width: 120
			},
			phone: {
			  displayName: 'Phone',
			  headerStyle: export_styles.headerDark,
			  width: 50 // <- width in pixels 
			},
			email:{
			  displayName:"Email",
			  headerStyle: export_styles.headerDark,
			  width: 120},
			type_of_grant: {
			  displayName: 'Type Of Grant',
			  headerStyle: export_styles.headerDark,
			  width: 220 // <- width in pixels 
			},
			event_name:{
				displayName:"Event Name",
				headerStyle: export_styles.headerDark,
				width: 120},
			event_date:{
			  displayName:"Event Date",
			  headerStyle: export_styles.headerDark,
			  width: 120},
			event_city:{
			  displayName:"Event City",
			  headerStyle: export_styles.headerDark,
			  width: 120},
			event_state:{
			  displayName:"Event State",
			  headerStyle: export_styles.headerDark,
			  width: 120},
			event_website:{
			  displayName:"Event Website",
			  headerStyle: export_styles.headerDark,
			  width: 120},
			event_how_long:{
			  displayName:"Event Running Length",
			  headerStyle: export_styles.headerDark,
			  width: 120},
			event_charities:{
			  displayName:"Event Charities",
			  headerStyle: export_styles.headerDark,
			  width: 120},
			event_activities:{
			  displayName:"Event Activities",
			  headerStyle: export_styles.headerDark,
			  width: 120},
			 'event_activities-othertext':{
			  displayName:"Event Activities Info",
			  headerStyle: export_styles.headerDark,
			  width: 120},
			event_attendance:{
			  displayName:"Event Attendance",
			  headerStyle: export_styles.headerDark,
			  width: 120},
			event_open_to_public:{
			  displayName:"Event Open to public",
			  headerStyle: export_styles.headerDark,
			  width: 120},
			event_admission:{
			  displayName:"Event admission",
			  headerStyle: export_styles.headerDark,
			  width: 120},
			'event_admission-text':{
			  displayName:"Event admission info",
			  headerStyle: export_styles.headerDark,
			  width: 120},
			event_sanctioning:{
			  displayName:"Event sanctioning",
			  headerStyle: export_styles.headerDark,
			  width: 120},
			  event_automatic_qualifier:{displayName:"Automatic Sanctioning",
			  headerStyle: export_styles.headerDark,
			  width: 120},
			  'event_automatic_qualifier-text':{displayName:"Automatic Sanctioning Qualifier",
			  headerStyle: export_styles.headerDark,
			  width: 120},
			  event_teams:{displayName:"Event Teams",
			  headerStyle: export_styles.headerDark,
			  width: 120},
			  event_judges:{displayName:"Event Judges",
			  headerStyle: export_styles.headerDark,
			  width: 120},
			  event_entry_fee:{displayName:"Entry Fee",
			  headerStyle: export_styles.headerDark,
			  width: 120},
			  event_prize_purse:{displayName:"Prize Purse",
			  headerStyle: export_styles.headerDark,
			  width: 120},
			  event_prize_disbursed:{displayName:"Prize Disbursed",
			  headerStyle: export_styles.headerDark,
			  width: 120},
			  event_other_categories:{displayName:"Other Categories",
			  headerStyle: export_styles.headerDark,
			  width: 120},
			  'event_other_categories-othertext':{displayName:"Other Categories Info",
			  headerStyle: export_styles.headerDark,
			  width: 120},
			  event_backyard_bbq:{displayName:"Event Backyard BBQ",
			  headerStyle: export_styles.headerDark,
			  width: 120},
			  'event_backyard_bbq-text' :{displayName:"Event Backyard BBQ Info",
			  headerStyle: export_styles.headerDark,
			  width: 120},
			  event_brand_sponsors:{displayName:"Brand Sponsors",
			  headerStyle: export_styles.headerDark,
			  width: 120},
			  'event_brand_sponsors-text':{displayName:"Brand Sponsors Text",
			  headerStyle: export_styles.headerDark,
			  width: 120},
			  event_retail_partners:{displayName:"Retail Sponsors",
			  headerStyle: export_styles.headerDark,
			  width: 120},
			  'event_retail_partners-text':{displayName:"Retail Partners",
			  headerStyle: export_styles.headerDark,
			  width: 120},
			  event_promotion:{displayName:"Event Promotion",
			  headerStyle: export_styles.headerDark,
			  width: 120},
			  'event_promotion-website' :{displayName:"Event Promotion Website",
			  headerStyle: export_styles.headerDark,
			  width: 120},
			  'event_promotion-socialmedia' :{displayName:"Social Media",
			  headerStyle: export_styles.headerDark,
			  width: 120},
			  'event_promotion-othertext':{displayName:"Other Promos",
			  headerStyle: export_styles.headerDark,
			  width: 120},
			  event_past_media_partners:{displayName:"Past media partners",
			  headerStyle: export_styles.headerDark,
			  width: 120},
			  'event_past_media_partners-text':{displayName:"Past media partners info",
			  headerStyle: export_styles.headerDark,
			  width: 120},
			  event_current_media_partners:{displayName:"Current media partners",
			  headerStyle: export_styles.headerDark,
			  width: 120},
			  event_why_do_you_believe:{displayName:"Why do you believe...",
			  headerStyle: export_styles.headerDark,
			  width: 120},
			  event_additional_documentation_ids :{displayName:"Additional Documentation",
			  headerStyle: export_styles.headerDark,
			  width: 120},
			  event_additional_documentation_names :{displayName:"Additional Doc Names",
			  headerStyle: export_styles.headerDark,
			  width: 120},
			  event_add_pork_loin_category :{displayName:"Pork Loin Category",
			  headerStyle: export_styles.headerDark,
			  width: 120},
			  timestamp :{displayName:"Submission Time",
			  headerStyle: export_styles.headerDark,
			  width: 120},
			  year:{displayName:"Year",
			  headerStyle: export_styles.headerDark,
			  width: 120},
		  }
		  //console.log(data)
	
		  var report = excel.buildExport([
			{
			  name: "2019_grant_applications",
			  specification: specification,
			  data: data
			}
		  ])
	
		  res.setHeader('Content-disposition', 'attachment; filename=2019_grant_applications'+now+'.xlsx');
		  res.send(report)

	})
})

router.get("/exports/judging-applications", function(req,res,next){
	let now = new moment().format("YYYY-MM-DD-HH-mm-ss");
	knex('judge_applications').select('*').then(function(data) {
		var numOfEntries = Object.keys(data).length
		const specification = {
			first_name: { // <- the key should match the actual data key 
			  displayName: 'First Name', // <- Here you specify the column header 
			  headerStyle: export_styles.headerDark, // <- Header style 
			  width: 120 // <- width in pixels 
			},
			last_name: {
			  displayName: 'Last Name',
			  headerStyle: export_styles.headerDark,
			  width: 120
			},
			contact_address: {
			  displayName: 'Address',
			  headerStyle: export_styles.headerDark,
			  width: 120
			},
			contact_city: {
			  displayName: 'City',
			  headerStyle: export_styles.headerDark,
			  width: 120
			},
			contact_state: {
			  displayName: 'State',
			  headerStyle: export_styles.headerDark,
			  width: 120
			},
			contact_zipcode: {
			  displayName: 'Zip',
			  headerStyle: export_styles.headerDark,
			  width: 120
			},
			phone: {
			  displayName: 'Phone',
			  headerStyle: export_styles.headerDark,
			  width: 50 // <- width in pixels 
			},
			cellphone: {
			  displayName: 'Cell Phone',
			  headerStyle: export_styles.headerDark,
			  width: 50 // <- width in pixels 
			},
			email:{
			  displayName:"Email",
			  headerStyle: export_styles.headerDark,
			  width: 120},
			physically:{
				displayName:"Physically able",
				headerStyle: export_styles.headerDark,
				width: 120},
			present:{
				displayName:"Able to judge and be present all 4 days",
				headerStyle: export_styles.headerDark,
				width: 120},	
			volunteer:{
				displayName:"volunteer",
				headerStyle: export_styles.headerDark,
				width: 120},	
			judged:{
				displayName:"Number judged",
				headerStyle: export_styles.headerDark,
				width: 120},
			startedjudging:{
				displayName:"Started Judging:",
				headerStyle: export_styles.headerDark,
				width: 120},
			master:{
				displayName:"Master Judge:",
				headerStyle: export_styles.headerDark,
				width: 120},	
			tablecaptain:{
				displayName:"Table captain:",
				headerStyle: export_styles.headerDark,
				width: 120},	
			captainnumber:{
				displayName:"Table captain times:",
				headerStyle: export_styles.headerDark,
				width: 120},
			sanctioning_body:{
				displayName:"Sanctioning Bodies:",
				headerStyle: export_styles.headerDark,
				width: 120},
			sanctioning_body_othertext:{
				displayName:"Sanctioning Bodies:",
				headerStyle: export_styles.headerDark,
				width: 120},	
			essay1:{
				displayName:"Why I Am Qualified:",
				headerStyle: export_styles.headerDark,
				width: 120},
			essay2:{
				displayName:"Why it is important to me:",
				headerStyle: export_styles.headerDark,
				width: 120},		
			}
		
		  //console.log(data)
	
		  var report = excel.buildExport([
			{
			  name: "2019_judge_applications",
			  specification: specification,
			  data: data
			}
		  ])
	
		  res.setHeader('Content-disposition', 'attachment; filename=2019_judge_applications'+now+'.xlsx');
		  res.send(report)

	})
})

router.get("/exports/users", function(req, res, next) {
	let now = new moment().format("YYYY-MM-DD-HH-mm-ss");
	knex('users')
	.then(function(data) {
		var numOfEntries = Object.keys(data).length
		const specification = {
			user_id:{			  
				displayName: 'User ID', // <- Here you specify the column header 
			  headerStyle: export_styles.headerDark, // <- Header style 
				width: 120 // <- width in pixels 
			},
			email:{			  
				displayName: 'Email', // <- Here you specify the column header 
			  headerStyle: export_styles.headerDark, // <- Header style 
				width: 120 // <- width in pixels 
			},
			oauthID:{			  
				displayName: 'OAuth Id', // <- Here you specify the column header 
			  headerStyle: export_styles.headerDark, // <- Header style 
				width: 120 // <- width in pixels 
			},
			oauthType:{			  
				displayName: 'OAuth Type', // <- Here you specify the column header 
			  headerStyle: export_styles.headerDark, // <- Header style 
				width: 120 // <- width in pixels 
			},
			firstname:{			  
				displayName: 'First Name', // <- Here you specify the column header 
			  headerStyle: export_styles.headerDark, // <- Header style 
				width: 120 // <- width in pixels 
			},
			lastname:{			  
				displayName: 'Last Name', // <- Here you specify the column header 
			  headerStyle: export_styles.headerDark, // <- Header style 
				width: 120 // <- width in pixels 
			},
			address1:{			  
				displayName: 'Address 1', // <- Here you specify the column header 
			  headerStyle: export_styles.headerDark, // <- Header style 
				width: 120 // <- width in pixels 
			},
			address2:{			  
				displayName: 'Address 2', // <- Here you specify the column header 
			  headerStyle: export_styles.headerDark, // <- Header style 
				width: 120 // <- width in pixels 
			},
			city:{			  
				displayName: 'City', // <- Here you specify the column header 
			  headerStyle: export_styles.headerDark, // <- Header style 
				width: 120 // <- width in pixels 
			},
			state:{			  
				displayName: 'State', // <- Here you specify the column header 
			  headerStyle: export_styles.headerDark, // <- Header style 
				width: 120 // <- width in pixels 
			},
			zip:{			  
				displayName: 'Zip', // <- Here you specify the column header 
			  headerStyle: export_styles.headerDark, // <- Header style 
				width: 120 // <- width in pixels 
			},
			phone:{			  
				displayName: 'Phone', // <- Here you specify the column header 
			  headerStyle: export_styles.headerDark, // <- Header style 
				width: 120 // <- width in pixels 
			},
			created:{
				displayName: 'Created', // <- Here you specify the column header 
			  headerStyle: export_styles.headerDark, // <- Header style 
				width: 120 // <- width in pixels 
			},
			updated:{			  
				displayName: 'Updated', // <- Here you specify the column header 
			  headerStyle: export_styles.headerDark, // <- Header style 
				width: 120 // <- width in pixels 
			},
			numberOfMembers:{			  
				displayName: 'Number of Members', // <- Here you specify the column header 
			  headerStyle: export_styles.headerDark, // <- Header style 
				width: 120 // <- width in pixels 
			},
			team_name:{			  
				displayName: 'Team Name', // <- Here you specify the column header 
			  headerStyle: export_styles.headerDark, // <- Header style 
				width: 120 // <- width in pixels 
			},
			team_id:{			  
				displayName: 'Team ID', // <- Here you specify the column header 
			  headerStyle: export_styles.headerDark, // <- Header style 
				width: 120 // <- width in pixels 
			},
			edge_id:{			  
				displayName: 'Edge ID', // <- Here you specify the column header 
			  headerStyle: export_styles.headerDark, // <- Header style 
				width: 120 // <- width in pixels 
			},
			cooknumber:{			  
				displayName: 'Sanctioning Body Numbers', // <- Here you specify the column header 
			  headerStyle: export_styles.headerDark, // <- Header style 
				width: 120 // <- width in pixels 
			},
			social:{			  
				displayName: 'Social', // <- Here you specify the column header 
			  headerStyle: export_styles.headerDark, // <- Header style 
				width: 120 // <- width in pixels 
			},
			optin:{			  
				displayName: 'Option', // <- Here you specify the column header 
			  headerStyle: export_styles.headerDark, // <- Header style 
				width: 120 // <- width in pixels 
			},
			certify:{			  
				displayName: 'Certify', // <- Here you specify the column header 
			  headerStyle: export_styles.headerDark, // <- Header style 
				width: 120 // <- width in pixels 
			},
			ua:{			  
				displayName: 'User Agent', // <- Here you specify the column header 
			  headerStyle: export_styles.headerDark, // <- Header style 
				width: 120 // <- width in pixels 
			},
			ip:{			  
				displayName: 'IP', // <- Here you specify the column header 
			  headerStyle: export_styles.headerDark, // <- Header style 
				width: 120 // <- width in pixels 
			},
			dupe:{			  
				displayName: 'Duplicate Status', // <- Here you specify the column header 
			  headerStyle: export_styles.headerDark, // <- Header style 
				width: 120 // <- width in pixels 
			},
			confirm_code:{			  
				displayName: 'Confirmation Code', // <- Here you specify the column header 
			  headerStyle: export_styles.headerDark, // <- Header style 
				width: 120 // <- width in pixels 
			},
			confirmed:{			  
				displayName: 'Confirmed', // <- Here you specify the column header 
			  headerStyle: export_styles.headerDark, // <- Header style 
				width: 120 // <- width in pixels 
			},
		}
		
		var report = excel.buildExport([
			{
			  name: "users",
			  specification: specification,
			  data: data
			}
		  ])
	
		  res.setHeader('Content-disposition', 'attachment; filename=users_'+now+'.xlsx');
		  res.send(report)
	});
})



//prize admin
router.get("/committedcooks-prizes", function(req,res,next){
	controller.intent = "committedcooksprizes";
	knex("prizes").select("*")
	.then(function(prizes){
		console.log(prizes.length)
		res.locals.prizes = prizes;
		res.render("admin", controller);
	})
})
router.post("/committedcooks-prizes", function(req,res,next){
	controller.intent = "committedcooksprizes";

	 return knex.transaction(trx => {
		const queries = [];
		for (var key in req.body) {
		  console.log("key " + key + " value: "+ req.body[key])
		  const query = knex('prizes')
			  .where('id_prizes', key)
			  .update({
				  prize_available: req.body[key]
			  })
			  .transacting(trx); // This makes every update be in the same transaction
		  queries.push(query);
		}
  
		Promise
		  .all(queries) // Once every query is written
		  .then(trx.commit) // We try to execute all of them
		  .then(function(){
			console.log("    updated prize availability")
			res.redirect('/admin/committedcooks-prizes');//go on to update prizes
		  })
	  });
})
router.get("/committedcooks",function(req,res,next){
	controller.intent = "committedcooksapproval";
	knex("cook_application").select("*")
    .then(function(cooks){
      res.locals.cooks= cooks;
	  res.render("admin", controller);
	});
})
router.post("/committedcooks",function(req,res,next){
	controller.intent = "committedcooksapproval";
	/* for (var key in req.body) {
		console.log("key " + key + " value: "+ req.body[key])
	} */
	return knex.transaction(trx => {
		const queries = [];
		
		for (var key in req.body) {
		  //console.log("key " + key + " value: "+ req.body[key])
		  let info = req.body[key].split(",") //approved, prize
		  //update stutus
		  const query = knex('cook_application')
			  .where('id', key)
			  .update({
				  approved: info[0]
			  })
			  .transacting(trx); // This makes every update be in the same transaction
		  queries.push(query);
		}
  
		Promise
		  .all(queries) // Once every query is written
		  .then(trx.commit) // We try to execute all of them
		  .then(function(){
			knex("cook_application").select("*")
				.then(function(cooks){
					res.locals.cooks= cooks;
					res.render("admin", controller);
				});
		  })
	  });


})




/* 
Type Manager
Types are used as automatic rollups. A type will register as a route, and scoop up all
content of the same type. Types and sub items can also be assigned templates.
*/
router.get("/type-manager", function(req, res, next){
	let keyid = uuid.v1();
	req.session.keyid = keyid;
	controller.user = req.user;
	controller.data={};
	controller.intent = "type-manager";
	controller.nonce = jwt.sign({user_id:req.user.user_id,keyid:keyid}, oauthSecret);
	knex("content_post_types")
	.select("*")
	.then(function(data){
		controller.data = data
		res.render("admin", controller)
	})
})
router.get("/type-manager/new", function(req, res, next){
	let keyid = uuid.v1();
	req.session.keyid = keyid;
	controller.user = req.user;
	controller.data={};
	controller.intent = "type-new";
	controller.nonce = jwt.sign({user_id:req.user.user_id,keyid:keyid}, oauthSecret);
	res.render("admin", controller)
})
router.get("/type-manager/edit/:id?", function(req, res, next){
	console.log("Post Type Editing")
	let keyid = uuid.v1();
	req.session.keyid = keyid;
	controller.user = req.user;
	controller.data={};
	controller.intent = "type-edit";
	controller.nonce = jwt.sign({user_id:req.user.user_id,keyid:keyid}, oauthSecret);
	knex("content_post_types")
	.select("*")
	.where({
		type_id : req.params.id
	})
	.then(function(data){
		controller.data = data[0]
		controller.meta = []
		let meta = []
		if(data[0].meta){
			meta = JSON.parse(data[0].meta)
			controller.meta = meta[0]
		}
		res.render("admin", controller)
	})
	.catch(function(err){console.log(err)})
})
router.post("/type-manager/save/", function(req, res, next){
	console.log(req.body);
	var decoded = jwt.verify(req.body.nonce, oauthSecret);
	if (decoded.keyid != req.session.keyid) {
		console.log("bad key");
		res
			.status("501")
			.send("Error")
			.end();
		return;
	}
	//check if user submitting is the user logged in
	if (decoded.user_id != req.user.user_id) {
		console.log("bad user");
		res
			.status("501")
			.send("Error")
			.end();
		return;
	}
	if(req.body.type_id){
		//its an existing page
		console.log("existing page")
		knex("content_post_types")
		.where({
			type_id:req.body.type_id
		})
		.update({
			title:req.body.title,
			label:req.body.title,
			slug:req.body.slug,
			template: req.body.template,
			intro:req.body.intro,
			banner:req.body.post_featured_image,
			meta: JSON.stringify(req.body.meta),
		})
		.then(function(data){
			res.status(200).redirect('/admin/type-manager')
		})
		.catch(function(err){console.log(err)})
	}
	else{
		//new page
		console.log("new page")
		knex("content_post_types")
		.insert({
			title:req.body.title,
			label:req.body.title,
			slug:req.body.slug,
			template: req.body.template,
			intro:req.body.intro,
			banner:req.body.post_featured_image,
			meta: JSON.stringify(req.body.meta),
		})
		.then(function(data){
			controller.cacheItems = false;
			res.status(200).redirect('/admin/type-manager').end()
		})
		.catch(function(err){console.log(err)})
	}

});
router.get("/ajax/type-manager/get-children-order/:slug?", function(req,res,next){
	knex("content_manager")
	.select("cm_id","title")
	.leftJoin(
		"post_content",
		"content_manager.post_contentID",
		"post_content.content_id"
	)
	.where({
		post_type: req.params.slug,
		status:"publish"
	})
	.orderBy("post_order", "asc")
	.then(function(content) {
		res.status(200).json({success:content}).end()
	})
	.catch(function(err){res.status(500).json({error:err})})

	
})
router.post("/ajax/type-manager/set-children-order/:slug?", function(req,res,next){
	console.log(req.body.order)
	console.log(req.params.slug)
	let order = req.body.order
	let slug = req.params.slug
	res.status(200).json({success:"success"})
	for(let i = 0;i<order.length;i++){
		console.log(i + " "+ order[i])
		knex("content_manager")
		.select("cm_id","post_order")
		.where({
			cm_id: order[i]
		})
		.update({
			post_order: i
		})
		.then()
	}
})

/*------------------
Template CRUD 
Add, edit, and delete template entries in the database.
Actual template files will be placed in the views folder.
This will not create the files, just expose the names to 
managed content.
------------------*/
router.get("/template-manager", function(req,res,next){
	controller.intent = "template-manager";
	knex("content_post_template")
	.select("*")
	.then(function(data){
		controller.data = data
		res.render("admin", controller)
	})
})
router.post("/ajax/template-manager", function(req,res,next){
	console.log("adding a template")
	if(req.body.id){
		knex("content_post_template")
		.select("*")
		.where({
			template_id:req.body.id
		})
		.update({
			label:req.body.newlabel,
			slug:req.body.newslug
		})
		.then(function(data){
			res.status(200).send({status:"updated",newlabel:req.body.newlabel, newslug:req.body.newslug,id:req.body.id}).end()
		})
		//update any content with the old slug to the new slug
		knex("content_manager")
		.select("*")
		.where({
			template: req.body.oldslug
		})
		.update({
			template: req.body.newslug
		})
		.then(function(e){
			console.log("Slugs Updated")
		});

	}
	else{
		knex("content_post_template")
		.insert({
			label:req.body.newlabel,
			slug:req.body.newslug
		})
		.returning("template_id")
		.then(function(data){
			res.status(200).send({status:"new",newlabel:req.body.newlabel, newslug:req.body.newslug,id:data[0]}).end()
		})
	}
	controller.cacheItems = false;
})
router.post("/ajax/template-manager/delete", function(req, res, next){
	console.log("removing a template")
	knex("content_post_template")
	.select("*")
	.where({
		template_id:req.body.id
	})
	.del()
	.then(function(data){
		controller.cacheItems = false;
		res.status(200).send({status:"deleted"}).end()
	});

	knex("content_manager")
	.select("*")
	.where({
		template:req.body.slug
	})
	.update({
		template: "subpage"
	})
	.then(function(e){
		console.log("slugs replaced with subpage")
	});


});

/* Content CRUD */
router.get("/all-pages", function(req, res, next) {
	controller.intent = "all-pages";
	knex("content_manager")
		.select("*")
		.leftJoin(
			"post_content",
			"content_manager.post_contentID",
			"post_content.content_id"
		)
		.then(function(content) {
			controller.data = content;
			res.render("admin", controller);
		});
});
router.get("/new-content", function(req, res, next) {
	let keyid = uuid.v1();
	req.session.keyid = keyid;
	controller.user = req.user;
	controller.data = {};
	controller.intent = "new-content";
	controller.meta = []
	controller.nonce = jwt.sign(
		{ user_id: req.user.user_id, keyid: keyid },
		oauthSecret
	);
	console.table(controller);
	res.render("admin", controller);
});
router.get("/edit/null", function(req, res, next) {
	//hack
	res
		.status(200)
		.send("ok")
		.end();
});
router.get("/edit/:id?", function(req, res, next) {
	console.log("editing " + req.params.id);
	if (
		req.params.id != null ||
		req.params.id != "null" ||
		req.params.id != undefined
	) {
		let keyid = uuid.v1();
		controller.user = req.user;
		req.session.keyid = keyid;
		controller.nonce = jwt.sign(
			{ user_id: req.user.user_id, keyid: keyid },
			oauthSecret
		);
		controller.intent = "edit-content";
		controller.data = {};
		//get current page content, post to /admin/save-post/update-post
		knex("content_manager")
			.select("*")
			.leftJoin(
				"post_content",
				"content_manager.post_contentID",
				"post_content.content_id"
			)
			.where({
				cm_id: req.params.id
			})
			.then(function(content) {
				//lock the content so that only this person can access while it is in editing mode
				//knex('content_manager').select("*").where({cm_id: req.params.id}).update({status:"locked,"+req.user.user_id}).then(function(e){})
				controller.data = content[0];
				controller.meta = []
				let meta = []
				if(content[0].meta){
					meta = JSON.parse(content[0].meta)
					controller.meta = meta[0]
				}
				
				
				res.render("admin", controller);
			})
			.catch(function(err) {
				console.log(err);
			});
	} else {
		res
			.status(200)
			.send("ok")
			.end();
	}
});
router.post("/check-slug/:slug?", function(req, res, next) {
	//see if a slug is in use
	knex("content_manager")
		.select("*")
		.where({
			post_slug: req.params.slug
		})
		.then(function(slug) {
			if (slug.length == 0) {
				res.status(200).send({ success: "ok" });
			} else {
				res.status(500).send({ error: slug.length });
			}
		})
		.catch(function(error) {
			console.log(error);
		});
});
router.post("/save-post/:intent?", function(req, res, next) {
	let now = new moment().format("YYYY-MM-DD HH:mm:ss");
	console.log("---fields---")
	console.log(req.body)
	console.log("------------")

	//check nonce
	var decoded = jwt.verify(req.body.nonce, oauthSecret);
	if (decoded.keyid != req.session.keyid) {
		console.log("bad key");
		res
			.status("501")
			.send("Error")
			.end();
		return;
	}

	//check if user submitting is the user logged in
	if (decoded.user_id != req.user.user_id) {
		console.log("bad user");
		res
			.status("501")
			.send("Error")
			.end();
		return;
	}

	switch (req.params.intent) {
		//new post
		case "new-post":
			//console.log(req.user)
			console.log(req.body);
			knex("post_content")
				.insert({
					title: req.body.title,
					post_excerpt: req.body.post_excerpt,
					content: req.body.pagecontent,
					meta: JSON.stringify(req.body.seo),
					publish_date: now,
					user_id: req.user.user_id
				})
				.returning("id")
				.then(function(id) {
					knex("content_manager")
						.insert({
							last_updated: now,
							created_by: req.user.user_id,
							status: req.body.status,
							uuid: uuid.v1(),
							template: req.body.template,
							post_type: req.body.post_type,
							post_slug: req.body.slug,
							post_contentID: id
						})
						.then(function(id) {
							console.log("saved");
							res.status(200).redirect("/admin/all-pages");
						})
						.catch(function(err) {
							console.log("error saving the cm");
							console.log(err);
						});
				})
				.catch(function(err) {
					console.log("Error creating content");
					console.log(err);
				});
			break;
		case "update-post":
			knex("post_content")
				.insert({
					title: req.body.title,
					post_excerpt: req.body.post_excerpt,
					content: req.body.pagecontent,
					meta: JSON.stringify(req.body.seo),
					publish_date: now,
					user_id: req.user.user_id,
					post_featured_image: req.body.post_featured_image,
					post_featured_thumbnail: req.body.post_featured_thumbnail,
					post_owner: req.body.cm_id
				})
				.returning("id")
				.then(function(id) {
					knex("content_manager")
						.select("*")
						.where({
							cm_id: req.body.cm_id
						})
						.update({
							post_contentID: id,
							last_updated: now,
							post_slug: req.body.slug,
							status: req.body.status,
							post_type: req.body.post_type,
							template: req.body.template
						})
						.then(function(done) {
							res.status(200).redirect("/admin/all-pages");
						})
						.catch(function(err) {
							console.log("Did not update CM entry");
							console.log(err);
						});
				})
				.catch(function(err) {
					console.log("Did not add new content entry");
					console.log(err);
				});

			break;
		case "delete-post":
			//do a soft delete
			res.status(200).send("soft delete");
			break;
		case "hard-delete-post":
			//do a hard delete, releasing the page slug, set status to hard delete
			res.status(200).send("soft delete");
			break;
		default:
			console.log("no intent");
			res
				.status(200)
				.redirect("/admin")
				.end();
			break;
	}
});

/* User CRUD */
router.get("/all-users", function(req, res, next) {
	controller.intent = "all-users";
	knex("users")
		.select(["users.*", "roles.role"])
		.leftJoin("roles", "users.user_id", "roles.user_id")
		.then(function(content) {
			controller.data = content;
			res.render("admin", controller);
		});
});
router.get("/new-user", function(req, res, next) {
	let keyid = uuid.v1();
	req.session.keyid = keyid;
	controller.user = req.user;
	controller.data = {};
	controller.intent = "new-user";
	controller.nonce = jwt.sign(
		{ user_id: req.user.user_id, keyid: keyid },
		oauthSecret
	);
	res.render("admin", controller);
});
router.get("/edit-user/:id?", function(req, res, next) {
	let keyid = uuid.v1();
	controller.user = req.user;
	req.session.keyid = keyid;
	controller.nonce = jwt.sign(
		{ user_id: req.user.user_id, keyid: keyid },
		oauthSecret
	);
	controller.intent = "edit-user";
	if (req.params.id) {
		//get current page content, post to /admin/save-post/update-post
		console.log("this id:", req.params.id);
		knex("users")
			.select(["users.*", "roles.role"])
			.leftJoin("roles", "users.user_id", "roles.user_id")
			.where({
				"users.user_id": req.params.id
			})
			.then(function(content) {
				//lock the content so that only this person can access while it is in editing mode
				//knex('content_manager').select("*").where({cm_id: req.params.id}).update({status:"locked,"+req.user.user_id}).then(function(e){})
				controller.data = content[0];
				console.log("DATAAAA");
				console.log(controller.data.role);
				res.render("admin", controller);
			})
			.catch(function(err) {
				console.log(err);
			});
	} else {
		res
			.status(200)
			.send("ok")
			.end();
	}
});
router.post("/save-user/:intent?", async function(req, res, next) {
	let now = new moment().format("YYYY-MM-DD HH:mm:ss");

	//check nonce
	var decoded = jwt.verify(req.body.nonce, oauthSecret);
	if (decoded.keyid != req.session.keyid) {
		console.log("bad key");
		res
			.status("501")
			.send("Error")
			.end();
		return;
	}
	//check if user submitting is the user logged in
	if (decoded.user_id != req.user.user_id) {
		console.log("bad user");
		res
			.status("501")
			.send("Error")
			.end();
		return;
	}

	switch (req.params.intent) {
		//new post
		case "new-user":
			break;
		case "update-user":
			/* updates backend user */
			try {
				await knex("users")
					.update({
						firstname: req.body.firstname,
						lastname: req.body.lastname,
						email: req.body.email,
						updated: now
					})
					.where({
						user_id: req.body.user_id
					});
				if (req.body.role != "null") {
					const role_id = await knex("roles")
						.select("role_id")
						.where({
							user_id: req.body.user_id
						});
					if (role_id.length > 0) {
						//update user role if it exists
						await knex("roles")
							.update({
								role: req.body.role,
								updated_at: now,
								updated_by: req.user.user_id
							})
							.where({
								user_id: req.body.user_id
							});
						//console.log('*** Updated user')
						res.status(200).redirect("/admin/all-users");
					} else {
						//insert a user role if he was null
						await knex("roles")
							.select("*")
							.insert({
								user_id: req.body.user_id,
								role: req.body.role,
								created_at: now,
								created_by: req.user.user_id
							});
						res.status(200).redirect("/admin/all-users");
					}
				} else {
					//delete role from user
					await knex("roles")
						.where("user_id", req.body.user_id)
						.del();
					//console.log('*** Updated user')
					res.status(200).redirect("/admin/all-users");
				}
			} catch (err) {
				console.log(err);
			}

			break;
	}
});
router.post("/set-status/:status?", function(req, res, next) {
	//set published/draft status
	res.status(200).send("ok");
});

/* MEDIA FUNCTIONS */
router.get("/media-manager", function(req, res, next) {
	//upload, etc
	controller.user = req.user;
	controller.intent = "media-manager";
	res.render("admin", controller);
});
router.post("/ajax/upload-media", function(req, res, next) {
	let now = new moment().format("YYYY-MM-DD HH:mm:ss");
	var form = new formidable.IncomingForm();
	form.parse(req, function(err, fields, files) {
		//console.log(util.inspect({fields: fields, files: files}));
		uploader
			.mediaManagerUpload(files.mediafiles, req.user.user_id)
			.then(function(data) {
				console.log(data);
				res.status(200).send({ files: data });
			});
	});
});
router.get("/ajax/media", function(req, res, next) {
	/* There is something weird going on with aws images when loaded by ajax.  */
	console.log("get media");
	knex("media_manager")
		.select("*")
		.then(function(data) {
			res
				.status(200)
				.send({ allfiles: data })
				.end();
		})
		.catch(function(err) {
			res
				.status(500)
				.send(err)
				.end();
		});
});

router.get("/setuuids", async function(req,res,next){
	knex("users")
	.select("*")
	.whereNull('password')
	.then(function(data){
		data.map(async entry => {
			console.log(chalk.blue(""))
			let u = uuid.v1();
			pass = bcrypt.hashSync(u, 10);
			knex("users")
			.where({user_id:entry.user_id})
			.update({
				password:pass
			})
			.then(function(e){})
		})
	})
	res.send("ok")
});

router.get("/normalize-db", async function(req,res,next){
	let out=`<style>table{max-width:1024px;margin:20px auto}h1,h4{max-width:1024px;margin:20px auto;text-align:center}td{border:1px solid #ccc;padding:3px}</style>
		<h1>Merged Edge Users</h1>
		<table cellspacing=0>
		<tr><th>User ID</th><th>User Email</th><th>Edge migrations</th></tr>`
	let users = await knex("users").select("*").whereNull("dupe")
	let edge = await knex("national-bbq-cup")
	let num=0
	users.map(async theuser=>{
		let theedge={}
		edge.map(e=>{
			if(e.email == theuser.email){
				theedge = e;
			}
		})
		if(theedge.id){
			num++
			out+= `<tr><td><strong>${theuser.user_id}</strong></td><td>${theuser.email}</td><td><ul>`
			if(!theuser.edge_id){
				out+=`<li>edge id: ${theedge.id}</li>`
			}
			if(!theuser.team_name && theedge.team){
				out+=`<li>team: ${theedge.team}</li>`
			}
			if(!theuser.cooknumber && theedge.id){
				out+=`<li>cooknumbers<br/>
					KCBS: ${theedge.KCBS}<br/>
					IBCA: ${theedge.IBCA}<br/>
					FBA: ${theedge.FBA}
				</li>`
			}
			if(!theuser.certify && theedge.id && theedge.readtandc){
				out+=`<li>read terms/certify</li>`
			}
			if(!theuser.numberOfMembers && theedge.id && theedge.numberOfMembers){
				out+=`<li>number of members: ${theedge.numberOfMembers}</li>`
			}
			if(!theuser.address1 && theedge.id && theedge.address){
				out+=`<li>address: ${theedge.address}</li>`
			}
			if(!theuser.city && theedge.id && theedge.city){
				out+=`<li>city: ${theedge.city}</li>`
			}
			if(!theuser.state && theedge.id && theedge.state){
				out+=`<li>state: ${theedge.state}</li>`
			}
			if(!theuser.zip && theedge.id && theedge.zip){
				out+=`<li>zip: ${theedge.zip}</li>`
			}
			if(!theuser.phone && theedge.id && theedge.phone){
				out+=`<li>phone: ${theedge.phone}</li>`
			}
			if(!theuser.social && theedge.id && theedge.social){
				out+=`<li>phone: ${theedge.social}</li>`
			}
			knex("users")
			.where({
				user_id: theuser.user_id
			})
			.update({
				edge_id: theuser.edge_id || theedge.id,
				team_name: theuser.team_name || theedge.team,
				cooknumber: theuser.cooknumber || `{"kcbs":${theedge.KCBS},"ibca":${theedge.IBCA},"fba":${theedge.FBA},"bca":"","pnwba":"","slbs":""}`,
				certify: theuser.certify || theedge.readtandc,
				numberOfMembers: theuser.numberOfMembers || theedge.numberOfMembers,
				address1: theuser.address1 || theedge.address,
				city: theuser.city || theedge.city,
				state: theuser.state || theedge.state,
				zip: theuser.zip || theedge.zip,
				phone: theuser.phone || theedge.phone

			})
			.then((a)={})



			out +=`</ul></td></tr>`
		}
	})

	out+=`</table><h4>${num} edge users to be updated.</h4>`
	res.send(out)
})
router.get('/find-dupes', async function(req, res, next) {
	// knex.raw("SELECT GROUP_CONCAT(user_id) AS uid, COUNT(email) FROM `sws2019bbq-merged`.`users` GROUP BY email HAVING count(email) > 1")
	knex.raw("SELECT *, COUNT(email) FROM `sws2019bbq-merged`.`users` GROUP BY email HAVING count(email) > 1")
	.then(function(data){
		for (var i = 0; i < data[0].length; i++) {
			console.log(data[0][i]);
				knex('users')
				.update({
					dupe:'1'
				})
				.where({user_id: data[0][i].user_id})
				.then().catch();
		}
	})
	.catch(function(err){console.log(err)})
	res.send("ok")
});
router.get("/new-edge", async function(req,res,next){
	var start = 2000
	let newedge = await knex("users")
		.whereNull("dupe", "edge_id")
	newedge.map(async theuser=>{
		knex("users")
		.where({
			user_id:theuser.user_id
		})
		.whereNull("edge_id")
		.update({
			edge_id:start
		})
		.then().catch();

		start++;
	})
	res.send("ok")
});

module.exports = router;
console.log("  Admin Loaded.");
