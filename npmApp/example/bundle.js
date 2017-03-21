(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
"use strict";

var SVGNS = 'http://www.w3.org/2000/svg';
var modulesNS = ['hook', 'on', 'style', 'class', 'props', 'attrs'];
var slice = Array.prototype.slice;

function isPrimitive(val) {
  return  typeof val === 'string'   ||
          typeof val === 'number'   ||
          typeof val === 'boolean'  ||
          typeof val === 'symbol'   ||
          val === null              ||
          val === undefined;
}

function normalizeAttrs(attrs, nsURI, defNS, modules) {
  var map = { ns: nsURI };
  for (var i = 0, len = modules.length; i < len; i++) {
    var mod = modules[i];
    if(attrs[mod])
      map[mod] = attrs[mod];
  }
  for(var key in attrs) {
    if(key !== 'key' && key !== 'classNames' && key !== 'selector') {
      var idx = key.indexOf('-');
      if(idx > 0)
        addAttr(key.slice(0, idx), key.slice(idx+1), attrs[key]);
      else if(!map[key])
        addAttr(defNS, key, attrs[key]);
    }
  }
  return map;

  function addAttr(namespace, key, val) {
    var ns = map[namespace] || (map[namespace] = {});
    ns[key] = val;
  }
}

function buildFromStringTag(nsURI, defNS, modules, tag, attrs, children) {

  if(attrs.selector) {
    tag = tag + attrs.selector;
  }
  if(attrs.classNames) {
    var cns = attrs.classNames;
    tag = tag + '.' + (
      Array.isArray(cns) ? cns.join('.') : cns.replace(/\s+/g, '.')
    );
  }

  return {
    sel       : tag,
    data      : normalizeAttrs(attrs, nsURI, defNS, modules),
    children  : children.map( function(c) {
      return isPrimitive(c) ? {text: c} : c;
    }),
    key: attrs.key
  };
}

function buildFromComponent(nsURI, defNS, modules, tag, attrs, children) {
  var res;
  if(typeof tag === 'function')
    res = tag(attrs, children);
  else if(tag && typeof tag.view === 'function')
    res = tag.view(attrs, children);
  else if(tag && typeof tag.render === 'function')
    res = tag.render(attrs, children);
  else
    throw "JSX tag must be either a string, a function or an object with 'view' or 'render' methods";
  res.key = attrs.key;
  return res;
}

function flatten(nested, start, flat) {
  for (var i = start, len = nested.length; i < len; i++) {
    var item = nested[i];
    if (Array.isArray(item)) {
      flatten(item, 0, flat);
    } else {
      flat.push(item);
    }
  }
}

function maybeFlatten(array) {
  if (array) {
    for (var i = 0, len = array.length; i < len; i++) {
      if (Array.isArray(array[i])) {
        var flat = array.slice(0, i);
        flatten(array, i, flat);
        array = flat;
        break;
      }
    }
  }
  return array;
}

function buildVnode(nsURI, defNS, modules, tag, attrs, children) {
  attrs = attrs || {};
  children = maybeFlatten(children);
  if(typeof tag === 'string') {
    return buildFromStringTag(nsURI, defNS, modules, tag, attrs, children)
  } else {
    return buildFromComponent(nsURI, defNS, modules, tag, attrs, children)
  }
}

function JSX(nsURI, defNS, modules) {
  return function jsxWithCustomNS(tag, attrs, children) {
    if(arguments.length > 3 || !Array.isArray(children))
      children = slice.call(arguments, 2);
    return buildVnode(nsURI, defNS || 'props', modules || modulesNS, tag, attrs, children);
  };
}

module.exports = {
  html: JSX(undefined),
  svg: JSX(SVGNS, 'attrs'),
  JSX: JSX
};

},{}],2:[function(require,module,exports){
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
},{"./router":14,"snabbdom":12,"snabbdom/h":5,"snabbdom/modules/class":8,"snabbdom/modules/eventlisteners":9,"snabbdom/modules/props":10,"snabbdom/modules/style":11}],3:[function(require,module,exports){

const snabbdom = require('snabbdom');
const h = require('snabbdom/h');

const ResetComponent=Symbol('ResetComponent');
const ResetTool=Symbol('ResetTool');
const Action_Regenerate=Symbol('dec');
const LogPayload=Symbol('LogPayload');
const LogState=Symbol('LogState');
const Resize=Symbol('resize');
const SetAction=Symbol('setAction');
const selectAction=Symbol('SelectAction')
class devTool{
    constructor(cm){       
       this.createTools();
       this.CM=null;       
    }    
    createTools(){       
         const elm=document.createElement('DIV');
         elm.setAttribute('class','dev-tool');
         const size=windowSize();
         this.height=size.height;
         elm.style.left=(size.width-250)+'px';
         elm.style.height=(size.height)+'px';         
        const  elm2=document.createElement('DIV');
         elm.appendChild(elm2);
         document.body.appendChild(elm);
         window.addEventListener('resize',()=>{
            const size=windowSize();                  
            elm.style.left=(size.width-250)+'px';
            elm.style.height=(size.height)+'px';
            if(this.toolHandler){
                this.toolHandler({type:Resize, height:size.height});
            }
         }, false);
          window.addEventListener('scroll',(e)=>{                 
            elm.style.top=document.body.scrollTop+'px';              
         }, false);

         render(this.init(), elm2, this);
    }
    reset(){
        this.toolHandler({type:ResetTool});
    }
    setCM(cm){        
        this.CM=cm;
        cm.devTool=this;
    }
    setAction(action, model){     
        this.toolHandler({type:SetAction, payload:{action, model}})
    }
    init(){
        return { height:this.height,  states:[]};
    }
    view({model, handler}){
        this.toolHandler=handler;
         return h('div.tool-body',[
                    h('div.tool-header',[
                        h('button', {on:{click:handler.bind(null, {type:ResetComponent})} },'Reset')
                    ]),
                    h('div.tool-states', {style:({height:(model.height-40)+'px'})},
                        model.states.map((item, index)=>this.DebugStates(item, handler, index))
                    )
         ]);
    }
    DebugStates(item, handler, index){        
        return h('div.tool-view', { key:index, class:({'selected-action':item.selected}), on:{click:handler.bind(null,{type:selectAction, payload:item})}},
           [ h('div',[
                h('button',{on:{click:handler.bind(null,{type:Action_Regenerate, payload:item})}},item.actionType)
                ]),
            h('div.tool-view-buttons',[
                h('button', {on:{click:handler.bind(null,{type:LogPayload, payload:item})}},'Log Action'),
                h('span.tool-space',''),
                h('button', {on:{click:handler.bind(null,{type:LogState, payload:item})}},'Log State')
            ])
            ]
        )
    }
    update(model, action){
        
        switch (action.type) {
            case ResetComponent: 
               this.CM.reset(); 
              return Object.assign({}, model, {states: []});                       
           case ResetTool: return {height:model.height, states:[]};

           case Action_Regenerate:
                this.CM.updateByModel(action.payload.model);
                return model;
           case LogPayload:                
                console.log(action.payload.action);
                return model;
           case LogState:
                console.log(action.payload.model);
                return model;
            case Resize: return Object.assign({}, model,{height:action.height});
            case SetAction:  
                const typeArr=[];
                this.getType(action.payload.action,typeArr);              
                const state=Object.assign({}, action.payload, {actionType:typeArr.filter(action=>action!=='CHILD').join('-')});
                return Object.assign({},model, {states:[...model.states, state]});
            case selectAction:                
                model.states.forEach(ac=>ac.selected=false);
                action.payload.selected=true;
                return model;
            default:
                return model;
        }
    }
    getType(action, typeArr){
        var type=action.type;       
        if(typeof type==='symbol'){
            type=action.type.toString().replace('Symbol(','');
            type=type.substr(0, type.length-1);
        }
        typeArr.push(type);
        for(let prop in action){           
            if(prop.toLowerCase().indexOf('action')>=0){
                this.getType(action[prop], typeArr);return;
            }
        } 
    }
    
}

const patch = snabbdom.init([
  require('snabbdom/modules/class'),         
  require('snabbdom/modules/props'),          
  require('snabbdom/modules/style'),          
  require('snabbdom/modules/eventlisteners'), 
]);
function render(initState, oldVnode, com) {   
        const newVnode = com.view({model:initState, handler:event=>{
            const newState = com.update(initState, event);
            render(newState, newVnode, com);
        }});
        patch(oldVnode, newVnode);
    }
function windowSize(){
    var w = window,
    d = document,
    e = d.documentElement,
    g = d.getElementsByTagName('body')[0],
    width = w.innerWidth || e.clientWidth || g.clientWidth,
    height = w.innerHeight|| e.clientHeight|| g.clientHeight;
    return {width,height};
}

module.exports=devTool;
},{"snabbdom":12,"snabbdom/h":5,"snabbdom/modules/class":8,"snabbdom/modules/eventlisteners":9,"snabbdom/modules/props":10,"snabbdom/modules/style":11}],4:[function(require,module,exports){

const h =require('snabbdom/h');
const jsx =require('snabbdom-jsx');
const bootstrap =require('./core');
const Router =require('./router');

module.exports= {h:h, html:jsx.html, svg:jsx.svg, bootstrap:bootstrap, Router:Router}
},{"./core":2,"./router":14,"snabbdom-jsx":1,"snabbdom/h":5}],5:[function(require,module,exports){
var VNode = require('./vnode');
var is = require('./is');

function addNS(data, children, sel) {
  data.ns = 'http://www.w3.org/2000/svg';

  if (sel !== 'foreignObject' && children !== undefined) {
    for (var i = 0; i < children.length; ++i) {
      addNS(children[i].data, children[i].children, children[i].sel);
    }
  }
}

module.exports = function h(sel, b, c) {
  var data = {}, children, text, i;
  if (c !== undefined) {
    data = b;
    if (is.array(c)) { children = c; }
    else if (is.primitive(c)) { text = c; }
  } else if (b !== undefined) {
    if (is.array(b)) { children = b; }
    else if (is.primitive(b)) { text = b; }
    else { data = b; }
  }
  if (is.array(children)) {
    for (i = 0; i < children.length; ++i) {
      if (is.primitive(children[i])) children[i] = VNode(undefined, undefined, undefined, children[i]);
    }
  }
  if (sel[0] === 's' && sel[1] === 'v' && sel[2] === 'g') {
    addNS(data, children, sel);
  }
  return VNode(sel, data, children, text, undefined);
};

},{"./is":7,"./vnode":13}],6:[function(require,module,exports){
function createElement(tagName){
  return document.createElement(tagName);
}

function createElementNS(namespaceURI, qualifiedName){
  return document.createElementNS(namespaceURI, qualifiedName);
}

function createTextNode(text){
  return document.createTextNode(text);
}


function insertBefore(parentNode, newNode, referenceNode){
  parentNode.insertBefore(newNode, referenceNode);
}


function removeChild(node, child){
  node.removeChild(child);
}

function appendChild(node, child){
  node.appendChild(child);
}

function parentNode(node){
  return node.parentElement;
}

function nextSibling(node){
  return node.nextSibling;
}

function tagName(node){
  return node.tagName;
}

function setTextContent(node, text){
  node.textContent = text;
}

module.exports = {
  createElement: createElement,
  createElementNS: createElementNS,
  createTextNode: createTextNode,
  appendChild: appendChild,
  removeChild: removeChild,
  insertBefore: insertBefore,
  parentNode: parentNode,
  nextSibling: nextSibling,
  tagName: tagName,
  setTextContent: setTextContent
};

},{}],7:[function(require,module,exports){
module.exports = {
  array: Array.isArray,
  primitive: function(s) { return typeof s === 'string' || typeof s === 'number'; },
};

},{}],8:[function(require,module,exports){
function updateClass(oldVnode, vnode) {
  var cur, name, elm = vnode.elm,
      oldClass = oldVnode.data.class,
      klass = vnode.data.class;

  if (!oldClass && !klass) return;
  oldClass = oldClass || {};
  klass = klass || {};

  for (name in oldClass) {
    if (!klass[name]) {
      elm.classList.remove(name);
    }
  }
  for (name in klass) {
    cur = klass[name];
    if (cur !== oldClass[name]) {
      elm.classList[cur ? 'add' : 'remove'](name);
    }
  }
}

module.exports = {create: updateClass, update: updateClass};

},{}],9:[function(require,module,exports){
function invokeHandler(handler, vnode, event) {
  if (typeof handler === "function") {
    // call function handler
    handler.call(vnode, event, vnode);
  } else if (typeof handler === "object") {
    // call handler with arguments
    if (typeof handler[0] === "function") {
      // special case for single argument for performance
      if (handler.length === 2) {
        handler[0].call(vnode, handler[1], event, vnode);
      } else {
        var args = handler.slice(1);
        args.push(event);
        args.push(vnode);
        handler[0].apply(vnode, args);
      }
    } else {
      // call multiple handlers
      for (var i = 0; i < handler.length; i++) {
        invokeHandler(handler[i]);
      }
    }
  }
}

function handleEvent(event, vnode) {
  var name = event.type,
      on = vnode.data.on;

  // call event handler(s) if exists
  if (on && on[name]) {
    invokeHandler(on[name], vnode, event);
  }
}

function createListener() {
  return function handler(event) {
    handleEvent(event, handler.vnode);
  }
}

function updateEventListeners(oldVnode, vnode) {
  var oldOn = oldVnode.data.on,
      oldListener = oldVnode.listener,
      oldElm = oldVnode.elm,
      on = vnode && vnode.data.on,
      elm = vnode && vnode.elm,
      name;

  // optimization for reused immutable handlers
  if (oldOn === on) {
    return;
  }

  // remove existing listeners which no longer used
  if (oldOn && oldListener) {
    // if element changed or deleted we remove all existing listeners unconditionally
    if (!on) {
      for (name in oldOn) {
        // remove listener if element was changed or existing listeners removed
        oldElm.removeEventListener(name, oldListener, false);
      }
    } else {
      for (name in oldOn) {
        // remove listener if existing listener removed
        if (!on[name]) {
          oldElm.removeEventListener(name, oldListener, false);
        }
      }
    }
  }

  // add new listeners which has not already attached
  if (on) {
    // reuse existing listener or create new
    var listener = vnode.listener = oldVnode.listener || createListener();
    // update vnode for listener
    listener.vnode = vnode;

    // if element changed or added we add all needed listeners unconditionally
    if (!oldOn) {
      for (name in on) {
        // add listener if element was changed or new listeners added
        elm.addEventListener(name, listener, false);
      }
    } else {
      for (name in on) {
        // add listener if new listener added
        if (!oldOn[name]) {
          elm.addEventListener(name, listener, false);
        }
      }
    }
  }
}

module.exports = {
  create: updateEventListeners,
  update: updateEventListeners,
  destroy: updateEventListeners
};

},{}],10:[function(require,module,exports){
function updateProps(oldVnode, vnode) {
  var key, cur, old, elm = vnode.elm,
      oldProps = oldVnode.data.props, props = vnode.data.props;

  if (!oldProps && !props) return;
  oldProps = oldProps || {};
  props = props || {};

  for (key in oldProps) {
    if (!props[key]) {
      delete elm[key];
    }
  }
  for (key in props) {
    cur = props[key];
    old = oldProps[key];
    if (old !== cur && (key !== 'value' || elm[key] !== cur)) {
      elm[key] = cur;
    }
  }
}

module.exports = {create: updateProps, update: updateProps};

},{}],11:[function(require,module,exports){
var raf = (typeof window !== 'undefined' && window.requestAnimationFrame) || setTimeout;
var nextFrame = function(fn) { raf(function() { raf(fn); }); };

function setNextFrame(obj, prop, val) {
  nextFrame(function() { obj[prop] = val; });
}

function updateStyle(oldVnode, vnode) {
  var cur, name, elm = vnode.elm,
      oldStyle = oldVnode.data.style,
      style = vnode.data.style;

  if (!oldStyle && !style) return;
  oldStyle = oldStyle || {};
  style = style || {};
  var oldHasDel = 'delayed' in oldStyle;

  for (name in oldStyle) {
    if (!style[name]) {
      elm.style[name] = '';
    }
  }
  for (name in style) {
    cur = style[name];
    if (name === 'delayed') {
      for (name in style.delayed) {
        cur = style.delayed[name];
        if (!oldHasDel || cur !== oldStyle.delayed[name]) {
          setNextFrame(elm.style, name, cur);
        }
      }
    } else if (name !== 'remove' && cur !== oldStyle[name]) {
      elm.style[name] = cur;
    }
  }
}

function applyDestroyStyle(vnode) {
  var style, name, elm = vnode.elm, s = vnode.data.style;
  if (!s || !(style = s.destroy)) return;
  for (name in style) {
    elm.style[name] = style[name];
  }
}

function applyRemoveStyle(vnode, rm) {
  var s = vnode.data.style;
  if (!s || !s.remove) {
    rm();
    return;
  }
  var name, elm = vnode.elm, idx, i = 0, maxDur = 0,
      compStyle, style = s.remove, amount = 0, applied = [];
  for (name in style) {
    applied.push(name);
    elm.style[name] = style[name];
  }
  compStyle = getComputedStyle(elm);
  var props = compStyle['transition-property'].split(', ');
  for (; i < props.length; ++i) {
    if(applied.indexOf(props[i]) !== -1) amount++;
  }
  elm.addEventListener('transitionend', function(ev) {
    if (ev.target === elm) --amount;
    if (amount === 0) rm();
  });
}

module.exports = {create: updateStyle, update: updateStyle, destroy: applyDestroyStyle, remove: applyRemoveStyle};

},{}],12:[function(require,module,exports){
// jshint newcap: false
/* global require, module, document, Node */
'use strict';

var VNode = require('./vnode');
var is = require('./is');
var domApi = require('./htmldomapi');

function isUndef(s) { return s === undefined; }
function isDef(s) { return s !== undefined; }

var emptyNode = VNode('', {}, [], undefined, undefined);

function sameVnode(vnode1, vnode2) {
  return vnode1.key === vnode2.key && vnode1.sel === vnode2.sel;
}

function createKeyToOldIdx(children, beginIdx, endIdx) {
  var i, map = {}, key;
  for (i = beginIdx; i <= endIdx; ++i) {
    key = children[i].key;
    if (isDef(key)) map[key] = i;
  }
  return map;
}

var hooks = ['create', 'update', 'remove', 'destroy', 'pre', 'post'];

function init(modules, api) {
  var i, j, cbs = {};

  if (isUndef(api)) api = domApi;

  for (i = 0; i < hooks.length; ++i) {
    cbs[hooks[i]] = [];
    for (j = 0; j < modules.length; ++j) {
      if (modules[j][hooks[i]] !== undefined) cbs[hooks[i]].push(modules[j][hooks[i]]);
    }
  }

  function emptyNodeAt(elm) {
    var id = elm.id ? '#' + elm.id : '';
    var c = elm.className ? '.' + elm.className.split(' ').join('.') : '';
    return VNode(api.tagName(elm).toLowerCase() + id + c, {}, [], undefined, elm);
  }

  function createRmCb(childElm, listeners) {
    return function() {
      if (--listeners === 0) {
        var parent = api.parentNode(childElm);
        api.removeChild(parent, childElm);
      }
    };
  }

  function createElm(vnode, insertedVnodeQueue) {
    var i, data = vnode.data;
    if (isDef(data)) {
      if (isDef(i = data.hook) && isDef(i = i.init)) {
        i(vnode);
        data = vnode.data;
      }
    }
    var elm, children = vnode.children, sel = vnode.sel;
    if (isDef(sel)) {
      // Parse selector
      var hashIdx = sel.indexOf('#');
      var dotIdx = sel.indexOf('.', hashIdx);
      var hash = hashIdx > 0 ? hashIdx : sel.length;
      var dot = dotIdx > 0 ? dotIdx : sel.length;
      var tag = hashIdx !== -1 || dotIdx !== -1 ? sel.slice(0, Math.min(hash, dot)) : sel;
      elm = vnode.elm = isDef(data) && isDef(i = data.ns) ? api.createElementNS(i, tag)
                                                          : api.createElement(tag);
      if (hash < dot) elm.id = sel.slice(hash + 1, dot);
      if (dotIdx > 0) elm.className = sel.slice(dot + 1).replace(/\./g, ' ');
      if (is.array(children)) {
        for (i = 0; i < children.length; ++i) {
          api.appendChild(elm, createElm(children[i], insertedVnodeQueue));
        }
      } else if (is.primitive(vnode.text)) {
        api.appendChild(elm, api.createTextNode(vnode.text));
      }
      for (i = 0; i < cbs.create.length; ++i) cbs.create[i](emptyNode, vnode);
      i = vnode.data.hook; // Reuse variable
      if (isDef(i)) {
        if (i.create) i.create(emptyNode, vnode);
        if (i.insert) insertedVnodeQueue.push(vnode);
      }
    } else {
      elm = vnode.elm = api.createTextNode(vnode.text);
    }
    return vnode.elm;
  }

  function addVnodes(parentElm, before, vnodes, startIdx, endIdx, insertedVnodeQueue) {
    for (; startIdx <= endIdx; ++startIdx) {
      api.insertBefore(parentElm, createElm(vnodes[startIdx], insertedVnodeQueue), before);
    }
  }

  function invokeDestroyHook(vnode) {
    var i, j, data = vnode.data;
    if (isDef(data)) {
      if (isDef(i = data.hook) && isDef(i = i.destroy)) i(vnode);
      for (i = 0; i < cbs.destroy.length; ++i) cbs.destroy[i](vnode);
      if (isDef(i = vnode.children)) {
        for (j = 0; j < vnode.children.length; ++j) {
          invokeDestroyHook(vnode.children[j]);
        }
      }
    }
  }

  function removeVnodes(parentElm, vnodes, startIdx, endIdx) {
    for (; startIdx <= endIdx; ++startIdx) {
      var i, listeners, rm, ch = vnodes[startIdx];
      if (isDef(ch)) {
        if (isDef(ch.sel)) {
          invokeDestroyHook(ch);
          listeners = cbs.remove.length + 1;
          rm = createRmCb(ch.elm, listeners);
          for (i = 0; i < cbs.remove.length; ++i) cbs.remove[i](ch, rm);
          if (isDef(i = ch.data) && isDef(i = i.hook) && isDef(i = i.remove)) {
            i(ch, rm);
          } else {
            rm();
          }
        } else { // Text node
          api.removeChild(parentElm, ch.elm);
        }
      }
    }
  }

  function updateChildren(parentElm, oldCh, newCh, insertedVnodeQueue) {
    var oldStartIdx = 0, newStartIdx = 0;
    var oldEndIdx = oldCh.length - 1;
    var oldStartVnode = oldCh[0];
    var oldEndVnode = oldCh[oldEndIdx];
    var newEndIdx = newCh.length - 1;
    var newStartVnode = newCh[0];
    var newEndVnode = newCh[newEndIdx];
    var oldKeyToIdx, idxInOld, elmToMove, before;

    while (oldStartIdx <= oldEndIdx && newStartIdx <= newEndIdx) {
      if (isUndef(oldStartVnode)) {
        oldStartVnode = oldCh[++oldStartIdx]; // Vnode has been moved left
      } else if (isUndef(oldEndVnode)) {
        oldEndVnode = oldCh[--oldEndIdx];
      } else if (sameVnode(oldStartVnode, newStartVnode)) {
        patchVnode(oldStartVnode, newStartVnode, insertedVnodeQueue);
        oldStartVnode = oldCh[++oldStartIdx];
        newStartVnode = newCh[++newStartIdx];
      } else if (sameVnode(oldEndVnode, newEndVnode)) {
        patchVnode(oldEndVnode, newEndVnode, insertedVnodeQueue);
        oldEndVnode = oldCh[--oldEndIdx];
        newEndVnode = newCh[--newEndIdx];
      } else if (sameVnode(oldStartVnode, newEndVnode)) { // Vnode moved right
        patchVnode(oldStartVnode, newEndVnode, insertedVnodeQueue);
        api.insertBefore(parentElm, oldStartVnode.elm, api.nextSibling(oldEndVnode.elm));
        oldStartVnode = oldCh[++oldStartIdx];
        newEndVnode = newCh[--newEndIdx];
      } else if (sameVnode(oldEndVnode, newStartVnode)) { // Vnode moved left
        patchVnode(oldEndVnode, newStartVnode, insertedVnodeQueue);
        api.insertBefore(parentElm, oldEndVnode.elm, oldStartVnode.elm);
        oldEndVnode = oldCh[--oldEndIdx];
        newStartVnode = newCh[++newStartIdx];
      } else {
        if (isUndef(oldKeyToIdx)) oldKeyToIdx = createKeyToOldIdx(oldCh, oldStartIdx, oldEndIdx);
        idxInOld = oldKeyToIdx[newStartVnode.key];
        if (isUndef(idxInOld)) { // New element
          api.insertBefore(parentElm, createElm(newStartVnode, insertedVnodeQueue), oldStartVnode.elm);
          newStartVnode = newCh[++newStartIdx];
        } else {
          elmToMove = oldCh[idxInOld];
          patchVnode(elmToMove, newStartVnode, insertedVnodeQueue);
          oldCh[idxInOld] = undefined;
          api.insertBefore(parentElm, elmToMove.elm, oldStartVnode.elm);
          newStartVnode = newCh[++newStartIdx];
        }
      }
    }
    if (oldStartIdx > oldEndIdx) {
      before = isUndef(newCh[newEndIdx+1]) ? null : newCh[newEndIdx+1].elm;
      addVnodes(parentElm, before, newCh, newStartIdx, newEndIdx, insertedVnodeQueue);
    } else if (newStartIdx > newEndIdx) {
      removeVnodes(parentElm, oldCh, oldStartIdx, oldEndIdx);
    }
  }

  function patchVnode(oldVnode, vnode, insertedVnodeQueue) {
    var i, hook;
    if (isDef(i = vnode.data) && isDef(hook = i.hook) && isDef(i = hook.prepatch)) {
      i(oldVnode, vnode);
    }
    var elm = vnode.elm = oldVnode.elm, oldCh = oldVnode.children, ch = vnode.children;
    if (oldVnode === vnode) return;
    if (!sameVnode(oldVnode, vnode)) {
      var parentElm = api.parentNode(oldVnode.elm);
      elm = createElm(vnode, insertedVnodeQueue);
      api.insertBefore(parentElm, elm, oldVnode.elm);
      removeVnodes(parentElm, [oldVnode], 0, 0);
      return;
    }
    if (isDef(vnode.data)) {
      for (i = 0; i < cbs.update.length; ++i) cbs.update[i](oldVnode, vnode);
      i = vnode.data.hook;
      if (isDef(i) && isDef(i = i.update)) i(oldVnode, vnode);
    }
    if (isUndef(vnode.text)) {
      if (isDef(oldCh) && isDef(ch)) {
        if (oldCh !== ch) updateChildren(elm, oldCh, ch, insertedVnodeQueue);
      } else if (isDef(ch)) {
        if (isDef(oldVnode.text)) api.setTextContent(elm, '');
        addVnodes(elm, null, ch, 0, ch.length - 1, insertedVnodeQueue);
      } else if (isDef(oldCh)) {
        removeVnodes(elm, oldCh, 0, oldCh.length - 1);
      } else if (isDef(oldVnode.text)) {
        api.setTextContent(elm, '');
      }
    } else if (oldVnode.text !== vnode.text) {
      api.setTextContent(elm, vnode.text);
    }
    if (isDef(hook) && isDef(i = hook.postpatch)) {
      i(oldVnode, vnode);
    }
  }

  return function(oldVnode, vnode) {
    var i, elm, parent;
    var insertedVnodeQueue = [];
    for (i = 0; i < cbs.pre.length; ++i) cbs.pre[i]();

    if (isUndef(oldVnode.sel)) {
      oldVnode = emptyNodeAt(oldVnode);
    }

    if (sameVnode(oldVnode, vnode)) {
      patchVnode(oldVnode, vnode, insertedVnodeQueue);
    } else {
      elm = oldVnode.elm;
      parent = api.parentNode(elm);

      createElm(vnode, insertedVnodeQueue);

      if (parent !== null) {
        api.insertBefore(parent, vnode.elm, api.nextSibling(elm));
        removeVnodes(parent, [oldVnode], 0, 0);
      }
    }

    for (i = 0; i < insertedVnodeQueue.length; ++i) {
      insertedVnodeQueue[i].data.hook.insert(insertedVnodeQueue[i]);
    }
    for (i = 0; i < cbs.post.length; ++i) cbs.post[i]();
    return vnode;
  };
}

module.exports = {init: init};

},{"./htmldomapi":6,"./is":7,"./vnode":13}],13:[function(require,module,exports){
module.exports = function(sel, data, children, text, elm) {
  var key = data === undefined ? undefined : data.key;
  return {sel: sel, data: data, children: children,
          text: text, elm: elm, key: key};
};

},{}],14:[function(require,module,exports){
var Router = {
    routes: [],
    locationStrategy: 'hash',
    baseUrl: '/',
    CM:null,  
    mainComponent:null,  
    config: function(options) {
        this.locationStrategy =  options.locationStrategy == 'history' && !!(history.pushState) ? 'history' : 'hash';
        this.baseUrl = options.baseUrl ? '/' + this.clearSlashes(options.baseUrl) + '/' : '/';
        this.mainComponent=options.mainComponent;
        this.routes=options.routes||[];
        this.devTool=options.devTool;
        return this;
    },
    getFragment: function() {
        var fragment = '';
        if(this.locationStrategy === 'history') {
            fragment = this.clearSlashes(decodeURI(location.pathname + location.search));
            fragment = fragment.replace(/\?(.*)$/, '');
            fragment = this.baseUrl != '/' ? fragment.replace(this.baseUrl, '') : fragment;
        } else {
            var match = window.location.href.match(/#(.*)$/);
            fragment = match ? match[1] : '';
        }
        return this.clearSlashes(fragment);
    },
    clearSlashes: function(path) {
        return path.toString().replace(/\/$/, '').replace(/^\//, '');
    },
    attach:function(cm){
        this.CM=new cm();
        this.CM.run(this.mainComponent);
        if(this.devTool){           
           new this.devTool().setCM(this.CM);
        }   
        return this;
    },
    add: function(router) {        
        this.routes.push(router);
        return this;
    },
    remove: function(pathName) {
        this.routes=this.routes.filter(function(it){return it.path!==pathName;});
        return this;
    },   
    check: function (hash) {
        var keys, match, routeParams;
        for (var i = 0, max = this.routes.length; i < max; i++ ) {
            if(this.clearSlashes(this.routes[i].path)===hash){
                this.render(this.routes[i], null, hash);
                return this;
            }
            keys = this.routes[i].path.match(/:([^\/]+)/g);
            if(keys){
                routeParams = {}                
                match = hash.match(new RegExp(this.clearSlashes(this.routes[i].path).replace(/:([^\/]+)/g, "([^\/]*)")));
                if (match) {
                    match.shift();
                    match.forEach(function (value, i) {
                        routeParams[keys[i].replace(":", "")] = value;
                    });
                    this.render(this.routes[i], routeParams, hash);                  
                    return this;
                }
            }
        }
        return this;
    },       
    listen: function() {
        var that=this;
        window.addEventListener("hashchange", function(ev){             
             that.check(that.getFragment());
        }, false);

        Array.from(document.querySelectorAll('a')).forEach(function(it){
            it.addEventListener('click',function(ev){
               ev.preventDefault();
               if(that.clearSlashes(ev.target.href)===that.clearSlashes(window.location.href)) {return;}
               if(ev.target.href.indexOf('#') 
                    && window.location.href.indexOf('#')===-1
                    && window.location.href.replace(/#(.*)$/, '') + '#' + that._fap===ev.target.href){return;}
               that.CM.destroy(ev.target.href); 
            },false);
        })
        return this;
    },
    navigate: function(path) {
        path = path ? path : '';
        if(this.locationStrategy === 'history') {
            history.pushState(null, null, this.baseUrl + this.clearSlashes(path));
        } else {
            this.CM.destroy(window.location.href.replace(/#(.*)$/, '') + '#' + path);
        }
        return this;
    },    
    _fap:'',   
    setActivePath:function(path){  
        if(path){ 
            if(!this._fap){this._fap=path[0]==='/'?path:'/'+path;}            
            this.check(this.clearSlashes(this.getFragment()||path));           
        }
    },
    render:function(route, routeParams, url){   
        window.activePath=route.path;
        this.CM.runChild(route, routeParams, url);               
    }
};


//export default Router;
module.exports=Router;
},{}],15:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }(); /** @jsx html */

var _zaitun = require('zaitun');

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var INC = Symbol('inc');
var DEC = Symbol('dec');

var Counter = function () {
    function Counter() {
        _classCallCheck(this, Counter);
    }

    _createClass(Counter, [{
        key: 'init',
        value: function init() {
            return { data: 10 };
        }
    }, {
        key: 'onDestroy',
        value: function onDestroy() {
            console.log('ondestroy');
        }
    }, {
        key: 'canDeactivate',
        value: function canDeactivate() {
            return confirm('leave?');
        }
    }, {
        key: 'view',
        value: function view(_ref) {
            var model = _ref.model,
                dispatch = _ref.dispatch;

            return (0, _zaitun.html)(
                'span',
                null,
                (0, _zaitun.html)(
                    'button',
                    { classNames: 'btn btn-primary btn-sm', 'on-click': [dispatch, { type: INC }] },
                    '+'
                ),
                '\xA0',
                (0, _zaitun.html)(
                    'button',
                    { classNames: 'btn btn-primary btn-sm', 'on-click': [dispatch, { type: DEC }] },
                    '-'
                ),
                (0, _zaitun.html)(
                    'b',
                    null,
                    ' Count : ',
                    model.data
                )
            );
        }
    }, {
        key: 'update',
        value: function update(model, action) {

            switch (action.type) {
                case INC:
                    return { data: model.data + 1 };
                case DEC:
                    return { data: model.data - 1 };
                default:
                    return model;
            }
        }
    }]);

    return Counter;
}();

exports.default = Counter;

},{"zaitun":4}],16:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }(); /** @jsx html */

var _zaitun = require('zaitun');

var _Counter = require('./Counter');

var _Counter2 = _interopRequireDefault(_Counter);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } else { return Array.from(arr); } }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var Counter = new _Counter2.default();

