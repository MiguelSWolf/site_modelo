"use strict";

// Load plugins
const autoprefixer = require("autoprefixer");
const browsersync = require("browser-sync").create();
const cp = require("child_process");
const cssnano = require("cssnano");
const del = require("del");
const eslint = require("gulp-eslint");
const gulp = require("gulp");
const imagemin = require("gulp-imagemin");
const newer = require("gulp-newer");
const plumber = require("gulp-plumber");
const postcss = require("gulp-postcss");
const rename = require("gulp-rename");
const sass = require("gulp-sass");
const webpack = require("webpack");
const webpackconfig = require("./webpack.config.js");
const webpackstream = require("webpack-stream");

// BrowserSync
function browserSync(done) {
  browsersync.init({
    server: {
      baseDir: "./"
    },
    port: 3000
  });
  done();
}

// BrowserSync Reload
function browserSyncReload(done) {
  browsersync.reload();
  done();
}

// Clean assets
function cleanjs() {
  return del(["./script","./style"]);
}

// Optimize Images
function images() {
  return gulp
    .src("./assets/img/**/*")
    .pipe(newer("./_site/assets/img"))
    .pipe(
      imagemin([
        imagemin.gifsicle({ interlaced: true }),
        imagemin.jpegtran({ progressive: true }),
        imagemin.optipng({ optimizationLevel: 5 }),
        imagemin.svgo({
          plugins: [
            {
              removeViewBox: false,
              collapseGroups: true
            }
          ]
        })
      ])
    )
    .pipe(gulp.dest("./_site/assets/img"));
}

// CSS task
function css() {
  return gulp
    .src("./scss/**/*.scss")
    .pipe(plumber())
    .pipe(sass({ outputStyle: "expanded" }))
    .pipe(gulp.dest("./css/"))
    .pipe(rename({ suffix: ".min" }))
    .pipe(postcss([autoprefixer(), cssnano()]))
    .pipe(gulp.dest("./style/"))
    .pipe(browsersync.stream());
}

// Lint scripts
function scriptsLint() {
  return gulp
    .src(["./js/**/*"])
    .pipe(plumber())
    .pipe(eslint())
    .pipe(eslint.format())
    .pipe(eslint.failAfterError());
}

// Transpile, concatenate and minify scripts
function scripts() {
  return (
    gulp
      .src(["./js/**/*"])
      .pipe(plumber())
      .pipe(webpackstream(webpackconfig, webpack))
      // folder only, filename is specified in webpack config
      .pipe(gulp.dest("./script/"))
      .pipe(browsersync.stream())
  );
}






// Watch files
function watchFiles() {
  gulp.watch("./scss/**/*", css);
  gulp.watch("./js/**/*", gulp.series(cleanjs, scriptsLint, scripts));
  gulp.watch("./*.html", gulp.series(browserSyncReload));









  gulp.watch("./original/**/*", images);
}

// define complex tasks
const js = gulp.series(cleanjs, scriptsLint, scripts);
const build = gulp.series(gulp.parallel(css, js));
const watch = gulp.parallel(watchFiles, browserSync);

// export tasks
exports.images = images;
exports.css = css;
exports.js = js;

exports.build = build;

exports.watch = watch;
exports.default = build;