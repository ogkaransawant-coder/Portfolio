/* Animation and navigation component. Content lives in index.html. */
const sections = [...document.querySelectorAll('main section')];
const links = [...document.querySelectorAll('.top-nav a')];
const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const loader = document.getElementById('page-loader');
let started = false;
// Split only visual heading text. The source HTML remains easy to edit.
document.querySelectorAll('.hero-title, .display-title > span').forEach(line => {
  const text = line.textContent;
  line.setAttribute('aria-label', text);
  line.textContent = '';
  [...text].forEach((letter, index) => {
    const char = document.createElement('span');
    char.className = 'heading-char';
    char.setAttribute('aria-hidden', 'true');
    char.style.setProperty('--char-delay', (index * 40) + 'ms');
    char.textContent = letter === ' ' ? '\u00a0' : letter;
    line.appendChild(char);
  });
});
// Sequence the smaller labels after each section's main entrance.
document.querySelectorAll('.section-header, .section-footer').forEach(el => {
  el.classList.add('reveal');
  el.dataset.delay = el.classList.contains('section-footer') ? '600' : '100';
});
document.querySelectorAll('[data-delay]').forEach(el => el.style.setProperty('--delay', el.dataset.delay + 'ms'));
const reveal = new IntersectionObserver(entries => {
  entries.forEach(entry => {
    if (entry.isIntersecting) requestAnimationFrame(() => entry.target.classList.add('is-visible'));
    else if (entry.boundingClientRect.bottom <= 0 || entry.boundingClientRect.top >= innerHeight) entry.target.classList.remove('is-visible');
  });
}, { rootMargin: '0px 0px -8% 0px', threshold: 0 });
const active = new IntersectionObserver(entries => {
  entries.forEach(entry => {
    if (entry.isIntersecting) links.forEach(link => link.setAttribute('aria-current', String(link.hash === '#' + entry.target.id)));
  });
}, { rootMargin: '-20% 0px -45% 0px', threshold: 0 });
sections.forEach(section => active.observe(section));
function start() {
  if (started) return;
  started = true;
  loader.classList.add('is-closing');
  document.documentElement.classList.remove('intro-loading');
  setTimeout(() => {
    loader.hidden = true;
    sections.forEach(section => reveal.observe(section));
  }, reduced ? 0 : 700);
}
document.getElementById('skip-intro').addEventListener('click', start);
if (reduced) start();
else {
  document.documentElement.classList.add('motion-ready', 'intro-loading');
  loader.hidden = false;
  const hero = document.querySelector('.hero-portrait');
  Promise.all([
    Promise.race([hero.decode().catch(() => {}), new Promise(resolve => setTimeout(resolve, 2000))]),
    new Promise(resolve => setTimeout(resolve, 1300))
  ]).then(start);
}

/* CURSOR COMPONENT: decorative only; native cursor and click targets stay intact. */
(() => {
  const capability = matchMedia('(hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference)');
  const layer = document.createElement('div');
  layer.className = 'cursor-effect';
  layer.setAttribute('aria-hidden', 'true');
  layer.innerHTML = '<div class="cursor-glow"></div><div class="cursor-ring"><span></span></div>';
  document.body.appendChild(layer);
  const ring = layer.querySelector('.cursor-ring');
  const glow = layer.querySelector('.cursor-glow');
  let tx=0, ty=0, x=0, y=0, frame=0, visible=false;
  function draw() {
    x += (tx-x)*.18; y += (ty-y)*.18;
    ring.style.transform = `translate3d(${x}px,${y}px,0)`;
    glow.style.transform = `translate3d(${x}px,${y}px,0)`;
    if (visible && (Math.abs(tx-x)>.1 || Math.abs(ty-y)>.1)) frame=requestAnimationFrame(draw);
    else frame=0;
  }
  function hide() {
    visible=false;layer.classList.remove('is-active','is-link');
    if(frame)cancelAnimationFrame(frame);frame=0;
  }
  window.addEventListener('pointermove', event => {
    if(!capability.matches || event.pointerType!=='mouse') {hide();return;}
    tx=event.clientX;ty=event.clientY;
    if(!visible){x=tx;y=ty;visible=true;layer.classList.add('is-active');}
    layer.classList.toggle('is-link', Boolean(event.target.closest?.('a,button,input,textarea,select,[role="button"]')));
    if(!frame)frame=requestAnimationFrame(draw);
  }, {passive:true});
  window.addEventListener('pointerdown', event => {
    if(!visible || !capability.matches || event.pointerType!=='mouse')return;
    ring.querySelector('span').animate([
      {transform:'translate(-50%,-50%) scale(1)',opacity:1},
      {transform:'translate(-50%,-50%) scale(.7)',opacity:1},
      {transform:'translate(-50%,-50%) scale(1.3)',opacity:.35},
      {transform:'translate(-50%,-50%) scale(1)',opacity:1}
    ],{duration:380,easing:'ease-out'});
  }, {passive:true});
  document.documentElement.addEventListener('pointerleave',hide);
  window.addEventListener('blur',hide);
  document.addEventListener('visibilitychange',()=>{if(document.hidden)hide();});
  capability.addEventListener('change',hide);
})();
