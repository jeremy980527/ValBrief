import express from 'express'
import cors from 'cors'
import session from 'express-session'
import authRouter from './routes/auth'
import shopRouter from './routes/shop'
import missionsRouter from './routes/missions'
import newsRouter from './routes/news'
import teamRouter from './routes/team'
import usersRouter from './routes/users'

declare module 'express-session' {
  interface SessionData {
    userId?: string
    pendingMfaId?: string
  }
}

const app = express()
const PORT = process.env.PORT ? parseInt(process.env.PORT) : 3001

app.use(cors({ origin: true, credentials: true }))
app.use(express.json())
app.use(session({
  secret: 'valbrief-secret-2024',
  resave: false,
  saveUninitialized: false,
  cookie: { secure: false, httpOnly: true, maxAge: 86400000 },
}))

app.use('/api/users', usersRouter)
app.use('/api/auth', authRouter)
app.use('/api/shop', shopRouter)
app.use('/api/missions', missionsRouter)
app.use('/api/news', newsRouter)
app.use('/api/team', teamRouter)
app.get('/api/health', (_req, res) => res.json({ status: 'ok' }))

// Riot OAuth callback page — reads access_token from URL fragment and auto-posts to backend
app.get('/riot-callback', (_req, res) => {
  res.setHeader('Content-Type', 'text/html; charset=utf-8')
  res.send(`<!DOCTYPE html>
<html lang="zh-TW">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>ValBrief — 連結中</title>
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{background:#0d0d0d;color:#fff;font-family:-apple-system,BlinkMacSystemFont,sans-serif;height:100vh;display:flex;align-items:center;justify-content:center;flex-direction:column;gap:16px}
.spinner{width:40px;height:40px;border:3px solid #222;border-top-color:#B4FF4D;border-radius:50%;animation:spin .8s linear infinite}
@keyframes spin{to{transform:rotate(360deg)}}
p{color:#777;font-size:14px;text-align:center;max-width:280px;line-height:1.5}
.ok{color:#B4FF4D;font-size:18px}
.err{color:#ff4655}
</style>
</head>
<body>
<div class="spinner" id="sp"></div>
<p id="msg">正在連結 Riot 帳號，請稍候...</p>
<script>
(async function(){
  const p=new URLSearchParams(location.hash.slice(1));
  const at=p.get('access_token');
  if(!at){
    document.getElementById('sp').style.display='none';
    document.getElementById('msg').className='err';
    document.getElementById('msg').textContent='找不到 Token，Riot 可能拒絕了此跳轉網址。請關閉此視窗。';
    new BroadcastChannel('riot-auth').postMessage({success:false,error:'redirect_uri_rejected'});
    return;
  }
  try{
    const r=await fetch('/api/auth/link-from-callback',{
      method:'POST',credentials:'include',
      headers:{'Content-Type':'application/json'},
      body:JSON.stringify({accessToken:at})
    });
    const d=await r.json();
    const bc=new BroadcastChannel('riot-auth');
    bc.postMessage(d);
    bc.close();
    if(d.success){
      document.getElementById('sp').style.display='none';
      document.getElementById('msg').className='ok';
      document.getElementById('msg').textContent='✓ 連結成功！';
    } else {
      throw new Error(d.error||'連結失敗');
    }
  }catch(e){
    document.getElementById('sp').style.display='none';
    document.getElementById('msg').className='err';
    document.getElementById('msg').textContent='連結失敗：'+e.message;
    new BroadcastChannel('riot-auth').postMessage({success:false,error:e.message});
  }
  setTimeout(()=>window.close(),2000);
})();
</script>
</body>
</html>`)
})

app.listen(PORT, () => console.log(`ValBrief backend → http://localhost:${PORT}`))
