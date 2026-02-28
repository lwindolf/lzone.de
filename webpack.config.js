import path from 'path';
import glob from 'glob';

console.log([ './src/js/app.js' ].concat(glob.sync('./src/js/components/**/*.js')))

const config = {
    entry: [ './src/js/app.js' ].concat(glob.sync('./src/js/components/**/*.js')),
    output: {
        filename: 'bundle.js',
        path: path.resolve('./www/js/bundle'),
        publicPath: '/js/bundle/'
    },
    mode: 'production' // or 'development'
};

export default config;
