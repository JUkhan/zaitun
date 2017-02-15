
const Router =require('./router');
const snabbdom =require('snabbdom');

var vnode=null;

function bootstrap(options){   
    DOMReady(function(){
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
        
    });
} 

function DOMReady(f) {
  if (/(?!.*?compatible|.*?webkit)^mozilla|opera/i.test(navigator.userAgent)){ 
    document.addEventListener("DOMContentLoaded", f, false);
  }  
  else{
    window.setTimeout(f,0);
  }
}

const patch = snabbdom.init([
  require('snabbdom/modules/class'),          // makes it easy to toggle classes
  require('snabbdom/modules/props'),          // for setting properties on DOM elements
  require('snabbdom/modules/style'),          // handles styling on elements with support for animations
  require('snabbdom/modules/eventlisteners'), // attaches event listeners
]);
const h =require('snabbdom/h');

function ComponentManager(){    
    this.mcom={};
    this.child={
        init:function(){return {};}, 
        view:function(obj){return h('div','loading...');}
    };
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
        
        if(typeof this.mcom.init !=='function'){
            throw new Error('Component must have a init function');
        }
        if(typeof this.mcom.view !=='function'){
            throw new Error('Component must have a view function');
        }
        if(typeof this.mcom.update !=='function'){
            throw new Error('Component must have a update function');
        }
    }
    this.initChildComponent=function(component){
        
        if(typeof component ==='object'){
            this.child=component;
        }  
        else if(typeof component ==='function'){
            this.child=new component();
        }
        
        if(typeof this.child.init !=='function'){
            throw new Error('Component must have a init function');
        }
        if(typeof this.child.view !=='function'){
            throw new Error('Component must have a view function');
        }
        if(typeof this.child.update !=='function'){
            throw new Error('Component must have a update function');
        }
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
    this.runChild=function(route, params, url){
        this.params=params;
        this.initChildComponent(route.component);
        this.key=route.cache?url:'';
        this.model.child=this.key && this.cacheObj[this.key]?this.getModelFromCache(this.key):this.child.init(this.dispatch, params);        
        this.updateUI();
        if(this.devTool){
            this.devTool.reset();
        }      
    }
    this.run=function(component){        
        this.initMainComponent(component);
        this.model=this.mcom.init(this.dispatch);        
        this.updateUI();            
    }
    this.updateUI=function() {
        const newVnode = this.mcom.view({model:this.model, dispatch:this.dispatch.bind(this)});
        vnode = patch(vnode, newVnode);
    }

    this.dispatch=function(action) {        
        this.model = this.mcom.update(this.model, action);  
        if(this.devTool){
            this.devTool.setAction(action, this.model);
        }      
        this.updateUI();
    }
    this.fireDestroyEvent=function(){
       
            if(this.key){
                this.setModelToCache(this.key, this.model.child);
            }
            if(typeof this.child.onDestroy==='function'){
                this.child.onDestroy();
            }

    }
    this.destroy=function(path){
        try{
               if(this.child && typeof this.child.canDeactivate==='function'){
                   const res=this.child.canDeactivate();
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
    this.getModelFromCache=function(key){
        return  this.cacheObj[key]||{};
    }
    this.setModelToCache=function(key, value){
         this.cacheObj[key]=value;
    }
}
//export default bootstrap;
module.exports=bootstrap;