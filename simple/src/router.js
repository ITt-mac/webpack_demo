import foo from './views/foo'
import bar from './views/bar'

const routes = {
    '/foo': foo,
    '/bar': bar,
}

//Router类，用来控制页面根据当前url切换
class Router {
    start() {
        //点击浏览器后退或前进按钮会触发window.onpopstate事件，我们在这时切换到相应的页面
        //https://developer.mozilla.org/zh-CN/docs/Web/API/Window/popstate_event
        window.addEventListener('popstate', () => {
            this.load(location.pathname);
        });

        //打开页面时加载当前页面
        this.load(location.pathname);
    }

    //前往path，变更地址栏url，并加载相应的页面
    go(path) {
        //变更地址栏url
        history.pushState({}, '', path);
        //加载页面
        this.load(path);
    }

    //加载path路径的页面
    load(path) {
        //首页
        if (path === '/') path = '/foo'
        //创建页面实例
        console.log(routes)
        console.log(path)
        const view = new routes[path]()
        //调用页面方法，把页面加载到document.body中
        view.mount(document.body)
    }
}
export default new Router()