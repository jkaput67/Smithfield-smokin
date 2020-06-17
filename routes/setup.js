var config = require('../config');
var express = require('express');
var router = express.Router();
var knex = require('knex').knex;
knex.knex = knex(config.connection);
var chalk = require("chalk");
var inquirer = require('inquirer');
var user = require("../lib/user.2.0.0")
var moment = require("moment");
/*
SETUP

This will run once when the site is initiated.

We will check for the default admin user, and if not - create all the tables.

*/



// knex("users")
// .select("user_id")
// .where({user_id:"1"})
// .then(function(data){
//     console.log(chalk.green("Database Ready"))
    

// })
// .catch(function(err){
//     var now = moment().format("YYYY-MM-DD HH:mm:ss");
//     console.log(chalk.magenta("Setting up database tables"))
    
//     knex.schema.createTable('content_manager', (table) => {
//       table.increments('cm_id',11)
//       table.timestamp('last_updated')
//       table.string('created_by',45)
//       table.string('status',45)
//       table.string('parent_id',45)
//       table.string('template',45)
//       table.string('post_type',45)
//       table.integer('post_contentID',10)
//       table.string('post_slug',45)
//       table.integer('post_order',10)
//       table.string('uuid',45)
//       table.string('edit_lock',45)
//       table.unique('cm_id')
//     })
//     .then(() => {})
//     .catch(() => {})

//     knex.schema.createTable('content_post_template', (table) => {
//       table.increments('template_id',11)
//       table.string('label',45)
//       table.string('slug',45)
//       table.string('uuid',45)
//     })
//     .then(() => {
//       knex('content_post_template')
//       .insert([
//         {'label':'Default Subpage Template', 'slug':'subpage'}
//       ])
//       .catch(function(err) {
//         console.log(err);
//       })

//     })
//     .catch(() => {})


//     knex.schema.createTable('content_post_types', (table) => {
//       table.increments('type_id',11)
//       table.string('label',45)
//       table.string('slug',45)
//       table.string('template',45)
//       table.string('title',45)
//       table.text('intro')
//       table.string('banner',500)
//       table.text('meta','longtext')
//     })
//     .then(() => {
//       knex('content_post_types')
//       .insert([
//         {'label':'Blog', 'slug':'blog', 'template':'subpage', 'title': 'Blog'},
//         {'label':'News', 'slug':'news', 'template':'subpage', 'title': 'News'},
//         {'label':'Recipes', 'slug':'recipes', 'template':'subpage', 'title':'Recipes'}
//       ])
//       .catch(function(err) {
//         console.log(err);
//       })

//     })
//     .catch(() => {})


//     knex.schema.createTable('forgot_password', (table) => {
//       table.increments('idforgot_password',11)
//       table.integer('user_id',20)
//       table.string('code',45)
//       table.integer('pin',5)
//       table.datetime('issued_date')
//     })
//     .then(() => {})
//     .catch(() => {})


//     knex.schema.createTable('instantwin_plays', (table) => {
//       table.increments('id',11)
//       table.integer('user_id',20)
//       table.datetime('play_time')
//     })
//     .then(() => {})
//     .catch(() => {})

//     knex.schema.createTable('wheretobuy', (table) => {
//       table.increments('store_id',11)
//       table.string('storename',255)
//     })
//     .then(() => {})
//     .catch(() => {})

