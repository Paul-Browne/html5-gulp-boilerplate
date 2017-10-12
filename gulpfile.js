var gulp         = require('gulp');
var gulpIf       = require('gulp-if');
var sass         = require('gulp-sass');
var less         = require('gulp-less');
var image        = require('gulp-image');
var uglify       = require('gulp-uglify');
var concat       = require('gulp-concat');
var cssnano      = require('gulp-cssnano');
var htmlmin      = require('gulp-htmlmin');
var changed      = require('gulp-changed');
var autoprefixer = require('gulp-autoprefixer');
var prettify     = require('gulp-jsbeautifier');
var runSequence  = require('run-sequence');
var serveStatic  = require('serve-static');
var compression  = require('compression');
var fs           = require('file-system');
var express      = require('express');
var http         = require('http');
var http2        = require('spdy');
var del          = require('del');
var opn          = require('opn');

require('dotenv').config();

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
                    opn('https://localhost:8888');

                    var dev = express();
                    dev.use(compression())
                    dev.use(serveStatic('./dist', {
                        'extensions': ['html'],
                        'maxAge': 3600000
                    }))
                    var devhttpsServer = http2.createServer(credentials, dev);
                    devhttpsServer.listen(8887);
                    console.log("https://localhost:8887");
                    opn('https://localhost:8887');
                }
            })
        }
    })
})

// debug server

gulp.task('server:dev', function(){
    var app = express();
    app.use(serveStatic('./dev', {
        'extensions': ['html'],
        'maxAge': 3600000
    }))
    var httpsServer = http.createServer(app);
    httpsServer.listen(8887);
    console.log("dev server http://localhost:8887");
})

// less compilation + minification

gulp.task('less:dev', function () {
  return gulp.src('src/less/**/*.less')
    .pipe(changed('dev/css'))
    .pipe(less())
    .pipe(gulpIf('*.css', autoprefixer({
            browsers: ['>1%'],
            cascade: false
    })))
    .pipe(gulp.dest('dev/css'))
})

gulp.task('less:dist', function () {
  return gulp.src('src/less/**/*.less')
    .pipe(changed('dist/css'))
    .pipe(less())
    .pipe(gulpIf('*.css', autoprefixer({
            browsers: ['>1%'],
            cascade: false
    })))
    .pipe(gulpIf('*.css', cssnano()))
    .pipe(gulp.dest('dist/css'))
})

// sass compilation + minification

gulp.task('sass:dev', function () {
  return gulp.src('src/sass/**/*.scss')
    .pipe(changed('dev/css'))
    .pipe(sass().on('error', sass.logError))
    .pipe(gulpIf('*.css', autoprefixer({
            browsers: ['>1%'],
            cascade: false
    })))
    .pipe(gulp.dest('dev/css'))
})

gulp.task('sass:dist', function () {
  return gulp.src('src/sass/**/*.scss')
    .pipe(changed('dist/css'))
    .pipe(sass())
    .pipe(gulpIf('*.css', autoprefixer({
            browsers: ['>1%'],
            cascade: false
    })))
    .pipe(gulpIf('*.css', cssnano()))
    .pipe(gulp.dest('dist/css'))
})

// css minification

gulp.task('css:dev', function() {
  return gulp.src('src/css/**/*.css')
  .pipe(changed('dev/css'))
  .pipe(gulpIf('*.css', autoprefixer({
    browsers: ['>1%'],
    cascade: false
  })))
  .pipe(gulp.dest('dev/css'))
})

gulp.task('css:dist', function() {
  return gulp.src('src/css/**/*.css')
  .pipe(changed('dist/css'))
  .pipe(gulpIf('*.css', autoprefixer({
    browsers: ['>1%'],
    cascade: false
  })))
  .pipe(gulpIf('*.css', cssnano()))
  .pipe(gulp.dest('dist/css'))
})

// file combining
// TODO - needs work

gulp.task('combine', function() {
  return gulp.src('dist/css/**/*.css')
  .pipe(concat('comb.css'))
  .pipe(gulp.dest('dist/css'))
})

