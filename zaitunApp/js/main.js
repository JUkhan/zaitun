
import {bootstrap} from 'zaitun';
import devTool from 'zaitun/devTool/devTool';

import Counter from './Counter';
import CounterList from './CounterList';
import Todos from './todos/todos';
import FormExample from './FormExample';
import GridExample from './GridExample';
import mainCom  from './mainCom';

const routes=[
    {path:"/counter", component:Counter},
    //loadComponent working in webpack(https://github.com/JUkhan/zaitun-starter-kit)
    //{path:'/counterList', loadComponent:()=>System.import('./clsCounterList')},
    {path:'/counterList', component:CounterList},
    {path:'/todos', component:Todos},
    {path:'/formExample', component:FormExample},
    {path:'/gridExample', component:GridExample, cache:true}
  ];

bootstrap({
  containerDom:'#app',
  mainComponent:mainCom, 
  routes:routes,
  activePath:'/counter',
  //devTool:devTool
});