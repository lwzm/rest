
const path = require('path')

module.exports = {
    entry: [
        'babel-polyfill',
        'whatwg-fetch',   /* https://github.com/github/fetch */
        './auto.js',
    ],
    output: {
        filename: 'bundle.js',
        path: path.resolve(__dirname, 'dist'),
    },

    module: {
        loaders: [
            {
                test: /\.(js|jsx)$/,
                exclude: /(node_modules|bower_components)/,
                use: {
                    loader: 'babel-loader',
                    options: {
                        presets: [
                            'env',
                        ],
                    },
                },
            },
        ],

    },
}
