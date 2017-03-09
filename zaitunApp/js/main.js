
import {bootstrap} from 'zaitun';
import devTool from 'zaitun/devTool/devTool';

import clsCounter from './clsCounter';
import clsCounterList from './clsCounterList';
import Todos from './todos/todos';
import FormExample from './FormExample';
import mainCom  from './mainCom';

const routes=[
    {path:"/counter", component:clsCounter},
    //loadComponent working in webpack(https://github.com/JUkhan/zaitun-starter-kit)
    //{path:'/counterList', loadComponent:()=>System.import('./clsCounterList')},
    {path:'/counterList', component:clsCounterList},
    {path:'/todos', component:Todos},
    {path:'/formExample', component:FormExample, cache:true}
  ];

bootstrap({
  containerDom:'#app',
  mainComponent:mainCom,
  //locationStrategy:'hash',
  routes:routes,
  activePath:'/counter',
  //devTool:devTool
});