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