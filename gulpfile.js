var gulp = require('gulp');
var scss = require('gulp-sass');
var less = require('gulp-less');
var image = require('gulp-image');
var uglify = require('gulp-uglify');
var cssnano = require('gulp-cssnano');
var htmlmin = require('gulp-htmlmin');
var changed = require('gulp-changed');
var autoprefixer = require('gulp-autoprefixer');
var prettify = require('gulp-jsbeautifier');
var imageResize = require('gulp-image-resize');
var gulpIgnore = require('gulp-ignore');
var useref = require('gulp-useref')
var runSequence = require('run-sequence');
var serveStatic = require('serve-static');
var compression = require('compression');
var express = require('express');
var http = require('http');
var del = require('del');
var sizeOf = require('image-size');
var fs = require('file-system');
var http2 = require('spdy');

require('dotenv').config();

// image optimization

var imgPrefs = {
    pngquant: true,
    optipng: true,
    zopflipng: true,
    jpegRecompress: true,
    mozjpeg: true,
    guetzli: false,
    gifsicle: false,
    svgo: true,
    concurrent: 10
};

// console log changed files using gulpIgnore

var message = function(file) {
    console.log(file.path);
    return false;
}

// server

function serverSetup(protocal) {
    var app = express();
    app.use(compression())
    app.use(serveStatic('./dist', {
        'extensions': ['html'],
        'maxAge': 3600000
    }))
    if (protocal === "https") {
        http2.createServer({
            key: fs.readFileSync(process.env.HOME + process.env.SSL_KEY_PATH, 'utf8'),
            cert: fs.readFileSync(process.env.HOME + process.env.SSL_CRT_PATH, 'utf8')
        }, app).listen(8888);
    } else {
        http.createServer(app).listen(8888);
    }
    console.log(protocal + "://localhost:8888");
}

gulp.task('server', function() {
    fs.open('./.env', 'r', (err) => {
        if (err) {
            if (err.code === 'ENOENT') {
                console.log("no .env file found");
                serverSetup("http");
            }
        } else {
            fs.readFile('./.env', 'utf8', (err, data) => {
                if (data.indexOf('SSL_CRT_PATH') < 0 || data.indexOf('SSL_KEY_PATH') < 0) {
                    console.log("no SSL_CRT_PATH and/or SSL_KEY_PATH found in .env file");
                    serverSetup("http");
                } else {
                    serverSetup("https");
                }
            })
        }
    })
})

// scss compilation + minification

gulp.task('scss', function() {
    return gulp.src('src/scss/**/*.scss')
        .pipe(changed('dist/css', { extension: '.css' }))
        .pipe(gulpIgnore(message))
        .pipe(scss())
        .pipe(autoprefixer({
            browsers: ['>1%'],
            cascade: false
        }))
        .pipe(cssnano())
        .pipe(gulp.dest('dist/css'))
})

// less compilation + minification

gulp.task('less', function() {
    return gulp.src('src/less/**/*.less')
        .pipe(changed('dist/css', { extension: '.css' }))
        .pipe(gulpIgnore(message))
        .pipe(less())
        .pipe(autoprefixer({
            browsers: ['>1%'],
            cascade: false
        }))
        .pipe(cssnano())
        .pipe(gulp.dest('dist/css'))
})

// css minification

gulp.task('css', function() {
    return gulp.src('src/**/*.css')
        .pipe(changed('dist'))
        .pipe(gulpIgnore(message))
        .pipe(autoprefixer({
            browsers: ['>1%'],
            cascade: false
        }))
        .pipe(cssnano())
        .pipe(gulp.dest('dist'))
})

// js minification + uglification

gulp.task('js', function() {
    return gulp.src('src/**/*.js')
        .pipe(changed('dist'))
        .pipe(gulpIgnore(message))
        .pipe(uglify())
        .pipe(gulp.dest('dist'))
})

// image optimization

