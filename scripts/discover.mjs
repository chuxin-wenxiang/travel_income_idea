import {createJobicyClient} from '../lib/jobicy.mjs';
import {resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
try{console.log(JSON.stringify(await createJobicyClient({cacheDir:resolve(fileURLToPath(new URL('..',import.meta.url)),'.cache')}).load(),null,2));}catch(e){console.error(e.message);process.exitCode=1;}
