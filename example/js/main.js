
import {bootstrap} from 'zaitun';

import devTool from 'zaitun/devTool/devTool';

import clsCounter from './clsCounter';
import clsCounterList from './clsCounterList';
import Todos from './todos/todos';
import FormExample from './FormExample';
import mainCom  from './mainCom';

const routes=[
    {path:"/counter", component:clsCounter},
    {path:'/counterList', component:clsCounterList},
    {path:'/todos', component:Todos},
    {path:'/formExample', component:FormExample, cache:true}
  ];

bootstrap({
  containerDom:'#placeholder',
  mainComponent:mainCom,
  //locationStrategy:'hash',
  routes:routes,
  activePath:'/counter',
  devTool:devTool
});