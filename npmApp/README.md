
> A light weight javascript framework with time-travelling debugger

## Usage
> Try this [QuickStart example on JS Bin](http://jsbin.com/manurun/12/edit?html,js,output).
You can also try on your local machine from the following GitHub locations:
- [zaitun-starter-kit-javascript](https://github.com/JUkhan/zaitun-starter-kit)
- [zaitun-starter-kit-typescript](tps://github.com/JUkhan/zaitun-starter-kit-typescript)

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

## A basic counter example

```javascript
/** @jsx html */
import {bootstrap, html} from 'zaitun';

class Counter{ 
    init(){
        return {count:0}
    }   
    view({model, dispatch}){
        return <div>
            <button on-click={[dispatch,{type:'inc'}]}>+</button>
            <button on-click={[dispatch,{type:'dec'}]}>-</button>
            <b>&nbsp;{model.count}</b>
            </div>
    }
    update(model, action){
        switch (action.type) {
            case 'inc': return {count:model.count+1}
            case 'dec': return {count:model.count-1}          
            default:
                return model
        }
    }
}
bootstrap({
    containerDom:'#app',
    mainComponent:Counter
})
```



