import {h} from 'zaitun';
const DATA_CHANGE=Symbol('SET_DATA');
const REFRESH=Symbol('REFRESH');
class juGrid{     
    init(){
        return {};
    }
    view({model, dispatch}){
        this.dispatch=dispatch;
        this.model=model; 
        if(!model.columns){
            return h('div','columns undefined');
        }

        const vnodes=h('table.table',{classNames:'table-inverse'}, [
            this._header(model),
            this._body(model),
            this._footer(model)
        ]);
        return vnodes;
    }
    update(model, action){
        switch(action.type){
           case DATA_CHANGE:
         
            return {...model, data:action.payload};
           default: return model;  
        }
        return model;
    }
    _header(model){
        return h('thead',[
                h('tr',model.columns.map((r, index)=>h('th',{key:index}, r.header)))
            ])
    }
    _body(model){
        if(!model.data){
            return h('tbody',[h('tr',[
                h('td.table-info',{props:{colSpan:model.columns.length}},'Data not found')
            ])]);
        }
        return this._defaultView(model);
    }
    _defaultView(model){
        return h('tbody',
            model.data.map((row, ri)=>h('tr',{
                key:ri,
                on:this._bindEvents(row, ri, this.model),
                style:this._bindStyle(row, ri, this.model),
                class:this._bindClass(row, ri, this.model)},
                model.columns.map((col, ci)=>h('td', {
                    key:ci,
                    on:this._bindEvents(row, ri, col),
                    style:this._bindStyle(row, ri, col),
                    class:this._bindClass(row, ri, col)
                }, this._cellValue(row, col, ri)))
            ))
        );
    }
    _cellValue(row, col, ri){       
        if(typeof col.cellRenderer==='function'){
            return  [col.cellRenderer(row, ri)];
        }
        return row[col.field];        
    }   
    _bindEvents(row, ri, reciver){
        let events={}, selectableFlag=true;        
        if(typeof reciver.on==='object'){            
            for(let ename in reciver.on){
                if(reciver.on.hasOwnProperty(ename)){ 
                    if(ename==='click' && (reciver.singleSelect||reciver.muitiSelect)){selectableFlag=false;}
                    events[ename]=(ev)=>{
                        if(ename==='click' && reciver.selectable){
                            this._select(row, ev);    
                        }
                        reciver.on[ename](row, ri, ev);
                    }                   
                }
            }            
            if(selectableFlag && (reciver.singleSelect||reciver.muitiSelect)){
                 events['click']=(ev)=>{
                     this._select(row, ev);  
                 }
            }
            return events;
        }
        if((reciver.singleSelect||reciver.muitiSelect)){
            events['click']=(ev)=>{
                this._select(row, ev);  
            }
            return events;
        }
        return null;
    }
    selectedRows=[];
    selectedRow={};
    _select(row, ev){
         if(this.model.singleSelect){ 
            this.selectedRow.selected=false;
            row.selected=true;
            this.selectedRow=row;
            this._selectedRowsCallback(this.selectedRow);           
             
         }else{
           const frow=this.selectedRows.find(r=>r===row);
             if(frow){
                if(ev.ctrlKey && this.selectedRows.length>1){
                    frow.selected=false;
                    this.selectedRows=this.selectedRows.filter(r=>r!==row);                   
                }else{                    
                     this.selectedRows.forEach(r=>{r.selected=false});
                     row.selected=true;
                     this.selectedRows=[row];
                }
             }else{
                  row.selected=true;
                  if(ev.ctrlKey){                    
                    this.selectedRows.push(row);
                  }else{
                      this.selectedRows.forEach(r=>{r.selected=false});
                      this.selectedRows=[row];
                  }
             }
             this._selectedRowsCallback(this.selectedRows);
        }
        this.refresh();     
    }
    _selectedRowsCallback(rows){
        if(typeof this.model.selectedRows === 'function'){
            this.model.selectedRows(rows);
        }
    }
    _bindClass(row, ri, reciver){
        if(typeof reciver.class === 'function'){
            let classObj= reciver.class(row, ri);
            if(reciver.singleSelect||reciver.muitiSelect){
                classObj.selected=row.selected;
            }
            return classObj;
        }
        return null;
    }
    _bindStyle(row, ri, reciver){
        return typeof reciver.style === 'function'?reciver.style(row, ri):null
    }
    _footer(model){
        if(!model.footers){
            return '';
        }
        return h('tfoot',
            model.footers.map((row, ri)=>h('tr',{key:ri},
                row.map((col, ci)=>h('th',{key:ci}, col.text))
            ))
        );
    }
    //public methods
    setData(data){       
        this.dispatch({type:DATA_CHANGE, payload:data});
    }
    refresh(){
        this.dispatch({type:REFRESH});
    }
}
export {juGrid}