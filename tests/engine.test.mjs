import {test} from 'node:test';import assert from 'node:assert/strict';import {calculate} from '../web/engine.mjs';
const x={days:4,nights:3,budget:2500,workHours:12,transport:500,nightly:180,food:80,other:200,setup:200,price:350,variable:30,hours:3,orders:3,saving:0};
test('includes every travel expense and per-order cost',()=>{const r=calculate(x);assert.equal(r.base,1560);assert.equal(r.expected.cost,1850);assert.equal(r.expected.net,-800);assert.equal(r.zero.net,-1760);assert.equal(r.breakEven,6);});
test('caps orders by work capacity',()=>{const r=calculate({...x,orders:100});assert.equal(r.orders,4);assert.equal(r.expected.hours,12);});
test('exchange stays reduce expense, never create revenue',()=>{const r=calculate({...x,price:0,variable:0,setup:0,saving:10000});assert.equal(r.saving,540);assert.equal(r.expected.revenue,0);assert.equal(r.expected.net,-1020);assert.equal(r.breakEven,null);});
test('zero budget and negative margin remain visible',()=>{const r=calculate({...x,budget:0,price:10,variable:30});assert.equal(r.breakEven,null);assert.equal(r.budgetGap,r.expected.cost);assert.ok(r.expected.net<r.zero.net);});
test('reject invalid inputs',()=>{for(const patch of [{days:0},{hours:0},{orders:1.5},{price:-1},{budget:NaN},{nights:5},{workHours:100}])assert.throws(()=>calculate({...x,...patch}));});
