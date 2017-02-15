import {h} from 'zaitun';
class juGrid{
     constructor(){
        this.dispatch=undefined;
        this.options=undefined;                
    }
    init(){
        return {};
    }
    view({model, dispatch, options}){
        this.dispatch=dispatch;
        this.options=options; 
        this.model=model;    
        const vnodes=h('div.juGrid', 'juGrid...');
        return vnodes;
    }
    update(model, action){
        return model;
    }
}
export {juGrid}