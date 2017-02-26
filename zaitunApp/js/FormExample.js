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
    formClass(){
        return {'form-control':1,'form-control-sm':1 };
    }
    gridOptions(){
        return {
            tableClass:'.table-sm.table-bordered', headerClass:'.thead-default',
            footerClass:'.thead-default', 
            hideHeader:!true,
            hideFooter:!true,
            hidePager:!true,
            pagerPos:'both', //top|bottom|both --default both
            singleSelect:true, xmultiSelect:true,
            selectedRows:(rows, ri, ev)=>console.log(rows, ri, ev),
            recordChange:(row, col, ri, ev)=>console.log(row, col, ri, ev),
            on:{click:(row, i, ev)=>{console.log(row, i, ev)}},
            //style:(row, i)=>({color:'gray'}),
            //class:(row, i)=>({hide:1}),          
            columns:[
                {header:'Name', iopts:{class:r=>this.formClass()}, focus:true, field:'name',type:'text'},
                {header:'Age', iopts:{class:r=>this.formClass()}, editPer:row=>!false, field:'age', type:'number', tnsValue:val=>val+' - formated'},
                {header:'Birth Date', iopts:{class:r=>this.formClass()}, field:'address', type:'date'},
                {id:4, header:'Country',iopts:{class:r=>this.formClass()}, field:'country', type:'select'},
                {header:'Single?', field :'single', type:'checkbox', tnsValue:val=>val?'Yes':'No'},
            ],
            footers:[
                //[{text:'footer1',style:col=>({color:'red'})},{text:'footer1',props:{colSpan:4}}],
            [
                {props:{colSpan:4}, cellRenderer:data=><b>Total Rows: {data.length}</b>},
                {cellRenderer:data=><b>{data.reduce((a,b)=>a+(b.single?1:0),0)}</b>}
            ]
            ] 
        }
    }
    nameClick(row, e){
        row.name=e.target.value;
        console.log(row.name, e);
    }
    selectText(elm, start, end){
         elm.focus();
         elm.setSelectionRange(start,end);
    }
    findStartIndex(elm){
        const txt=elm.value;
        if(txt[0]==='m')return 0;
        if(txt[1]==='m')return 1;

        if(txt[3]==='d')return 3;
        if(txt[4]==='d')return 4;

        if(txt[6]==='y')return 6;
        if(txt[7]==='y')return 7;
        if(txt[8]==='y')return 8;
        if(txt[9]==='y')return 9;
        return -1;
    }
    setFormatChar(elm, index){
        var txt=Array.from(elm.value), nextIndex=0;
        if(index==0){txt[index]='m'; nextIndex=-1;}
        else if(index==1){txt[index]='m'; nextIndex=0;}

        else if(index==3){txt[index]='d'; nextIndex=1;}
        else if(index==4){txt[index]='d'; nextIndex=3;}

        else if(index==6){txt[index]='y'; nextIndex=4;}
        else if(index==7){txt[index]='y'; nextIndex=6;}
        else if(index==8){txt[index]='y'; nextIndex=7;}
        else if(index==9){txt[index]='y'; nextIndex=8;}
        elm.value=txt.join('');
        return nextIndex;
    }
    getCaretPosition(elm){
         if (elm.selectionStart || elm.selectionStart == '0') {
		    return  elm.selectionStart;
	    } 
        return 0;
    }
    setCaret(elm){
        var caretPos=this.getCaretPosition(elm);
        var sindex=this.findStartIndex(elm);                          
        if(sindex===-1){            
            if(elm.value[caretPos]==='/'){
                caretPos++;
            }
            sindex=caretPos;
        }
        this.selectText(elm, sindex, sindex+1); 
    }
    setCaretBackword(elm){
        var caretPos=this.getCaretPosition(elm);        
        if(caretPos===9){
            //caretPos=10;
        } 
        else if(caretPos===6 || caretPos===3){
            caretPos--;
        }
        if(caretPos>0)
        this.selectText(elm, caretPos-1, caretPos); 
    }
    leapYear(arr)
    {
        if(arr[6]==='y' || arr[7]==='y'|| arr[8]==='y'||arr[9]==='y'){
            return false;
        }
        const year=parseInt(`${arr[6]}${arr[7]}${arr[8]}${arr[9]}`);        
        return ((year % 4 == 0) && (year % 100 != 0)) || (year % 400 == 0);
    }
    getMaxDays(arr){
        const month=parseInt(`${arr[0]}${arr[1]}`);       
        switch (month) {
            case 1: 
            case 3: 
            case 5:
            case 7:
            case 8:
            case 10:
            case 12:
                return 31;
            case 4:
            case 6:
            case 9:
            case 11:            
                return 30;   
            case 2:
             return this.leapYear(arr)?29:28;               
        }
        return '';
    }
    dateValidate(elm){
        var index=this.getCaretPosition(elm);       
        var txt=Array.from(elm.value);       
        var maxDays=this.getMaxDays(txt).toString();
        
        //month
        if(index===1){  
            if(+txt[0]>1){         
                txt[1]=txt[0];
                txt[0]='0'; 
            } 
            else if(+txt[0]===1 && txt[1] !=='m'){
                if(+txt[1]>2){
                    txt[1]='2';
                }
            } 
                 
        }
        else if(index===2){
            if(txt[0]==='1' && +txt[1]>2){
                txt[1]='2';
            }            
            if(!(txt[3]==='d'||txt[4]==='d')){               
                if(parseInt(`${txt[3]}${txt[4]}`)> +maxDays){
                    maxDays=maxDays.toString();
                    txt[3]=maxDays[0];
                    txt[4]=maxDays[1];
                }
            }
                      
        }
        //days
        else if(index===4){           
            maxDays=maxDays.toString();
            if(+txt[3] > +maxDays[0]){
                txt[4]=txt[3];
                txt[3]='0'; 
            }
            else if(txt[3]===maxDays[0] && txt[4]!=='d'){
                if(+txt[4] > +maxDays[1]){
                    txt[4]=maxDays[1];
                }
            }
        }
        else if(index===5){
             if(txt[3]===maxDays[0] && +txt[4] > +maxDays[1]){
                txt[4]=maxDays[1];
             }
        }
        else if(index>=6){            
            if(+maxDays===28 && !(txt[6]==='y' || txt[7]==='y' || txt[8]==='y' || txt[9]==='y')){
                if(parseInt(`${txt[3]}${txt[4]}`)> +maxDays ){
                    txt[3]='2';
                    txt[4]='8';
                }
            }
        }
        if(elm.value!==txt.join(''))
            elm.value=txt.join('');
    }
    isNumber(n) {
        return !isNaN(parseFloat(n)) && isFinite(n);
    }
    //{field:'age',  label:'Adress', type:'number', size:4, warning:'warning', info:'hello info',elmSize:'sm'}
    getFormOptions(model, dispatch){
       
        return {
            viewMode:'form', name:'form1', labelSize:1, labelPos:'left', title:'Form Title',
                 inputs:[    
                    [{field:'ox.age',  required:true, danger:'danger', label:'Adress', type:'text', size:3},
                    {field:'age2', label:'Adress2', props:{maxLength:10, placeholder:'00/00/0000'},
                    on:{
                        mouseover:e=>{
                            const elm=e.target;
                             if(!elm.value){
                                elm.value='mm/dd/yyyy';
                             }
                        },
                        mouseout:e=>{
                            const elm=e.target;
                            if(!elm.fin || !elm.value){
                                elm.value='';
                            }
                        },
                        click:e=>{
                            const elm=e.target;
                            elm.fin=1; 
                            this.setCaret(elm);            
                        },                        
                        blur:e=>{
                            const elm=e.target;
                            if(elm.value==='mm/dd/yyyy'){
                                elm.fin=0;
                                elm.value='';
                            }                            
                        },
                        keydown:e=>{
                            const elm=e.target;
                            const key=e.keyCode;
                            if(!((key>=48 && key<=57)||key===46||key===37||key===39)){
                                e.preventDefault();
                            }else if(key===39){
                                this.setCaret(elm); 
                            }
                        },
                        keyup:e=>{
                            const elm=e.target;
                            if(e.keyCode===46){
                                elm.value='mm/dd/yyyy';
                            }
                            if(e.keyCode===8){
                                var caretPos=this.getCaretPosition(elm);
                                if(caretPos>9){
                                    caretPos=9;
                                }
                                const nextIndex=this.setFormatChar(elm, caretPos);                                
                                this.selectText(elm, nextIndex, nextIndex+1);
                                return;
                            }
                            if(e.keyCode===37){
                                this.setCaretBackword(elm);
                                return;
                            }
                            this.dateValidate(elm);
                            this.setCaret(elm); 
                            //this.dateValidate(elm);
                        }
                    },
                     success:true, type:'text', size:3}],
                                            
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
                        }
                    }}            
                ]   
        };
    }
    loadData(dispatch){
       
        let data=[];
        for(let i=0;i<500;i++){
            data.push({name:'Abdulla'+i, age:32, 
            address:'2017-02-15', single:i%2?true:false,
            country:Math.floor(Math.random() * 3) + 1 });
        }
        const countries=[
            {text:'Bangladesh', value:1},
            {text:'Pakistan', value:2},
            {text:'Ujbikistan', value:3}
        ];

        Grid
        .setData(data)
        .setSelectData(4, countries)
        .select(0)
        .refresh();
    
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
       TestForm.setFormData({name:'Abdulla-up',ox:{age:2.2}, gender:1, age2:'02/29/2000'})
       console.log(TestForm.getFormData());
    }

}