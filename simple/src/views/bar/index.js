import router from '../../router'
import template from './index.html'
import './style.css'

export default class {
    mount(container){
        document.title='bar';
        container.innerHTML=template;
        container.querySelector('.bar_gofoo').addEventListener('click',() => {
            //调用router.go 方法加载/foo 页面
            router.go('foo');
        })
    }
}