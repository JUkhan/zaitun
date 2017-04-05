import {h} from 'zaitun';
import {juPage} from './juPager';
import {s4} from './utils';
const DATA_CHANGE=Symbol('SET_DATA');
const PAGER_ACTION=Symbol('pager_action');
const REFRESH=Symbol('REFRESH');

class juGrid{  
    constructor(){
        this.data=[];
        this.pager=new juPage();
        this.__loaded=false;
        this.__id=s4(); 
    }   
    init(){
        return {};
    }
    view({model, dispatch}){
        this.dispatch=dispatch;
        this.model=model; 
        if(this._isUndef(model.columns)){
            return h('div','columns undefined');
        }
        model.columns.forEach(col=>{
            if(col.type==='select'){
                if(this._isUndef(col.valueProp)){
                    col.valueProp='value';
                }
                if(this._isUndef(col.textProp)){
                    col.textProp='text';
                }
            }
        });
        if(this._isUndef(model.aews)){
            model.aews=true;
        }
        this._initPaager(model);
        const table=h('table.table'+(this.model.tableClass||''), [
            this._header(model),
            this._body(model),
            this._footer(model)
        ]);
        if(!this.__loaded){            
            if(typeof this.model.onLoad==='function'){
                let tid=setTimeout(()=>{this.model.onLoad();clearTimeout(tid);});
            }
            this.__loaded=true;
        }
        return h('div.juGrid',[
            this._getPager(model.pager, dispatch, 'top'),
            table,
            this._getPager(model.pager, dispatch, 'bottom'),
            ]);
        
    }
    update(model, action){ 
        switch (action.type) {
            case PAGER_ACTION:
                model.pager=this.pager.update(model.pager, action.payload);
                return model;
        
            default:
               return model;
        }       
        
    }
    _initPaager(model){
        if(this._isUndef(model.pager)){
            model.pager=this.pager.init();
        }
        this.pager.pageChange=this._pageChange.bind(this);
        if(this._isUndef(model.pagerPos)){
            model.pagerPos='both';
        }
        if(this._isUndef(model.pager.nav)){
            model.pager.nav=true;
        }
        if(typeof model.pager.sspFn==='function'){
            this.pager.sspFn=model.pager.sspFn;
        }
        if(this._isUndef(model.pager.searchFn)){
           model.pager.searchFn=(data, val)=>{
                const res=[], columns=this.model.columns, len=columns.length;
                data.forEach((item) =>
                {
                    for (var index = 0; index < len; index++)
                    {
                        const col = columns[index];
                        if (col.field && item[col.field] && item[col.field].toString().toLowerCase().indexOf(val) !== -1)
                        {
                            res.push(item); break;
                        }
                    }
                });
                return res;
           };
        }
    }
    _pageChange(data){
       this.data=data;
       if(this.pager.diffPageAction){
            this.selectedRows=[];
       }
       if(typeof this.model.pageChange === 'function'){
           this.model.pageChange(data);
       }
    }
    _getPager(pagerModel, dispatch, pos){
        if(this.model.hidePager){
            return '';
        }       
        if((pos==='top' && (this.model.pagerPos==='both' ||this.model.pagerPos==='top')) || (pos==='bottom' && (this.model.pagerPos==='both' ||this.model.pagerPos==='bottom'))){
                return h('div.juPager',[this.pager.view({model:pagerModel, dispatch:action=>dispatch({type:PAGER_ACTION,payload:action})})])
        }
        return '';
    }
     _sort(col){
       if(!col.sort)return;       
        col.reverse = !(col.reverse === undefined ? true : col.reverse);
        this.model.columns.forEach(_ =>
        {
            if (_ !== col)
            {
                _.reverse = undefined;
            }
        });        
        const reverse = !col.reverse ? 1 : -1, sortFn = typeof col.comparator === 'function' ?
            (a, b) => reverse * col.comparator(a, b) :
            function (a, b) { return a = a[col.field], b = b[col.field], reverse * ((a > b) - (b > a)); };
        if(!this.pager.sspFn){
            this.pager.data.sort(sortFn);
        }
        this._sort_action=true;
        this.pager.sort(col.field,col.reverse);
      
    }
    _sortIcon(colDef)
    {
        const hidden = colDef.reverse === undefined;
        return { 'fa-sort': hidden, 'not-active': hidden, 'fa-caret-up': colDef.reverse === false, 'fa-caret-down': colDef.reverse === true }; 
    }
    _header(model){
        if(model.hideHeader){
            return '';
        }
        return h('thead'+(this.model.headerClass||''),[
                ...this._Extraheaders(model),
                h('tr',model.columns.filter(col=>!col.hide).map((col, index)=>h('th'+(col.hClass||''),{key:this.__id+index, on:{click:()=>this._sort(col)}}, [col.sort?h('i.fa',{class:this._sortIcon(col)}):'',col.header])))
            ])
    }    
    _body(model){
        if(!this.data.length){
            return h('tbody',[h('tr',[
                h('td.table-info',{props:{colSpan:model.columns.length}},'Data not found')
            ])]);
        }
        this._refreshSelectedRows(model);
        return this._defaultView(model);
    }
    _refreshSelectedRows(model){        
        if(model.multiSelect){
            this.selectedRow={};
            const sdata=this.data.filter(_=>_.selected);
            for(var i=0;i<sdata.length; i++){
                if(sdata[0]!==this.selectedRows[0]){
                    break;
                }
            }
            if(i!==sdata.length){
                this.selectedRows=sdata;
                this._selectedRowsCallback(this.selectedRows);
            }
            
        }
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
    _check_apply_editable_when_selected(row){
        return this.model.aews?row.selected:row.editable;
    }
    _cellValue(row, col, ri){       
        if(typeof col.cellRenderer==='function'){
            return  [col.cellRenderer(row, ri)];
        }
        if(col.type){
            if(typeof col.editPer==='function' && !col.editPer(row, ri)){
                 return this._transformValue(row[col.field], row, col, ri); 
            }
            if(this._isUndef(col.iopts)){col.iopts={};}
            if(this._isUndef(col.props)){col.props={};}           
            switch (col.type) {
                case 'select':
                    const data=col[col.field+'_data']||[];
                    return this._check_apply_editable_when_selected(row)?
                    [h('select',{
                       hook:{insert:vnode=>this._focus(col, vnode.elm)},
                       on:this._bindInputEvents(row, ri, col, col.iopts, 'change'),
                       style:this._bindStyle(row, ri, col.iopts),
                       class:this._bindClass(row, ri, col.iopts),
                       props:{...this._bindProps(row, ri, col.iopts), value:row[col.field]}
                    },
                    data.map(d=>h('option',{props:{value:d[col.valueProp]}}, d[col.textProp]))
                    )
                    ]
                    :this._transformValue(row[col.field], row, col)
                case 'checkbox':
                return this._check_apply_editable_when_selected(row)?
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
                   return this._check_apply_editable_when_selected(row)?
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
            const item=data.find(_=>_[col.valueProp].toString()===val);
            if(item){
                return item[col.textProp];
            }
        }
        return val;
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
        if(this.model.singleSelect && !this.model.aes && row===this.selectedRow){
            return;
        }
        var is_not_refresh= false, xlen=-1; 
        if(this.model.singleSelect){ 
            if(row!==this.selectedRow){
                this.selectedRow.selected=false;
            }
            row.selected=this.model.aes?!row.selected:true;           
            this.selectedRow=row;
            if(row.selected){
                this._selectedRowsCallback(this.selectedRow, ri, ev); 
            } 
         }else{
           const frow=this.selectedRows.find(r=>r===row); 
                  
             if(frow){
                if(this.model.aes){
                   if(ev.ctrlKey){
                        frow.selected=false;
                        this.selectedRows=this.selectedRows.filter(r=>r!==row);                   
                    }else{                    
                        this.selectedRows.forEach(r=>{r.selected=false});                        
                        this.selectedRows=[];
                    }
                } 
                else if(ev.ctrlKey && this.selectedRows.length>1){
                    frow.selected=false;
                    this.selectedRows=this.selectedRows.filter(r=>r!==row);                   
                }else{                    
                     this.selectedRows.forEach(r=>{r.selected=false});
                     row.selected=true;
                     xlen= this.selectedRows.length;
                     this.selectedRows=[row];
                     is_not_refresh=true;
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
             if(xlen!==1){
                this._selectedRowsCallback(this.selectedRows, ri, ev);
             }
            
        }        
        if(xlen!==1){
            this.refresh();
        }     
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
            const classObj=reciver.class?{...reciver.class}:{};
            if(reciver.singleSelect||reciver.multiSelect){
                classObj.selected=row.selected;
            }
            return classObj;
        }
       
    }
    _bindStyle(row, ri, reciver){
        return typeof reciver.style === 'function'?reciver.style(row, ri):reciver.style
    }
    _bindProps(row, ri, reciver){
        return typeof reciver.props === 'function'?reciver.props(row, ri):reciver.props||{}
    }
    _Extraheaders(model){
        if(!model.headers){
            return [];
        }
        return model.headers.map((row, ri)=>h('tr',{key:ri},
                row.filter(col=>!col.hide).map((col, ci)=>h('th',{
                    key:ci, 
                    props:col.props,
                    on:this._bindEvents(col, ri, col),
                    style:this._bindStyle(col, ri, col),
                    class:this._bindClass(col, ri, col)
                }, this._footerCellValue(col, ri)))
            ));
       
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
            if(!this.model.hidePager && !this.pager.sspFn){
                return  [col.cellRenderer(this.pager.data||[], this.data||[], ri)];
            }
            return  [col.cellRenderer(this.data||[], this.pager, ri)];
        }
        return col.text;        
    }  
    //public methods
    selectRow(rowIndex){ 
        if(Array.isArray(this.data)){
            if(this.data.length>rowIndex && (this.model.singleSelect||this.model.multiSelect)){
                this.selectedRow.selected=false;
                this.selectedRows.forEach(row=>{row.selected=false;});
                if(rowIndex<this.data.length){
                    this.data[rowIndex].selected=true;
                    if(this.model.singleSelect){this.selectedRow=this.data[rowIndex];}                
                    else{ this.selectedRows=[this.data[rowIndex]];}  
                    this._selectedRowsCallback(this.data[rowIndex]);  
                }           
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
            this.pager.setData(data);
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
    removeRow(row){        
        var index=this.data.indexOf(this.selectedRow);        
        this.data.splice(index, 1)
        if(typeof this.model.pager.sspFn!=='function'){  
            const inx=this.pager.data.indexOf(this.selectedRow);          
            this.pager.data.splice(inx, 1);
            if(this.model.pager.search && this.pager.data.length!==this.pager._cachedData.length){               
                this.pager._cachedData.splice(inx, 1);
            }
        }
        if(index>=this.data.length){
            index--;
        }
        if(index>=0){
            this.selectRow(index); 
        }       
        return this;
    }
    addRow(row){
        var index=this.data.indexOf(this.selectedRow);
        this.data.splice(index+1, -1, row);
        if(typeof this.model.pager.sspFn!=='function'){ 
            const inx=this.pager.data.indexOf(this.selectedRow)+1;           
            this.pager.data.splice(inx, -1, row);
            if(this.model.pager.search && this.pager.data.length!==this.pager._cachedData.length){               
                this.pager._cachedData.splice(inx, -1, row);
            }
        }
        this.selectRow(index+1);
        return this;
    }
}
export {juGrid}