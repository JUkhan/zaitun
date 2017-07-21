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