/** @jsx html */

import { html } from 'zaitun';

const  Toggle            = Symbol('Toggle')
const  StartEditing      = Symbol('StartEditing')
const  CommitEditing     = Symbol('CommitEditing')
const  CancelEditing     = Symbol('CancelEditing')

class Task{

    init(id, title) {
        return { id, title, done: false, editing: false, editingValue: '' };
    }
    onInput(e, handler){
        if(e.keyCode===13){
            handler({type:CommitEditing, value:e.target.value});
        }
    }
    view({model, handler, onRemove}){
       
        return <li
        classNames="list-group-item"
        key={model.id}
        >
            <div selector=".view" style-display={!model.editing?'block':'none'}
             style={({opacity: '0', transition: 'opacity 1s', delayed: {opacity: '1'}})}>
                <input
                    selector=".toggle"
                    type="checkbox"
                    checked={!!model.done}
                    on-click={e=>handler({type:Toggle, checked:e.target.checked})}
                 />

                <label on-dblclick={handler.bind(null,{type:StartEditing})} style-color={model.done?'red':'black'}>{model.title}</label>
                <button selector=".btn .btn-link" on-click={onRemove}>&times;</button>
            </div>
            <input
                classNames="form-control"
                style-display={model.editing?'block':'none'}
                on-keydown={e=>this.onInput(e, handler)}
                on-blur={handler.bind(null,{type:CancelEditing})}
                value={model.title}
            />
        </li>
    }
    update(model, action){
          
        switch (action.type) {
            case Toggle:            return {...model, done: action.checked}
            case StartEditing:      return {...model, editing:true, editingValue:model.title}
            case CommitEditing:     return {...model, title:action.value, editing:false, editingValue:''}
            case CancelEditing:     return {...model, editing:false}
            default:                return model;
        }
    }
}

export default {Task, Toggle}