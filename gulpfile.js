const gulp = require('gulp');
const path = require('path');
const merge = require('merge-stream');
// 复制钱先清理掉dist-new目录
const clean = require('gulp-clean');
const fs = require('fs');
// dist-new 是一个完整的可运行的文件
const DEST = path.join(__dirname, 'dist-copy');
// 清除 dist-new 文件
gulp.task('clean', function () {
  return fs.existsSync(DEST)
    ? gulp.src(DEST).pipe(clean())
    : new Promise(function (resovle, reject) {
        resovle();
      });
});

gulp.task('copy', function () {
  return merge([
    gulp
      .src([
        'yarn.lock',
        'package.json',
        'server.js',
        'prettier.config.js',
        'next-env.d.ts',
        'next.config.js',
        'lru-cache.js',
        'image-optimizer.rewrite.js',
        'env-cmdrc.js',
        '.editorconfig',
        '.browserslistrc',
        '.babelrc.js',
      ])
      .pipe(gulp.dest(DEST)),
    gulp.src('public/**/*').pipe(gulp.dest(DEST + '/public')),
    gulp.src('.husky/**/*').pipe(gulp.dest(DEST + '/.git')),
    // 不复制构建缓存文件
    gulp.src(['dist/**/*', '!dist/cache/**']).pipe(gulp.dest(DEST + '/dist')),
    // next.config.js有使用。
    gulp.src('src/config/**/*').pipe(gulp.dest(DEST + '/src/config')),
    gulp.src(['src/themes/*.scss', 'src/themes/*.less']).pipe(gulp.dest(DEST + '/src/themes')),
  ]);
});

gulp.task('delete:sw', function () {
  return gulp
    .src(
      [
        'public/sw*.js',
        'public/workbox-*.js', //
      ],
      { read: false },
    )
    .pipe(clean());
});

// gulp 复制一个完整的打包后的文件提供给运维使用
gulp.task('default', gulp.series('clean', 'copy'));
// 删除sw文件
gulp.task('delete', gulp.series(['delete:sw']));
