const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),Module=require('node:module'),test=require('node:test'),ts=require('typescript'),React=require('react');
const {renderToStaticMarkup}=require('react-dom/server');
function load(file,mocks={}){const filename=path.resolve(__dirname,'..',file),child=new Module(filename,module);child.paths=Module._nodeModulePaths(path.dirname(filename));const original=child.require.bind(child);child.require=name=>Object.hasOwn(mocks,name)?mocks[name]:name.endsWith('.css')?{__esModule:true,default:{}}:original(name);child._compile(ts.transpileModule(fs.readFileSync(filename,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,jsx:ts.JsxEmit.ReactJSX,esModuleInterop:true}}).outputText,filename);return child.exports;}
const {addressSuggestions,addressDraftPatch,searchAddress}=load('components/stations/station-address-search.ts');
const {canAccessGie}=load('domain/gie-access.ts');
test('address results validate coordinates, deduplicate and fill UF without inventing data',()=>{
 const f={geometry:{type:'Point',coordinates:[0,0]},properties:{street:'Av. Paulista',housenumber:'1000',city:'São Paulo',state:'São Paulo',countrycode:'br',postcode:'01310-100'}};
 const result=addressSuggestions({features:[f,f,{geometry:{type:'Point',coordinates:[181,0]},properties:{name:'Invalid'}},null]});
 assert.equal(result.length,1);assert.equal(result[0].latitude,0);assert.equal(result[0].longitude,0);assert.equal(result[0].state,'SP');assert.equal(result[0].postalCode,'01310100');assert.equal(result[0].countryCode,'BR');assert.equal(result[0].neighborhood,undefined);assert.deepEqual(addressSuggestions({features:'bad'}),[]);
});
test('address search sends no cookies/tokens and exposes failure for manual fallback',async t=>{
 t.mock.method(globalThis,'fetch',async(url,options)=>{assert.equal(new URL(url).searchParams.get('q'),'Paulista');assert.equal(new URL(url).searchParams.get('countrycode'),'BR');assert.equal(options.credentials,'omit');assert.equal(options.headers,undefined);return new Response('{}',{status:503});});
 await assert.rejects(searchAddress(' Paulista ','BR',new AbortController().signal),/manualmente/);
});
test('GIE visibility fails closed and matches only the requested email',()=>{
 for(const email of [null,undefined,'','other@example.test','admin.dev@emps.local.evil'])assert.equal(canAccessGie(email),false);
 assert.equal(canAccessGie(' ADMIN.DEV@EMPS.LOCAL '),true);
});
test('ordinary users keep telemetry history without privileged GIE panels',()=>{
 const {StationTelemetry}=load('components/stations/StationTelemetry.tsx',{'@/components/energy/use-gie-access':{useGieAccess:()=>false},'@/services/emps-api':{api:new Proxy({},{get(){throw Error('Must not request');}})},'@/components/shell/AppShell':{AppShell:({children})=>React.createElement('main',null,children)},'next/link':({href,children})=>React.createElement('a',{href},children)});
 const html=renderToStaticMarkup(React.createElement(StationTelemetry,{id:'13'}));assert.match(html,/Consultar histórico/);assert.doesNotMatch(html,/Contrato GIE|Exportar|Importar|Criar fonte/);
});
function photoHarness(identity='one'){
 const values=[],deps=[],cleanups=[],effects=[];let index=0;
 const react={...React,useState(initial){const i=index++;if(!(i in values))values[i]=typeof initial==='function'?initial():initial;return[values[i],v=>{values[i]=typeof v==='function'?v(values[i]):v;}];},useEffect(fn,next){const i=index++;if(!deps[i]||next.some((v,n)=>v!==deps[i][n])){deps[i]=next;effects.push(()=>{cleanups[i]?.();cleanups[i]=fn();});}}};
 const {StationPhoto}=load('components/stations/StationPhoto.tsx',{react,'@/services/emps-api':{empsApiUrl:'https://api.example.test',EMPS_SESSION_CHANGED_EVENT:'session',frontSession:{get:()=>identity?{usuarioId:identity}:null},api:{ensureSession:async()=>({token:'unit-only-token'})}}});
 return{render(props){index=0;const tree=StationPhoto(props);effects.splice(0).forEach(fn=>fn());return tree;},dispose(){cleanups.forEach(fn=>fn?.());}};
}
const tick=()=>new Promise(r=>setImmediate(r));
test('public photo uses canonical route without authorization credentials',async t=>{
 t.mock.method(globalThis,'fetch',async(url,options)=>{assert.equal(url,'https://api.example.test/public/station-photos/photo-id');assert.deepEqual(options.headers,{});assert.equal(options.cache,'no-store');return new Response(new Blob(['image']));});
 const old=globalThis.window;globalThis.window={addEventListener(){},removeEventListener(){}};const h=photoHarness();
 try{h.render({id:'photo-id',alt:'Station',publicPhoto:true});await tick();assert.equal(h.render({id:'photo-id',alt:'Station',publicPhoto:true}).props.children.type,'img');}finally{h.dispose();globalThis.window=old;}
});
test('switching photo aborts old request and hides previous image; 403 is explained',async t=>{
 const requests=[];t.mock.method(globalThis,'fetch',(url,options)=>new Promise(resolve=>requests.push({url,options,resolve})));
 const old=globalThis.window;globalThis.window={addEventListener(){},removeEventListener(){}};const h=photoHarness();
 try{h.render({id:'old',alt:'Old'});h.render({id:'old',alt:'Old'});await tick();assert.match(requests[0].options.headers.Authorization,/Bearer /);requests[0].resolve(new Response(new Blob(['old'])));await tick();assert.equal(h.render({id:'old',alt:'Old'}).props.children.type,'img');const next=h.render({id:'new',alt:'New'});assert.notEqual(next.props.children.type,'img');assert.equal(requests[0].options.signal.aborted,true);await tick();requests[1].resolve(new Response('',{status:403}));await tick();assert.match(renderToStaticMarkup(h.render({id:'new',alt:'New'})),/não tem acesso/);}finally{h.dispose();globalThis.window=old;}
});

