const gulp = require('gulp');
const concat = require('gulp-concat');
const uglify = require('gulp-uglify-es').default;
const minify = require('gulp-minify-css');

//responsive images module that requires 'sharp' installed
// note gulp-responsive would NOT work when installed globally
const responsive = require('gulp-responsive');

// automatically load any package dependencies (package.json)
// here for reference
// const $ = require('gulp-load-plugins')();

const rename = require('gulp-rename');

// working with live reload for testing
const  connect = require('gulp-connect');

/*
 *
 */
gulp.task('js', function() {
   return gulp.src('src/js/*.js')
      // no concat
      // .pipe(concat('rest_review_min.js'))
      .pipe(uglify())
      // keep same names - too many changes to src
      // .pipe(rename({ suffix: '_min' }))
      .pipe(gulp.dest('public/js'));
});


// copy html and js from root of src to root of public
gulp.task('copy-root-files', function() {
   gulp.src(['src/*.html', 'src/*.js', 'src/*.ico', 'src/manifest.json'] )
      .pipe(gulp.dest('./public'))
      .pipe(connect.reload()); // reload browser
});

// only one css used in this project
gulp.task('css', function() {
   gulp.src('src/css/*.css')
      .pipe(minify())
      .pipe(gulp.dest('public/css'));
});

// optimize images: resize one source image to multiple output resolutions
// https://github.com/mahnunchik/gulp-responsive/blob/HEAD/examples/multiple-resolutions.md
gulp.task('responsive-img', function() {
  gulp.src('src/img/*')
    .pipe(responsive( {
      '*.jpg' : [
        {
          width: 480,
          quality: 90,
          rename: {suffix: '_480px'}
        },
        {
          width: 320,
          quality: 90,
          rename: {suffix: '_320px'}
        },
        {
          // Compress, strip metadata, and keep original image name
          rename: { suffix: '' }
        }
      ]
    }))
      .pipe(gulp.dest('public/img'));
});


/*
 * make sure the icon images are copied over
 */
gulp.task('copy-icons', function() {
  gulp.src('src/img/icons/*.*')
    .pipe(gulp.dest('public/img/icons'));

});


/*
 * LiveReload - auto refresh browser when code changes are saved
 *    uses gulp-connect - small server to host files
 *       live reload is bundled with it
 *
 * watch task to monitor when file changes and then uses copy task to
 * update public folder
 *
 * !!! Did NOT work well with sails dev server used in stage 2 !!!
 *     No 'Access-Control-Allow-Origin' header is present on the
       requested resource.
 */
gulp.task('watch', function () {
  gulp.watch(['src/*.html', 'src/*.js'], ['copy-root-files']);
});


gulp.task('connect', function () {
  connect.server({
    port: 8000,
    root: 'public/',
    livereload: true
  });
});


gulp.task('default',
    [
      'js',
      'copy-root-files',
      'css',
      'responsive-img',
      'copy-icons'
      /*
      'connect',
      'watch'
      */
    ],
  function() {
    console.log('Gulp did its thing!');
});