var ADD = Symbol('add');
var REMOVE = Symbol('remove');
var RESET = Symbol('reset');
var UPDATE = Symbol('counterAction');

var CounterList = function () {
    function CounterList() {
        _classCallCheck(this, CounterList);
    }

    _createClass(CounterList, [{
        key: 'init',
        value: function init() {
            return { nextId: 0, counters: [] };
        }
    }, {
        key: 'view',
        value: function view(_ref) {
            var _this = this;

            var model = _ref.model,
                dispatch = _ref.dispatch;

            return (0, _zaitun.html)(
                'div',
                { classNames: 'card card-outline-secondary mb-3 text-center' },
                (0, _zaitun.html)(
                    'div',
                    { classNames: 'card-block' },
                    (0, _zaitun.html)(
                        'button',
                        { classNames: 'btn btn-primary btn-sm', 'on-click': [dispatch, { type: ADD }] },
                        'Add'
                    ),
                    '\xA0',
                    (0, _zaitun.html)(
                        'button',
                        { classNames: 'btn btn-primary btn-sm', 'on-click': [dispatch, { type: RESET }] },
                        'Reset'
                    ),
                    (0, _zaitun.html)('hr', null),
                    (0, _zaitun.html)(
                        'div',
                        null,
                        model.counters.map(function (item) {
                            return (0, _zaitun.html)(_this.CounterItem, { item: item, dispatch: dispatch });
                        })
                    )
                )
            );
        }
    }, {
        key: 'CounterItem',
        value: function CounterItem(_ref2) {
            var item = _ref2.item,
                _dispatch = _ref2.dispatch;

            return (0, _zaitun.html)(
                'div',
                { key: item.id, style: { paddingBottom: '10px' } },
                (0, _zaitun.html)(
                    'button',
                    { classNames: 'btn btn-primary btn-sm', 'on-click': [_dispatch, { type: REMOVE, id: item.id }] },
                    'Remove'
                ),
                '\xA0',
                (0, _zaitun.html)(Counter, { model: item.counter, dispatch: function dispatch(action) {
                        return _dispatch({ type: UPDATE, id: item.id, action: action });
                    } })
            );
        }
    }, {
        key: 'update',
        value: function update(model, action) {
            switch (action.type) {
                case ADD:
                    var newCounter = { id: model.nextId, counter: Counter.init() };
                    return {
                        counters: [].concat(_toConsumableArray(model.counters), [newCounter]),
                        nextId: model.nextId + 1
                    };
                case UPDATE:
                    return {
                        nextId: model.nextId,
                        counters: model.counters.map(function (item) {
                            return item.id !== action.id ? item : _extends({}, item, { counter: Counter.update(item.counter, action.action) });
                        })
                    };
                case RESET:
                    return _extends({}, model, {
                        counters: model.counters.map(function (item) {
                            item.counter = Counter.init();return item;
                        })
                    });
                case REMOVE:
                    return _extends({}, model, { counters: [].concat(_toConsumableArray(model.counters.filter(function (it) {
                            return it.id !== action.id;
                        }))) });
                default:
                    return model;
            }
        }
    }]);

    return CounterList;
}();

