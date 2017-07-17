
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