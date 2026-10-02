const { TELEGRAM_BOT_TOKEN: token, TELEGRAM_WEBHOOK_SECRET: secret, APP_ORIGIN: origin } = process.env;
if (!token || !secret || !origin?.startsWith('https://')) throw new Error('Set TELEGRAM_BOT_TOKEN, TELEGRAM_WEBHOOK_SECRET and public HTTPS APP_ORIGIN in the deployment environment.');
if (!/^[A-Za-z0-9_-]{32,256}$/.test(secret)) throw new Error('Webhook secret must contain 32–256 URL-safe characters.');
const call = async(method,body)=>{
  const response=await fetch(`https://api.telegram.org/bot${token}/${method}`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body),signal:AbortSignal.timeout(15000)});
  const data=await response.json();
  if(!response.ok || !data.ok) throw new Error(`Telegram ${method} failed (status ${response.status}); verify configuration.`);
  return data.result;
};
const bot=await call('getMe',{});
if(process.env.TELEGRAM_BOT_USERNAME && process.env.TELEGRAM_BOT_USERNAME!==bot.username) throw new Error('TELEGRAM_BOT_USERNAME does not match this bot.');
await call('setWebhook',{url:new URL('/api/telegram/webhook',origin).href,secret_token:secret,allowed_updates:['message'],drop_pending_updates:false});
console.log(`Webhook configured for @${bot.username}. Participants can link accounts from the website.`);