exports.default = CounterList;

},{"./Counter":15,"zaitun":4}],17:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }(); /** @jsx html */

var _zaitun = require('zaitun');

var _juForm = require('./ui/juForm');

var _Counter = require('./Counter');

var _Counter2 = _interopRequireDefault(_Counter);

var _CounterList = require('./CounterList');

var _CounterList2 = _interopRequireDefault(_CounterList);

var _todos = require('./todos/todos');

var _todos2 = _interopRequireDefault(_todos);

var _juGrid = require('./ui/juGrid');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var TestForm = new _juForm.juForm();
var TestForm2 = new _juForm.juForm();
var Counter = new _Counter2.default();
var CounterList = new _CounterList2.default();
var TodosCom = new _todos2.default();
var Grid = new _juGrid.juGrid();

var FormExample = function () {
    function FormExample() {
        _classCallCheck(this, FormExample);

        this.selectedRow = {};
    }

    _createClass(FormExample, [{
        key: 'init',
        value: function init(dispatch) {
            var model = {};
            model.data = { name: 'Abdulla', ox: { age: 32 }, gender: 2 };
            model.options = this.getFormOptions(model, dispatch);
            model.counter = Counter.init();
            model.counterList = CounterList.init();
            model.todos = TodosCom.init();
            model.grid = this.gridOptions();
            return { form1: model, form2: { options: this.getFormOptions2(), data: { name: 'Abdulla' } } };
        }
    }, {
        key: 'onViewInit',
        value: function onViewInit(model, dispatch) {
            var countries = [{ text: 'Bangladesh', value: 1 }, { text: 'Pakistan', value: 2 }, { text: 'Uzbekistan', value: 3 }];
            Grid.setSelectData(4, countries);
        }
    }, {
        key: 'formClass',
        value: function formClass() {
            return { 'form-control': 1, 'form-control-sm': 1 };
        }
    }, {
        key: 'gridOptions',
        value: function gridOptions() {
            var _this = this;

            var emptyObj = { name: '', age: 16, address: '', single: false, country: '' };
            return {
                tableClass: '.table-sm.table-bordered.xtable-responsive',
                headerClass: '.thead-default',
                footerClass: '.thead-default',
                pager: { pageSize: 5, linkPages: 10, enablePowerPage: 0, nav: 1, search: 1, pagerInfo: 1, elmSize: 'sm' },
                hideHeader: !true,
                hideFooter: !true,
                hidePager: !true,
                //aes:true, //disallowed empty selection --default false
                pagerPos: 'top', //top|bottom|both --default both
                //pageChange:data=>Grid.selectRow(0),
                singleSelect: true,
                //multiSelect:true,
                selectedRows: function selectedRows(rows, ri, ev) {
                    //this.selectedRow.editable=false;
                    //rows.editable=true;
                    _this.selectedRow = rows;
                },
                aews: true, //apply Editable When Selected - default true 
                recordChange: function recordChange(row, col, ri, ev) {
                    Grid.refresh();
                },
                //on:{click:(row, i, ev)=>{console.log(row, i, ev)}},
                //style:(row, i)=>({color:'gray'}),
                //class:(row, i)=>({hide:1}),          
                columns: [{ header: 'Name', hClass: '.max', sort: true, iopts: { class: function _class(r) {
                            return _this.formClass();
                        } }, focus: true, field: 'name', type: 'text' }, { header: 'Age', sort: true, iopts: { class: function _class(r) {
                            return _this.formClass();
                        } }, editPer: function editPer(row) {
                        return false;
                    }, field: 'age', type: 'number', tnsValue: function tnsValue(val) {
                        return val + ' - formated';
                    } }, { header: 'Birth Date', sort: true, iopts: { class: function _class(r) {
                            return _this.formClass();
                        } }, field: 'address', type: 'date' }, { id: 4, header: 'Country', iopts: { class: function _class(r) {
                            return _this.formClass();
                        } }, field: 'country', type: 'select' }, { header: 'Single?', field: 'single', type: 'checkbox', tnsValue: function tnsValue(val) {
                        return val ? 'Yes' : 'No';
                    } }],
                xheaders: [[{ text: 'Name', props: { colSpan: 3 } }, { text: 'Country', props: { colSpan: 2 } }]],
                footers: [
                //[{text:'footer1',style:col=>({color:'red'})},{text:'footer1',props:{colSpan:4}}],
                [{ cellRenderer: function cellRenderer(data) {
                        return (0, _zaitun.html)(
                            'b',
                            null,
                            'Total Rows: ',
                            data.length
                        );
                    } }, { cellRenderer: function cellRenderer(data) {
                        return (0, _zaitun.html)(
                            'div',
                            null,
                            (0, _zaitun.html)(
                                'button',
                                { 'on-click': function onClick() {
                                        return Grid.addRow(_extends({}, emptyObj)).refresh();
                                    } },
                                'Add ',
                                (0, _zaitun.html)('i', { classNames: 'fa fa-plus' })
                            ),
                            '\xA0',
                            (0, _zaitun.html)(
                                'button',
                                { disabled: Grid.data.length === 0, 'on-click': function onClick() {
                                        return confirm('Remove sure?') && Grid.removeRow(_this.selectedRow).pager.clickPage(Grid.pager.activePage);
                                    } },
                                'Remove ',
                                (0, _zaitun.html)('i', { classNames: 'fa fa-trash' })
                            )
                        );
                    }
                }, { props: { colSpan: 2 }, cellRenderer: function cellRenderer(d) {
                        return (0, _zaitun.html)(
                            'b',
                            null,
                            'Total Selected Rows: ',
                            d.filter(function (_) {
                                return _.selected;
                            }).length
                        );
                    } }, { cellRenderer: function cellRenderer(data) {
                        return (0, _zaitun.html)(
                            'b',
                            null,
                            data.reduce(function (a, b) {
                                return a + (b.single ? 1 : 0);
                            }, 0)
                        );
                    } }]]
            };
        }
    }, {
        key: 'nameClick',
        value: function nameClick(row, e) {
            row.name = e.target.value;
            console.log(row.name, e);
        }
    }, {
        key: 'getFormOptions2',
        value: function getFormOptions2() {
            return {
                viewMode: 'popup', title: 'Popup Title', name: 'pform', size: 'lg',
                modalClose: function modalClose() {
                    return true;
                },
                buttons: [{ label: 'Close', on: { click: function click() {
                            return TestForm2.modalClose();
                        } }, classNames: '.btn.btn-outline-success', elmSize: 'sm' }],
                inputs: [{ type: 'vnode', vnode: (0, _zaitun.html)(
                        'div',
                        null,
                        'Hello popup'
                    ) }, { type: 'text', field: 'name', label: 'Name' }, { type: 'tabs', activeTab: 'tab1', tabs: {
                        tab1: { inputs: [{
                                type: 'text',
                                label: 'Name',
                                field: 'name'
                            }] },
                        tab2: {
                            inputs: [{ type: 'vnode', vnode: (0, _zaitun.html)(
                                    'b',
                                    null,
                                    'tab content'
                                ) }]
                        }
                    } }]
            };
        }
        //{field:'age',  label:'Adress', type:'number', size:4, warning:'warning', info:'hello info',elmSize:'sm'}

    }, {
        key: 'getFormOptions',
        value: function getFormOptions(model, dispatch) {

            return {
                viewMode: 'form', name: 'form1', labelSize: 1, labelPos: 'left', title: 'Form Title',
                inputs: [[{ field: 'ox.age', required: true, danger: 'danger', label: 'Adress', type: 'text', size: 3 }, { field: 'age2', label: 'Adress2', props: { maxLength: 10, placeholder: '00/00/0000' },
                    success: true, type: 'text', size: 3 }], { field: 'gender', required: true, ignoreLabelSWD: 1, warning: 'warning', on: { input: function input(val) {
                            return console.log(val);
                        } }, size: 5, type: 'select', label: 'Gender', data: [{ text: 'Male', value: 1 }, { text: 'Female', value: 2 }] }, {
                    type: 'tabs',
                    activeTab: 'Grid',
                    footer: (0, _zaitun.html)(
                        'div',
                        null,
                        'Footer'
                    ),
                    tabClick: function tabClick(tabName, prevTab) {
                        //return bool|Promise                          
                        return true;
                    },
                    tabs: {
                        Counter: {
                            inputs: [{ type: 'vnode', vnode: (0, _zaitun.html)('div', { style: { height: '20px' } }) }, { size: 3,
                                type: 'component',
                                actionType: 'Counter',
                                component: Counter,
                                field: 'counter'
                            }] },
                        'Counter List': { inputs: [{
                                type: 'component',
                                actionType: 'CounterList',
                                component: CounterList,
                                field: 'counterList'
                            }] },
                        Todos: { inputs: [{
                                type: 'component',
                                actionType: 'Todos',
                                component: TodosCom,
                                field: 'todos'
                            }] },
                        Grid: {
                            inputs: [[{ type: 'button', on: { click: this.loadData }, classNames: '.btn.btn-primary.btn-sm', label: 'Load Data' }, { type: 'button', on: { click: function click() {
                                        Grid.hideColumns([4], true).refresh();
                                    } }, classNames: '.btn.btn-primary.btn-sm', label: 'Hide Country' }], {
                                type: 'component',
                                actionType: 'grid',
                                component: Grid,
                                field: 'grid'
                            }]
                        },
                        'Disabled': {
                            disabled: true,
                            inputs: [{ type: 'vnode', vnode: (0, _zaitun.html)(
                                    'div',
                                    null,
                                    'tab content'
                                ) }]
                        },
                        'I was Hidden': {
                            hide: true,
                            inputs: [{ type: 'vnode', vnode: (0, _zaitun.html)(
                                    'div',
                                    null,
                                    'tab content'
                                ) }]
                        }
                    }
                }]
            };
        }
    }, {
        key: 'loadData',
        value: function loadData(dispatch) {

            var data = [];
            for (var i = 0; i < 7; i++) {
                data.push({ name: 'Abdulla' + i, age: 32,
                    address: '2017-02-15', single: i % 2 ? true : false,
                    country: Math.floor(Math.random() * 3) + 1 });
            }
            Grid.setData(data).selectRow(0).refresh();
        }
    }, {
        key: 'view',
        value: function view(_ref) {
            var model = _ref.model,
                _dispatch = _ref.dispatch;

            this.model = model;
            return (0, _zaitun.html)(
                'div',
                null,
                (0, _zaitun.html)(
                    'div',
                    null,
                    (0, _zaitun.html)(
                        'button',
                        { 'on-click': this.optionChanged.bind(this) },
                        'Change Form State ',
                        (0, _zaitun.html)('i', { classNames: 'fa fa-home' })
                    ),
                    (0, _zaitun.html)(
                        'button',
                        { 'on-click': function onClick() {
                                return TestForm2.showModal(1);
                            } },
                        'Show Popup'
                    )
                ),
                (0, _zaitun.html)(TestForm, { model: model.form1, dispatch: _dispatch }),
                (0, _zaitun.html)(TestForm2, { model: model.form2, dispatch: function dispatch(action) {
                        return _dispatch({ type: 'form2', payload: action });
                    } })
            );
        }
    }, {
        key: 'update',
        value: function update(model, action) {
            switch (action.type) {
                case 'Counter':
                    model.form1.counter = Counter.update(model.form1.counter, action.action);
                    return model;
                case 'CounterList':
                    model.form1.counterList = CounterList.update(model.form1.counterList, action.action);
                    return model;

                case 'Todos':
                    model.form1.todos = TodosCom.update(model.form1.todos, action.action);
                    return model;
                case 'form2':
                    console.log('form-2');
                    //model.form2=TestForm2.update(model.form2, action.payload);
                    return model;
                case 'grid':
                    model.form1.grid = Grid.update(model.form1.grid, action.action);
                    return model;
                default:
                    return model;
            }
        }
    }, {
        key: 'optionChanged',
        value: function optionChanged() {
            //this.options.inputs[0][0].hide=true;
            //this.options.inputs[4].tabs.tab1.hide=false;
            //this.options.inputs[4].tabs.tab1.disabled=false;
            //JuForm.refresh();
            this.model.form1.options.inputs[2].tabs['I was Hidden'].hide = false;
            TestForm.findTab('Disabled')[0].disabled = false;
            TestForm.setSelectData('gender', [{ text: 'Male--', value: 1 }, { text: 'Female--', value: 2 }]);
            //JuForm.showModal(true);
            console.log(TestForm.getFormData());
            TestForm.setFormData({ name: 'Abdulla-up', ox: { age: 2.2 }, gender: 1, age2: '02/29/2000' }).refresh();

            console.log(TestForm.getFormData());
        }
    }]);

    return FormExample;
}();

