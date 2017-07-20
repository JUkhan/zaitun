import { VNode } from './vnode';
export * from './h';

export interface Action {
    type: string;
    payload?: any;
}
interface comDef {
    view: (obj: any) => VNode;
    update: (model: any, action: Action) => void;
}
interface childDef {
    child: comDef;
    action$: any;
    json_parse:(data:any)=>any;
    json_stringify:(data:any)=>any;
    updateCache:()=>any;
}
interface RouterDef {
    navigate: (path: string) => void;
    add: (route: any) => void;
    remove: (path: string) => void;
    activeRoute: {
        routeParams: { [key: string]: any},
        path: string,
        navPath: string,
        data: { [key: string]: any}
    };
    CM: childDef;
}

export declare const Router: RouterDef;
export interface IRoute{
    path:string;
    cache?:boolean;
    component?:any;
    loadComponent?:any;
    canActivate?:Function;
    canDeactivate?:Function;
    cacheUpdate_perStateChange?:boolean;
    cacheStrategy?: 'session' | 'local' | 'default';
}
interface bootstrapConfig {
    containerDom: string | any;
    mainComponent: any;
    routes?: Array<IRoute>;
    activePath?: string;
    devTool?: any;
    locationStrategy?: 'hash' | 'history';
    baseUrl?: string;
    cacheStrategy?: 'session' | 'local' | 'default';
}


export declare function bootstrap(config: bootstrapConfig): void;
interface jsxDef {
    html: () => void;
    svg: () => void;
}
export declare const jsx: jsxDef;

