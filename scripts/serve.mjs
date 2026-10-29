import http from 'node:http';
import {readFile} from 'node:fs/promises';
import {resolve,extname} from 'node:path';
const root=resolve(import.meta.dirname,'..');
const types={'.html':'text/html; charset=utf-8','.css':'text/css','.mjs':'text/javascript','.json':'application/json'};
http.createServer(async(req,res)=>{try{let path=decodeURIComponent(new URL(req.url,'http://localhost').pathname);if(path==='/'||path==='/web/')path='/web/index.html';if(!(path.startsWith('/web/')||path.startsWith('/data/')))throw Error();const file=resolve(root,'.'+path);if(!file.startsWith(root+'/web/')&&!file.startsWith(root+'/data/'))throw Error();res.setHeader('Content-Type',types[extname(file)]||'text/plain');res.end(await readFile(file));}catch{res.writeHead(404);res.end('Not found');}}).listen(4173,'127.0.0.1',()=>console.log('Local: http://127.0.0.1:4173/web/'));