exports.default = FormExample;

},{"./Counter":15,"./CounterList":16,"./todos/todos":22,"./ui/juForm":23,"./ui/juGrid":24,"zaitun":4}],18:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }(); /** @jsx html */

var _zaitun = require('zaitun');

var _juGrid = require('./ui/juGrid');

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var GridExample = function () {
    function GridExample() {
        _classCallCheck(this, GridExample);

        console.log('gridExample constructor');
        this.Grid = new _juGrid.juGrid();
    }

    _createClass(GridExample, [{
        key: 'init',
        value: function init() {
            return { gridOptions: this.getGridOptions() };
        }
    }, {
        key: 'onViewInit',
        value: function onViewInit(model, dispatch) {
            var countries = [{ text: 'Bangladesh', value: 1 }, { text: 'Pakistan', value: 2 }, { text: 'Uzbekistan', value: 3 }];
            this.Grid.setSelectData(4, countries);
        }
    }, {
        key: 'view',
        value: function view(_ref) {
            var model = _ref.model,
                dispatch = _ref.dispatch;

            return (0, _zaitun.h)('div', [(0, _zaitun.h)('b', 'Grid Example'), this.Grid.view({ model: model.gridOptions, dispatch: dispatch })]);
        }
    }, {
        key: 'update',
        value: function update(model, action) {
            switch (action.type) {
                default:
                    return model;
            }
        }
    }, {
        key: 'formClass',
        value: function formClass() {
            return { 'form-control': 1, 'form-control-sm': 1 };
        }
    }, {
        key: 'getGridOptions',
        value: function getGridOptions() {
            var _this = this;

            var emptyObj = { name: '', age: 16, address: '', single: false, country: '' };
            return {
                tableClass: '.table-sm.table-bordered.xtable-responsive',
                headerClass: '.thead-default',
                footerClass: '.thead-default',
                pager: { pageSize: 5, linkPages: 10, enablePowerPage: 0, nav: 1, search: 1, pagerInfo: 1, elmSize: 'sm' },
                hideHeader: !true,
                hideFooter: !true,
                hidePager: !true,
                //aes:true, //disallowed empty selection --default false
                pagerPos: 'top', //top|bottom|both --default both
                //pageChange:data=>Grid.selectRow(0),
                singleSelect: true,
                //multiSelect:true,
                selectedRows: function selectedRows(rows, ri, ev) {
                    //this.selectedRow.editable=false;
                    //rows.editable=true;
                    _this.selectedRow = rows;
                },
                aews: true, //apply Editable When Selected - default true 
                recordChange: function recordChange(row, col, ri, ev) {
                    _this.Grid.refresh();
                },
                //on:{click:(row, i, ev)=>{console.log(row, i, ev)}},
                //style:(row, i)=>({color:'gray'}),
                //class:(row, i)=>({hide:1}),          
                columns: [{ header: 'Name', hClass: '.max', sort: true, iopts: { class: function _class(r) {
                            return _this.formClass();
                        } }, focus: true, field: 'name', type: 'text' }, { header: 'Age', sort: true, iopts: { class: function _class(r) {
                            return _this.formClass();
                        } }, editPer: function editPer(row) {
                        return false;
                    }, field: 'age', type: 'number', tnsValue: function tnsValue(val) {
                        return val + ' - formated';
                    } }, { header: 'Birth Date', sort: true, iopts: { class: function _class(r) {
                            return _this.formClass();
                        } }, field: 'address', type: 'date' }, { id: 4, header: 'Country', iopts: { class: function _class(r) {
                            return _this.formClass();
                        } }, field: 'country', type: 'select' }, { header: 'Single?', field: 'single', type: 'checkbox', tnsValue: function tnsValue(val) {
                        return val ? 'Yes' : 'No';
                    } }],
                xheaders: [[{ text: 'Name', props: { colSpan: 3 } }, { text: 'Country', props: { colSpan: 2 } }]],
                footers: [
                //[{text:'footer1',style:col=>({color:'red'})},{text:'footer1',props:{colSpan:4}}],
                [{ cellRenderer: function cellRenderer(data) {
                        return (0, _zaitun.html)(
                            'b',
                            null,
                            'Total Rows: ',
                            data.length
                        );
                    } }, { cellRenderer: function cellRenderer(data) {
                        return (0, _zaitun.html)(
                            'div',
                            null,
                            (0, _zaitun.html)(
                                'button',
                                { 'on-click': function onClick() {
                                        return _this.Grid.addRow(_extends({}, emptyObj)).refresh();
                                    } },
                                'Add ',
                                (0, _zaitun.html)('i', { classNames: 'fa fa-plus' })
                            ),
                            '\xA0',
                            (0, _zaitun.html)(
                                'button',
                                { disabled: _this.Grid.data.length === 0, 'on-click': function onClick() {
                                        return confirm('Remove sure?') && _this.Grid.removeRow(_this.selectedRow).pager.clickPage(_this.Grid.pager.activePage);
                                    } },
                                'Remove ',
                                (0, _zaitun.html)('i', { classNames: 'fa fa-trash' })
                            )
                        );
                    }
                }, { props: { colSpan: 2 }, cellRenderer: function cellRenderer(d) {
                        return (0, _zaitun.html)(
                            'b',
                            null,
                            'Total Selected Rows: ',
                            d.filter(function (_) {
                                return _.selected;
                            }).length
                        );
                    } }, { cellRenderer: function cellRenderer(data) {
                        return (0, _zaitun.html)(
                            'b',
                            null,
                            data.reduce(function (a, b) {
                                return a + (b.single ? 1 : 0);
                            }, 0)
                        );
                    } }]]
            };
        }
    }]);

    return GridExample;
}();

exports.default = GridExample;

},{"./ui/juGrid":24,"zaitun":4}],19:[function(require,module,exports){
'use strict';

var _zaitun = require('zaitun');

var _devTool = require('zaitun/devTool/devTool');

var _devTool2 = _interopRequireDefault(_devTool);

var _Counter = require('./Counter');

var _Counter2 = _interopRequireDefault(_Counter);

var _CounterList = require('./CounterList');

var _CounterList2 = _interopRequireDefault(_CounterList);

var _todos = require('./todos/todos');

var _todos2 = _interopRequireDefault(_todos);

var _FormExample = require('./FormExample');

var _FormExample2 = _interopRequireDefault(_FormExample);

var _GridExample = require('./GridExample');

var _GridExample2 = _interopRequireDefault(_GridExample);

var _mainCom = require('./mainCom');

var _mainCom2 = _interopRequireDefault(_mainCom);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var routes = [{ path: "/counter", component: _Counter2.default },
//loadComponent working in webpack(https://github.com/JUkhan/zaitun-starter-kit)
//{path:'/counterList', loadComponent:()=>System.import('./clsCounterList')},
{ path: '/counterList', component: _CounterList2.default }, { path: '/todos', component: _todos2.default }, { path: '/formExample', component: _FormExample2.default }, { path: '/gridExample', component: _GridExample2.default, cache: true }];

(0, _zaitun.bootstrap)({
  containerDom: '#app',
  mainComponent: _mainCom2.default,
  routes: routes,
  activePath: '/counter'
});

},{"./Counter":15,"./CounterList":16,"./FormExample":17,"./GridExample":18,"./mainCom":20,"./todos/todos":22,"zaitun":4,"zaitun/devTool/devTool":3}],20:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; }; /** @jsx html */


var _zaitun = require('zaitun');

var CHILD = Symbol('CHILD');
function init() {
    return { msg: 'mainCom' };
}
function view(_ref) {
    var model = _ref.model,
        _dispatch = _ref.dispatch;


    return (0, _zaitun.html)(
        'div',
        null,
        (0, _zaitun.html)('input', { type: 'input', value: model.msg, 'on-input': function onInput(e) {
                return _dispatch({ type: 'home', msg: e.target.value });
            } }),
        model.msg,
        (0, _zaitun.html)(
            'div',
            null,
            _zaitun.Router.CM.child.view({ model: model.child, dispatch: function dispatch(action) {
                    return _dispatch({ type: CHILD, childAction: action });
                } })
        )
    );
}

function update(model, action) {

    switch (action.type) {
        case 'home':
            return _extends({}, model, { msg: action.msg });
        case CHILD:
            return _extends({}, model, { child: _zaitun.Router.CM.child.update(model.child, action.childAction) });

        default:
            return model;
    }
    return action.type === 'home' ? action.msg : model;
}

exports.default = { init: init, view: view, update: update };

},{"zaitun":4}],21:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.Toggle = exports.Task = undefined;

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }(); /** @jsx html */

var _zaitun = require('zaitun');

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var Toggle = Symbol('Toggle');
var StartEditing = Symbol('StartEditing');
var CommitEditing = Symbol('CommitEditing');
var CancelEditing = Symbol('CancelEditing');

var Task = function () {
    function Task() {
        _classCallCheck(this, Task);
    }

    _createClass(Task, [{
        key: 'init',
        value: function init(id, title) {
            return { id: id, title: title, done: false, editing: false, editingValue: '' };
        }
    }, {
        key: 'onInput',
        value: function onInput(e, dispatch) {
            if (e.keyCode === 13) {
                dispatch({ type: CommitEditing, value: e.target.value });
            }
        }
    }, {
        key: 'view',
        value: function view(_ref) {
            var _this = this;

            var model = _ref.model,
                dispatch = _ref.dispatch,
                onRemove = _ref.onRemove;


            return (0, _zaitun.html)(
                'li',
                {
                    classNames: 'list-group-item',
                    key: model.id
                },
                (0, _zaitun.html)(
                    'div',
                    { selector: '.view', 'style-display': !model.editing ? 'block' : 'none',
                        style: { opacity: '0', transition: 'opacity 1s', delayed: { opacity: '1' } } },
                    (0, _zaitun.html)('input', {
                        selector: '.toggle',
                        type: 'checkbox',
                        checked: !!model.done,
                        'on-click': function onClick(e) {
                            return dispatch({ type: Toggle, checked: e.target.checked });
                        }
                    }),
                    (0, _zaitun.html)(
                        'label',
                        { 'on-dblclick': dispatch.bind(null, { type: StartEditing }), 'style-color': model.done ? 'red' : 'black' },
                        model.title
                    ),
                    (0, _zaitun.html)(
                        'button',
                        { selector: '.btn .btn-link', 'on-click': onRemove },
                        '\xD7'
                    )
                ),
                (0, _zaitun.html)('input', {
                    classNames: 'form-control',
                    'style-display': model.editing ? 'block' : 'none',
                    'on-keydown': function onKeydown(e) {
                        return _this.onInput(e, dispatch);
                    },
                    'on-blur': dispatch.bind(null, { type: CancelEditing }),
                    value: model.title
                })
            );
        }
    }, {
        key: 'update',
        value: function update(model, action) {

            switch (action.type) {
                case Toggle:
                    return _extends({}, model, { done: action.checked });
                case StartEditing:
                    return _extends({}, model, { editing: true, editingValue: model.title });
                case CommitEditing:
                    return _extends({}, model, { title: action.value, editing: false, editingValue: '' });
                case CancelEditing:
                    return _extends({}, model, { editing: false });
                default:
                    return model;
            }
        }
    }]);

    return Task;
}();

