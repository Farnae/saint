const prefRedGlobal=window.matchMedia('(prefers-reduced-motion:reduce)').matches;

/* ===== START AT THE TOP on a plain load/refresh, but respect real #anchors
   and a just-submitted newsletter form (scroll to its success/error message
   instead of burying it off-screen at the top) ===== */
if('scrollRestoration' in history){ history.scrollRestoration='manual'; }
const navType=(performance.getEntriesByType&&performance.getEntriesByType('navigation')[0]||{}).type;
function resetScrollUnlessAnchor(e){
  if(location.hash) return;
  if(navType==='back_forward' || (e && e.persisted)) return;
  const formMsg=document.querySelector('.cta-success,.cta-error');
  if(formMsg){
    const section=formMsg.closest('.reveal');
    if(section) section.classList.add('is-in');
    formMsg.scrollIntoView({block:'center'});
    return;
  }
  window.scrollTo(0,0);
}
resetScrollUnlessAnchor();
window.addEventListener('load',resetScrollUnlessAnchor);
window.addEventListener('pageshow',resetScrollUnlessAnchor);

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
    document.documentElement.classList.remove('nav-open');
    document.documentElement.style.overflow='';
  };
  burger.addEventListener('click',()=>{
    const willOpen=!mobileNav.classList.contains('open');
    burger.classList.toggle('open',willOpen);
    burger.setAttribute('aria-expanded',String(willOpen));
    mobileNav.classList.toggle('open',willOpen);
    mobileNav.setAttribute('aria-hidden',String(!willOpen));
    document.documentElement.classList.toggle('nav-open',willOpen);
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
let curtainSeen=false;
try{ curtainSeen=sessionStorage.getItem('saint-curtain')==='1'; sessionStorage.setItem('saint-curtain','1'); }catch(e){}
const prefRed=prefRedGlobal || !!location.hash || curtainSeen;
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
    setTimeout(liftCurtain,2200);
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
    document.querySelectorAll('.cart-count').forEach(el=>el.textContent=cart.item_count);
  });
}
function addToCart(body, btn){
  const i18n=window.SAINT_I18N||{};
  const label=btn ? (btn.querySelector('span')||btn) : null;
  const original=label ? label.textContent : '';
  if(btn){ btn.classList.add('is-loading'); btn.setAttribute('aria-busy','true'); btn.disabled=true; }
  const isJson=typeof body==='string';
  return fetch('/cart/add.js',{
    method:'POST',
    headers:{'Content-Type':isJson?'application/json':'application/x-www-form-urlencoded','Accept':'application/json'},
    body:body
  }).then(r=>r.json().then(data=>({ok:r.ok,data}))).then(({ok,data})=>{
    if(!ok) throw new Error(data && (data.description||data.message) || i18n.addError || '');
    updateCartCountFromShopify();
    if(label){
      label.textContent=i18n.added||'Ajouté';
      btn.classList.add('added');
      setTimeout(()=>{label.textContent=original;btn.classList.remove('added');},1800);
    }
    openCartDrawer();
  }).catch(err=>{
    if(window.saintToast) window.saintToast((err && err.message) || i18n.addError || '', 'error');
  }).finally(()=>{
    if(btn){ btn.classList.remove('is-loading'); btn.removeAttribute('aria-busy'); btn.disabled=false; }
  });
}
function handleAddToCartSubmit(e){
  e.preventDefault();
  const form=e.currentTarget;
  const btn=e.submitter || form.querySelector('button[type="submit"]');
  addToCart(new URLSearchParams(new FormData(form)).toString(), btn);
}
document.querySelectorAll('form[action*="/cart/add"]').forEach(form=>{
  form.addEventListener('submit',handleAddToCartSubmit);
});

