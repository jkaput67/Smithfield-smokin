var config = require("../config");
var knex = require("knex").knex;
knex.knex = knex(config.connection);
var moment = require("moment");
var uuid = require("uuid");
var chalk = require("chalk");
var jimp = require('jimp');
var AWS = require('aws-sdk');
var fs= require('fs');

function uploadImage(img){
    __logMsg("Upload Image")
    let img_uuid = uuid.v1();
    let extension = img.name.substring(img.name.lastIndexOf('.'));
    __uploadToS3(img, img_uuid, extension);
    return "https://"+config.aws.S3_BUCKET+".s3.amazonaws.com/media/"+img_uuid+extension
}

function mediaManagerUpload(img, user_id){
    let now = new moment().format('YYYY-MM-DD HH:mm:ss')
    let img_uuid = uuid.v1();
    let extension = img.name.substring(img.name.lastIndexOf('.')).replace(".","");
    let url="";
    __logMsg("Media Manager upload");
    /*
    Create a folder-like structure for our image assets.
    ex: https://s3.amazonaws.com/ims-core/media/22/edge_logo_white.png
    */
   return new Promise(function(resolve, reject) {
        knex("media_manager")
        .insert({
            uploaded_by: user_id,
            media_type: extension,
            publish_date: now,
            media_uuid: img_uuid
        })
        .returning("media_id")
        .then(function(media_id){
            url = "https://s3.amazonaws.com/"+config.aws.S3_BUCKET+"/media/"+media_id+"/"+img.name
            __uploadToS3(img, 'media/'+media_id+"/"+img.name, extension);
            return knex("media_manager").select("*").where({media_id:media_id}).update({media_url:url})
        })
        .then(function(data){
            __logMsg(url)
            resolve(url)
        })
        .catch(err=>{__logMsg(err)}) 
   });
}

function __logMsg(msg) {
	//only log on dev and stage
	if (
		!process.env.NODE_ENV ||
		process.env.NODE_ENV == "" ||
		process.env.NODE_ENV == "stage"
	) {
		console.log(chalk.green(msg));
	}
}

function __uploadToS3(file, uuid, ext) {
    //get file object from the request, the generated uuid, and the extension
    let s3bucket = new AWS.S3({
      accessKeyId: config.aws.AWS_ACCESS_KEY,
      secretAccessKey: config.aws.AWS_SECRET_KEY,
      Bucket: config.aws.S3_BUCKET,
    });
    var params = {
      Bucket: config.aws.S3_BUCKET,
      Key: uuid,
      Body: fs.createReadStream(file.path),
    };
    s3bucket.upload(params, function (err, data) {
        if (err) {
            __logMsg('error in callback');
            __logMsg(err);
        }
        __logMsg('s3 upload success');
    });
}


module.exports = {
    uploadImage,
    mediaManagerUpload
};