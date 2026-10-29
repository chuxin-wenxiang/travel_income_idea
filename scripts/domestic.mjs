import {readFile} from 'node:fs/promises';
import {assess,report} from '../web/domestic.mjs';
try{if(!process.argv[2])throw Error('用法：node scripts/domestic.mjs <JSON 文件>');const {offer,profile,asOf}=JSON.parse(await readFile(process.argv[2],'utf8'));const result=assess(offer,profile,asOf);console.log(JSON.stringify({result,report:report(offer,profile,result)},null,2));}catch(e){console.error(e.message);process.exitCode=1;}
