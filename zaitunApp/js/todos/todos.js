/** @jsx html */

import { html } from 'zaitun';
import {Task, Toggle} from './task';
const TaskCom=new Task();

const KEY_ENTER=13;
const MODIFY        = Symbol('MODIFY');
const ADD           = Symbol('ADD');
const REMOVE        = Symbol('REMOVE');
const FILTER        = Symbol('FILTER');
const ARCHIVE       = Symbol('ARCHIVE');
const TOGGLE_ALL    = Symbol('TOGGLE_ALL');

export default class Todos{
    init(dispatch){
        return {nextId:1, tasks:[], filter:'all', todoInput:''};
    }
    onInput(e, dispatch){
        if(e.keyCode===KEY_ENTER){
            dispatch({type:ADD, title:e.target.value});
        }
    }
    view({model, dispatch}){
        const remaining = this.remainingTodos(model.tasks);
        const filtered=this.filteredTodos(model.tasks, model.filter);
        return <div classNames="card ">
                    <div classNames="card-header">Todos</div>
                    <div classNames="card-block">
                        <div classNames="form-inline">
                            <input on-click={e=>dispatch({type:TOGGLE_ALL, done:e.target.checked})} classNames="fform-check-input" type="checkbox" />
                            <input 
                                on-keydown={e=>this.onInput(e, dispatch)} 
                                classNames="form-control" 
                                value={model.todoInput} 
                                type="text" placeholder="What needs to be done?" />
                        </div>
                    </div>
                     <ul classNames="list-group list-group-flush">
                        {filtered.map(task=><this.TodoItem item={task} dispatch={dispatch}/>)}
                    </ul>
                    <div classNames="card-block" style-display={ model.tasks.length ? 'block' : 'none' }>
                       <span classNames="todo-count">
                            <strong>{remaining}</strong> item{remaining === 1 ? '' : 's'} left
                        </span>
                        <span style={({marginLeft:'50px'})}>
                            <button on-click={[dispatch, {type:FILTER, filter:'all'}]} classNames="btn btn-link">All</button>
                            <button on-click={[dispatch, {type:FILTER, filter:'active'}]} classNames="btn btn-link">Active</button>
                            <button on-click={[dispatch, {type:FILTER, filter:'completed'}]} classNames="btn btn-link">Completed</button>
                            <button on-click={dispatch.bind(null,{type:ARCHIVE})} classNames="btn btn-link">Clear Completed</button>
                        </span>
                    </div>
                    <p>Double-click to edit a todo</p>
               </div> 
    }
    TodoItem({item,dispatch}){
        return <TaskCom  
                    model={item}
                    dispatch={action=>dispatch({type:MODIFY, id:item.id, taskAction:action})}
                    onRemove={dispatch.bind(null,{type:REMOVE, task:item})}
                />
    }
    update(model, action){
        switch (action.type) {
            case ADD:           return this.addTodo(model, action.title)
            case REMOVE:        return this.removeTask(model, action.task)
            case MODIFY:        return this.modifyTodo(model, action.id, action.taskAction)
            case FILTER:        return {...model, filter:action.filter}
            case ARCHIVE:       return this.archiveTodos(model)
            case TOGGLE_ALL:    return this.toggleAll(model, action.done)
            
            default:         return model;
        }
    }
    filteredTodos(tasks, filter) {
        return   filter === 'completed' ? tasks.filter( todo => todo.done )
                : filter === 'active'    ? tasks.filter( todo => !todo.done )
                : tasks;
    }
    addTodo(model, title) {
        return {...model,
            tasks         : [ ...model.tasks, TaskCom.init(model.nextId, title)],
            editingTitle  : '',
            nextId        : model.nextId + 1,
            todoInput     :title  
        }
    }
    removeTask(model, task){
        return {
            ...model,
            tasks:model.tasks.filter(_=>_!==task)
        }
    }
    modifyTodo(model ,id, action) {
        return {...model,
            tasks : model.tasks.map( taskModel => taskModel.id !== id ? taskModel : TaskCom.update(taskModel, action)  )
        };
    }
    remainingTodos(tasks) {
        return tasks.reduce( (acc, task) => !task.done ? acc+1 : acc, 0);
    }
    archiveTodos(model) {
        return {...model,
            tasks : model.tasks.filter( taskModel => !taskModel.done )
        };
    }
    toggleAll(model, done){
       return {...model,
        tasks : model.tasks.map( taskModel => TaskCom.update(taskModel, {type:Toggle, checked:done}))
     };
    }
}