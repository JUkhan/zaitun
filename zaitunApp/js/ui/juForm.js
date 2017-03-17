import {h} from 'zaitun';
import {guid} from './utils';

const TAB_CLICK=Symbol('TAB_CLICK');
const OPTIONS_CHANGED=Symbol('OPTIONS_CHANGED');

class juForm{
    constructor(){
        this.dispatch=undefined;
        this.options=undefined;
        this.modalId=guid();          
    }
    init(){
        return {};
    }
    view({model, dispatch}){
        this.dispatch=dispatch;
        this.options=model.options; 
        this.model=model; 
         if(!model.data){
            model.data={};
         }
         if(!this.options){
             return h('div','juForm options is not defined');
         }  
        const vnodes=h('div.juForm', this.createElements(this.options));
        return this.options.viewMode==='form'?vnodes:this.createModal(vnodes, this.modalId);
    }
    update(model, action){
        return model;
           
    }
    createElements(options){
        const vnodes=[];
        if(options.inputs){
           options.inputs.forEach((item,index)=>{
               this.transformElement(item, index, vnodes);
           });
        }
        return vnodes
    }
    modalClose(){
        this.showModal(false);
        if(typeof this.options.modalClose==='function'){
            this.options.modalClose();
        }
    }
    createModal(vnodes, id){ 
        const buttons=this.options.buttons||[];      
        return h('div.modal',{props:{id:id}},[
            h('div.modal-dialog',{role:'document'},[
                h('div.modal-content',[
                    h('div.modal-header',[
                        h('div.modal-title', this.options.title||''),
                        h('button.close',{data:{dismiss:'modal'}, aria:{label:'Close'}, on:{click:e=>this.modalClose()}},[
                            h('span',{aria:{hidden:'true'}},'×')
                        ])
                        ]),
                    h('div.modal-body', [vnodes]),
                    h('div.modal-footer',buttons.map(this.createButtonElm.bind(this)))
                ])
            ])
        ]);
    }
    transformElement(item, index, vnodes){

        if(Array.isArray(item)){
            const velms=[];
            item.forEach((elm, index)=>{
                switch (elm.type) {
                    case 'fieldset':
                        velms.push(this.createFieldSet(elm));
                        break;
                    case 'tabs':
                        velms.push(h(`div.col-md-${item.size||6}`,this.createTabs(elm)));
                        break; 
                    case 'button':            
                        velms.push(this.createButton(elm, index));
                        break;   
                    case 'checkbox':  case 'radio':            
                        velms.push(this.createCheckbox(elm, index));
                        break;  
                    case 'label':     
                        velms.push(this.createLabel(elm, index));
                        break; 
                   case 'component': 
                        velms.push(h(`div.col-md-${elm.size||6}`,[elm.component.view({
                            model:elm.field?this.model[elm.field]:this.model,
                            dispatch:a=>this.dispatch({type:elm.actionType, action:a})
                        })]));
                        break; 
                  case 'vnode': 
                        vnodes.push(h(`div.col-md-${elm.size||6}`,[elm.vnode]));
                        break;     
                    default:
                        velms.push(...this.createElement(elm, index));
                        break;
                }                
            });
            vnodes.push( h(`div.form-group.row`,velms));
            return;
        }
        switch (item.type) {
            case 'fieldset':
                vnodes.push(this.createFieldSet(item));
                break;
            case 'tabs':
                vnodes.push(...this.createTabs(item));
                break;
             case 'button':            
                vnodes.push(h(`div.form-group.row`,[this.createButton(item, index)]));
                break;  
             case 'checkbox': case 'radio': 
                 vnodes.push(h(`div.form-group.row`,[this.createCheckbox(item, index)]));
                break;  
            case 'label': 
                 vnodes.push(h(`div.form-group.row`,[this.createLabel(item, index)]));
                break;  
            case 'vnode': 
                 vnodes.push(item.vnode);
                break;  
            case 'component':            
                 vnodes.push(item.component.view({
                     model:item.field?this.model[item.field]:this.model,
                     dispatch:a=>this.dispatch({type:item.actionType, action:a})
                 }));
                    
                break;
            default:
                const state=this.swdState(item);            
                vnodes.push( h(`div.form-group.row${item.ignoreLabelSWD?'':state[0]}`,this.createElement(item, index)));
                break;
        }        
    }
    swdState(item){     
       return item.success?['.has-success','.form-control-success', item.success]
            :item.warning?['.has-warning','.form-control-warning',item.warning]
            :item.danger?['.has-danger','.form-control-danger',item.danger]:['','',''];
    }
    createFieldSet(item){
            if(item.hide){
                return h('span',{style:{display:'none'}},'hide');
            }
            const velms=[];
            if(item.legend){
                velms.push(h('legend', item.legend));
            }
            velms.push(...this.createElements(item));            
            return h(`fieldset.col-md-${item.size||12}`,{props:{disabled:!!item.disabled}},velms);
    }
    createTabs(item){
        const elms=[], lies=[], tabcontents=[], tabNames=Object.keys(item.tabs);
        let tabLink=item.activeTab;
        tabNames.forEach(tabName=>{
            let tabId='#'+tabName.replace(/\s+/,'_###_'); 
            let disabled=!!item.tabs[tabName].disabled;
            let hide=!!item.tabs[tabName].hide; 
            if(!hide){            
                lies.push(h(`li.nav-item`,[
                    h(`a.nav-link`,{
                        props:{href:tabId},
                        class:{active:item.activeTab===tabName, disabled:disabled},                   
                        on:{click:e=>{
                            e.preventDefault();
                            if(disabled){return;}
                            if(tabLink===tabName){return;}
                            tabLink=tabName;                         
                            this.selectTab(tabName, item);                            
                            }
                        }
                    }, tabName)              

                ]));
                //tab contents 
                if(tabName===tabLink){
                    tabcontents.push(h(`div.tab-item`, this.createElements(item.tabs[tabName])));
                }
            }
        });        
        elms.push(h('div.card',[
            h('div.card-header',[ h(`ul.nav nav-tabs card-header-tabs pull-xs-left`, lies)]),
            h('div.card-block', tabcontents),
            item.footer?h('div.card-footer',[item.footer]):''
        ]))
        return elms;
    }
    getListener(item){
       let events={}, hasChange=null, modelUpdateEvent='input';
        if(typeof item.on ==='object'){
            for(let eventName in item.on){
                if(eventName===modelUpdateEvent){
                    hasChange=item.on[modelUpdateEvent];
                }else{
                    events[eventName]=e=>item.on[eventName](e);
                }
            }            
        } 
        events[modelUpdateEvent]=e=>{
                    this.setValueToData(item, e.target.value);
                    if(hasChange){
                        hasChange(e.target.value, e);
                    }
                };
        return events     
    }
    createLabel(item, index){       
         if(item.hide)return [];
         return h(`div.col-md-${item.size||4}`,[h(`label`, {on:item.on, style:item.style, class:item.class, props:{type:item.type, disabled:!!item.disabled}},item.label)]);
    }
    createButton(item, index){       
         if(item.hide)return [];
         const buttons=[];
         if(item.inline){
             item.inline.forEach((el, index)=>buttons.push(this.createButtonElm(el, index)));
         }else{
             buttons.push(this.createButtonElm(item));
         }
         return h(`div.col-md-${item.size||4}`,buttons);
    }    
    createButtonElm(item, index=0){        
        return h(`button${item.classNames||''}${item.elmSize?'.btn-'+item.elmSize:''}`,
         {key:index, on:this.getListener(item), style:item.style, class:item.class, props:{...this._bindProps(item), type:item.type, disabled:!!item.disabled}},
         item.label
         );
    }
    createCheckbox(item, index, inline){
         if(item.hide)return [];
         const buttons=[];
         if(item.inline){
             item.inline.forEach(el=>{el.type=item.type;buttons.push(this.createCheckboxElm(el, index, true));});
         }else{
             buttons.push(this.createCheckboxElm(item, index, false));
         }
         return h(`div.col-md-${item.size||4}`,buttons);
    }
    createCheckboxElm(item, index, inline){
        const elms=[];
        if(item.labelPos==='left'){
            elms.push(h('text', item.label));
            elms.push(h('input.form-check-input',{on:this.getListener(item), style:item.style, class:item.class, props:{...this._bindProps(item), type:item.type, disabled:item.disabled, name:item.name||'oo7',value:item.value}}));
        }else{
             elms.push(h('input.form-check-input',{on:this.getListener(item), style:item.style, class:item.class, props:{...this._bindProps(item), type:item.type, disabled:item.disabled, name:item.name||'oo7',value:item.value}}));
             elms.push(h('text', item.label));
        }
        return h(`div.form-check`,{class:{'form-check-inline':inline, disabled:item.disabled}},[h('label.form-check-label', elms)]);
    }
    _getLabelText(item){
         const labelItems=[item.label];
         if(item.required){
             labelItems.push(h('span.required','*'));
         }     
         return labelItems;
    }
    getValueFromData(item)
    {
        let props = item.field.split('.');
        if (props.length > 1)
        {
            let obj = this.model.data;
            props.forEach(prop => obj = obj[prop]);
            return obj;
        }
        return this.model.data[item.field];
    }
    