//     knex.schema.createTable('prizes', (table) => {
//       table.increments('id_prizes',11)
//       table.string('prize_name',255)
//       table.string('prize_img_url',255)
//       table.integer('prize_available',11)
//       table.integer('prize_claimed',11)
//       table.integer('prize_hold',11)
//     })  
//     .then(() => {})
//     .catch(() => {})
// /* 
// needs to be finished
//     knex.schema.createTable('prizes', (table) => {
//       table.increments('id',11)
//       table.string('"first_name"
//       table.string('"last_name"
//       table.string('"email"
//       table.string('"food_service_operator"
//       table.string('"mailing_list_opt_in"
//       table.string('"products_opt_in"
//       table.string('"number_of_team_members"
//       table.string('"phone"
//       table.string('"sanctioning_body"
//       table.string('"sanctioning_body_number_name"
//       table.string('"sanctioning_body_number"
//       table.string('"team_name"
//       table.string('"website"
//       table.string('"has_paid"
//       table.string('"contact_address"
//       table.string('"contact_city"
//       table.string('"contact_state"
//       table.string('"contact_zipcode"
//       table.string('"business_address"
//       table.string('"business_city"
//       table.string('"business_state"
//       table.string('"business_zipcode"
//       table.string('"business_name"
//       table.string('"number_of_team_members-othertext"
//       table.string('"sanctioning_body-othertext"
//       table.string('"paypal_transaction"
//       table.string('"submit_date"
//       table.string('"instagram"


//     })
//     .then(() => {})
//     .catch(() => {})

//      CREATE TABLE "committed_cooks" (
//           "id" int(11) NOT NULL AUTO_INCREMENT,
//           "first_name" varchar(255) DEFAULT NULL,
//           "last_name" varchar(255) DEFAULT NULL,
//           "email" varchar(255) DEFAULT NULL,
//           "food_service_operator" bit(1) DEFAULT NULL,
//           "mailing_list_opt_in" bit(1) DEFAULT b'0',
//            bit(1) DEFAULT b'0',
//            varchar(45) DEFAULT NULL,
//            varchar(45) DEFAULT NULL,
//            varchar(10000) DEFAULT NULL,
//            varchar(255) DEFAULT NULL,
//            varchar(255) DEFAULT NULL,
//            varchar(255) DEFAULT NULL,
//            varchar(255) DEFAULT NULL,
//            bit(1) DEFAULT b'0',
//            varchar(255) DEFAULT NULL,
//            varchar(255) DEFAULT NULL,
//            varchar(45) DEFAULT NULL,
//            varchar(45) DEFAULT NULL,
//            varchar(255) DEFAULT NULL,
//            varchar(255) DEFAULT NULL,
//            varchar(45) DEFAULT NULL,
//            varchar(45) DEFAULT NULL,
//            varchar(255) DEFAULT NULL,
//            varchar(45) DEFAULT NULL,
//            varchar(1000) DEFAULT NULL,
//            blob,
//            datetime DEFAULT CURRENT_TIMESTAMP,
//            text,
//           PRIMARY KEY ("id")
//         ) ENGINE=InnoDB AUTO_INCREMENT=1004 DEFAULT CHARSET=latin1;
//      */
//     knex.schema.createTable('instantwin_prizes', (table) => {
//       table.increments('prize_id',11)
//       table.string('name',255)
//       table.integer('tier',11)
//       table.datetime('award_time')
//       table.integer('user_id',20)
//       table.datetime('claim_time')
//       table.specificType('available', 'bit(1)')
//       table.string('claimed',45)
//       table.string('prize_code',255)
//       table.string('retailer',255)
//       table.string('sent_reminder',45)
//       table.string('reseeded',45)
//     })
//     .then(() => {})
//     .catch(() => {})


//     knex.schema.createTable('media_manager', (table) => {
//       table.increments('media_id',11)
//       table.string('media_url',255)
//       table.integer('uploaded_by',10)
//       table.string('media_type',5)
//       table.text('media_meta','longtext')
//       table.datetime('publish_date')
//       table.string('media_uuid',45)
//     })
//     .then(() => {})
//     .catch(() => {})


//     knex.schema.createTable('options', (table) => {
//       table.increments('options_id',11)
//     })
//     .then(() => {})
//     .catch(() => {})