exports.Task = Task;
exports.Toggle = Toggle;
//export default Task;

},{"zaitun":4}],22:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }(); /** @jsx html */

var _zaitun = require('zaitun');

var _task = require('./task');

function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } else { return Array.from(arr); } }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var TaskCom = new _task.Task();

var KEY_ENTER = 13;
var MODIFY = Symbol('MODIFY');
var ADD = Symbol('ADD');
var REMOVE = Symbol('REMOVE');
var FILTER = Symbol('FILTER');
var ARCHIVE = Symbol('ARCHIVE');
var TOGGLE_ALL = Symbol('TOGGLE_ALL');

var Todos = function () {
    function Todos() {
        _classCallCheck(this, Todos);
    }

    _createClass(Todos, [{
        key: 'init',
        value: function init(dispatch) {
            return { nextId: 1, tasks: [], filter: 'all', todoInput: '' };
        }
    }, {
        key: 'onInput',
        value: function onInput(e, dispatch) {
            if (e.keyCode === KEY_ENTER) {
                dispatch({ type: ADD, title: e.target.value });
            }
        }
    }, {
        key: 'view',
        value: function view(_ref) {
            var _this = this;

            var model = _ref.model,
                dispatch = _ref.dispatch;

            var remaining = this.remainingTodos(model.tasks);
            var filtered = this.filteredTodos(model.tasks, model.filter);
            return (0, _zaitun.html)(
                'div',
                { classNames: 'card ' },
                (0, _zaitun.html)(
                    'div',
                    { classNames: 'card-header' },
                    'Todos'
                ),
                (0, _zaitun.html)(
                    'div',
                    { classNames: 'card-block' },
                    (0, _zaitun.html)(
                        'div',
                        { classNames: 'form-inline' },
                        (0, _zaitun.html)('input', { 'on-click': function onClick(e) {
                                return dispatch({ type: TOGGLE_ALL, done: e.target.checked });
                            }, classNames: 'fform-check-input', type: 'checkbox' }),
                        (0, _zaitun.html)('input', {
                            'on-keydown': function onKeydown(e) {
                                return _this.onInput(e, dispatch);
                            },
                            classNames: 'form-control',
                            value: model.todoInput,
                            type: 'text', placeholder: 'What needs to be done?' })
                    )
                ),
                (0, _zaitun.html)(
                    'ul',
                    { classNames: 'list-group list-group-flush' },
                    filtered.map(function (task) {
                        return (0, _zaitun.html)(_this.TodoItem, { item: task, dispatch: dispatch });
                    })
                ),
                (0, _zaitun.html)(
                    'div',
                    { classNames: 'card-block', 'style-display': model.tasks.length ? 'block' : 'none' },
                    (0, _zaitun.html)(
                        'span',
                        { classNames: 'todo-count' },
                        (0, _zaitun.html)(
                            'strong',
                            null,
                            remaining
                        ),
                        ' item',
                        remaining === 1 ? '' : 's',
                        ' left'
                    ),
                    (0, _zaitun.html)(
                        'span',
                        { style: { marginLeft: '50px' } },
                        (0, _zaitun.html)(
                            'button',
                            { 'on-click': [dispatch, { type: FILTER, filter: 'all' }], classNames: 'btn btn-link' },
                            'All'
                        ),
                        (0, _zaitun.html)(
                            'button',
                            { 'on-click': [dispatch, { type: FILTER, filter: 'active' }], classNames: 'btn btn-link' },
                            'Active'
                        ),
                        (0, _zaitun.html)(
                            'button',
                            { 'on-click': [dispatch, { type: FILTER, filter: 'completed' }], classNames: 'btn btn-link' },
                            'Completed'
                        ),
                        (0, _zaitun.html)(
                            'button',
                            { 'on-click': dispatch.bind(null, { type: ARCHIVE }), classNames: 'btn btn-link' },
                            'Clear Completed'
                        )
                    )
                ),
                (0, _zaitun.html)(
                    'p',
                    null,
                    'Double-click to edit a todo'
                )
            );
        }
    }, {
        key: 'TodoItem',
        value: function TodoItem(_ref2) {
            var item = _ref2.item,
                _dispatch = _ref2.dispatch;

            return (0, _zaitun.html)(TaskCom, {
                model: item,
                dispatch: function dispatch(action) {
                    return _dispatch({ type: MODIFY, id: item.id, taskAction: action });
                },
                onRemove: _dispatch.bind(null, { type: REMOVE, task: item })
            });
        }
    }, {
        key: 'update',
        value: function update(model, action) {
            switch (action.type) {
                case ADD:
                    return this.addTodo(model, action.title);
                case REMOVE:
                    return this.removeTask(model, action.task);
                case MODIFY:
                    return this.modifyTodo(model, action.id, action.taskAction);
                case FILTER:
                    return _extends({}, model, { filter: action.filter });
                case ARCHIVE:
                    return this.archiveTodos(model);
                case TOGGLE_ALL:
                    return this.toggleAll(model, action.done);

                default:
                    return model;
            }
        }
    }, {
        key: 'filteredTodos',
        value: function filteredTodos(tasks, filter) {
            return filter === 'completed' ? tasks.filter(function (todo) {
                return todo.done;
            }) : filter === 'active' ? tasks.filter(function (todo) {
                return !todo.done;
            }) : tasks;
        }
    }, {
        key: 'addTodo',
        value: function addTodo(model, title) {
            return _extends({}, model, {
                tasks: [].concat(_toConsumableArray(model.tasks), [TaskCom.init(model.nextId, title)]),
                editingTitle: '',
                nextId: model.nextId + 1,
                todoInput: title
            });
        }
    }, {
        key: 'removeTask',
        value: function removeTask(model, task) {
            return _extends({}, model, {
                tasks: model.tasks.filter(function (_) {
                    return _ !== task;
                })
            });
        }
    }, {
        key: 'modifyTodo',
        value: function modifyTodo(model, id, action) {
            return _extends({}, model, {
                tasks: model.tasks.map(function (taskModel) {
                    return taskModel.id !== id ? taskModel : TaskCom.update(taskModel, action);
                })
            });
        }
    }, {
        key: 'remainingTodos',
        value: function remainingTodos(tasks) {
            return tasks.reduce(function (acc, task) {
                return !task.done ? acc + 1 : acc;
            }, 0);
        }
    }, {
        key: 'archiveTodos',
        value: function archiveTodos(model) {
            return _extends({}, model, {
                tasks: model.tasks.filter(function (taskModel) {
                    return !taskModel.done;
                })
            });
        }
    }, {
        key: 'toggleAll',
        value: function toggleAll(model, done) {
            return _extends({}, model, {
                tasks: model.tasks.map(function (taskModel) {
                    return TaskCom.update(taskModel, { type: _task.Toggle, checked: done });
                })
            });
        }
    }]);

    return Todos;
}();

exports.default = Todos;

},{"./task":21,"zaitun":4}],23:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.TAB_CLICK = exports.juForm = undefined;

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _zaitun = require('zaitun');

var _utils = require('./utils');

function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } else { return Array.from(arr); } }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var TAB_CLICK = Symbol('TAB_CLICK');
var OPTIONS_CHANGED = Symbol('OPTIONS_CHANGED');

