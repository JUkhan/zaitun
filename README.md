zaitun
=========

A light weight javascript framework with time traveling debugger

## Installation

  `npm install zaitun`

## Usage

  Counter.js
  
/** @jsx html */

import {html} from 'zaitun';

const INC=Symbol('inc');
const DEC=Symbol('dec');
export default class Counter{ 
    init(){       
        return {data:10}
    }   
    view({model, handler}){
         return <span>
                    <button classNames="btn btn-primary btn-sm" on-click={ [handler, {type:INC}] }>+</button>&nbsp;
                    <button classNames="btn btn-primary btn-sm" on-click={ [handler, {type:DEC}] }>-</button>
                    <b> Count : {model.data}</b>
                </span>             
                ;
    }   
    update(model, action){
        
        switch (action.type) {
            case INC:    
               return {data:model.data+1};
            case DEC:              
               return {data:model.data-1};
            default:
                return model;
        }
    }
}
  ==========

  import devTool from 'zaitun/devTool/devTool'; 
  import {bootstrap} from 'zaitun';
  import Counter from './Counter';

  bootstrap({
    containerDom:'#placeholder',
    mainComponent:mainCom
    devTool:devTool
  });


## Tests

  `npm test`

## Contributing

coming...
