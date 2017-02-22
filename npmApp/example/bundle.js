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

},{"./is":4,"./vnode":10}],3:[function(require,module,exports){
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

},{}],4:[function(require,module,exports){
module.exports = {
  array: Array.isArray,
  primitive: function(s) { return typeof s === 'string' || typeof s === 'number'; },
};

},{}],5:[function(require,module,exports){
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

},{}],6:[function(require,module,exports){
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

},{}],7:[function(require,module,exports){
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

},{}],8:[function(require,module,exports){
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

},{}],9:[function(require,module,exports){
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

},{"./htmldomapi":3,"./is":4,"./vnode":10}],10:[function(require,module,exports){
module.exports = function(sel, data, children, text, elm) {
  var key = data === undefined ? undefined : data.key;
  return {sel: sel, data: data, children: children,
          text: text, elm: elm, key: key};
};

},{}],11:[function(require,module,exports){

const Router =require('./router');
const snabbdom =require('snabbdom');

var newVnode=null;
var vnode=null;

function bootstrap(options){   
    DOMReady(()=>{
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

class ComponentManager{
    constructor(){
        this.mcom={};
        this.child={
            init(){return {};}, 
            view({}){return h('div','loading...');}
        };
        this.model={};
        this.params=null;
        this.devTool=null;
        this.key='';
        this.cacheObj={};
    }
    initMainComponent(component){
        
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
    initChildComponent(component){
        
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
    reset(){
        this.model=this.mcom.init(this.dispatch, this.params);
        if(typeof this.child.init ==='function'){
             this.model.child=this.child.init(this.dispatch, this.params);
        }       
        this.updateUI();
    }
    updateByModel(model){
        this.model=model;
        this.updateUI();
    }    
    runChild(route, params, url){
        this.params=params;
        this.initChildComponent(route.component);
        this.key=route.cache?url:'';
        this.model.child=this.key && this.cacheObj[this.key]?this.getModelFromCache(this.key):this.child.init(this.dispatch, params);        
        this.updateUI();
        if(this.devTool){
            this.devTool.reset();
        }      
    }
    run(component){        
        this.initMainComponent(component);
        this.model=this.mcom.init(this.dispatch);        
        this.updateUI();            
    }
    updateUI() {
        const newVnode = this.mcom.view({model:this.model, dispatch:this.dispatch.bind(this)});
        vnode = patch(vnode, newVnode);
    }

    dispatch(action) {        
        this.model = this.mcom.update(this.model, action);  
        if(this.devTool){
            this.devTool.setAction(action, this.model);
        }      
        this.updateUI();
    }
    fireDestroyEvent(){
       
            if(this.key){
                this.setModelToCache(this.key, this.model.child);
            }
            if(typeof this.child.onDestroy==='function'){
                this.child.onDestroy();
            }

    }
    destroy(path){
        try{
               if(this.child && typeof this.child.canDeactivate==='function'){
                   const res=this.child.canDeactivate();
                   if(typeof res === 'object' && res.then){
                       res.then(val=>{
                            if(val){
                                 window.location.href=path;
                                 this.fireDestroyEvent();
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
    getModelFromCache(key){
        return  this.cacheObj[key]||{};
    }
    setModelToCache(key, value){
         this.cacheObj[key]=value;
    }
}
//export default bootstrap;
module.exports=bootstrap;
},{"./router":14,"snabbdom":9,"snabbdom/h":2,"snabbdom/modules/class":5,"snabbdom/modules/eventlisteners":6,"snabbdom/modules/props":7,"snabbdom/modules/style":8}],12:[function(require,module,exports){

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
},{"snabbdom":9,"snabbdom/h":2,"snabbdom/modules/class":5,"snabbdom/modules/eventlisteners":6,"snabbdom/modules/props":7,"snabbdom/modules/style":8}],13:[function(require,module,exports){

const h =require('snabbdom/h');
const {html, svg} =require('snabbdom-jsx');
const bootstrap =require('./core');
const Router =require('./router');

module.exports= {h, html, svg, bootstrap, Router}
},{"./core":11,"./router":14,"snabbdom-jsx":1,"snabbdom/h":2}],14:[function(require,module,exports){
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
    attach(cm){
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
        this.routes=this.routes.filter(it=>it.path!==pathName);
        return this;
    },   
    check: function (hash) {
        var reg, keys, match, routeParams;
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

        window.addEventListener("hashchange", (ev)=>{             
             this.check(this.getFragment());
        }, false);

        Array.from(document.querySelectorAll('a')).forEach(it=>{
            it.addEventListener('click',ev=>{
               ev.preventDefault();
               if(this.clearSlashes(ev.target.href)===this.clearSlashes(window.location.href)) {return;} 
               this.CM.destroy(ev.target.href);
            },false);
        })
        return this;
    },
    navigate: function(path) {
        path = path ? path : '';
        if(this.locationStrategy === 'history') {
            history.pushState(null, null, this.baseUrl + this.clearSlashes(path));
        } else {
            window.location.href = window.location.href.replace(/#(.*)$/, '') + '#' + path;
        }
        return this;
    },    
    setActivePath(path){  
        if(path){    
            this.check(this.clearSlashes(this.getFragment()||path));
        }
    },
    render(route, routeParams, url){   
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

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }(); /** @jsx html */

var _zaitun = require('zaitun');

var _juForm = require('./ui/juForm/juForm');

var _clsCounter = require('./clsCounter');

var _clsCounter2 = _interopRequireDefault(_clsCounter);

var _clsCounterList = require('./clsCounterList');

var _clsCounterList2 = _interopRequireDefault(_clsCounterList);

var _todos = require('./todos/todos');

var _todos2 = _interopRequireDefault(_todos);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var JuForm = new _juForm.juForm();
var Counter = new _clsCounter2.default();
var CounterList = new _clsCounterList2.default();
var TodosCom = new _todos2.default();

var FormExample = function () {
    function FormExample() {
        _classCallCheck(this, FormExample);
    }

    _createClass(FormExample, [{
        key: 'init',
        value: function init(dispatch) {
            var model = { counter: Counter.init(), name: 'Abdulla', age: 32, gender: 2 };
            model.options = this.getFormOptions(model, dispatch);
            model.counterList = CounterList.init();
            model.todos = TodosCom.init();
            return model;
        }
        //{field:'age',  label:'Adress', type:'number', size:4, warning:'warning', info:'hello info',elmSize:'sm'}

    }, {
        key: 'getFormOptions',
        value: function getFormOptions(model, dispatch) {

            return {
                viewMode: 'form', name: 'form1', labelSize: 1, labelPos: 'left', title: 'Form Title',
                inputs: [[{ field: 'age', required: true, danger: 'danger', label: 'Adress', type: 'text', size: 3 }, { field: 'age2', label: 'Adress2', success: true, type: 'text', size: 3 }], { field: 'gender', required: true, ignoreLabelSWD: 1, warning: 'warning', on: { change: function change(val) {
                            return console.log(val);
                        } }, size: 5, type: 'select', label: 'Gender', data: [{ text: 'Male', value: 1 }, { text: 'Female', value: 2 }] }, { type: 'tabs', activeTab: 'Counter', footer: (0, _zaitun.html)(
                        'div',
                        null,
                        'Footer'
                    ), tabs: {
                        Counter: { inputs: [{ type: 'vnode', vnode: (0, _zaitun.html)('div', { style: { height: '20px' } }) }, { size: 3,
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
                            }] }
                    } }]
            };
        }
    }, {
        key: 'view',
        value: function view(_ref) {
            var model = _ref.model,
                dispatch = _ref.dispatch;

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
                        'Hide Name'
                    )
                ),
                (0, _zaitun.html)(JuForm, { model: model, dispatch: dispatch, options: model.options })
            );
        }
    }, {
        key: 'update',
        value: function update(model, action) {
            switch (action.type) {
                case 'Counter':
                    var res = Counter.update(model.counter, action.action);
                    return _extends({}, model, { counter: res });
                case 'CounterList':
                    var rescl = CounterList.update(model.counterList, action.action);
                    return _extends({}, model, { counterList: rescl });

                case 'Todos':
                    var todos = TodosCom.update(model.todos, action.action);
                    return _extends({}, model, { todos: todos });
                case _juForm.TAB_CLICK:
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
            //JuForm.optionsChanged();
            JuForm.setSelectData('gender', [{ text: 'Male--', value: 1 }, { text: 'Female--', value: 2 }]);
            JuForm.showModal(true);
        }
    }]);

    return FormExample;
}();

exports.default = FormExample;

},{"./clsCounter":16,"./clsCounterList":17,"./todos/todos":21,"./ui/juForm/juForm":22,"zaitun":13}],16:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }(); /** @jsx html */

var _zaitun = require('zaitun');

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var INC = Symbol('inc');
var DEC = Symbol('dec');

var clsCounter = function () {
    function clsCounter() {
        _classCallCheck(this, clsCounter);
    }

    _createClass(clsCounter, [{
        key: 'init',
        value: function init() {
            return { data: 10 };
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

    return clsCounter;
}();

exports.default = clsCounter;

},{"zaitun":13}],17:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }(); /** @jsx html */

var _zaitun = require('zaitun');

var _clsCounter = require('./clsCounter');

var _clsCounter2 = _interopRequireDefault(_clsCounter);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } else { return Array.from(arr); } }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var Counter = new _clsCounter2.default();

var ADD = Symbol('add');
var REMOVE = Symbol('remove');
var RESET = Symbol('reset');
var UPDATE = Symbol('counterAction');

var clsCounterList = function () {
    function clsCounterList() {
        _classCallCheck(this, clsCounterList);
    }

    _createClass(clsCounterList, [{
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

    return clsCounterList;
}();

exports.default = clsCounterList;

},{"./clsCounter":16,"zaitun":13}],18:[function(require,module,exports){
'use strict';

var _zaitun = require('zaitun');

var _devTool = require('zaitun/devTool/devTool');

var _devTool2 = _interopRequireDefault(_devTool);

var _clsCounter = require('./clsCounter');

var _clsCounter2 = _interopRequireDefault(_clsCounter);

var _clsCounterList = require('./clsCounterList');

var _clsCounterList2 = _interopRequireDefault(_clsCounterList);

var _todos = require('./todos/todos');

var _todos2 = _interopRequireDefault(_todos);

var _FormExample = require('./FormExample');

var _FormExample2 = _interopRequireDefault(_FormExample);

var _mainCom = require('./mainCom');

var _mainCom2 = _interopRequireDefault(_mainCom);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var routes = [{ path: "/counter", component: _clsCounter2.default }, { path: '/counterList', component: _clsCounterList2.default }, { path: '/todos', component: _todos2.default }, { path: '/formExample', component: _FormExample2.default, cache: true }];

(0, _zaitun.bootstrap)({
  containerDom: '#placeholder',
  mainComponent: _mainCom2.default,
  //locationStrategy:'hash',
  routes: routes,
  activePath: '/counter',
  devTool: _devTool2.default
});

},{"./FormExample":15,"./clsCounter":16,"./clsCounterList":17,"./mainCom":19,"./todos/todos":21,"zaitun":13,"zaitun/devTool/devTool":12}],19:[function(require,module,exports){
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

},{"zaitun":13}],20:[function(require,module,exports){
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

},{"zaitun":13}],21:[function(require,module,exports){
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

},{"./task":20,"zaitun":13}],22:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.TAB_CLICK = exports.juForm = undefined;

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _h = require('snabbdom/h');

var _h2 = _interopRequireDefault(_h);

var _utils = require('../utils');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } else { return Array.from(arr); } }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var TAB_CLICK = Symbol('TAB_CLICK');
var OptionsChanged = Symbol('OptionsChanged');

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
                dispatch = _ref.dispatch,
                options = _ref.options;

            this.dispatch = dispatch;
            this.options = options;
            this.model = model;
            var vnodes = (0, _h2.default)('div.juForm', this.createElements(options));
            return options.viewMode === 'form' ? vnodes : this.createModal(vnodes, this.modalId);
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
            this.showModal(false);
            if (typeof this.options.modalClose === 'function') {
                this.options.modalClose();
            }
        }
    }, {
        key: 'createModal',
        value: function createModal(vnodes, id) {
            var _this2 = this;

            var buttons = this.options.buttons || [];
            return (0, _h2.default)('div.modal', { props: { id: id } }, [(0, _h2.default)('div.modal-dialog', { role: 'document' }, [(0, _h2.default)('div.modal-content', [(0, _h2.default)('div.modal-header', [(0, _h2.default)('div.modal-title', this.options.title || ''), (0, _h2.default)('button.close', { data: { dismiss: 'modal' }, aria: { label: 'Close' }, on: { click: function click(e) {
                        return _this2.modalClose();
                    } } }, [(0, _h2.default)('span', { aria: { hidden: 'true' } }, '×')])]), (0, _h2.default)('div.modal-body', [vnodes]), (0, _h2.default)('div.modal-footer', buttons.map(this.createButtonElm.bind(this)))])])]);
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
                                velms.push((0, _h2.default)('div.col-md-' + (item.size || 6), _this3.createTabs(elm)));
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
                                velms.push((0, _h2.default)('div.col-md-' + (elm.size || 6), [elm.component.view({
                                    model: elm.field ? _this3.model[elm.field] : _this3.model,
                                    dispatch: function dispatch(a) {
                                        return _this3.dispatch({ type: elm.actionType, action: a });
                                    }
                                })]));
                                break;
                            case 'vnode':
                                vnodes.push((0, _h2.default)('div.col-md-' + (elm.size || 6), [elm.vnode]));
                                break;
                            default:
                                velms.push.apply(velms, _toConsumableArray(_this3.createElement(elm, index)));
                                break;
                        }
                    });
                    vnodes.push((0, _h2.default)('div.form-group.row', velms));
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
                    vnodes.push((0, _h2.default)('div.form-group.row', [this.createButton(item, index)]));
                    break;
                case 'checkbox':case 'radio':
                    vnodes.push((0, _h2.default)('div.form-group.row', [this.createCheckbox(item, index)]));
                    break;
                case 'label':
                    vnodes.push((0, _h2.default)('div.form-group.row', [this.createLabel(item, index)]));
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
                    vnodes.push((0, _h2.default)('div.form-group.row' + (item.ignoreLabelSWD ? '' : state[0]), this.createElement(item, index)));
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
                return (0, _h2.default)('span', { style: { display: 'none' } }, 'hide');
            }
            var velms = [];
            if (item.legend) {
                velms.push((0, _h2.default)('legend', item.legend));
            }
            velms.push.apply(velms, _toConsumableArray(this.createElements(item)));
            return (0, _h2.default)('fieldset.col-md-' + (item.size || 12), { props: { disabled: !!item.disabled } }, velms);
        }
    }, {
        key: 'createTabs',
        value: function createTabs(item) {
            var _this4 = this;

            var elms = [],
                lies = [],
                tabcontents = [],
                tabNames = Object.keys(item.tabs);
            var tabLink = item.activeTab;
            tabNames.forEach(function (tabName) {
                var tabId = '#' + tabName.replace(/\s+/, '_###_');
                var disabled = !!item.tabs[tabName].disabled;
                var hide = !!item.tabs[tabName].hide;
                if (!hide) {
                    lies.push((0, _h2.default)('li.nav-item', [(0, _h2.default)('a.nav-link', {
                        props: { href: tabId },
                        class: { active: item.activeTab === tabName, disabled: disabled },
                        on: { click: function click(e) {
                                e.preventDefault();
                                if (disabled) {
                                    return;
                                }
                                if (tabLink === tabName) {
                                    return;
                                }
                                tabLink = tabName;
                                _this4.selectTab(tabName, item);
                            }
                        }
                    }, tabName)]));
                    //tab contents 
                    if (tabName === tabLink) {
                        tabcontents.push((0, _h2.default)('div.tab-item', _this4.createElements(item.tabs[tabName])));
                    }
                }
            });
            //elms.push(h(`ul.nav.nav-tabs.justify-content-${item.tabPos||'start'}`, lies));       
            //elms.push(h('div.tab-content', tabcontents));   
            elms.push((0, _h2.default)('div.card', [(0, _h2.default)('div.card-header', [(0, _h2.default)('ul.nav nav-tabs card-header-tabs pull-xs-left', lies)]), (0, _h2.default)('div.card-block', tabcontents), item.footer ? (0, _h2.default)('div.card-footer', [item.footer]) : '']));
            return elms;
        }
    }, {
        key: 'getListener',
        value: function getListener(item) {
            var _this5 = this;

            var events = {},
                hasChange = null,
                modelUpdateEvent = 'change';
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
                _this5.model[item.field] = e.target.value;
                if (hasChange) {
                    hasChange(e.target.value, e);
                }
            };
            return events;
        }
    }, {
        key: 'createLabel',
        value: function createLabel(item, index) {
            if (item.hide) return [];
            return (0, _h2.default)('div.col-md-' + (item.size || 4), [(0, _h2.default)('label', { on: item.on, style: item.style, class: item.class, props: { type: item.type, disabled: !!item.disabled } }, item.label)]);
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
            return (0, _h2.default)('div.col-md-' + (item.size || 4), buttons);
        }
    }, {
        key: 'createButtonElm',
        value: function createButtonElm(item) {
            var index = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 0;

            return (0, _h2.default)('button' + (item.elmSize ? '.btn-' + item.elmSize : ''), { key: index, on: this.getListener(item), style: item.style, class: item.class, props: { type: item.type, disabled: !!item.disabled } }, item.label);
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
            return (0, _h2.default)('div.col-md-' + (item.size || 4), buttons);
        }
    }, {
        key: 'createCheckboxElm',
        value: function createCheckboxElm(item, index, inline) {
            var elms = [];
            if (item.labelPos === 'left') {
                elms.push((0, _h2.default)('text', item.label));
                elms.push((0, _h2.default)('input.form-check-input', { on: this.getListener(item), style: item.style, class: item.class, props: { type: item.type, disabled: item.disabled, name: item.name || 'oo7', value: item.value } }));
            } else {
                elms.push((0, _h2.default)('input.form-check-input', { on: this.getListener(item), style: item.style, class: item.class, props: { type: item.type, disabled: item.disabled, name: item.name || 'oo7', value: item.value } }));
                elms.push((0, _h2.default)('text', item.label));
            }
            return (0, _h2.default)('div.form-check', { class: { 'form-check-inline': inline, disabled: item.disabled } }, [(0, _h2.default)('label.form-check-label', elms)]);
        }
    }, {
        key: '_getLabelText',
        value: function _getLabelText(item) {
            var labelItems = [item.label];
            if (item.required) {
                labelItems.push((0, _h2.default)('span.required', '*'));
            }
            return labelItems;
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
                children.push((0, _h2.default)('label.col-form-label' + (item.elmSize ? '.col-form-label-' + item.elmSize : ''), this._getLabelText(item)));
            }
            if (item.type === 'select') {
                children.push(this.createSelect(item, state));
            } else {
                children.push((0, _h2.default)('input.form-control' + state[1] + (item.elmSize ? '.form-control-' + item.elmSize : ''), { on: this.getListener(item), style: item.style, class: item.class, props: { type: item.type, value: this.model[item.field], disabled: !!item.disabled } }));
            }
            if (state[2]) {
                children.push((0, _h2.default)('div.form-control-feedback', state[2]));
            }
            if (item.info) {
                children.push((0, _h2.default)('small.form-text.text-muted', item.info));
            }
            if (labelPos === 'left' && item.label) {
                var labelSize = item.labelSize || this.options.labelSize || 2;
                childrenWithLabel.push((0, _h2.default)('label.col-form-label' + (item.elmSize ? '.col-form-label-' + item.elmSize : '') + ('.col-md-' + labelSize), this._getLabelText(item)));
            }
            childrenWithLabel.push((0, _h2.default)('div.col-md-' + (item.size || 4) + state[0], children));
            return childrenWithLabel;
        }
    }, {
        key: 'createSelect',
        value: function createSelect(item, state) {
            if (!item.data) item.data = [];
            return (0, _h2.default)('select.form-control' + state[1] + (item.elmSize ? '.form-control-' + item.elmSize : ''), { on: this.getListener(item), style: item.style, class: item.class, props: { type: item.type, value: this.model[item.field], disabled: !!item.disabled, multiple: !!item.multiple } }, item.data.map(function (it, index) {
                return (0, _h2.default)('option', { props: { value: it.value, key: index } }, it.text);
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
                        var find = Object.keys(item.tabs).find(function (tn) {
                            return tn === tabName;
                        });
                        if (find) {
                            return item;
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
            var _this8 = this;

            var item = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : null;

            if (!item) {
                item = this.findTab(tabName);
            }
            if (item) {
                var res = typeof item.click === 'function' ? item.click(tabName) : true;
                if (typeof res === 'boolean') {
                    if (res) {
                        item.activeTab = tabName;
                        this.dispatch({ type: TAB_CLICK, form: this.options.name || 'oo7', payload: this.model });
                    }
                } else if ((typeof res === 'undefined' ? 'undefined' : _typeof(res)) === 'object' && res.then) {
                    res.then(function (isTrue) {
                        if (isTrue) {
                            item.activeTab = tabName;
                            _this8.dispatch({ type: TAB_CLICK, form: _this8.options.name || 'oo7', payload: _this8.model });
                        }
                    });
                }
            }
        }
    }, {
        key: 'optionsChanged',
        value: function optionsChanged() {
            this.dispatch({ type: OptionsChanged });
        }
    }, {
        key: 'showModal',
        value: function showModal(isOpen) {
            $('#' + this.modalId).modal(isOpen ? 'show' : 'hide');
        }
    }, {
        key: 'setSelectData',
        value: function setSelectData(fieldName, data) {
            var item = this.findField(fieldName);
            if (item) {
                item.data = data;
                this.optionsChanged();
            }
        }
    }]);

    return juForm;
}();

exports.juForm = juForm;
exports.TAB_CLICK = TAB_CLICK;

},{"../utils":23,"snabbdom/h":2}],23:[function(require,module,exports){
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

},{}]},{},[18]);