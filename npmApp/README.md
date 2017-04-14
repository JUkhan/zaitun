zaitun
=========

A light weight javascript framework with time-travelling debugger

## Usage
A light weight javascript framework with time-travelling debugger. Try this [QuickStart example on JS Bin](http://jsbin.com/manurun/12/edit?html,js,output).
You can also try on your local machine from the following GitHub locations:
- [zaitun-starter-kit-javascript](https://github.com/JUkhan/zaitun-starter-kit)
- [zaitun-starter-kit-typescript](tps://github.com/JUkhan/zaitun-starter-kit-typescript)

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
 


