const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// ---------- Texty ve skriptu v obou jazycích (podle <html lang>) ----------
const LANG = document.documentElement.lang === 'en' ? 'en' : 'cs';
const T = {
  cs: {
    livePreview: 'Živý náhled webu ',
    copied: 'Zkopírováno', copyFail: 'Nejde kopírovat', copy: 'Kopírovat',
    fillAll: 'Vyplň jméno, e-mail i zprávu.',
    checkEmail: 'Zkontroluj prosím e-mailovou adresu.',
    sending: 'Odesílám…', sent: 'Odesláno', send: 'Odeslat zprávu',
    subject: 'Nová zpráva z portfolia od ',
    thanks: 'Díky, zpráva je odeslaná. Ozvu se co nejdřív.',
    failed: 'Zprávu se nepodařilo odeslat. Zkus to znovu, nebo napiš přímo na tomas210408@gmail.com.'
  },
  en: {
    livePreview: 'Live website preview ',
    copied: 'Copied', copyFail: 'Can\'t copy', copy: 'Copy',
    fillAll: 'Please fill in your name, email and message.',
    checkEmail: 'Please check your email address.',
    sending: 'Sending…', sent: 'Sent', send: 'Send message',
    subject: 'New portfolio message (EN) from ',
    thanks: 'Thanks, your message has been sent. I\'ll get back to you soon.',
    failed: 'The message couldn\'t be sent. Please try again or email me at tomas210408@gmail.com.'
  }
}[LANG];
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
// zvýraznění aktivní položky sedí i během zmenšování/zvětšování lišty
new ResizeObserver(() => setTab(tabbar.querySelector('a.active')?.dataset.tab)).observe(tabbar);

// Lišta je vidět pořád. Při scrollu dolů se jen zmenší (ikony bez popisků),
// při scrollu nahoru, po zastavení nebo po kliknutí se vrátí do plné velikosti.
let lastY = window.scrollY, idleTimer = 0, navUntil = 0;
const setCompact = on => {
  if (tabbar.classList.contains('compact') === on) return;
  tabbar.classList.toggle('compact', on);
};
tabLinks.forEach(a => a.addEventListener('click', () => { navUntil = Date.now() + 1500; setCompact(false); }));
window.addEventListener('scroll', () => {
  const y = window.scrollY;
  const dy = y - lastY;
  if (Date.now() > navUntil && Math.abs(dy) > 6){
    const nearBottom = y + window.innerHeight > document.documentElement.scrollHeight - 80;
    setCompact(dy > 0 && y > 160 && !nearBottom);
    lastY = y;
  } else if (Date.now() <= navUntil) lastY = y;
  clearTimeout(idleTimer);
  idleTimer = setTimeout(() => setCompact(false), 900); // po zastavení zase plná lišta
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

// ---------- Běžící pás oborů: pauza, když není na obrazovce ----------
const band = document.querySelector('.band');
if (band) new IntersectionObserver(([e]) => band.classList.toggle('paused', !e.isIntersecting)).observe(band);

// ---------- Plynulé skoky na sekce ----------
// Dlouhý plynulý posun přes celou stránku na mobilu „seká“ (musí se cestou
// vykreslit všechny obrázky). U vzdálených cílů proto skočíme skoro k cíli
// okamžitě a jen poslední kousek dojedeme plynule.
document.addEventListener('click', e => {
  const a = e.target.closest('a[href^="#"]');
  if (!a || e.defaultPrevented || e.metaKey || e.ctrlKey) return;
  const id = a.getAttribute('href');
  const target = id.length > 1 && document.querySelector(id);
  if (!target) return;
  e.preventDefault();
  const top = target.getBoundingClientRect().top + window.scrollY;
  const dist = top - window.scrollY;
  const near = window.innerHeight * 0.9;
  const glide = () => window.scrollTo({top, behavior: reduceMotion ? 'instant' : 'smooth'});
  if (Math.abs(dist) > near * 1.6){
    window.scrollTo({top: top - Math.sign(dist) * near, behavior: 'instant'});
    setTimeout(glide, 30); // dojezd až po vykreslení skoku
  } else glide();
  history.replaceState(null, '', id);
});

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
// Na dotykových zařízeních se živé weby nenačítají vůbec (šetří data i výkon),
// zůstane jen screenshot a tlačítko „Otevřít web“.
const canLivePreview = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
document.querySelectorAll('.site[data-url]').forEach(card => {
  const url = card.dataset.url;
  const view = card.querySelector('.browser-view');
  card.querySelector('.b-url').textContent = url.replace(/^https?:\/\//, '').replace(/\/$/, '');
  if (!canLivePreview) return;
  const frame = document.createElement('iframe');
  frame.src = url;
  frame.loading = 'lazy';
  frame.title = T.livePreview + url.replace(/^https?:\/\//, '');
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
      btn.textContent = T.copied;
    }catch{
      btn.textContent = T.copyFail;
    }
    btn.classList.add('done');
    setTimeout(() => { btn.textContent = T.copy; btn.classList.remove('done'); }, 1800);
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
    setStatus(T.fillAll, 'err');
    return;
  }
  if (!form.email.checkValidity()){
    setStatus(T.checkEmail, 'err');
    form.email.focus();
    return;
  }
  if (form._honey.value) return; // vyplnil to robot

  submitBtn.disabled = true;
  submitBtn.textContent = T.sending;
  setStatus('');
  try{
    const res = await fetch(FORM_ENDPOINT, {
      method:'POST',
      headers:{'Content-Type':'application/json', 'Accept':'application/json'},
      body:JSON.stringify({
        name:jmeno,
        email:email,
        message:zprava,
        _subject:T.subject + jmeno,
        _template:'table',
        _captcha:'false'
      })
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok || data.success === 'false' || data.success === false) throw new Error(data.message || res.status);
    form.reset();
    setStatus(T.thanks, 'ok');
    submitBtn.textContent = T.sent;
    setTimeout(() => { submitBtn.textContent = T.send; submitBtn.disabled = false; }, 4000);
  }catch(err){
    setStatus(T.failed, 'err');
    submitBtn.textContent = T.send;
    submitBtn.disabled = false;
  }
});
