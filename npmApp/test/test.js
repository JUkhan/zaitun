
import test from 'tape';
import {bootstrap, h, Router} from '../index';
console.log(Router);
test('counter update function', (assert) => {
   
 var state = {count:11};
 
 assert.equal(state.count, 11);

 

 assert.end();
});