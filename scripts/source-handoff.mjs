// Credential-safe fallback for environments where the Sites source helper is absent.
// Credentials arrive through stdin, stay in memory, and are never written or logged.
import {spawnSync} from 'node:child_process';
import {readFileSync} from 'node:fs';
const {credential}=JSON.parse(readFileSync(0,'utf8'));
function git(args,authenticated=false){
 const gitEnv={...process.env,GIT_TERMINAL_PROMPT:'0'};
 if(authenticated&&credential.auth_mode!=='work_proxy'){
  const origin=new URL(credential.remote_url).origin;
  gitEnv.GIT_CONFIG_COUNT='1';gitEnv.GIT_CONFIG_KEY_0=`http.${origin}/.extraheader`;
  gitEnv.GIT_CONFIG_VALUE_0='Authorization: Bearer '+credential.token;
 }
 const r=spawnSync('git',args,{encoding:'utf8',env:gitEnv});
 if(r.status!==0){process.stderr.write((r.stderr||'Git operation failed').replaceAll(credential.token||'__NO_TOKEN__','[redacted]'));process.exit(1);}return r.stdout.trim();
}
if(!spawnSync('git',['rev-parse','--git-dir']).status){}else git(['init','-b',credential.branch]);
git(['config','user.name','Codex']);git(['config','user.email','codex@openai.com']);
const remotes=git(['remote']);if(!remotes.split('\n').includes('origin'))git(['remote','add','origin',credential.remote_url]);
git(['add','.']);const changed=git(['status','--porcelain']);if(changed)git(['commit','-m','Build Atul Joshi portfolio and private publishing workspace']);
git(['push','-u','origin',credential.branch],true);
console.log(JSON.stringify({commit_sha:git(['rev-parse','HEAD'])}));
