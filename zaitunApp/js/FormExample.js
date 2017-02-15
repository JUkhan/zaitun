/** @jsx html */

import {h, html} from 'zaitun';

import {juForm, TAB_CLICK} from './ui/juForm/juForm';
import clsCounter from './clsCounter';
import clsCounterList from './clsCounterList';
import Todos from './todos/todos';
import {juGrid} from './ui/juGrid/juGrid';

const JuForm=new juForm();
const Counter=new clsCounter();
const CounterList=new clsCounterList();
const TodosCom=new Todos();
const Grid=new juGrid();

export default class FormExample{
    
    init(dispatch){       
       const model={counter:Counter.init(), name:'Abdulla',age:32, gender:2}
       model.options=this.getFormOptions(model, dispatch);
       model.counterList=CounterList.init();
       model.todos=TodosCom.init();
       model.grid=Grid.init();
       return model;
    }
    //{field:'age',  label:'Adress', type:'number', size:4, warning:'warning', info:'hello info',elmSize:'sm'}
    getFormOptions(model, dispatch){
       
        return {
            viewMode:'form', name:'form1', labelSize:1, labelPos:'left', title:'Form Title',
                 inputs:[    
                    [{field:'age', required:true, danger:'danger', label:'Adress', type:'text', size:3},
                    {field:'age2', label:'Adress2', success:true, type:'text', size:3}],
                                            
                    {field:'gender', required:true, ignoreLabelSWD:1, warning:'warning', on:{change:val=>console.log(val)}, size:5, type:'select', label:'Gender', data:[{text:'Male', value:1},{text:'Female', value:2}]},
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
    
    view({model, dispatch}){    
        this.model=model;
        return <div>
        <div>
         <button on-click={this.optionChanged.bind(this)}>Hide Name</button>
         
        </div>
            <JuForm model={model} dispatch={dispatch} options={model.options}/>
            
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
                return model;
            default:
               return model;
        }
       
    }
    optionChanged(){
          //this.options.inputs[0][0].hide=true;
          //this.options.inputs[4].tabs.tab1.hide=false;
          //this.options.inputs[4].tabs.tab1.disabled=false;
        //JuForm.optionsChanged();
       JuForm.setSelectData('gender',[{text:'Male--', value:1},{text:'Female--', value:2}]);
        JuForm.showModal(true);
    }

}