test('selecting another address clears absent old fields instead of mixing locations',()=>{
 const previous={street:'Old street',addressNumber:'99',postalCode:'11111111',complement:'Old apartment',name:'Keep station name'};
 const next={...previous,...addressDraftPatch({id:'new',label:'New city',city:'New city',latitude:-23,longitude:-46})};
 assert.equal(next.complement,'');assert.equal(next.street,'');assert.equal(next.addressNumber,'');assert.equal(next.postalCode,'');assert.equal(next.name,'Keep station name');assert.equal(next.city,'New city');assert.equal(next.latitude,-23);assert.equal(next.longitude,-46);
});

test('private photo without a session shows sign-in, never an endless loader',()=>{
 const old=globalThis.window;globalThis.window={addEventListener(){},removeEventListener(){}};const h=photoHarness('');
 try{h.render({id:'private',alt:'Station'});const tree=h.render({id:'private',alt:'Station'});assert.equal(tree.props['aria-busy'],false);assert.match(renderToStaticMarkup(tree),/Entre com sua conta/);}finally{h.dispose();globalThis.window=old;}
});
test('photo timeout ends the loader even when authentication has not responded',async t=>{
 let expire;const originalTimeout=globalThis.setTimeout;
 t.mock.method(globalThis,'setTimeout',(fn,ms,...args)=>ms===15000?(expire=fn,0):originalTimeout(fn,ms,...args));
 t.mock.method(globalThis,'fetch',()=>new Promise(()=>{}));
 const old=globalThis.window;globalThis.window={addEventListener(){},removeEventListener(){}};const h=photoHarness();
 try{h.render({id:'slow',alt:'Slow'});h.render({id:'slow',alt:'Slow'});await tick();expire();const tree=h.render({id:'slow',alt:'Slow'});assert.equal(tree.props['aria-busy'],false);assert.match(renderToStaticMarkup(tree),/demorou a responder/);}finally{h.dispose();globalThis.window=old;}
});
test('address parser rejects malformed country/CEP instead of truncating them into another location',()=>{
 const data=addressSuggestions({features:[{geometry:{type:'Point',coordinates:[-46,-23]},properties:{name:'Address',countrycode:'BR-INVALID',postcode:'01310-100XYZ'}}]});
 assert.equal(data[0].countryCode,undefined);assert.equal(data[0].postalCode,undefined);
});
test('revoking GIE visibility removes a selected private notice from its dialog',()=>{
 const secret={alertaId:'1',origem:'GIE',titulo:'Confidential GIE',dataCriacao:'2026-10-19T12:00:00Z'};
 const {StationNotices}=load('components/dashboard/StationNotices.tsx',{react:{...React,useState:()=>[secret,()=>{}]},'@/domain/station-insights':{stationNotices:rows=>rows,gieHealth:()=>({label:'GIE',state:'online'})}});
 const html=renderToStaticMarkup(React.createElement(StationNotices,{alerts:[secret],stationId:'13',timezone:'UTC',now:0,gieAllowed:false,onAll(){}}));
 assert.doesNotMatch(html,/Confidential GIE/);assert.match(html,/não está mais disponível/);
});

