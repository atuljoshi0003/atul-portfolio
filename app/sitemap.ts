import {Store} from '@/server/repository';
import {origin} from '@/lib/site';
export const dynamic='force-dynamic';
export default async function sitemap(){
 const base=['','/about','/experience','/projects','/journey','/toolkit','/contact'].map(p=>({url:origin+p}));
 try{const db=new Store({SUPABASE_URL:process.env.SUPABASE_URL,SUPABASE_SERVICE_ROLE_KEY:process.env.SUPABASE_SERVICE_ROLE_KEY});const projects=await db.list('projects',true);return [...base,...projects.map(p=>({url:origin+'/projects/'+p.slug}))];}catch{return base;}
}