var juForm = function () {
    function juForm() {
        _classCallCheck(this, juForm);

        this.dispatch = undefined;
        this.options = undefined;
        this.modalId = (0, _utils.guid)();
    }

    _createClass(juForm, [{
        key: 'init',
        value: function init() {
            return {};
        }
    }, {
        key: 'view',
        value: function view(_ref) {
            var model = _ref.model,
                dispatch = _ref.dispatch;

            this.dispatch = dispatch;
            this.options = model.options;
            this.model = model;
            if (!model.data) {
                model.data = {};
            }
            if (!this.options) {
                return (0, _zaitun.h)('div', 'juForm options is not defined');
            }
            var vnodes = (0, _zaitun.h)('div.juForm', this.createElements(this.options));
            return this.options.viewMode === 'form' ? vnodes : this.createModal(vnodes, this.modalId);
        }
    }, {
        key: 'update',
        value: function update(model, action) {
            return model;
        }
    }, {
        key: 'createElements',
        value: function createElements(options) {
            var _this = this;

            var vnodes = [];
            if (options.inputs) {
                options.inputs.forEach(function (item, index) {
                    _this.transformElement(item, index, vnodes);
                });
            }
            return vnodes;
        }
    }, {
        key: 'modalClose',
        value: function modalClose() {
            if (typeof this.options.modalClose === 'function') {
                this.options.modalClose() && this.showModal(false);
            } else {
                this.showModal(false);
            }
        }
    }, {
        key: 'createModal',
        value: function createModal(vnodes, id) {
            var _this2 = this;

            var buttons = this.options.buttons || [];
            return (0, _zaitun.h)('div.modal', { props: { id: id } }, [(0, _zaitun.h)('div.modal-dialog.modal-' + this.options.size, { role: 'document' }, [(0, _zaitun.h)('div.modal-content', [(0, _zaitun.h)('div.modal-header', [(0, _zaitun.h)('div.modal-title', this.options.title || ''), (0, _zaitun.h)('button.close', { data: { dismiss: 'modal' }, aria: { label: 'Close' }, on: { click: function click(e) {
                        return _this2.modalClose();
                    } } }, [(0, _zaitun.h)('span', { aria: { hidden: 'true' } }, '×')])]), (0, _zaitun.h)('div.modal-body', [vnodes]), (0, _zaitun.h)('div.modal-footer', buttons.map(this.createButtonElm.bind(this)))])])]);
        }
    }, {
        key: 'transformElement',
        value: function transformElement(item, index, vnodes) {
            var _this3 = this;

            if (Array.isArray(item)) {
                var _ret = function () {
                    var velms = [];
                    item.forEach(function (elm, index) {
                        switch (elm.type) {
                            case 'fieldset':
                                velms.push(_this3.createFieldSet(elm));
                                break;
                            case 'tabs':
                                velms.push((0, _zaitun.h)('div.col-md-' + (item.size || 6), _this3.createTabs(elm)));
                                break;
                            case 'button':
                                velms.push(_this3.createButton(elm, index));
                                break;
                            case 'checkbox':case 'radio':
                                velms.push(_this3.createCheckbox(elm, index));
                                break;
                            case 'label':
                                velms.push(_this3.createLabel(elm, index));
                                break;
                            case 'component':
                                velms.push((0, _zaitun.h)('div.col-md-' + (elm.size || 6), [elm.component.view({
                                    model: elm.field ? _this3.model[elm.field] : _this3.model,
                                    dispatch: function dispatch(a) {
                                        return _this3.dispatch({ type: elm.actionType, action: a });
                                    }
                                })]));
                                break;
                            case 'vnode':
                                vnodes.push((0, _zaitun.h)('div.col-md-' + (elm.size || 6), [elm.vnode]));
                                break;
                            default:
                                velms.push.apply(velms, _toConsumableArray(_this3.createElement(elm, index)));
                                break;
                        }
                    });
                    vnodes.push((0, _zaitun.h)('div.form-group.row', velms));
                    return {
                        v: void 0
                    };
                }();

                if ((typeof _ret === 'undefined' ? 'undefined' : _typeof(_ret)) === "object") return _ret.v;
            }
            switch (item.type) {
                case 'fieldset':
                    vnodes.push(this.createFieldSet(item));
                    break;
                case 'tabs':
                    vnodes.push.apply(vnodes, _toConsumableArray(this.createTabs(item)));
                    break;
                case 'button':
                    vnodes.push((0, _zaitun.h)('div.form-group.row', [this.createButton(item, index)]));
                    break;
                case 'checkbox':case 'radio':
                    vnodes.push((0, _zaitun.h)('div.form-group.row', [this.createCheckbox(item, index)]));
                    break;
                case 'label':
                    vnodes.push((0, _zaitun.h)('div.form-group.row', [this.createLabel(item, index)]));
                    break;
                case 'vnode':
                    vnodes.push(item.vnode);
                    break;
                case 'component':
                    vnodes.push(item.component.view({
                        model: item.field ? this.model[item.field] : this.model,
                        dispatch: function dispatch(a) {
                            return _this3.dispatch({ type: item.actionType, action: a });
                        }
                    }));

                    break;
                default:
                    var state = this.swdState(item);
                    vnodes.push((0, _zaitun.h)('div.form-group.row' + (item.ignoreLabelSWD ? '' : state[0]), this.createElement(item, index)));
                    break;
            }
        }
    }, {
        key: 'swdState',
        value: function swdState(item) {
            return item.success ? ['.has-success', '.form-control-success', item.success] : item.warning ? ['.has-warning', '.form-control-warning', item.warning] : item.danger ? ['.has-danger', '.form-control-danger', item.danger] : ['', '', ''];
        }
    }, {
        key: 'createFieldSet',
        value: function createFieldSet(item) {
            if (item.hide) {
                return (0, _zaitun.h)('span', { style: { display: 'none' } }, 'hide');
            }
            var velms = [];
            if (item.legend) {
                velms.push((0, _zaitun.h)('legend', item.legend));
            }
            velms.push.apply(velms, _toConsumableArray(this.createElements(item)));
            return (0, _zaitun.h)('fieldset.col-md-' + (item.size || 12), { props: { disabled: !!item.disabled } }, velms);
        }
    }, {
        key: 'createTabs',
        value: function createTabs(item) {
            var _this4 = this;

            var elms = [],
                lies = [],
                tabcontents = [],
                tabNames = Object.keys(item.tabs);
            item.tabLink = item.activeTab;
            tabNames.forEach(function (tabName) {
                var tabId = '#' + tabName.replace(/\s+/, '_###_'),
                    disabled = !!item.tabs[tabName].disabled,
                    hide = !!item.tabs[tabName].hide;
                if (!hide) {
                    lies.push((0, _zaitun.h)('li.nav-item', [(0, _zaitun.h)('a.nav-link', {
                        props: { href: tabId },
                        class: { active: item.activeTab === tabName, disabled: disabled },
                        on: { click: function click(e) {
                                e.preventDefault();
                                if (disabled) {
                                    return;
                                }
                                if (item.tabLink === tabName) {
                                    return;
                                }
                                _this4.selectTab(tabName, item);
                            }
                        }
                    }, tabName)]));
                    //tab contents 
                    if (tabName === item.tabLink) {
                        tabcontents.push((0, _zaitun.h)('div.tab-item', _this4.createElements(item.tabs[tabName])));
                    }
                }
            });
            elms.push((0, _zaitun.h)('div.card', [(0, _zaitun.h)('div.card-header', [(0, _zaitun.h)('ul.nav nav-tabs card-header-tabs pull-xs-left', lies)]), (0, _zaitun.h)('div.card-block', tabcontents), item.footer ? (0, _zaitun.h)('div.card-footer', [item.footer]) : '']));
            return elms;
        }
    }, {
        key: 'getListener',
        value: function getListener(item) {
            var _this5 = this;

            var events = {},
                hasChange = null,
                modelUpdateEvent = 'input';
            if (_typeof(item.on) === 'object') {
                var _loop = function _loop(eventName) {
                    if (eventName === modelUpdateEvent) {
                        hasChange = item.on[modelUpdateEvent];
                    } else {
                        events[eventName] = function (e) {
                            return item.on[eventName](e);
                        };
                    }
                };

                for (var eventName in item.on) {
                    _loop(eventName);
                }
            }
            events[modelUpdateEvent] = function (e) {
                _this5.setValueToData(item, e.target.value);
                if (hasChange) {
                    hasChange(e.target.value, e);
                }
                _this5.refresh();
            };
            return events;
        }
    }, {
        key: 'createLabel',
        value: function createLabel(item, index) {
            if (item.hide) return [];
            return (0, _zaitun.h)('div.col-md-' + (item.size || 4), [(0, _zaitun.h)('label', { on: item.on, style: item.style, class: item.class, props: { type: item.type, disabled: !!item.disabled } }, item.label)]);
        }
    }, {
        key: 'createButton',
        value: function createButton(item, index) {
            var _this6 = this;

            if (item.hide) return [];
            var buttons = [];
            if (item.inline) {
                item.inline.forEach(function (el, index) {
                    return buttons.push(_this6.createButtonElm(el, index));
                });
            } else {
                buttons.push(this.createButtonElm(item));
            }
            return (0, _zaitun.h)('div.col-md-' + (item.size || 4), buttons);
        }
    }, {
        key: 'createButtonElm',
        value: function createButtonElm(item) {
            var index = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 0;

            return (0, _zaitun.h)('button' + (item.classNames || '') + (item.elmSize ? '.btn-' + item.elmSize : ''), { key: index, on: this.getListener(item), style: item.style, class: item.class, props: _extends({}, this._bindProps(item), { type: item.type, disabled: !!item.disabled }) }, item.label);
        }
    }, {
        key: 'createCheckbox',
        value: function createCheckbox(item, index, inline) {
            var _this7 = this;

            if (item.hide) return [];
            var buttons = [];
            if (item.inline) {
                item.inline.forEach(function (el) {
                    el.type = item.type;buttons.push(_this7.createCheckboxElm(el, index, true));
                });
            } else {
                buttons.push(this.createCheckboxElm(item, index, false));
            }
            return (0, _zaitun.h)('div.col-md-' + (item.size || 4), buttons);
        }
    }, {
        key: 'createCheckboxElm',
        value: function createCheckboxElm(item, index, inline) {
            var elms = [];
            if (item.labelPos === 'left') {
                elms.push((0, _zaitun.h)('text', item.label));
                elms.push((0, _zaitun.h)('input.form-check-input', { on: this.getListener(item), style: item.style, class: item.class, props: _extends({}, this._bindProps(item), { type: item.type, disabled: item.disabled, name: item.name || 'oo7', value: item.value }) }));
            } else {
                elms.push((0, _zaitun.h)('input.form-check-input', { on: this.getListener(item), style: item.style, class: item.class, props: _extends({}, this._bindProps(item), { type: item.type, disabled: item.disabled, name: item.name || 'oo7', value: item.value }) }));
                elms.push((0, _zaitun.h)('text', item.label));
            }
            return (0, _zaitun.h)('div.form-check', { class: { 'form-check-inline': inline, disabled: item.disabled } }, [(0, _zaitun.h)('label.form-check-label', elms)]);
        }
    }, {
        key: '_getLabelText',
        value: function _getLabelText(item) {
            var labelItems = [item.label];
            if (item.required) {
                labelItems.push((0, _zaitun.h)('span.required', '*'));
            }
            return labelItems;
        }
    }, {
        key: 'getValueFromData',
        value: function getValueFromData(item) {
            var _this8 = this;

            var props = item.field.split('.');
            if (props.length > 1) {
                var _ret3 = function () {
                    var obj = _this8.model.data;
                    props.forEach(function (prop) {
                        return obj = obj[prop];
                    });
                    return {
                        v: obj
                    };
                }();

                if ((typeof _ret3 === 'undefined' ? 'undefined' : _typeof(_ret3)) === "object") return _ret3.v;
            }
            return this.model.data[item.field];
        }
    }, {
        key: 'setValueToData',
        value: function setValueToData(item, val) {
            var props = item.field.split('.');
            if (props.length > 1) {
                var obj = this.model.data;
                var len = props.length - 1;
                for (var index = 0; index < len; index++) {
                    obj = obj[props[index]];
                }
                obj[props[index]] = val;
            } else {
                this.model.data[item.field] = val;
            }
        }
    }, {
        key: '_bindProps',
        value: function _bindProps(item) {
            return _typeof(item.props) === 'object' ? item.props : {};
        }
    }, {
        key: 'createElement',
        value: function createElement(item, index) {
            if (item.hide) return [];
            var children = [];
            var state = this.swdState(item);
            var labelPos = this.options.labelPos || item.labelPos || 'left';
            var childrenWithLabel = [];

            //this.setListener(item);
            if (labelPos === 'top' && item.label) {
                children.push((0, _zaitun.h)('label.col-form-label' + (item.elmSize ? '.col-form-label-' + item.elmSize : ''), this._getLabelText(item)));
            }
            if (item.type === 'select') {
                children.push(this.createSelect(item, state));
            } else {
                children.push((0, _zaitun.h)('input.form-control' + state[1] + (item.elmSize ? '.form-control-' + item.elmSize : ''), { on: this.getListener(item), style: item.style, class: item.class, props: _extends({}, this._bindProps(item), { type: item.type, value: this.getValueFromData(item), disabled: !!item.disabled }) }));
            }
            if (state[2]) {
                children.push((0, _zaitun.h)('div.form-control-feedback', state[2]));
            }
            if (item.info) {
                children.push((0, _zaitun.h)('small.form-text.text-muted', item.info));
            }
            if (labelPos === 'left' && item.label) {
                var labelSize = item.labelSize || this.options.labelSize || 2;
                childrenWithLabel.push((0, _zaitun.h)('label.col-form-label' + (item.elmSize ? '.col-form-label-' + item.elmSize : '') + ('.col-md-' + labelSize), this._getLabelText(item)));
            }
            childrenWithLabel.push((0, _zaitun.h)('div.col-md-' + (item.size || 4) + state[0], children));
            return childrenWithLabel;
        }
    }, {
        key: 'createSelect',
        value: function createSelect(item, state) {
            var _this9 = this;

            if (!item.data) item.data = [];
            return (0, _zaitun.h)('select.form-control' + state[1] + (item.elmSize ? '.form-control-' + item.elmSize : ''), { on: this.getListener(item), style: item.style, class: item.class, props: _extends({}, this._bindProps(item), { type: item.type, value: this.getValueFromData(item), disabled: !!item.disabled, multiple: !!item.multiple }) }, item.data.map(function (it, index) {
                return (0, _zaitun.h)('option', { props: _extends({}, _this9._bindProps(item), { value: it.value, key: index }) }, it.text);
            }));
        }
    }, {
        key: '_findTab',
        value: function _findTab(items, tabName) {
            var _iteratorNormalCompletion = true;
            var _didIteratorError = false;
            var _iteratorError = undefined;

            try {
                for (var _iterator = items[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
                    var item = _step.value;

                    if (Array.isArray(item)) {
                        var res = this._findTab(item, tabName);
                        if (res) {
                            return res;
                        }
                    } else if (item.type === 'tabs' && _typeof(item.tabs) === 'object') {
                        var find = item.tabs[tabName];
                        if (find) {
                            return [find, item];
                        }
                    }
                }
            } catch (err) {
                _didIteratorError = true;
                _iteratorError = err;
            } finally {
                try {
                    if (!_iteratorNormalCompletion && _iterator.return) {
                        _iterator.return();
                    }
                } finally {
                    if (_didIteratorError) {
                        throw _iteratorError;
                    }
                }
            }

            return null;
        }
    }, {
        key: '_findField',
        value: function _findField(items, fieldName) {
            var _iteratorNormalCompletion2 = true;
            var _didIteratorError2 = false;
            var _iteratorError2 = undefined;

            try {
                for (var _iterator2 = items[Symbol.iterator](), _step2; !(_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done); _iteratorNormalCompletion2 = true) {
                    var item = _step2.value;

                    if (Array.isArray(item)) {
                        var res = this._findTab(item, fieldName);
                        if (res) {
                            return res;
                        }
                    } else if (item.field === fieldName) {
                        return item;
                    }
                }
            } catch (err) {
                _didIteratorError2 = true;
                _iteratorError2 = err;
            } finally {
                try {
                    if (!_iteratorNormalCompletion2 && _iterator2.return) {
                        _iterator2.return();
                    }
                } finally {
                    if (_didIteratorError2) {
                        throw _iteratorError2;
                    }
                }
            }

            return null;
        }
    }, {
        key: 'findTab',
        value: function findTab(tabName) {
            if (this.options.inputs) {
                return this._findTab(this.options.inputs, tabName);
            }
            return null;
        }
    }, {
        key: 'findField',
        value: function findField(fiendName) {
            if (this.options.inputs) {
                return this._findField(this.options.inputs, fiendName);
            }
            return null;
        }
    }, {
        key: 'selectTab',
        value: function selectTab(tabName) {
            var _this10 = this;

            var item = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : null;

            if (!item) {
                item = this.findTab(tabName);
                if (item) {
                    item = item[1];
                }
            }
            if (item) {
                var res = typeof item.tabClick === 'function' ? item.tabClick(tabName, item.activeTab) : true;
                if (typeof res === 'boolean') {
                    if (res) {
                        item.activeTab = tabName;
                        item.tabLink = tabName;
                        this.dispatch({ type: TAB_CLICK, payload: { tabName: tabName, formName: this.options.name || 'form007' } });
                    }
                } else if ((typeof res === 'undefined' ? 'undefined' : _typeof(res)) === 'object' && res.then) {
                    res.then(function (isTrue) {
                        if (isTrue) {
                            item.activeTab = tabName;
                            item.tabLink = tabName;
                            _this10.dispatch({ type: TAB_CLICK, payload: { tabName: tabName, formName: _this10.options.name || 'form007' } });
                        }
                    });
                }
            }
            return this;
        }
    }, {
        key: 'refresh',
        value: function refresh() {
            this.dispatch({ type: OPTIONS_CHANGED });
        }
    }, {
        key: 'showModal',
        value: function showModal(isOpen) {
            if (isOpen) $('#' + this.modalId).modal({ backdrop: false, show: true });else $('#' + this.modalId).modal('hide');
        }
    }, {
        key: 'setSelectData',
        value: function setSelectData(fieldName, data) {
            var item = this.findField(fieldName);
            if (item) {
                item.data = data;
            }
            return this;
        }
    }, {
        key: 'setFormData',
        value: function setFormData(data) {
            this.model.data = data;
            return this;
        }
    }, {
        key: 'getFormData',
        value: function getFormData() {
            return this.model.data;
        }
    }]);

    return juForm;
}();

exports.juForm = juForm;
exports.TAB_CLICK = TAB_CLICK;

},{"./utils":26,"zaitun":4}],24:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.juGrid = undefined;

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _zaitun = require('zaitun');

var _juPager = require('./juPager');

function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } else { return Array.from(arr); } }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var DATA_CHANGE = Symbol('SET_DATA');
var PAGER_ACTION = Symbol('pager_action');
var REFRESH = Symbol('REFRESH');

