const HtmlWebpackPlugin = require('html-webpack-plugin')
const TerserPlugin = require('terser-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin')
const path = require('path')

module.exports = {
    devtool: "source-map",
    plugins: [
        new CopyWebpackPlugin({
            patterns : [
                {
                    from : 'assets',
                    to: 'assets',
                    force : true,
                }
            ],
        }),
        new HtmlWebpackPlugin({
            title: `petit-rick`
        })
    ],
    // optimization: {
    //     minimize: true,
    //     minimizer: [new TerserPlugin()],
    //     namedModules: false,
    //     moduleIds : 'size'
    // },
    watchOptions: {
        ignored: /\.#|node_modules|~$/,
    },

    module: {
        rules: [
            {
                test: /Worklet\.js$/,
                loader: 'worklet-loader',
                options: {
                    name: '[hash].worklet.js'
                }
            }
        ]
    }
    ,    // module: {
    //     rules: [
    //         {
    //             test: /\.css$/i,
    //             use: ['style-loader', 'css-loader'],
    //         },
    //     ],
    // },
    node  : { fs : 'empty' },
    devServer: {
        contentBase: './dist',
        http2: true
    }

}
