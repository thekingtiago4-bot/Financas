/* Finanças. · janelas flutuantes (como no Health Log): arrastar pelo título, redimensionar pelas alças,
   fixar (trava só o arrastar; redimensionar continua), recolher, fechar. Posição/tamanho ficam guardados
   neste aparelho (pref "fin:jan"). Celular/tela estreita: as janelas viram cartões empilhados. */
(function () {
  const P = {
    casa: '<path d="M3 10.5 12 3l9 7.5"/><path d="M5 9.5V21h14V9.5"/><path d="M10 21v-6h4v6"/>',
    lista: '<path d="M6 3h12v18l-3-2-3 2-3-2-3 2z"/><path d="M9 8h6M9 12h6M9 16h3"/>',
    alvo: '<circle cx="12" cy="12" r="8.5"/><circle cx="12" cy="12" r="4.5"/><circle cx="12" cy="12" r=".9"/>',
    brilho: '<path d="M12 3l1.9 5.1L19 10l-5.1 1.9L12 17l-1.9-5.1L5 10l5.1-1.9z"/><path d="M19 15.5l.7 1.8 1.8.7-1.8.7-.7 1.8-.7-1.8-1.8-.7 1.8-.7z"/>',
    ajuste: '<path d="M4 6h9M17 6h3M4 12h3M11 12h9M4 18h11M19 18h1"/><circle cx="15" cy="6" r="2"/><circle cx="9" cy="12" r="2"/><circle cx="17" cy="18" r="2"/>',
    mais: '<path d="M12 5v14M5 12h14"/>',
    cal: '<rect x="4" y="5" width="16" height="15" rx="2"/><path d="M4 10h16M9 3v4M15 3v4"/>',
    cartao: '<rect x="2.5" y="5" width="19" height="14" rx="2"/><path d="M2.5 10h19M6.5 15h4"/>',
    carteira: '<path d="M4 7h14a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a1 1 0 0 1-1-1z"/><path d="M4 7V6a2 2 0 0 1 2-2h10v3"/><circle cx="16" cy="13.5" r="1.2"/>',
    moeda: '<circle cx="12" cy="12" r="8.5"/><path d="M14.8 9.2c-.5-.9-1.6-1.4-2.8-1.4-1.6 0-2.8.8-2.8 2s1.1 1.7 2.8 2.1 2.8.9 2.8 2.1-1.2 2.1-2.8 2.1c-1.3 0-2.4-.5-2.9-1.5M12 6v1.8M12 16.2V18"/>',
    barras: '<path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/>',
    pizza: '<path d="M12 3a9 9 0 1 0 9 9h-9z"/><path d="M15 3.5A9 9 0 0 1 20.5 9H15z"/>',
    linha: '<path d="M3 17l6-6 4 4 8-8"/><path d="M15 7h6v6"/>',
    calc: '<rect x="5" y="3" width="14" height="18" rx="2"/><path d="M8 7h8M8 11h.01M12 11h.01M16 11h.01M8 15h.01M12 15h.01M16 15h.01M8 18h.01M12 18h4"/>',
    folha: '<path d="M5 19c0-8 5-14 15-15-1 10-7 15-15 15z"/><path d="M5 19l7-7"/>',
    disco: '<path d="M5 3h11l3 3v15H5z"/><path d="M8 3v5h7V3M8 21v-7h8v7"/>',
    pin: '<path d="M9 4h6l-1 5 3.5 3.5h-11L10 9z"/><path d="M12 12.5V20"/>',
    menos: '<path d="M6 12h12"/>', x: '<path d="M6 6l12 12M18 6 6 18"/>',
    busca: '<circle cx="11" cy="11" r="7"/><path d="m20 20-4-4"/>',
    sol: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>',
    lua: '<path d="M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5z"/>',
    esq: '<path d="m15 6-6 6 6 6"/>', dir: '<path d="m9 6 6 6-6 6"/>', baixo: '<path d="m6 9 6 6 6-6"/>',
    janelas: '<rect x="3" y="3" width="8" height="8" rx="1.5"/><rect x="13" y="3" width="8" height="5" rx="1.5"/><rect x="13" y="10" width="8" height="11" rx="1.5"/><rect x="3" y="13" width="8" height="8" rx="1.5"/>',
    ok: '<path d="M5 12.5l4.5 4.5L19 7"/>', alerta: '<path d="M12 4 3 20h18z"/><path d="M12 10v4M12 17.5v.1"/>',
    info: '<circle cx="12" cy="12" r="8.5"/><path d="M12 11v5M12 8v.1"/>',
    enviar: '<path d="M4 12 20 4l-6 16-3-7z"/>', cadeado: '<rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/>',
    lixo: '<path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13"/>', editar: '<path d="M4 20h4L19 9l-4-4L4 16z"/>',
    reset: '<path d="M3 12a9 9 0 1 0 3-6.7"/><path d="M3 4v5h5"/>', menu: '<path d="M4 6h16M4 12h16M4 18h16"/>'
  };
  const ico = (n, cls) => '<svg class="ico' + (cls ? ' ' + cls : '') + '" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + (P[n] || '') + '</svg>';

  const J = {}; const MINW = 240, MINH = 130, CHAVE = 'fin:jan2';
  let mesa, defs = {}, ordem = [], L = {}, ztop = 10, aoDesenhar = () => {}, aoMudar = () => {}, rt;
  const mq = matchMedia('(max-width: 860px)');
  J.empilhado = () => mq.matches;
  const ler = () => { try { return JSON.parse(localStorage.getItem(CHAVE)) || {}; } catch (e) { return {}; } };
  const salvar = () => { try { localStorage.setItem(CHAVE, JSON.stringify(L)); } catch (e) { /* sem espaço: segue */ } };
  const st = id => (L[id] = L[id] || {});

  J.init = (el, lista, o) => {
    mesa = el; aoDesenhar = o.desenhar; aoMudar = o.mudou || aoMudar; L = ler();
    lista.forEach((d, i) => { defs[d.id] = Object.assign({ ordem: i }, d); ordem.push(d.id); });
    ztop = Math.max(10, ...Object.values(L).map(s => s.z || 0));
    if (ztop > 4000) { const ids = Object.keys(L).sort((a, b) => (L[a].z || 0) - (L[b].z || 0)); ids.forEach((id, i) => { L[id].z = 10 + i; }); ztop = 10 + ids.length; salvar(); }
    mesa.addEventListener('pointerdown', apertar);
    mesa.addEventListener('click', clicar);
    mesa.addEventListener('dblclick', e => { const cab = e.target.closest('.jan-cab'); if (cab && !e.target.closest('button')) alternar(cab.parentNode, 'min'); });
    addEventListener('resize', () => { clearTimeout(rt); rt = setTimeout(() => J.todas().forEach(aplicar), 120); });
    mq.addEventListener('change', () => { mesa.classList.toggle('pilha', J.empilhado()); J.todas().forEach(aplicar); });
    mesa.classList.toggle('pilha', J.empilhado());
  };
  J.todas = () => [...mesa.querySelectorAll('.jan')];
  J.visiveis = () => J.todas().filter(w => !w.hidden);
  J.def = id => defs[id];
  J.ids = () => ordem.filter(id => !defs[id].form);
  J.aberta = id => { const w = mesa.querySelector('.jan[data-id="' + id + '"]'); return !!(w && !w.hidden); };

  function criar(id) {
    const d = defs[id], w = document.createElement('section');
    w.className = 'jan' + (d.form ? ' jan-form' : ''); w.dataset.id = id; w.dataset.tipo = d.tipo; w.setAttribute('aria-label', d.t);
    w.innerHTML = '<header class="jan-cab"><span class="jan-ico">' + ico(d.i) + '</span><b class="jan-tit"></b><span class="jan-extra"></span>' +
      '<button type="button" class="jan-bt bt-pin" data-j="pin" title="Fixar no lugar (trava o arrastar; redimensionar continua)" aria-label="Fixar janela">' + ico('pin') + '</button>' +
      '<button type="button" class="jan-bt" data-j="min" title="Recolher / abrir (ou duplo clique no título)" aria-label="Recolher janela">' + ico('menos') + '</button>' +
      '<button type="button" class="jan-bt" data-j="x" title="Fechar (reabre pelo botão Janelas)" aria-label="Fechar janela">' + ico('x') + '</button></header>' +
      '<div class="jan-corpo"></div><i class="jan-rz rz-d" data-rz="d"></i><i class="jan-rz rz-b" data-rz="b"></i><i class="jan-rz rz-c" data-rz="c"></i>';
    w.querySelector('.jan-tit').textContent = d.t;
    w.style.order = d.ordem;
    mesa.appendChild(w); aplicar(w);
    return w;
  }
  J.el = id => mesa.querySelector('.jan[data-id="' + id + '"]') || criar(id);
  J.criarTodas = () => ordem.forEach(id => { if (!defs[id].form) J.el(id); });

  function geom(id) {
    const d = defs[id], s = L[id] || {}, W = mesa.clientWidth, H = mesa.clientHeight;
    let g;
    if (s.w != null) g = { x: s.x, y: s.y, w: s.w, h: s.h };
    else if (Array.isArray(d.pos)) { const [x, y, w, h] = d.pos; g = { x: Math.round(x * W), y: Math.round(y * H), w: Math.round(w * W), h: Math.round(h * H) }; }
    else { const w = Math.min(d.pos.w, W - 16), h = Math.min(d.pos.h, H - 16); g = { x: Math.round((W - w) / 2), y: Math.max(8, Math.round((H - h) / 4)), w, h }; }
    g.w = Math.max(MINW, Math.min(g.w, W)); g.h = Math.max(MINH, Math.min(g.h, H));
    g.x = Math.min(Math.max(g.x, -(g.w - 90)), W - 90); g.y = Math.min(Math.max(g.y, 0), H - 44);
    return g;
  }
  function aplicar(w) {
    const id = w.dataset.id, s = L[id] || {};
    w.classList.toggle('fixa', !!s.pin); w.classList.toggle('recolhida', !!s.min);
    const pin = w.querySelector('.bt-pin'); pin.classList.toggle('on', !!s.pin); pin.setAttribute('aria-pressed', s.pin ? 'true' : 'false');
    visivel(w);
    if (J.empilhado()) { w.style.left = w.style.top = w.style.width = w.style.height = ''; w.style.zIndex = ''; w.style.order = defs[id].form ? -999999 : -(s.z || 0); return; }
    if (w.hidden) return;
    const g = geom(id);
    w.style.left = g.x + 'px'; w.style.top = g.y + 'px'; w.style.width = g.w + 'px'; w.style.height = s.min ? 'auto' : g.h + 'px';
    w.style.zIndex = s.z || (defs[id].form ? 50 : 1);
  }
  function visivel(w) {
    const d = defs[w.dataset.id], s = L[w.dataset.id] || {};
    w.hidden = d.form ? !w._aberta : (s.fechada != null ? !!s.fechada : !d.aberta);
  }
  J.topo = () => { let m = null; J.visiveis().forEach(w => { if (!m || (+w.style.zIndex || 0) > (+m.style.zIndex || 0)) m = w; }); return m; };
  J.frente = w => {
    J.todas().forEach(x => x.classList.toggle('foco', x === w));
    if (+w.style.zIndex === ztop && st(w.dataset.id).z === ztop) return;
    ztop++; if (!J.empilhado()) w.style.zIndex = ztop; else w.style.order = -ztop; st(w.dataset.id).z = ztop; salvar(); aoMudar();
  };
  J.abrir = (id, ctx) => {
    const w = J.el(id), d = defs[id];
    if (!d.form) st(id).fechada = false; else w._aberta = true;
    if (ctx !== undefined) w.ctx = ctx;
    st(id).min = false; aplicar(w); J.frente(w);
    aoDesenhar(w, true); aoMudar();
    if (J.empilhado()) setTimeout(() => w.scrollIntoView({ behavior: 'smooth', block: 'start' }), 30);
    const f = w.querySelector('.jan-corpo input:not([type=checkbox]):not([type=radio]),.jan-corpo select,.jan-corpo textarea');
    if (f && d.form && !J.empilhado()) setTimeout(() => f.focus(), 30);
    return w;
  };
  J.fechar = id => { const w = J.el(id); if (!defs[id].form) st(id).fechada = true; else w._aberta = false; salvar(); visivel(w); aoMudar(); };
  /* botão do menu: fechada → abre; aberta atrás de outra → traz para a frente; já na frente → fecha */
  J.alternar = id => { if (!J.aberta(id)) J.abrir(id); else if (J.topo() !== J.el(id) && !J.empilhado()) J.frente(J.el(id)); else J.fechar(id); };
  J.resetar = t => {
    ordem.forEach(id => { delete L[id]; });
    salvar(); J.todas().forEach(aplicar); J.visiveis().forEach(w => aoDesenhar(w)); aoMudar();
  };
  function alternar(w, campo) {
    const s = st(w.dataset.id);
    if (campo === 'pin') { s.pin = !s.pin; if (s.w == null) Object.assign(s, { x: w.offsetLeft, y: w.offsetTop, w: w.offsetWidth, h: w.offsetHeight }); }
    if (campo === 'min') { if (!s.min && s.w == null && !J.empilhado()) Object.assign(s, { x: w.offsetLeft, y: w.offsetTop, w: w.offsetWidth, h: w.offsetHeight }); s.min = !s.min; }
    salvar(); aplicar(w);
    if (campo === 'min' && !s.min) aoDesenhar(w);
  }
  function clicar(e) {
    const b = e.target.closest('[data-j]'); if (!b) return;
    const w = b.closest('.jan'), a = b.dataset.j;
    if (a === 'x') J.fechar(w.dataset.id); else alternar(w, a);
  }
  function apertar(e) {
    const w = e.target.closest('.jan'); if (!w) return;
    J.frente(w);
    if (J.empilhado() || e.button > 0 || e.target.closest('[data-j]')) return;
    const rz = e.target.closest('[data-rz]'), cab = e.target.closest('.jan-cab');
    if (!rz && !cab) return;
    if (!rz && (w.classList.contains('fixa') || e.target.closest('button,input,select,a'))) return;
    e.preventDefault();
    const id = w.dataset.id, r0 = { x: w.offsetLeft, y: w.offsetTop, w: w.offsetWidth, h: w.offsetHeight };
    const sx = e.clientX, sy = e.clientY, modo = rz ? rz.dataset.rz : 'mover', W = mesa.clientWidth, H = mesa.clientHeight;
    w.classList.add('movendo');
    const mover = ev => {
      const dx = ev.clientX - sx, dy = ev.clientY - sy;
      if (modo === 'mover') {
        let x = Math.min(Math.max(r0.x + dx, -(r0.w - 90)), W - 90), y = Math.min(Math.max(r0.y + dy, 0), H - 44);
        if (Math.abs(x) < 12) x = 0; if (Math.abs(W - x - r0.w) < 12) x = W - r0.w; if (Math.abs(y) < 12) y = 0; if (Math.abs(H - y - r0.h) < 12) y = H - r0.h;
        w.style.left = x + 'px'; w.style.top = y + 'px';
      } else {
        if (modo !== 'b') w.style.width = Math.max(MINW, Math.min(r0.w + dx, W - r0.x)) + 'px';
        if (modo !== 'd') w.style.height = Math.max(MINH, Math.min(r0.h + dy, H - r0.y)) + 'px';
      }
    };
    const soltar = () => {
      removeEventListener('pointermove', mover); removeEventListener('pointerup', soltar); removeEventListener('pointercancel', soltar);
      w.classList.remove('movendo');
      const s = st(id); Object.assign(s, { x: w.offsetLeft, y: w.offsetTop, w: w.offsetWidth, h: s.min ? (s.h || r0.h) : w.offsetHeight });
      salvar();
    };
    addEventListener('pointermove', mover); addEventListener('pointerup', soltar); addEventListener('pointercancel', soltar);
  }
  J.estado = id => Object.assign({}, L[id] || {});

  window.FN = window.FN || {}; window.FN.J = J; window.FN.ico = ico;
})();
