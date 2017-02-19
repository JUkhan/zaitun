/** @jsx html */

import {h, html} from 'zaitun';

import {juForm, TAB_CLICK} from './ui/juForm/juForm';
import clsCounter from './clsCounter';
import clsCounterList from './clsCounterList';
import Todos from './todos/todos';
import {juGrid} from './ui/juGrid/juGrid';

const TestForm=new juForm();
const Counter=new clsCounter();
const CounterList=new clsCounterList();
const TodosCom=new Todos();
const Grid=new juGrid();

export default class FormExample{
    
    init(dispatch){       
       const model={};
       model.data={name:'Abdulla',ox:{age:32}, gender:2};
       model.options=this.getFormOptions(model, dispatch);
       model.counter=Counter.init();
       model.counterList=CounterList.init();
       model.todos=TodosCom.init();
       model.grid=this.gridOptions();
       return model;
    }
    gridOptions(){
        return {
            singleSelect:true, xmuitiSelect:true,
            selectedRows:rows=>console.log(rows),
            //on:{dblclick:(row, i, ev)=>{console.log(row, i, ev)}},
            style:(row, i)=>({color:'gray'}),
            class:(row, i)=>({hide:1}),          
            columns:[
                {header:'Name', field:'name', cellRenderer:(row, i)=>
                    i%2?
                    <input type="text" on-input={this.nameClick.bind(null, row)} value={row.name}/>
                    :row.name
                },
                {header:'Age', field:'age',on:{mouseenter:row=>console.log(row.age)}, style:(row, i)=>({color:'red'})},
                {header:'Address', field:'address'},
            ],
            footers:[
                [{text:'footer1'},{text:'footer1'},{text:'footer1'}]
               
            ]
        }
    }
    nameClick(row, e){
        row.name=e.target.value;
        console.log(row.name, e);
    }
    //{field:'age',  label:'Adress', type:'number', size:4, warning:'warning', info:'hello info',elmSize:'sm'}
    getFormOptions(model, dispatch){
       
        return {
            viewMode:'form', name:'form1', labelSize:1, labelPos:'left', title:'Form Title',
                 inputs:[    
                    [{field:'ox.age',  required:true, danger:'danger', label:'Adress', type:'text', size:3},
                    {field:'age2', label:'Adress2', success:true, type:'text', size:3}],
                                            
                    {field:'gender', required:true, ignoreLabelSWD:1, warning:'warning', on:{input:val=>console.log(val)}, size:5, type:'select', label:'Gender', data:[{text:'Male', value:1},{text:'Female', value:2}]},
                    {type:'tabs',  activeTab:'Grid', footer:<div>Footer</div>, tabs:{
                        
                        Counter:{ inputs:[
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
                                {type:'button', on:{click:this.loadData}, classNames:'.btn.btn-primary.btn-sm', label:'Load Data'},
                                {
                                    type:'component',
                                    actionType:'grid',
                                    component:Grid,
                                    field:'grid'
                                }
                            ]
                        }
                    }}            
                ]   
        };
    }
    loadData(dispatch){
       
        let data=[];
        for(let i=0;i<5;i++){
            data.push({name:'Abdulla'+i, age:32, address:'Bangladesh'});
        }
        Grid.setData(data);
    //dispatch({type:'setData'});
    }
    view({model, dispatch}){    
        this.model=model;
        return <div>
        <div>
         <button on-click={this.optionChanged.bind(this)}>Hide Name</button>
         
        </div>
            <TestForm model={model} dispatch={dispatch} />
            
        </div>
    }
    update(model, action){   
        switch (action.type) {
            case 'Counter':
                const res=Counter.update(model.counter, action.action);                   
                return {...model, counter:res};              
            case 'CounterList':
                const rescl=CounterList.update(model.counterList, action.action); 
                return {...model, counterList:rescl};  

            case 'Todos':
                const todos=TodosCom.update(model.todos, action.action); 
                return {...model, todos:todos}; 
            case TAB_CLICK:
                console.log(action.payload)
                return model;
            case 'grid':
                const grid=Grid.update(model.grid, action.action);
               
                return {...model, grid:grid};
            default:
               return model;
        }
       
    }
    optionChanged(){
          //this.options.inputs[0][0].hide=true;
          //this.options.inputs[4].tabs.tab1.hide=false;
          //this.options.inputs[4].tabs.tab1.disabled=false;
        //JuForm.optionsChanged();
       TestForm.setSelectData('gender',[{text:'Male--', value:1},{text:'Female--', value:2}]);
       //JuForm.showModal(true);
       console.log(TestForm.getFormData());
       TestForm.setFormData({name:'Abdulla-up',ox:{age:2.2}, gender:1, age2:'hello mamma'})
       console.log(TestForm.getFormData());
    }

}