var juGrid = function () {
    function juGrid() {
        _classCallCheck(this, juGrid);

        this.selectedRows = [];
        this.selectedRow = {};

        this.data = [];
        this.pager = new _juPager.juPage();
    }

    _createClass(juGrid, [{
        key: 'init',
        value: function init() {
            return {};
        }
    }, {
        key: 'view',
        value: function view(_ref) {
            var model = _ref.model,
                dispatch = _ref.dispatch;

            this.dispatch = dispatch;
            this.model = model;
            if (this._isUndef(model.columns)) {
                return (0, _zaitun.h)('div', 'columns undefined');
            }
            if (this._isUndef(model.aews)) {
                model.aews = true;
            }
            this._initPaager(model);
            var table = (0, _zaitun.h)('table.table' + (this.model.tableClass || ''), [this._header(model), this._body(model), this._footer(model)]);
            return (0, _zaitun.h)('div.juGrid', [this._getPager(model.pager, dispatch, 'top'), table, this._getPager(model.pager, dispatch, 'bottom')]);
        }
    }, {
        key: 'update',
        value: function update(model, action) {
            switch (action.type) {
                case PAGER_ACTION:
                    model.pager = this.pager.update(model.pager, action.payload);
                    return model;

                default:
                    return model;
            }
        }
    }, {
        key: '_initPaager',
        value: function _initPaager(model) {
            var _this = this;

            if (this._isUndef(model.pager)) {
                model.pager = this.pager.init();
            }
            this.pager.pageChange = this._pageChange.bind(this);
            if (this._isUndef(model.pagerPos)) {
                model.pagerPos = 'both';
            }
            if (this._isUndef(model.pager.nav)) {
                model.pager.nav = true;
            }
            if (this._isUndef(model.pager.searchFn)) {
                model.pager.searchFn = function (data, val) {
                    var res = [],
                        columns = _this.model.columns,
                        len = columns.length;
                    data.forEach(function (item) {
                        for (var index = 0; index < len; index++) {
                            var col = columns[index];
                            if (col.field && item[col.field] && item[col.field].toString().toLowerCase().indexOf(val) !== -1) {
                                res.push(item);break;
                            }
                        }
                    });
                    return res;
                };
            }
        }
    }, {
        key: '_pageChange',
        value: function _pageChange(data) {
            this.data = data;
            if (this.pager.diffPageAction) {
                this.selectedRows = [];
            }
            if (typeof this.model.pageChange === 'function') {
                this.model.pageChange(data);
            }
        }
    }, {
        key: '_getPager',
        value: function _getPager(pagerModel, _dispatch, pos) {
            if (this.model.hidePager) {
                return '';
            }
            if (pos === 'top' && (this.model.pagerPos === 'both' || this.model.pagerPos === 'top') || pos === 'bottom' && (this.model.pagerPos === 'both' || this.model.pagerPos === 'bottom')) {
                return (0, _zaitun.h)('div.juPager', [this.pager.view({ model: pagerModel, dispatch: function dispatch(action) {
                        return _dispatch({ type: PAGER_ACTION, payload: action });
                    } })]);
            }
            return '';
        }
    }, {
        key: '_sort',
        value: function _sort(col) {
            if (!col.sort) return;
            col.reverse = !(col.reverse === undefined ? true : col.reverse);
            this.model.columns.forEach(function (_) {
                if (_ !== col) {
                    _.reverse = undefined;
                }
            });
            var reverse = !col.reverse ? 1 : -1,
                sortFn = typeof col.comparator === 'function' ? function (a, b) {
                return reverse * col.comparator(a, b);
            } : function (a, b) {
                return a = a[col.field], b = b[col.field], reverse * ((a > b) - (b > a));
            };
            if (!this.pager.sspFn) {
                this.pager.data.sort(sortFn);
            }
            this._sort_action = true;
            this.pager.sort(col.field, col.reverse);
        }
    }, {
        key: '_sortIcon',
        value: function _sortIcon(colDef) {
            var hidden = colDef.reverse === undefined;
            return { 'fa-sort': hidden, 'not-active': hidden, 'fa-caret-up': colDef.reverse === false, 'fa-caret-down': colDef.reverse === true };
        }
    }, {
        key: '_header',
        value: function _header(model) {
            var _this2 = this;

            if (model.hideHeader) {
                return '';
            }
            return (0, _zaitun.h)('thead' + (this.model.headerClass || ''), [].concat(_toConsumableArray(this._Extraheaders(model)), [(0, _zaitun.h)('tr', model.columns.filter(function (col) {
                return !col.hide;
            }).map(function (col, index) {
                return (0, _zaitun.h)('th' + (col.hClass || ''), { key: index, on: { click: function click() {
                            return _this2._sort(col);
                        } } }, [col.sort ? (0, _zaitun.h)('i.fa', { class: _this2._sortIcon(col) }) : '', col.header]);
            }))]));
        }
    }, {
        key: '_body',
        value: function _body(model) {
            if (!this.data.length) {
                return (0, _zaitun.h)('tbody', [(0, _zaitun.h)('tr', [(0, _zaitun.h)('td.table-info', { props: { colSpan: model.columns.length } }, 'Data not found')])]);
            }
            this._refreshSelectedRows(model);
            return this._defaultView(model);
        }
    }, {
        key: '_refreshSelectedRows',
        value: function _refreshSelectedRows(model) {
            if (model.multiSelect) {
                this.selectedRow = {};
                var sdata = this.data.filter(function (_) {
                    return _.selected;
                });
                for (var i = 0; i < sdata.length; i++) {
                    if (sdata[0] !== this.selectedRows[0]) {
                        break;
                    }
                }
                if (i !== sdata.length) {
                    this.selectedRows = sdata;
                    this._selectedRowsCallback(this.selectedRows);
                }
            }
        }
    }, {
        key: '_defaultView',
        value: function _defaultView(model) {
            var _this3 = this;

            var columns = model.columns.filter(function (col) {
                return !col.hide;
            });
            return (0, _zaitun.h)('tbody', this.data.map(function (row, ri) {
                return (0, _zaitun.h)('tr', {
                    key: ri,
                    on: _this3._rowBindEvents(row, ri, model),
                    style: _this3._bindStyle(row, ri, model),
                    class: _this3._bindClass(row, ri, model) }, columns.map(function (col, ci) {
                    return (0, _zaitun.h)('td', {
                        key: ci,
                        on: _this3._bindEvents(row, ri, col),
                        style: _this3._bindStyle(row, ri, col),
                        class: _this3._bindClass(row, ri, col),
                        props: _this3._bindProps(row, ri, col)
                    }, _this3._cellValue(row, col, ri));
                }));
            }));
        }
    }, {
        key: '_isUndef',
        value: function _isUndef(p) {
            return p === undefined;
        }
    }, {
        key: '_check_apply_editable_when_selected',
        value: function _check_apply_editable_when_selected(row) {
            return this.model.aews ? row.selected : row.editable;
        }
    }, {
        key: '_cellValue',
        value: function _cellValue(row, col, ri) {
            var _this4 = this;

            if (typeof col.cellRenderer === 'function') {
                return [col.cellRenderer(row, ri)];
            }
            if (col.type) {
                if (typeof col.editPer === 'function' && !col.editPer(row, ri)) {
                    return this._transformValue(row[col.field], row, col, ri);
                }
                if (this._isUndef(col.iopts)) {
                    col.iopts = {};
                }
                if (this._isUndef(col.props)) {
                    col.props = {};
                }
                switch (col.type) {
                    case 'select':
                        var data = col[col.field + '_data'] || [];
                        return this._check_apply_editable_when_selected(row) ? [(0, _zaitun.h)('select', {
                            hook: { insert: function insert(vnode) {
                                    return _this4._focus(col, vnode.elm);
                                } },
                            on: this._bindInputEvents(row, ri, col, col.iopts, 'change'),
                            style: this._bindStyle(row, ri, col.iopts),
                            class: this._bindClass(row, ri, col.iopts),
                            props: _extends({}, this._bindProps(row, ri, col.iopts), { value: row[col.field] })
                        }, data.map(function (d) {
                            return (0, _zaitun.h)('option', { props: { value: d.value } }, d.text);
                        }))] : this._transformValue(row[col.field], row, col);
                    case 'checkbox':
                        return this._check_apply_editable_when_selected(row) ? [(0, _zaitun.h)('input', {
                            hook: { insert: function insert(vnode) {
                                    return _this4._focus(col, vnode.elm);
                                } },
                            on: this._bindInputEvents(row, ri, col, col.iopts, 'change'),
                            style: this._bindStyle(row, ri, col.iopts),
                            class: this._bindClass(row, ri, col.iopts),
                            props: _extends({}, this._bindProps(row, ri, col.iopts), { type: col.type, checked: row[col.field] })
                        })] : this._transformValue(row[col.field], row, col);
                    default:
                        return this._check_apply_editable_when_selected(row) ? [(0, _zaitun.h)('input', {
                            hook: { insert: function insert(vnode) {
                                    return _this4._focus(col, vnode.elm);
                                } },
                            on: this._bindInputEvents(row, ri, col, col.iopts, 'input'),
                            style: this._bindStyle(row, ri, col.iopts),
                            class: this._bindClass(row, ri, col.iopts),
                            props: _extends({}, this._bindProps(row, ri, col.iopts), { type: col.type, value: row[col.field] })
                        })] : this._transformValue(row[col.field], row, col);
                }
            }
            return this._transformValue(row[col.field], row, col, ri);
        }
    }, {
        key: '_getSelectText',
        value: function _getSelectText(col, val) {
            var data = col[col.field + '_data'];
            if (this._isUndef(val)) {
                val = '';
            }
            val = val.toString();
            if (Array.isArray(data)) {
                var item = data.find(function (_) {
                    return _.value.toString() === val;
                });
                if (item) {
                    return item.text;
                }
            }
            return '';
        }
    }, {
        key: '_transformValue',
        value: function _transformValue(val, row, col, ri) {
            if (col.type === 'select') {
                return typeof col.tnsValue === 'function' ? col.tnsValue(val, row, ri) : this._getSelectText(col, val);
            }
            return typeof col.tnsValue === 'function' ? col.tnsValue(val, row, ri) : val;
        }
    }, {
        key: '_recordUpdate',
        value: function _recordUpdate(row, col, ri, ev) {
            if (col.type === 'checkbox') {
                row[col.field] = ev.target.checked;
            } else {
                row[col.field] = ev.target.value;
            }
            if (typeof this.model.recordChange === 'function') {
                this.model.recordChange(row, col, ri, ev);
            }
        }
    }, {
        key: '_focus',
        value: function _focus(col, elm) {
            if (col.focus) {
                elm.focus();
            }
        }
    }, {
        key: '_rowBindEvents',
        value: function _rowBindEvents(row, ri, reciver) {
            var _this5 = this;

            var events = {},
                has_click_evt = false;
            if (_typeof(reciver.on) === 'object') {
                if (reciver.on['click'] && (reciver.singleSelect || reciver.multiSelect)) {
                    has_click_evt = true;
                }

                var _loop = function _loop(ename) {
                    if (reciver.on.hasOwnProperty(ename)) {
                        events[ename] = function (ev) {
                            if (ename === 'click' && has_click_evt) {
                                _this5._select_row(row, ri, ev);
                            }
                            reciver.on[ename](row, ri, ev);
                        };
                    }
                };

                for (var ename in reciver.on) {
                    _loop(ename);
                }
            }
            if (!has_click_evt && (reciver.singleSelect || reciver.multiSelect)) {
                events['click'] = function (ev) {
                    _this5._select_row(row, ri, ev);
                };
                return events;
            }
            return events;
        }
    }, {
        key: '_bindEvents',
        value: function _bindEvents(row, ri, reciver) {
            if (_typeof(reciver.on) === 'object') {
                var events = {};

                var _loop2 = function _loop2(ename) {
                    if (reciver.on.hasOwnProperty(ename)) {
                        events[ename] = function (ev) {
                            reciver.on[ename](row, ri, ev);
                        };
                    }
                };

                for (var ename in reciver.on) {
                    _loop2(ename);
                }
                return events;
            }
            return undefined;
        }
    }, {
        key: '_bindInputEvents',
        value: function _bindInputEvents(row, ri, col, reciver, recChngeEvName) {
            var _this6 = this;

            var events = {},
                has_input_evt = false;
            if (_typeof(reciver.on) === 'object') {
                if (reciver.on[recChngeEvName]) {
                    has_input_evt = true;
                }

                var _loop3 = function _loop3(ename) {
                    if (reciver.on.hasOwnProperty(ename)) {
                        events[ename] = function (ev) {
                            if (ename === recChngeEvName && has_input_evt) {
                                _this6._recordUpdate(row, col, ri, ev);
                            }
                            reciver.on[ename](row, ri, ev);
                        };
                    }
                };

                for (var ename in reciver.on) {
                    _loop3(ename);
                }
            }
            if (!has_input_evt) {
                events[recChngeEvName] = function (ev) {
                    _this6._recordUpdate(row, col, ri, ev);
                };
            }
            return events;
        }
    }, {
        key: '_select_row',
        value: function _select_row(row, ri, ev) {
            if (this.model.singleSelect && !this.model.aes && row === this.selectedRow) {
                return;
            }
            var is_not_refresh = false,
                xlen = -1;
            if (this.model.singleSelect) {
                if (row !== this.selectedRow) {
                    this.selectedRow.selected = false;
                }
                row.selected = this.model.aes ? !row.selected : true;
                this.selectedRow = row;
                if (row.selected) {
                    this._selectedRowsCallback(this.selectedRow, ri, ev);
                }
            } else {
                var frow = this.selectedRows.find(function (r) {
                    return r === row;
                });

                if (frow) {
                    if (this.model.aes) {
                        if (ev.ctrlKey) {
                            frow.selected = false;
                            this.selectedRows = this.selectedRows.filter(function (r) {
                                return r !== row;
                            });
                        } else {
                            this.selectedRows.forEach(function (r) {
                                r.selected = false;
                            });
                            this.selectedRows = [];
                        }
                    } else if (ev.ctrlKey && this.selectedRows.length > 1) {
                        frow.selected = false;
                        this.selectedRows = this.selectedRows.filter(function (r) {
                            return r !== row;
                        });
                    } else {
                        this.selectedRows.forEach(function (r) {
                            r.selected = false;
                        });
                        row.selected = true;
                        xlen = this.selectedRows.length;
                        this.selectedRows = [row];
                        is_not_refresh = true;
                    }
                } else {
                    row.selected = true;
                    if (ev.ctrlKey) {
                        this.selectedRows.push(row);
                    } else {
                        this.selectedRows.forEach(function (r) {
                            r.selected = false;
                        });
                        this.selectedRows = [row];
                    }
                }
                if (xlen !== 1) {
                    this._selectedRowsCallback(this.selectedRows, ri, ev);
                }
            }
            if (xlen !== 1) {
                this.refresh();
            }
        }
    }, {
        key: '_selectedRowsCallback',
        value: function _selectedRowsCallback(rows, ri, ev) {
            if (typeof this.model.selectedRows === 'function') {
                this.model.selectedRows(rows, ri, ev);
            }
        }
    }, {
        key: '_bindClass',
        value: function _bindClass(row, ri, reciver) {
            if (typeof reciver.class === 'function') {
                var classObj = reciver.class(row, ri);
                if (reciver.singleSelect || reciver.multiSelect) {
                    classObj.selected = row.selected;
                }
                return classObj;
            } else {
                var _classObj = {};
                if (reciver.singleSelect || reciver.multiSelect) {
                    _classObj.selected = row.selected;
                }
                return _classObj;
            }
        }
    }, {
        key: '_bindStyle',
        value: function _bindStyle(row, ri, reciver) {
            return typeof reciver.style === 'function' ? reciver.style(row, ri) : undefined;
        }
    }, {
        key: '_bindProps',
        value: function _bindProps(row, ri, reciver) {
            return typeof reciver.props === 'function' ? reciver.props(row, ri) : {};
        }
    }, {
        key: '_Extraheaders',
        value: function _Extraheaders(model) {
            var _this7 = this;

            if (!model.headers) {
                return [];
            }
            return model.headers.map(function (row, ri) {
                return (0, _zaitun.h)('tr', { key: ri }, row.filter(function (col) {
                    return !col.hide;
                }).map(function (col, ci) {
                    return (0, _zaitun.h)('th', {
                        key: ci,
                        props: col.props,
                        on: _this7._bindEvents(col, ri, col),
                        style: _this7._bindStyle(col, ri, col),
                        class: _this7._bindClass(col, ri, col)
                    }, _this7._footerCellValue(col, ri));
                }));
            });
        }
    }, {
        key: '_footer',
        value: function _footer(model) {
            var _this8 = this;

            if (!model.footers || model.hideFooter) {
                return '';
            }
            return (0, _zaitun.h)('tfoot' + (this.model.footerClass || ''), model.footers.map(function (row, ri) {
                return (0, _zaitun.h)('tr', { key: ri }, row.filter(function (col) {
                    return !col.hide;
                }).map(function (col, ci) {
                    return (0, _zaitun.h)('th', {
                        key: ci,
                        props: col.props,
                        on: _this8._bindEvents(col, ri, col),
                        style: _this8._bindStyle(col, ri, col),
                        class: _this8._bindClass(col, ri, col)
                    }, _this8._footerCellValue(col, ri));
                }));
            }));
        }
    }, {
        key: '_footerCellValue',
        value: function _footerCellValue(col, ri) {
            if (typeof col.cellRenderer === 'function') {
                if (!this.model.hidePager && !this.pager.sspFn) {
                    return [col.cellRenderer(this.pager.data || [], this.data || [], ri)];
                }
                return [col.cellRenderer(this.data || [], ri)];
            }
            return col.text;
        }
        //public methods

    }, {
        key: 'selectRow',
        value: function selectRow(rowIndex) {
            if (Array.isArray(this.data)) {
                if (this.data.length > rowIndex && (this.model.singleSelect || this.model.multiSelect)) {
                    this.selectedRow.selected = false;
                    this.selectedRows.forEach(function (row) {
                        row.selected = false;
                    });
                    if (rowIndex < this.data.length) {
                        this.data[rowIndex].selected = true;
                        if (this.model.singleSelect) {
                            this.selectedRow = this.data[rowIndex];
                        } else {
                            this.selectedRows = [this.data[rowIndex]];
                        }
                        this._selectedRowsCallback(this.data[rowIndex]);
                    }
                }
            }
            return this;
        }
    }, {
        key: 'focus',
        value: function focus(rowIndex, colId) {
            if (colId) {
                this.model.columns.forEach(function (col) {
                    col.focus = col.id === colId;
                });
            }
            return this.select(rowIndex);
        }
    }, {
        key: 'setData',
        value: function setData(data) {
            if (this.model.hidePager) {
                this.data = data;
            } else {
                this.pager.setData(data);
            }
            return this;
        }
    }, {
        key: 'refresh',
        value: function refresh() {
            this.dispatch({ type: REFRESH });
            return this;
        }
    }, {
        key: 'hideColumns',
        value: function hideColumns(colids, isHide) {
            var _this9 = this;

            colids.forEach(function (cid) {
                var hcol = _this9.model.columns.find(function (c) {
                    return c.id === cid;
                });
                if (hcol) {
                    hcol.hide = isHide;
                }
            });
            return this;
        }
    }, {
        key: 'hideFooterColumns',
        value: function hideFooterColumns(colids, isHide) {
            var _this10 = this;

            if (!this.model.footers) return this;
            colids.forEach(function (cid) {
                var _iteratorNormalCompletion = true;
                var _didIteratorError = false;
                var _iteratorError = undefined;

                try {
                    for (var _iterator = _this10.model.footers[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
                        var row = _step.value;

                        var col = row.find(function (c) {
                            return c.id === cid;
                        });
                        if (col) {
                            col.hide = isHide;
                            break;
                        }
                    }
                } catch (err) {
                    _didIteratorError = true;
                    _iteratorError = err;
                } finally {
                    try {
                        if (!_iteratorNormalCompletion && _iterator.return) {
                            _iterator.return();
                        }
                    } finally {
                        if (_didIteratorError) {
                            throw _iteratorError;
                        }
                    }
                }
            });
            return this;
        }
    }, {
        key: 'setSelectData',
        value: function setSelectData(colID, data) {
            var col = this.model.columns.find(function (_) {
                return _.id === colID;
            });
            if (col) {
                col[col.field + '_data'] = data;
            }
            return this;
        }
    }, {
        key: 'removeRow',
        value: function removeRow(row) {
            var index = this.data.indexOf(this.selectedRow);
            this.data.splice(index, 1);
            if (typeof this.model.pager.sspFn !== 'function') {
                var inx = this.pager.data.indexOf(this.selectedRow);
                this.pager.data.splice(inx, 1);
                if (this.model.pager.search && this.pager.data.length !== this.pager._cachedData.length) {
                    this.pager._cachedData.splice(inx, 1);
                }
            }
            if (index >= this.data.length) {
                index--;
            }
            if (index >= 0) {
                this.selectRow(index);
            }
            return this;
        }
    }, {
        key: 'addRow',
        value: function addRow(row) {
            var index = this.data.indexOf(this.selectedRow);
            this.data.splice(index + 1, -1, row);
            if (typeof this.model.pager.sspFn !== 'function') {
                var inx = this.pager.data.indexOf(this.selectedRow) + 1;
                this.pager.data.splice(inx, -1, row);
                if (this.model.pager.search && this.pager.data.length !== this.pager._cachedData.length) {
                    this.pager._cachedData.splice(inx, -1, row);
                }
            }
            this.selectRow(index + 1);
            return this;
        }
    }]);

    return juGrid;
}();

exports.juGrid = juGrid;

},{"./juPager":25,"zaitun":4}],25:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.juPage = undefined;

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _zaitun = require('zaitun');

