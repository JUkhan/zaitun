import {h} from 'zaitun';
const DATA_CHANGE=Symbol('SET_DATA');
class juGrid{
     constructor(){

    }
    init(){
        return {};
    }
    view({model, dispatch}){
        this.dispatch=dispatch;
        this.model=model; 
        if(!model.columns){
            return h('div','columns undefined');
        }

        const vnodes=h('table.table', [
            this.header(model),
            this.body(model)
        ]);
        return vnodes;
    }
    header(model){
        return h('thead',[
                h('tr',model.columns.map((r, index)=>h('th',{key:index}, r.header)))
            ])
    }
    body(model){
        if(!model.data){
            return h('tbody',[h('tr',[
                h('td.table-info',{props:{colSpan:model.columns.length}},'Data not found')
            ])]);
        }
        return h('tbody',
            model.data.map((row, ri)=>h('tr',{key:ri},
                model.columns.map((col, ci)=>h('td', {key:ci}, row[col.field]))
            ))
        );
    }
    footer(){

    }
    update(model, action){
        switch(action.type){
           case DATA_CHANGE:
         
            return {...model, data:action.payload};
           default: return model;  
        }
        return model;
    }
    setData(data){       
        this.dispatch({type:DATA_CHANGE, payload:data});
    }
}
export {juGrid}