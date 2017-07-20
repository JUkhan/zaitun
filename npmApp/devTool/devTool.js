const snabbdom = require('snabbdom');
const h = require('snabbdom/h');

const ResetComponent = Symbol('ResetComponent');
const ResetTool = Symbol('ResetTool');
const Action_Regenerate = Symbol('dec');
const LogPayload = Symbol('LogPayload');
const LogState = Symbol('LogState');
const Resize = Symbol('resize');
const SetAction = Symbol('setAction');
const selectAction = Symbol('SelectAction')
function devTool(cm) {    
    this.CM = null;    
    this.createTools=function() {
        const elm = document.createElement('DIV');
        elm.setAttribute('class', 'dev-tool');
        const size = windowSize();
        this.height = size.height;
        elm.style.left = (size.width - 250) + 'px';
        elm.style.height = (size.height) + 'px';
        const elm2 = document.createElement('DIV');
        elm.appendChild(elm2);
        document.body.appendChild(elm);
        window.addEventListener('resize', () => {
            const size = windowSize();
            elm.style.left = (size.width - 250) + 'px';
            elm.style.height = (size.height) + 'px';
            if (this.toolHandler) {
                this.toolHandler({
                    type: Resize,
                    height: size.height
                });
            }
        }, false);
        window.addEventListener('scroll', (e) => {
            elm.style.top = document.body.scrollTop + 'px';
        }, false);

        render(this.init(), elm2, this);
        return this;
    }
    this.reset=function() {
        this.toolHandler({
            type: ResetTool
        });
    }
    this.setCM=function(cm) {
        this.CM = cm;
        cm.devTool = this;
    }
    this.setAction=function(action, model) {
        this.toolHandler({
            type: SetAction,
            payload: {
                action,
                model
            }
        })
    }
    this.init=function() {
        return {
            height: this.height,
            states: []
        };
    }
    this.view=function({
        model,
        handler
    }) {
        this.toolHandler = handler;
        return h('div.tool-body', [
            h('div.tool-header', [
                h('button', {
                    on: {
                        click: handler.bind(null, {
                            type: ResetComponent
                        })
                    }
                }, 'Reset')
            ]),
            h('div.tool-states', {
                    style: ({
                        height: (model.height - 40) + 'px'
                    })
                },
                model.states.map((item, index) => this.DebugStates(item, handler, index))
            )
        ]);
    }
    this.DebugStates=function(item, handler, index) {
        return h('div.tool-view', {
            key: index,
            class: ({
                'selected-action': item.selected
            }),
            on: {
                click: handler.bind(null, {
                    type: selectAction,
                    payload: item
                })
            }
        }, [h('div', [
                h('button', {
                    on: {
                        click: handler.bind(null, {
                            type: Action_Regenerate,
                            payload: item
                        })
                    }
                }, item.actionType)
            ]),
            h('div.tool-view-buttons', [
                h('button', {
                    on: {
                        click: handler.bind(null, {
                            type: LogPayload,
                            payload: item
                        })
                    }
                }, 'Log Action'),
                h('span.tool-space', ''),
                h('button', {
                    on: {
                        click: handler.bind(null, {
                            type: LogState,
                            payload: item
                        })
                    }
                }, 'Log State')
            ])
        ])
    }
    this.update=function(model, action) {

        switch (action.type) {
            case ResetComponent:
                this.CM.reset();
                return Object.assign({}, model, {
                    states: []
                });
            case ResetTool:
                return {
                    height: model.height,
                    states: []
                };

            case Action_Regenerate:
                console.log(action.payload.model);
                this.CM.updateByModel(action.payload.model);
                return model;
            case LogPayload:
                console.log(action.payload.action);
                return model;
            case LogState:
                console.log(action.payload.model);
                return model;
            case Resize:
                return Object.assign({}, model, {
                    height: action.height
                });
            case SetAction:
                const typeArr = [];
                this.getType(action.payload.action, typeArr);
                const state = Object.assign({}, action.payload, {
                    actionType: typeArr.filter(action => action !== 'CHILD').join('-')
                });
                return Object.assign({}, model, {
                    states: [...model.states, state]
                });
            case selectAction:
                model.states.forEach(ac => ac.selected = false);
                action.payload.selected = true;
                return model;
            default:
                return model;
        }
    }
    this.getType=function(action, typeArr) {
        var type = action.type;
        if (typeof type === 'symbol') {
            type = action.type.toString().replace('Symbol(', '');
            type = type.substr(0, type.length - 1);
        }
        typeArr.push(type);
        for (let prop in action) {
            if (prop.toLowerCase().indexOf('action') >= 0) {
                this.getType(action[prop], typeArr);
                return;
            }
        }
    }
    this.createTools();
}

const patch = snabbdom.init([
    require('snabbdom/modules/class'),
    require('snabbdom/modules/props'),
    require('snabbdom/modules/style'),
    require('snabbdom/modules/eventlisteners'),
]);

function render(initState, oldVnode, com) {
    const newVnode = com.view({
        model: initState,
        handler: event => {
            const newState = com.update(initState, event);
            render(newState, newVnode, com);
        }
    });
    patch(oldVnode, newVnode);
}

function windowSize() {
    var w = window,
        d = document,
        e = d.documentElement,
        g = d.getElementsByTagName('body')[0],
        width = w.innerWidth || e.clientWidth || g.clientWidth,
        height = w.innerHeight || e.clientHeight || g.clientHeight;
    return {
        width,
        height
    };
}

module.exports = devTool;