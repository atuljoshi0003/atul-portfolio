export const dynamic='force-static';
import {origin} from '@/lib/site';
export default function sitemap(){return ['','/about','/experience','/projects','/journey','/toolkit','/contact'].map(p=>({url:origin+p}));}
