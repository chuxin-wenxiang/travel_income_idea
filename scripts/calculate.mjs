import {readFile} from 'node:fs/promises';
import {calculate} from '../web/engine.mjs';
try {if(!process.argv[2])throw Error('用法：node scripts/calculate.mjs plan.json');console.log(JSON.stringify(calculate(JSON.parse(await readFile(process.argv[2],'utf8'))),null,2));}catch(e){console.error(e.message);process.exitCode=1;}
