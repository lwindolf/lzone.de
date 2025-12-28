import path from 'path';
import glob from 'glob';

const config = {
    entry: {
        main: './src/js/app.js',
        components: glob.sync('./src/js/components/**/*.js')
    },
    output: {
        filename: 'bundle-[name].js',
        path: path.resolve('./www/js/bundle'),
        publicPath: '/js/bundle/'
    },
    mode: 'production' // or 'development'
};

export default config;
