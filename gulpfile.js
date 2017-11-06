var gulp         = require('gulp');
var sass         = require('gulp-sass');
var less         = require('gulp-less');
var image        = require('gulp-image');
var uglify       = require('gulp-uglify');
var gulpIgnore   = require('gulp-ignore');
var cssnano      = require('gulp-cssnano');
var htmlmin      = require('gulp-htmlmin');
var changed      = require('gulp-changed');
var imageResize  = require('gulp-image-resize');
var autoprefixer = require('gulp-autoprefixer');
var prettify     = require('gulp-jsbeautifier');
var runSequence  = require('run-sequence');
var serveStatic  = require('serve-static');
var compression  = require('compression');
var fs           = require('file-system');
var sizeOf       = require('image-size');
var express      = require('express');
var http         = require('http');
var http2        = require('spdy');
var del          = require('del');
var opn          = require('opn');
var useref       = require('gulp-useref');


require('dotenv').config();


var imgPrefs = {
    pngquant: true,
    optipng: false,
    zopflipng: true,
    jpegRecompress: false,
    mozjpeg: true,
    guetzli: false,
    gifsicle: false,
    svgo: true,
    concurrent: 10
};

// https server with gzip and http2 (only if cert and key exist)

gulp.task('server', function(){
    fs.open('./.env', 'r', (err) => {
        if(err){
            if (err.code === 'ENOENT') {
                console.log('.env file not found');
                console.log("https://localhost:8888 only available when ssl cert and key are found");
                console.log("http://localhost:8888 in use");
                var dist = express();
                dist.use(compression())
                dist.use(serveStatic('./dist', {
                    'extensions': ['html'],
                    'maxAge': 3600000
                }))
                var disthttpsServer = http.createServer(dist);
                disthttpsServer.listen(8888);
                var dev = express();
                dev.use(compression())
                dev.use(serveStatic('./dev', {
                    'extensions': ['html'],
                    'maxAge': 3600000
                }))
                var devhttpsServer = http.createServer(dev);
                devhttpsServer.listen(8887);
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
                    var dist = express();
                    dist.use(compression())
                    dist.use(serveStatic('./dist', {
                        'extensions': ['html'],
                        'maxAge': 3600000
                    }))
                    var disthttpsServer = http.createServer(dist);
                    disthttpsServer.listen(8888);
                    opn('http://localhost:8888');
                    var dev = express();
                    dev.use(compression())
                    dev.use(serveStatic('./dev', {
                        'extensions': ['html'],
                        'maxAge': 3600000
                    }))
                    var devhttpsServer = http.createServer(dev);
                    devhttpsServer.listen(8887);
                    opn('http://localhost:8887');
                } else {
                    sslCrt = process.env.HOME + process.env.SSL_CRT_PATH
                    sslKey = process.env.HOME + process.env.SSL_KEY_PATH
                    var privateKey  = fs.readFileSync(sslKey, 'utf8');
                    var certificate = fs.readFileSync(sslCrt, 'utf8');
                    var credentials = {key: privateKey, cert: certificate};
                    var dist = express();
                    dist.use(compression())
                    dist.use(serveStatic('./dist', {
                        'extensions': ['html'],
                        'maxAge': 3600000
                    }))
                    var disthttpsServer = http2.createServer(credentials, dist);

                    disthttpsServer.listen(8888);
                    console.log("https://localhost:8888");
                    //opn('https://localhost:8888');

                    var dev = express();
                    dev.use(compression())
                    dev.use(serveStatic('./dist', {
                        'extensions': ['html'],
                        'maxAge': 3600000
                    }))
                    var devhttpsServer = http2.createServer(credentials, dev);
                    devhttpsServer.listen(8887);
                    console.log("https://localhost:8887");
                    //opn('https://localhost:8887');
                }
            })
        }
    })
})

// less compilation + minification

gulp.task('less', function () {
  return gulp.src('src/less/**/*.less')
    .pipe(changed('dist/css'))
    .pipe(less())
    .pipe( autoprefixer({
            browsers: ['>1%'],
            cascade: false
    }))
    .pipe(gulp.dest('dev/css'))
    .pipe(cssnano())
    .pipe(gulp.dest('dist/css'))
})

// sass compilation + minification

gulp.task('sass', function () {
  return gulp.src('src/sass/**/*.scss')
    .pipe(changed('dist/css'))
    .pipe(sass())
    .pipe(autoprefixer({
            browsers: ['>1%'],
            cascade: false
    }))
    .pipe(gulp.dest('dev/css'))
    .pipe(cssnano())
    .pipe(gulp.dest('dist/css'))
})

// css minification

gulp.task('css', function() {
  return gulp.src('src/css/**/*.css')
    .pipe(changed('dist/css'))
    .pipe(autoprefixer({
    browsers: ['>1%'],
    cascade: false
    }))
    .pipe(gulp.dest('dev/css'))
    .pipe(cssnano())
    .pipe(gulp.dest('dist/css'))
})

// js minification + uglification

gulp.task('js', function() {
  return gulp.src('src/js/**/*.js')
  .pipe(changed('dist/js'))
  .pipe(gulp.dest('dev/js'))
  .pipe(uglify())
  .pipe(gulp.dest('dist/js'))
})

// image optimization

