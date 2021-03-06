import { Hooks } from './hooks';
export declare type Key = string | number;
export interface VNode {
    sel: string | undefined;
    data: VNodeData | undefined;
    children: Array<VNode | string> | undefined;
    elm: Node | undefined;
    text: string | undefined;
    key: Key;
}
export interface VNodeData {
    props?: any;
    attrs?: any;
    class?: any;
    style?: any;
    dataset?: any;
    on?: any;
    hero?: any;
    attachData?: any;
    hook?: Hooks;
    key?: Key;
    ns?: string;
    fn?: () => VNode;
    args?: Array<any>;
    [key: string]: any;
}
export declare function vnode(sel: string | undefined, data: any | undefined, children: Array<VNode | string> | undefined, text: string | undefined, elm: Element | Text | undefined): VNode;
export default vnode;
