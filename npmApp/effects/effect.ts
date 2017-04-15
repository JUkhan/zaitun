import {Subscription} from 'rxjs/Subscription';
import {Observable} from 'rxjs/Observable';
import {Subject} from 'rxjs/Subject';
import {filter} from 'rxjs/operator/filter';


export class Actions extends Subject<any>{
    dispatch(action:any, model:any={}){
        action.model=model;
        this.next(action);
    }
    whenAction(...types:any[]){        
        return filter.call(this,((action:any)=>Boolean(types.find(type=>type===action.type))));
    }
}
export class EffectSubscription extends Subscription{
    constructor(private comDispatch:any){
        super();
    }
    addEffect(actionStream:Observable<any>){
        this.add(actionStream.subscribe(ac=>{
            this.comDispatch(ac);
        }));
    }
    add(subscription:any){
        this.add(subscription);
    }
    dispose(){
        if(!this.closed){            
            this.unsubscribe();
        }
    }
}