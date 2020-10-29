const { merge } = require('webpack-merge');
const common = require('./webpack.common.js');
const TerserPlugin = require('terser-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin')

module.exports = merge(common,{
    optimization: {
        minimize: true,
        minimizer: [new TerserPlugin()],
        namedModules: false,
        moduleIds : 'size'
    },
    plugins: [
        new CopyWebpackPlugin({
            patterns : [
                {
                    from : 'release',
                    to: 'release/',
                    force : true,
                },
                {
                    from : './COPYING',
                    to: 'release/COPYING.txt',
                    force : true,
                },
                {
                    from : './OTHER_LICENSES',
                    to: 'release/OTHER_LICENSES.txt',
                    force : true,
                }

            ],
        }),
    ],
})