/* ===== CART DRAWER ===== */
const cartDrawerEl=document.getElementById('cart-drawer');
const cartDrawerBackdrop=document.getElementById('cart-drawer-backdrop');
function moneyFmt(cents){
  return (Math.round(cents)/100).toLocaleString('fr-FR',{minimumFractionDigits:2,maximumFractionDigits:2})+' €';
}
function openCartDrawer(){
  if(!cartDrawerEl) return;
  renderCartDrawer();
  cartDrawerEl.classList.add('open');
  if(cartDrawerBackdrop) cartDrawerBackdrop.classList.add('open');
  cartDrawerEl.setAttribute('aria-hidden','false');
  document.documentElement.style.overflow='hidden';
  const closeBtn=document.getElementById('cart-drawer-close');
  if(closeBtn) setTimeout(()=>closeBtn.focus({preventScroll:true}),50);
}
function closeCartDrawer(){
  if(!cartDrawerEl) return;
  cartDrawerEl.classList.remove('open');
  if(cartDrawerBackdrop) cartDrawerBackdrop.classList.remove('open');
  cartDrawerEl.setAttribute('aria-hidden','true');
  document.documentElement.style.overflow='';
}
function bindCartDrawerRowControls(){
  const body=document.getElementById('cart-drawer-body');
  if(!body) return;
  body.querySelectorAll('.cart-line-stepper[data-line-key]').forEach(stepper=>{
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
        }).then(()=>{ updateCartCountFromShopify(); renderCartDrawer(); }).catch(()=>stepper.classList.remove('busy'));
      });
    });
  });
  body.querySelectorAll('.cd-remove[data-line-key]').forEach(btn=>{
    btn.addEventListener('click',()=>{
      fetch('/cart/change.js',{
        method:'POST',
        headers:{'Content-Type':'application/json'},
        body:JSON.stringify({id:btn.dataset.lineKey,quantity:0})
      }).then(()=>{ updateCartCountFromShopify(); renderCartDrawer(); });
    });
  });
}
function renderCartDrawer(){
  if(!cartDrawerEl) return;
  const i18n=window.SAINT_I18N||{};
  cartDrawerEl.classList.add('is-loading');
  fetch('/cart.js').then(r=>r.json()).then(cart=>{
    cartDrawerEl.classList.remove('is-loading');
    const body=document.getElementById('cart-drawer-body');
    const foot=document.getElementById('cart-drawer-foot');
    if(!body||!foot) return;
    if(cart.item_count===0){
      body.innerHTML='<div class="cart-drawer-empty"><p>'+(i18n.cartEmpty||'')+'</p>'
        +'<a class="btn-primary" href="'+(i18n.collectionUrl||'/collections/all')+'"><span>'+(i18n.viewCollection||'')+'</span></a></div>';
      foot.innerHTML='';
      return;
    }
    body.innerHTML=cart.items.map(item=>{
      const variant=(item.variant_title && item.variant_title!=='Default Title')
        ? '<p class="cd-variant">'+item.variant_title+'</p>' : '';
      return '<div class="cart-drawer-row">'
        +'<a class="cd-thumb" href="'+item.url+'">'+(item.image?'<img src="'+item.image+'&width=200" alt="" loading="lazy">':'')+'</a>'
        +'<div class="cd-info"><h4><a href="'+item.url+'">'+item.product_title+'</a></h4>'+variant
        +'<div class="stepper cart-line-stepper" data-line-key="'+item.key+'">'
        +'<button type="button" data-step="down">&minus;</button>'
        +'<span class="cart-qty-val">'+item.quantity+'</span>'
        +'<button type="button" data-step="up">+</button></div>'
        +'<button type="button" class="cd-remove" data-line-key="'+item.key+'">'+(i18n.remove||'')+'</button></div>'
        +'<div class="cd-price">'+moneyFmt(item.final_line_price)+'</div>'
        +'</div>';
    }).join('');
    const threshold=i18n.freeShipThreshold||15000;
    const freeship=cart.total_price>=threshold ? '' : '<p class="cart-freeship-note">'+(i18n.freeship||'')+'</p>';
    foot.innerHTML='<div class="sum-row total"><span>'+(i18n.subtotal||'')+'</span><span>'+moneyFmt(cart.total_price)+'</span></div>'
      +'<p class="cart-drawer-note">'+(i18n.shippingNote||'')+'</p>'
      +freeship
      +'<a href="'+(i18n.checkoutUrl||'/checkout')+'" class="btn-add-cart btn-block"><span>'+(i18n.checkout||'')+'</span></a>'
      +'<a href="'+(i18n.cartUrl||'/cart')+'" class="cart-drawer-viewcart">'+(i18n.viewCart||'')+'</a>';
    bindCartDrawerRowControls();
  });
}
document.querySelectorAll('#cart-drawer-trigger,#cart-drawer-trigger-mobile').forEach(el=>{
  el.addEventListener('click',e=>{ e.preventDefault(); openCartDrawer(); });
});
if(cartDrawerBackdrop) cartDrawerBackdrop.addEventListener('click',closeCartDrawer);
const cartDrawerCloseBtn=document.getElementById('cart-drawer-close');
if(cartDrawerCloseBtn) cartDrawerCloseBtn.addEventListener('click',closeCartDrawer);
document.addEventListener('keydown',e=>{ if(e.key==='Escape') closeCartDrawer(); });
document.addEventListener('click',function(e){
  const quickAdd=e.target.closest('[data-quick-add]');
  if(!quickAdd) return;
  e.preventDefault();
  addToCart(JSON.stringify({items:[{id:+quickAdd.dataset.quickAdd,quantity:1}]}), quickAdd);
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

/* ===== CONTACT: prefill subject from ?objet= (e.g. "Demander un retour" links) ===== */
(function(){
  const subject=document.getElementById('ContactFormSubject');
  if(!subject || subject.value) return;
  const preset=new URLSearchParams(location.search).get('objet');
  if(preset) subject.value=preset.slice(0,80);
})();

/* ===== STICKY BUY BAR (mobile): home = after the banner, product = once the main button is off-screen ===== */
(function(){
  const bar=document.getElementById('buy-sticky');
  if(!bar || !('IntersectionObserver' in window)) return;
  const anchor=bar.dataset.stickyTarget ? document.querySelector(bar.dataset.stickyTarget) : document.querySelector('.home-banner');
  const footer=document.querySelector('footer');
  if(!anchor) return;
  bar.hidden=false;
  let anchorVisible=true, footerVisible=false;
  const update=()=>bar.classList.toggle('is-visible',!anchorVisible && !footerVisible);
  new IntersectionObserver(([e])=>{anchorVisible=e.isIntersecting || e.boundingClientRect.top>0;update();},{threshold:0}).observe(anchor);
  if(footer) new IntersectionObserver(([e])=>{footerVisible=e.isIntersecting;update();},{threshold:0}).observe(footer);
})();

/* ===== PRODUCT: variant choice updates price + button ===== */
(function(){
  const form=document.getElementById('product-form-main');
  if(!form) return;
  const btn=form.querySelector('[data-add-button]');
  const update=src=>{
    if(!src || !src.dataset.price) return;
    document.querySelectorAll('[data-product-price]').forEach(el=>el.textContent=src.dataset.price);
  };
  form.addEventListener('change',e=>{
    const t=e.target;
    if(t.matches('input[type="radio"][name="id"]')) update(t);
    if(t.matches('select[name="id"]')) update(t.options[t.selectedIndex]);
    if(btn) btn.disabled=false;
  });
})();

/* ===== PRODUCT: dots under the swipeable photos (mobile) ===== */
(function(){
  const rail=document.querySelector('.produit-visual');
  if(!rail) return;
  const slides=rail.querySelectorAll('.produit-photo');
  if(slides.length<2) return;
  const dots=document.createElement('div');
  dots.className='p-dots'; dots.setAttribute('aria-hidden','true');
  slides.forEach((_,i)=>{const d=document.createElement('span'); if(!i) d.className='active'; dots.appendChild(d);});
  rail.after(dots);
  rail.addEventListener('scroll',()=>{
    const i=Math.round(rail.scrollLeft/rail.clientWidth);
    dots.querySelectorAll('span').forEach((d,j)=>d.classList.toggle('active',j===i));
  },{passive:true});
})();
