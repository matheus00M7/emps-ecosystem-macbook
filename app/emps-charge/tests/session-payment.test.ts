import assert from 'node:assert/strict';
import test from 'node:test';
import {payOwnedSession} from '../src/services/session-payment';
import type {ChargingSession} from '../src/domain/models';

const session={id:'session-1',chargerId:'charger-1',status:'payment_pending'} as ChargingSession;
function harness(expireAt?:string){
 let current=true,refreshes=0;const calls:string[]=[];
 const step=(name:string)=>{calls.push(name);if(name===expireAt)current=false;};
 const dependencies={session,
  api:{disconnectSession:async()=>{step('disconnect');},paySession:async()=>{step('payment');return {status:'requires_action',provider:'stripe',providerClientSecret:'unit-secret'};},charger:async()=>{step('charger');return {paymentOptions:{stripePublishableKey:'unit-key'}} as any;}},
  refreshHistory:async()=>{step(++refreshes===1?'refresh-before':'refresh-after');return refreshes>1?[{...session,status:'completed' as const}]:[session];},
  getCharger:()=>undefined,
  confirm:async()=>{step('confirm');return {canceled:false};},
  isCurrent:()=>current,wait:async()=>{},
 };
 return {dependencies,calls};
}
test('payment never advances past an account change at any asynchronous boundary',async()=>{
 const order=['disconnect','refresh-before','payment','charger','confirm','refresh-after'];
 for(const boundary of order){
  const h=harness(boundary);
  assert.equal(await payOwnedSession(h.dependencies),false,boundary);
  assert.deepEqual(h.calls,order.slice(0,order.indexOf(boundary)+1),boundary);
 }
});
test('payment completes only after server history confirms the same session',async()=>{
 const h=harness();assert.equal(await payOwnedSession(h.dependencies),true);
 assert.deepEqual(h.calls,['disconnect','refresh-before','payment','charger','confirm','refresh-after']);
});
test('below-minimum response preserves its message and never opens payment UI',async()=>{
 const h=harness();h.dependencies.api.paySession=async()=>({status:'pending',provider:'stripe',reason:'BELOW_PROVIDER_MINIMUM',message:'Valor original pendente'} as any);
 await assert.rejects(payOwnedSession(h.dependencies),/Valor original pendente/);
 assert.deepEqual(h.calls,['disconnect','refresh-before','refresh-after']);
});
test('an old account pending response does not show a message in the new account',async()=>{
 const h=harness('refresh-after');h.dependencies.api.paySession=async()=>({status:'pending',provider:'stripe',reason:'BELOW_PROVIDER_MINIMUM',message:'Old account'} as any);
 assert.equal(await payOwnedSession(h.dependencies),false);
});
