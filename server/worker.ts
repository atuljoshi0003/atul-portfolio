import {api} from './api';
import {Store,type Env} from './repository';
import {assets,sourceArchive} from './generated-assets';
const escape=(s:string)=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]!));
const headers={'X-Content-Type-Options':'nosniff','Referrer-Policy':'strict-origin-when-cross-origin','Permissions-Policy':'camera=(), microphone=(), geolocation=()','Content-Security-Policy':"default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; media-src 'self' https: blob:; font-src 'self'; connect-src 'self' https://*.supabase.co wss://*.supabase.co; frame-src https://www.youtube.com https://www.youtube-nocookie.com https://player.vimeo.com; object-src 'none'; base-uri 'self'; form-action 'self'; frame-ancestors 'self' https://chatgpt.com https://*.chatgpt.com https://*.chatgpt.site"};
export default {async fetch(request:Request,env:Env):Promise<Response>{
 const url=new URL(request.url),path=decodeURIComponent(url.pathname);let response:Response;
 try{
 if(path==='/api/admin/source'){const session=await api(new Request(url.origin+'/api/session',{headers:request.headers}),env);const user=await session.json() as any;response=user.admin?new Response(decodeAsset({base64:sourceArchive,type:'application/zip'}),{headers:{'Content-Type':'application/zip','Content-Disposition':'attachment; filename=atul-joshi-portfolio-source.zip','Cache-Control':'no-store'}}):new Response('Owner access required',{status:403});}
 else if(path.startsWith('/api/'))response=await api(request,env);
 else if(path==='/robots.txt')response=new Response(`User-agent: *\nAllow: /\nDisallow: /admin\nDisallow: /api/\nDisallow: /project\nSitemap: ${url.origin}/sitemap.xml\n`,{headers:{'Content-Type':'text/plain'}});
 else if(path==='/sitemap.xml'){
  let projects:any[]=[];try{projects=await new Store(env).list('projects',true);}catch{}
  const routes=['','/about','/experience','/projects','/journey','/toolkit','/contact',...projects.map(p=>'/projects/'+p.slug)];
  response=new Response(`<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${routes.map(p=>`<url><loc>${escape(url.origin+p)}</loc></url>`).join('')}</urlset>`,{headers:{'Content-Type':'application/xml'}});
 }else{
  const projectMatch=path.match(/^\/projects\/([a-z0-9-]+)\/?$/);let project:any=null;
  if(projectMatch){try{project=(await new Store(env).list('projects',true)).find(p=>p.slug===projectMatch[1]);}catch{}if(!project)return new Response(decodeAsset(assets['/404.html']),{status:404,headers:{...headers,'Content-Type':'text/html'}});}
  let key=path==='/'?'/index.html':path.replace(/\/$/,'');if(projectMatch)key='/project.html';else if(!assets[key]&&!key.includes('.'))key+='.html';
  const asset=assets[key]||assets['/404.html'];const status=assets[key]?200:404;
  if(!asset)return new Response('Not found',{status:404,headers});
  let bytes:Uint8Array|string=decodeAsset(asset);
  if(asset.type.startsWith('text/html')){
   let html=new TextDecoder().decode(bytes as Uint8Array);
   if(project){const title=escape(project.title+' | Atul Joshi'),description=escape(project.description);html=html.replace(/<title>.*?<\/title>/,`<title>${title}</title>`).replace(/(<meta name="description" content=")[^"]*/,`$1${description}`).replace(/(<meta property="og:title" content=")[^"]*/,`$1${title}`).replace(/(<meta property="og:description" content=")[^"]*/,`$1${description}`);html=html.replace('</head>',`<link rel="canonical" href="${escape(url.origin+path)}"/></head>`);}
   else if(!path.startsWith('/admin'))html=html.replace('</head>',`<link rel="canonical" href="${escape(url.origin+path)}"/></head>`);
   bytes=html;
  }
  response=new Response(bytes as any,{status,headers:{'Content-Type':asset.type,'Cache-Control':asset.type.startsWith('text/html')?'no-cache':key.startsWith('/_next/')?'public,max-age=31536000,immutable':'public,max-age=86400'}});
 }
 const resultHeaders=new Headers(response.headers);for(const [key,value]of Object.entries(headers))resultHeaders.set(key,value);if(path.startsWith('/admin'))resultHeaders.set('X-Robots-Tag','noindex, nofollow');return new Response(response.body,{status:response.status,headers:resultHeaders});
 }catch(e){console.error('Request failed',e instanceof Error?e.message:'unknown');return new Response('Temporarily unavailable. Please refresh.',{status:503,headers});}
}};
function decodeAsset(asset:{base64:string;type:string}){return Uint8Array.from(atob(asset.base64),c=>c.charCodeAt(0));}
