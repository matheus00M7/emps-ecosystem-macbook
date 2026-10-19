import 'reflect-metadata';
import assert from 'node:assert/strict';
import test from 'node:test';
import { GieAccessGuard } from '../src/gie-access';
import { GieController } from '../src/gie.service';
import { TelemetryController } from '../src/telemetry.controller';
import { belowStripeMinimum, minimumPaymentCode, minimumPaymentMessage } from '../src/payment-minimum';
import { SessionBillingService } from '../src/session-billing.service';
import { PaymentGatewayService } from '../src/payment-gateway.service';
import { calculateSession, TARIFF_VERSION } from '../src/tariff-engine';
import { WebAuthService } from '../src/web-auth.service';
import { MobileService } from '../src/mobile.service';

const context = (user: unknown) => ({switchToHttp: () => ({getRequest: () => ({user})})}) as any;

test('GIE consults current account instead of trusting JWT email or global admin role', async () => {
  let account = {email:'other@emps.local', accountStatus:'ACTIVE'};
  const guard = new GieAccessGuard({user:{findUnique:async()=>account}} as any);
  await assert.rejects(guard.canActivate(context({sub:'1',email:'admin.dev@emps.local',role:'ADMIN'})), /não autorizado/);
  account = {email:'ADMIN.DEV@emps.local',accountStatus:'ACTIVE'};
  assert.equal(await guard.canActivate(context({sub:'1',email:'old@example.test'})), true);
  account.accountStatus = 'SUSPENDED';
  await assert.rejects(guard.canActivate(context({sub:'1'})), /não autorizado/);
  await assert.rejects(guard.canActivate(context(undefined)), /não autorizado/);
});

test('GIE guard covers all controller routes including isolated replay and readiness/dataset', () => {
  assert.ok(Reflect.getMetadata('__guards__', GieController).includes(GieAccessGuard));
  for (const method of ['readiness','dataset']) {
    assert.ok(Reflect.getMetadata('__guards__', (TelemetryController.prototype as any)[method]).includes(GieAccessGuard));
  }
});

test('BRL minimum boundaries preserve zero and exact payable amounts', () => {
  for (const value of ['0.01','0.25','0.49']) assert.equal(belowStripeMinimum(value), true);
  for (const value of ['0','-1','0.50','10','0.001','NaN','Infinity']) assert.equal(belowStripeMinimum(value), false);
});

test('frozen below-minimum bill remains pending with original amount and no provider calls, also on retry', async () => {
  const breakdown=calculateSession('10',[], '2026-09-19T12:00:00Z','2026-09-19T12:16:00Z');
  assert.equal(breakdown.customer.total_amount,'0.25');
  const row:any={id:10n,clientId:1,chargerId:2,totalPrice:'0.25',tariffVersion:TARIFF_VERSION,
    billingSnapshot:{tariff_version:TARIFF_VERSION,phase:'frozen',breakdown},status:'WAITING_PAYMENT',
    paymentIntentId:3n,paymentIntent:{id:3n,provider:'stripe',providerIntentId:'pi_unit_hold'},payments:[]};
  const payments=new Map();
  const db:any={user:{findUnique:async()=>({id:1,accountStatus:'ACTIVE'})},
    chargingSession:{findFirst:async()=>row,findUniqueOrThrow:async()=>row},$queryRaw:async()=>[],
    payment:{findUnique:async({where}:any)=>payments.get(where.idempotencyKey)??null,upsert:async({where,create,update}:any)=>{if(!payments.has(where.idempotencyKey))payments.set(where.idempotencyKey,create);else Object.assign(payments.get(where.idempotencyKey),update);}}};
  db.$transaction=async(fn:any)=>fn(db);
  const gateway=new Proxy({}, {get(){throw Error('Provider must not be called');}});
  const service=new SessionBillingService(db,gateway as any,{publish(){}} as any);
  for(let i=0;i<2;i++) {
    const result=await service.pay('1','10');
    assert.equal(result.status,'pending');assert.equal(result.amountDue,'0.25');
    assert.equal(result.reason,'BELOW_PROVIDER_MINIMUM');
  }
  const original=payments.get('v1-session-10');
  assert.equal(original.failureCode,minimumPaymentCode);
  original.status='REJECTED';
  await service.pay('1','10');assert.equal(original.status,'PENDING');
  original.status='APPROVED';original.amountReceived='0.25';original.paidAt=new Date();
  await assert.rejects(service.pay('1','10'),/conciliação/);
  assert.equal(original.status,'APPROVED');
  assert.equal(payments.size,1);assert.equal([...payments.values()][0].amount,'0.25');
  assert.equal([...payments.values()][0].status,'APPROVED');assert.equal(row.status,'WAITING_PAYMENT');
});

test('legacy manual Stripe hold below minimum is pending without capture, cancel or refund', async () => {
  const service=Object.create(PaymentGatewayService.prototype) as any;
  service.stripe={paymentIntents:{retrieve:async()=>({id:'pi_test',livemode:false,currency:'brl',capture_method:'manual',status:'requires_capture'})}};
  const old=process.env.EMPS_EXTERNAL_PAYMENT_SIDE_EFFECTS_ENABLED;
  process.env.EMPS_EXTERNAL_PAYMENT_SIDE_EFFECTS_ENABLED='true';
  try {
    assert.deepEqual(await service.settleIntent({amount:.25,method:'card',provider:'stripe',externalId:'pi_test'}),
      {capturedAmount:0,externalPaymentId:'pi_test',provider:'STRIPE',status:'pending',failureCode:minimumPaymentCode,failureMessage:minimumPaymentMessage});
  } finally {if(old===undefined)delete process.env.EMPS_EXTERNAL_PAYMENT_SIDE_EFFECTS_ENABLED;else process.env.EMPS_EXTERNAL_PAYMENT_SIDE_EFFECTS_ENABLED=old;}
});

test('Web Charge registration can login on mobile with same identity and rejects duplicate email', async () => {
  let row:any;
  const refreshes:any[]=[];
  const db={refreshToken:{create:async({data}:any)=>{refreshes.push(data);return data;}},user:{create:async({data}:any)=>{if(row)throw Object.assign(Error('unique'),{code:'P2002'});row={...data,id:7,accountStatus:'ACTIVE',phone:'11999990000'};return row;},findUnique:async({where}:any)=>row?.email===where.email?row:null}};
  const jwt={signAsync:async(payload:any)=>'unit-token-'+payload.sub};
  const web=new WebAuthService(db as any,jwt as any);
  const mobile=new MobileService(db as any,jwt as any,{} as any,{} as any,{publish(){}} as any);
  const dto={name:'Unit User',email:' Shared@Example.test ',password:'Unit-only-pass-123',passwordConfirmation:'Unit-only-pass-123',acceptTerms:true};
  const registered=await web.register(dto);
  const logged=await mobile.login({email:'SHARED@example.test',password:dto.password});
  assert.equal(logged.user.id,registered.user.id);assert.equal(logged.user.email,registered.user.email);assert.equal(logged.user.name,registered.user.name);
  assert.equal(logged.user.id,'7');assert.equal(row.phone,'11999990000');assert.equal(refreshes.length,2);
  assert.ok(refreshes.every(r=>r.userId===7));assert.equal(logged.accessToken,registered.accessToken);
  await assert.rejects(web.register(dto),/Já existe/);
});
