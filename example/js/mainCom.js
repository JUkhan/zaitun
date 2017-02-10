/** @jsx html */
import {html, Router} from 'zaitun';


const CHILD = Symbol('CHILD');
function init(){
    return {msg:'mainCom'};
}
function view({model, handler}){  
   
    return <div>
        <input type="input" value={model.msg} on-input={e=>handler({type:'home', msg:e.target.value})} />
        {model.msg}
        <div>{Router.CM.child.view({model:model.child, handler:action=>handler({type:CHILD, childAction:action})})}</div>
        </div>
}
 
function update(model, action){
    
    switch (action.type) {
        case 'home':
            return {...model, msg:action.msg}
        case CHILD:
            return {...model, child:Router.CM.child.update(model.child, action.childAction)}

        default:
           return model;
    }  
    return action.type==='home'?action.msg:model;
}

export default {init, view, update};