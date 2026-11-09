const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const root = document.documentElement;
root.classList.add('js');

// Hlavička: podklad až po odscrollování
const header = document.querySelector('.top');
const onScroll = () => header.classList.toggle('scrolled', window.scrollY > 20);
window.addEventListener('scroll', onScroll, {passive:true});
onScroll();

// ---------- Přebarvování webu podle sekce ----------
// Každá sekce má v HTML data-bg / data-fg / data-accent.
const themed = document.querySelectorAll('[data-bg]');
const pnavLinks = document.querySelectorAll('.pnav a');

// ---------- Mobilní lišta dole ----------
const tabbar = document.getElementById('tabbar');
const tabLinks = tabbar.querySelectorAll('a[data-tab]');
const tabPill = tabbar.querySelector('.tab-pill');
// která položka lišty patří ke které sekci
function tabFor(el){
  if (el.classList.contains('project') || el.id === 'postup') return 'prace';
  if (el.id === 'uvod') return null;
  return el.id;
}
function setTab(id){
  let active = null;
  tabLinks.forEach(a => {
    const on = a.dataset.tab === id;
    a.classList.toggle('active', on);
    if (on){ active = a; a.setAttribute('aria-current', 'true'); } else a.removeAttribute('aria-current');
  });
  tabbar.classList.toggle('has-active', !!active);
  if (active){
    tabPill.style.width = active.offsetWidth + 'px';
    tabPill.style.transform = 'translateX(' + active.offsetLeft + 'px)';
  }
}
window.addEventListener('resize', () => setTab(tabbar.querySelector('a.active')?.dataset.tab));

// při scrollu dolů se lišta i hlavička schovají, při scrollu nahoru hned vrátí
let lastY = window.scrollY;
// po kliknutí na položku nechat lištu viditelnou, dokud stránka nedojede k cíli
let navTarget = null, navTimeout = 0;
function endNav(){ navTarget = null; clearTimeout(navTimeout); lastY = window.scrollY; }
tabLinks.forEach(a => a.addEventListener('click', () => {
  navTarget = document.querySelector(a.getAttribute('href'));
  clearTimeout(navTimeout);
  navTimeout = setTimeout(endNav, 4000); // pojistka
}));
window.addEventListener('scroll', () => {
  const y = window.scrollY;
  if (navTarget){
    if (Math.abs(navTarget.getBoundingClientRect().top) < 4) endNav(); // dojeli jsme
    lastY = y; return;
  }
  const nearBottom = y + window.innerHeight > document.documentElement.scrollHeight - 80;
  const hide = y > lastY && y > 160 && !nearBottom;
  if (Math.abs(y - lastY) > 6){
    tabbar.classList.toggle('hide', hide);
    header.classList.toggle('hide', hide);
    lastY = y;
  }
}, {passive:true});
function applyTheme(el){
  root.style.setProperty('--bg', el.dataset.bg);
  root.style.setProperty('--fg', el.dataset.fg);
  root.style.setProperty('--accent', el.dataset.accent);
  // boční navigace projektů: zobrazit jen mezi projekty a zvýraznit aktuální
  document.body.classList.toggle('in-projects', el.classList.contains('project'));
  pnavLinks.forEach(a => a.classList.toggle('active', a.getAttribute('href') === '#' + el.id));
  setTab(tabFor(el));
}
const themeObserver = new IntersectionObserver(entries => {
  entries.forEach(e => { if (e.isIntersecting) applyTheme(e.target); });
}, {rootMargin:'-50% 0px -50% 0px'});
themed.forEach(s => themeObserver.observe(s));

// Projekty vjedou, když se poprvé objeví
const seenObserver = new IntersectionObserver(entries => {
  entries.forEach(e => {
    if (e.isIntersecting){ e.target.classList.add('seen'); seenObserver.unobserve(e.target); }
  });
}, {threshold:.15});
document.querySelectorAll('.project').forEach(p => seenObserver.observe(p));

