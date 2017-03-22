var Router =require('./router'),
    snabbdom =require('snabbdom'),
    vnode=null;

function bootstrap(options){ 
        if(!options.containerDom){
            throw new Error('mountNode must be a css selector or a dom object');
        }
        if(typeof options.containerDom ==='string'){
            vnode=document.querySelector(options.containerDom);
        }else{
            vnode=options.containerDom;
        }
        if(!(typeof options.mainComponent==='object' || typeof options.mainComponent==='function')){            
               throw new Error('bootstrap options: mainComponent missing.');
        }
        Router.config(options).attach(ComponentManager).listen().setActivePath(options.activePath);     
} 
var patch = snabbdom.init([
  require('snabbdom/modules/class'),          // makes it easy to toggle classes
  require('snabbdom/modules/props'),          // for setting properties on DOM elements
  require('snabbdom/modules/style'),          // handles styling on elements with support for animations
  require('snabbdom/modules/eventlisteners'), // attaches event listeners
]),
h =require('snabbdom/h');
function emptyCom(){
    return {
        init:function(){return {};}, 
        view:function(obj){return h('div.com-load','loading...');}
    };
}
function ComponentManager(){    
    this.mcom={};
    this.child=emptyCom();
    this.model={};
    this.params=null;
    this.devTool=null;
    this.key='';
    this.cacheObj={};
   
   this.initMainComponent=function(component){        
        if(typeof component ==='object'){
            this.mcom=component;
        }  
        else if(typeof component ==='function'){
            this.mcom=new component();
        }
        this.validateCom(this.mcom);
    }
    this.validateCom=function(com){
         
        if(typeof com.init !=='function'){
            com.init=function(){return {};};            
        }
        if(typeof com.view !=='function'){
            throw new Error('Component must have a view function.');
        }        
    }
    this.initChildComponent=function(component){
            if(typeof component ==='object'){
                this.child=component;
            }
            else if(this.key && this.cacheObj[this.key]){
                this.child=this.getComponentFromCache(this.key).instance;
            }  
            else if(typeof component ==='function'){
                this.child=new component();
            }                    
            this.validateCom(this.child);       
    }
    this.reset=function(){
        this.model=this.mcom.init(this.dispatch, this.params);
        if(typeof this.child.init ==='function'){
             this.model.child=this.child.init(this.dispatch, this.params);
        }       
        this.updateUI();
    }
    this.updateByModel=function(model){
        this.model=model;
        this.updateUI();
    } 
    this.loadCom=function(route, params, url){
        var that=this;   
        route.loadComponent().then(function(com){
            route.component=com.default;
            route.loadComponent=undefined;
			that.runChild(route, params, url);
		});
    }   
    this.runChild=function(route, params, url){           
        if(typeof route.loadComponent ==='function'){
            this.child=emptyCom();
            this.updateUI();         
            this.loadCom(route, params, url);
        }else{
            this.params=params;
            this.key=route.cache?url:'';
            this.initChildComponent(route.component);
            this.model.child=(this.key && this.cacheObj[this.key])?this.getComponentFromCache(this.key).state:this.child.init(this.dispatch, params);        
            this.updateUI();
            if(typeof this.child.onViewInit==='function'){
                this.child.onViewInit(this.model, this.dispatch);
            } 
            if(this.devTool){
                this.devTool.reset();
            }
        }        
    }
    this.run=function(component){        
        this.initMainComponent(component);
        this.model=this.mcom.init(this.dispatch);        
        this.updateUI();
        if(typeof this.mcom.onViewInit==='function'){
                this.mcom.onViewInit(this.model, this.dispatch);
        }            
    }
    this.updateUI=function() {
        var newVnode = this.mcom.view({model:this.model, dispatch:this.dispatch.bind(this)});
        vnode = patch(vnode, newVnode);
    }

    this.dispatch=function(action) {        
        this.model = this.mcom.update(this.model, action); 
        this.updateUI(); 
        if(this.devTool){
            this.devTool.setAction(action, this.model);
        }
    }
    this.fireDestroyEvent=function(){
            if(this.key){
                this.setComponentToCache(this.key, this.child, this.model.child);
            }
            if(typeof this.child.onDestroy==='function'){
                this.child.onDestroy();
            }

    }
    this.destroy=function(path){
        try{
               if(this.child && typeof this.child.canDeactivate==='function'){
                   var res=this.child.canDeactivate();
                   if(typeof res === 'object' && res.then){
                       var that=this;
                       res.then(function(val){
                            if(val){
                                 window.location.href=path;
                                 that.fireDestroyEvent();
                            }
                       });
                   }
                   else if(res){
                        window.location.href=path;
                        this.fireDestroyEvent();
                   }
               }else{
                   window.location.href=path;
                   this.fireDestroyEvent();
               }
              }catch(ex){
                  console.log(ex);
              }
    }
    this.getComponentFromCache=function(key){
        return  this.cacheObj[key]||{};
    }
    this.setComponentToCache=function(key, instance, state){
         this.cacheObj[key]={instance:instance, state:state};
    }
}
module.exports=bootstrap;