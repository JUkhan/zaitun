/** @jsx html */

import {h, html} from 'zaitun';

import {juForm, TAB_CLICK} from './ui/juForm';
import clsCounter from './Counter';
import clsCounterList from './CounterList';
import Todos from './todos/todos';
import {juGrid} from './ui/juGrid';

const TestForm=new juForm();
const TestForm2=new juForm();
const Counter=new clsCounter();
const CounterList=new clsCounterList();
const TodosCom=new Todos();
const Grid=new juGrid();

export default class FormExample{
    constructor(){
        this.selectedRow={};
    }    
    init(dispatch){       
       const model={};
       model.data={name:'Abdulla',ox:{age:32}, gender:2};
       model.options=this.getFormOptions(model, dispatch);
       model.counter=Counter.init();
       model.counterList=CounterList.init();
       model.todos=TodosCom.init();
       model.grid=this.gridOptions();
       return {form1:model, form2:{options:this.getFormOptions2(), data:{name:'Abdulla'}}};
    }
    onViewInit(model, dispatch){        
        const countries=[
            {text:'Bangladesh', value:1},
            {text:'Pakistan', value:2},
            {text:'Uzbekistan', value:3}
        ];
        Grid.setSelectData(4, countries);
    }
    formClass(){
        return {'form-control':1,'form-control-sm':1 };
    }
    gridOptions(){
        const emptyObj={name:'', age:16, address:'', single:false, country:''}
        return {
            tableClass:'.table-sm.table-bordered.xtable-responsive',            
            headerClass:'.thead-default',
            footerClass:'.thead-default', 
            pager:{pageSize:5, linkPages:10, enablePowerPage:0, nav:1, search:1, pagerInfo:1, elmSize:'sm'},
            hideHeader:!true,
            hideFooter:!true,
            hidePager:!true,            
            //aes:true, //disallowed empty selection --default false
            pagerPos:'top', //top|bottom|both --default both
            //pageChange:data=>Grid.selectRow(0),
            singleSelect:true,
            //multiSelect:true,
            selectedRows:(rows, ri, ev)=>{
                //this.selectedRow.editable=false;
                //rows.editable=true;
                this.selectedRow=rows;
            },
            aews:true, //apply Editable When Selected - default true 
            recordChange:(row, col, ri, ev)=>{Grid.refresh();},
            //on:{click:(row, i, ev)=>{console.log(row, i, ev)}},
            //style:(row, i)=>({color:'gray'}),
            //class:(row, i)=>({hide:1}),          
            columns:[
                {header:'Name',hClass:'.max', sort:true, iopts:{class:r=>this.formClass()}, focus:true, field:'name',type:'text'},
                {header:'Age', sort:true, iopts:{class:r=>this.formClass()}, editPer:row=>false, field:'age', type:'number', tnsValue:val=>val+' - formated'},
                {header:'Birth Date',sort:true, iopts:{class:r=>this.formClass()}, field:'address', type:'date'},
                {id:4, header:'Country',iopts:{class:r=>this.formClass()}, field:'country', type:'select'},
                {header:'Single?', field :'single', type:'checkbox', tnsValue:val=>val?'Yes':'No'},
                
            ],
            xheaders:[
                [{text:'Name', props:{colSpan:3}},
                 {text:'Country', props:{colSpan:2}}   
                ]
            ],
            footers:[
                //[{text:'footer1',style:col=>({color:'red'})},{text:'footer1',props:{colSpan:4}}],
            [
                {cellRenderer:data=><b>Total Rows: {data.length}</b>},
                {cellRenderer:data=>
                    <div>
                        <button on-click={()=>Grid.addRow({...emptyObj}).refresh()}>Add <i classNames="fa fa-plus"></i></button>&nbsp;
                        <button disabled={Grid.data.length===0} on-click={()=>confirm('Remove sure?')&&Grid.removeRow(this.selectedRow).pager.clickPage(Grid.pager.activePage)}>Remove <i classNames="fa fa-trash"></i></button>
                    </div>
                },
                {props:{colSpan:2}, cellRenderer:d=><b>Total Selected Rows: {d.filter(_=>_.selected).length}</b>},
                {cellRenderer:data=><b>{data.reduce((a,b)=>a+(b.single?1:0),0)}</b>}
            ]
            ] 
        }
    }
    nameClick(row, e){
        row.name=e.target.value;
        console.log(row.name, e);
    } 
    getFormOptions2(){
        return {
            viewMode:'popup', title:'Popup Title', name:'pform', size:'lg',
            modalClose:()=>true,
            buttons:[{label:'Close',on:{click:()=>TestForm2.modalClose()}, classNames:'.btn.btn-outline-success', elmSize:'sm'}],
             inputs:[
                {type:'vnode', vnode:<div>Hello popup</div>},
                {type:'text', field:'name', label:'Name'},
                {type:'tabs', activeTab:'tab1',tabs:{
                    tab1:{inputs:[{ 
                                        type:'text', 
                                        label:'Name',                                        
                                        field:'name'
                                    }]},
                    tab2:{
                        inputs:[
                            {type:'vnode', vnode:<b>tab content</b>}
                        ]
                    }                
                }}
            ]
        }
    }   
    //{field:'age',  label:'Adress', type:'number', size:4, warning:'warning', info:'hello info',elmSize:'sm'}
    getFormOptions(model, dispatch){
       
        return {
            viewMode:'form', name:'form1', labelSize:1, labelPos:'left', title:'Form Title',
                 inputs:[    
                    [{field:'ox.age',  required:true, danger:'danger', label:'Adress', type:'text', size:3},
                    {field:'age2', label:'Adress2', props:{maxLength:10, placeholder:'00/00/0000'},
                     success:true, type:'text', size:3}],
                                            
                    {field:'gender', required:true, ignoreLabelSWD:1, warning:'warning', on:{input:val=>console.log(val)}, size:5, type:'select', label:'Gender', data:[{text:'Male', value:1},{text:'Female', value:2}]},
                    {
                        type:'tabs', 
                        activeTab:'Grid',
                        footer:<div>Footer</div>,
                        tabClick:(tabName, prevTab)=>{
                          //return bool|Promise                          
                          return true;
                        },
                        tabs:{                        
                            Counter:{                                 
                                inputs:[
                                {type:'vnode', vnode:<div style={({height:'20px'})}></div>},
                                    { size:3, 
                                        type:'component', 
                                        actionType:'Counter',
                                        component:Counter,
                                        field:'counter'
                                    }
                            ]},
                            'Counter List':{ inputs:[
                                    {
                                        type:'component', 
                                        actionType:'CounterList',
                                        component:CounterList,
                                        field:'counterList'
                                    }
                            ]},
                            Todos:{ inputs:[
                                    {
                                        type:'component', 
                                        actionType:'Todos',
                                        component:TodosCom,
                                        field:'todos'
                                    }
                            ]},
                            Grid:{
                                inputs:[
                                    [{type:'button', on:{click:this.loadData}, classNames:'.btn.btn-primary.btn-sm', label:'Load Data'},
                                    {type:'button', on:{click:()=>{Grid.hideColumns([4], true).refresh();}}, classNames:'.btn.btn-primary.btn-sm', label:'Hide Country'}
                                    ],
                                    {
                                        type:'component',
                                        actionType:'grid',
                                        component:Grid,
                                        field:'grid'
                                    }
                                ]
                            },
                            'Disabled':{
                                disabled:true,
                                inputs:[
                                    {type:'vnode', vnode:<div>tab content</div>}
                                ]
                            },
                            'I was Hidden':{
                                hide:true,
                                inputs:[
                                    {type:'vnode', vnode:<div>tab content</div>}
                                ]
                            }
                        }   
                    }            
                ]   
        };
    }
    loadData(dispatch){
       
        let data=[];
        for(let i=0;i<7;i++){
            data.push({name:'Abdulla'+i, age:32, 
            address:'2017-02-15', single:i%2?true:false,
            country:Math.floor(Math.random() * 3) + 1 });
        }
        Grid.setData(data).selectRow(0).refresh();
    }
    view({model, dispatch}){    
        this.model=model;
        return <div>
        <div>
         <button on-click={this.optionChanged.bind(this)}>Change Form State <i classNames="fa fa-home"></i></button>
         <button on-click={()=>TestForm2.showModal(1)}>Show Popup</button>
        </div>
            <TestForm model={model.form1} dispatch={dispatch} />
            <TestForm2 model={model.form2} dispatch={action=>dispatch({type:'form2', payload:action})} />
        </div>
    }
    update(model, action){   
        switch (action.type) {
            case 'Counter':
               model.form1.counter=Counter.update(model.form1.counter, action.action);                   
                return model;              
            case 'CounterList':
                model.form1.counterList=CounterList.update(model.form1.counterList, action.action); 
                return model;  

            case 'Todos':
               model.form1.todos=TodosCom.update(model.form1.todos, action.action); 
                return model; 
            case 'form2':
                console.log('form-2');
                //model.form2=TestForm2.update(model.form2, action.payload);
                return model;
            case 'grid':
                model.form1.grid=Grid.update(model.form1.grid, action.action);               
                return model;
            default:
               return model;
        }
       
    }
    optionChanged(){
          //this.options.inputs[0][0].hide=true;
          //this.options.inputs[4].tabs.tab1.hide=false;
          //this.options.inputs[4].tabs.tab1.disabled=false;
        //JuForm.refresh();
       this.model.form1.options.inputs[2].tabs['I was Hidden'].hide=false;
       TestForm.findTab('Disabled')[0].disabled=false;
       TestForm.setSelectData('gender',[{text:'Male--', value:1},{text:'Female--', value:2}]);
       //JuForm.showModal(true);
       console.log(TestForm.getFormData());
       TestForm
       .setFormData({name:'Abdulla-up',ox:{age:2.2}, gender:1, age2:'02/29/2000'}).refresh();
       
       console.log(TestForm.getFormData());
    }

}