// All matching runs locally. Unknown requirements never become a positive match.
export function validDate(s){return typeof s==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(s)&&Number.isFinite(Date.parse(s))&&new Date(s+'T00:00:00Z').toISOString().slice(0,10)===s;}
export function daysBetween(start,end){if(!validDate(start)||!validDate(end)||end<start)throw Error('请填写有效且顺序正确的日期');return (Date.parse(end)-Date.parse(start))/86400000+1;}
export function assess(o,p,today=new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Shanghai',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date())){
 const duration=daysBetween(p.start,p.end);if(!validDate(today))throw Error('核验日期无效');
 const excluded=[],pending=[];
 if(!p.city?.trim()||!o.city?.trim())throw Error('请填写旅行和工作城市');
 if(o.city.trim()!==p.city.trim())excluded.push('工作城市与旅行城市不一致');
 for(const k of ['start','end','published'])if(o[k]&&!validDate(o[k]))throw Error('来源日期无效：'+k);
 if(o.start&&o.end&&o.end<o.start)throw Error('工作结束不能早于开始');
 if(!o.dateUncertain&&o.end&&o.end<today)excluded.push('正文工作日期已经过去，页面截止日不能覆盖它');
 if(!o.dateUncertain&&o.start&&o.end&&(o.start<p.start||o.end>p.end))excluded.push('无法覆盖完整工作日期；需要另行确认是否可选班');
 if(!o.start||!o.end)pending.push('缺少明确年份的工作起止日');
 if(o.dateUncertain)pending.push('正文未写年份或日期有冲突，需向发布方确认');
 if(o.published&&(Date.parse(today)-Date.parse(o.published))/86400000>30)pending.push('发布/更新已超过 30 天，需重新确认仍在招募');
 if(!o.published)pending.push('发布时间未知');
 if(!['yes','no','unknown'].includes(o.camera)||!['yes','no','unknown'].includes(o.student))throw Error('资格信息格式无效');
 if(o.camera==='yes'&&!p.camera)excluded.push('需要自备设备，当前未具备');
 if(o.student==='yes'&&!p.student)excluded.push('限在校生，当前不符合');
 if(o.skill==='photography'&&!p.photography)excluded.push('需要可交付的摄影/修图能力，当前未具备');
 if(o.camera==='unknown'||o.student==='unknown'||o.skill==='unknown')pending.push('设备、身份或技能要求尚未核清');
 if(o.minDays!==null&&(!Number.isInteger(o.minDays)||o.minDays<1))throw Error('最短工期需为正整数或未知');
 if(o.minDays===null)pending.push('最短工期未知');else if(o.minDays>duration)excluded.push('最短工期长于本次旅行');
 if(o.hours!==null&&(!Number.isFinite(o.hours)||o.hours<=0||o.hours>24))throw Error('每班工时需在 0 到 24 小时之间或未知');
 if(!Number.isFinite(p.maxHours)||p.maxHours<=0||p.maxHours>24)throw Error('每日工作上限无效');
 if(o.hours===null)pending.push('每班总工时未知');else if(o.hours>p.maxHours)excluded.push('每班工时超过用户上限');
 if(o.category==='swap'&&p.cashOnly)excluded.push('换宿是费用减免，不能作为现金收入');
 if(o.fee==='yes')excluded.push('要求先付费用：停止按普通兼职推进，先核查收费依据');
 if(o.fee==='unknown')pending.push('是否存在报名费、押金或培训费尚未核清');
 if(o.application!=='platform'&&o.application!=='direct')pending.push(o.application==='placeholder'?'报名联系方式为占位文字，不能据此报名':'申请入口尚未核实');
 if(o.application==='platform')pending.push('需在原平台登录/使用 APP，尚未验证账号能否投递');
 if(o.kind!=='recruitment')excluded.push('只有报道或活动信息，不是当前明确招募');
 if(!['photo','event','swap'].includes(o.category))throw Error('机会类别无效');
 if(!['none','photography','unknown'].includes(o.skill))throw Error('技能要求无效');
 if(!['yes','no','unknown'].includes(o.fee))throw Error('费用信息无效');
 return {status:excluded.length?'excluded':pending.length?'pending':'candidate',excluded,pending,confirmedIncome:0,duration};
}
export function hints(text){
 if(typeof text!=='string'||text.length>10000)throw Error('正文最多 10000 字');
 const notes=[];
 if(/\[(?:邮箱.?联系方式|此处填[^\]]*|联系方式)\]/.test(text))notes.push('发现联系方式占位符；请将申请入口选为“占位文字”。');
 if(/\d{1,2}月\d{1,2}日?\s*[-—至到]/.test(text))notes.push('正文含工作日期范围；请核对年份及完整班次，不要用页面截止日代替。');
 if(/元\s*[\/／每]\s*月|月薪|年薪/.test(text))notes.push('月薪/年薪不能直接当本次旅行收入，先确认短期结算金额。');
 if(/押金|报名费|培训费|保证金/.test(text))notes.push('正文提到费用；请阅读上下文确认是否收取，关键词本身不代表要求付款。');
 if(/换宿|包住|住宿/.test(text))notes.push('住宿减免与现金报酬分开记录；确认房型、工作时长和取消安排。');
 return notes;
}
export function report(o,p,r){return `国内来源核验（用户本地填写，未联系雇主）\n旅行：${p.city} ${p.start} 至 ${p.end}；每日最多 ${p.maxHours} 小时\n类别：${{photo:'旅拍/活动摄影',event:'展会兼职',swap:'换宿'}[o.category]}\n工作日期：${o.start||'未知'} 至 ${o.end||'未知'}${o.dateUncertain?'（年份/日期待确认）':''}\n来源更新时间：${o.published||'未知'}\n最短工期：${o.minDays??'未知'} 天；每班工时：${o.hours??'未知'} 小时\n筛选结果：${{excluded:'不适合本次行程',pending:'信息不足，待核验',candidate:'条件初步匹配，待对方确认'}[r.status]}\n${[...r.excluded,...r.pending].map(s=>'- '+s).join('\n')}\n确认收入：0 元（未报名、未获录用，报价不等于到账）`;}
