/** @jsx html */

import {h, html} from 'zaitun';
import {juGrid} from './ui/juGrid';

export default class GridExample{
    constructor(){
        console.log('gridExample constructor');
        this.Grid=new juGrid();
    }
    init(){
        return { gridOptions:this.getGridOptions()}
    }
    onViewInit(model, dispatch){        
        const countries=[
            {text:'Bangladesh', value:1},
            {text:'Pakistan', value:2},
            {text:'Uzbekistan', value:3}
        ];
        this.Grid.setSelectData(4, countries);
    }
    view({model, dispatch}){
        return h('div',[
            h('b', 'Grid Example'),
            this.Grid.view({model:model.gridOptions,dispatch})
        ])
    }
    update(model, action){
        switch (action.type) {
            default:
               return model;
        }
    }
    formClass(){
        return {'form-control':1,'form-control-sm':1 };
    }
    getGridOptions(){
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
            recordChange:(row, col, ri, ev)=>{this.Grid.refresh();},
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
                        <button on-click={()=>this.Grid.addRow({...emptyObj}).refresh()}>Add <i classNames="fa fa-plus"></i></button>&nbsp;
                        <button disabled={this.Grid.data.length===0} on-click={()=>confirm('Remove sure?')&& this.Grid.removeRow(this.selectedRow).pager.clickPage(this.Grid.pager.activePage)}>Remove <i classNames="fa fa-trash"></i></button>
                    </div>
                },
                {props:{colSpan:2}, cellRenderer:d=><b>Total Selected Rows: {d.filter(_=>_.selected).length}</b>},
                {cellRenderer:data=><b>{data.reduce((a,b)=>a+(b.single?1:0),0)}</b>}
            ]
            ] 
        }
    }
}