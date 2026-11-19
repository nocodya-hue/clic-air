/* Clic Air Systems · interacción (sin dependencias) */
(() => {
  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];
  const quieto = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const tel = '34634604393';
  document.documentElement.classList.remove('sin-js');

  /* ---------- cabecera sólida y barra móvil ---------- */
  const cab = $('#cab'), barra = $('.barra'), portada = $('#inicio');
  const alScroll = () => {
    const y = scrollY;
    cab.classList.toggle('es-solida', y > 40);
    if (barra) barra.classList.toggle('ver', y > portada.offsetHeight * 0.6);
  };
  let pidCab = 0;
  addEventListener('scroll', () => { if (!pidCab) pidCab = requestAnimationFrame(() => { pidCab = 0; alScroll(); }); }, { passive: true }); alScroll();

  /* ---------- abierto ahora (hora de Valencia) ---------- */
  const estado = () => {
    const p = Object.fromEntries(new Intl.DateTimeFormat('es-ES', { timeZone: 'Europe/Madrid', weekday: 'short', hour: 'numeric', minute: 'numeric', hourCycle: 'h23' }).formatToParts(new Date()).map((x) => [x.type, x.value]));
    const dia = new Date().toLocaleDateString('en-GB', { timeZone: 'Europe/Madrid', weekday: 'short' });
    const min = +p.hour * 60 + +p.minute;
    const lab = !['Sat', 'Sun'].includes(dia);
    const abierto = lab && min >= 420 && min < 900;
    const txt = abierto ? 'Abierto ahora · hasta las 15:00' : (lab && min < 420 ? 'Cerrado · abrimos hoy a las 7:00' : 'Cerrado · abrimos el lunes a las 7:00');
    const txt2 = abierto ? txt : (lab && min < 420 ? txt : (dia === 'Fri' || dia === 'Sat' || dia === 'Sun' ? 'Cerrado · abrimos el lunes a las 7:00' : 'Cerrado · abrimos mañana a las 7:00'));
    const e = $('#estado span');
    if (e) e.innerHTML = `Lunes a viernes, de 7:00 a 15:00 · <b class="${abierto ? '' : 'cerrado'}">${abierto ? 'Abierto ahora' : 'Cerrado ahora'}</b>`;
    const a = $('#ahora');
    if (a) { a.textContent = txt2; a.classList.toggle('cerrado', !abierto); }
  };
  estado(); setInterval(estado, 60000);

  /* ---------- revelado ---------- */
  const io = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) { e.target.classList.add('visto'); io.unobserve(e.target); } }), { rootMargin: '0px 0px -8% 0px' });
  $$('.revelar').forEach((el, i) => { el.style.setProperty('--retraso', `${(i % 3) * 0.08}s`); io.observe(el); });

  /* ---------- mando de modos + aire de la portada ---------- */
  const MODOS = {
    frio:    { nombre: 'Frío', valor: '24 °C', nota: 'aire fresco, sin corrientes', color: '#8fb8ff', vel: 1.5, giro: 1.0, sube: 0, vueltas: '24s', aguja: -45 },
    calor:   { nombre: 'Calor', valor: '21 °C', nota: 'bomba de calor: calefacción eficiente', color: '#ff8a5b', vel: 1.05, giro: 0.7, sube: -0.22, vueltas: '32s', aguja: 45 },
    ventila: { nombre: 'Ventilar', valor: 'Aire nuevo', nota: 'renueva el aire sin perder temperatura', color: '#c6f24e', vel: 2.4, giro: 0.35, sube: 0, vueltas: '9s', aguja: 135 },
    seco:    { nombre: 'Secar', valor: '50 % HR', nota: 'fuera la humedad de los días de bochorno', color: '#e3e6ff', vel: 0.8, giro: 1.5, sube: 0, vueltas: '44s', aguja: 225 },
  };
  let modo = MODOS.frio;
  const mando = $('#mando'), placa = $('#placa');
  const ponModo = (clave, foco) => {
    modo = MODOS[clave];
    portada.dataset.modo = clave;
    portada.style.setProperty('--modo', modo.color);
    document.documentElement.style.setProperty('--modo', modo.color);
    $('.placa__dif').style.setProperty('--vel', modo.vueltas);
    mando.style.setProperty('--giro', modo.aguja + 'deg');
    $('.mando__rueda').style.setProperty('--giro', modo.aguja + 'deg');
    $$('button', mando).forEach((b) => { const si = b.dataset.modo === clave; b.setAttribute('aria-checked', si); b.tabIndex = si ? 0 : -1; if (si && foco) b.focus(); });
    $('#lectura-modo').textContent = modo.nombre; $('#lectura-valor').textContent = modo.valor; $('#lectura-nota').textContent = modo.nota;
    if (foco === undefined) return;   // primera vez: sin clic ni vibración
    mando.classList.remove('clic'); void mando.offsetWidth; mando.classList.add('clic');
    if (navigator.vibrate && navigator.userActivation && navigator.userActivation.hasBeenActive) try { navigator.vibrate(8); } catch (e) { /* nada */ }
  };
  $$('button', mando).forEach((b) => b.addEventListener('click', () => ponModo(b.dataset.modo, false)));
  mando.addEventListener('keydown', (e) => {
    const orden = Object.keys(MODOS), i = orden.indexOf(portada.dataset.modo);
    if (['ArrowRight', 'ArrowDown'].includes(e.key)) { e.preventDefault(); ponModo(orden[(i + 1) % 4], true); }
    if (['ArrowLeft', 'ArrowUp'].includes(e.key)) { e.preventDefault(); ponModo(orden[(i + 3) % 4], true); }
  });
  $('.mando__rueda').addEventListener('click', () => { const o = Object.keys(MODOS); ponModo(o[(o.indexOf(portada.dataset.modo) + 1) % 4], false); });
  $('.mando__rueda').style.cursor = 'pointer';
  ponModo('frio');

  // inclinación de la placa con el puntero (solo ratón)
  if (matchMedia('(hover: hover) and (pointer: fine)').matches && !quieto) {
    portada.addEventListener('pointermove', (e) => {
      const r = placa.getBoundingClientRect();
      const dx = (e.clientX - (r.left + r.width / 2)) / innerWidth, dy = (e.clientY - (r.top + r.height / 2)) / innerHeight;
      placa.style.setProperty('--ry', (dx * 14).toFixed(2) + 'deg'); placa.style.setProperty('--rx', (-dy * 14).toFixed(2) + 'deg');
    });
    portada.addEventListener('pointerleave', () => { placa.style.setProperty('--ry', '0deg'); placa.style.setProperty('--rx', '0deg'); });
  }

  // partículas de aire saliendo del difusor
  const cv = $('#aire'), cx = cv.getContext('2d');
  let W = 0, H = 0, dpr = 1, centro = { x: 0, y: 0, r: 100 }, parts = [], puntero = { x: -1e4, y: -1e4 }, vivo = true, raf = 0;
  const movil = () => innerWidth < 760;
  const medir = () => {
    dpr = 1;   // las estelas no necesitan retina: 4 veces menos píxeles en pantallas de Mac y móvil
    const r = portada.getBoundingClientRect();
    W = r.width; H = r.height;
    cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr);
    const p = placa.getBoundingClientRect();
    centro = { x: p.left - r.left + p.width / 2, y: p.top - r.top + p.height / 2, r: p.width * 0.36 };
  };
  const nueva = () => {
    const a = Math.random() * Math.PI * 2, r = centro.r * (0.55 + Math.random() * 0.45);
    const v = modo.vel * (0.6 + Math.random() * 0.8) * (movil() ? 0.8 : 1);
    const t = modo.giro * v;
    return { x: centro.x + Math.cos(a) * r, y: centro.y + Math.sin(a) * r, vx: Math.cos(a) * v - Math.sin(a) * t, vy: Math.sin(a) * v + Math.cos(a) * t, vida: 0, max: 140 + Math.random() * 160, w: 0.8 + Math.random() * 1.4 };
  };
  const cuantas = () => (movil() ? 60 : 150);
  const LOTES = 4, lotes = Array.from({ length: LOTES }, () => []);
  const dibujar = () => {
    raf = 0;
    if (!vivo) return;
    cx.setTransform(dpr, 0, 0, dpr, 0, 0);
    cx.clearRect(0, 0, W, H);
    cx.strokeStyle = modo.color; cx.lineCap = 'round'; cx.lineWidth = movil() ? 1.3 : 1.5;
    while (parts.length < cuantas()) parts.push(nueva());
    for (const l of lotes) l.length = 0;
    const g = 0.006 * modo.giro, c = Math.cos(g), s = Math.sin(g);
    for (let i = parts.length - 1; i >= 0; i--) {
      const p = parts[i];
      // curva en espiral: gira la velocidad un poco cada fotograma
      const vx = p.vx * c - p.vy * s, vy = p.vx * s + p.vy * c;
      p.vx = vx * 0.996; p.vy = vy * 0.996 + modo.sube * 0.02;
      // el puntero aparta el aire
      const dx = p.x - puntero.x, dy = p.y - puntero.y, d2 = dx * dx + dy * dy;
      if (d2 < 16000) { const f = (1 - d2 / 16000) * 0.9; const d = Math.sqrt(d2) || 1; p.vx += (dx / d) * f; p.vy += (dy / d) * f; }
      p.x += p.vx; p.y += p.vy; p.vida++;
      const t = p.vida / p.max;
      if (t >= 1 || p.x < -40 || p.x > W + 40 || p.y < -40 || p.y > H + 40) { parts[i] = nueva(); continue; }
      lotes[Math.min(LOTES - 1, Math.floor(Math.sin(t * Math.PI) * LOTES))].push(p);
    }
    for (let k = 0; k < LOTES; k++) {
      const l = lotes[k]; if (!l.length) continue;
      cx.globalAlpha = (k + 0.6) / LOTES * 0.62;
      cx.beginPath();
      for (const p of l) { cx.moveTo(p.x - p.vx * 8, p.y - p.vy * 8); cx.lineTo(p.x, p.y); }
      cx.stroke();
    }
    cx.globalAlpha = 1;
    raf = requestAnimationFrame(dibujar);
  };
  if (!quieto) {
    medir();
    addEventListener('resize', () => { medir(); parts = []; });
    portada.addEventListener('pointermove', (e) => { const r = portada.getBoundingClientRect(); puntero = { x: e.clientX - r.left, y: e.clientY - r.top }; });
    portada.addEventListener('pointerleave', () => { puntero = { x: -1e4, y: -1e4 }; });
    new IntersectionObserver(([e]) => { vivo = e.isIntersecting && !document.hidden; if (vivo && !raf && document.readyState === 'complete') { medir(); raf = requestAnimationFrame(dibujar); } }).observe(portada);
    document.addEventListener('visibilitychange', () => { vivo = !document.hidden; if (vivo && !raf) raf = requestAnimationFrame(dibujar); });
    // empezar tras el primer pintado, sin bloquear
    const arrancar = () => (window.requestIdleCallback || setTimeout)(() => { medir(); if (!raf) raf = requestAnimationFrame(dibujar); }, { timeout: 1200 });
    if (document.readyState === 'complete') arrancar(); else addEventListener('load', arrancar, { once: true });
  }

  /* ---------- proceso: el plano sigue al paso visible ---------- */
  const plano = $('#plano');
  const NOMBRES = ['Visita y medición', 'Cálculo y diseño', 'Montaje', 'Puesta en marcha', 'Mantenimiento'];
  if (plano) {
    const pasos = $$('.paso');
    const activar = (n) => {
      plano.dataset.paso = n;
      $('#plano-paso').textContent = String(n).padStart(2, '0');
      $('#plano-nombre').textContent = NOMBRES[n - 1];
      pasos.forEach((p) => p.classList.toggle('activo', +p.dataset.paso === n));
    };
    const ioP = new IntersectionObserver((es) => {
      es.forEach((e) => { if (e.isIntersecting) activar(+e.target.dataset.paso); });
    }, { rootMargin: '-45% 0px -45% 0px' });
    pasos.forEach((p) => ioP.observe(p));
    new IntersectionObserver(([e]) => plano.classList.toggle('en-vista', e.isIntersecting)).observe($('#proceso'));
    activar(1);
  }

  /* ---------- puntos sobre las fotos de la obra ---------- */
  $$('.punto').forEach((b) => b.addEventListener('click', (e) => {
    e.stopPropagation();
    const abre = !b.classList.contains('abierto');
    $$('.punto.abierto').forEach((o) => o.classList.remove('abierto'));
    b.classList.toggle('abierto', abre);
    b.setAttribute('aria-expanded', abre);
  }));
  document.addEventListener('click', () => $$('.punto.abierto').forEach((o) => o.classList.remove('abierto')));

  /* ---------- calculadora ---------- */
  const calc = $('#calc');
  if (calc) {
    const FACT = { vivienda: 0.1, oficina: 0.12, local: 0.14, hosteleria: 0.18 };
    const NOM = { vivienda: 'vivienda', oficina: 'oficina', local: 'local o tienda', hosteleria: 'bar o restaurante' };
    const TALLAS = [2.5, 3.5, 5, 6, 7.1, 8.5, 10, 12.5, 14, 16];
    const talla = (k) => TALLAS.find((t) => t >= k * 0.97) || Math.ceil(k * 2) / 2;
    const sistema = (tipo, m2) => {
      if (tipo === 'vivienda') return m2 <= 35 ? ['Split de pared', 'Un equipo para una estancia: lo más sencillo y económico.'] : m2 <= 90 ? ['Multisplit o conductos', 'Una máquina exterior para varias habitaciones, o conductos con una rejilla en cada una.'] : ['Conductos por zonas', 'Una sola máquina oculta en el falso techo y cada zona a su temperatura.'];
      if (tipo === 'oficina') return m2 <= 40 ? ['Split o cassette', 'Para un despacho pequeño basta con un equipo bien colocado.'] : ['Conductos o cassettes + ventilación', 'Clima igual en toda la planta y el aire exterior que pide el RITE.'];
      if (tipo === 'local') return m2 <= 50 ? ['Cassette o split de techo', 'Reparte el aire en cuatro direcciones sin ocupar pared.'] : ['Conductos o cassettes + ventilación', 'Para tiendas grandes, con renovación de aire según el RITE.'];
      return ['Conductos o cassettes + extracción', 'Mucha gente y cocina: hace falta potencia, extracción y aporte de aire.'];
    };
    const m2 = $('#m2'), sol = $('#sol'), wa = $('#calc-wa');
    const num = (n, d = 1) => n.toLocaleString('es-ES', { minimumFractionDigits: d, maximumFractionDigits: d });
    const calcular = () => {
      const tipo = calc.tipo.value, s = +m2.value;
      const kw = s * FACT[tipo] * (sol.checked ? 1.15 : 1);
      const k = kw <= 16 ? talla(kw) : Math.ceil(kw * 2) / 2;
      const [sis, nota] = sistema(tipo, s);
      $('#m2-sal').textContent = s + ' m²';
      m2.style.setProperty('--p', ((s - 10) / 390 * 100).toFixed(1) + '%');
      $('#r-kw').textContent = num(k, k % 1 ? 1 : 0);
      $('#r-fg').textContent = (Math.round(k * 860 / 100) * 100).toLocaleString('es-ES');
      $('#r-sis').textContent = sis; $('#r-nota').textContent = nota;
      const txt = `Hola, quiero presupuesto de climatización. Espacio: ${NOM[tipo]} de ${s} m²${sol.checked ? ', le da mucho el sol' : ''}. Según vuestra calculadora: unos ${num(k, k % 1 ? 1 : 0)} kW, ${sis.toLowerCase()}.`;
      wa.href = `https://wa.me/${tel}?text=${encodeURIComponent(txt)}`;
      wa.target = '_blank'; wa.rel = 'noopener';
    };
    calc.addEventListener('input', calcular); calcular();
  }

  /* ---------- formulario → WhatsApp ---------- */
  const form = $('#formulario');
  if (form) form.addEventListener('submit', (e) => {
    e.preventDefault();
    const d = new FormData(form);
    const txt = [`Hola, soy ${d.get('nombre')}.`, `Necesito: ${d.get('que')}.`, d.get('donde') ? `Población: ${d.get('donde')}.` : '', d.get('msg') || ''].filter(Boolean).join(' ');
    open(`https://wa.me/${tel}?text=${encodeURIComponent(txt)}`, '_blank', 'noopener');
  });

  /* ---------- furgoneta que llega con el scroll ---------- */
  const furgo = $('.furgo'), zona = $('#zona');
  if (furgo && zona) {
    const ruedas = $$('.furgo__rueda', furgo);
    let ultimo = -1;
    const mover = () => {
      const r = zona.getBoundingClientRect();
      let p = (innerHeight - r.top) / (innerHeight + r.height * 0.5);
      p = Math.max(0, Math.min(1, p));
      const e = 1 - Math.pow(1 - p, 3);
      const fw = furgo.offsetWidth;
      const x = -fw + e * (innerWidth * (innerWidth < 760 ? 0.5 : 0.62) - fw * 0.35 + fw);
      if (Math.abs(x - ultimo) < 0.3) return;
      furgo.style.transform = `translateX(${x.toFixed(1)}px)`;
      const diam = fw * 0.16;
      ruedas.forEach((w) => { w.style.transform = `rotate(${(x / (Math.PI * diam) * 360).toFixed(1)}deg)`; });
      ultimo = x;
    };
    if (quieto) furgo.style.transform = `translateX(${innerWidth * 0.3}px)`;
    else { let pid = 0; addEventListener('scroll', () => { if (!pid) pid = requestAnimationFrame(() => { pid = 0; mover(); }); }, { passive: true }); addEventListener('resize', mover); mover(); }
  }
})();
