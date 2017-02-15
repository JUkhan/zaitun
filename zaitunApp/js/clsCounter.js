/** @jsx html */

import {html} from 'zaitun';

const INC=Symbol('inc');
const DEC=Symbol('dec');


export default class clsCounter{ 
    init(){       
        return {data:10}
    } 
    onDestroy(){
        console.log('ondestroy');
    }  
    canDeactivate(){
        return confirm('leave?')
    }
    view({model, dispatch}){
         return <span>
                    <button classNames="btn btn-primary btn-sm" on-click={ [dispatch, {type:INC}] }>+</button>&nbsp;
                    <button classNames="btn btn-primary btn-sm" on-click={ [dispatch, {type:DEC}] }>-</button>
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