gulp.task('images', function() {
  return gulp.src('src/images/**/*.{png,jpg,jpeg,gif,svg}')
  .pipe(changed('dist/images'))
  .pipe(image(imgPrefs))
  .pipe(gulp.dest('dist/images'))
  .pipe(gulp.dest('dev/images'))
})

// html minification

gulp.task('html', function() {
  return gulp.src('src/**/*.html')
  .pipe(changed('dist'))
  .pipe(gulp.dest('dist'))
  .pipe(htmlmin({
    collapseWhitespace: true,
    removeComments: true,
    minifyCSS: true,
    minifyJS: true
  }))
  .pipe(gulp.dest('dev'))
})

// useref test

gulp.task('combine', function(){
    return gulp.src('dist/**/*.html')
    .pipe(useref())
    .pipe(htmlmin({
        collapseWhitespace: true,
        removeComments: true,
        minifyCSS: true,
        minifyJS: true
    }))
    .pipe(gulp.dest('dist'))
})

// copy everything else

gulp.task('other', function() {
  return gulp.src(['src/**/*.*', '!src/**/*.html', '!src/**/*.css', '!src/**/*.js', '!src/**/*.less', '!src/**/*.scss', '!src/images/*.png', '!src/images/*.jpg', '!src/images/*.jpeg', '!src/images/*.gif', '!src/images/*.svg' ])
  .pipe(changed('dist'))
  .pipe(gulp.dest('dev'))
  .pipe(gulp.dest('dist'))
})


// Cleaning

gulp.task('clean', function() {
  return del.sync(['dist', 'dev'])
})

gulp.task('clean:dev', function() {
  return del.sync('dev')
})

gulp.task('clean:dist', function() {
  return del.sync('dist')
})

gulp.task('clean:code', function() {
  return del.sync(['dist/**/*', '!dist/images', '!dist/images/**/*', 'dev/**/*', '!dev/images', '!dev/images/**/*'])
})


// Prettify css js html

gulp.task('prettify:dev', function() {
  return gulp.src('dev/**/*.+(html|css|js|less|scss)')
    .pipe(prettify())
    .pipe(gulp.dest('dev'))
})

gulp.task('prettify:src', function() {
  return gulp.src('src/**/*.+(html|css|js|less|scss)')
    .pipe(prettify())
    .pipe(gulp.dest('src'))
})




/* TODO optimize */

var lt256 = function (file) {
    var dimensions = sizeOf(file.path);
    if(dimensions.width > 256) {
        return false;
    }else{
        return true;
    }
};
var lt512 = function (file) {
    var dimensions = sizeOf(file.path);
    if(dimensions.width > 512) {
        return false;
    }else{
        return true;
    }
};
var lt1024 = function (file) {
    var dimensions = sizeOf(file.path);
    if(dimensions.width > 1024) {
        return false;
    }else{
        return true;
    }
};
var lt2048 = function (file) {
    var dimensions = sizeOf(file.path);
    if(dimensions.width > 2048) {
        return false;
    }else{
        return true;
    }
};


gulp.task('resize256', function() {
  return gulp.src('src/images/**/*.{jpg,jpeg,png,gif}')
    .pipe(changed('dist/images/256'))
    .pipe(gulpIgnore(lt256))
    .pipe(imageResize({
      width : 256
    }))
    .pipe(image(imgPrefs))
    .pipe(gulp.dest('dev/images/256'))
    .pipe(gulp.dest('dist/images/256'))
})

gulp.task('resize512', function() {
  return gulp.src('src/images/**/*.{jpg,jpeg,png,gif}')
    .pipe(changed('dist/images/512'))
    .pipe(gulpIgnore(lt512))
    .pipe(imageResize({
      width : 512
    }))
    .pipe(image(imgPrefs))
    .pipe(gulp.dest('dev/images/512'))
    .pipe(gulp.dest('dist/images/512'))
})

gulp.task('resize1024', function() {
  return gulp.src('src/images/**/*.{jpg,jpeg,png,gif}')
    .pipe(changed('dist/images/1024'))
    .pipe(gulpIgnore(lt1024))
    .pipe(imageResize({
      width : 1024
    }))
    .pipe(image(imgPrefs))
    .pipe(gulp.dest('dev/images/1024'))
    .pipe(gulp.dest('dist/images/1024'))
})

gulp.task('resize2048', function() {
  return gulp.src('src/images/**/*.{jpg,jpeg,png,gif}')
    .pipe(changed('dist/images/2048'))
    .pipe(gulpIgnore(lt2048))
    .pipe(imageResize({
      width : 2048
    }))
    .pipe(image(imgPrefs))
    .pipe(gulp.dest('dev/images/2048'))
    .pipe(gulp.dest('dist/images/2048'))
})

gulp.task('resize', function(callback) {
  runSequence(
    'resize2048',
    'resize1024',
    'resize512',
    'resize256',
    callback
  )
})

// Build

gulp.task('build', function(callback) {
  runSequence(
    'less',
    'sass',
    'css',
    'js',
    'images',
    'resize',
    'html',
    'combine',
    'other',
    'prettify:dev',
    callback
  )
})

// Watch

gulp.task('watch', function() {
    gulp.watch('src/**/*', ['build'])
})

// Gulp - Build + Watch + start-servers

gulp.task('default', function(callback) {
  runSequence(
    'build',
    'watch',
    'server',
    callback
  )
})
