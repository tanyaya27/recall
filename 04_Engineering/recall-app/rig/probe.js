const { chromium } = require('playwright'); const http=require('http'),fs=require('fs'),path=require('path');
const ROOT=path.join(__dirname,'out'); const server=http.createServer((q,s)=>{const f=path.join(ROOT,q.url.split('?')[0]==='/'?'index.html':q.url.split('?')[0]); if(!fs.existsSync(f)){s.writeHead(404);return s.end();} s.writeHead(200,{'content-type':{'.html':'text/html','.js':'text/javascript','.css':'text/css'}[path.extname(f)]}); fs.createReadStream(f).pipe(s);});
(async()=>{ await new Promise(r=>server.listen(8098,r)); const b=await chromium.launch(); const p=await b.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true});
 await p.addInitScript(()=>localStorage.setItem('recall-ai-config',JSON.stringify({provider:'anthropic',apiKey:'x'})));
 await p.goto('http://localhost:8098/'); await p.waitForSelector('.footer'); await p.waitForTimeout(300);
 const r = await p.evaluate(()=>[...document.querySelectorAll('.footer-inner > *')].map(e=>{const c=getComputedStyle(e);return {tag:e.tagName,cls:e.className,fs:c.fontSize,fw:c.fontWeight,pad:c.padding,h:e.getBoundingClientRect().height,w:e.getBoundingClientRect().width,color:c.color,lh:c.lineHeight}}));
 console.log(JSON.stringify(r,null,1)); await b.close(); server.close(); })();
