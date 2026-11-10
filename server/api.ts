import {Store,type Env} from './repository';
import {seed} from '../lib/seed';
import challengeSeed from './challenges-seed.json';
import {mapCategory} from '../lib/import';
const json=(data:unknown,status=200)=>new Response(JSON.stringify(data),{status,headers:{'Content-Type':'application/json','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'}});
const allowed=['profile','experiences','projects','skills','tools','journey','categories'];
export function safePublic(collection:string,item:any){
 const {challenge_id,original_number,original_status,notes,source,...safe}=item;
 return safe;
}
async function initialise(db:Store){
 if(await db.getMeta('seed-v1'))return;
 for(const [collection,items]of [['categories',seed.categories],...Object.entries(seed).filter(([key])=>key!=='categories')] as [string,any[]][])for(const item of items){const extra:Record<string,unknown>={};if(collection==='projects')extra.category_id=(seed.categories.find(c=>c.name===(item as any).category)?.id)||null;await db.put(collection,{...item,published:(item as any).published??true},true,extra);}
 for(const challenge of challengeSeed)await db.put('challenges',{...challenge,published:false},true,{source:challenge.source,original_number:challenge.original_number});
 await db.meta('seed-v1','done');
}
async function identity(request:Request,env:Env){
 if(env.SUPABASE_URL&&!env.DB){const token=request.headers.get('authorization');if(!token)return null;const r=await fetch(`${env.SUPABASE_URL}/auth/v1/user`,{headers:{apikey:env.SUPABASE_ANON_KEY||env.SUPABASE_SERVICE_ROLE_KEY!,Authorization:token}});return r.ok?(await r.json() as any).id:null;}
 return request.headers.get('oai-authenticated-user-id');
}
const safeUrl=(s:string)=>!s||/^https:\/\//i.test(s)||/^\/api\/media\/[a-zA-Z0-9-]+$/.test(s);
function check(data:any){
 if(!data||typeof data!=='object'||Array.isArray(data))throw new Error('Invalid record');
 if(JSON.stringify(data).length>75000)throw new Error('Record is too large');
 if(data.id&&!/^[a-zA-Z0-9_-]{1,100}$/.test(data.id))throw new Error('Invalid record identifier');
 for(const key of ['external','github','linkedin','photo','video','thumbnail'])if(data[key]&&!safeUrl(data[key]))throw new Error(`Use a secure HTTPS URL for ${key}`);
 if(data.email&&!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email))throw new Error('Enter a valid email address');
 if(data.videoEmbed&&!/^https:\/\/(www\.youtube\.com\/embed\/|www\.youtube-nocookie\.com\/embed\/|player\.vimeo\.com\/video\/)\d*[\w-]+(?:\?.*)?$/.test(data.videoEmbed))throw new Error('Use a YouTube embed or Vimeo player URL');
 if(data.socials&&(!Array.isArray(data.socials)||data.socials.some((s:any)=>!s.label||!/^https:\/\//.test(s.url))))throw new Error('Each social link needs a label and an HTTPS URL');
 return data;
}
async function references(db:Store,id:string){const needle='/api/media/'+id;for(const c of ['profile','projects','journey']){const rows=await db.list(c,true);if(rows.some(x=>JSON.stringify(x).includes(needle)))return true;}return false;}
async function storageRead(env:Env,key:string){if(env.BUCKET){const o=await env.BUCKET.get(key);return o?new Response(o.body,{headers:{'Content-Type':o.httpMetadata?.contentType||'application/octet-stream'}}):null;}const r=await fetch(`${env.SUPABASE_URL}/storage/v1/object/portfolio-media/${key}`,{headers:{apikey:env.SUPABASE_SERVICE_ROLE_KEY!,Authorization:`Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`}});return r.ok?r:null;}
async function secret(db:Store){await db.meta('contact-key',crypto.randomUUID()+crypto.randomUUID());return await db.getMeta('contact-key');}
async function sign(value:string,key:string){const k=await crypto.subtle.importKey('raw',new TextEncoder().encode(key),{name:'HMAC',hash:'SHA-256'},false,['sign']);return Array.from(new Uint8Array(await crypto.subtle.sign('HMAC',k,new TextEncoder().encode(value)))).map(v=>v.toString(16).padStart(2,'0')).join('');}
export async function api(request:Request,env:Env):Promise<Response>{
 const url=new URL(request.url);const path=url.pathname.replace(/^\/api\/?/,'').split('/').filter(Boolean);const db=new Store(env);
 try{
  if(!env.DB&&(!env.SUPABASE_URL||!env.SUPABASE_SERVICE_ROLE_KEY))return json({error:'The database is not configured. Follow the setup guide.'},503);
  if(!['GET','HEAD'].includes(request.method)){const origin=request.headers.get('origin');if(origin&&origin!==url.origin)return json({error:'Cross-origin requests are not allowed'},403);}
  await initialise(db);const user=await identity(request,env);const owner=await db.owner();const admin=!!user&&owner===user;
  if(path[0]==='config')return json({auth:env.DB?'chatgpt':'supabase',supabaseUrl:env.SUPABASE_URL||'',supabaseAnonKey:env.DB?'':env.SUPABASE_ANON_KEY||''});
  if(path[0]==='session')return json({signedIn:!!user,admin,canActivate:!!env.DB&&env.OWNER_BOOTSTRAP==='enabled'&&!owner&&!!user});
  if(path[0]==='content'&&request.method==='GET'){const values=await Promise.all(allowed.map(c=>db.list(c,true)));const result:any={};allowed.forEach((c,i)=>result[c]=c==='profile'?safePublic(c,values[i][0]||seed.profile[0]):values[i].map(x=>safePublic(c,x)));return json(result);}
  if(path[0]==='contact-token'&&request.method==='GET'){const value=Date.now()+'.'+crypto.randomUUID();return json({token:value+'.'+await sign(value,await secret(db))});}
  if(path[0]==='contact'&&request.method==='POST'){
   const body=await request.json() as any;const {name,email,message,website,token}=body;
   if(website)return json({error:'Unable to submit this message'},400);
   const parts=String(token||'').split('.');const value=parts.slice(0,2).join('.');const age=Date.now()-Number(parts[0]);
   if(parts.length!==3||age<2500||age>7200000||parts[2]!==await sign(value,await secret(db)))return json({error:'Please wait a moment, or refresh the page and try again.'},400);
   if(!name?.trim()||name.length>100||!email||email.length>254||!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)||!message?.trim()||message.length<10||message.length>5000)return json({error:'Add your name, a valid email and a message of 10–5,000 characters.'},400);
   const ip=request.headers.get('cf-connecting-ip')||request.headers.get('x-forwarded-for')?.split(',')[0]||'unknown';const hashed=await sign(ip,await secret(db));
   if(!await db.rateLimit('contact:'+hashed,5,3600))return json({error:'Please try again later. You can also connect on LinkedIn.'},429);
   if(await db.getMeta('used:'+parts[1]))return json({error:'This message has already been submitted.'},409);
   await db.meta('used:'+parts[1],'1');await db.put('contacts',{id:crypto.randomUUID(),name:name.trim(),email:email.trim(),message:message.trim(),date:new Date().toISOString(),read:false,published:false});return json({ok:true});
  }
  if(path[0]==='media'&&request.method==='GET'){
   const m=(await db.list('media')).find(x=>x.id===path[1]);if(!m||(!admin&&!await references(db,m.id)))return json({error:'Not found'},404);
   const response=await storageRead(env,m.key);if(!response)return json({error:'File not found'},404);
   const headers=new Headers(response.headers);headers.set('X-Content-Type-Options','nosniff');headers.set('Cache-Control','private, max-age=300');return new Response(response.body,{headers});
  }
  if(path[0]!=='admin')return json({error:'Not found'},404);
  if(path[1]==='activate'&&request.method==='POST'){
   if(!env.DB||env.OWNER_BOOTSTRAP!=='enabled'||owner||!user)return json({error:'Activation is unavailable'},403);
   return await db.claim(user)?json({ok:true}):json({error:'Workspace is already assigned'},403);
  }
  if(!admin)return json({error:'Owner access required'},user?403:401);
  if(path[1]==='all'&&request.method==='GET'){const collections=[...allowed,'challenges','contacts','media'];const result:any={};for(const c of collections)result[c]=await db.list(c);return json(result);}
  if(path[1]==='import'&&request.method==='POST'){
   const {records}=await request.json() as any;if(!Array.isArray(records)||!records.length||records.length>2000)return json({error:'Invalid import'},400);
   const ids=new Set();for(const r of records){if(!/^\d{1,8}$/.test(r.original_number)||!r.title||String(r.title).length>10000||ids.has(r.original_number))return json({error:'Invalid or duplicate original identifier'},400);ids.add(r.original_number);}
   let added=0,updated=0;const existing=await db.list('challenges');for(const r of records){const id='hiveschool-c3-'+r.original_number;const previous=existing.find(x=>x.id===id);await db.put('challenges',{id,source:'hiveschool-c3',original_number:r.original_number,title:String(r.title),category:String(r.category||''),original_status:String(r.original_status||'Not Started'),completion_date:String(r.completion_date||''),notes:String(r.notes||''),published:false},false,{source:'hiveschool-c3',original_number:r.original_number});previous?updated++:added++;}return json({added,updated});
  }
  if(path[1]==='convert'&&request.method==='POST'){
   const {id}=await request.json() as any;const c=(await db.list('challenges')).find(x=>x.id===id);if(!c)return json({error:'Challenge not found'},404);
   const existing=(await db.list('projects')).find(x=>x.challenge_id===id);if(existing)return json({project:existing,existing:true});
   const digest=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(id));const projectId='project-'+Array.from(new Uint8Array(digest)).slice(0,12).map(v=>v.toString(16).padStart(2,'0')).join('');const p={id:projectId,slug:projectId,title:c.title,description:'',category:mapCategory(c.category),type:'Experiment',status:c.original_status==='Done'?'Completed':c.original_status==='In Progress'?'In Progress':'Planned',date:c.completion_date||'',skills:[],tools:[],published:false,featured:false,challenge_id:id,thumbnail:'',visual:'automation',media:[],external:'',github:'',problem:'',objective:'',approach:'',execution:'',output:'',results:'',learned:''};
   const cat=(await db.list('categories')).find(x=>x.name===p.category);await db.put('projects',p,true,{challenge_id:id,category_id:cat?.id||null});return json({project:p});
  }
  if(path[1]==='upload'&&request.method==='POST'){
   const form=await request.formData();const file=form.get('file');if(!(file instanceof File))return json({error:'Choose a file'},400);
   const types:Record<string,string>={'image/jpeg':'jpg','image/png':'png','image/webp':'webp','image/gif':'gif','video/mp4':'mp4','video/webm':'webm'};
   if(!types[file.type]||file.size>25*1024*1024||!file.size)return json({error:'Use a JPG, PNG, WebP, GIF, MP4 or WebM under 25 MB.'},400);
   const id=crypto.randomUUID(),key=id+'.'+types[file.type];const bytes=await file.arrayBuffer();
   if(env.BUCKET)await env.BUCKET.put(key,bytes,{httpMetadata:{contentType:file.type}});else {const r=await fetch(`${env.SUPABASE_URL}/storage/v1/object/portfolio-media/${key}`,{method:'POST',headers:{apikey:env.SUPABASE_SERVICE_ROLE_KEY!,Authorization:`Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`,'Content-Type':file.type},body:bytes});if(!r.ok)throw new Error('Upload failed');}
   const media={id,key,name:file.name,type:file.type,size:file.size,url:'/api/media/'+id,date:new Date().toISOString(),published:false};await db.put('media',media);return json(media);
  }
  if(path[1]==='media'&&request.method==='DELETE'){
   if(await references(db,path[2]))return json({error:'Remove this file from published content before deleting it.'},409);
   const m=(await db.list('media')).find(x=>x.id===path[2]);if(m){if(env.BUCKET)await env.BUCKET.delete(m.key);else await fetch(`${env.SUPABASE_URL}/storage/v1/object/portfolio-media/${m.key}`,{method:'DELETE',headers:{apikey:env.SUPABASE_SERVICE_ROLE_KEY!,Authorization:`Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`}});await db.remove('media',m.id);}return json({ok:true});
  }
  const collection=path[1];if(![...allowed,'contacts'].includes(collection))return json({error:'Invalid collection'},400);
  if(request.method==='PUT'){
   const data=check(await request.json());data.id=path[2]||data.id||crypto.randomUUID();
   if(['skills','tools','categories'].includes(collection)&&!data.name?.trim())return json({error:'Add a name before saving.'},400);
   if(collection==='experiences'&&(!data.company?.trim()||!data.role?.trim()))return json({error:'Add a company and role before saving.'},400);
   if(collection==='journey'&&!data.title?.trim())return json({error:'Add a title before saving.'},400);
   if(collection==='profile'){data.id='main';data.published=true;}
   if(collection==='projects'){
    if(!data.title?.trim()||!data.description?.trim())return json({error:'Add a title and description before saving.'},400);
    if(!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(data.slug)||['detail','new','index'].includes(data.slug))return json({error:'Choose a lowercase URL slug using letters, numbers and single hyphens.'},400);
    const other=(await db.list('projects')).find(p=>p.id!==data.id&&p.slug===data.slug);if(other)return json({error:'This project URL is already in use'},409);
    const old=(await db.list('projects')).find(p=>p.id===data.id);data.challenge_id=old?.challenge_id||null;
   }
   const extra:Record<string,unknown>={};if(collection==='projects'){extra.category_id=(await db.list('categories')).find(c=>c.name===data.category)?.id||null;extra.challenge_id=data.challenge_id;}
   await db.put(collection,data,false,extra);
   if(collection==='journey')await db.put('reflections',{id:data.id+'-reflection',milestone_id:data.id,built:data.built||'',wrong:data.wrong||'',learned:data.learned||'',differently:data.differently||'',published:!!data.published},false,{milestone_id:data.id});
   return json({ok:true,record:data});
  }
  if(request.method==='DELETE'){
   if(collection==='profile')return json({error:'The primary profile cannot be deleted'},400);
   if(collection==='categories'){const category=(await db.list('categories')).find(c=>c.id===path[2]);if(category&&(await db.list('projects')).some(p=>p.category===category.name))return json({error:'Reassign projects in this category before deleting it.'},409);}
   if(collection==='journey')await db.remove('reflections',path[2]+'-reflection');
   await db.remove(collection,path[2]);return json({ok:true});
  }
  return json({error:'Method not allowed'},405);
 }catch(e){console.error('API operation failed',e instanceof Error?e.message:'Unknown');return json({error:e instanceof Error&&/URL|Invalid|valid email|record|link|large|identifier/.test(e.message)?e.message:'Unable to complete this request. Please try again.'},500);}
}
