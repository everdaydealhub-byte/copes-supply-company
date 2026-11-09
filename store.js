import {products} from "./catalog.js";
const $=s=>document.querySelector(s);
const key="copes-independent-cart-v1";
let cart={};
try { const saved=JSON.parse(localStorage.getItem(key)||"{}"); for(const p of products) if(Number.isInteger(saved[p.id])&&saved[p.id]>0&&saved[p.id]<=999) cart[p.id]=saved[p.id]; } catch {}
const money=n=>new Intl.NumberFormat("en-US",{style:"currency",currency:"USD"}).format(n/100);
function el(tag,text,cls){const e=document.createElement(tag);if(text)e.textContent=text;if(cls)e.className=cls;return e;}
function save(){try{localStorage.setItem(key,JSON.stringify(cart));}catch{} renderCart();}
function renderProducts(){
 const list=$("#products");list.replaceChildren();
 const query=$("#search").value.toLowerCase();
 for(const p of products.filter(p=>(p.name+" "+p.category+" "+p.description).toLowerCase().includes(query))){
 const article=el("article",null,"product"),info=el("div",null,"product-info");
 const icon=el("div",p.icon,"product-image");icon.setAttribute("aria-hidden","true");article.append(icon);
 info.append(el("h3",p.name),el("p",p.category),el("p",p.description),el("p",p.priceCents===null?"Price and availability on request":money(p.priceCents)));
 const b=el("button","Add to inquiry cart","button");b.type="button";b.addEventListener("click",()=>{cart[p.id]=Math.min(999,(cart[p.id]||0)+1);save();});
 info.append(b);article.append(info);list.append(article);
 }if(!list.children.length)list.append(el("p","No products match your search."));
}
function renderCart(){
 const list=$("#cart-items");list.replaceChildren();let count=0,total=0,unknown=false;
 for(const p of products){const qty=cart[p.id];if(!qty)continue;count+=qty;if(p.priceCents===null)unknown=true;else total+=p.priceCents*qty;
 const row=el("div",null,"cart-row");row.append(el("strong",p.name));
 const label=el("label","Quantity");const input=el("input");input.type="number";input.min="1";input.max="999";input.value=qty;input.setAttribute("aria-label","Quantity for "+p.name);
 input.addEventListener("change",()=>{const n=Number(input.value);if(!Number.isInteger(n)||n<1||n>999){input.value=qty;return;}cart[p.id]=n;save();});label.append(input);row.append(label);
 const remove=el("button","Remove","button");remove.type="button";remove.setAttribute("aria-label","Remove "+p.name);remove.onclick=()=>{delete cart[p.id];save();};row.append(remove);list.append(row);
 }
 $("#cart-count").textContent=count;$("#cart-total").textContent=count?(unknown?"Pricing will be confirmed in your quote.":"Product subtotal: "+money(total)+"; shipping and tax calculated at checkout."):"Your cart is empty.";
 $("#checkout").disabled=!count;
}
$("#search").addEventListener("input",renderProducts);
$("#cart-quote").onclick=()=>{document.querySelector('[name=items]').value=products.filter(p=>cart[p.id]).map(p=>p.name+" — quantity "+cart[p.id]).join("\n");};
$("#checkout").onclick=async()=>{
 const status=$("#checkout-status");status.textContent="Checking test checkout…";
 try{const r=await fetch("/api/checkout",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({items:Object.entries(cart).map(([id,quantity])=>({id,quantity}))})});const data=await r.json();if(!r.ok)throw Error(data.error||"Checkout is unavailable.");
 const url=new URL(data.url);if(url.protocol!=="https:"||url.hostname!=="checkout.stripe.com")throw Error("Invalid checkout destination.");location.assign(url.href);
 }catch(e){status.textContent="Test checkout is unavailable. No payment was taken. Please request a quote.";}
};
for(const form of document.querySelectorAll("form[data-kind]"))form.addEventListener("submit",async event=>{
 event.preventDefault();const status=form.querySelector('[role=status]'),button=form.querySelector("button");button.disabled=true;status.textContent="Sending…";
 try{const payload=Object.fromEntries(new FormData(form));payload.kind=form.dataset.kind;const r=await fetch("/api/inquiry",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(payload)});const data=await r.json();if(!r.ok)throw Error(data.error||"Message could not be sent.");status.textContent="Thank you. Your inquiry has been received.";form.reset();}
 catch{status.textContent="Your inquiry was not sent. The contact service may not be configured yet. Please keep your details and try again later.";}
 finally{button.disabled=false;}
});
renderProducts();renderCart();

if(new URLSearchParams(location.search).get("checkout")==="test-complete") $("#checkout-status").textContent="Test checkout returned successfully. No real payment or order has been placed.";
