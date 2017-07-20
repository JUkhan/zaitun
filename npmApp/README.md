
> A lightweight blessing fast javascript framework with time-travelling debugger

## Usage
>Try this [QuickStart example on JS Bin](http://jsbin.com/manurun/12/edit?html,js,output).
You can also try on your local machine from the following GitHub locations:
- [zaitun-starter-kit-javascript](https://github.com/JUkhan/zaitun-starter-kit)
- [zaitun-starter-kit-typescript](https://github.com/JUkhan/zaitun-starter-kit-typescript)

## The Basic Pattern
The logic of every Zaitun component will break up into three cleanly separated parts:

- `init` - the state of your component(to create a state from scratch)
- `view` - a way to view your state as HTML
- `update` - a way to update your state

This pattern is so reliable that I always start with the following skeleton and fill in details for my particular case.
```javascript
class Component{
    init(){
    }
    view({model, dispatch}){
    }
    update(model, action){
    }
}
```
That is really the essence of The Zaitun. We will proceed by filling in this skeleton with increasingly interesting logic.

## Example 1 : a basic counter
The counter component is defined in its own module ‘counter.js’
```javascript
/** @jsx html */
import {h, html} from 'zaitun';
class Counter{ 
    init(){
        return {count:0}
    }
    view({model, dispatch}){
        return <div>
            <button on-click={[dispatch,{type:'INC'}]}>+</button>
            <button on-click={[dispatch,{type:'DEC'}]}>-</button>
            <b>&nbsp;{model.count}</b>
            </div>
    }
    update(model, action){
        switch (action.type) {
            case 'INC': return {count:model.count+1}
            case 'DEC': return {count:model.count-1}          
            default:
                return model
        }
    }
}
export default Counter;
```
> Zaitun uses [snabbdom](https://github.com/snabbdom/snabbdom)  to render view. So you can use markup function h(..) or [jsx](https://github.com/yelouafi/snabbdom-jsx) for view

The counter component is defined by the following properties
- Model : {count:0}
- View : provides the user with 2 buttons in order to increment/decrement a counter , and a text that shows the current count.
- Update : sensible to 2 actions : INC and DEC that increments or decrements the counter value..

The first thing to note is that the view/update are both pure functions, they have no dependency on any external environment besides their input. The counter component itself doesn’t hold any state or variable, it just describes how to construct a view from a given state, and how to update a given state with a given action. Thanks to its purity, the counter component can be easily plugged into any environment that is able to supply it with its dependencies : a state  and an action.

Second note, the `[dispatch, action]` expression on the click event listener for each button. We are translating the raw user event (mouse click) into a meaningful action to our program (Increment or Decrement). Using ES6 symbols is better than raw strings (avoids collisions in action names).
## Run the Counter component -  'main.js'
```javascript
import {bootstrap} from 'zaitun';
import Counter from './counter';
 bootstrap({
  containerDom:'#app',
  mainComponent:Counter
});
```
## Set time-travelling debugger - 'main.js'
```javascript
import {bootstrap} from 'zaitun';
import devTool from 'zaitun/devTool/devTool';
import Counter from './counter';
 bootstrap({
  containerDom:'#app',
  mainComponent:Counter,
  devTool:devTool
});
```
 
 To see how our component can be tested; here is an example using the ‘tape’ testing library
 ```javascript
import test from 'tape';
import Counter from './counter';
const counterCom=new Counter();
test('counter update function', (assert) => {
    
  var state = {count:10};
  state = counterCom.update(state, {type: 'INC'});
  assert.equal(state.count, 11);

  state = counterCom.update(state.count, {type: 'DEC'});
  assert.equal(state.count, 10);

  assert.end();
});
 ```
## Example 2: Nested Components(parent child relation)
The Pointer component is defined in its own module ‘pointer.js’
```javascript
import Counter from './counter';
const CounterCom=new Counter();

const RESET               = Symbol('reset');
const UPDATE_XCOORDINATE  = Symbol('update-x-coordinate');
const UPDATE_YCOORDINATE  = Symbol('update-y-coordinate');

class Pointer{
    init(){
        return {x:CounterCom.init(), y:CounterCom.init()}
    }
    view({model, dispatch}){       
        return <div>
          <h1>(x, y)={model.x.count}, {model.y.count} </h1>
          <div><button on-click={[dispatch,{type:RESET}]}>Reset</button></div>
          X{CounterCom.view({model:model.x, dispatch:counterAction=>dispatch({type:UPDATE_XCOORDINATE, payload:counterAction})})} 
          Y{CounterCom.view({model:model.y, dispatch:counterAction=>dispatch({type:UPDATE_YCOORDINATE, payload:counterAction})})} 
        </div>
    }
    update(model, action){
        switch (action.type) {
            case RESET: return this.init()
            case UPDATE_XCOORDINATE:
                return {...model, x:CounterCom.update(model.x, action.payload)}
            case UPDATE_YCOORDINATE:
                return {...model, y:CounterCom.update(model.y, action.payload)}
            default:
               return model
        }
    }
}
export default {Pointer, actions:{RESET, UPDATE_XCOORDINATE, UPDATE_YCOORDINATE}}
```
First we defined our model and its associated set of actions
```javascript
const RESET               = Symbol('reset');
const UPDATE_XCOORDINATE  = Symbol('update-x-coordinate');
const UPDATE_YCOORDINATE  = Symbol('update-y-coordinate');
init(){
        return {x:CounterCom.init(), y:CounterCom.init()}
}
```
The model exports 2 properties: ‘x’ and ‘y’ to hold the states of the 2 counters. We define 3 actions on : the first reset both counters to ‘0’. W’ll see the use of the 2 others in a moment.

The view function is responsible for rendering point value((x, y)=2, -1) and the 2 counters as well as providing the user with a button to reset them.
```javascript
 view({model, dispatch}){       
        return <div>
          <h1>(x, y)={model.x.count}, {model.y.count} </h1>
          <div><button on-click={[dispatch,{type:RESET}]}>Reset</button></div>
          X{CounterCom.view({model:model.x, dispatch:counterAction=>dispatch({type:UPDATE_XCOORDINATE, payload:counterAction})})} 
          Y{CounterCom.view({model:model.y, dispatch:counterAction=>dispatch({type:UPDATE_YCOORDINATE, payload:counterAction})})} 
        </div>
    }
```
The thing to note is the param object({model, dispatch}) passed to the child views:
- Each view gets its relevant part (model.x/model.y) of the parent state.
- The dynamic dispatch property that’s passed down to the children’s views : For example, an action triggered from the X child counter will be wrapped in an ‘UPDATE_XCOORDINATE’ action, so when the parent’s update function is invoked, w’ll be able to forward the original action (stored in the ‘payload’ attribute) to the correct counter.

The update function handles 3 actions:
```javascript
update(model, action){
        switch (action.type) {
            case RESET: return this.init()
            case UPDATE_XCOORDINATE:
                return {...model, x:CounterCom.update(model.x, action.payload)}
            case UPDATE_YCOORDINATE:
                return {...model, y:CounterCom.update(model.y, action.payload)}
            default:
               return model
        }
    }
```
- the RESET action ‘init’ each counter to its default state.
- the UPDATE_XCOORDINATE and UPDATE_YCOORDINATE are, as we just saw, wrappers around a counter action. The function forwards the wrapped action to the concerned child counter along with its specific state.

## ROUTING - learn to navigate among the views

Zaitun provides a `Router` service. We can dynamiclly add/remove routes and navigate to the views.

When we click on a navigation, `Router` resolved the component and become ready to host. We can find this component from `Router.CM.child`.
So, we need a main/root component where nav component(`Router.CM.child`) should be hosted.

The MainCom is defined in its own module ‘mainCom.js’
```javascript
import {Router} from 'zaitun';

const CHILD = Symbol('CHILD');
export class MainCom{
    init(){
        return {};
    }
    view({model, dispatch}){
        return <div>       
        <h3>Root component</h3>
        <div>{Router.CM.child.view({model:model.child, dispatch:action=>dispatch({type:CHILD, childAction:action})})}</div>
        </div>
    }   
    update(model, action){
        switch (action.type) {            
            case CHILD:
               return{...model,child:Router.CM.child.update(model.child, action.childAction)};
               
            default:
            return model;
        }
    }
}
```
### Set mainCom and Configure routes
```javascript
import {bootstrap} from 'zaitun';

import {MainCom}  from './mainCom';
import Counter from './Counter'; 

const routes=[
    {path:"counter", component:Counter},
    {path:'counterList/:times/:msg',loadComponent:()=>System.import('./CounterList')},
    {path:'todos', loadComponent:()=>System.import('./todos/todos')},
    {path:'formExample', loadComponent:()=>System.import('./FormExample'), cache:true}
  ];
  
  bootstrap({
      containerDom:'#app',
      mainComponent:MainCom,  
      routes:routes,
      activePath:'counter'
});
```
The routes are an array of route definitions. This route definition has the following parts:

- `path` : the router matches this route's path to the URL in the browser address bar
- `component` :  the component that the component manager should create when navigating to this route
- `loadComponent` : the component dynamically loaded when navigating to this route
- `cache` : Component should be cached if it set to true

> `loadComponent` only workes in webpack when the component export as default

### Component Life cycle hook methods
```javascript    
    init(dispatch, routeParams){}
    afterViewRender(model, dispatch){}
    canDeactivate(){
        return bool|Promise
    }
    onDestroy(){}
```    
### `bootstrap` options

```javascript
    containerDom: string | any;
    mainComponent: any;
    routes?: Array<any>;
    activePath?: string;
    devTool?: any;
    locationStrategy?: 'hash' | 'history';
    baseUrl?: string;
    cacheStrategy?: 'session' | 'local' | 'default';
```

### `Route` options

```javascript
    path:string;    
    component?:any;
    loadComponent?:any;
    canActivate?:Function;
    canDeactivate?:Function;
    cache?:boolean;
    cacheUpdate_perStateChange?:boolean;
    cacheStrategy?: 'session' | 'local' | 'default';
```
### `Router` methods

```javascript
    navigate: (path: string) => void;
    add: (route: any) => void;
    remove: (path: string) => void;
    activeRoute: {
        routeParams: { },
        path: string,
        navPath: string,
        data: { }
    };
    CM: ref of ComponentManager;
```
### `ComponentManager(CM)` methods

```javascript
    child: {view, update};
    action$: any;
    json_parse:(data:any)=>any;
    json_stringify:(data:any)=>any;
    updateCache:()=>any;
```

### v1.6.3
Remove the `canDeactivate` life cycle hook method. Zaitun’s router provides a feature called Navigation Guards.

- `canActivate`  - Decides if a route can be activated
- `canDeactivate` - Decides if a route can be deactivated
>These two methods return `boolen` | `Promise<boolean>`
```javascript 
class AuthService{
    canActivate(router){ 
      return new Promise(accept=>accept(true));

    }
    canDeactivate(component, router){ 
      return component.canDeactivate();

    }
}

const routes=[
  {path:'/counter', component:counterCom},
  {path:'/counterList/:times/:msg', canDeactivate:AuthService, loadComponent:()=>System.import('./counterList')},
  {path:'/todos',canActivate:AuthService, loadComponent:()=>System.import('./todos/todos')}, 
  {path:'/animation', loadComponent:()=>System.import('./Animation')}, 
  {path:'/orderAnimation',loadComponent:()=>System.import('./OrderAnimation')},
  {path:'/heroAnimation',loadComponent:()=>System.import('./Hero')}
];


```   
Zaitun provides two types of `locationStrategy` 
- `hash` (default)
- `history`

```javascript
bootstrap({
  containerDom:'#app',
  mainComponent:Counter,
  locationStrategy:'history'//default is hash
  devTool:devTool
});

```
### `hash` type Example
&lt;a class="nav-link" href="#/counter"&gt;Counter&lt;/a&gt;

### `history` type Example
&lt;a class="nav-link" href="/counter"&gt;Counter&lt;/a&gt;

But For javascript it is same for both
```javascript
    Router.navigate('count')
```
### v1.6.4
update cache strategy. Please have a look at the `bootstrap` and `route` options and also the `ComponentManager(CM)` methods. Find the example at  [zaitun-starter-kit-typescript](https://github.com/JUkhan/zaitun-starter-kit-typescript)