// ---------- Kurzor „Zobrazit“ nad obrázky projektů ----------
// Řídí se skutečnou myší (ne nastavením prohlížeče) a kontroluje se i při
// scrollování: Safari jinak nepozná, že pod stojící myší „přijel“ obrázek.
const cursor = document.getElementById('cursor');
let mouseX = -1, mouseY = -1, usingMouse = false;

function updateCursor(){
  if (!usingMouse || !lb.hidden){ cursor.classList.remove('on'); document.body.classList.remove('cursor-hidden'); return; }
  const el = document.elementFromPoint(mouseX, mouseY);
  const over = !!(el && el.closest('.m-main'));
  cursor.classList.toggle('on', over);
  document.body.classList.toggle('cursor-hidden', over);
}
window.addEventListener('pointermove', e => {
  usingMouse = e.pointerType === 'mouse';
  mouseX = e.clientX; mouseY = e.clientY;
  cursor.style.left = mouseX + 'px';
  cursor.style.top = mouseY + 'px';
  updateCursor();
}, {passive:true});
window.addEventListener('scroll', () => { if (usingMouse) requestAnimationFrame(updateCursor); }, {passive:true});
document.addEventListener('mouseleave', () => { cursor.classList.remove('on'); document.body.classList.remove('cursor-hidden'); });

// ---------- Lightbox ----------
const lb = document.getElementById('lightbox');
const lbImg = lb.querySelector('img');
const lbTitle = lb.querySelector('.lb-title');
const lbCount = lb.querySelector('.lb-count');
let images = [], index = 0, opener = null;

function render(animate){
  const apply = () => {
    lbImg.src = images[index];
    lbCount.textContent = images.length > 1 ? (index + 1) + ' / ' + images.length : '';
  };
  if (animate && !reduceMotion){
    lbImg.classList.add('swap');
    setTimeout(() => { apply(); lbImg.classList.remove('swap'); }, 150);
  } else apply();
}
function openLightbox(list, start, title, from){
  images = list; index = start; opener = from;
  lbTitle.textContent = title;
  lbImg.alt = title;
  lb.classList.toggle('single', images.length < 2);
  render(false);
  lb.hidden = false;
  cursor.classList.remove('on');
  document.body.classList.remove('cursor-hidden');
  document.body.style.overflow = 'hidden';
  lb.querySelector('.lb-close').focus();
}
function closeLightbox(){
  lb.hidden = true;
  document.body.style.overflow = '';
  opener?.focus();
}
function step(d){
  if (images.length < 2) return;
  index = (index + d + images.length) % images.length;
  render(true);
}
lb.querySelector('.prev').addEventListener('click', e => { e.stopPropagation(); step(-1); });
lb.querySelector('.next').addEventListener('click', e => { e.stopPropagation(); step(1); });
lb.querySelector('.lb-close').addEventListener('click', closeLightbox);
lbImg.addEventListener('click', e => { e.stopPropagation(); step(1); });
lb.addEventListener('click', e => { if (e.target === lb || e.target.tagName === 'FIGURE') closeLightbox(); });
document.addEventListener('keydown', e => {
  if (lb.hidden) return;
  if (e.key === 'Escape') closeLightbox();
  if (e.key === 'ArrowRight') step(1);
  if (e.key === 'ArrowLeft') step(-1);
});

document.querySelectorAll('.p-media[data-gallery]').forEach(media => {
  const list = media.dataset.gallery.split(',');
  media.querySelectorAll('button[data-index]').forEach(btn =>
    btn.addEventListener('click', () => openLightbox(list, +btn.dataset.index, media.dataset.title, btn)));
});

