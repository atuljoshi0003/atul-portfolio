/// <reference types="@cloudflare/workers-types" />
export type Env = { DB?:D1Database;BUCKET?:R2Bucket;SUPABASE_URL?:string;SUPABASE_SERVICE_ROLE_KEY?:string;SUPABASE_ANON_KEY?:string;ADMIN_USER_ID?:string;OWNER_BOOTSTRAP?:string;[key:string]:any };
export const tables:Record<string,string>={profile:'profile',experiences:'experiences',projects:'projects',categories:'categories',skills:'skills',tools:'tools',journey:'journey_milestones',reflections:'learning_reflections',challenges:'internal_challenges',contacts:'contact_submissions',media:'project_media'};
export class Store {
 constructor(public env:Env){}
 async rest(path:string,init:RequestInit={}):Promise<any>{
  const r=await fetch(`${this.env.SUPABASE_URL}/rest/v1/${path}`,{...init,headers:{apikey:this.env.SUPABASE_SERVICE_ROLE_KEY!,Authorization:`Bearer ${this.env.SUPABASE_SERVICE_ROLE_KEY}`,'Content-Type':'application/json',Prefer:'return=representation',...init.headers}});
  if(!r.ok)throw new Error('Database operation failed');const text=await r.text();return text?JSON.parse(text):null;
 }
 async list(collection:string,publicOnly=false){
  const table=tables[collection];if(!table)throw new Error('Invalid collection');
  let rows:any[]=[];
  if(this.env.DB){const r=await this.env.DB.prepare(`SELECT id, data FROM ${table}${publicOnly?' WHERE published = 1':''}`).all();rows=r.results;}
  else rows=await this.rest(`${table}?select=id,data${publicOnly?'&published=eq.true':''}`);
  return rows.map(r=>({...(typeof r.data==='string'?JSON.parse(r.data):r.data),id:r.id}));
 }
 async put(collection:string,data:any,ignore=false,extra:Record<string,unknown>={}){
  const table=tables[collection];if(!table)throw new Error('Invalid collection');
  const row={id:data.id,data:JSON.stringify(data),published:data.published?1:0,...extra};
  if(this.env.DB){const keys=Object.keys(row);const vals=Object.values(row);await this.env.DB.prepare(`INSERT ${ignore?'OR IGNORE ':''}INTO ${table} (${keys.join(',')}) VALUES (${keys.map(()=>'?').join(',')})${ignore?'':` ON CONFLICT(id) DO UPDATE SET ${keys.filter(k=>k!=='id').map(k=>`${k}=excluded.${k}`).join(',')}`}`).bind(...vals as any).run();}
  else {await this.rest(`${table}?on_conflict=id`,{method:'POST',headers:{Prefer:`resolution=${ignore?'ignore':'merge'}-duplicates,return=minimal`},body:JSON.stringify({...row,data,published:!!data.published})});}
 }
 async remove(collection:string,id:string){const table=tables[collection];if(this.env.DB)await this.env.DB.prepare(`DELETE FROM ${table} WHERE id = ?`).bind(id).run();else await this.rest(`${table}?id=eq.${encodeURIComponent(id)}`,{method:'DELETE'});}
 async owner(){if(this.env.ADMIN_USER_ID)return this.env.ADMIN_USER_ID;if(this.env.DB){const r=await this.env.DB.prepare('SELECT user_id FROM admins WHERE id = ?').bind('owner').first<any>();return r?.user_id||null;}return null;}
 async claim(userId:string){if(!this.env.DB)throw new Error('Owner must be configured');await this.env.DB.prepare('INSERT OR IGNORE INTO admins (id,user_id) VALUES (?,?)').bind('owner',userId).run();return (await this.owner())===userId;}
 async getMeta(id:string){if(this.env.DB){const r=await this.env.DB.prepare('SELECT value FROM metadata WHERE id=?').bind(id).first<any>();return r?.value;}const r=await this.rest(`metadata?id=eq.${encodeURIComponent(id)}&select=value`);return r[0]?.value;}
 async meta(id:string,value:string){if(this.env.DB)await this.env.DB.prepare('INSERT OR IGNORE INTO metadata(id,value) VALUES (?,?)').bind(id,value).run();else await this.rest('metadata?on_conflict=id',{method:'POST',headers:{Prefer:'resolution=ignore-duplicates,return=minimal'},body:JSON.stringify({id,value})});}
 async rateLimit(id:string,limit:number,seconds:number){
  const now=Math.floor(Date.now()/1000);const window=Math.floor(now/seconds);const key=id+':'+window;
  if(this.env.DB){const r=await this.env.DB.prepare('INSERT INTO rate_limits(id,count,expires) VALUES (?,1,?) ON CONFLICT(id) DO UPDATE SET count=count+1 RETURNING count').bind(key,now+seconds).first<any>();if(Math.random()<.02)await this.env.DB.prepare('DELETE FROM rate_limits WHERE expires < ?').bind(now).run();return Number(r.count)<=limit;}
  const r=await this.rest('rpc/check_rate_limit',{method:'POST',body:JSON.stringify({key,maximum:limit,expires_at:now+seconds})});return r===true;
 }
}
