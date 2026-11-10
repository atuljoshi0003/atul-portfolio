export const dynamic='force-static';
import {origin} from '@/lib/site';
export default function robots(){return {rules:{userAgent:'*',allow:'/',disallow:['/admin','/api/','/project']},sitemap:origin+'/sitemap.xml'};}
