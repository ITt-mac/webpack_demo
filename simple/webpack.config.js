const { resolve } = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const history = require('connect-history-api-fallback');
const convert = require('koa-connect');

//使用WEBPACK_SERVE环境变量检测当前是否在webpack_server启动的开发环境中
const dev = Boolean(process.env.WEBPACK_SERVE);
console.log(dev)
module.exports = {
    // webpack 执行模式
    //development 开发环境，它会在配置文件中插入调试相关的选项，比如moduleId使用文件路径方便调试
    //production 生产环境，webpack会将代码做压缩等优化
    mode: dev ? 'development' : 'production',

    //配置source map
    //开发模式下使用cheap-module-eval-source-map，
    //生成的source map 能和源码每行对应，方便打断点调试。。。。。
    //生产模式使用hidden-source-map，生成独立的source map文件，
    //并且不在js文件中插入source map路径，用于error report 工具中查看（比如Sentry）。
    devtool: dev ? 'cheap-module-eval-source-map' : 'hidden-source-map',

    //配置页面入口js文件
    entry: './src/index.js',

    //配置打包输出相关
    output: {
        //打包输出目录,注意这里是双__线
        path: resolve(__dirname, 'dist'),
        //入口js的打包输出文件夹
        filename: 'index.js'
    },

    module: {
        //配置各种文本的加载器，称之为loader
        //webpack当遇到import ...时，会调用这里配置的loader 对引入的文件进行编译
        rules: [
            {
                // 使用babel编译es6/7/8为es5代码
                // 使用正则表达式匹配后缀名为.js的文件
                test: /\.js$/,

                //排除node_modules目录下的文件，npm安装的包不需要编译
                exclude: /node_modules/,

                //use指定该文件的loader，值可以是字符串或者是数组。
                //这里先使用eslint-loader处理，返回的结果交给babel-loader处理。
                //loader的处理顺序是从最后一个到第一个。
                //babel-loader用来编译js文件。
                use: ['babel-loader']
                // use:['babel-loader','eslint-loader']
            },
            {
                //匹配html文件
                test: /\.html$/,

                //使用html-loader，讲html内容存为js字符串，
                //比如遇到import htmlString from './template.html'
                // template.html的文件内容会被转为一个js字符串，合并到js文件里。
                use: 'html-loader'
            },
            {
                //匹配css文件
                test: /\.css$/,

                //先使用css-loader处理，返回的结果交给style-loader处理。
                //css-loader将css内容存为js字符串，并且会把background,@font-face等引用的图片，
                //字体文件交给指定的loader打包，类似上面的html-loader，用什么loader同样在loaders对象中定义.
                use: ['style-loader', 'css-loader']
            },
            {
                //匹配各种格式的图片和字体文件
                //上面的html-loader会把html中的<img>标签的图片解析出来，文件名匹配到这里的test的正则表达式，
                //css-loader引用的图片字体会匹配到这里的test条件
                test: /\.(png|jpg|jpeg|gif|eot|ttf|woff|woff2|svg|svgz)(\?.+)?$/,

                //使用url-loader，它接受一个limit参数，单位为字节（byte）

                //当文件体积小于limit时，url-loader会把文件转为data url 的格式内联到引用的地方
                //当文件大于limit时，url-loader会调用file-loader，把文件存储到输出目录，并把引入的文件路径改写成
                //输出后的路径。
                // 比如 views/foo/index.html 中
                // <img src="smallpic.png">
                // 会被编译成
                // <img src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAA...">

                // 而
                // <img src="largepic.png">
                // 会被编译成
                // <img src="/f78661bef717cf2cc2c2e5158f196384.png">
                use: [
                    {
                        loader: 'url-loader',
                        options: {
                            limit: 10000
                        }
                    }
                ]
            }
        ]
    },//这个是module的结尾

    // 配置webpack插件
    // plugin和loader的区别是，loader是在import时根据不同的文件名，
    // 匹配不同的loader对这个文件处理。
    // 而plugin，关注的不是文件的格式，而是在编译的各个阶段，会触发不同的事件，
    // 让你可以干预每个编译阶段。
    plugins: [
        /*
        html-webpack-plugin 用来打包入口 html 文件
        entry 配置的入口是 js 文件，webpack 以 js 文件为入口，遇到 import, 用配置的 loader 加载引入文件
        但作为浏览器打开的入口 html, 是引用入口 js 的文件，它在整个编译过程的外面，
        所以，我们需要 html-webpack-plugin 来打包作为入口的 html 文件
        */
        new HtmlWebpackPlugin({
            /*
           template 参数指定入口 html 文件路径，插件会把这个文件交给 webpack 去编译，
           webpack 按照正常流程，找到 loaders 中 test 条件匹配的 loader 来编译，那么这里 html-loader 就是匹配的 loader
           html-loader 编译后产生的字符串，会由 html-webpack-plugin 储存为 html 文件到输出目录，默认文件名为 index.html
           可以通过 filename 参数指定输出的文件名
           html-webpack-plugin 也可以不指定 template 参数，它会使用默认的 html 模板。*/
            template: './src/index.html',

            /*
            因为和 webpack 4 的兼容性问题，chunksSortMode 参数需要设置为 none
            https://github.com/jantimon/html-webpack-plugin/issues/870
            */
            chunksSortMode: 'none'
        })
    ]
}

/*
配置开发时用的服务器，让你可以用 http://127.0.0.1:8080/ 这样的 url 打开页面来调试
并且带有热更新的功能，打代码时保存一下文件，浏览器会自动刷新。比 nginx 方便很多
如果是修改 css, 甚至不需要刷新页面，直接生效。这让像弹框这种需要点击交互后才会出来的东西调试起来方便很多。

因为 webpack-cli 无法正确识别 serve 选项，使用 webpack-cli 执行打包时会报错。
因此我们在这里判断一下，仅当使用 webpack-serve 时插入 serve 选项。
issue：https://github.com/webpack-contrib/webpack-serve/issues/19
*/
if (dev) {
    console.log(dev)
    module.exports.serve = {
        // 配置监听端口，默认值 8155
        port: 8066,

        // add: 用来给服务器的 koa 实例注入 middleware 增加功能
        add: app => {
            /*
            配置 SPA 入口
      
            SPA 的入口是一个统一的 html 文件，比如
            http://localhost:8155/foo
            我们要返回给它
            http://localhost:8155/index.html
            这个文件
            */
            app.use(convert(history()))
        }
    }
}