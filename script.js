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