test('Web Charge resets state on account/QR changes, while refresh of the same account keeps its key',()=>{
 let user='one';const {WebChargeEntry}=load('components/charge/WebChargeEntry.tsx',{react:{...React,useSyncExternalStore:(_subscribe,snapshot)=>snapshot()},'@/services/emps-api':{frontSession:{get:()=>({usuarioId:user})}},'./WebCharge':{WebCharge:()=>null}});
 const first=WebChargeEntry({token:'qr'}).key;assert.equal(WebChargeEntry({token:'qr'}).key,first);
 user='two';assert.notEqual(WebChargeEntry({token:'qr'}).key,first);
 user='one';assert.notEqual(WebChargeEntry({token:'other-qr'}).key,first);
});

test('revoking GIE while its tab is selected restores the regular dashboard',()=>{
 const noop=()=>null;const hooks={...React,useState:value=>[value==='dashboard'?'intelligence':typeof value==='function'?value():value,()=>{}],useEffect(){},useMemo:fn=>fn(),useCallback:fn=>fn};
 const monitor={dateWindow:()=>({from:0,to:1}),previousMonitoringWindow:()=>({from:0,to:1}),localDay:()=> '2026-10-19',safeTimezone:()=> 'UTC',normalizeReadings:()=>[],summarize:()=>({solar:null,charger:null,imported:null,load:null}),numeric:value=>typeof value==='number'?value:null,isNonSimulatedReading:()=>true,sourceKey:()=>''};
 const {StationDashboard}=load('components/dashboard/StationDashboard.tsx',{react:hooks,'@/components/shell/NavigationLink':{NavigationLink:({href,children})=>React.createElement('a',{href},children)},'@/components/energy/EnergyFlowStation':{EnergyFlowStation:noop},'@/components/chargers/ChargerVisualBoard':{ChargerVisualBoard:noop},'@/components/status/StatusBadge':{StatusBadge:noop},'@/domain/station-monitoring':monitor,'@/services/emps-api':{selectedStation:{get:()=>''}},'@/utils/formatters':{formatCurrency:()=> 'R$ 0',formatKwh:noop,formatMinutes:noop},'./EnergyDiagram':{EnergyDiagram:noop},'./MonitoringChart':{MonitoringChart:noop},'./use-station-history':{useStationHistory:()=>({rows:[]})},'./use-station-weather':{useStationWeather:()=>({weather:null})},'./WeatherPopover':{WeatherPopover:noop},'./DateControl':{DateControl:noop},'./StationNotices':{StationNotices:noop},'./StationFinancialSummary':{StationFinancialSummary:noop}});
 const html=renderToStaticMarkup(React.createElement(StationDashboard,{stationId:'13',gieAllowed:false,gieControls:React.createElement('div',null,'Private GIE'),data:{carregadores:[],alertas:[],resumo:{}},telemetry:{},onChargersChange(){},onRefresh(){}}));
 assert.match(html,/id="monitor-panel-dashboard"/);assert.doesNotMatch(html,/monitor-panel-intelligence|Private GIE/);
});
