var express = require("express");
var router = express.Router();
var config = require("../config");
var knex = require("knex").knex;
knex.knex = knex(config.connection);
var moment = require("moment");
var timezonemoment = require("moment-timezone");
var request = require("request");
var fs = require("fs");
var util = require("util");
var uuid = require("uuid");
var cron = require("node-cron");
var chalk = require("chalk");
var axios = require("axios");
var request = require('request');
const sleep = require('@lets/sleep');

let options = {
    headers:{
        Accept: "application/json",
        "X-Api-Key": "QmxtvQIfoiMiwbjmVf0Gvgtt"
    }
}

// cron job scheduler https://www.npmjs.com/package/node-cron

//bbqdata standings pull
cron.schedule("0 00 23 * * *", async function(){
    //run only on server
    if (!process.env.NODE_ENV || process.env.NODE_ENV == "" || process.env.NODE_ENV != "stage") {
        let now = moment().format("YYYY-MM-DD HH:mm:ss");
        try{
            let bbqstandings = await axios.get("https://bbqdata.com/v1/smithfield_standings.json", options)
            /* console.log(bbqstandings.data.standings) */
            let last_sync = await knex("standings").select("last_sync").orderBy("last_sync", "desc").limit(1);
            console.log(chalk.blue(last_sync[0].last_sync));
            //console.log(bbqstandings.data.standings)
            knex.transaction(async trx => {
                const queries = bbqstandings.data.standings.map(async entry => {
                    return knex("standings")
                        .insert({
                            team_name : entry.team_name,
                            results_year: entry.results_year,
                            bbqdata_team_id: entry.bbqdata_team_id,
                            pitmaster_name: entry.pitmaster_name,
                            place: entry.place,
                            points: entry.points,
                            orgs: JSON.stringify(entry.orgs),
                            last_points_earned: entry.last_points_earned,
                            last_points_contest_end_date: entry.last_points_contest_end_date,
                            last_points_contest_name: entry.last_points_contest_name,
                            last_points_contest_placed:entry.last_points_contest_placed,
                            last_points_contest_org: entry.last_points_contest_org,
                            committed_team: entry.committed_team,
                            last_sync: now,
                            points_change: entry.last_points_earned,
                            first_places:entry.first_places,
                            second_places:entry.second_places,
                            third_places:entry.third_places,
                            edge_id: entry.edge_id,
                            category: entry.category
                        })
                        .transacting(trx);
                })
                let writtenQueries = await Promise.all(queries); // Once every query is written
                await trx.commit;
                console.log(chalk.green("test route importing success"));
            });
            console.log(chalk.blue("Adding missing teams"));
            knex.transaction(async trx=>{
                const queries = bbqstandings.data.standings.map(async entry => {
                knex("teams")
                .select("team_name")
                .where({
                    team_name:entry.team_name
                })
                .then(team=>{
                        if(team.length==0){
                        return knex("teams")
                        .insert({
                            team_name:entry.team_name,
                            bbqdata_id: entry.bbqdata_team_id
                        })
                        }
                })
                .catch(err=>{console.log(err)})
                })
                let writtenQueries = await Promise.all(queries); // Once every query is written
                await trx.commit;
                console.log(chalk.green("Added missing teams"));
            })
        }
        catch(err){
            console.log(chalk.red("Error syncing"))
            console.log(err)
        }
        // var teams = await knex('standings')
        // .distinct()
        // .select('bbqdata_team_id')
        // .then(function(data) {
        //     var nums = [];
        //     data.forEach(x => {
        //         nums.push(x.bbqdata_team_id);
        //     })
        //     return nums
        // })
        // .catch(err=>{console.log(err)})
        // try {
        //     teams.forEach(team => {
        //         var teamStandingsUrl = "https://bbqdata.com/v1/smithfield_team_details?bbqdata_team_id=" + team + "&api_key=QmxtvQIfoiMiwbjmVf0Gvgtt";

        //         request(teamStandingsUrl, function (error, response, body) {
        //             console.log("request sent");
        //             if(error) {
        //                 console.log('error:', error); 
        //                 console.log(teamStandingsUrl);
        //             } else {
        //                 var points = JSON.parse(body.replace(/\\/g,"").replace("	\"","\""));
        //                 points.points_details.forEach(x => {
        //                     knex("bbq_events")
        //                     .insert({
        //                         results_year: points.results_year,
        //                         category: points.category,
        //                         bbqdata_team_id: points.bbqdata_team_id,
        //                         edge_id: points.edge_id,
        //                         team_name: points.team_name,
        //                         points: x.points_earned,
        //                         points_used: x.points_used,
        //                         contest_date: x.result_date,
        //                         contest_name: x.contest_name,
        //                         contest_placed: x.place,
        //                         last_sync: now,
        //                         org: x.org
        //                     })
        //                     .then(data => {
        //                         console.log('worked:', data);
        //                         console.log(teamStandingsUrl);
        //                     })
        //                 })
        //             }

        //         })
        //     })
        // }
        // catch(err){
        //     console.log(chalk.red("Error syncing"))
        //     console.log(err)
        // }
    }
})

