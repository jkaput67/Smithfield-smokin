var babel = require("gulp-babel");
var gulp = require("gulp");
var sass = require("gulp-sass");
var minifyCSS = require("gulp-csso");
var concat = require("gulp-concat");
var sourcemaps = require("gulp-sourcemaps");
var util = require('gulp-util');

/* 
Set stage/production flags. File will minify in production
*/
var config = {
    production: !!util.env.production
}

gulp.task("sass", function() {
	return gulp
		.src("public/stylesheets/style.scss")
		.pipe(sass().on("error", sass.logError))
		.pipe(config.production ? minifyCSS() : util.noop())
		.pipe(gulp.dest("public/stylesheets"));
});

gulp.task("js", function() {
	return gulp
		.src("public/javascripts/src/*.js")
		.pipe(babel())
		.pipe(sourcemaps.init())
		.pipe(concat("app.min.js"))
		.pipe(sourcemaps.write())
		.pipe(gulp.dest("public/javascripts/compiled"));
});
gulp.task("watch", function() {
	gulp.watch("public/javascripts/src/*.js", gulp.parallel("js"));
	gulp.watch("public/stylesheets/*.scss", gulp.parallel("sass"));
});

gulp.task(
	"default",
	gulp.series("sass", "js", "watch", function(done) {
		done();
	})
);
