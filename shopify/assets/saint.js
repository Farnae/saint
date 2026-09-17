const prefRedGlobal=window.matchMedia('(prefers-reduced-motion:reduce)').matches;

/* ===== ALWAYS START AT THE TOP (no scroll position kept on refresh) ===== */
if('scrollRestoration' in history){ history.scrollRestoration='manual'; }
window.scrollTo(0,0);
window.addEventListener('load',()=>window.scrollTo(0,0));
window.addEventListener('pageshow',()=>window.scrollTo(0,0));

if(window.gsap && window.ScrollTrigger){
  gsap.registerPlugin(ScrollTrigger);
}

/* ===== MOBILE NAV ===== */
const burger=document.getElementById('burger');
const mobileNav=document.getElementById('mobile-nav');
if(burger && mobileNav){
  const closeMobileNav=()=>{
    burger.classList.remove('open');
    burger.setAttribute('aria-expanded','false');
    mobileNav.classList.remove('open');
    mobileNav.setAttribute('aria-hidden','true');
    document.documentElement.style.overflow='';
  };
  burger.addEventListener('click',()=>{
    const willOpen=!mobileNav.classList.contains('open');
    burger.classList.toggle('open',willOpen);
    burger.setAttribute('aria-expanded',String(willOpen));
    mobileNav.classList.toggle('open',willOpen);
    mobileNav.setAttribute('aria-hidden',String(!willOpen));
    document.documentElement.style.overflow=willOpen?'hidden':'';
  });
  mobileNav.querySelectorAll('a').forEach(a=>a.addEventListener('click',closeMobileNav));
  window.addEventListener('keydown',e=>{if(e.key==='Escape')closeMobileNav();});
}

/* ===== GSAP MASK REVEAL (SplitType) ===== */
function initSplitReveals(){
  if(prefRedGlobal || !window.SplitType || !window.gsap) return;
  document.querySelectorAll('[data-split]').forEach(el=>{
    const split=new SplitType(el,{types:'lines',lineClass:'tline'});
    split.lines.forEach(line=>{
      const inner=document.createElement('span');
      inner.className='tline-inner';
      inner.style.transform='translateY(110%)';
      inner.style.opacity='0';
      inner.innerHTML=line.innerHTML;
      line.innerHTML='';
      line.appendChild(inner);
      line.style.display='block';
      line.style.overflow='hidden';
    });
    gsap.to(el.querySelectorAll('.tline-inner'),{
      y:0,opacity:1,duration:1.1,ease:'cubic-bezier(0.16, 1, 0.3, 1)',stagger:0.04,
      scrollTrigger:{trigger:el,start:'top 85%',once:true}
    });
  });
}

/* ===== TEXT SCRAMBLE (hero headline only) ===== */
const CHARS='ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
function scrambleText(el,finalText,duration){
  const frames=Math.round(duration/16);
  let frame=0;
  const id=setInterval(()=>{
    frame++;
    const progress=frame/frames;
    const revealed=Math.floor(progress*finalText.length);
    let out='';
    for(let i=0;i<finalText.length;i++){
      if(finalText[i]===' ') out+=' ';
      else if(i<revealed) out+=finalText[i];
      else out+=CHARS[Math.floor(Math.random()*CHARS.length)];
    }
    el.textContent=out;
    if(frame>=frames){clearInterval(id);el.textContent=finalText;}
  },16);
}
function runScramble(){
  document.querySelectorAll('[data-scramble]').forEach(el=>{
    const text=el.dataset.scramble||el.textContent;
    setTimeout(()=>scrambleText(el,text,700), +el.dataset.scrambleDelay||200);
  });
}

/* ===== CURTAIN ===== */
const prefRed=prefRedGlobal;
const curtain=document.getElementById('curtain');
if(curtain){
  document.documentElement.style.overflow='hidden';
  let curtainLifted=false;
  function startSite(){document.documentElement.classList.add('started');}
  function liftCurtain(){
    if(curtainLifted) return;
    curtainLifted=true;
    startSite();
    curtain.classList.add('leaving');
    document.documentElement.style.overflow='';
    window.removeEventListener('wheel',liftG);
    window.removeEventListener('touchmove',liftG);
    window.removeEventListener('keydown',liftK);
    curtain.removeEventListener('click',liftCurtain);
    setTimeout(()=>curtain.remove(),1000);
    if(!prefRed) setTimeout(runScramble,1400);
    setTimeout(animateStockBar,1600);
    setTimeout(initSplitReveals,200);
  }
  function liftG(){liftCurtain();}
  function liftK(e){if(e.key==='ArrowDown'||e.key===' '||e.key==='Enter') liftCurtain();}
  if(prefRed){
    document.documentElement.style.overflow='';
    startSite(); curtain.remove();
    animateStockBar();
    initSplitReveals();
  } else {
    window.addEventListener('wheel',liftG,{passive:true});
    window.addEventListener('touchmove',liftG,{passive:true});
    window.addEventListener('keydown',liftK);
    curtain.addEventListener('click',liftCurtain);
    setTimeout(liftCurtain,4000);
  }
} else {
  initSplitReveals();
}

