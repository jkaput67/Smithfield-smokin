var config = require("../config");
var knex = require("knex").knex;
knex.knex = knex(config.connection);

function getPageBySlug(slug) {
    return new Promise(function(resolve, reject) {
        if(slug == "images" || slug == "javascripts" || slug == "css"){
            reject("No Content")
        }
        knex("content_manager")
        .select("*")
        .where({
            post_slug:slug,
            status: "publish"
        })
        .then(function(data){
            if(data.length == 0){
               reject("No Content")
            }
            else{
                knex("post_content")
                .select("*")
                .where({
                    content_id: data[0].post_contentID
                })
                .then(function(content){
                    content[0].template = data[0].template
                    content[0].slug = slug
                    resolve(content[0])
                })
            }
        })
    });
}
function getPageById(id) {
    return new Promise(function(resolve, reject) {
        knex("content_manager")
        .select("*")
        .where({
            cm_id:id,
            status: "publish"
        })
        .then(function(data){
            if(data.length == 0){
               reject("No Content")
            }
            else{
                knex("post_content")
                .select("*")
                .where({
                    content_id: data[0].post_contentID
                })
                .then(function(content){
                    content[0].template = data[0].template
                    content[0].slug = slug
                    resolve(content[0])
                })
            }
        })
    });
}

function getPagesByTemplate(template){
    return new Promise(function(resolve, reject) {

    })
}
function getPagesByPostType(posttype){
    return new Promise(function(resolve, reject) {

    })
}
function getPageInfo(id){
    return new Promise(function(resolve, reject) {

    })
}

function getPageArrayByIds(pagesarray){
    let pages = []
    return new Promise(function(resolve, reject) {
        pagesarray.forEach(id => {
            
        });
    })
}
function getLatestPost(pagesarray){
    let pages = []
    return new Promise(function(resolve, reject) {
        pagesarray.forEach(id => {
            
        });
    })
}

module.exports = {
    getPageBySlug,
    getPageById,
    getPageArrayByIds,
    getPageInfo,
    getLatestPost

};