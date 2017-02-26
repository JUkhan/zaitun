import {h} from 'zaitun';

class juPage{
    constructor(){
        this.groupNumber=1;
        this.activePage=1;
        this.linkList=[];
        this.totalRecords=0;
        this.sspFn=null;
        this.data=null;
        this.pageChange=null;
    }
    init(){
        return {
            pageSize:10,
            linkPages:10
        };
    }
    view({model, dispatch}){
        this.dispatch=dispatch;
        this.model=model;
        this.pageSize=model.pageSize;
        this.linkPages=model.linkPages;
       
        this._calculatePagelinkes();
        if(!this.linkList.length){return '';}
        const nav= h('nav',[           
            h('ul.pagination.pagination-sm',[
                 h('li.page-item',{key:'start',class:{disabled:this._isDisabledPrev()}},[h('a.page-link',{props:{href:'javascript:;'}, on:{click:()=>this._clickStart()}}, 'Start')]),
                 h('li.page-item',{key:'pre', class:{disabled:this._isDisabledPrev()}},[h('a.page-link',{props:{href:'javascript:;'},on:{click:()=>this._clickPrev()}}, '«')]),   
                 ...this.linkList.map((li, index)=>
                    h('li.page-item',{key:index, class:{active:li===this.activePage}},[h('a.page-link',{props:{href:'javascript:;'}, on:{click:()=>this.clickPage(li)}}, li)])
                ),
                h('li.page-item',{key:'next', class:{disabled:this._isDisabledNext()}},[h('a.page-link',{props:{href:'javascript:;'}, on:{click:()=>this._clickNext()}}, '»')]),
                h('li.page-item',{key:'end',class:{disabled:this._isDisabledNext()}},[h('a.page-link',{props:{href:'javascript:;'}, on:{click:()=>this._clickEnd()}}, 'End')]), 
             
            ])
        ]);
        return h('div.row',[
            h('div.col-12.col-md-auto',[
                h('div.page-size',[
                    h('span', 'Page Size'),
                    h('select',{props:{value:this.pageSize}, on:{change:(e)=>this._changePageSize(e.target.value)}},[
                        h('option',{props:{value:5}},'5'),
                        h('option',{props:{value:10}},'10'),
                        h('option',{props:{value:15}},'15'),
                        h('option',{props:{value:20}},'20'),
                        h('option',{props:{value:25}},'25'),
                        h('option',{props:{value:30}},'30'),
                        h('option',{props:{value:50}},'50'),
                        h('option',{props:{value:100}},'100')                       
                    ]),
                    h('span',`Page ${this.activePage} of ${this.totalPage}`)
                ])
            ]),
            h('div.col',[nav])
        ])
    }
    update(model, action){
        return model;
    }
    //public methods
    refresh(){
        this.dispatch({type:'pager'});
    }
    setData(data){
        this.data=data;  
        this.firePageChange();
    }   
    firePageChange()
    {
        if (this.sspFn)
        {
            this.sspFn({ pageSize: this.pageSize, pageNo: this.activePage, searchText: this.searchText, sort: this._sort, filter: this._filter })
                .then(res =>
                {
                    this.totalRecords = res.totalRecords;
                    this.totalPage = this.getTotalPage();
                    this.pageChange(res.data);
                    this._calculatePager();
                    this.refresh();
                });
        } else
        {
            if (!this.data) return;
            let startIndex = (this.activePage - 1) * this.pageSize;
            this.pageChange(this.data.slice(startIndex, startIndex + this.pageSize));
            this._calculatePager();
            this.refresh();
        }
         
    }
    clickPage(index)
    {  
        this.activePage = index;         
        this.firePageChange();
    }
     //end public methods
    _changePageSize(size)
    {
        this.pageSize = +size;
        this.model.pageSize=this.pageSize;
        this.groupNumber = 1;
        this.activePage = 1;
        this.firePageChange()
    }
    _clickStart(){
        if (this.groupNumber > 1)
        {
            this.groupNumber = 1;
            this.activePage = 1;
            this.firePageChange();
        }
    }
    _clickEnd(){
        if (this._hasNext())
        {
            this.groupNumber = parseInt((this.totalPage / this.linkPages).toString()) + ((this.totalPage % this.linkPages) ? 1 : 0);
            this.activePage = this.totalPage;
            this.firePageChange();
        }
    }
    _clickPrev()
    {
        this.groupNumber--;
        if (this.groupNumber <= 0)
        {
            this.groupNumber++;
        } else
        {
            this.firePageChange();
        }

    }
    _clickNext()
    {
        if (this._hasNext())
        {
            this.groupNumber++;
            this.firePageChange();
        }
    }
    _isDisabledPrev()
    {
        if (this.sspFn)
        {
            return !(this.groupNumber > 1);
        }
        if (!this.data)
        {
            return true;
        }
        return !(this.groupNumber > 1);
    }
    _isDisabledNext()
    {
        if (this.sspFn)
        {
            return !this._hasNext();
        }
        if (!this.data)
        {
            return true;
        }
        return !this._hasNext();
    }
    _hasNext()
    {
        if (this.sspFn)
        {
            return this.totalPage > this.groupNumber * this.linkPages;
        }
        if (!this.data) false;
        let len = this.data.length;
        if (len == 0) return false;
        return this.totalPage > this.groupNumber * this.linkPages;
    }
    _calculatePager()
    {
        if (this.enablePowerPage)
        {
            //this.calculateBackwordPowerList();
            //this.calculateForwordPowerList();
        }
        this._calculatePagelinkes();
    }
    _calculatePagelinkes()
    {
        this._setTotalPage();
        let start = 1;
        if (this.groupNumber > 1)
        {
            start = (this.groupNumber - 1) * this.linkPages + 1;
        }
        let end = this.groupNumber * this.linkPages;
        if (end > this.totalPage)
        {
            end = this.totalPage;
        }         
        this.linkList = [];
        for (var index = start; index <= end; index++)
        {
            this.linkList.push(index);
        }
    }
    _setTotalPage()
    {
        this.totalPage=0;
        if (this.sspFn)
        {
            this.totalPage=parseInt((this.totalRecords / this.pageSize).toString()) + ((this.totalRecords % this.pageSize) > 0 ? 1 : 0);
            return;
        }
        if (!this.data) return ;
        const len = this.data.length;
        if (len == 0) return ;
       
        this.totalPage=parseInt((len / this.pageSize).toString()) + ((len % this.pageSize) > 0 ? 1 : 0);
    }
}  
export {juPage}