    setValueToData(item, val)
    { 
        let props = item.field.split('.');
        if (props.length > 1)
        {
            let obj = this.model.data;
            let len = props.length - 1;
            for (var index = 0; index < len; index++)
            {
                obj = obj[props[index]];
            }
            obj[props[index]] = val;
        }
        else { this.model.data[item.field] = val; }
        
    }
    _bindProps(item){
        return typeof item.props === 'object'?item.props:{}
    }
    createElement(item, index){   
        if(item.hide)return [];    
        const children=[];
        const state=this.swdState(item);
        const labelPos=this.options.labelPos||item.labelPos||'left';
        const childrenWithLabel=[];

        //this.setListener(item);
        if(labelPos==='top' && item.label){
            children.push(h(`label.col-form-label${item.elmSize?'.col-form-label-'+item.elmSize:''}`, this._getLabelText(item)));
        }
        if(item.type==='select'){
            children.push(this.createSelect(item, state));
        }else{
            children.push(h(`input.form-control${state[1]}${item.elmSize?'.form-control-'+item.elmSize:''}`,
            {on:this.getListener(item), style:item.style, class:item.class, props:{...this._bindProps(item), type:item.type, value:this.getValueFromData(item), disabled:!!item.disabled}}));
        }
        if(state[2]){ 
             children.push(h(`div.form-control-feedback`, state[2]));
        }
        if(item.info){
            children.push(h('small.form-text.text-muted', item.info));
        }  
        if(labelPos==='left' && item.label){
            const labelSize=item.labelSize||this.options.labelSize||2;
            childrenWithLabel.push(h(`label.col-form-label${item.elmSize?'.col-form-label-'+item.elmSize:''}${'.col-md-'+labelSize}`, this._getLabelText(item)));
        }
        childrenWithLabel.push(h(`div.col-md-${item.size||4}${state[0]}`,  children));        
        return childrenWithLabel;
   }
   createSelect(item, state){
       if(!item.data)item.data=[];
       return h(`select.form-control${state[1]}${item.elmSize?'.form-control-'+item.elmSize:''}`,
            {on:this.getListener(item), style:item.style, class:item.class, props:{...this._bindProps(item), type:item.type, value:this.getValueFromData(item), disabled:!!item.disabled, multiple:!!item.multiple}},
                item.data.map((it, index)=>h('option',{props:{...this._bindProps(item), value:it.value, key:index }}, it.text))
            );
        
   }
   _findTab(items, tabName){
        for(let item of items){          
               if(Array.isArray(item)){
                   const res=this._findTab(item, tabName);
                   if(res){return res;}
               }
               else if(item.type==='tabs' && typeof item.tabs==='object'){
                  const find=Object.keys(item.tabs).find(tn=>tn===tabName);
                  if(find){return item;}
               }
           }
          return null; 
   }
   _findField(items, fieldName){
        for(let item of items){          
               if(Array.isArray(item)){
                   const res=this._findTab(item, fieldName);
                   if(res){return res;}
               }
               else if(item.field===fieldName){
                  return item;
               }
           }
          return null; 
   }
   findTab(tabName){
        if(this.options.inputs){
           return this._findTab(this.options.inputs, tabName);
        }
        return null;
   }
   findField(fiendName){
        if(this.options.inputs){
           return this._findField(this.options.inputs, fiendName);
        }
        return null;
   }
   selectTab(tabName, item=null){
       if(!item){item=this.findTab(tabName);}
       if(item){
            const res=typeof item.click==='function'?item.click(tabName):true;            
            if(typeof res ==='boolean'){
                if(res){ 
                    item.activeTab=tabName;
                    this.dispatch({type:TAB_CLICK, payload:{tabName,formName:this.options.name||'oo7'}});
                }
            }
            else if(typeof res ==='object' && res.then){
                res.then(isTrue=>{
                    if(isTrue){
                        item.activeTab=tabName;
                        this.dispatch({type:TAB_CLICK,form:this.options.name||'oo7', payload:{tabName,formName:this.options.name||'form007'}});
                    }
                })
            }
       }
   }
   optionsChanged(){
        this.dispatch({type:OPTIONS_CHANGED});
   }
   showModal(isOpen){ 
       $('#'+this.modalId).modal(isOpen?'show':'hide');
   }
   setSelectData(fieldName, data){
       const item=this.findField(fieldName);
       if(item){
           item.data=data;
           this.optionsChanged();
       }
   }
   setFormData(data){
       this.model.data=data;
       this.optionsChanged();
   }
   getFormData(){
       return  this.model.data;
   }
}

export {juForm, TAB_CLICK}
