import { VNode } from './vnode';
export * from './h';

export interface Action{
    type:string;
    payload?:any;
}
interface comDef{
    view:(obj:any)=>VNode;
    update:(model:any, action:Action)=>void;
}
interface childDef{
    child:comDef;
}
interface RouterDef{
    navigate:(path:string)=>void;
    add:(route:any)=>void;
    remove:(path:string)=>void;
    CM:childDef;
}

export declare const Router:RouterDef;
interface bootstrapConfig{
    containerDom:string|any;
    mainComponent:any;
    routes?:Array<any>;
    activePath?:string;
    devTool?:any;
    locationStrategy?:'hash'|'history';
}

export declare function bootstrap(config:bootstrapConfig):void;
interface jsxDef{
    html:()=>void;
    svg:()=>void;
}
export declare const jsx: jsxDef;