router.get("/test", async function(req, res, next){
    if (!process.env.NODE_ENV || process.env.NODE_ENV == "" || process.env.NODE_ENV == "stage") {
        let now = moment().format("YYYY-MM-DD HH:mm:ss");
        try{
            let bbqstandings = await axios.get("https://bbqdata.com/v1/smithfield_standings.json", options)
            
            console.log(bbqstandings.data.standings) 
            let last_sync = await knex("standings").select("last_sync").orderBy("last_sync", "desc").limit(1);
            console.log(chalk.blue("Syncing: ", now));
            //console.log(bbqstandings.data.standings)
            knex.transaction(async trx => {
                const queries = bbqstandings.data.standings.map(async entry => {
                    //let prev = await knex("standings")
                    //        .select("team_name","points","last_sync")
                    //        .where({
                    //            team_name: entry.team_name,
                    //            last_sync: last_sync[0].last_sync
                    //        })
                    //        .returning("points")
                    //        .catch(err=>{console.log(err)}) 
                    //console.log(entry.points)
                    //console.log(prev[0].points)
                    //console.log(chalk.blue("entry"+ entry.points))
                    //console.log(chalk.blue(entry.points - prev.points))
                    return knex("standings")
                        .insert({
                            team_name : entry.team_name,
                            results_year: entry.results_year,
                            bbqdata_team_id: entry.bbqdata_team_id,
                            pitmaster_name: entry.pitmaster_name,
                            place: entry.place,
                            points: entry.points,
                            orgs: JSON.stringify(entry.orgs),
                            last_points_earned: entry.last_points_earned,
                            last_points_contest_end_date: entry.last_points_contest_end_date,
                            last_points_contest_name: entry.last_points_contest_name,
                            last_points_contest_placed:entry.last_points_contest_placed,
                            committed_team: entry.committed_team,
                            last_sync: now,
                            points_change: entry.last_points_earned,
                            first_places:entry.first_places,
                            second_places:entry.second_places,
                            third_places:entry.third_places,
                            edge_id: entry.edge_id,
                            category: entry.category
                        })
                        .transacting(trx);
                })
                let writtenQueries = await Promise.all(queries); // Once every query is written
                await trx.commit;
                console.log(chalk.green("test route importing success"));
            });
            console.log(chalk.blue("Adding missing teams"));
            knex.transaction(async trx=>{
                const queries = bbqstandings.data.standings.map(async entry => {
                knex("teams")
                .select("team_name")
                .where({
                    team_name:entry.team_name
                })
                .then(team=>{
                        if(team.length==0){
                        return knex("teams")
                        .insert({
                            team_name:entry.team_name,
                            bbqdata_id: entry.bbqdata_team_id
                        })
                        }
                })
                .catch(err=>{console.log(err)})
                })
                let writtenQueries = await Promise.all(queries); // Once every query is written
                await trx.commit;
                console.log(chalk.green("Added missing teams"));
            })
            
        }
        catch(err){
            console.log(chalk.red("Error syncing"))
            console.log(err)
            res.status(500).send(err)
        }
        res.status(200).send("ok")
    }
    else{
        res.redirect("/")
    }
});

