import {ProjectDetail} from '@/components/projects';
import {Store} from '@/server/repository';
import {notFound} from 'next/navigation';
export const dynamic='force-dynamic';
async function project(slug:string){const db=new Store({SUPABASE_URL:process.env.SUPABASE_URL,SUPABASE_SERVICE_ROLE_KEY:process.env.SUPABASE_SERVICE_ROLE_KEY});return (await db.list('projects',true)).find(p=>p.slug===slug);}
export async function generateMetadata({params}:{params:Promise<{slug:string}>}){const {slug}=await params;const p=await project(slug);return p?{title:p.title,description:p.description,openGraph:{title:p.title+' | Atul Joshi',description:p.description}}:{title:'Project not found',robots:{index:false}};}
export default async function ProjectPage({params}:{params:Promise<{slug:string}>}){const {slug}=await params;if(!await project(slug))notFound();return <ProjectDetail/>;}
