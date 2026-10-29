export const STATUSES=['discovered','contacted','confirmed','completed','closed'];
export const LABELS={discovered:'待核验',contacted:'已联系',confirmed:'已确认合作',completed:'已完成',closed:'已关闭'};
export function safeURL(s){try{const u=new URL(s);return u.protocol==='https:'&&!u.username&&!u.password?u.href:null;}catch{return null;}}
export function validateOpportunity(o){
  if(!o||typeof o!=='object')throw Error('机会格式不正确');
  for(const k of ['id','title','city','sourceUrl','excerpt','checkedAt','deadline','status','kind'])if(typeof o[k]!=='string')throw Error('机会缺少字段：'+k);
  if(!/^[a-zA-Z0-9-]{1,100}$/.test(o.id)||o.title.trim().length<2||o.title.length>300||o.excerpt.length>10000||!safeURL(o.sourceUrl))throw Error('请填写标题、有效 HTTPS 来源和适量原文');
  if(!STATUSES.includes(o.status)||!['lead','recruitment'].includes(o.kind))throw Error('机会类型或状态无效');
  if(!Number.isFinite(Date.parse(o.checkedAt)))throw Error('核验时间无效');
  if(o.deadline&&(!/^\d{4}-\d{2}-\d{2}$/.test(o.deadline)||new Date(o.deadline+'T00:00:00Z').toISOString().slice(0,10)!==o.deadline))throw Error('截止日期无效');
  if(['confirmed','completed'].includes(o.status)&&(!o.confirmation?.trim()||o.kind==='lead'))throw Error('确认合作前需要明确招募和对方确认内容');
  return {...o,sourceUrl:safeURL(o.sourceUrl)};
}
export function freshness(o,now=new Date()){
  const today=new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Shanghai',year:'numeric',month:'2-digit',day:'2-digit'}).format(now);
  if(o.status==='closed')return '已关闭';
  if(o.deadline&&o.deadline<today)return '招募截止';
  if(now-new Date(o.checkedAt)>7*86400000)return '超过 7 天未核验';
  return o.deadline?'日期尚未截止，需查看原文':'截止日期未知，需查看原文';
}
export function validateBackup(data){
  if(data?.version!==1||!Array.isArray(data.opportunities)||data.opportunities.length>500||!data.plans||typeof data.plans!=='object'||Array.isArray(data.plans))throw Error('不是有效的备份文件（最多 500 条）');
  for(const plan of Object.values(data.plans)){if(!plan||typeof plan!=='object'||Array.isArray(plan))throw Error('计划格式无效');if(plan.inputs&&Object.values(plan.inputs).some(v=>typeof v!=='number'||!Number.isFinite(v)||v<0))throw Error('计划输入无效');if(plan.actual&&['income','cost','hours'].some(k=>!Number.isFinite(plan.actual[k])||plan.actual[k]<0))throw Error('实际结果无效');}
  const opportunities=data.opportunities.map(validateOpportunity);if(new Set(opportunities.map(o=>o.id)).size!==opportunities.length)throw Error('备份含重复机会');
  return {version:1,opportunities,plans:data.plans};
}
export function upsert(items,item){validateOpportunity(item);const i=items.findIndex(o=>o.id===item.id||o.sourceUrl===item.sourceUrl);if(i<0)return [...items,item];return items.map((o,n)=>n===i?{...item,id:o.id}:o);}