// ---------- Weby: živý náhled, kterým jde scrollovat ----------
// Web se načte do iframe zmenšeného na šířku karty. Po najetí myší jde web
// uvnitř karty scrollovat i proklikat. Pod ním leží screenshot, takže karta
// nikdy není prázdná, i kdyby se živý web nenačetl.
document.querySelectorAll('.site[data-url]').forEach(card => {
  const url = card.dataset.url;
  const view = card.querySelector('.browser-view');
  card.querySelector('.b-url').textContent = url.replace(/^https?:\/\//, '').replace(/\/$/, '');
  const frame = document.createElement('iframe');
  frame.src = url;
  frame.loading = 'lazy';
  frame.title = 'Živý náhled webu ' + url.replace(/^https?:\/\//, '');
  view.appendChild(frame);
  const fit = () => {
    const scale = view.clientWidth / 1440;
    frame.style.transform = 'scale(' + scale + ')';
    frame.style.height = Math.max(900, view.clientHeight / scale) + 'px';
  };
  new ResizeObserver(fit).observe(view);
  fit();
});

// ---------- Kopírování e-mailu / telefonu ----------
document.querySelectorAll('.cc-btn.copy').forEach(btn => {
  btn.addEventListener('click', async () => {
    try{
      await navigator.clipboard.writeText(btn.dataset.copy);
      btn.textContent = 'Zkopírováno';
    }catch{
      btn.textContent = 'Nejde kopírovat';
    }
    btn.classList.add('done');
    setTimeout(() => { btn.textContent = 'Kopírovat'; btn.classList.remove('done'); }, 1800);
  });
});

// ---------- Kontaktní formulář: odesílá e-mail přímo z webu ----------
// Používá službu FormSubmit (formsubmit.co), zdarma a bez registrace.
// DŮLEŽITÉ: po úplně první odeslané zprávě přijde na e-mail níže aktivační
// odkaz od FormSubmit. Dokud ho nepotvrdíš, zprávy se nedoručují.
const FORM_ENDPOINT = 'https://formsubmit.co/ajax/tomas210408@gmail.com';

const form = document.getElementById('contactForm');
const formStatus = document.getElementById('formStatus');
const submitBtn = form.querySelector('button[type="submit"]');
const setStatus = (text, kind) => {
  formStatus.textContent = text;
  formStatus.className = 'form-status' + (kind ? ' ' + kind : '');
};

form.addEventListener('submit', async e => {
  e.preventDefault();
  const jmeno = form.jmeno.value.trim();
  const email = form.email.value.trim();
  const zprava = form.zprava.value.trim();
  if (!jmeno || !email || !zprava){
    setStatus('Vyplň jméno, e-mail i zprávu.', 'err');
    return;
  }
  if (!form.email.checkValidity()){
    setStatus('Zkontroluj prosím e-mailovou adresu.', 'err');
    form.email.focus();
    return;
  }
  if (form._honey.value) return; // vyplnil to robot

  submitBtn.disabled = true;
  submitBtn.textContent = 'Odesílám…';
  setStatus('');
  try{
    const res = await fetch(FORM_ENDPOINT, {
      method:'POST',
      headers:{'Content-Type':'application/json', 'Accept':'application/json'},
      body:JSON.stringify({
        name:jmeno,
        email:email,
        message:zprava,
        _subject:'Nová zpráva z portfolia od ' + jmeno,
        _template:'table',
        _captcha:'false'
      })
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok || data.success === 'false' || data.success === false) throw new Error(data.message || res.status);
    form.reset();
    setStatus('Díky, zpráva je odeslaná. Ozvu se co nejdřív.', 'ok');
    submitBtn.textContent = 'Odesláno';
    setTimeout(() => { submitBtn.textContent = 'Odeslat zprávu'; submitBtn.disabled = false; }, 4000);
  }catch(err){
    setStatus('Zprávu se nepodařilo odeslat. Zkus to znovu, nebo napiš přímo na tomas210408@gmail.com.', 'err');
    submitBtn.textContent = 'Odeslat zprávu';
    submitBtn.disabled = false;
  }
});
