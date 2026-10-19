const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// Indexy pro postupné objevování (.st) a výplň ukazatelů dovedností
document.querySelectorAll('.reveal').forEach(sec => {
  const parents = new Map();
  sec.querySelectorAll('.st').forEach(el => {
    const p = el.parentElement;
    const n = parents.get(p) || 0;
    el.style.setProperty('--i', n);
    parents.set(p, n + 1);
  });
});
document.querySelectorAll('.ticks5 span').forEach((s, k) => s.style.setProperty('--n', k % 5));

// Odhalení při scrollu + počítání čísel
function countUp(el){
  const target = +el.dataset.count, suffix = el.dataset.suffix || '';
  if (reduceMotion) { el.textContent = target + suffix; return; }
  const dur = 1400, start = performance.now();
  (function tick(now){
    const t = Math.min((now - start) / dur, 1);
    const eased = 1 - Math.pow(1 - t, 3);
    el.textContent = Math.round(target * eased) + (t === 1 ? suffix : '');
    if (t < 1) requestAnimationFrame(tick);
  })(start);
}
const reveals = document.querySelectorAll('.reveal');
const io = new IntersectionObserver((entries)=>{
  entries.forEach(e=>{
    if(e.isIntersecting){
      e.target.classList.add('in');
      e.target.querySelectorAll('[data-count]').forEach(countUp);
      io.unobserve(e.target);
    }
  });
},{threshold:0.12});
reveals.forEach(el=>io.observe(el));

// Aktivní vrstva (sidebar + štítek na pravítku)
const sections = document.querySelectorAll('main .section');
const layerItems = document.querySelectorAll('.layer-item');
const rulerActive = document.getElementById('rulerActive');
const names = {uvod:'ÚVOD','o-mne':'O MNĚ',vzdelani:'VZDĚLÁNÍ',zkusenosti:'ZKUŠENOSTI',dovednosti:'DOVEDNOSTI',tvorba:'TVORBA',kontakt:'KONTAKT'};
const sectionObserver = new IntersectionObserver((entries)=>{
  entries.forEach(entry=>{
    if(entry.isIntersecting){
      const id = entry.target.id;
      layerItems.forEach(li=>li.classList.toggle('active', li.dataset.target===id));
      if(rulerActive && names[id]) rulerActive.textContent = names[id];
    }
  });
},{rootMargin:'-45% 0px -45% 0px'});
sections.forEach(s=>sectionObserver.observe(s));

// Ukazatel postupu scrollu + "playhead" na pravítku
const progress = document.getElementById('progress');
const playhead = document.getElementById('playhead');
let ticking = false;
function updateProgress(){
  const max = document.documentElement.scrollHeight - window.innerHeight;
  const p = max > 0 ? Math.min(window.scrollY / max, 1) : 0;
  progress.style.transform = 'scaleX(' + p + ')';
  playhead.style.left = (p * 100) + '%';
  ticking = false;
}
window.addEventListener('scroll', ()=>{ if(!ticking){ ticking = true; requestAnimationFrame(updateProgress); } }, {passive:true});
window.addEventListener('resize', updateProgress);
updateProgress();

// Jemný parallax tvarů v heru
if(!reduceMotion){
  const shapes = document.querySelectorAll('.shape');
  window.addEventListener('scroll', ()=>{
    const y = window.scrollY;
    if(y > 900) return;
    shapes.forEach((s, k)=> s.style.transform = 'translateY(' + (y * (0.08 + k * 0.05)) + 'px)');
  }, {passive:true});
}

// Mobilní panel vrstev
const toggleBtn = document.getElementById('layersToggle');
const overlayBg = document.getElementById('overlayBg');
function closePanel(){ document.body.classList.remove('panel-open'); }
toggleBtn?.addEventListener('click', ()=>document.body.classList.toggle('panel-open'));
overlayBg?.addEventListener('click', closePanel);
layerItems.forEach(li=>li.addEventListener('click', closePanel));

