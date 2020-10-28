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
    watchOptions: {
        ignored: /\.#|node_modules|~$/,
    },
    node  : { fs : 'empty' },
    devServer: {
        contentBase: './dist',
        //http2: true
    }

}
