const json=(body,status=200)=>Response.json(body,{status,headers:{"Cache-Control":"no-store"}});
export async function onRequestPost({request,env}){
 if(request.headers.get("Origin")!==new URL(request.url).origin)return json({error:"Invalid origin."},403);
 if(!env.INQUIRIES)return json({error:"Contact service is not configured."},503);
 if(Number(request.headers.get("Content-Length"))>16000)return json({error:"Request too large."},413);
 try{
 const raw=await request.text();if(raw.length>16000)return json({error:"Request too large."},413);const data=JSON.parse(raw);
 if(data.website)return json({error:"Invalid submission."},400);
 const lengths={name:120,email:254,phone:40,company:160,items:4000,zip:10,date:10,message:4000};
 const clean={};for(const [key,max] of Object.entries(lengths)){if(data[key]!==undefined&&typeof data[key]!=="string")return json({error:"Invalid field."},400);clean[key]=(data[key]||"").trim();if(clean[key].length>max)return json({error:"Field too long."},400);}
 if(!["contact","quote"].includes(data.kind)||!clean.name||!/^\S+@\S+\.\S+$/.test(clean.email)||data.consent!=="on"||(data.kind==="contact"&&!clean.message)||(data.kind==="quote"&&(!clean.company||!clean.items||!/^\d{5}(-\d{4})?$/.test(clean.zip))))return json({error:"Please complete all required fields."},400);
 // A per-IP cooldown is enforced atomically in D1; raw IP addresses are not stored.
 const ip=request.headers.get("CF-Connecting-IP");if(!ip)return json({error:"Unable to validate request."},400);
 const bytes=await crypto.subtle.digest("SHA-256",new TextEncoder().encode(ip+new Date().toISOString().slice(0,10)));
 const hash=Array.from(new Uint8Array(bytes),b=>b.toString(16).padStart(2,"0")).join("");
 const now=Date.now(),id=crypto.randomUUID();
 const result=await env.INQUIRIES.prepare("INSERT INTO inquiry_limits (ip_hash,last_seen) VALUES (?,?) ON CONFLICT(ip_hash) DO UPDATE SET last_seen=excluded.last_seen WHERE inquiry_limits.last_seen < ?").bind(hash,now,now-60000).run();
 if(!result.meta.changes)return json({error:"Please wait a minute before sending another inquiry."},429);
 await env.INQUIRIES.prepare("INSERT INTO inquiries (id,kind,created_at,details) VALUES (?,?,?,?)").bind(id,data.kind,new Date().toISOString(),JSON.stringify(clean)).run();
 return json({ok:true});
 }catch{return json({error:"Your inquiry could not be saved. Please try again."},500);}
}
