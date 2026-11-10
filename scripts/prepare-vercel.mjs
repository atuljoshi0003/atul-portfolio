import {mkdirSync,copyFileSync,writeFileSync} from 'node:fs';
copyFileSync('deploy/vercel-sitemap.ts','app/sitemap.ts');
mkdirSync('app/api/[...path]',{recursive:true});copyFileSync('deploy/vercel-route.ts','app/api/[...path]/route.ts');
mkdirSync('app/projects/[slug]',{recursive:true});copyFileSync('deploy/vercel-project.tsx','app/projects/[slug]/page.tsx');
writeFileSync('next.config.ts',`import type {NextConfig} from 'next';\nconst config:NextConfig={images:{unoptimized:true}};\nexport default config;\n`);
console.log('Vercel routes prepared. Run npm run build:next.');
