var gulp         = require('gulp');
var gulpIf       = require('gulp-if');
var cssnano      = require('gulp-cssnano');
var uglify       = require('gulp-uglify');
var htmlmin      = require('gulp-htmlmin');
var image        = require('gulp-image');
var changed      = require('gulp-changed');
var sass         = require('gulp-sass');
var less         = require('gulp-less');
var autoprefixer = require('gulp-autoprefixer');
var prettify     = require('gulp-jsbeautifier');
var fs           = require('file-system');
var runSequence  = require('run-sequence');
var del          = require('del');
var http         = require('http');
var http2        = require('spdy');
var express      = require('express');
var compression  = require('compression');
var serveStatic  = require('serve-static');
require('dotenv').config();


// https server with gzip and http2 (only if cert and key exist)

gulp.task('server', function(){
    fs.open('./.env', 'r', (err) => {
        if(err){
            if (err.code === 'ENOENT') {
                console.log('.env file not found');
                console.log("https://localhost:8888 only available when ssl cert and key are found");
                console.log("http://localhost:8888 in use");
                var app = express();
                app.use(compression())
                app.use(serveStatic('./dist', {
                    'extensions': ['html'],
                    'maxAge': 3600000
                }))
                var httpsServer = http.createServer(app);
                httpsServer.listen(8888);
            }
        } else {
            fs.readFile('./.env', 'utf8', (err, data) => {
                if( data.indexOf('SSL_CRT_PATH') < 0 || data.indexOf('SSL_KEY_PATH') < 0 ){
                    if(data.indexOf('SSL_CRT_PATH') < 0 ){
                        console.log("no 'SSL_CRT_PATH' found in .env file");
                    }
                    if(data.indexOf('SSL_KEY_PATH') < 0 ){
                        console.log("no 'SSL_KEY_PATH' found in .env file");
                    }
                    console.log("https://localhost:8888 only available when ssl cert and key are found");
                    console.log("http://localhost:8888 in use");
                    var app = express();
                    app.use(compression())
                    app.use(serveStatic('./dist', {
                        'extensions': ['html'],
                        'maxAge': 3600000
                    }))
                    var httpsServer = http.createServer(app);
                    httpsServer.listen(8888);
                } else {
                    sslCrt = process.env.HOME + process.env.SSL_CRT_PATH
                    sslKey = process.env.HOME + process.env.SSL_KEY_PATH
                    var privateKey  = fs.readFileSync(sslKey, 'utf8');
                    var certificate = fs.readFileSync(sslCrt, 'utf8');
                    var credentials = {key: privateKey, cert: certificate};
                    var app = express();
                    app.use(compression())
                    app.use(serveStatic('./dist', {
                        'extensions': ['html'],
                        'maxAge': 3600000
                    }))
                    var httpsServer = http2.createServer(credentials, app);
                    httpsServer.listen(8888);
                    console.log("https://localhost:8888");
                }
            })
        }
    })
})

// debug server

gulp.task('debug-server', function(){
    var app = express();
    app.use(serveStatic('./src', {
        'extensions': ['html'],
        'maxAge': 3600000
    }))
    var httpsServer = http.createServer(app);
    httpsServer.listen(8887);
    console.log("debug server http://localhost:8887");
})

// less compilation

gulp.task('less', function () {
  return gulp.src('src/less/**/*.less')
    .pipe(changed('dist/css'))
    .pipe(less())
    .pipe(gulpIf('*.css', autoprefixer({
            browsers: ['>1%'],
            cascade: false
    })))
    .pipe(gulpIf('*.css', cssnano()))
    .pipe(gulp.dest('dist/css'));
});

// sass compilation

gulp.task('sass', function () {
  return gulp.src('src/sass/**/*.scss')
    .pipe(changed('dist/css'))
    .pipe(sass().on('error', sass.logError))
    .pipe(gulpIf('*.css', autoprefixer({
            browsers: ['>1%'],
            cascade: false
    })))
    .pipe(gulpIf('*.css', cssnano()))
    .pipe(gulp.dest('dist/css'));
});


// minify + uglify css, js and html
// optimize images
// copy all to dest

gulp.task('minify-uglify-optimize', function() {
  return gulp.src(['src/**/*', '!src/sass', '!src/sass/**/*', '!src/less', '!src/less/**/*'])
    .pipe(changed('dist'))
    .pipe(gulpIf('*.js', uglify()))
    .pipe(gulpIf('*.css', autoprefixer({
            browsers: ['>1%'],
            cascade: false
    })))
    .pipe(gulpIf('*.css', cssnano()))
    .pipe(gulpIf('*.html', htmlmin({
      collapseWhitespace: true,
      removeComments: true,
      minifyCSS: true,
      minifyJS: true
    })))
    .pipe(gulpIf(/.*\.(png|jpg|jpeg|gif|svg)$/, image({
      pngquant: true,
      optipng: false,
      zopflipng: true,
      jpegRecompress: false,
      mozjpeg: true,
      guetzli: false,
      gifsicle: true,
      svgo: true,
      concurrent: 10
    })))
    //.pipe(gulpIf(/.*\.(js|css|html|png|jpg|jpeg|gif|svg)$/, gulp.dest('dist')))
    .pipe(gulp.dest('dist'))
})

// Cleaning

gulp.task('clean:all', function() {
  return del.sync('dist');
})

gulp.task('clean:code', function() {
  return del.sync(['dist/**/*', '!dist/images', '!dist/images/**/*']);
});

// Build

gulp.task('build', function(callback) {
  runSequence(
    'less',
    'sass',
    'minify-uglify-optimize',
    callback
  )
})

// Watch

gulp.task('watch', function() {
    gulp.watch('src/**/*', ['build']);
})


// Prettify css js html

gulp.task('prettify', function() {
  gulp.src('src/**/*.+(html|css|js)')
    .pipe(prettify())
    .pipe(gulp.dest('src'));
});

// Gulp - Build + Watch + start-servers

gulp.task('default', function(callback) {
  runSequence(
    'build',
    'watch',
    'debug-server',
    'server',
    callback
  )
})