gulp.task('images', function() {
    return gulp.src('src/**/*.{png,jpg,jpeg,gif,svg}')
        .pipe(changed('dist'))
        .pipe(gulpIgnore(message))
        .pipe(image(imgPrefs))
        .pipe(gulp.dest('dist'))
})

// make placeholders

gulp.task('placeholders', function() {
    return gulp.src('src/images/**/*.{jpg,jpeg,png,gif}')
        .pipe(changed('dist/images/placeholders'))
        .pipe(gulpIgnore(message))
        .pipe(imageResize({
            noProfile: true,
            width: 40,
            quality: 0
        }))
        .pipe(image(imgPrefs))
        .pipe(gulp.dest('dist/images/placeholders'))
})

// image resizing

var lt400 = function(file) {
    var dimensions = sizeOf(file.path);
    if (dimensions.width > 400) {
        return false;
    } else {
        return true;
    }
};

var lt800 = function(file) {
    var dimensions = sizeOf(file.path);
    if (dimensions.width > 800) {
        return false;
    } else {
        return true;
    }
};

var lt1200 = function(file) {
    var dimensions = sizeOf(file.path);
    if (dimensions.width > 1200) {
        return false;
    } else {
        return true;
    }
};

gulp.task('resize400', function() {
    return gulp.src('src/images/**/*.{jpg,jpeg,png,gif}')
        .pipe(changed('dist/images/400'))
        .pipe(gulpIgnore(lt400))
        .pipe(gulpIgnore(message))
        .pipe(imageResize({
            width: 400
        }))
        .pipe(image(imgPrefs))
        .pipe(gulp.dest('dist/images/400'))
})

gulp.task('resize800', function() {
    return gulp.src('src/images/**/*.{jpg,jpeg,png,gif}')
        .pipe(changed('dist/images/800'))
        .pipe(gulpIgnore(lt800))
        .pipe(gulpIgnore(message))
        .pipe(imageResize({
            width: 800
        }))
        .pipe(image(imgPrefs))
        .pipe(gulp.dest('dist/images/800'))
})

gulp.task('resize1200', function() {
    return gulp.src('src/images/**/*.{jpg,jpeg,png,gif}')
        .pipe(changed('dist/images/1200'))
        .pipe(gulpIgnore(lt1200))
        .pipe(gulpIgnore(message))
        .pipe(imageResize({
            width: 1200
        }))
        .pipe(image(imgPrefs))
        .pipe(gulp.dest('dist/images/1200'))
})

// html minification and combination off css/js assets

gulp.task('html', function () {
    return gulp.src('src/**/*.html')
        .pipe(gulpIgnore(message))
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
    return gulp.src(['src/**/*.*', '!src/**/*.html', '!src/**/*.css', '!src/**/*.js', '!src/**/*.less', '!src/**/*.scss', '!src/**/*.png', '!src/**/*.jpg', '!src/**/*.jpeg', '!src/**/*.gif', '!src/**/*.svg'])
        .pipe(changed('dist'))
        .pipe(gulpIgnore(message))
        .pipe(gulp.dest('dist'))
})

// Prettify css js html

gulp.task('prettify:src', function() {
    return gulp.src('src/**/*.+(html|css|js|less|scss)')
        .pipe(prettify())
        .pipe(gulp.dest('src'))
})


// Cleaning

gulp.task('clean', function() {
    return del.sync('dist')
})

gulp.task('clean:code', function() {
    return del.sync(['dist/**/*.*', '!dist/**/*.png', '!dist/**/*.jpg', '!dist/**/*.jpeg', '!dist/**/*.gif', '!dist/**/*.svg'])
})

// Build

gulp.task('build', function(callback) {
    runSequence(
        'scss',
        'less',
        'css',
        'js',
        'images',
        'placeholders',
        'resize400',
        'resize800',
        'resize1200',
        'html',
        'other',
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
