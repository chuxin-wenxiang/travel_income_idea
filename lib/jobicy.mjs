import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {resolve} from 'node:path';
export const FEED='https://jobicy.com/api/jobs?count=100';
export function normalizeFeed(data, fetchedAt) {
  if(data?.success===false||!Array.isArray(data?.jobs))throw Error('上游数据格式变化，未将其作为有效结果');
  const jobs=data.jobs.map(j=>{
    if(!Number.isSafeInteger(j.id)||j.id<=0||typeof j.jobTitle!=='string')throw Error('职位字段不完整');
    const url=new URL(j.url);if(url.protocol!=='https:'||url.hostname!=='jobicy.com')throw Error('职位来源链接不合法');
    return {id:'jobicy-'+j.id,externalId:j.id,title:j.jobTitle,company:j.companyName||'未提供',city:j.jobGeo||'未提供',type:(j.jobType||[]).join(' / '),sourceUrl:url.href,source:'Jobicy',kind:'recruitment',excerpt:j.jobExcerpt||'',publishedAt:j.pubDate||null,checkedAt:fetchedAt,deadline:'',status:'discovered',salary:{min:j.salaryMin??null,max:j.salaryMax??null,currency:j.salaryCurrency||null,period:j.salaryPeriod||null}};
  });
  return {source:'Jobicy',sourceUrl:'https://jobicy.com/jobs-rss-feed',fetchedAt,jobs,nextPageAvailable:Boolean(data.hasMore),coverage:'最近 7 天内发布的最多 100 条远程职位；非完整岗位库，源数据有延迟。'};
}
export function createJobicyClient({fetchImpl=fetch,cacheDir=resolve('.cache'),now=()=>new Date(),ttl=3600000}={}) {
  let pending;let lastFailure=0;
  async function load(){
    let saved;try{saved=JSON.parse(await readFile(resolve(cacheDir,'jobicy.json'),'utf8'));if(!Array.isArray(saved.jobs))saved=null;}catch{}
    const age=saved?now()-new Date(saved.fetchedAt):Infinity;
    if(saved&&age>=0&&age<ttl)return {...saved,cached:true,stale:false};
    if(lastFailure&&now().getTime()-lastFailure<60000)throw Error('来源暂不可用，请一分钟后重试');
    try{
      const r=await fetchImpl(FEED,{signal:AbortSignal.timeout(20000),redirect:'error',headers:{Accept:'application/json'}});
      if(!r.ok)throw Error('来源返回 HTTP '+r.status);
      const body=await r.text();if(body.length>4_000_000)throw Error('来源响应过大');
      const normalized=normalizeFeed(JSON.parse(body),now().toISOString());
      await mkdir(cacheDir,{recursive:true});await writeFile(resolve(cacheDir,'jobicy.json'),JSON.stringify(normalized));
      return {...normalized,cached:false,stale:false};
    }catch(e){lastFailure=now().getTime();if(saved)return {...saved,cached:true,stale:true,error:'本次更新失败，显示旧缓存：'+e.message};throw Error('公开来源暂不可用：'+e.message);}
  }
  return {load(){if(!pending)pending=load().finally(()=>pending=null);return pending;}};
}