router.get("/cron", async function(){
    //run only on server
    let now = moment().format("YYYY-MM-DD HH:mm:ss");
    try{
        let bbqstandings = await axios.get("https://bbqdata.com/v1/smithfield_standings.json", options)
        /* console.log(bbqstandings.data.standings) */
        let last_sync = await knex("standings").select("last_sync").orderBy("last_sync", "desc").limit(1);
        console.log(chalk.blue(last_sync[0].last_sync));
        //console.log(bbqstandings.data.standings)
        knex.transaction(async trx => {
            const queries = bbqstandings.data.standings.map(async entry => {
                return knex("standings")
                    .insert({
                        team_name : entry.team_name,
                        results_year: entry.results_year,
                        bbqdata_team_id: entry.bbqdata_team_id,
                        pitmaster_name: entry.pitmaster_name,
                        place: entry.place,
                        points: entry.points,
                        orgs: JSON.stringify(entry.orgs),
                        last_points_earned: entry.last_points_earned,
                        last_points_contest_end_date: entry.last_points_contest_end_date,
                        last_points_contest_name: entry.last_points_contest_name,
                        last_points_contest_placed:entry.last_points_contest_placed,
                        last_points_contest_org: entry.last_points_contest_org,
                        committed_team: entry.committed_team,
                        last_sync: now,
                        points_change: entry.last_points_earned,
                        first_places:entry.first_places,
                        second_places:entry.second_places,
                        third_places:entry.third_places,
                        edge_id: entry.edge_id,
                        category: entry.category
                    })
                    .transacting(trx);
            })
            let writtenQueries = await Promise.all(queries); // Once every query is written
            await trx.commit;
            console.log(chalk.green("test route importing success"));
        });
        console.log(chalk.blue("Adding missing teams"));
        knex.transaction(async trx=>{
            const queries = bbqstandings.data.standings.map(async entry => {
            knex("teams")
            .select("team_name")
            .where({
                team_name:entry.team_name
            })
            .then(team=>{
                    if(team.length==0){
                    return knex("teams")
                    .insert({
                        team_name:entry.team_name,
                        bbqdata_id: entry.bbqdata_team_id
                    })
                    }
            })
            .catch(err=>{console.log(err)})
            })
            let writtenQueries = await Promise.all(queries); // Once every query is written
            await trx.commit;
            console.log(chalk.green("Added missing teams"));
        })
    }
    catch(err){
        console.log(chalk.red("Error syncing"))
        console.log(err)
    }
    res.status(200).send("ok")
})

// router.get("/events-pull", async function(req, res) {
//     let now = moment().format("YYYY-MM-DD HH:mm:ss");

//     var teams = await knex('standings')
//     .distinct()
//     .select('bbqdata_team_id')
//     .then(function(data) {
//         var nums = [];
//         data.forEach(x => {
//             nums.push(x.bbqdata_team_id);
//         })
//         return nums
//     })
//     .catch(err=>{console.log(err)})

//     // var teams = [18876, 118181, 124052, 123950, 123940];
    
//     try {
//         teams.forEach(team => {
//             var teamStandingsUrl = "https://bbqdata.com/v1/smithfield_team_details?bbqdata_team_id=" + team + "&api_key=QmxtvQIfoiMiwbjmVf0Gvgtt";

//             request(teamStandingsUrl, function (error, response, body) {
//                 console.log("request sent");
//                 if(error) {
//                     console.log('error:', error); 
//                     console.log(teamStandingsUrl);
//                 } else {
//                     var points = JSON.parse(body.replace(/\\/g,"").replace("	\"","\""));
//                     points.points_details.forEach(x => {
//                         knex("bbq_events")
//                         .insert({
//                             results_year: points.results_year,
//                             category: points.category,
//                             bbqdata_team_id: points.bbqdata_team_id,
//                             edge_id: points.edge_id,
//                             team_name: points.team_name,
//                             points: x.points_earned,
//                             points_used: x.points_used,
//                             contest_date: x.result_date,
//                             contest_name: x.contest_name,
//                             contest_placed: x.place,
//                             last_sync: now,
//                             org: x.org
//                         })
//                         .then(data => {
//                             console.log('worked:', data);
//                             console.log(teamStandingsUrl);
//                         })
//                     })
//                     sleep(3000);
//                 }

//             })
//         })
//     }
//     catch(err){
//         console.log(chalk.red("Error syncing"))
//         console.log(err)
//     }

//     res.send("Event sync worked");
// });



module.exports = router;
console.log("  Cron Loaded.");