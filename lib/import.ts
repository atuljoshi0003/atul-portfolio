import * as XLSX from 'xlsx';
export type Challenge = {id:string;source:string;original_number:string;title:string;category:string;original_status:string;completion_date:string;notes:string};
const clean=(v:unknown)=>String(v??'').trim();
const norm=(v:unknown)=>clean(v).toLowerCase().replace(/[^a-z0-9#]/g,'');
function dateString(v:unknown){if(v instanceof Date)return v.toISOString().slice(0,10);if(typeof v==='number'){const d=XLSX.SSF.parse_date_code(v);return d?`${d.y}-${String(d.m).padStart(2,'0')}-${String(d.d).padStart(2,'0')}`:'';}return clean(v);}
export function parseWorkbook(bytes:ArrayBuffer):{records:Challenge[];warnings:string[]}{
 const workbook=XLSX.read(bytes,{type:'array',cellDates:true}); const found=new Map<string,Challenge>(); const warnings:string[]=[];
 for(const name of workbook.SheetNames){
  const rows=XLSX.utils.sheet_to_json<unknown[]>(workbook.Sheets[name],{header:1,defval:'',raw:true});
  const header=rows.findIndex(row=>row.some(v=>['challenge','challengetitle','task','tasktitle','title'].includes(norm(v)))&&row.some(v=>['#','no','number','challengenumber','taskid','id','srno'].includes(norm(v))));
  if(header<0)continue;
  const h=rows[header].map(norm); const find=(options:string[])=>h.findIndex(v=>options.includes(v));
  const cols={number:find(['#','no','number','challengenumber','taskid','id','srno']),title:find(['challenge','challengetitle','task','tasktitle','title']),category:find(['category']),status:find(['status','taskstatus']),date:find(['datecompleted','completiondate','completeddate']),notes:find(['proofnotes','notes','proof','comments'])};
  for(let i=header+1;i<rows.length;i++){
   const row=rows[i];const num=clean(row[cols.number]);const title=clean(row[cols.title]);
   if(!num||!title||!/^\d+$/.test(num))continue;
   const id='hiveschool-c3-'+num;if(found.has(id))throw new Error(`Duplicate original identifier ${num}. Remove duplicates before importing.`);
   found.set(id,{id,source:'hiveschool-c3',original_number:num,title,category:clean(row[cols.category]),original_status:clean(row[cols.status])||'Not Started',completion_date:dateString(row[cols.date]),notes:clean(row[cols.notes])});
  }
 }
 if(!found.size)throw new Error('No challenge table found. Include #, Category, Challenge, Status, Date Completed and Proof / Notes columns.');
 if(found.size>2000)throw new Error('This import exceeds the 2,000 record limit.');
 return {records:[...found.values()],warnings};
}
export function mapCategory(category:string){if(/ai|autom/i.test(category))return 'AI & Automation';if(/gtm/i.test(category))return 'Go-To-Market';if(/d2c|commerce/i.test(category))return 'D2C & Branding';if(/saas/i.test(category))return 'SaaS & Technology';if(/sales|linkedin/i.test(category))return 'Sales & Revenue';if(/research|learning/i.test(category))return 'Research & Analysis';if(/creative|content/i.test(category))return 'Content & Creativity';if(/strategy|finance|framework/i.test(category))return 'Business Strategy';return 'Personal Experiments';}
