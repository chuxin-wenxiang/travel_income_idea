import {cp,mkdir,rename,access,mkdtemp,rm} from 'node:fs/promises';
import {resolve,dirname,join,basename} from 'node:path';import {homedir} from 'node:os';import {fileURLToPath} from 'node:url';
const root=resolve(fileURLToPath(new URL('..',import.meta.url)));
const args=process.argv.slice(2);const index=args.indexOf('--dest');
if(index>=0&&!args[index+1])throw Error('--dest 需要路径');
const destination=resolve(index>=0?args[index+1]:join(process.env.CODEX_HOME||join(homedir(),'.codex'),'skills','travel-income-assistant'));
const updating=args.includes('--update');
const backupRoot=index>=0?join(dirname(destination),'.travel-skill-backups'):join(process.env.CODEX_HOME||join(homedir(),'.codex'),'skill-backups');
const files=['SKILL.md','docs/model.md','docs/product.md','docs/sources.md','data/pilots.json','data/100_玩法完整清单.json','web/engine.mjs','lib/jobicy.mjs','scripts/calculate.mjs','scripts/discover.mjs','scripts/domestic.mjs','web/domestic.mjs','data/domestic-sources.json','data/shanghai-review.json','docs/shanghai-validation.md','docs/opportunity-map.md','docs/multi-stop-business.md','data/opportunity-map.json'];
try{
 let exists=false;try{await access(destination);exists=true;}catch{}
 if(exists&&!updating)throw Error('目标已存在；更新请加 --update（会保留旧版本备份）');
 await mkdir(dirname(destination),{recursive:true});const staging=await mkdtemp(join(dirname(destination),'.travel-skill-'));
 try{for(const f of files){const target=join(staging,f);await mkdir(dirname(target),{recursive:true});await cp(join(root,f),target);}
 let backup;if(exists){await mkdir(backupRoot,{recursive:true});backup=join(backupRoot,basename(destination)+'-'+Date.now());await rename(destination,backup);}
 try{await rename(staging,destination);}catch(e){if(backup)await rename(backup,destination);throw e;}
 console.log(JSON.stringify({installed:destination,backup:backup||null,files:files.length}));
 }catch(e){await rm(staging,{recursive:true,force:true});throw e;}
}catch(e){console.error(e.message);process.exitCode=1;}
