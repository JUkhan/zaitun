zaitun
=========

A light weight javascript framework with time-travelling debugger

## Usage

[zaitun-starter-kit](https://github.com/JUkhan/zaitun-starter-kit) Try this [QuickStart example on JS Bin](http://jsbin.com/manurun/2/edit?html,js,output)

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
 


