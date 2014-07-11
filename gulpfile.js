// http://markgoodyear.com/2014/01/getting-started-with-gulp/
// http://justinmccandless.com/blog/A+Tutorial+for+Getting+Started+with+Gulp
// http://code.tutsplus.com/tutorials/building-apps-with-the-yeoman-workflow--net-33254

var _ = require('lodash'),
    gulp = require('gulp'),
    rename = require('gulp-rename'),
    minifycss = require('gulp-minify-css'),
    header = require('gulp-header'),
    jshint = require('gulp-jshint'),
    uglify = require('gulp-uglify'),
    clean = require('gulp-clean');
var nodemon = require('gulp-nodemon');
var pkg = require('./package.json'),
    bannerTemplate = buildBannerTemplate();


// Configuration

var bases = {
    app: '',
    dist: 'dist/',
};
 
var sources = {
    scripts: ['public/js/**/*.js', '!public/js/**/*.min.js'],
    styles: ['public/css/*.css', '!public/css/*.min.css'],
    views: ['views/*'],
    images: ['public/img/*'],
    controllers: ['controllers/**/*'],
    routes: ['routes/**/*'],
    models: ['models/**/*'],
    misc: ['public/*', '!public/library'],
    extras: ['.bowerrc','config.js','station.js','helper.js','package.json','bower.json','README.md']
};

var targets = {
    tmp: '.tmp/', 
    dist: 'dist/'
};


/**
 * $ gulp prepare
 * Deletes the build/dist directories
 */
gulp.task('prepare', function() {
    return gulp.src(_.values(targets), {read:false})
        .pipe(clean());
});


/**
 * $ gulp styles
 * Transforms LESS to CSS. 
 * Minifies.
 * Adds a banner. 
 */
gulp.task('styles', ['prepare'], function() {
    gulp.src(sources.styles, {cwd: bases.app})
        .pipe(rename({suffix: '.min'}))
        .pipe(minifycss())
        .pipe(header(bannerTemplate, {pkg:pkg}))
        .pipe(gulp.dest(bases.app + 'public/css'))
        .pipe(gulp.dest(bases.dist + 'public/css'));
});


/**
 * $ gulp scripts
 * 
 * For "view scripts": 
 * Merges default and each page script. 
 * Minify/uglify. 
 * Adds a banner.

 * For js:
 * Lints.
 * Minify/uglify.
 * Adds a banner
 */
gulp.task('scripts', ['prepare'], function() {

    gulp.src(sources.scripts, {cwd: bases.app})
        .pipe(jshint('.jshintrc'))
        .pipe(jshint.reporter('default'))
        .pipe(rename({suffix: '.min'}))
        .pipe(uglify())
        .pipe(header(bannerTemplate, {pkg:pkg}))
        .pipe(gulp.dest(bases.app + 'public/js'))
        .pipe(gulp.dest(bases.dist + 'public/js'));
});


/**
 * $ gulp images
 * Copies images. TODO: Why doesn't image minification perform as well as the grunt task? 
 */
gulp.task('images', ['prepare'], function() {
    gulp.src(sources.images, {cwd: bases.app})
        .pipe(gulp.dest(bases.dist + 'public/img'));
});


/**
 * $ gulp copy
 * Copy all other files to dist directly.
 */
gulp.task('copy', ['prepare'], function() {
    // Copy views
    gulp.src(sources.views, {cwd: bases.app})
        .pipe(gulp.dest(bases.dist + 'views'));

    // Copy combined JavaScript
    gulp.src('views/js/**/*.min.js', {cwd: bases.app + targets.tmp})
        .pipe(gulp.dest(bases.dist + 'public/js'));

    // Copy controllers
    gulp.src(sources.controllers, {cwd: bases.app})
        .pipe(gulp.dest(bases.dist + 'controllers'));

    // Copy routes
    gulp.src(sources.routes, {cwd: bases.app})
        .pipe(gulp.dest(bases.dist + 'routes'));

    // Copy models
    gulp.src(sources.models, {cwd: bases.app})
        .pipe(gulp.dest(bases.dist + 'models'));

    // Copy miscellanous public items
    gulp.src(sources.misc, {cwd: bases.app})
        .pipe(gulp.dest(bases.dist + 'public'));

    // Copy Extras
    gulp.src(sources.extras, {cwd: bases.app})
        .pipe(gulp.dest(bases.dist));
 });


/**
 * $ gulp develop
 * A development task to run anytime a file changes. 
 */
gulp.task('develop', ['build'], function() {
    nodemon({ script: 'station.js', ext: 'js css ms', ignore: ['dist/*','public/library/*','node_modules/*'], nodeArgs: ['--debug']  })
        .on('start', function() {
            
        })
        .on('restart', function () {
            
        });

    gulp.watch(bases.app + sources.styles, ['styles']);
    gulp.watch(bases.app + sources.scripts, ['scripts']);
});

/**
 * $ gulp 
 * The default task to build the project
 */
gulp.task('default', ['styles','scripts','images','copy'], function() {

});
gulp.task('build', ['default'], function() {
    
});


/* HELPER FUNCTIONS */

function buildBannerTemplate() {
    var now = new Date();
    var today = now.getFullYear() + '-' + (now.getMonth()+1) + '-' + now.getDate();
    return ['/**',
      ' * <%= pkg.name %> v<%= pkg.version %> by @shoemaker',
      ' * ' + today,
      ' * Copyright ' + now.getFullYear() + ' <%= pkg.author %>',
      ' */',
      ''].join('\n');
}
