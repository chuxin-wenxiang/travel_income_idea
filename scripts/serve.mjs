import http from 'node:http';
import {readFile} from 'node:fs/promises';
import {resolve,extname} from 'node:path';
import {fileURLToPath} from 'node:url';
import {createJobicyClient} from '../lib/jobicy.mjs';
export function createServer({root=resolve(fileURLToPath(new URL('..',import.meta.url))),client=createJobicyClient({cacheDir:resolve(root,'.cache')})}={}){
const types={'.html':'text/html; charset=utf-8','.css':'text/css','.mjs':'text/javascript','.json':'application/json'};
return http.createServer(async(req,res)=>{
  res.setHeader('X-Content-Type-Options','nosniff');res.setHeader('Referrer-Policy','no-referrer');
  res.setHeader('Content-Security-Policy',"default-src 'self'; script-src 'self'; style-src 'self'; connect-src 'self'; img-src 'self' data:; frame-ancestors 'none'; base-uri 'none'; form-action 'none'");
  const host=req.headers.host||'';if(!/^(127\.0\.0\.1|localhost)(:\d+)?$/.test(host)){res.writeHead(403);return res.end('Local access only');}
  if(req.method!=='GET'){res.writeHead(405);return res.end('GET only');}
  try{
    let path=decodeURIComponent(new URL(req.url,'http://localhost').pathname);
    if(path==='/api/jobicy'){
      if(req.headers['sec-fetch-site']==='cross-site'){res.writeHead(403);return res.end('Local access only');}
      res.setHeader('Content-Type','application/json; charset=utf-8');res.setHeader('Cache-Control','no-store');
      try{return res.end(JSON.stringify(await client.load()));}catch(e){res.writeHead(502);return res.end(JSON.stringify({error:e.message}));}
    }
    if(path==='/'||path==='/web/'){res.writeHead(302,{Location:'/web/workbench.html'});return res.end();}
    if(!(path.startsWith('/web/')||path.startsWith('/data/')))throw Error();
    const file=resolve(root,'.'+path);if(!file.startsWith(root+'/web/')&&!file.startsWith(root+'/data/'))throw Error();
    res.setHeader('Content-Type',types[extname(file)]||'text/plain');res.end(await readFile(file));
  }catch{res.writeHead(404);res.end('Not found');}
});}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 const port=Number(process.env.PORT||4173);const server=createServer();server.on('error',e=>{console.error('服务启动失败：'+e.message);process.exitCode=1;});server.listen(port,'127.0.0.1',()=>console.log(`Local: http://127.0.0.1:${port}/`));
}
