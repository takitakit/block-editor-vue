module.exports = {
    publicPath: './',
    outputDir: './dist',
    runtimeCompiler: true,

    configureWebpack: {
        output: {
            filename: 'js/block-editor-vue.js'
        },
        optimization: {
            splitChunks: false
        }
    },

    filenameHashing: false,
    baseUrl: undefined,
    assetsDir: undefined,
    productionSourceMap: false,
    parallel: undefined,

    css: {
      extract: false
    }
}
