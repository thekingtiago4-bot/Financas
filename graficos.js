/* Finanças. · gráficos em SVG (sem biblioteca, funcionam sem internet). Redesenham sozinhos quando a janela muda de tamanho. */
(function () {
  const G = {}, N = () => window.FN.N;
  const obs = new ResizeObserver(es => es.forEach(e => { const el = e.target; if (el._des && el.isConnected) { cancelAnimationFrame(el._raf); el._raf = requestAnimationFrame(() => el._des()); } }));
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  function montar(el, fn) { el._des = () => { const W = el.clientWidth, H = el.clientHeight; if (W < 40 || H < 40) return; el.innerHTML = fn(W, H); }; obs.observe(el); el._des(); }
  const curtoR = c => { const v = Math.abs(c) / 100; const s = v >= 1e6 ? (v / 1e6).toFixed(1).replace('.', ',') + ' mi' : v >= 1000 ? (v / 1000).toFixed(v >= 1e4 ? 0 : 1).replace('.', ',') + ' mil' : Math.round(v) + ''; return (c < 0 ? '−' : '') + s; };
  function escala(max, min) {
    const amp = Math.max(1, max - min), passo0 = amp / 4, p10 = Math.pow(10, Math.floor(Math.log10(passo0)));
    const passo = [1, 2, 2.5, 5, 10].map(x => x * p10).find(x => x >= passo0);
    const lo = Math.floor(min / passo) * passo, hi = Math.ceil(max / passo) * passo, ticks = [];
    for (let v = lo; v <= hi + 1e-6; v += passo) ticks.push(Math.round(v));
    return { lo, hi, ticks };
  }
  /* barras agrupadas + linha opcional */
  G.barras = (el, o) => montar(el, (W, H) => {
    const todos = o.series.flatMap(s => s.v).concat(o.linha ? o.linha.v : []).filter(v => v != null);
    const e = escala(Math.max(0, ...todos), Math.min(0, ...todos));
    const ml = 46, mr = 8, mt = 10, mb = 38, w = W - ml - mr, h = H - mt - mb, n = o.rotulos.length;
    const y = v => mt + h - (v - e.lo) / (e.hi - e.lo) * h, bw = w / n, ns = o.series.length, gap = Math.max(2, bw * .18), lb = (bw - gap * 2) / ns;
    let s = '<svg viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="' + esc(o.titulo || 'gráfico') + '">';
    e.ticks.forEach(t => { s += '<line x1="' + ml + '" x2="' + (W - mr) + '" y1="' + y(t) + '" y2="' + y(t) + '" class="g-grade' + (t === 0 ? ' zero' : '') + '"/><text x="' + (ml - 6) + '" y="' + (y(t) + 4) + '" class="g-eixo" text-anchor="end">' + curtoR(t) + '</text>'; });
    o.rotulos.forEach((r, i) => {
      const x0 = ml + i * bw;
      o.series.forEach((se, j) => { const v = se.v[i]; if (v == null) return; const y1 = y(Math.max(0, v)), y2 = y(Math.min(0, v)); s += '<rect x="' + (x0 + gap + j * lb) + '" y="' + y1 + '" width="' + Math.max(1, lb - 1) + '" height="' + Math.max(1, y2 - y1) + '" rx="2" style="fill:' + se.cor + '"><title>' + esc(se.n + ' · ' + r + ': ' + N().brl(v)) + '</title></rect>'; });
      s += '<text x="' + (x0 + bw / 2) + '" y="' + (H - mb + 16) + '" class="g-eixo' + (o.destaque === i ? ' forte' : '') + '" text-anchor="middle">' + esc(r) + '</text>';
    });
    if (o.linha) {
      const pts = o.linha.v.map((v, i) => v == null ? null : [ml + i * bw + bw / 2, y(v), v, o.rotulos[i]]).filter(Boolean);
      if (pts.length > 1) s += '<polyline points="' + pts.map(p => p[0] + ',' + p[1]).join(' ') + '" class="g-linha" style="stroke:' + o.linha.cor + '"/>';
      pts.forEach(p => { s += '<circle cx="' + p[0] + '" cy="' + p[1] + '" r="3.5" style="fill:' + (p[2] < 0 ? 'var(--no)' : o.linha.cor) + '" class="g-ponto"><title>' + esc(o.linha.n + ' · ' + p[3] + ': ' + N().brl(p[2])) + '</title></circle>'; });
    }
    const leg = o.series.concat(o.linha ? [o.linha] : []);
    let lx = ml; leg.forEach(l => { s += '<rect x="' + lx + '" y="' + (H - 13) + '" width="10" height="10" rx="2" style="fill:' + l.cor + '"/><text x="' + (lx + 14) + '" y="' + (H - 4) + '" class="g-leg">' + esc(l.n) + '</text>'; lx += 24 + l.n.length * 6.6; });
    return s + '</svg>';
  });
  /* linhas (várias séries) */
  G.linhas = (el, o) => montar(el, (W, H) => {
    const todos = o.series.flatMap(s => s.v).filter(v => v != null);
    if (!todos.length) return '<p class="vazio">Sem dados ainda.</p>';
    const e = escala(Math.max(0, ...todos), Math.min(0, ...todos));
    const ml = 46, mr = 10, mt = 10, mb = 22 + Math.ceil(o.series.length / 3) * 16, w = W - ml - mr, h = H - mt - mb, n = o.rotulos.length;
    const x = i => ml + (n > 1 ? i * w / (n - 1) : w / 2), y = v => mt + h - (v - e.lo) / (e.hi - e.lo) * h;
    let s = '<svg viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="' + esc(o.titulo || 'gráfico') + '">';
    e.ticks.forEach(t => { s += '<line x1="' + ml + '" x2="' + (W - mr) + '" y1="' + y(t) + '" y2="' + y(t) + '" class="g-grade"/><text x="' + (ml - 6) + '" y="' + (y(t) + 4) + '" class="g-eixo" text-anchor="end">' + curtoR(t) + '</text>'; });
    const salto = Math.ceil(n / Math.max(1, Math.floor(w / 46)));
    o.rotulos.forEach((r, i) => { if (i % salto === 0 || i === n - 1) s += '<text x="' + x(i) + '" y="' + (mt + h + 15) + '" class="g-eixo" text-anchor="middle">' + esc(r) + '</text>'; });
    o.series.forEach(se => {
      const pts = se.v.map((v, i) => v == null ? null : [x(i), y(v), v, o.rotulos[i]]).filter(Boolean);
      if (o.area && pts.length > 1) s += '<polygon points="' + pts.map(p => p[0] + ',' + p[1]).join(' ') + ' ' + pts[pts.length - 1][0] + ',' + y(Math.max(e.lo, 0)) + ' ' + pts[0][0] + ',' + y(Math.max(e.lo, 0)) + '" style="fill:' + se.cor + ';opacity:.14"/>';
      if (pts.length > 1) s += '<polyline points="' + pts.map(p => p[0] + ',' + p[1]).join(' ') + '" class="g-linha' + (se.tracejada ? ' trac' : '') + '" style="stroke:' + se.cor + '"/>';
      pts.forEach((p, i) => { s += '<circle cx="' + p[0] + '" cy="' + p[1] + '" r="' + (i === pts.length - 1 ? 4 : 2.5) + '" style="fill:' + se.cor + '" class="g-ponto"><title>' + esc(se.n + ' · ' + p[3] + ': ' + N().brl(p[2])) + '</title></circle>'; });
    });
    let lx = ml, ly = H - mb + 34; o.series.forEach((l, i) => { if (i && i % 3 === 0) { lx = ml; ly += 16; } s += '<rect x="' + lx + '" y="' + (ly - 9) + '" width="10" height="10" rx="2" style="fill:' + l.cor + '"/><text x="' + (lx + 14) + '" y="' + ly + '" class="g-leg">' + esc(l.n.slice(0, 18)) + '</text>'; lx += Math.min(w / 3, 26 + l.n.slice(0, 18).length * 6.6); });
    return s + '</svg>';
  });
  /* rosca com legenda ao lado (ou embaixo, se estreito) */
  G.rosca = (el, itens) => montar(el, (W, H) => {
    itens = itens.filter(i => i.v > 0); const tot = itens.reduce((s, i) => s + i.v, 0);
    if (!tot) return '<p class="vazio">Nada lançado neste mês.</p>';
    const lado = W > 330, R = Math.min(lado ? H / 2 - 6 : (H - itens.length * 21 - 30) / 2, lado ? W * .28 : W / 2 - 10), r = R * .62, cx = lado ? R + 6 : W / 2, cy = R + 6;
    if (R < 20) return '<p class="vazio">Aumente a janela para ver o gráfico.</p>';
    let a = -Math.PI / 2, s = '<svg viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="Divisão dos gastos">';
    itens.forEach(i => {
      const da = i.v / tot * Math.PI * 2, a2 = a + da - (itens.length > 1 ? .012 : 0), g = da > Math.PI ? 1 : 0;
      const p = (rr, an) => (cx + rr * Math.cos(an)).toFixed(2) + ' ' + (cy + rr * Math.sin(an)).toFixed(2);
      s += itens.length === 1 ? '<circle cx="' + cx + '" cy="' + cy + '" r="' + (R + r) / 2 + '" style="stroke:' + i.cor + ';stroke-width:' + (R - r) + 'px;fill:none"/>'
        : '<path d="M' + p(R, a) + ' A' + R + ' ' + R + ' 0 ' + g + ' 1 ' + p(R, a2) + ' L' + p(r, a2) + ' A' + r + ' ' + r + ' 0 ' + g + ' 0 ' + p(r, a) + 'Z" style="fill:' + i.cor + '"><title>' + esc(i.n + ': ' + N().brl(i.v) + ' (' + Math.round(i.v / tot * 100) + '%)') + '</title></path>';
      a += da;
    });
    s += '<text x="' + cx + '" y="' + (cy - 2) + '" text-anchor="middle" class="g-centro">' + curtoR(tot) + '</text><text x="' + cx + '" y="' + (cy + 14) + '" text-anchor="middle" class="g-eixo">no mês</text>';
    const lx = lado ? cx + R + 18 : 8; let ly = lado ? Math.max(14, cy - itens.length * 11 + 8) : cy + R + 22;
    itens.forEach(i => { s += '<rect x="' + lx + '" y="' + (ly - 10) + '" width="11" height="11" rx="3" style="fill:' + i.cor + '"/><text x="' + (lx + 17) + '" y="' + ly + '" class="g-leg">' + esc(i.n) + ' <tspan class="g-val">' + esc(N().brl(i.v, true)) + ' · ' + Math.round(i.v / tot * 100) + '%</tspan></text>'; ly += 21; });
    return s + '</svg>';
  });
  G.CORES = ['var(--teal)', 'var(--aqua2)', 'var(--amar)', 'var(--ag)', 'var(--no)', 'var(--roxo)', 'var(--cinza)', 'var(--ok)'];
  window.FN = window.FN || {}; window.FN.G = G;
})();
