(function(f){var g;if(typeof window!=='undefined'){g=window}else if(typeof self!=='undefined'){g=self}g.zaitun=f()})(function(){var define,module,exports;return (function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
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

function addNS(data, children) {
  data.ns = 'http://www.w3.org/2000/svg';
  if (children !== undefined) {
    for (var i = 0; i < children.length; ++i) {
      addNS(children[i].data, children[i].children);
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
    addNS(data, children);
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
      oldClass = oldVnode.data.class || {},
      klass = vnode.data.class || {};
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
var is = require('../is');

function arrInvoker(arr) {
  return function() {
    if (!arr.length) return;
    // Special case when length is two, for performance
    arr.length === 2 ? arr[0](arr[1]) : arr[0].apply(undefined, arr.slice(1));
  };
}

function fnInvoker(o) {
  return function(ev) { 
    if (o.fn === null) return;
    o.fn(ev); 
  };
}

function updateEventListeners(oldVnode, vnode) {
  var name, cur, old, elm = vnode.elm,
      oldOn = oldVnode.data.on || {}, on = vnode.data.on;
  if (!on) return;
  for (name in on) {
    cur = on[name];
    old = oldOn[name];
    if (old === undefined) {
      if (is.array(cur)) {
        elm.addEventListener(name, arrInvoker(cur));
      } else {
        cur = {fn: cur};
        on[name] = cur;
        elm.addEventListener(name, fnInvoker(cur));
      }
    } else if (is.array(old)) {
      // Deliberately modify old array since it's captured in closure created with `arrInvoker`
      old.length = cur.length;
      for (var i = 0; i < old.length; ++i) old[i] = cur[i];
      on[name]  = old;
    } else {
      old.fn = cur;
      on[name] = old;
    }
  }
  if (oldOn) {
    for (name in oldOn) {
      if (on[name] === undefined) {
        var old = oldOn[name];
        if (is.array(old)) {
          old.length = 0;
        }
        else {
          old.fn = null;
        }
      }
    }
  }
}

module.exports = {create: updateEventListeners, update: updateEventListeners};

},{"../is":4}],7:[function(require,module,exports){
function updateProps(oldVnode, vnode) {
  var key, cur, old, elm = vnode.elm,
      oldProps = oldVnode.data.props || {}, props = vnode.data.props || {};
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
      oldStyle = oldVnode.data.style || {},
      style = vnode.data.style || {},
      oldHasDel = 'delayed' in oldStyle;
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
    return VNode(api.tagName(elm).toLowerCase(), {}, [], undefined, elm);
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
      if (dotIdx > 0) elm.className = sel.slice(dot+1).replace(/\./g, ' ');
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
var Router = require('./router'),
    snabbdom = require('snabbdom'),
    vnode = null,
    cacheStrategy = 'default';

function bootstrap(options) {

    if (!options.containerDom) {
        throw new Error('mountNode must be a css selector or a dom object');
    }
    if (typeof options.containerDom === 'string') {
        vnode = document.querySelector(options.containerDom);
    } else {
        vnode = options.containerDom;
    }
    if (!(typeof options.mainComponent === 'object' || typeof options.mainComponent === 'function')) {
        throw new Error('bootstrap options: mainComponent missing.');
    }
    options.cm = ComponentManager;
    Router.config(options);
    cacheStrategy = options.cacheStrategy;
}
var patch = snabbdom.init([
        require('snabbdom/modules/class'), // makes it easy to toggle classes
        require('snabbdom/modules/props'), // for setting properties on DOM elements
        require('snabbdom/modules/style'), // handles styling on elements with support for animations
        require('snabbdom/modules/eventlisteners'), // attaches event listeners
    ]),
    h = require('snabbdom/h');

function emptyCom() {
    return {
        init: function () {
            return {};
        },
        view: function (obj) {
            return h('div.com-load', 'loading...');
        }
    };
}

function ComponentManager() {
    var mcom = {},
        model = {},
        params = null,
        key = '',
        cacheObj = {},
        active_route = null,
        _this = this;

    this.devTool = null;
    this.child = emptyCom();

    function initMainComponent(component) {
        if (typeof component === 'object') {
            mcom = component;
        } else if (typeof component === 'function') {
            mcom = new component();
        }
        validateCom(mcom);
    }

    function validateCom(com) {

        if (typeof com.init !== 'function') {
            com.init = function () {
                return {};
            };
        }
        if (typeof com.view !== 'function') {
            throw new Error('Component must have a view function.');
        }
    }

    function initChildComponent(component) {        
        //var cd=isInCache(key);
        // if(cd[0]){
        //       _this.child=cd[1].instance;
        //       return cd;
        // }  
        if (typeof component === 'object') {
            _this.child = component;
        }        
        else if (typeof component === 'function') {
            _this.child = new component();
        }
        validateCom(_this.child);
        //return cd;
    }

    function loadCom(route, params, url) {
        route.loadComponent().then(function (com) {
            route.component = com.default;
            route.loadComponent = undefined;
            _this.runChild(route, params, url);
        });
    }

    function updateUI() {
        var newVnode = mcom.view({
            model: model,
            dispatch: dispatch
        });
        vnode = patch(vnode, newVnode);
    }

    function dispatch(action) {
        model = mcom.update(model, action);
        updateUI();
        if (_this.devTool) {
            _this.devTool.setAction(action, model);
        } 
        if(active_route.cache && active_route.cacheUpdate_perStateChange){
            setComponentToCache(key, _this.child, model.child);           
        }       
    }    
    function fireDestroyEvent(path, callback) {
        var tid = setTimeout(function () {
            callback(path);
            clearTimeout(tid);
        }, 0);
        if (key) {            
            setComponentToCache(key, _this.child, model.child);
        }
        if (typeof _this.child.onDestroy === 'function') {
            _this.child.onDestroy();
        }

    }
    function isInCache(key){
        var data=key?getCacheData():{},
        hasCache=!!(key && data[key]),
        res=[hasCache];
        if(hasCache){
            res.push(data[key]);
        }
        return res;
    }
    function getComponentFromCache(key) {
        var data = getCacheData(); 
        return data[key] || {};
    }   
    function setComponentToCache(key, instance, state) { 
        var data = getCacheData();
        data[key] = {
                //instance: instance,
                state: state
            };
        if (getCacheStrategy() === 'session') {
            sessionStorage.setItem('app_cache', _this.json_stringify(data));
        } else if (getCacheStrategy() === 'local') {
            localStorage.setItem('app_cache', _this.json_stringify(data));
        } else {            
            cacheObj=data;
        }
    }

    function getCacheData() {
        if (getCacheStrategy() === 'session') {
            return _this.json_parse(sessionStorage.getItem('app_cache') || '{}');
        } else if (getCacheStrategy() === 'local') {
            return _this.json_parse(localStorage.getItem('app_cache') || '{}');
        }
        return cacheObj;
    }
    function getCacheStrategy(){
        return active_route.cacheStrategy?active_route.cacheStrategy:cacheStrategy;
    }
    this.updateCache=function(){
        if(key){
            setComponentToCache(key, _this.child, model.child); 
        }
    }
    this.json_parse=function(data){
        return JSON.parse(data);
    }
    this.json_stringify=function(data){
        return JSON.stringify(data);
    }
    this.reset = function () {
        model = mcom.init(dispatch, params);
        if (typeof this.child.init === 'function') {
            model.child = this.child.init(dispatch, params);
        }
        updateUI();
    }
    this.updateByModel = function (_model) {
        model = _model;
        updateUI();
    }
    this.runChild = function (route, _params, url) {
        if (typeof route.loadComponent === 'function') {
            this.child = emptyCom();
            updateUI();
            loadCom(route, _params, url);
        } else {
            active_route = route;
            params = _params;
            key = route.cache ? url : '';
            initChildComponent(route.component);
            var cd=isInCache(key);
            model.child = cd[0]? cd[1].state : this.child.init(dispatch, _params);
            updateUI();
            if (typeof this.child.afterViewRender === 'function') {
                this.child.afterViewRender(model, dispatch);
            }
            if (this.devTool) {
                this.devTool.reset();
            }
        }
    }
    this.run = function (component) {
        initMainComponent(component);
        model = mcom.init(dispatch);
        updateUI();
        if (typeof mcom.afterViewRender === 'function') {
            mcom.afterViewRender(model, dispatch);
        }
    }
    this.canActive = function (route, callback) {
        try {
            if (typeof route.canActivate === 'function') {
                var ref = new route.canActivate();
                if (typeof ref.canActivate === 'function') {
                    var res = ref.canActivate(Router);
                    if (typeof res === 'object' && res.then) {
                        res.then(function (val) {
                            callback(val);
                        });
                    } else {
                        callback(res);
                    }
                } else {
                    callback(true);
                }
            } else {
                callback(true);
            }
        } catch (e) {
            callback(false);
        }
    }
    this.destroy = function (path, callback) {
        try {
            if (this.child && typeof active_route.canDeactivate === 'function') {
                var ref = new active_route.canDeactivate();
                if (typeof ref.canDeactivate === 'function') {
                    var res = ref.canDeactivate(this.child, Router);
                    if (typeof res === 'object' && res.then) {
                        res.then(function (val) {
                            if (val) {
                                fireDestroyEvent(path, callback);
                            }
                        });
                    } else if (res) {
                        fireDestroyEvent(path, callback);
                    }
                } else {
                    fireDestroyEvent(path, callback);
                }
            } else {
                fireDestroyEvent(path, callback);
            }
        } catch (ex) {
            console.log(ex);
        }
    }

}
module.exports = bootstrap;
},{"./router":13,"snabbdom":9,"snabbdom/h":2,"snabbdom/modules/class":5,"snabbdom/modules/eventlisteners":6,"snabbdom/modules/props":7,"snabbdom/modules/style":8}],12:[function(require,module,exports){

var h =require('snabbdom/h');
var jsx =require('snabbdom-jsx');
var bootstrap =require('./core');
var Router =require('./router');

module.exports= {h:h, html:jsx.html, svg:jsx.svg, bootstrap:bootstrap, Router:Router, jsx:jsx}
},{"./core":11,"./router":13,"snabbdom-jsx":1,"snabbdom/h":2}],13:[function(require,module,exports){

var Router = (function (window) {
    var routes = [],
        locationStrategy = 'hash',
        baseUrl = '/',
        originalUrl = window.location.origin,
        CM = null,
        options = {},
        devTool, _fap = '',
        mainComponent = null,
        _router = {activeRoute:{}};

    function clearSlashes(path) {
        return path.toString().replace(/\/$/, '').replace(/^\//, '');
    }

    function attach(cm) {
        CM = new cm();
        _router.CM = CM;
        CM.run(mainComponent);
        if (devTool) {
            new devTool().setCM(CM);
        }
    }

    function getFragment() {        
        var fragment = '';
        if (locationStrategy === 'history') {
            fragment = window.location.href.replace(originalUrl + baseUrl, '');
        } else {
            var match = window.location.href.match(/#(.*)$/);
            fragment = match ? match[1] : '';
        }
        if(!fragment && options.activePath){fragment=options.activePath;}       
        return clearSlashes(fragment);
    }

    function listen() {
        var checkCalled = false;
        window.addEventListener("popstate", function (ev) {            
            checkCalled = true;
            check(getFragment());
        }, false);
        window.addEventListener("hashchange", function (ev) {            
            if (!checkCalled) {                
                check(getFragment());
            }
            checkCalled = false;
        }, false);

        Array.from(document.querySelectorAll('a')).forEach(function (it) {
            it.addEventListener('click', function (ev) {
                ev.preventDefault();
                if (clearSlashes(it.href) === clearSlashes(window.location.href)) {
                    return;
                }
                if (it.href.indexOf('#') &&
                    window.location.href.indexOf('#') === -1 &&
                    window.location.href.replace(/#(.*)$/, '') + '#' + _fap === it.href) {
                    return;
                }
                destroy(it.href, getRoute(it.href));
            }, false);
        });
    }

    function destroy(path, route) {
        CM.canActive(route, function (isActive) {
            if (isActive) {
                route._ca_checked = true;
                CM.destroy(path, function (path) {
                    if (locationStrategy === 'hash') {
                        window.location.href = path;
                    } else {
                        path = path.replace(originalUrl + baseUrl, '');
                        history.pushState({
                            x: 1
                        }, null, baseUrl + clearSlashes(path));
                        check(path);
                    }
                });
            }
        });
    }

    function getRoute(hash) {
        var keys, match;
        if (hash.indexOf('#') !== -1) {
            match = hash.match(/#(.*)$/);
            hash = match ? match[1] : '';
        } else if(locationStrategy==='history'){
            hash = hash.replace(originalUrl + baseUrl, '');
        }
        hash = clearSlashes(hash);
        for (var i = 0, max = routes.length; i < max; i++) {
            if (clearSlashes(routes[i].path) === hash) {
                return routes[i];
            }
            keys = routes[i].path.match(/:([^\/]+)/g);
            if (keys) {
                match = hash.match(new RegExp(clearSlashes(routes[i].path).replace(/:([^\/]+)/g, "([^\/]*)")));
                if (match) {
                    return routes[i];
                }
            }
        }
        return null;
    }

    function check(hash) {
        var keys, match, routeParams;
        for (var i = 0, max = routes.length; i < max; i++) {
            if (clearSlashes(routes[i].path) === hash) {
                render(routes[i], null, hash);
                return;
            }
            keys = routes[i].path.match(/:([^\/]+)/g);
            if (keys) {
                routeParams = {}
                match = hash.match(new RegExp(clearSlashes(routes[i].path).replace(/:([^\/]+)/g, "([^\/]*)")));
                if (match) {
                    match.shift();
                    match.forEach(function (value, i) {
                        routeParams[keys[i].replace(":", "")] = value;
                    });
                    render(routes[i], routeParams, hash);
                    return;
                }
            }
        }
        return;
    }

    function setActivePath(path) {
        if (path) {
            if (!_fap) {
                _fap = path[0] === '/' ? path : '/' + path;
            }
            check(clearSlashes(getFragment() || path));
        }
    }

    function render(route, routeParams, url) {
        if (route._ca_checked) {
            renderHelper(route, routeParams, url);
        } else {
            CM.canActive(route, function (isActive) {
                if (isActive) {
                    renderHelper(route, routeParams, url);
                }
            });
        }

    }

    function renderHelper(route, routeParams, url) {
        route._ca_checked = false;
        route.routeParams = routeParams;
        route.navPath = url;
        _router.activeRoute = {
            routeParams: routeParams,
            path: route.path,
            navPath: url,
            data: route.data || {}
        };
        CM.runChild(route, routeParams, url);
    }

    _router.config = function (_options) {
        options = _options;
        locationStrategy = options.locationStrategy == 'history' && !!(history.pushState) ? 'history' : 'hash';
        baseUrl = options.baseUrl ? '/' + clearSlashes(options.baseUrl) + '/' : '/';
        mainComponent = options.mainComponent;
        routes = options.routes || [];
        devTool = options.devTool;
        attach(options.cm);
        listen();
        setActivePath(options.activePath);
        return this;
    }
    _router.add = function (router) {
        routes.push(router);

    }
    _router.remove = function (pathName) {
        this.routes = this.routes.filter(function (it) {
            return it.path !== pathName;
        });
    }
    _router.navigate = function (path) {
        var tid = setTimeout(function () {            
            path = path ? path : '';
            if (locationStrategy === 'history') {
                history.pushState(null, null, baseUrl + clearSlashes(path));
                destroy(baseUrl + clearSlashes(path), getRoute(path));
            } else {
                destroy(window.location.href.replace(/#(.*)$/, '') + '#' + path, getRoute(path));
            }
            clearTimeout(tid);
        }, 0);

    }
    return _router;
})(window);

module.exports = Router;
},{}]},{},[12])(12)
});