function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } else { return Array.from(arr); } }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var juPage = function () {
    function juPage() {
        _classCallCheck(this, juPage);

        this.groupNumber = 1;
        this.activePage = 1;
        this.linkList = [];
        this.totalRecords = 0;
        this.sspFn = null;
        this.data = [];
        this._cachedData = [];
        this.pageChange = null;
        this._prevActivePage = 0;
        this.diffPageAction = false;
        this.powerList = [];
        this.powerListBW = [];
        this._pbdiff = 20;
        this._pbtimes = 5;
        this.searchText = '';
    }

    _createClass(juPage, [{
        key: 'init',
        value: function init() {
            return {
                pageSize: 10,
                linkPages: 10,
                enablePowerPage: false,
                nav: true,
                search: true
            };
        }
    }, {
        key: 'view',
        value: function view(_ref) {
            var _this = this;

            var model = _ref.model,
                dispatch = _ref.dispatch;

            this.dispatch = dispatch;
            this.model = model;
            this._calculatePagelinkes();
            var nav = (0, _zaitun.h)('nav', [(0, _zaitun.h)('ul.pagination.pagination-' + model.elmSize, [(0, _zaitun.h)('li.page-item', { key: 'start', class: { disabled: this._isDisabledPrev() } }, [(0, _zaitun.h)('a.page-link', { props: { href: 'javascript:;' }, on: { click: function click() {
                        return _this._clickStart();
                    } } }, 'Start')]), (0, _zaitun.h)('li.page-item', { key: 'pre', class: { disabled: this._isDisabledPrev() } }, [(0, _zaitun.h)('a.page-link', { props: { href: 'javascript:;' }, on: { click: function click() {
                        return _this._clickPrev();
                    } } }, '«')])].concat(_toConsumableArray(this.powerListBW.map(function (li, index) {
                return (0, _zaitun.h)('li.page-item', { key: index + 'pbb' }, [(0, _zaitun.h)('a.page-link', { props: { href: 'javascript:;' }, on: { click: function click() {
                            return _this.powerAction(li);
                        } } }, li)]);
            })), _toConsumableArray(this.linkList.map(function (li, index) {
                return (0, _zaitun.h)('li.page-item', { key: index + 'n', class: { active: li === _this.activePage } }, [(0, _zaitun.h)('a.page-link', { props: { href: 'javascript:;' }, on: { click: function click() {
                            return _this.clickPage(li);
                        } } }, li)]);
            })), _toConsumableArray(this.powerList.map(function (li, index) {
                return (0, _zaitun.h)('li.page-item', { key: index + 'pbf' }, [(0, _zaitun.h)('a.page-link', { props: { href: 'javascript:;' }, on: { click: function click() {
                            return _this.powerAction(li);
                        } } }, li)]);
            })), [(0, _zaitun.h)('li.page-item', { key: 'next', class: { disabled: this._isDisabledNext() } }, [(0, _zaitun.h)('a.page-link', { props: { href: 'javascript:;' }, on: { click: function click() {
                        return _this._clickNext();
                    } } }, '»')]), (0, _zaitun.h)('li.page-item', { key: 'end', class: { disabled: this._isDisabledNext() } }, [(0, _zaitun.h)('a.page-link', { props: { href: 'javascript:;' }, on: { click: function click() {
                        return _this._clickEnd();
                    } } }, 'End')])]))]);
            var info = (0, _zaitun.h)('div.page-size', [(0, _zaitun.h)('span', 'Page Size'), (0, _zaitun.h)('select.form-control.form-control-' + model.elmSize, { props: { value: this.model.pageSize }, on: { change: function change(e) {
                        return _this._changePageSize(e.target.value);
                    } } }, [(0, _zaitun.h)('option', { props: { value: 5 } }, '5'), (0, _zaitun.h)('option', { props: { value: 10 } }, '10'), (0, _zaitun.h)('option', { props: { value: 15 } }, '15'), (0, _zaitun.h)('option', { props: { value: 20 } }, '20'), (0, _zaitun.h)('option', { props: { value: 25 } }, '25'), (0, _zaitun.h)('option', { props: { value: 30 } }, '30'), (0, _zaitun.h)('option', { props: { value: 50 } }, '50'), (0, _zaitun.h)('option', { props: { value: 100 } }, '100')]), (0, _zaitun.h)('span', 'Page ' + (this.totalPage ? this.activePage : 0) + ' of ' + this.totalPage)]);
            var elms = [];
            if (model.pagerInfo) {
                elms.push((0, _zaitun.h)('div.col-12.col-md-auto', [info]));
            }
            if (model.nav) {
                elms.push((0, _zaitun.h)('div.col', [nav]));
            }
            if (model.search) {
                elms.push((0, _zaitun.h)('div.col-12.col-md-auto', [(0, _zaitun.h)('input.search.form-control.form-control-' + model.elmSize, { on: { keyup: function keyup(ev) {
                            return _this.search(ev.target.value);
                        } }, props: { type: 'text', value: this.searchText, placeholder: 'Search...' } })]));
            }
            return (0, _zaitun.h)('div.row', elms);
        }
    }, {
        key: 'update',
        value: function update(model, action) {
            return model;
        }
        //public methods

    }, {
        key: 'search',
        value: function search(val) {
            this.activePage = 1;
            this.searchText = val;
            if (this.sspFn) {
                this.firePageChange();
            } else if (typeof this.model.searchFn === 'function') {
                this.data = val ? this.model.searchFn(this._cachedData, val.toLowerCase()) : this._cachedData;
                this.firePageChange();
            }
        }
    }, {
        key: 'sort',
        value: function sort(sortProp, isAsc) {
            this._sort = sortProp + '|' + (isAsc ? 'desc' : 'asc');
            this.firePageChange();
        }
    }, {
        key: 'refresh',
        value: function refresh() {
            this._calculatePager();
            this.dispatch({ type: 'pager' });
        }
    }, {
        key: 'setData',
        value: function setData(data) {
            this.data = data;
            if (this.model.search) {
                this._cachedData = data;
            }
            this.firePageChange();
        }
    }, {
        key: 'firePageChange',
        value: function firePageChange() {
            var _this2 = this;

            this.diffPageAction = this.activePage !== this._prevActivePage;
            this._prevActivePage = this.activePage;
            if (this.sspFn) {
                this.sspFn({ pageSize: this.model.pageSize, pageNo: this.activePage, searchText: this.searchText, sort: this._sort }).then(function (res) {
                    _this2.totalRecords = res.totalRecords;
                    _this2._setTotalPage();
                    _this2.pageChange(res.data);
                    _this2.refresh();
                });
            } else {
                if (!this.data) return;
                var startIndex = (this.activePage - 1) * this.model.pageSize;
                this.pageChange(this.data.slice(startIndex, startIndex + this.model.pageSize));
                this.refresh();
            }
        }
    }, {
        key: 'clickPage',
        value: function clickPage(index) {
            this.activePage = index;
            this.firePageChange();
        }
        //end public methods

    }, {
        key: '_isUndef',
        value: function _isUndef(p) {
            return p === undefined;
        }
    }, {
        key: '_changePageSize',
        value: function _changePageSize(size) {
            this.model.pageSize = +size;
            this.model.pageSize = this.model.pageSize;
            this.groupNumber = 1;
            this.activePage = 1;
            this.firePageChange();
        }
    }, {
        key: '_clickStart',
        value: function _clickStart() {
            if (this.groupNumber > 1) {
                this.groupNumber = 1;
                this.activePage = 1;
                this.firePageChange();
            }
        }
    }, {
        key: '_clickEnd',
        value: function _clickEnd() {
            if (this._hasNext()) {
                this.groupNumber = parseInt((this.totalPage / this.model.linkPages).toString()) + (this.totalPage % this.model.linkPages ? 1 : 0);
                this.activePage = this.totalPage;
                this.firePageChange();
            }
        }
    }, {
        key: '_clickPrev',
        value: function _clickPrev() {
            this.groupNumber--;
            if (this.groupNumber <= 0) {
                this.groupNumber++;
            } else {
                this.firePageChange();
            }
        }
    }, {
        key: '_clickNext',
        value: function _clickNext() {
            if (this._hasNext()) {
                this.groupNumber++;
                this.firePageChange();
            }
        }
    }, {
        key: '_isDisabledPrev',
        value: function _isDisabledPrev() {
            if (this.sspFn) {
                return !(this.groupNumber > 1);
            }
            if (!this.data) {
                return true;
            }
            return !(this.groupNumber > 1);
        }
    }, {
        key: '_isDisabledNext',
        value: function _isDisabledNext() {
            if (this.sspFn) {
                return !this._hasNext();
            }
            if (!this.data) {
                return true;
            }
            return !this._hasNext();
        }
    }, {
        key: '_hasNext',
        value: function _hasNext() {
            if (this.sspFn) {
                return this.totalPage > this.groupNumber * this.model.linkPages;
            }
            if (!this.data) false;
            var len = this.data.length;
            if (len == 0) return false;
            return this.totalPage > this.groupNumber * this.model.linkPages;
        }
    }, {
        key: '_calculatePager',
        value: function _calculatePager() {
            if (this.model.enablePowerPage) {
                this.calculateBackwordPowerList();
                this.calculateForwordPowerList();
            }
            this._calculatePagelinkes();
        }
    }, {
        key: '_calculatePagelinkes',
        value: function _calculatePagelinkes() {
            this._setTotalPage();
            var start = 1;
            if (this.groupNumber > 1) {
                start = (this.groupNumber - 1) * this.model.linkPages + 1;
            }
            var end = this.groupNumber * this.model.linkPages;
            if (end > this.totalPage) {
                end = this.totalPage;
            }
            this.linkList = [];
            for (var index = start; index <= end; index++) {
                this.linkList.push(index);
            }
        }
    }, {
        key: '_setTotalPage',
        value: function _setTotalPage() {
            this.totalPage = 0;
            if (this.sspFn) {
                this.totalPage = parseInt((this.totalRecords / this.model.pageSize).toString()) + (this.totalRecords % this.model.pageSize > 0 ? 1 : 0);
                return;
            }
            if (!this.data) return;
            var len = this.data.length;
            if (len == 0) return;

            this.totalPage = parseInt((len / this.model.pageSize).toString()) + (len % this.model.pageSize > 0 ? 1 : 0);
        }
        // power action   

    }, {
        key: 'powerAction',
        value: function powerAction(pageNo) {
            this.groupNumber = Math.ceil(pageNo / this.model.linkPages);
            this.activePage = pageNo;
            this.firePageChange();
        }
    }, {
        key: 'calculateBackwordPowerList',
        value: function calculateBackwordPowerList() {
            this.powerListBW = [];
            var curPos = this.groupNumber * this.model.linkPages + 1;
            if (curPos > this._pbdiff) {
                var index = curPos - this._pbdiff,
                    times = this._pbtimes;
                while (index > 0 && times > 0) {
                    this.powerListBW.push(index);
                    index -= this._pbdiff;
                    times--;
                }
                this.powerListBW.reverse();
            }
        }
    }, {
        key: 'calculateForwordPowerList',
        value: function calculateForwordPowerList() {
            this.powerList = [];
            this._setTotalPage();
            var curPos = this.groupNumber * this.model.linkPages + 1,
                restPages = this.totalPage - curPos;
            if (restPages > this._pbdiff) {
                var index = curPos + this._pbdiff,
                    times = this._pbtimes;
                while (index < this.totalPage && times > 0) {
                    this.powerList.push(index);
                    index += this._pbdiff;
                    times--;
                }
            }
        }
    }]);

    return juPage;
}();

exports.juPage = juPage;

},{"zaitun":4}],26:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

function guid() {
  function s4() {
    return Math.floor((1 + Math.random()) * 0x10000).toString(16).substring(1);
  }
  return s4() + s4() + '-' + s4() + '-' + s4() + '-' + s4() + '-' + s4() + s4() + s4();
}

exports.guid = guid;

},{}]},{},[19]);
