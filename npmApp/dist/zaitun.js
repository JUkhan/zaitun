(function(f){var g;if(typeof window!=="undefined"){g=window}else if(typeof self!=="undefined"){g=self}g.zaitun=f()})(function(){var define,module,exports;return function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s}({1:[function(require,module,exports){"use strict";var SVGNS="http://www.w3.org/2000/svg";var modulesNS=["hook","on","style","class","props","attrs"];var slice=Array.prototype.slice;function isPrimitive(val){return typeof val==="string"||typeof val==="number"||typeof val==="boolean"||typeof val==="symbol"||val===null||val===undefined}function normalizeAttrs(attrs,nsURI,defNS,modules){var map={ns:nsURI};for(var i=0,len=modules.length;i<len;i++){var mod=modules[i];if(attrs[mod])map[mod]=attrs[mod]}for(var key in attrs){if(key!=="key"&&key!=="classNames"&&key!=="selector"){var idx=key.indexOf("-");if(idx>0)addAttr(key.slice(0,idx),key.slice(idx+1),attrs[key]);else if(!map[key])addAttr(defNS,key,attrs[key])}}return map;function addAttr(namespace,key,val){var ns=map[namespace]||(map[namespace]={});ns[key]=val}}function buildFromStringTag(nsURI,defNS,modules,tag,attrs,children){if(attrs.selector){tag=tag+attrs.selector}if(attrs.classNames){var cns=attrs.classNames;tag=tag+"."+(Array.isArray(cns)?cns.join("."):cns.replace(/\s+/g,"."))}return{sel:tag,data:normalizeAttrs(attrs,nsURI,defNS,modules),children:children.map(function(c){return isPrimitive(c)?{text:c}:c}),key:attrs.key}}function buildFromComponent(nsURI,defNS,modules,tag,attrs,children){var res;if(typeof tag==="function")res=tag(attrs,children);else if(tag&&typeof tag.view==="function")res=tag.view(attrs,children);else if(tag&&typeof tag.render==="function")res=tag.render(attrs,children);else throw"JSX tag must be either a string, a function or an object with 'view' or 'render' methods";res.key=attrs.key;return res}function flatten(nested,start,flat){for(var i=start,len=nested.length;i<len;i++){var item=nested[i];if(Array.isArray(item)){flatten(item,0,flat)}else{flat.push(item)}}}function maybeFlatten(array){if(array){for(var i=0,len=array.length;i<len;i++){if(Array.isArray(array[i])){var flat=array.slice(0,i);flatten(array,i,flat);array=flat;break}}}return array}function buildVnode(nsURI,defNS,modules,tag,attrs,children){attrs=attrs||{};children=maybeFlatten(children);if(typeof tag==="string"){return buildFromStringTag(nsURI,defNS,modules,tag,attrs,children)}else{return buildFromComponent(nsURI,defNS,modules,tag,attrs,children)}}function JSX(nsURI,defNS,modules){return function jsxWithCustomNS(tag,attrs,children){if(arguments.length>3||!Array.isArray(children))children=slice.call(arguments,2);return buildVnode(nsURI,defNS||"props",modules||modulesNS,tag,attrs,children)}}module.exports={html:JSX(undefined),svg:JSX(SVGNS,"attrs"),JSX:JSX}},{}],2:[function(require,module,exports){"use strict";var vnode_1=require("./vnode");var is=require("./is");function addNS(data,children,sel){data.ns="http://www.w3.org/2000/svg";if(sel!=="foreignObject"&&children!==undefined){for(var i=0;i<children.length;++i){var childData=children[i].data;if(childData!==undefined){addNS(childData,children[i].children,children[i].sel)}}}}function h(sel,b,c){var data={},children,text,i;if(c!==undefined){data=b;if(is.array(c)){children=c}else if(is.primitive(c)){text=c}else if(c&&c.sel){children=[c]}}else if(b!==undefined){if(is.array(b)){children=b}else if(is.primitive(b)){text=b}else if(b&&b.sel){children=[b]}else{data=b}}if(is.array(children)){for(i=0;i<children.length;++i){if(is.primitive(children[i]))children[i]=vnode_1.vnode(undefined,undefined,undefined,children[i])}}if(sel[0]==="s"&&sel[1]==="v"&&sel[2]==="g"&&(sel.length===3||sel[3]==="."||sel[3]==="#")){addNS(data,children,sel)}return vnode_1.vnode(sel,data,children,text,undefined)}exports.h=h;Object.defineProperty(exports,"__esModule",{value:true});exports.default=h},{"./is":4,"./vnode":11}],3:[function(require,module,exports){"use strict";function createElement(tagName){return document.createElement(tagName)}function createElementNS(namespaceURI,qualifiedName){return document.createElementNS(namespaceURI,qualifiedName)}function createTextNode(text){return document.createTextNode(text)}function createComment(text){return document.createComment(text)}function insertBefore(parentNode,newNode,referenceNode){parentNode.insertBefore(newNode,referenceNode)}function removeChild(node,child){node.removeChild(child)}function appendChild(node,child){node.appendChild(child)}function parentNode(node){return node.parentNode}function nextSibling(node){return node.nextSibling}function tagName(elm){return elm.tagName}function setTextContent(node,text){node.textContent=text}function getTextContent(node){return node.textContent}function isElement(node){return node.nodeType===1}function isText(node){return node.nodeType===3}function isComment(node){return node.nodeType===8}exports.htmlDomApi={createElement:createElement,createElementNS:createElementNS,createTextNode:createTextNode,createComment:createComment,insertBefore:insertBefore,removeChild:removeChild,appendChild:appendChild,parentNode:parentNode,nextSibling:nextSibling,tagName:tagName,setTextContent:setTextContent,getTextContent:getTextContent,isElement:isElement,isText:isText,isComment:isComment};Object.defineProperty(exports,"__esModule",{value:true});exports.default=exports.htmlDomApi},{}],4:[function(require,module,exports){"use strict";exports.array=Array.isArray;function primitive(s){return typeof s==="string"||typeof s==="number"}exports.primitive=primitive},{}],5:[function(require,module,exports){"use strict";function updateClass(oldVnode,vnode){var cur,name,elm=vnode.elm,oldClass=oldVnode.data.class,klass=vnode.data.class;if(!oldClass&&!klass)return;if(oldClass===klass)return;oldClass=oldClass||{};klass=klass||{};for(name in oldClass){if(!klass[name]){elm.classList.remove(name)}}for(name in klass){cur=klass[name];if(cur!==oldClass[name]){elm.classList[cur?"add":"remove"](name)}}}exports.classModule={create:updateClass,update:updateClass};Object.defineProperty(exports,"__esModule",{value:true});exports.default=exports.classModule},{}],6:[function(require,module,exports){"use strict";function invokeHandler(handler,vnode,event){if(typeof handler==="function"){handler.call(vnode,event,vnode)}else if(typeof handler==="object"){if(typeof handler[0]==="function"){if(handler.length===2){handler[0].call(vnode,handler[1],event,vnode)}else{var args=handler.slice(1);args.push(event);args.push(vnode);handler[0].apply(vnode,args)}}else{for(var i=0;i<handler.length;i++){invokeHandler(handler[i])}}}}function handleEvent(event,vnode){var name=event.type,on=vnode.data.on;if(on&&on[name]){invokeHandler(on[name],vnode,event)}}function createListener(){return function handler(event){handleEvent(event,handler.vnode)}}function updateEventListeners(oldVnode,vnode){var oldOn=oldVnode.data.on,oldListener=oldVnode.listener,oldElm=oldVnode.elm,on=vnode&&vnode.data.on,elm=vnode&&vnode.elm,name;if(oldOn===on){return}if(oldOn&&oldListener){if(!on){for(name in oldOn){oldElm.removeEventListener(name,oldListener,false)}}else{for(name in oldOn){if(!on[name]){oldElm.removeEventListener(name,oldListener,false)}}}}if(on){var listener=vnode.listener=oldVnode.listener||createListener();listener.vnode=vnode;if(!oldOn){for(name in on){elm.addEventListener(name,listener,false)}}else{for(name in on){if(!oldOn[name]){elm.addEventListener(name,listener,false)}}}}}exports.eventListenersModule={create:updateEventListeners,update:updateEventListeners,destroy:updateEventListeners};Object.defineProperty(exports,"__esModule",{value:true});exports.default=exports.eventListenersModule},{}],7:[function(require,module,exports){"use strict";function updateProps(oldVnode,vnode){var key,cur,old,elm=vnode.elm,oldProps=oldVnode.data.props,props=vnode.data.props;if(!oldProps&&!props)return;if(oldProps===props)return;oldProps=oldProps||{};props=props||{};for(key in oldProps){if(!props[key]){delete elm[key]}}for(key in props){cur=props[key];old=oldProps[key];if(old!==cur&&(key!=="value"||elm[key]!==cur)){elm[key]=cur}}}exports.propsModule={create:updateProps,update:updateProps};Object.defineProperty(exports,"__esModule",{value:true});exports.default=exports.propsModule},{}],8:[function(require,module,exports){"use strict";var raf=typeof window!=="undefined"&&window.requestAnimationFrame||setTimeout;var nextFrame=function(fn){raf(function(){raf(fn)})};function setNextFrame(obj,prop,val){nextFrame(function(){obj[prop]=val})}function updateStyle(oldVnode,vnode){var cur,name,elm=vnode.elm,oldStyle=oldVnode.data.style,style=vnode.data.style;if(!oldStyle&&!style)return;if(oldStyle===style)return;oldStyle=oldStyle||{};style=style||{};var oldHasDel="delayed"in oldStyle;for(name in oldStyle){if(!style[name]){if(name[0]==="-"&&name[1]==="-"){elm.style.removeProperty(name)}else{elm.style[name]=""}}}for(name in style){cur=style[name];if(name==="delayed"){for(name in style.delayed){cur=style.delayed[name];if(!oldHasDel||cur!==oldStyle.delayed[name]){setNextFrame(elm.style,name,cur)}}}else if(name!=="remove"&&cur!==oldStyle[name]){if(name[0]==="-"&&name[1]==="-"){elm.style.setProperty(name,cur)}else{elm.style[name]=cur}}}}function applyDestroyStyle(vnode){var style,name,elm=vnode.elm,s=vnode.data.style;if(!s||!(style=s.destroy))return;for(name in style){elm.style[name]=style[name]}}function applyRemoveStyle(vnode,rm){var s=vnode.data.style;if(!s||!s.remove){rm();return}var name,elm=vnode.elm,i=0,compStyle,style=s.remove,amount=0,applied=[];for(name in style){applied.push(name);elm.style[name]=style[name]}compStyle=getComputedStyle(elm);var props=compStyle["transition-property"].split(", ");for(;i<props.length;++i){if(applied.indexOf(props[i])!==-1)amount++}elm.addEventListener("transitionend",function(ev){if(ev.target===elm)--amount;if(amount===0)rm()})}exports.styleModule={create:updateStyle,update:updateStyle,destroy:applyDestroyStyle,remove:applyRemoveStyle};Object.defineProperty(exports,"__esModule",{value:true});exports.default=exports.styleModule},{}],9:[function(require,module,exports){"use strict";var vnode_1=require("./vnode");var is=require("./is");var htmldomapi_1=require("./htmldomapi");function isUndef(s){return s===undefined}function isDef(s){return s!==undefined}var emptyNode=vnode_1.default("",{},[],undefined,undefined);function sameVnode(vnode1,vnode2){return vnode1.key===vnode2.key&&vnode1.sel===vnode2.sel}function isVnode(vnode){return vnode.sel!==undefined}function createKeyToOldIdx(children,beginIdx,endIdx){var i,map={},key,ch;for(i=beginIdx;i<=endIdx;++i){ch=children[i];if(ch!=null){key=ch.key;if(key!==undefined)map[key]=i}}return map}var hooks=["create","update","remove","destroy","pre","post"];var h_1=require("./h");exports.h=h_1.h;var thunk_1=require("./thunk");exports.thunk=thunk_1.thunk;function init(modules,domApi){var i,j,cbs={};var api=domApi!==undefined?domApi:htmldomapi_1.default;for(i=0;i<hooks.length;++i){cbs[hooks[i]]=[];for(j=0;j<modules.length;++j){var hook=modules[j][hooks[i]];if(hook!==undefined){cbs[hooks[i]].push(hook)}}}function emptyNodeAt(elm){var id=elm.id?"#"+elm.id:"";var c=elm.className?"."+elm.className.split(" ").join("."):"";return vnode_1.default(api.tagName(elm).toLowerCase()+id+c,{},[],undefined,elm)}function createRmCb(childElm,listeners){return function rmCb(){if(--listeners===0){var parent_1=api.parentNode(childElm);api.removeChild(parent_1,childElm)}}}function createElm(vnode,insertedVnodeQueue){var i,data=vnode.data;if(data!==undefined){if(isDef(i=data.hook)&&isDef(i=i.init)){i(vnode);data=vnode.data}}var children=vnode.children,sel=vnode.sel;if(sel==="!"){if(isUndef(vnode.text)){vnode.text=""}vnode.elm=api.createComment(vnode.text)}else if(sel!==undefined){var hashIdx=sel.indexOf("#");var dotIdx=sel.indexOf(".",hashIdx);var hash=hashIdx>0?hashIdx:sel.length;var dot=dotIdx>0?dotIdx:sel.length;var tag=hashIdx!==-1||dotIdx!==-1?sel.slice(0,Math.min(hash,dot)):sel;var elm=vnode.elm=isDef(data)&&isDef(i=data.ns)?api.createElementNS(i,tag):api.createElement(tag);if(hash<dot)elm.id=sel.slice(hash+1,dot);if(dotIdx>0)elm.className=sel.slice(dot+1).replace(/\./g," ");for(i=0;i<cbs.create.length;++i)cbs.create[i](emptyNode,vnode);if(is.array(children)){for(i=0;i<children.length;++i){var ch=children[i];if(ch!=null){api.appendChild(elm,createElm(ch,insertedVnodeQueue))}}}else if(is.primitive(vnode.text)){api.appendChild(elm,api.createTextNode(vnode.text))}i=vnode.data.hook;if(isDef(i)){if(i.create)i.create(emptyNode,vnode);if(i.insert)insertedVnodeQueue.push(vnode)}}else{vnode.elm=api.createTextNode(vnode.text)}return vnode.elm}function addVnodes(parentElm,before,vnodes,startIdx,endIdx,insertedVnodeQueue){for(;startIdx<=endIdx;++startIdx){var ch=vnodes[startIdx];if(ch!=null){api.insertBefore(parentElm,createElm(ch,insertedVnodeQueue),before)}}}function invokeDestroyHook(vnode){var i,j,data=vnode.data;if(data!==undefined){if(isDef(i=data.hook)&&isDef(i=i.destroy))i(vnode);for(i=0;i<cbs.destroy.length;++i)cbs.destroy[i](vnode);if(vnode.children!==undefined){for(j=0;j<vnode.children.length;++j){i=vnode.children[j];if(i!=null&&typeof i!=="string"){invokeDestroyHook(i)}}}}}function removeVnodes(parentElm,vnodes,startIdx,endIdx){for(;startIdx<=endIdx;++startIdx){var i_1=void 0,listeners=void 0,rm=void 0,ch=vnodes[startIdx];if(ch!=null){if(isDef(ch.sel)){invokeDestroyHook(ch);listeners=cbs.remove.length+1;rm=createRmCb(ch.elm,listeners);for(i_1=0;i_1<cbs.remove.length;++i_1)cbs.remove[i_1](ch,rm);if(isDef(i_1=ch.data)&&isDef(i_1=i_1.hook)&&isDef(i_1=i_1.remove)){i_1(ch,rm)}else{rm()}}else{api.removeChild(parentElm,ch.elm)}}}}function updateChildren(parentElm,oldCh,newCh,insertedVnodeQueue){var oldStartIdx=0,newStartIdx=0;var oldEndIdx=oldCh.length-1;var oldStartVnode=oldCh[0];var oldEndVnode=oldCh[oldEndIdx];var newEndIdx=newCh.length-1;var newStartVnode=newCh[0];var newEndVnode=newCh[newEndIdx];var oldKeyToIdx;var idxInOld;var elmToMove;var before;while(oldStartIdx<=oldEndIdx&&newStartIdx<=newEndIdx){if(oldStartVnode==null){oldStartVnode=oldCh[++oldStartIdx]}else if(oldEndVnode==null){oldEndVnode=oldCh[--oldEndIdx]}else if(newStartVnode==null){newStartVnode=newCh[++newStartIdx]}else if(newEndVnode==null){newEndVnode=newCh[--newEndIdx]}else if(sameVnode(oldStartVnode,newStartVnode)){patchVnode(oldStartVnode,newStartVnode,insertedVnodeQueue);oldStartVnode=oldCh[++oldStartIdx];newStartVnode=newCh[++newStartIdx]}else if(sameVnode(oldEndVnode,newEndVnode)){patchVnode(oldEndVnode,newEndVnode,insertedVnodeQueue);oldEndVnode=oldCh[--oldEndIdx];newEndVnode=newCh[--newEndIdx]}else if(sameVnode(oldStartVnode,newEndVnode)){patchVnode(oldStartVnode,newEndVnode,insertedVnodeQueue);api.insertBefore(parentElm,oldStartVnode.elm,api.nextSibling(oldEndVnode.elm));oldStartVnode=oldCh[++oldStartIdx];newEndVnode=newCh[--newEndIdx]}else if(sameVnode(oldEndVnode,newStartVnode)){patchVnode(oldEndVnode,newStartVnode,insertedVnodeQueue);api.insertBefore(parentElm,oldEndVnode.elm,oldStartVnode.elm);oldEndVnode=oldCh[--oldEndIdx];newStartVnode=newCh[++newStartIdx]}else{if(oldKeyToIdx===undefined){oldKeyToIdx=createKeyToOldIdx(oldCh,oldStartIdx,oldEndIdx)}idxInOld=oldKeyToIdx[newStartVnode.key];if(isUndef(idxInOld)){api.insertBefore(parentElm,createElm(newStartVnode,insertedVnodeQueue),oldStartVnode.elm);newStartVnode=newCh[++newStartIdx]}else{elmToMove=oldCh[idxInOld];if(elmToMove.sel!==newStartVnode.sel){api.insertBefore(parentElm,createElm(newStartVnode,insertedVnodeQueue),oldStartVnode.elm)}else{patchVnode(elmToMove,newStartVnode,insertedVnodeQueue);oldCh[idxInOld]=undefined;api.insertBefore(parentElm,elmToMove.elm,oldStartVnode.elm)}newStartVnode=newCh[++newStartIdx]}}}if(oldStartIdx>oldEndIdx){before=newCh[newEndIdx+1]==null?null:newCh[newEndIdx+1].elm;addVnodes(parentElm,before,newCh,newStartIdx,newEndIdx,insertedVnodeQueue)}else if(newStartIdx>newEndIdx){removeVnodes(parentElm,oldCh,oldStartIdx,oldEndIdx)}}function patchVnode(oldVnode,vnode,insertedVnodeQueue){var i,hook;if(isDef(i=vnode.data)&&isDef(hook=i.hook)&&isDef(i=hook.prepatch)){i(oldVnode,vnode)}var elm=vnode.elm=oldVnode.elm;var oldCh=oldVnode.children;var ch=vnode.children;if(oldVnode===vnode)return;if(vnode.data!==undefined){for(i=0;i<cbs.update.length;++i)cbs.update[i](oldVnode,vnode);i=vnode.data.hook;if(isDef(i)&&isDef(i=i.update))i(oldVnode,vnode)}if(isUndef(vnode.text)){if(isDef(oldCh)&&isDef(ch)){if(oldCh!==ch)updateChildren(elm,oldCh,ch,insertedVnodeQueue)}else if(isDef(ch)){if(isDef(oldVnode.text))api.setTextContent(elm,"");addVnodes(elm,null,ch,0,ch.length-1,insertedVnodeQueue)}else if(isDef(oldCh)){removeVnodes(elm,oldCh,0,oldCh.length-1)}else if(isDef(oldVnode.text)){api.setTextContent(elm,"")}}else if(oldVnode.text!==vnode.text){api.setTextContent(elm,vnode.text)}if(isDef(hook)&&isDef(i=hook.postpatch)){i(oldVnode,vnode)}}return function patch(oldVnode,vnode){var i,elm,parent;var insertedVnodeQueue=[];for(i=0;i<cbs.pre.length;++i)cbs.pre[i]();if(!isVnode(oldVnode)){oldVnode=emptyNodeAt(oldVnode)}if(sameVnode(oldVnode,vnode)){patchVnode(oldVnode,vnode,insertedVnodeQueue)}else{elm=oldVnode.elm;parent=api.parentNode(elm);createElm(vnode,insertedVnodeQueue);if(parent!==null){api.insertBefore(parent,vnode.elm,api.nextSibling(elm));removeVnodes(parent,[oldVnode],0,0)}}for(i=0;i<insertedVnodeQueue.length;++i){insertedVnodeQueue[i].data.hook.insert(insertedVnodeQueue[i])}for(i=0;i<cbs.post.length;++i)cbs.post[i]();return vnode}}exports.init=init},{"./h":2,"./htmldomapi":3,"./is":4,"./thunk":10,"./vnode":11}],10:[function(require,module,exports){"use strict";var h_1=require("./h");function copyToThunk(vnode,thunk){thunk.elm=vnode.elm;vnode.data.fn=thunk.data.fn;vnode.data.args=thunk.data.args;thunk.data=vnode.data;thunk.children=vnode.children;thunk.text=vnode.text;thunk.elm=vnode.elm}function init(thunk){var cur=thunk.data;var vnode=cur.fn.apply(undefined,cur.args);copyToThunk(vnode,thunk)}function prepatch(oldVnode,thunk){var i,old=oldVnode.data,cur=thunk.data;var oldArgs=old.args,args=cur.args;if(old.fn!==cur.fn||oldArgs.length!==args.length){copyToThunk(cur.fn.apply(undefined,args),thunk)}for(i=0;i<args.length;++i){if(oldArgs[i]!==args[i]){copyToThunk(cur.fn.apply(undefined,args),thunk);return}}copyToThunk(oldVnode,thunk)}exports.thunk=function thunk(sel,key,fn,args){if(args===undefined){args=fn;fn=key;key=undefined}return h_1.h(sel,{key:key,hook:{init:init,prepatch:prepatch},fn:fn,args:args})};Object.defineProperty(exports,"__esModule",{value:true});exports.default=exports.thunk},{"./h":2}],11:[function(require,module,exports){"use strict";function vnode(sel,data,children,text,elm){var key=data===undefined?undefined:data.key;return{sel:sel,data:data,children:children,text:text,elm:elm,key:key}}exports.vnode=vnode;Object.defineProperty(exports,"__esModule",{value:true});exports.default=vnode},{}],12:[function(require,module,exports){var Router=require("./router"),snabbdom=require("snabbdom"),vnode=null;function bootstrap(options){if(!options.containerDom){throw new Error("mountNode must be a css selector or a dom object")}if(typeof options.containerDom==="string"){vnode=document.querySelector(options.containerDom)}else{vnode=options.containerDom}if(!(typeof options.mainComponent==="object"||typeof options.mainComponent==="function")){throw new Error("bootstrap options: mainComponent missing.")}Router.config(options).attach(ComponentManager).listen().setActivePath(options.activePath)}var patch=snabbdom.init([require("snabbdom/modules/class"),require("snabbdom/modules/props"),require("snabbdom/modules/style"),require("snabbdom/modules/eventlisteners")]),h=require("snabbdom/h");function emptyCom(){return{init:function(){return{}},view:function(obj){return h("div.com-load","loading...")}}}function ComponentManager(){this.mcom={};this.child=emptyCom();this.model={};this.params=null;this.devTool=null;this.key="";this.cacheObj={};this.initMainComponent=function(component){if(typeof component==="object"){this.mcom=component}else if(typeof component==="function"){this.mcom=new component}this.validateCom(this.mcom)};this.validateCom=function(com){if(typeof com.init!=="function"){com.init=function(){return{}}}if(typeof com.view!=="function"){throw new Error("Component must have a view function.")}};this.initChildComponent=function(component){if(typeof component==="object"){this.child=component}else if(typeof component==="function"){this.child=new component}this.validateCom(this.child)};this.reset=function(){this.model=this.mcom.init(this.dispatch,this.params);if(typeof this.child.init==="function"){this.model.child=this.child.init(this.dispatch,this.params)}this.updateUI()};this.updateByModel=function(model){this.model=model;this.updateUI()};this.loadCom=function(route,params,url){var that=this;route.loadComponent().then(function(com){route.component=com.default;route.loadComponent=undefined;that.runChild(route,params,url)})};this.runChild=function(route,params,url){if(typeof route.loadComponent==="function"){this.child=emptyCom();this.updateUI();this.loadCom(route,params,url)}else{this.params=params;this.initChildComponent(route.component);this.key=route.cache?url:"";this.model.child=this.key&&this.cacheObj[this.key]?this.getModelFromCache(this.key):this.child.init(this.dispatch,params);this.updateUI();if(typeof this.child.onViewInit==="function"){this.child.onViewInit(this.model,this.dispatch)}if(this.devTool){this.devTool.reset()}}};this.run=function(component){this.initMainComponent(component);this.model=this.mcom.init(this.dispatch);this.updateUI()};this.updateUI=function(){var newVnode=this.mcom.view({model:this.model,dispatch:this.dispatch.bind(this)});vnode=patch(vnode,newVnode)};this.dispatch=function(action){this.model=this.mcom.update(this.model,action);this.updateUI();if(this.devTool){this.devTool.setAction(action,this.model)}};this.fireDestroyEvent=function(){if(this.key){this.setModelToCache(this.key,this.model.child)}if(typeof this.child.onDestroy==="function"){this.child.onDestroy()}};this.destroy=function(path){try{if(this.child&&typeof this.child.canDeactivate==="function"){var res=this.child.canDeactivate();if(typeof res==="object"&&res.then){var that=this;res.then(function(val){if(val){window.location.href=path;that.fireDestroyEvent()}})}else if(res){window.location.href=path;this.fireDestroyEvent()}}else{window.location.href=path;this.fireDestroyEvent()}}catch(ex){console.log(ex)}};this.getModelFromCache=function(key){return this.cacheObj[key]||{}};this.setModelToCache=function(key,value){this.cacheObj[key]=value}}module.exports=bootstrap},{"./router":14,snabbdom:9,"snabbdom/h":2,"snabbdom/modules/class":5,"snabbdom/modules/eventlisteners":6,"snabbdom/modules/props":7,"snabbdom/modules/style":8}],13:[function(require,module,exports){const h=require("snabbdom/h");const jsx=require("snabbdom-jsx");const bootstrap=require("./core");const Router=require("./router");module.exports={h:h,html:jsx.html,svg:jsx.svg,bootstrap:bootstrap,Router:Router}},{"./core":12,"./router":14,"snabbdom-jsx":1,"snabbdom/h":2}],14:[function(require,module,exports){var Router={routes:[],locationStrategy:"hash",baseUrl:"/",CM:null,mainComponent:null,config:function(options){this.locationStrategy=options.locationStrategy=="history"&&!!history.pushState?"history":"hash";this.baseUrl=options.baseUrl?"/"+this.clearSlashes(options.baseUrl)+"/":"/";this.mainComponent=options.mainComponent;this.routes=options.routes||[];this.devTool=options.devTool;return this},getFragment:function(){var fragment="";if(this.locationStrategy==="history"){fragment=this.clearSlashes(decodeURI(location.pathname+location.search));fragment=fragment.replace(/\?(.*)$/,"");fragment=this.baseUrl!="/"?fragment.replace(this.baseUrl,""):fragment}else{var match=window.location.href.match(/#(.*)$/);fragment=match?match[1]:""}return this.clearSlashes(fragment)},clearSlashes:function(path){return path.toString().replace(/\/$/,"").replace(/^\//,"")},attach:function(cm){this.CM=new cm;this.CM.run(this.mainComponent);if(this.devTool){(new this.devTool).setCM(this.CM)}return this},add:function(router){this.routes.push(router);return this},remove:function(pathName){this.routes=this.routes.filter(function(it){return it.path!==pathName});return this},check:function(hash){var keys,match,routeParams;for(var i=0,max=this.routes.length;i<max;i++){if(this.clearSlashes(this.routes[i].path)===hash){this.render(this.routes[i],null,hash);return this}keys=this.routes[i].path.match(/:([^\/]+)/g);if(keys){routeParams={};match=hash.match(new RegExp(this.clearSlashes(this.routes[i].path).replace(/:([^\/]+)/g,"([^/]*)")));if(match){match.shift();match.forEach(function(value,i){routeParams[keys[i].replace(":","")]=value});this.render(this.routes[i],routeParams,hash);return this}}}return this},listen:function(){var that=this;window.addEventListener("hashchange",function(ev){that.check(that.getFragment())},false);Array.from(document.querySelectorAll("a")).forEach(function(it){it.addEventListener("click",function(ev){ev.preventDefault();if(that.clearSlashes(ev.target.href)===that.clearSlashes(window.location.href)){return}if(ev.target.href.indexOf("#")&&window.location.href.indexOf("#")===-1&&window.location.href.replace(/#(.*)$/,"")+"#"+that._fap===ev.target.href){return}that.CM.destroy(ev.target.href)},false)});return this},navigate:function(path){path=path?path:"";if(this.locationStrategy==="history"){history.pushState(null,null,this.baseUrl+this.clearSlashes(path))}else{window.location.href=window.location.href.replace(/#(.*)$/,"")+"#"+path}return this},_fap:"",setActivePath:function(path){if(path){if(!this._fap){this._fap=path[0]==="/"?path:"/"+path}this.check(this.clearSlashes(this.getFragment()||path))}},render:function(route,routeParams,url){window.activePath=route.path;this.CM.runChild(route,routeParams,url)}};module.exports=Router},{}]},{},[13])(13)});