import {products} from "../../catalog.js";
const json=(body,status=200)=>Response.json(body,{status,headers:{"Cache-Control":"no-store"}});
export async function onRequestPost({request,env}){
 if(request.headers.get("Origin")!==new URL(request.url).origin)return json({error:"Invalid origin."},403);
 // Fail closed even when Stripe credentials have already been configured.
 if(env.CHECKOUT_ENABLED!=="true")return json({error:"Online payments are disabled until launch. Please request a quote."},503);
 // This implementation deliberately has no live-payment path.
 if(env.CHECKOUT_MODE!=="test"||!env.STRIPE_SECRET_KEY?.startsWith("sk_test_"))return json({error:"Test checkout is not configured. Please request a quote."},503);
 try{
 const body=await request.json();if(!Array.isArray(body.items)||!body.items.length||body.items.length>30)return json({error:"Invalid cart."},400);
 const seen=new Set(),params=new URLSearchParams({mode:"payment",success_url:new URL("/?checkout=test-complete#cart",request.url).href,cancel_url:new URL("/#cart",request.url).href});
 for(const [i,item] of body.items.entries()){
 const p=products.find(p=>p.id===item.id);
 if(!p||seen.has(p.id)||!p.available||!p.priceId||!Number.isInteger(p.priceCents)||p.priceCents<=0||!Number.isInteger(item.quantity)||item.quantity<1||item.quantity>999)return json({error:"Product pricing or availability needs confirmation. Please request a quote."},400);
 seen.add(p.id);
 // Verify Stripe price belongs to test mode and matches our server catalog.
 const check=await fetch("https://api.stripe.com/v1/prices/"+encodeURIComponent(p.priceId),{headers:{Authorization:"Bearer "+env.STRIPE_SECRET_KEY}});
 const price=await check.json();if(!check.ok||price.livemode!==false||!price.active||price.currency!=="usd"||price.unit_amount!==p.priceCents||price.type!=="one_time")return json({error:"Test product configuration needs review."},503);
 params.set("line_items["+i+"][price]",p.priceId);params.set("line_items["+i+"][quantity]",String(item.quantity));
 }
 // Do not imply an order fulfillment system exists; this is test checkout only.
 const response=await fetch("https://api.stripe.com/v1/checkout/sessions",{method:"POST",headers:{Authorization:"Bearer "+env.STRIPE_SECRET_KEY,"Content-Type":"application/x-www-form-urlencoded"},body:params});
 const session=await response.json();if(!response.ok||session.livemode!==false||!session.url)return json({error:"Test checkout could not be created."},502);
 return json({url:session.url});
 }catch{return json({error:"Invalid checkout request."},400);}
}