//     knex.schema.createTable('post_content', (table) => {
//       table.increments('content_id',11)
//       table.string('title',255)
//       table.string('slug',45)
//       table.string('post_excerpt',255)
//       table.text('content','longtext')
//       table.text('meta','longtext')
//       table.datetime('publish_date')
//       table.string('post_modified',45)
//       table.integer('user_id',10)
//       table.integer('post_owner',10)
//       table.string('post_featured_image',255)
//       table.string('post_featured_thumbnail',255)
//     })
//     .then(() => {})
//     .catch(() => {})



//     knex.schema.createTable('role_types', (table) => {
//       table.increments('role_id',11)
//       table.string('label',45)
//     })
//     .then(() => {})
//     .catch(() => {})


//     knex.schema.createTable('roles', (table) => {
//       table.increments('role_id',11)
//       table.integer('user_id',10)
//       table.string('role',10)
//       table.datetime('created_at')
//       table.integer('created_by',10)
//       table.datetime('updated_at')
//       table.integer('updated_by',10)
//     })
//     .then(() => {})
//     .catch(() => {})


//     knex.schema.createTable('tokens', (table) => {
//       table.increments('token_id',11)
//       table.text('access_token')
//       table.integer('user_id',10)
//       table.specificType('expiration', 'bigint(20)')
//       table.specificType('valid', 'tinyint(1)')
//       table.datetime('created_at')
//       table.datetime('updated_at')
//     })
//     .then(() => {})
//     .catch(() => {})


//     knex.schema.createTable('users', (table) => {
//       table.increments('user_id',11)
//       table.string('email',255)
//       table.string('oauthID',45)
//       table.string('password',255)
//       table.string('oauthType',45)
//       table.string('firstname',45)
//       table.string('lastname',45)
//       table.string('address1',255)
//       table.string('address2',255)
//       table.string('city',255)
//       table.string('state',50)
//       table.string('zip',16)
//       table.string('phone',26)
//       table.datetime('created')
//       table.datetime('updated')
//       table.string('ip',45)
//       table.string('ua',255)
//     })
//     .then(() => {
//       inquirer
//       .prompt([
//         {
//           type: 'input',
//           name: 'email',
//           message: "Admin username:",
//           validate: function( value ) {
//             if (value.length) {
//               return true;
//             } else {
//               return 'Must enter a username.';
//             }
//           }
//         },
//         {
//           type: 'password',
//           name: 'password',
//           mask: '*',
//           message: "Please enter the default admin password:",
//           validate: function(value) {
//             if (value.length) {
//               return true;
//             } else {
//               return 'Please enter your password.';
//             }
//           }
//         },
//         {
//           type: 'password',
//           name: 'password2',
//           mask: '*',
//           message: "Please enter the default admin password again:",
//           validate: function(value) {
//             if (value.length) {
//               return true;
//             } else {
//               return 'Please enter your password.';
//             }
//             if(value != answers.password){
//               return "Passwords Don't Match"
//             }
//           }
//         },
//       ])
//       .then(answers => {
//         console.log(answers)
//         user.newUser(answers)
//         .then(function(user_id){
//           knex("roles")
//           .insert({
//             user_id:user_id,
//             role: "admin",
//             created_by:0,
//             updated_at: now,
//             created_at: now,
//             updated_by:0
//           })
//           .then(function(success){
//             console.log(chalk.green("${answers.email} has been created. Please visit the site to login."))
//           })
//         })
//       });
//     })
//     .catch(() => {})

//     //Custom tables for this project
//     knex.schema.createTable('events', (table) => {
//       table.increments('event_id',11)
//       table.string('event_label',255)
//       table.integer('event_posX',2)
//       table.integer('event_posY',2)
//       table.string('event_thumb',255)
//       table.string('event_link',255)
//       table.string('event_excerpt',"mediumtext")
//       table.string('event_location',"mediumtext")
//       table.datetime('event_start')
//       table.datetime('event_end')
//       table.unique('event_id')
//     })
//     .then(() => {})
//     .catch(() => {})


// })




module.exports = router;