// Kontaktní formulář -> mailto (funguje bez backendu).
// Chceš odesílat formulář bez otevírání e-mailového klienta?
// Zaregistruj se zdarma na formspree.io a nahraď blok níže za fetch na svůj endpoint.
const form = document.getElementById('contactForm');
const status = document.getElementById('formStatus');
form?.addEventListener('submit', function(e){
  e.preventDefault();
  const jmeno = document.getElementById('jmeno').value.trim();
  const email = document.getElementById('email').value.trim();
  const zprava = document.getElementById('zprava').value.trim();
  status.classList.remove('show'); void status.offsetWidth; status.classList.add('show');
  if(!jmeno || !email || !zprava){
    status.textContent = 'Vyplň prosím všechna pole.';
    return;
  }
  const subject = encodeURIComponent('Poptávka z portfolia od ' + jmeno);
  const body = encodeURIComponent(zprava + '\n\n— ' + jmeno + ' (' + email + ')');
  window.location.href = `mailto:tomas210408@gmail.com?subject=${subject}&body=${body}`;
  status.textContent = 'Otevírám e-mailový klient…';
});

// Lightbox pro galerii tvorby (karta může obsahovat více fotek)
const lightbox = document.getElementById('lightbox');
const lightboxImg = lightbox?.querySelector('img');
const lightboxCounter = lightbox?.querySelector('.lightbox-counter');
let lbImages = [], lbIndex = 0, lbAlt = '';
function showLightbox(){
  if(lightbox.classList.contains('open') && !reduceMotion){
    lightboxImg.classList.add('swap');
    setTimeout(()=>{ lightboxImg.src = lbImages[lbIndex]; lightboxImg.classList.remove('swap'); }, 150);
  } else {
    lightboxImg.src = lbImages[lbIndex];
  }
  lightboxImg.alt = lbAlt;
  lightboxCounter.textContent = (lbIndex + 1) + ' / ' + lbImages.length;
}
function stepLightbox(d){
  if(lbImages.length < 2) return;
  lbIndex = (lbIndex + d + lbImages.length) % lbImages.length;
  showLightbox();
}
function closeLightbox(){ lightbox.classList.remove('open'); lightbox.setAttribute('aria-hidden','true'); }
document.querySelectorAll('.tile[data-gallery]').forEach(tile=>{
  tile.addEventListener('click', ()=>{
    lbImages = tile.dataset.gallery.split(',');
    lbIndex = 0;
    lbAlt = tile.querySelector('img').alt;
    lightbox.classList.toggle('single', lbImages.length < 2);
    showLightbox();
    lightbox.classList.add('open');
    lightbox.setAttribute('aria-hidden','false');
  });
});
lightbox?.querySelector('.prev').addEventListener('click', e=>{ e.stopPropagation(); stepLightbox(-1); });
lightbox?.querySelector('.next').addEventListener('click', e=>{ e.stopPropagation(); stepLightbox(1); });
lightboxImg?.addEventListener('click', e=>{ e.stopPropagation(); stepLightbox(1); });
lightbox?.addEventListener('click', closeLightbox);
document.addEventListener('keydown', e=>{
  if(!lightbox.classList.contains('open')) return;
  if(e.key === 'Escape') closeLightbox();
  if(e.key === 'ArrowRight') stepLightbox(1);
  if(e.key === 'ArrowLeft') stepLightbox(-1);
});

// Weby: živý náhled (iframe zmenšený na šířku karty) nebo screenshot z data-shot
document.querySelectorAll('.site-card').forEach(card=>{
  const url = card.dataset.url;
  const shot = card.dataset.shot;
  const view = card.querySelector('.browser-view');
  const link = card.querySelector('.site-link');
  if(!url) { link.setAttribute('aria-disabled','true'); return; }
  link.href = url;
  card.querySelector('.b-url').textContent = url.replace(/^https?:\/\//,'').replace(/\/$/,'');
  view.querySelector('.site-placeholder')?.remove();
  if(shot){
    view.innerHTML = '<img src="' + shot + '" alt="Náhled webu" loading="lazy">';
    return;
  }
  const frame = document.createElement('iframe');
  frame.src = url;
  frame.loading = 'lazy';
  frame.tabIndex = -1;
  frame.title = 'Náhled webu';
  view.appendChild(frame);
  const fit = ()=> frame.style.transform = 'scale(' + (view.clientWidth / 1440) + ')';
  new ResizeObserver(fit).observe(view);
  fit();
});

// Střídající se slovo v nadpisu
const heroWord = document.getElementById('heroWord');
if(heroWord && !reduceMotion){
  const words = heroWord.querySelectorAll('.w');
  let w = 0;
  setTimeout(()=> setInterval(()=>{
    const prev = words[w];
    w = (w + 1) % words.length;
    const next = words[w];
    prev.classList.remove('is-on', 'redraw');
    prev.classList.add('is-out');
    setTimeout(()=> prev.classList.remove('is-out'), 450);
    next.classList.add('is-on', 'redraw');
  }, 2800), 2200);
}
