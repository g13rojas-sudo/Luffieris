/* =========================================================
   LUFFIERIS — interactividad
   1. Menú móvil
   2. Demo de gotas (agua resbala, aceite se absorbe)
   3. Formulario de contacto
   ========================================================= */

const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ---------- 1. Menú móvil ---------- */
const toggle = document.querySelector('.nav-toggle');
const links = document.getElementById('nav-links');

toggle.addEventListener('click', () => {
  const open = toggle.getAttribute('aria-expanded') === 'true';
  toggle.setAttribute('aria-expanded', String(!open));
  links.classList.toggle('open', !open);
});
links.querySelectorAll('a').forEach(a => a.addEventListener('click', () => {
  toggle.setAttribute('aria-expanded', 'false');
  links.classList.remove('open');
}));

/* ---------- 2. Demo de gotas ---------- */
const SVG_NS = 'http://www.w3.org/2000/svg';
const dropLayer = document.getElementById('dropLayer');
const stainLayer = document.getElementById('stainLayer');
const oilCountEl = document.getElementById('oilCount');
const waterCountEl = document.getElementById('waterCount');
const MAT = { x1: 70, x2: 490, y1: 214, y2: 296 }; // superficie de la manta
const WATER_LINE = 262;
let oilCount = 0;
let waterCount = 0;

const el = (tag, attrs) => {
  const n = document.createElementNS(SVG_NS, tag);
  for (const k in attrs) n.setAttribute(k, attrs[k]);
  return n;
};

const COLORS = {
  water: { fill: '#7fd3e2', stroke: '#2a8fa8' },
  oil:   { fill: '#e8ae32', stroke: '#9c650c' }
};

function makeDrop(kind) {
  const g = el('g', {});
  g.appendChild(el('path', {
    d: 'M0,-18 C3,-10 10,-4 10,4 A10,10 0 1 1 -10,4 C-10,-4 -3,-10 0,-18Z',
    fill: COLORS[kind].fill, stroke: COLORS[kind].stroke, 'stroke-width': 1.5
  }));
  g.appendChild(el('ellipse', { cx: -3.5, cy: 1, rx: 2.4, ry: 4, fill: '#fff', opacity: .85 }));
  return g;
}

function makeBead() {
  const g = el('g', {});
  g.appendChild(el('ellipse', { cx: 2, cy: 7, rx: 11, ry: 3.5, fill: '#5a3d14', opacity: .25 }));
  g.appendChild(el('ellipse', { cx: 0, cy: 0, rx: 11, ry: 9, fill: '#9fe0ec', stroke: '#2a8fa8', 'stroke-width': 1.5 }));
  g.appendChild(el('ellipse', { cx: -4, cy: -3, rx: 3.2, ry: 2, fill: '#fff' }));
  return g;
}

function animate(duration, step, done) {
  if (reduceMotion) { step(1); done && done(); return; }
  const start = performance.now();
  function frame(now) {
    const t = Math.min(1, (now - start) / duration);
    step(t);
    if (t < 1) requestAnimationFrame(frame); else done && done();
  }
  requestAnimationFrame(frame);
}

function dropIt(kind) {
  const x = MAT.x1 + 40 + Math.random() * (MAT.x2 - MAT.x1 - 80);
  const yLand = MAT.y1 + 12 + Math.random() * (MAT.y2 - MAT.y1 - 24);
  const drop = makeDrop(kind);
  dropLayer.appendChild(drop);

  // Caída con aceleración
  animate(650, t => {
    const y = -20 + (yLand + 20) * t * t;
    drop.setAttribute('transform', `translate(${x} ${y})`);
  }, () => {
    drop.remove();
    kind === 'oil' ? absorbOil(x, yLand) : repelWater(x, yLand);
  });
}

function absorbOil(x, y) {
  const r = 20 + Math.random() * 12;
  const stain = el('ellipse', { cx: x, cy: y, rx: 2, ry: 1.5, fill: 'url(#oilStain)' });
  stainLayer.appendChild(stain);
  animate(700, t => {
    const e = 1 - Math.pow(1 - t, 3);
    stain.setAttribute('rx', 2 + r * e);
    stain.setAttribute('ry', 1.5 + r * 0.6 * e);
  });
  oilCountEl.textContent = ++oilCount;
}

function repelWater(x, y) {
  const bead = makeBead();
  bead.setAttribute('transform', `translate(${x} ${y})`);
  dropLayer.appendChild(bead);

  // La gota se queda un momento sobre la fibra, rueda hacia la orilla y cae al agua
  const edgeX = x < (MAT.x1 + MAT.x2) / 2 ? MAT.x1 - 8 : MAT.x2 + 8;
  const pause = reduceMotion ? 0 : 500;
  setTimeout(() => {
    animate(Math.abs(edgeX - x) * 2.2, t => {
      const e = t * t;
      bead.setAttribute('transform', `translate(${x + (edgeX - x) * e} ${y})`);
    }, () => {
      animate(420, t => {
        bead.setAttribute('transform', `translate(${edgeX} ${y + (WATER_LINE - y + 20) * t * t})`);
        bead.setAttribute('opacity', 1 - t);
      }, () => bead.remove());
    });
  }, pause);
  waterCountEl.textContent = ++waterCount;
}

document.querySelectorAll('.drop-btn').forEach(btn =>
  btn.addEventListener('click', () => dropIt(btn.dataset.kind))
);

document.getElementById('demoReset').addEventListener('click', () => {
  stainLayer.replaceChildren();
  dropLayer.replaceChildren();
  oilCount = 0; waterCount = 0;
  oilCountEl.textContent = '0';
  waterCountEl.textContent = '0';
});

// Una gota de cada tipo al cargar, para que se entienda la idea sin hacer clic
if (!reduceMotion) {
  setTimeout(() => dropIt('water'), 700);
  setTimeout(() => dropIt('oil'), 1500);
}

/* ---------- 3. Formulario de contacto ----------
   Sin servidor: valida los campos y abre el cliente de correo
   con el mensaje listo. Para recibir mensajes sin depender del
   correo del visitante, ver recomendaciones (Formspree). */
const form = document.getElementById('contactForm');
const statusEl = document.getElementById('formStatus');
const CONTACT_EMAIL = 'info.luffieris@gmail.com';

function setError(id, msg) {
  const input = document.getElementById(id);
  const err = document.getElementById(`${id}-error`);
  input.setAttribute('aria-invalid', msg ? 'true' : 'false');
  if (msg) input.setAttribute('aria-describedby', `${id}-error`);
  else input.removeAttribute('aria-describedby');
  err.textContent = msg;
  return !msg;
}

form.addEventListener('submit', e => {
  e.preventDefault();
  const val = id => document.getElementById(id).value.trim();
  const name = val('name');
  const email = val('email');
  const message = val('message');
  const org = val('org');
  const sector = val('sector');

  const ok = [
    setError('name', name ? '' : 'Escribe tu nombre.'),
    setError('email', /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ? '' : 'Escribe un correo válido, por ejemplo nombre@dominio.com.'),
    setError('message', message ? '' : 'Escribe tu mensaje.')
  ].every(Boolean);

  if (!ok) {
    statusEl.textContent = '';
    form.querySelector('[aria-invalid="true"]').focus();
    return;
  }

  const subject = `Contacto web Luffieris: ${sector}`;
  const body = `Nombre: ${name}\nCorreo: ${email}\nOrganización: ${org || 'No indicada'}\nSector: ${sector}\n\n${message}`;
  window.location.href = `mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  statusEl.textContent = 'Abrimos tu aplicación de correo con el mensaje listo. Solo falta enviarlo.';
});