// js minification + uglification

gulp.task('js:dev', function() {
  return gulp.src('src/js/**/*.js')
  .pipe(changed('dev/js'))
  .pipe(gulp.dest('dev/js'))
})

gulp.task('js:dist', function() {
  return gulp.src('src/js/**/*.js')
  .pipe(changed('dist/js'))
  .pipe(gulpIf('*.js', uglify()))
  .pipe(gulp.dest('dist/js'))
})

// image optimization

gulp.task('images:dev', function() {
  return gulp.src('src/images/**/*')
  .pipe(changed('dev/images'))
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
  .pipe(gulp.dest('dev/images'))
})

gulp.task('images:dist', function() {
  return gulp.src('src/images/**/*')
  .pipe(changed('dist/images'))
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
  .pipe(gulp.dest('dist/images'))
})

// html minification

gulp.task('html:dev', function() {
  return gulp.src('src/**/*.html')
  .pipe(changed('dev'))
  .pipe(gulp.dest('dev'))
})

gulp.task('html:dist', function() {
  return gulp.src('src/**/*.html')
  .pipe(changed('dist'))
  .pipe(gulpIf('*.html', htmlmin({
    collapseWhitespace: true,
    removeComments: true,
    minifyCSS: true,
    minifyJS: true
  })))
  .pipe(gulp.dest('dist'))
})

// copy everything else

gulp.task('other:dev', function() {
  return gulp.src(['src/**/*.*', '!src/**/*.html', '!src/**/*.css', '!src/**/*.js', '!src/**/*.less', '!src/**/*.scss', '!src/**/*.png', '!src/**/*.jpg', '!src/**/*.jpeg', '!src/**/*.gif', '!src/**/*.svg' ])
  .pipe(changed('dev'))
  .pipe(gulp.dest('dev'))
})

gulp.task('other:dist', function() {
  return gulp.src(['src/**/*.*', '!src/**/*.html', '!src/**/*.css', '!src/**/*.js', '!src/**/*.less', '!src/**/*.scss', '!src/**/*.png', '!src/**/*.jpg', '!src/**/*.jpeg', '!src/**/*.gif', '!src/**/*.svg' ])
  .pipe(changed('dist'))
  .pipe(gulp.dest('dist'))
})

// Cleaning

gulp.task('clean', function() {
  return del.sync(['dist', 'dev']);
})

gulp.task('clean:dev', function() {
  return del.sync('dev');
})

gulp.task('clean:dist', function() {
  return del.sync('dist');
})

gulp.task('clean:code', function() {
  return del.sync(['dist/**/*', '!dist/images', '!dist/images/**/*', 'dev/**/*', '!dev/images', '!dev/images/**/*']);
});


// Prettify css js html

gulp.task('prettify:dev', function() {
  gulp.src('dev/**/*.+(html|css|js)')
    .pipe(prettify())
    .pipe(gulp.dest('dev'));
});

gulp.task('prettify:src', function() {
  gulp.src('src/**/*.+(html|css|js)')
    .pipe(prettify())
    .pipe(gulp.dest('src'));
});
// Build

gulp.task('build:dev', function(callback) {
  console.log('dev build started...');
  runSequence(
    'less:dev',
    'sass:dev',
    'css:dev',
    'js:dev',
    'images:dev',
    'html:dev',
    'other:dev',
    'prettify:dev',
    callback
  )
})

gulp.task('build:dist', function(callback) {
  console.log('dist build started...');
  runSequence(
    'less:dist',
    'sass:dist',
    'css:dist',
    'js:dist',
    'images:dist',
    'html:dist',
    'other:dist',
    callback
  )
})

// Watch

gulp.task('watch', function() {
    gulp.watch('src/**/*', ['build:dev', 'build:dist']);
})

// Gulp - Build + Watch + start-servers

gulp.task('default', function(callback) {
  runSequence(
    'build:dev',
    'build:dist',
    'watch',
    'server',
    callback
  )
})


/*
CRON TASK
git pull -r
gulp build:dist
gulp clean:dev (just incase)
restart nginx
*/


