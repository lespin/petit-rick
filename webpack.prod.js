const TerserPlugin = require('terser-webpack-plugin');
module.exports = {
    optimization: {
        minimize: true,
        minimizer: [new TerserPlugin()],
        namedModules: false,
        moduleIds : 'size'
    },
}
