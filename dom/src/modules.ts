declare function require(s: string): any;

const thunk = require('snabbdom/thunk');
export {thunk};
export * from './interfaces';

const ClassModule = require('snabbdom/modules/class');
const PropsModule = require('snabbdom/modules/props');
const AttrsModule = require('snabbdom/modules/attributes');
const EventsModule = require('snabbdom/modules/eventlisteners');
const StyleModule = require('snabbdom/modules/style');
const HeroModule = require('snabbdom/modules/hero');

export default [StyleModule, ClassModule, PropsModule, AttrsModule];

export {
  StyleModule, ClassModule,
  PropsModule, AttrsModule,
  HeroModule, EventsModule,
}
export {h} from './hyperscript';
const html = require('snabbdom-jsx');
export {html};
