export default function handler(req,res){res.setHeader('Cache-Control','no-store');res.status(200).json({url:process.env.MULTIPLAYER_WS_URL||''})}
