import {h} from 'zaitun';
import {juPage} from '../juPager';
const DATA_CHANGE=Symbol('SET_DATA');
const PAGER_ACTION=Symbol('pager_action');
const REFRESH=Symbol('REFRESH');
const Pager=new juPage();

class juGrid{  
    constructor(){
        this.data=[];
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
        if(this._isUndef(model.pager)){
            model.pager=Pager.init();
        }
        Pager.pageChange=this._pageChange.bind(this);
        if(this._isUndef(model.pagerPos)){
            model.pagerPos='both';
        }
        const table=h('table.table'+(this.model.tableClass||''), [
            this._header(model),
            this._body(model),
            this._footer(model)
        ]);
        return h('div.juGrid',[
            this._getPager(model.pager, dispatch, 'top'),
            table,
            this._getPager(model.pager, dispatch, 'bottom'),
            ]);
    }
    update(model, action){ 
        switch (action.type) {
            case PAGER_ACTION:
                model.pager=Pager.update(model.pager, action.payload);
                return model;
        
            default:
               return model;
        }       
        
    }
    _pageChange(data){
       this.data=data;
       console.log(data);
        //this.refresh();
    }
    _getPager(pagerModel, dispatch, pos){
        if(this.model.hidePager){
            return '';
        }       
        if((pos==='top' && (this.model.pagerPos==='both' ||this.model.pagerPos==='top')) || (pos==='bottom' && (this.model.pagerPos==='both' ||this.model.pagerPos==='bottom'))){
                return h('div.juPager',[Pager.view({model:pagerModel, dispatch:action=>dispatch({type:PAGER_ACTION,payload:action})})])
        }
        return '';
    }
    _header(model){
        if(model.hideHeader){
            return '';
        }
        return h('thead'+(this.model.headerClass||''),[
                h('tr',model.columns.filter(col=>!col.hide).map((r, index)=>h('th',{key:index}, r.header)))
            ])
    }
    _body(model){
        if(!this.data.length){
            return h('tbody',[h('tr',[
                h('td.table-info',{props:{colSpan:model.columns.length}},'Data not found')
            ])]);
        }
        return this._defaultView(model);
    }
    _defaultView(model){
        const columns=model.columns.filter(col=>!col.hide);
        return h('tbody',
            this.data.map((row, ri)=>h('tr',{
                key:ri,
                on:this._rowBindEvents(row, ri, model),
                style:this._bindStyle(row, ri, model),
                class:this._bindClass(row, ri, model)},
                columns.map((col, ci)=>h('td', {
                    key:ci,
                    on:this._bindEvents(row, ri, col),
                    style:this._bindStyle(row, ri, col),
                    class:this._bindClass(row, ri, col),
                    props:this._bindProps(row, ri, col)
                }, this._cellValue(row, col, ri)))
            ))
        );
    }
    _isUndef(p){
        return p===undefined;
    }
    _cellValue(row, col, ri){       
        if(typeof col.cellRenderer==='function'){
            return  [col.cellRenderer(row, ri)];
        }
        if(col.type){
            if(!this._isUndef(col.editPer) && !col.editPer(row, ri)){
                 return this._transformValue(row[col.field], row, col, ri); 
            }
            if(this._isUndef(col.iopts)){col.iopts={};}
            if(this._isUndef(col.props)){col.props={};}           
            switch (col.type) {
                case 'select':
                    const data=col[col.field+'_data']||[];
                    return row.selected?
                    [h('select',{
                       hook:{insert:vnode=>this._focus(col, vnode.elm)},
                       on:this._bindInputEvents(row, ri, col, col.iopts, 'change'),
                       style:this._bindStyle(row, ri, col.iopts),
                       class:this._bindClass(row, ri, col.iopts),
                       props:{...this._bindProps(row, ri, col.iopts), value:row[col.field]}
                    },
                    data.map(d=>h('option',{props:{value:d.value}}, d.text))
                    )
                    ]
                    :this._transformValue(row[col.field], row, col)
                case 'checkbox':
                return row.selected?
                   [h('input',{
                       hook:{insert:vnode=>this._focus(col, vnode.elm)},
                       on:this._bindInputEvents(row, ri, col, col.iopts, 'change'),
                       style:this._bindStyle(row, ri, col.iopts),
                       class:this._bindClass(row, ri, col.iopts),
                       props:{...this._bindProps(row, ri, col.iopts), type:col.type, checked:row[col.field]}
                    })
                   ]
                   :this._transformValue(row[col.field], row, col)
                default:               
                   return row.selected?
                   [h('input',{
                       hook:{insert:vnode=>this._focus(col, vnode.elm)},
                       on:this._bindInputEvents(row, ri, col, col.iopts,'input'),
                       style:this._bindStyle(row, ri, col.iopts),
                       class:this._bindClass(row, ri, col.iopts),
                       props:{...this._bindProps(row, ri, col.iopts), type:col.type, value:row[col.field]}
                    })
                   ]
                   :this._transformValue(row[col.field], row, col)
            }
        }
        return this._transformValue(row[col.field], row, col, ri);        
    }
    _getSelectText(col, val){        
        const data=col[col.field+'_data'];
        if(this._isUndef(val)){
            val='';
        }
        val=val.toString();
        if(Array.isArray(data)){
            const item=data.find(_=>_.value.toString()===val);
            if(item){
                return item.text;
            }
        }
        return '';
    }
    _transformValue(val, row, col, ri){
        if(col.type==='select'){
            return typeof col.tnsValue==='function'?col.tnsValue(val, row, ri)
            :this._getSelectText(col, val)
        }
        return typeof col.tnsValue==='function'?col.tnsValue(val, row, ri):val
    }
    _recordUpdate(row, col, ri, ev){        
        if(col.type==='checkbox'){
            row[col.field]=ev.target.checked;
            console.log(ev.target.checked);
        }else{
            row[col.field]=ev.target.value;
        }
        if(typeof this.model.recordChange==='function'){
            this.model.recordChange(row, col, ri, ev);
        }
    } 
    _focus(col, elm){
        if(col.focus){
            elm.focus();
        }
    }
    _rowBindEvents(row, ri, reciver){
        let events={}, has_click_evt=false;        
        if(typeof reciver.on==='object'){ 
            if(reciver.on['click'] && (reciver.singleSelect||reciver.multiSelect)){has_click_evt=true;}           
            for(let ename in reciver.on){
                if(reciver.on.hasOwnProperty(ename)){
                    events[ename]=(ev)=>{
                        if(ename==='click' && has_click_evt){
                            this._select_row(row, ri, ev);    
                        }
                        reciver.on[ename](row, ri, ev);
                    }                   
                }
            }
        }
        if(!has_click_evt && (reciver.singleSelect||reciver.multiSelect)){
            events['click']=(ev)=>{
                this._select_row(row, ri, ev);  
            };
            return events;
        }
        return events;
    } 
     _bindEvents(row, ri, reciver){
        if(typeof reciver.on==='object'){ 
            let events={};                     
            for(let ename in reciver.on){
                if(reciver.on.hasOwnProperty(ename)){
                    events[ename]=(ev)=>{                       
                        reciver.on[ename](row, ri, ev);
                    };                   
                }
            }
            return events;
        }        
        return undefined;
    }    
    _bindInputEvents(row, ri, col, reciver, recChngeEvName){
        let events={}, has_input_evt=false; 
        if(typeof reciver.on==='object'){
            if(reciver.on[recChngeEvName]){has_input_evt=true;}              
            for(let ename in reciver.on){
                if(reciver.on.hasOwnProperty(ename)){
                    events[ename]=(ev)=>{
                        if(ename===recChngeEvName && has_input_evt){
                            this._recordUpdate(row, col, ri, ev);
                        }
                        reciver.on[ename](row, ri, ev);
                    }                   
                }
            }
           
        }        
        if(!has_input_evt){
            events[recChngeEvName]=(ev)=>{
                this._recordUpdate(row, col, ri, ev);
            } 
       }
       return events;
    }
    selectedRows=[];
    selectedRow={};
    _select_row(row, ri, ev){
         if(this.model.singleSelect){ 
            this.selectedRow.selected=false;
            row.selected=true;
            this.selectedRow=row;
            this._selectedRowsCallback(this.selectedRow, ri, ev);           
             
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
             this._selectedRowsCallback(this.selectedRows, ri, ev);
        }
        this.refresh();     
    }
    _selectedRowsCallback(rows, ri, ev){
        if(typeof this.model.selectedRows === 'function'){
            this.model.selectedRows(rows, ri, ev);
        }
    }
    _bindClass(row, ri, reciver){
        if(typeof reciver.class === 'function'){
            const classObj= reciver.class(row, ri);
            if(reciver.singleSelect||reciver.multiSelect){
                classObj.selected=row.selected;
            }
            return classObj;
        }else{
            const classObj= {};
            if(reciver.singleSelect||reciver.multiSelect){
                classObj.selected=row.selected;
            }
            return classObj;
        }
       
    }
    _bindStyle(row, ri, reciver){
        return typeof reciver.style === 'function'?reciver.style(row, ri):undefined
    }
    _bindProps(row, ri, reciver){
        return typeof reciver.props === 'function'?reciver.props(row, ri):{}
    }
    _footer(model){
        if(!model.footers||model.hideFooter){
            return '';
        }
        return h('tfoot'+(this.model.footerClass||''),
            model.footers.map((row, ri)=>h('tr',{key:ri},
                row.filter(col=>!col.hide).map((col, ci)=>h('th',{
                    key:ci, 
                    props:col.props,
                    on:this._bindEvents(col, ri, col),
                    style:this._bindStyle(col, ri, col),
                    class:this._bindClass(col, ri, col)
                }, this._footerCellValue(col, ri)))
            ))
        );
    }
     _footerCellValue(col, ri){       
        if(typeof col.cellRenderer==='function'){
            if(!this.model.hidePager && !Pager.sspFn){
                return  [col.cellRenderer(Pager.data||[], this.data||[], ri)];
            }
            return  [col.cellRenderer(this.data||[], ri)];
        }
        return col.text;        
    }  
    //public methods
    select(rowIndex){ 
        if(Array.isArray(this.data)){
            if(this.data.length>rowIndex && (this.model.singleSelect||this.model.multiSelect)){
                this.selectedRow.selected=false;
                this.selectedRows.forEach(row=>{row.selected=false;});
               this.data[rowIndex].selected=true;
                if(this.model.singleSelect){this.selectedRow=this.data[rowIndex];}                
                else{ this.selectedRows=[this.data[rowIndex]];}               
            }
        }
        return this;
    }
    focus(rowIndex, colId){ 
        if(colId){     
            this.model.columns.forEach(col=>{col.focus=col.id===colId;});
        }
        return this.select(rowIndex);
    }
    setData(data){
        if(this.model.hidePager){
            this.data=data;
        }else{
            Pager.setData(data);
        }
        return this;
    }
    refresh(){
        this.dispatch({type:REFRESH});
        return this;
    }
    hideColumns(colids, isHide){       
        colids.forEach(cid=>{
            const hcol=this.model.columns.find(c=>c.id===cid);
            if(hcol){
                hcol.hide=isHide;
            }
        });
        return this;
    }
    hideFooterColumns(colids, isHide){
        if(!this.model.footers)return this;
        colids.forEach(cid=>{
           for(const row of this.model.footers){
               const col= row.find(c=>c.id===cid);
               if(col){
                    col.hide=isHide;
                    break;
               }
           }            
        });
        return this;
    }
    setSelectData(colID, data){
        const col=this.model.columns.find(_=>_.id===colID);
        if(col){
            col[col.field+'_data']=data;
        }
        return this;
    }
}
export {juGrid}