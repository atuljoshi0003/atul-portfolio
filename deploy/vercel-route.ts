import {api} from '@/server/api';
export const dynamic='force-dynamic';
export const runtime='nodejs';
const handler=(request:Request)=>api(request,{
 SUPABASE_URL:process.env.SUPABASE_URL,
 SUPABASE_ANON_KEY:process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
 SUPABASE_SERVICE_ROLE_KEY:process.env.SUPABASE_SERVICE_ROLE_KEY,
 ADMIN_USER_ID:process.env.ADMIN_USER_ID
});
export {handler as GET,handler as POST,handler as PUT,handler as DELETE};