/* ===== STOCK BAR ANIMATION ===== */
function animateStockBar(){
  document.querySelectorAll('.stock-fill').forEach(fill=>fill.classList.add('animated'));
}
animateStockBar();

/* ===== HEADER ===== */
const hdr=document.getElementById('hdr');
if(hdr) window.addEventListener('scroll',()=>hdr.classList.toggle('sc',window.scrollY>60),{passive:true});

/* ===== PARALLAX (hero image) ===== */
const heroImg=document.getElementById('hero-cap');
if(!prefRed && heroImg){
  window.addEventListener('scroll',()=>{
    if(window.scrollY<window.innerHeight) heroImg.style.transform=`translateY(${window.scrollY*.22}px)`;
  },{passive:true});
}

/* ===== DIRECTIONAL BUTTONS ===== */
function getEnterDir(e,el){
  const r=el.getBoundingClientRect();
  const x=e.clientX-r.left-r.width/2;
  const y=e.clientY-r.top-r.height/2;
  const a=Math.atan2(y*r.width,x*r.height)*180/Math.PI;
  if(a>=-45&&a<45) return 'right';
  if(a>=45&&a<135) return 'bottom';
  if(a>=-135&&a<-45) return 'top';
  return 'left';
}
if(!prefRed){
  document.querySelectorAll('.btn-primary').forEach(btn=>{
    btn.addEventListener('mouseenter',e=>{
      const dir=getEnterDir(e,btn);
      const fill=btn.querySelector('.btn-fill');
      if(!fill) return;
      if(dir==='right') fill.style.transform='translateX(-101%)';
      else if(dir==='left') fill.style.transform='translateX(101%)';
      else if(dir==='top') fill.style.transform='translateY(-101%)';
      else fill.style.transform='translateY(101%)';
      fill.style.transition='none';
      requestAnimationFrame(()=>{
        fill.style.transition='transform .5s cubic-bezier(.76,0,.24,1)';
        fill.style.transform='translate(0,0)';
      });
    });
    btn.addEventListener('mouseleave',e=>{
      const dir=getEnterDir(e,btn);
      const fill=btn.querySelector('.btn-fill');
      if(!fill) return;
      fill.style.transition='transform .45s cubic-bezier(.76,0,.24,1)';
      if(dir==='right') fill.style.transform='translateX(101%)';
      else if(dir==='left') fill.style.transform='translateX(-101%)';
      else if(dir==='top') fill.style.transform='translateY(101%)';
      else fill.style.transform='translateY(-101%)';
      btn.style.transform='';
    });
    btn.addEventListener('mousemove',e=>{
      const r=btn.getBoundingClientRect();
      btn.style.transform=`translate(${(e.clientX-r.left-r.width/2)*.18}px,${(e.clientY-r.top-r.height/2)*.22}px)`;
    });
  });
}

/* ===== RIPPLE on add-to-cart ===== */
function addRipple(e,btn){
  const r=btn.getBoundingClientRect();
  const size=Math.max(r.width,r.height)*2;
  const x=e.clientX-r.left-size/2;
  const y=e.clientY-r.top-size/2;
  const rip=document.createElement('span');
  rip.className='ripple';
  rip.style.cssText=`width:${size}px;height:${size}px;left:${x}px;top:${y}px;`;
  btn.appendChild(rip);
  setTimeout(()=>rip.remove(),700);
}

/* ===== GALLERY DOTS (generic: works for any .gallery + sibling .gdots pair) ===== */
document.querySelectorAll('.gallery').forEach(gal=>{
  const wrap=gal.closest('.hero-visual,.feature-visual,.produit-visual,.card-visual')||gal.parentElement;
  const dots=wrap ? wrap.querySelector('.gdots') : null;
  if(!dots) return;
  const dotEls=[...dots.children];
  dotEls.forEach((d,i)=>d.addEventListener('click',()=>{
    gal.scrollTo({top:gal.clientHeight*i,behavior:'smooth'});
  }));
  gal.addEventListener('scroll',()=>{
    const i=Math.round(gal.scrollTop/gal.clientHeight);
    dotEls.forEach((d,idx)=>d.classList.toggle('active',idx===i));
  },{passive:true});
});

/* ===== SPEC ACCORDION / FAQ (event delegation, works on Liquid-rendered markup) ===== */
document.addEventListener('click',e=>{
  const toggle=e.target.closest('.spec-toggle');
  if(toggle){ toggle.closest('.spec-accordion').classList.toggle('open'); return; }
  const faqItem=e.target.closest('.faq-item');
  if(faqItem){ faqItem.classList.toggle('open'); return; }
});

