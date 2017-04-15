import {Subscription} from 'rxjs/Subscription';
import {Observable} from 'rxjs/Observable';
import {Subject} from 'rxjs/Subject';
import {filter} from 'rxjs/operator/filter';

export class Actions extends Subject{
    dispatch(action, model={}){
        action.model=model;
        this.next(action);
    }
    whenAction(...types){        
        return filter.call(this,((action)=>Boolean(types.find(type=>type===action.type))));
    }
}
export class EffectSubscription extends Subscription{
    constructor(comDispatch){
        super();
        this.comDispatch=comDispatch;
    }
    addEffect(actionStream){
        this.add(actionStream.subscribe(ac=>{
            this.comDispatch(ac);
        }));
    }
    add(subscription){
        this.add(subscription);
    }
    dispose(){
        if(!this.closed){            
            this.unsubscribe();
        }
    }
}