/* ===== INTERSECTION OBSERVER (reveals + count-up) ===== */
const io=new IntersectionObserver(entries=>{
  entries.forEach(e=>{
    if(!e.isIntersecting) return;
    e.target.classList.add('is-in');
    e.target.querySelectorAll('.count-up').forEach(el=>{
      const target=+el.dataset.target;
      const start=performance.now();
      const dur=1600;
      (function step(now){
        const t=Math.min((now-start)/dur,1);
        const ease=t<.5?2*t*t:(4-2*t)*t-1;
        el.textContent=Math.round(ease*target);
        if(t<1) requestAnimationFrame(step);
        else el.textContent=target;
      })(start);
    });
    io.unobserve(e.target);
  });
},{threshold:.1});
document.querySelectorAll('.reveal').forEach(el=>io.observe(el));

const editorialBreak=document.getElementById('editorial-break');
if(editorialBreak){
  const ioEd=new IntersectionObserver(([e])=>{
    if(e.isIntersecting){editorialBreak.classList.add('is-in');ioEd.disconnect();}
  },{threshold:.1});
  ioEd.observe(editorialBreak);
}

/* ===== REAL SHOPIFY CART: header count + add-to-cart feedback ===== */
function updateCartCountFromShopify(){
  fetch('/cart.js').then(r=>r.json()).then(cart=>{
    document.querySelectorAll('#cart-count').forEach(el=>el.textContent=cart.item_count);
  });
}
document.addEventListener('submit',function(e){
  const form=e.target.closest('form[action*="/cart/add"]');
  if(!form) return;
  e.preventDefault();
  const btn=form.querySelector('button[type="submit"],.btn-add-cart');
  fetch('/cart/add.js',{
    method:'POST',
    headers:{'Content-Type':'application/x-www-form-urlencoded'},
    body:new URLSearchParams(new FormData(form))
  }).then(r=>r.json()).then(()=>{
    updateCartCountFromShopify();
    if(btn){
      const span=btn.querySelector('span')||btn;
      const original=span.textContent;
      span.textContent='Ajoute !';
      btn.classList.add('added');
      setTimeout(()=>{span.textContent=original;btn.classList.remove('added');},1800);
    }
  });
});
document.addEventListener('click',function(e){
  const quickAdd=e.target.closest('[data-quick-add]');
  if(!quickAdd) return;
  e.preventDefault();
  addRipple(e,quickAdd);
  fetch('/cart/add.js',{
    method:'POST',
    headers:{'Content-Type':'application/json'},
    body:JSON.stringify({items:[{id:quickAdd.dataset.quickAdd,quantity:1}]})
  }).then(r=>r.json()).then(updateCartCountFromShopify);
});
updateCartCountFromShopify();

/* ===== QUANTITY STEPPER (product page pre-add form, only) ===== */
document.querySelectorAll('.qty-row .stepper').forEach(stepper=>{
  const input=stepper.querySelector('input,span[data-qty]');
  stepper.querySelectorAll('button').forEach(btn=>{
    btn.addEventListener('click',()=>{
      const delta=btn.dataset.step==='down'?-1:1;
      if(input.tagName==='INPUT'){
        input.value=Math.max(1,(+input.value||1)+delta);
      } else {
        input.textContent=Math.max(1,(+input.textContent||1)+delta);
      }
    });
  });
});

/* ===== CART LINE STEPPER (panier: reduire ou supprimer un article) ===== */
document.querySelectorAll('.cart-line-stepper[data-line-key]').forEach(stepper=>{
  const key=stepper.dataset.lineKey;
  const valEl=stepper.querySelector('.cart-qty-val');
  stepper.querySelectorAll('button[data-step]').forEach(btn=>{
    btn.addEventListener('click',()=>{
      if(stepper.classList.contains('busy')) return;
      const current=+valEl.textContent||1;
      const next=btn.dataset.step==='down'?current-1:current+1;
      stepper.classList.add('busy');
      fetch('/cart/change.js',{
        method:'POST',
        headers:{'Content-Type':'application/json'},
        body:JSON.stringify({id:key,quantity:Math.max(0,next)})
      }).then(()=>{ window.location.reload(); });
    });
  });
});

/* ===== PRODUCT TABS (Description / Composition / Livraison / Contact) ===== */
document.querySelectorAll('.p-tabs-nav').forEach(nav=>{
  const tabs=nav.closest('.p-tabs');
  nav.querySelectorAll('.p-tab-btn').forEach(btn=>{
    btn.addEventListener('click',()=>{
      nav.querySelectorAll('.p-tab-btn').forEach(b=>b.classList.remove('active'));
      btn.classList.add('active');
      tabs.querySelectorAll('.p-tab-panel').forEach(p=>p.classList.toggle('active',p.dataset.panel===btn.dataset.tab));
    });
  });
});
