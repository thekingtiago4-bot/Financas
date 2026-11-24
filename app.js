/* Finanças. · telas: tudo é janela flutuante (FN.J). Dados só neste aparelho (localStorage), com cópias automáticas. */
(function () {
  'use strict';
  const VERSAO = '0.1.0';
  const N = FN.N, J = FN.J, G = FN.G, ico = FN.ico, brl = N.brl;
  const $ = (s, r = document) => r.querySelector(s), $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const ls = {
    get(k, d) { try { const v = localStorage.getItem(k); return v == null ? d : JSON.parse(v); } catch (e) { return d; } },
    set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); return true; } catch (e) { return false; } }
  };

  /* ================= estado e gravação ================= */
  let D, sel, erroGrav = false, ultimoPing = '', pendFoco = null, calDia = null, flashId = null;
  const pref = Object.assign({ tema: 'escuro', tela: 'painel', rail: true, senha: '' }, ls.get('fin:pref', {}));
  const salvarPref = () => ls.set('fin:pref', pref);
  const chat = []; let chatCtx = {};
  const calcS = { alvo: 10000000, tenho: 0, modo: 'aporte', aporte: 80000, meses: 24, taxa: 0 };

  function carregar() {
    const bruto = localStorage.getItem('fin:dados');
    if (bruto) {
      try { D = N.sanear(JSON.parse(bruto)); }
      catch (e) { try { localStorage.setItem('fin:dados-com-erro', bruto); } catch (x) { /* sem espaço */ } D = null; }
    }
    if (!D) {
      D = { cfg: N.padrao(), meses: {} };
      const k = N.hojeK(); D.meses[k] = N.criarMes(D, k, { base: 'modelo' });
      gravar();
    }
    const ks = Object.keys(D.meses).sort(), hk = N.hojeK();
    sel = D.meses[hk] ? hk : (ks.filter(k => k <= hk).pop() || ks[ks.length - 1] || hk);
  }
  function gravar() {
    erroGrav = !ls.set('fin:dados', Object.assign({ app: 'financas', salvo: Date.now() }, D));
    copiaDoDia(); statusSalvo();
  }
  function copia(motivo) {
    const l = ls.get('fin:copias', []);
    l.unshift({ t: Date.now(), motivo, d: JSON.stringify(D) });
    while (l.length > 6) l.pop();
    if (!ls.set('fin:copias', l)) ls.set('fin:copias', l.slice(0, 2));
  }
  function copiaDoDia() { const l = ls.get('fin:copias', []); if (!l.length || new Date(l[0].t).toDateString() !== new Date().toDateString()) copia('Cópia automática do dia'); }
  function statusSalvo() {
    const el = $('#salvo'); if (!el) return;
    el.classList.toggle('erro', erroGrav);
    el.querySelector('span').textContent = erroGrav ? 'Não consegui salvar! Baixe uma cópia em Ajustes.' : 'Salvo neste aparelho às ' + new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  }
  function mudou(o = {}) { gravar(); desenharTudo(); if (o.ping) ping(); }
  const M = () => D.meses[sel];
  const achar = (lista, id) => lista.find(x => x.id === id);

  /* ================= janelas ================= */
  const TELAS = [['painel', 'Painel', 'casa'], ['mes', 'Contas do mês', 'lista'], ['metas', 'Metas', 'alvo'], ['assist', 'Assistente', 'brilho'], ['ajustes', 'Ajustes', 'ajuste']];
  const CRIAR = [['f.mes', 'Novo mês', 'cal'], ['f.gasto', 'Lançar gasto', 'carteira'], ['f.conta', 'Nova conta', 'lista'], ['f.renda', 'Nova renda', 'moeda'], ['f.meta', 'Nova meta', 'alvo']];
  const JANS = [
    ['painel.resumo', 'painel', 'resumo', 'Resumo do mês', 'carteira', [.008, .015, .47, .36]],
    ['painel.alertas', 'painel', 'alertas', 'Assistente', 'brilho', [.486, .015, .25, .58]],
    ['painel.cal', 'painel', 'cal', 'Calendário', 'cal', [.744, .015, .248, .58]],
    ['painel.ano', 'painel', 'ano', 'Visão do ano', 'barras', [.008, .39, .47, .595]],
    ['painel.cats', 'painel', 'cats', 'Para onde vai o dinheiro', 'pizza', [.486, .61, .25, .375]],
    ['painel.parc', 'painel', 'parc', 'Parcelas e empréstimos', 'cartao', [.744, .61, .248, .375]],
    ['mes.contas', 'mes', 'contas', 'Contas do mês', 'lista', [.008, .015, .48, .97]],
    ['mes.rendas', 'mes', 'rendas', 'Rendas', 'moeda', [.496, .015, .245, .40]],
    ['mes.gastos', 'mes', 'gastos', 'Gastos do dia a dia', 'carteira', [.496, .43, .245, .555]],
    ['mes.cal', 'mes', 'cal', 'Calendário', 'cal', [.75, .015, .242, .55]],
    ['mes.livre', 'mes', 'livre', 'Quanto ainda posso gastar', 'alvo', [.75, .58, .242, .405]],
    ['metas.guardado', 'metas', 'guardado', 'Dinheiro guardado', 'disco', [.008, .015, .30, .97]],
    ['metas.lista', 'metas', 'metas', 'Minhas metas', 'alvo', [.316, .015, .38, .97]],
    ['metas.calc', 'metas', 'calc', 'Em quanto tempo eu chego lá?', 'calc', [.704, .015, .288, .56]],
    ['metas.evol', 'metas', 'evol', 'Evolução das metas', 'linha', [.704, .59, .288, .395]],
    ['assist.chat', 'assist', 'chat', 'Assistente', 'brilho', [.008, .015, .5, .97]],
    ['assist.tend', 'assist', 'tend', 'Tendência dos gastos', 'linha', [.518, .015, .474, .55]],
    ['assist.eco', 'assist', 'eco', 'Onde economizar', 'folha', [.518, .58, .474, .405]],
    ['ajustes.geral', 'ajustes', 'geral', 'Aparência e uso', 'ajuste', [.008, .015, .32, .55]],
    ['ajustes.dados', 'ajustes', 'dados', 'Dados e cópias', 'disco', [.008, .58, .32, .405]],
    ['ajustes.modelo', 'ajustes', 'modelo', 'Modelo do mês (contas padrão)', 'lista', [.338, .015, .34, .97]],
    ['ajustes.parc', 'ajustes', 'parcAdm', 'Parcelamentos e empréstimos', 'cartao', [.688, .015, .304, .97]],
    ['f.mes', null, 'fMes', 'Novo mês', 'cal', { w: 420, h: 520 }],
    ['f.gasto', null, 'fGasto', 'Lançar gasto', 'carteira', { w: 380, h: 440 }],
    ['f.conta', null, 'fConta', 'Nova conta', 'lista', { w: 420, h: 560 }],
    ['f.renda', null, 'fRenda', 'Nova renda', 'moeda', { w: 380, h: 420 }],
    ['f.meta', null, 'fMeta', 'Nova meta', 'alvo', { w: 460, h: 640 }]
  ].map(([id, tela, tipo, t, i, pos]) => ({ id, tela, tipo, t, i, pos }));

  function desenharJan(w, forcar) {
    if (w.hidden || w.classList.contains('recolhida')) return;
    const tipo = w.dataset.tipo; if (tipo[0] === 'f' && !forcar) return;
    const corpo = w.querySelector('.jan-corpo'), a = document.activeElement;
    const foco = a && w.contains(a) && a.dataset && a.dataset.foco, pos = foco && a.selectionStart != null ? [a.selectionStart, a.selectionEnd] : null, st = corpo.scrollTop;
    try { R[tipo](corpo, w); } catch (e) { console.error(e); corpo.innerHTML = '<p class="erro">Algo deu errado ao montar esta janela: ' + esc(e.message) + '</p>'; }
    corpo.scrollTop = st;
    if (foco) { const n = corpo.querySelector('[data-foco="' + foco + '"]'); if (n) { n.focus(); if (pos && n.setSelectionRange) try { n.setSelectionRange(pos[0], pos[1]); } catch (e) { /* campo numérico */ } } }
  }
  function desenharTudo() {
    topo(); railResumo();
    J.visiveis().forEach(w => desenharJan(w));
    if (pendFoco) { const n = $('[data-foco="' + pendFoco + '"]'); pendFoco = null; if (n) { n.focus(); n.select && n.select(); } }
  }
  const tit = (w, t) => { w.querySelector('.jan-tit').textContent = t; };
  function irTela(t) {
    if (!TELAS.some(x => x[0] === t)) t = 'painel';
    pref.tela = t; salvarPref(); fecharPop();
    J.tela(t);
    $$('[data-act="tela"]').forEach(b => { if (b.dataset.t === t) b.setAttribute('aria-current', 'page'); else b.removeAttribute('aria-current'); });
    $('.marca').removeAttribute('aria-current');
    desenharTudo();
    if (J.empilhado()) $('#mesa').scrollTop = 0;
  }

  /* ================= peças ================= */
  const kpi = (r, v, cls = '') => '<div class="kpi ' + cls + '"><small>' + esc(r) + '</small><b>' + brl(v) + '</b></div>';
  const nivel = c => (c.sobra < 0 || c.livre < 0) ? 'bad' : (c.res > 0 && c.livre < Math.max(3000, c.R * .01)) ? 'bad' : c.livre < Math.max(3000, c.R * .05) ? 'warn' : 'ok';
  const icoLvl = l => ico(l === 'ok' ? 'ok' : l === 'info' ? 'info' : 'alerta');
  const msgHTML = m => '<div class="msg ' + m.lvl + '">' + icoLvl(m.lvl) + '<div><b>' + esc(m.t) + '</b><p>' + esc(m.x) + '</p></div></div>';
  function semMes(b) {
    b.innerHTML = '<div class="vazio"><p><b>' + esc(N.nomeCurto(sel)) + '</b> ainda não foi criado.</p><button class="btn pri" data-act="abrirJan" data-id="f.mes" data-k="' + sel + '">' + ico('mais') + ' Criar ' + esc(N.nomeCurto(sel)) + '</button></div>';
  }
  function usoBar(c) {
    const tot = Math.max(c.R, c.C + c.Gv, 1), resto = Math.max(0, c.R - c.C - c.Gv), gu = Math.min(c.G, resto), met = Math.min(c.res, resto - gu);
    const seg = [['Contas', c.C, 'teal', 'var(--teal)'], ['Dia a dia', c.Gv, 'ag', 'var(--ag)'], ['Guardado', gu, 'roxo', 'var(--roxo)'], ['Metas', met, 'amar', 'var(--amar)'], ['Livre', Math.max(0, resto - gu - met), 'ok', 'var(--ok)']].filter(s => s[1] > 0);
    return '<div class="uso"><div class="bar" role="img" aria-label="Uso da renda">' + seg.map(s => '<i class="' + s[2] + '" style="width:' + (s[1] / tot * 100).toFixed(2) + '%" title="' + s[0] + ': ' + brl(s[1]) + '"></i>').join('') + '</div>' +
      '<div class="leg">' + seg.map(s => '<span><i style="background:' + s[3] + '"></i>' + s[0] + ' ' + N.pct(s[1], c.R || tot) + '%</span>').join('') + (c.sobra < 0 ? '<span class="neg"><b>Passou da renda em ' + brl(-c.sobra) + '</b></span>' : '') + '</div></div>';
  }
  function formasOpts(Mx, atual) {
    const cards = (Mx ? Mx.contas.filter(N.ehCartao).map(c => c.n) : []).filter((x, i, a) => a.indexOf(x) === i);
    const op = [['pix', 'Pix / débito'], ['din', 'Dinheiro'], ['va', 'VA (vale-alimentação)'], ['emerg', 'Emergência (tirei do guardado)']].concat(cards.map(n => ['card:' + n, 'Cartão ' + n]));
    return op.map(([v, t]) => '<option value="' + esc(v) + '"' + (v === atual ? ' selected' : '') + '>' + esc(t) + '</option>').join('');
  }
  const formaNome = f => f === 'pix' ? 'Pix/débito' : f === 'din' ? 'Dinheiro' : f === 'va' ? 'VA' : f === 'emerg' ? 'Emergência' : f.slice(5);
  const catOpts = atual => N.CATS.map(c => '<option value="' + c + '"' + (c === atual ? ' selected' : '') + '>' + N.CAT_NOME[c] + '</option>').join('');
  const chave = (nome, rot, on, extra = '') => '<label class="chave"><input type="checkbox" name="' + nome + '"' + (on ? ' checked' : '') + ' ' + extra + '><span class="trilho"></span><span class="chave-rot">' + rot + '</span></label>';
  const hojeDia = () => sel === N.hojeK() ? new Date().getDate() : 1;
  function mesesSelect(nomeM, nomeY, k) {
    const [y, m] = N.ym(k), y0 = new Date().getFullYear();
    return '<label class="rot">Mês<select class="campo" name="' + nomeM + '">' + N.MESL.map((x, i) => '<option value="' + (i + 1) + '"' + (i + 1 === m ? ' selected' : '') + '>' + x[0].toUpperCase() + x.slice(1) + '</option>').join('') + '</select></label>' +
      '<label class="rot">Ano<select class="campo" name="' + nomeY + '">' + [y0 - 1, y0, y0 + 1, y0 + 2, y0 + 3, y0 + 5, y0 + 10].concat(y < y0 - 1 || y > y0 + 10 ? [y] : []).filter((v, i, a) => a.indexOf(v) === i).sort().map(v => '<option' + (v === y ? ' selected' : '') + '>' + v + '</option>').join('') + '</select></label>';
  }
  function confirmar(b, txt) {
    if (b.dataset.sure) return true;
    b.dataset.sure = '1'; const o = b.innerHTML; b.classList.add('conf'); b.textContent = txt || 'Confirmar?';
    setTimeout(() => { if (b.isConnected) { b.innerHTML = o; b.classList.remove('conf'); delete b.dataset.sure; } }, 3000);
    return false;
  }

  /* ================= conteúdo das janelas ================= */
  const R = {};
  R.resumo = (b, w) => {
    tit(w, 'Resumo de ' + N.nomeCurto(sel));
    const c = N.calc(D, sel); if (!c) return semMes(b);
    const lv = nivel(c), restam = N.diasRestantes(sel);
    b.innerHTML = '<div class="kpis">' + kpi('Renda do mês', c.R) + kpi('Contas', c.C) + kpi('Dia a dia', c.Gv) + kpi('Sobra', c.sobra, c.sobra < 0 ? 'bad' : '') + kpi('Guardado (' + (c.Gauto ? c.pct + '%' : 'fixo') + ')', c.G) + kpi('Metas do mês', c.res) + kpi('Livre para gastar', c.livre, 'destaque ' + (lv === 'ok' ? '' : lv)) + '</div>' + usoBar(c) +
      '<p class="dica">Pagas ' + brl(c.pagas) + ' de ' + brl(c.C) + ' · faltam ' + brl(c.aPagar) + (c.VA ? ' · VA: ' + brl(c.vaSaldo) : '') + ' · Guardado total: ' + brl(N.saldoGuardado(D, sel)) + (c.Ge ? ' (saíram ' + brl(c.Ge) + ' este mês)' : '') + (sel === N.hojeK() ? ' · ' + restam + (restam > 1 ? ' dias' : ' dia') + ' para acabar o mês' : '') + (c.M.nome ? ' · “' + esc(c.M.nome) + '”' : '') + '</p>';
  };
  R.alertas = b => {
    const ms = N.analisar(D, sel);
    b.innerHTML = '<div class="msgs">' + ms.slice(0, 8).map(msgHTML).join('') + '</div><button class="btn mini" data-act="tela" data-t="assist">' + ico('brilho') + ' Conversar com o assistente</button>';
  };
  R.cal = (b, w) => {
    const k = sel, nd = N.dias(k), [y, m] = N.ym(k), ini = new Date(y, m - 1, 1).getDay(), hk = N.hojeK(), hd = new Date().getDate(), Mx = D.meses[k];
    tit(w, 'Calendário · ' + N.nomeCurto(k));
    const ev = {}; const add = (d, o) => { d = Math.min(Math.max(1, d), nd); (ev[d] = ev[d] || []).push(o); };
    if (Mx) {
      Mx.rendas.forEach(r => { if (r.dia) add(r.dia, { t: r.va ? 'va' : 'sal', n: r.n, v: r.v }); });
      Mx.contas.forEach(c => { if (c.dia && N.ativa(D, c)) add(c.dia, { t: 'ct', n: c.n, v: N.valConta(Mx, c), pago: c.pago }); });
      Mx.gastos.forEach(g => add(g.d, { t: 'gs', n: g.n, v: g.v, f: g.f }));
    }
    const est = d => (k < hk || (k === hk && d < hd)) ? 'passou' : 'falta';
    let h = '<div class="cal-top"><b>' + esc(N.nomeCurto(k)) + '</b><span class="dica">' + (k === hk ? (nd - hd ? 'faltam ' + (nd - hd) + ' dias para acabar' : 'último dia do mês') : k < hk ? 'mês encerrado' : 'mês que ainda vem') + '</span></div><div class="cal">' +
      ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map(s => '<span class="sem">' + s[0] + '</span>').join('') + '<span></span>'.repeat(ini);
    for (let d = 1; d <= nd; d++) {
      const e = ev[d] || [], mk = [];
      if (e.some(x => x.t === 'sal')) mk.push('<i class="sal">Pgto</i>');
      if (e.some(x => x.t === 'va')) mk.push('<i class="va">VA</i>');
      const cts = e.filter(x => x.t === 'ct'); if (cts.length) mk.push('<i class="ct' + (cts.every(x => x.pago) ? ' pg' : '') + '">' + cts.length + ' ct</i>');
      const gs = e.filter(x => x.t === 'gs'); if (gs.length) mk.push('<i class="gs">' + brl(N.soma(gs), true).replace('R$', '').trim() + '</i>');
      const tt = d + ' de ' + N.MESL[m - 1] + (e.length ? ': ' + e.map(x => x.n).join(', ') : '');
      h += '<button class="dia ' + est(d) + (k === hk && d === hd ? ' hoje' : '') + (calDia === d ? ' sel' : '') + '" data-act="calDia" data-d="' + d + '" title="' + esc(tt) + '" aria-label="' + esc(tt) + '"><span class="n">' + d + '</span><span class="mk">' + mk.join('') + '</span></button>';
    }
    h += '</div><div class="cal-leg"><span><em style="background:var(--okBg);border:1px solid var(--ok)"></em>Já passou</span><span><em style="background:var(--amarBg);border:1px solid var(--amar)"></em>Falta passar</span><span><em style="border:2px solid var(--teal)"></em>Hoje</span><span><i class="mk"><i class="sal">Pgto</i></i>pagamento</span><span><i class="mk"><i class="va">VA</i></i>vale</span><span><i class="mk"><i class="ct">ct</i></i>vencimento</span></div>';
    const dsel = calDia || (k === hk ? hd : null);
    if (dsel && dsel <= nd) {
      const e = ev[dsel] || [];
      h += '<div class="cal-dia"><b>' + dsel + ' de ' + N.MESL[m - 1] + '</b>' + (e.length ? '<ul>' + e.map(x => '<li><span>' + (x.t === 'sal' ? '💰 ' : x.t === 'va' ? '🍽 ' : x.t === 'ct' ? (x.pago ? '✓ ' : '• ') : '') + esc(x.n) + (x.t === 'gs' ? ' <span class="tag">' + esc(formaNome(x.f)) + '</span>' : '') + '</span><b class="num ' + (x.t === 'sal' || x.t === 'va' ? 'pos' : '') + '">' + brl(x.v) + '</b></li>').join('') + '</ul>' : '<p class="dica">Nada marcado neste dia. Coloque o dia de vencimento nas contas para elas aparecerem aqui.</p>') + '</div>';
    }
    b.innerHTML = h;
  };
  R.ano = b => {
    const y = +sel.slice(0, 4), ks = N.MES.map((_, i) => N.mk(y, i + 1)), cs = ks.map(k => N.calc(D, k));
    b.innerHTML = '<p class="dica">Renda × gastos (contas + dia a dia) em ' + y + '. A linha é o que sobrou em cada mês.</p><div class="graf"></div>';
    G.barras($('.graf', b), { titulo: 'Visão do ano', rotulos: N.MES, destaque: +sel.slice(5) - 1, series: [{ n: 'Renda', cor: 'var(--aqua2)', v: cs.map(c => c ? c.R : null) }, { n: 'Gastos', cor: 'var(--ag)', v: cs.map(c => c ? c.gastoTotal : null) }], linha: { n: 'Sobra', cor: 'var(--tinta2)', v: cs.map(c => c ? c.sobra : null) } });
  };
  R.cats = b => {
    const c = N.calc(D, sel); if (!c) return semMes(b);
    b.innerHTML = '<div class="graf"></div>';
    G.rosca($('.graf', b), Object.entries(c.porCat).sort((a, b2) => b2[1] - a[1]).map(([k, v], i) => ({ n: N.CAT_NOME[k] || k, v, cor: G.CORES[i % G.CORES.length] })));
  };
  R.parc = b => {
    const ps = D.cfg.parcelas || [];
    if (!ps.length) { b.innerHTML = '<p class="vazio">Nenhum parcelamento. Adicione em Ajustes → Parcelamentos.</p>'; return; }
    let tot = 0;
    b.innerHTML = '<div class="tab-wrap"><table><thead><tr><th>Nome</th><th class="r">Parcela</th><th>Agora</th><th>Última</th><th class="r">Falta</th></tr></thead><tbody>' + ps.map(p => {
      const n = N.numParcela(p, sel), f = N.fimParcela(p), rest = n < p.p0 ? p.tot - p.p0 + 1 : Math.max(0, p.tot - n + 1); tot += p.folha ? 0 : rest * p.v;
      return '<tr' + (p.folha ? ' class="folha" title="Descontado em folha: não entra nas contas"' : '') + '><td>' + esc(p.n) + '</td><td class="r num">' + brl(p.v) + '</td><td>' + (n >= p.p0 && n <= p.tot ? '<span class="tag t">' + n + '/' + p.tot + '</span>' : n > p.tot ? '<span class="tag">quitado</span>' : '<span class="tag">ainda não</span>') + '</td><td>' + N.curto(f) + '</td><td class="r num">' + brl(rest * p.v) + '</td></tr>';
    }).join('') + '<tr class="total"><td colspan="4">Ainda falta pagar</td><td class="r num">' + brl(tot) + '</td></tr></tbody></table></div>';
  };
  R.contas = (b, w) => {
    tit(w, 'Contas de ' + N.nomeCurto(sel));
    const c = N.calc(D, sel); if (!c) return semMes(b);
    const Mx = c.M;
    let h = '<div class="linha"><button class="btn mini pri" data-act="abrirJan" data-id="f.conta">' + ico('mais') + ' Nova conta</button><button class="btn mini" data-act="abrirJan" data-id="f.gasto">' + ico('carteira') + ' Lançar gasto</button></div>' +
      '<div class="tab-wrap"><table><thead><tr><th title="Já paga?">Paga</th><th>Descrição</th><th class="r">Dia</th><th class="r">Valor</th><th></th><th></th></tr></thead><tbody>';
    N.CATS.forEach(cat => {
      const l = Mx.contas.filter(x => x.c === cat), sub = N.soma(l.filter(x => N.ativa(D, x)), x => N.valConta(Mx, x));
      h += '<tr class="grupo"><td colspan="3">' + N.CAT_NOME[cat].toUpperCase() + '</td><td class="r num">' + brl(sub) + '</td><td colspan="2" class="r"><button class="add-linha" data-act="abrirJan" data-id="f.conta" data-cat="' + cat + '">+ adicionar</button></td></tr>';
      l.forEach(x => {
        const at = N.ativa(D, x), gc = N.ehCartao(x) ? N.gastosCartao(Mx, x.n) : 0;
        h += '<tr class="' + (x.pago ? 'pago' : '') + (at ? '' : ' folha') + (flashId === x.id ? ' flash' : '') + '"><td><input type="checkbox" class="ck" data-ch="pago" data-id="' + x.id + '"' + (x.pago ? ' checked' : '') + ' aria-label="' + esc(x.n) + ' paga"></td>' +
          '<td>' + (x.pid ? '<span class="cel nome">' + esc(x.n) + '</span>' : '<input class="cel nome" data-ch="cNome" data-id="' + x.id + '" data-foco="cn' + x.id + '" value="' + esc(x.n) + '" aria-label="Descrição">') + '</td>' +
          '<td class="r"><input class="cel dia" inputmode="numeric" data-ch="cDia" data-id="' + x.id + '" data-foco="cd' + x.id + '" value="' + (x.dia || '') + '" placeholder="–" aria-label="Dia de vencimento"></td>' +
          '<td class="r"><input class="cel val" inputmode="decimal" data-ch="cVal" data-id="' + x.id + '" data-foco="cv' + x.id + '" value="' + N.fmtIn(x.v) + '" placeholder="0,00" aria-label="Valor">' + (gc ? '<small>+ ' + brl(gc) + ' lançados = ' + brl(x.v + gc) + '</small>' : '') + '</td>' +
          '<td>' + (x.pid ? '<span class="tag t">' + x.pk + '/' + x.tot + '</span>' + (at ? '' : ' <span class="tag">em folha</span>') : x.rec === 0 ? '<span class="tag">só este mês</span>' : '') + '</td>' +
          '<td><button class="bt-x" data-act="delConta" data-id="' + x.id + '" title="Excluir deste mês" aria-label="Excluir ' + esc(x.n) + '">' + ico('x') + '</button></td></tr>';
      });
    });
    h += '<tr class="grupo"><td colspan="3">GUARDADO (DINHEIRO DA CASA)</td><td class="r num">' + brl(N.saldoGuardado(D, sel)) + '</td><td colspan="2" class="r"><button class="add-linha" data-act="tela" data-t="metas">histórico</button></td></tr>' +
      '<tr><td></td><td>Guardar este mês <span class="tag t">' + (c.Gauto ? c.pct + '% da sobra' : 'valor fixo') + '</span></td><td></td><td class="r"><input class="cel val" inputmode="decimal" data-ch="gMes" data-foco="gmes" value="' + N.fmtIn(c.G) + '" placeholder="0,00" aria-label="Guardar este mês"></td><td colspan="2">' + (c.Gauto ? '' : '<button class="add-linha" data-act="gAuto" title="Voltar a calcular pelo %">usar ' + c.pct + '%</button>') + '</td></tr>' +
      '<tr><td></td><td>Tirei do guardado (emergência)</td><td></td><td class="r num neg">' + (c.Ge ? '− ' + brl(c.Ge) : brl(0)) + '</td><td colspan="2"><button class="add-linha" data-act="abrirJan" data-id="f.gasto" data-f="emerg">+ tirar</button></td></tr>';
    b.innerHTML = h + '</tbody></table></div><div class="kpis">' + kpi('Total das contas', c.C) + kpi('Já pagas', c.pagas) + kpi('Falta pagar', c.aPagar, c.aPagar ? 'warn' : '') + '</div><p class="dica">Marque “Paga” quando pagar. Compras lançadas no cartão somam na fatura do cartão deste mês.</p>';
  };
  R.rendas = (b, w) => {
    tit(w, 'Rendas de ' + N.nomeCurto(sel));
    const c = N.calc(D, sel); if (!c) return semMes(b);
    b.innerHTML = '<div class="tab-wrap"><table><thead><tr><th>Fonte</th><th class="r">Dia</th><th class="r">Valor</th><th>VA</th><th></th></tr></thead><tbody>' + c.M.rendas.map(r =>
      '<tr><td><input class="cel nome" data-ch="rNome" data-id="' + r.id + '" data-foco="rn' + r.id + '" value="' + esc(r.n) + '" aria-label="Nome"></td><td class="r"><input class="cel dia" inputmode="numeric" data-ch="rDia" data-id="' + r.id + '" data-foco="rd' + r.id + '" value="' + (r.dia || '') + '" placeholder="–" aria-label="Dia que cai"></td>' +
      '<td class="r"><input class="cel val" inputmode="decimal" data-ch="rVal" data-id="' + r.id + '" data-foco="rv' + r.id + '" value="' + N.fmtIn(r.v) + '" placeholder="0,00" aria-label="Valor"></td><td><input type="checkbox" class="ck" data-ch="rVa" data-id="' + r.id + '"' + (r.va ? ' checked' : '') + ' title="É vale-alimentação (não entra no dinheiro livre)" aria-label="É VA"></td>' +
      '<td><button class="bt-x" data-act="delRenda" data-id="' + r.id + '" aria-label="Excluir ' + esc(r.n) + '">' + ico('x') + '</button></td></tr>').join('') +
      '<tr class="total"><td colspan="2">Renda (sem VA)</td><td class="r num">' + brl(c.R) + '</td><td colspan="2"></td></tr>' + (c.VA ? '<tr><td colspan="2" class="dica">VA</td><td class="r num">' + brl(c.VA) + '</td><td colspan="2"></td></tr>' : '') + '</tbody></table></div>' +
      '<button class="btn mini" data-act="abrirJan" data-id="f.renda">' + ico('mais') + ' Nova renda</button><p class="dica">Dia 1 cai o pagamento, dia 30 cai o VA. O VA tem saldo próprio e não entra no dinheiro livre.</p>';
  };
  function formGasto(nome, Mx, f) {
    return '<form class="secao" data-form="' + nome + '"><label class="rot">O que foi?<input class="campo" name="n" required placeholder="Ex.: Mercado, Uber, farmácia" autocomplete="off"></label>' +
      '<div class="linha"><label class="rot">Valor<input class="campo" name="v" inputmode="decimal" required placeholder="0,00" autocomplete="off"></label><label class="rot" style="flex:0 0 70px">Dia<input class="campo" name="d" inputmode="numeric" value="' + hojeDia() + '"></label></div>' +
      '<label class="rot">Como pagou?<select class="campo" name="f">' + formasOpts(Mx, f || 'pix') + '</select></label><button class="btn pri">' + ico('mais') + ' Lançar</button></form>';
  }
  R.gastos = (b, w) => {
    tit(w, 'Gastos de ' + N.nomeCurto(sel));
    const c = N.calc(D, sel); if (!c) return semMes(b);
    const l = [...c.M.gastos].sort((a, b2) => b2.d - a.d);
    b.innerHTML = formGasto('gasto', c.M) + '<div class="kpis">' + kpi('Pix / dinheiro', c.Gv) + kpi('Nos cartões', c.Gc) + kpi('No VA', c.Gva) + kpi('Emergência (do guardado)', c.Ge, c.Ge ? 'warn' : '') + '</div>' +
      (l.length ? '<div class="tab-wrap"><table><tbody>' + l.map(g => '<tr' + (flashId === g.id ? ' class="flash"' : '') + '><td class="num">' + String(g.d).padStart(2, '0') + '</td><td>' + esc(g.n) + ' <span class="tag">' + esc(formaNome(g.f)) + '</span></td><td class="r num">' + brl(g.v) + '</td><td><button class="bt-x" data-act="delGasto" data-id="' + g.id + '" aria-label="Excluir ' + esc(g.n) + '">' + ico('x') + '</button></td></tr>').join('') + '</tbody></table></div>' : '<p class="dica">Nenhum gasto lançado ainda. Cada gasto que você lança aqui o assistente já desconta do que está livre.</p>');
  };
  R.livre = b => {
    const c = N.calc(D, sel); if (!c) return semMes(b);
    const restam = N.diasRestantes(sel), lv = nivel(c), m = N.analisar(D, sel).find(x => x.id === 'livre');
    b.innerHTML = '<div class="resultado"><span class="dica">Livre para gastar em ' + esc(N.nomeCurto(sel)) + '</span><span class="grande ' + (lv === 'bad' ? 'neg' : '') + '">' + brl(c.livre) + '</span>' +
      (restam && c.livre > 0 && sel === N.hojeK() ? '<p>≈ <b>' + brl(Math.floor(c.livre / restam)) + ' por dia</b> nos ' + restam + ' dias que faltam.</p>' : '') + '</div>' + usoBar(c) +
      (m ? msgHTML(m) : '') +
      '<label class="rot">E se eu gastar…<input class="campo" data-in="simGasto" inputmode="decimal" placeholder="Ex.: 150,00" autocomplete="off"></label><div class="dica" id="sim-res"></div>';
  };
  R.guardado = b => {
    const c = N.calc(D, sel), h = N.historicoGuardado(D), saldo = N.saldoGuardado(D, sel), gu = D.cfg.guardar;
    const emerg = c ? c.M.gastos.filter(g => g.f === 'emerg') : [];
    b.innerHTML = '<div class="resultado"><span class="dica">Saldo guardado até ' + esc(N.nomeCurto(sel)) + '</span><span class="grande">' + brl(saldo) + '</span>' +
      (c ? '<p>Este mês: <b class="pos">+ ' + brl(c.G) + '</b> entrando' + (c.Ge ? ' · <b class="neg">− ' + brl(c.Ge) + '</b> saiu (emergência)' : '') + '</p>' : '') + '</div>' +
      '<div class="linha"><label class="rot">% da sobra para guardar<input class="campo" inputmode="decimal" data-ch="gPct" data-foco="gpct" value="' + String(gu.pct).replace('.', ',') + '"></label><label class="rot">Já tinha guardado antes<input class="campo" inputmode="decimal" data-ch="gIni" data-foco="gini" value="' + N.fmtIn(gu.inicial) + '" placeholder="0,00"></label></div>' +
      '<p class="dica">Sobra = renda − contas do mês. Todo mês entra esse % automaticamente (dá para trocar pelo valor certo na janela Contas). Para tirar dinheiro: lance um gasto como <b>Emergência</b>: ele sai daqui, não do salário.</p>' +
      '<div class="linha"><button class="btn mini pri" data-act="abrirJan" data-id="f.gasto" data-f="emerg">' + ico('menos') + ' Tirar do guardado</button></div>' +
      (emerg.length ? '<div class="secao"><h4>Saídas de ' + esc(N.curto(sel)) + '</h4><div class="tab-wrap"><table><tbody>' + emerg.map(g => '<tr><td class="num">' + String(g.d).padStart(2, '0') + '</td><td>' + esc(g.n) + '</td><td class="r num neg">− ' + brl(g.v) + '</td></tr>').join('') + '</tbody></table></div></div>' : '') +
      '<div class="secao"><h4>Histórico</h4><div class="tab-wrap"><table><thead><tr><th>Mês</th><th class="r">Entrou</th><th class="r">Saiu</th><th class="r">Saldo</th></tr></thead><tbody>' +
      (gu.inicial ? '<tr><td class="dica">antes</td><td class="r num">' + brl(gu.inicial) + '</td><td></td><td class="r num">' + brl(gu.inicial) + '</td></tr>' : '') +
      h.map(x => '<tr' + (x.k === sel ? ' class="total"' : '') + '><td>' + N.curto(x.k) + '</td><td class="r num pos">' + brl(x.entrou) + '</td><td class="r num ' + (x.saiu ? 'neg' : '') + '">' + (x.saiu ? '− ' + brl(x.saiu) : '–') + '</td><td class="r num">' + brl(x.saldo) + '</td></tr>').join('') + '</tbody></table></div></div>' +
      (h.length > 1 ? '<div class="graf" style="min-height:160px"></div>' : '');
    const gf = $('.graf', b); if (gf) G.linhas(gf, { titulo: 'Dinheiro guardado', area: true, rotulos: h.map(x => N.curto(x.k)), series: [{ n: 'Saldo guardado', cor: 'var(--roxo)', v: h.map(x => x.saldo) }] });
  };
  R.metas = b => {
    const ms = D.cfg.metas || [];
    b.innerHTML = '<div class="linha"><button class="btn mini pri" data-act="abrirJan" data-id="f.meta">' + ico('mais') + ' Nova meta</button></div>' + (ms.length ? '<div class="metas-lista">' + ms.map(m => {
      const g = N.guardado(m), p = Math.min(100, N.pct(g, m.alvo)), pl = N.planoMeta(m, sel), dep = N.guardadoNoMes(m, sel);
      return '<div class="meta' + (pl.feito ? ' feita' : '') + '" id="meta-' + m.id + '"><div class="meta-top"><h3>' + esc(m.n) + '</h3><div><button class="bt-x" data-act="editMeta" data-id="' + m.id + '" title="Editar" aria-label="Editar ' + esc(m.n) + '">' + ico('editar') + '</button><button class="bt-x" data-act="delMeta" data-id="' + m.id + '" title="Excluir" aria-label="Excluir ' + esc(m.n) + '">' + ico('lixo') + '</button></div></div>' +
        '<div class="bar"><i class="' + (pl.feito ? 'ok' : '') + '" style="width:' + p + '%"></i></div>' +
        '<div class="valores"><b>' + brl(g) + '</b> de ' + brl(m.alvo) + ' · <b>' + p + '%</b>' + (pl.feito ? '' : ' · faltam ' + brl(m.alvo - g)) + '</div>' +
        '<div class="plano">' + esc(pl.txt) + (m.orc && !pl.feito ? ' <span class="tag t">reservado no mês</span>' : '') + (pl.mensal && !pl.feito ? '<br>Este mês: ' + brl(dep) + ' de ' + brl(pl.mensal) + (dep >= pl.mensal ? ' ✓' : '') : '') + '</div>' +
        '<form class="linha" data-form="guardar" data-id="' + m.id + '"><input class="campo" name="v" inputmode="decimal" placeholder="Valor" aria-label="Valor" autocomplete="off"><button class="btn mini pri" name="op" value="+">Guardar</button><button class="btn mini" name="op" value="-">Retirar</button></form>' +
        ((m.h || []).length ? '<ul class="hist">' + m.h.slice(-3).reverse().map(h => '<li><span>' + esc(h.d) + (h.n ? ' · ' + esc(h.n) : '') + '</span><span class="' + (h.v < 0 ? 'neg' : 'pos') + '">' + (h.v < 0 ? '' : '+') + brl(h.v) + '</span></li>').join('') + '</ul>' : '') + '</div>';
    }).join('') + '</div>' : '<p class="vazio">Nenhuma meta ainda. Crie uma: “chegar em dezembro com R$ 5.000” ou “juntar R$ 100 mil guardando R$ 800 por mês”.</p>');
  };
  function calcTexto() {
    const s = calcS, c = N.calc(D, sel), sobra = c ? Math.max(0, c.sobra) : 0;
    if (!(s.alvo > 0)) return '<p>Diga quanto você quer juntar.</p>';
    if (s.modo === 'aporte') {
      const n = N.mesesPara(s.alvo, s.tenho, s.aporte, s.taxa);
      if (n === Infinity) return '<p>Coloque quanto quer guardar por mês.</p>';
      const bolso = s.tenho + s.aporte * n, alt = s.taxa ? null : N.mesesPara(s.alvo, s.tenho, s.aporte, 10);
      return '<span class="dica">Você chega lá em</span><span class="grande">' + N.durTxt(n) + '</span><p>Por volta de <b>' + N.curto(N.addM(N.hojeK(), n - 1)) + '</b>, guardando ' + brl(s.aporte) + ' por mês' + (s.taxa ? ' (do seu bolso ≈ ' + brl(Math.min(bolso, s.alvo)) + '; o resto vem do rendimento)' : '') + '.</p>' +
        (alt && alt !== Infinity ? '<p>Se deixar rendendo ~10% ao ano (CDB/Tesouro), cai para <b>' + N.durTxt(alt) + '</b>.</p>' : '') +
        (c ? '<p>' + (s.aporte > sobra ? '⚠ Hoje sobram só ' + brl(sobra) + ' por mês: faltariam ' + brl(s.aporte - sobra) + '.' : '✓ Cabe no que sobra hoje (' + brl(sobra) + ' por mês).') + '</p>' : '');
    }
    const n = Math.max(1, Math.round(s.meses || 1)), p = N.aporteNecessario(s.alvo, s.tenho, n, s.taxa);
    return '<span class="dica">Você precisa guardar</span><span class="grande">' + brl(p) + ' <small class="dica">por mês</small></span><p>Durante ' + N.durTxt(n) + ', até ' + N.curto(N.addM(N.hojeK(), n - 1)) + '.</p>' +
      (c ? '<p>' + (p > sobra ? '⚠ Hoje sobram só ' + brl(sobra) + ' por mês: faltariam ' + brl(p - sobra) + '.' : '✓ Cabe no que sobra hoje (' + brl(sobra) + ' por mês).') + '</p>' : '');
  }
  R.calc = b => {
    const s = calcS;
    b.innerHTML = '<form class="secao" data-form="calcMeta"><div class="linha"><label class="rot">Quero juntar<input class="campo" name="alvo" inputmode="decimal" data-in="calc" value="' + N.fmtIn(s.alvo) + '"></label><label class="rot">Já tenho<input class="campo" name="tenho" inputmode="decimal" data-in="calc" value="' + N.fmtIn(s.tenho) + '" placeholder="0,00"></label></div>' +
      '<div class="seg" role="radiogroup"><label><input type="radio" name="modo" value="aporte" data-in="calc"' + (s.modo === 'aporte' ? ' checked' : '') + '>Sei quanto guardar por mês</label><label><input type="radio" name="modo" value="prazo" data-in="calc"' + (s.modo === 'prazo' ? ' checked' : '') + '>Quero em X meses</label></div>' +
      '<div class="linha"><label class="rot"' + (s.modo === 'aporte' ? '' : ' hidden') + '>Quanto por mês?<input class="campo" name="aporte" inputmode="decimal" data-in="calc" value="' + N.fmtIn(s.aporte) + '"></label><label class="rot"' + (s.modo === 'prazo' ? '' : ' hidden') + '>Em quantos meses?<input class="campo" name="meses" inputmode="numeric" data-in="calc" value="' + s.meses + '"></label>' +
      '<label class="rot">Rendimento ao ano (%)<input class="campo" name="taxa" inputmode="decimal" data-in="calc" value="' + String(s.taxa).replace('.', ',') + '"></label></div>' +
      '<p class="dica">0% = dinheiro parado. CDB 100% do CDI / Tesouro Selic rendem perto de 10% ao ano (antes do imposto).</p>' +
      '<div class="resultado" id="calc-res">' + calcTexto() + '</div><button class="btn pri">' + ico('alvo') + ' Transformar em meta</button></form>';
  };
  R.evol = b => {
    const ms = (D.cfg.metas || []).filter(m => (m.h || []).length);
    if (!ms.length) { b.innerHTML = '<p class="vazio">Quando você guardar dinheiro nas metas, a evolução aparece aqui.</p>'; return; }
    let ini = ms.flatMap(m => m.h.map(h => h.k)).sort()[0]; const fim = sel > ini ? sel : ini;
    if (N.diffM(ini, fim) < 5) ini = N.addM(fim, -5);
    const ks = []; for (let k = ini; k <= fim; k = N.addM(k, 1)) ks.push(k);
    b.innerHTML = '<div class="graf"></div>';
    G.linhas($('.graf', b), { titulo: 'Evolução das metas', area: true, rotulos: ks.map(N.curto), series: ms.map((m, i) => ({ n: m.n, cor: G.CORES[i % G.CORES.length], v: ks.map(k => N.soma(m.h.filter(h => h.k <= k))) })) });
  };
  R.chat = (b, w) => {
    const ms = N.analisar(D, sel), nome = D.cfg.nome || '';
    b.innerHTML = '<div class="chat" id="chat-box"><div style="display:flex;gap:8px;align-items:flex-start"><span class="avatar">' + ico('brilho') + '</span><div class="bolha ele">Oi' + (nome ? ', ' + esc(nome) : '') + '! Olhei ' + esc(N.nomeCurto(sel)) + ' para você:</div></div><div class="msgs">' + ms.map(msgHTML).join('') + '</div>' +
      chat.map(m => '<div class="bolha ' + m.q + '">' + esc(m.t) + '</div>').join('') + '</div>' +
      '<div class="sugs">' + ['Quanto posso gastar?', 'Quero juntar 100 mil', 'Como estão os cartões?', 'O que falta pagar?', 'Quando acabam os empréstimos?', 'Como estão minhas metas?', 'Quanto tenho guardado?'].map(q => '<button class="sug" data-act="perg" data-q="' + esc(q) + '">' + esc(q) + '</button>').join('') + '</div>' +
      '<form class="chat-form" data-form="chat"><input class="campo" name="q" placeholder="Pergunte… ex.: juntar 20 mil em 2 anos" autocomplete="off" aria-label="Pergunta" data-foco="chat-q"><button class="btn pri" aria-label="Enviar">' + ico('enviar') + '</button></form>';
    const cb = $('#chat-box', b); cb.scrollTop = cb.scrollHeight;
  };
  R.tend = b => {
    const c = N.calc(D, sel); if (!c) return semMes(b);
    const ks = N.mesesAte(D, sel, 6), cards = [...new Set(c.M.contas.filter(N.ehCartao).map(x => x.n))];
    const linhas = cards.map(n => ({ n, v: ks.map(k => N.soma(D.meses[k].contas.filter(x => x.n === n), x => N.valConta(D.meses[k], x))) }))
      .concat([{ n: 'Dia a dia', v: ks.map(k => N.calc(D, k).Gv) }, { n: 'Total gasto', v: ks.map(k => N.calc(D, k).gastoTotal), forte: 1 }]);
    const varTxt = v => { const t = N.tendencia(v.map(x => ({ v: x }))); if (!t || !t.b) { if (v.length < 2 || !v[v.length - 2]) return '–'; const p = Math.round((v[v.length - 1] - v[v.length - 2]) / v[v.length - 2] * 100); return '<span class="' + (p > 10 ? 'neg' : p < -5 ? 'pos' : '') + '">' + (p > 0 ? '+' : '') + p + '%</span>'; } return '<span class="' + (t.pct > 15 ? 'neg' : t.pct < -5 ? 'pos' : '') + '" title="Média dos 3 últimos meses contra os anteriores">' + (t.pct > 0 ? '+' : '') + t.pct + '%</span>'; };
    b.innerHTML = '<div class="tab-wrap"><table><thead><tr><th></th>' + ks.map(k => '<th class="r">' + N.curto(k) + '</th>').join('') + '<th class="r">Tendência</th></tr></thead><tbody>' +
      linhas.map(l => '<tr' + (l.forte ? ' class="total"' : '') + '><td>' + esc(l.n) + '</td>' + l.v.map(v => '<td class="r num">' + brl(v, true) + '</td>').join('') + '<td class="r">' + varTxt(l.v) + '</td></tr>').join('') + '</tbody></table></div>' +
      (ks.length < 4 ? '<p class="dica">Com 4 meses ou mais eu comparo os últimos 3 meses com os anteriores e aviso quando um cartão está subindo.</p>' : '') + '<div class="graf"></div>';
    G.linhas($('.graf', b), { titulo: 'Gastos por cartão', rotulos: ks.map(N.curto), series: linhas.filter(l => !l.forte).map((l, i) => ({ n: l.n, cor: G.CORES[i % G.CORES.length], v: l.v })) });
  };
  R.eco = b => {
    const c = N.calc(D, sel); if (!c) return semMes(b);
    const L = c.M.contas, R0 = c.R || 1, cart = c.porCat['CARTÕES'] || 0;
    const fac = N.soma(L.filter(x => /faculdade/i.test(x.n))), net = N.soma(L.filter(x => /internet/i.test(x.n))), luz = N.soma(L.filter(x => /luz|energia/i.test(x.n)));
    const fins = (D.cfg.parcelas || []).filter(p => N.diffM(sel, N.fimParcela(p)) >= 0).sort((a, b2) => N.diffM(N.fimParcela(b2), N.fimParcela(a))).slice(0, 3).map(p => p.n + ' (' + brl(p.v) + ') termina em ' + N.curto(N.fimParcela(p)));
    const dicas = [
      ['Empréstimos e parcelas', 'Quando cada um terminar, continue “pagando” o mesmo valor, só que para uma meta. Próximos a acabar: ' + (fins.join('; ') || 'nenhum') + '. Evite pegar empréstimo novo antes desses acabarem.'],
      ['Cartões: ' + brl(cart) + ' (' + N.pct(cart, R0) + '% da renda)', 'Concentre em 1 ou 2 cartões, cancele assinaturas esquecidas e pague à vista o que puder. Cortar 20% aqui = ' + brl(cart * .2) + ' por mês.'],
      ['Faculdades: ' + brl(fac), 'Peça desconto de pontualidade, pagamento à vista, convênio com a empresa ou bolsa. 10% de desconto = ' + brl(fac * .1) + ' por mês.'],
      ['Internet fixa + móvel: ' + brl(net), 'Combos da mesma operadora (fixa + celular) costumam sair 20 a 30% mais baratos: ≈ ' + brl(net * .25) + ' por mês.'],
      ['Luz: ' + brl(luz), 'LED, banho mais curto e tirar aparelhos da tomada cortam 10 a 15%.'],
      ['Pague-se primeiro', 'No dia do pagamento (dia 1), transfira o valor das metas antes de gastar qualquer coisa.'],
      ['Regra das 48 horas', 'Quis algo que não é essencial? Espere 2 dias. Metade das vontades passa.'],
      ['Nunca o mínimo do cartão', 'O rotativo passa de 400% ao ano. Se apertar, renegocie ou parcele a fatura.']];
    b.innerHTML = '<div class="msgs">' + dicas.map(d => '<div class="msg">' + ico('folha') + '<div><b>' + esc(d[0]) + '</b><p>' + esc(d[1]) + '</p></div></div>').join('') + '</div>';
  };
  R.geral = b => {
    b.innerHTML = '<div class="secao"><h4>Você</h4><label class="rot">Seu nome (o assistente chama você assim)<input class="campo" data-ch="nome" value="' + esc(D.cfg.nome) + '" data-foco="nome"></label></div>' +
      '<div class="secao"><h4>Aparência</h4>' + chave('tema', 'Modo noturno', pref.tema === 'escuro', 'data-ch="temaChave"') + chave('rail', 'Mostrar o menu lateral', pref.rail, 'data-ch="railChave"') + '</div>' +
      '<div class="secao"><h4>Janelas flutuantes</h4><p class="dica">Arraste pelo título, redimensione pelo canto. O alfinete trava a janela no lugar (redimensionar continua). Tudo fica guardado neste aparelho.</p><div class="linha"><button class="btn mini" data-act="resetJan" data-t="' + pref.tela + '">' + ico('reset') + ' Reorganizar esta tela</button><button class="btn mini perigo" data-act="resetJan">' + ico('reset') + ' Resetar todas</button></div></div>' +
      '<div class="secao"><h4>Senha ao abrir</h4>' + (pref.senha ? '<p class="dica">Ligada neste aparelho.</p><button class="btn mini perigo" data-act="tirarSenha">' + ico('cadeado') + ' Tirar a senha</button>' :
        '<form class="linha" data-form="senha"><input class="campo" type="password" name="s1" placeholder="Nova senha" autocomplete="new-password" aria-label="Nova senha"><input class="campo" type="password" name="s2" placeholder="Repita" autocomplete="new-password" aria-label="Repita a senha"><button class="btn mini pri">' + ico('cadeado') + ' Ligar</button></form>') + '</div>' +
      '<div class="secao"><h4>Usar no iPhone</h4><p class="dica">Abra o endereço do app no <b>Safari</b> → botão <b>Compartilhar</b> → <b>Adicionar à Tela de Início</b>. Ele abre como aplicativo, em tela cheia. No PC (Chrome/Edge): ícone de instalar na barra de endereço.</p></div>' +
      '<div class="secao"><h4>Atalhos</h4><p class="dica"><kbd>Ctrl</kbd>+<kbd>L</kbd> buscar qualquer coisa · <kbd>Esc</kbd> fecha · duplo clique no título recolhe a janela · <kbd>Enter</kbd> numa célula de valor vai para a de baixo.</p></div>';
  };
  R.dados = b => {
    const cps = ls.get('fin:copias', []), salvo = ls.get('fin:dados', {}).salvo;
    b.innerHTML = '<p class="dica">Os dados ficam <b>só neste aparelho</b> (nada vai para a internet). Para levar do PC para o iPhone: <b>Baixar cópia</b> aqui e <b>Restaurar</b> lá.' + (salvo ? ' Última gravação: ' + new Date(salvo).toLocaleString('pt-BR') + '.' : '') + '</p>' +
      '<div class="linha"><button class="btn mini pri" data-act="baixar">' + ico('disco') + ' Baixar cópia (.json)</button><button class="btn mini" data-act="restaurarArq">Restaurar de arquivo</button></div><p class="dica">Também aceita o backup do Orange.</p>' +
      '<div class="secao"><h4>Cópias automáticas</h4>' + (cps.length ? '<div class="tab-wrap"><table><tbody>' + cps.map((x, i) => '<tr><td>' + new Date(x.t).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }) + '</td><td class="dica">' + esc(x.motivo) + '</td><td class="r"><button class="btn mini" data-act="voltarCopia" data-i="' + i + '">Voltar</button></td></tr>').join('') + '</tbody></table></div>' : '<p class="dica">Nenhuma ainda.</p>') + '</div>' +
      '<div class="secao"><h4>Mês aberto</h4>' + (M() ? '<button class="btn mini perigo" data-act="delMes">' + ico('lixo') + ' Excluir ' + esc(N.nomeCurto(sel)) + '</button><p class="dica">Uma cópia é feita antes.</p>' : '<p class="dica">' + esc(N.nomeCurto(sel)) + ' não existe.</p>') + '</div>';
  };
  R.modelo = b => {
    const m = D.cfg.modelo;
    let h = '<p class="dica">É o que entra quando você cria um mês “a partir do modelo” (e também na primeira vez). Contas que repetem todo mês ficam aqui.</p><div class="tab-wrap"><table><thead><tr><th>Descrição</th><th>Tipo</th><th class="r">Dia</th><th class="r">Valor</th><th></th></tr></thead><tbody>';
    h += '<tr class="grupo"><td colspan="5">RENDAS</td></tr>' + m.rendas.map((r, i) => '<tr><td><input class="cel nome" data-ch="mrNome" data-i="' + i + '" data-foco="mrn' + i + '" value="' + esc(r.n) + '" aria-label="Nome"></td><td><span class="tag">' + (r.va ? 'VA' : 'renda') + '</span></td><td class="r"><input class="cel dia" inputmode="numeric" data-ch="mrDia" data-i="' + i + '" data-foco="mrd' + i + '" value="' + (r.dia || '') + '" aria-label="Dia"></td><td class="r"><input class="cel val" inputmode="decimal" data-ch="mrVal" data-i="' + i + '" data-foco="mrv' + i + '" value="' + N.fmtIn(r.v) + '" placeholder="0,00" aria-label="Valor"></td><td><button class="bt-x" data-act="delModelo" data-q="rendas" data-i="' + i + '" aria-label="Excluir">' + ico('x') + '</button></td></tr>').join('');
    h += '<tr class="grupo"><td colspan="5">CONTAS</td></tr>' + m.contas.map((c, i) => '<tr><td><input class="cel nome" data-ch="mcNome" data-i="' + i + '" data-foco="mcn' + i + '" value="' + esc(c.n) + '" aria-label="Nome"></td><td><select class="cel" data-ch="mcCat" data-i="' + i + '" aria-label="Categoria">' + catOpts(c.c) + '</select></td><td class="r"><input class="cel dia" inputmode="numeric" data-ch="mcDia" data-i="' + i + '" data-foco="mcd' + i + '" value="' + (c.dia || '') + '" placeholder="–" aria-label="Dia"></td><td class="r"><input class="cel val" inputmode="decimal" data-ch="mcVal" data-i="' + i + '" data-foco="mcv' + i + '" value="' + N.fmtIn(c.v) + '" placeholder="0,00" aria-label="Valor"></td><td><button class="bt-x" data-act="delModelo" data-q="contas" data-i="' + i + '" aria-label="Excluir">' + ico('x') + '</button></td></tr>').join('');
    b.innerHTML = h + '</tbody></table></div><div class="linha"><button class="btn mini" data-act="addModelo" data-q="contas">' + ico('mais') + ' Conta</button><button class="btn mini" data-act="addModelo" data-q="rendas">' + ico('mais') + ' Renda</button>' + (M() ? '<button class="btn mini" data-act="modeloDoMes">Copiar de ' + esc(N.nomeCurto(sel)) + '</button>' : '') + '</div>';
  };
  R.parcAdm = b => {
    const ps = D.cfg.parcelas || [];
    b.innerHTML = '<p class="dica">Parcelas entram sozinhas em cada mês criado, com o número certo (3/15, 4/15…). “Em folha” = já descontado do salário: aparece, mas não soma nas contas.</p>' +
      ps.map(p => { const n = N.numParcela(p, sel); return '<div class="secao"><div class="linha"><label class="rot">Nome<input class="campo" data-ch="pNome" data-id="' + p.id + '" data-foco="pn' + p.id + '" value="' + esc(p.n) + '"></label><label class="rot" style="flex:0 0 110px">Parcela (R$)<input class="campo" inputmode="decimal" data-ch="pVal" data-id="' + p.id + '" data-foco="pv' + p.id + '" value="' + N.fmtIn(p.v) + '"></label></div>' +
        '<div class="linha" style="align-items:center"><span class="dica" style="flex:1 1 160px">' + (n >= p.p0 && n <= p.tot ? 'Em ' + N.curto(sel) + ': parcela ' + n + ' de ' + p.tot : n > p.tot ? 'Quitado' : 'Ainda não começou') + ' · última em ' + N.curto(N.fimParcela(p)) + '</span>' + chave('folha', 'Em folha', p.folha, 'data-ch="pFolha" data-id="' + p.id + '"') + '<button class="bt-x" data-act="delParc" data-id="' + p.id + '" title="Excluir parcelamento" aria-label="Excluir ' + esc(p.n) + '">' + ico('lixo') + '</button></div></div>'; }).join('') +
      '<form class="secao" data-form="parc"><h4>Novo parcelamento ou empréstimo</h4><label class="rot">Nome<input class="campo" name="n" required placeholder="Ex.: Empréstimo CLT IV, celular"></label><div class="linha"><label class="rot">Valor da parcela<input class="campo" name="v" inputmode="decimal" required placeholder="0,00"></label><label class="rot">Categoria<select class="campo" name="c">' + catOpts('EMPRÉSTIMOS') + '</select></label></div>' +
      '<div class="linha"><label class="rot">Parcela em ' + N.curto(sel) + '<input class="campo" name="k" inputmode="numeric" required placeholder="Ex.: 1"></label><label class="rot">Total de parcelas<input class="campo" name="tot" inputmode="numeric" required placeholder="Ex.: 18"></label><label class="rot">Dia<input class="campo" name="dia" inputmode="numeric" placeholder="–"></label></div><button class="btn pri">' + ico('mais') + ' Adicionar</button></form>';
  };

  /* ---------- formulários (janelas que abrem por cima) ---------- */
  R.fMes = (b, w) => {
    const ks = Object.keys(D.meses).sort(), ctx = w.ctx || {};
    const k = ctx.k || (ks.length ? N.addM(ks[ks.length - 1], 1) : N.hojeK());
    b.innerHTML = '<form class="secao" data-form="novoMes"><div class="linha">' + mesesSelect('m', 'y', k) + '</div>' +
      '<label class="rot">Nome (opcional)<input class="campo" name="nome" placeholder="Ex.: Fatura de dezembro, mês do 13º" maxlength="40"></label>' +
      '<div class="rot">Começar com<div class="seg"><label><input type="radio" name="base" value="anterior" checked data-in="prevMes">As contas do mês anterior</label><label><input type="radio" name="base" value="modelo" data-in="prevMes">O modelo padrão</label></div></div>' +
      chave('valores', 'Trazer os valores (desligado = tudo zerado para você preencher)', true, 'data-in="prevMes"') +
      '<div class="resultado" id="prev-mes"></div><button class="btn pri largo" id="bt-criar-mes">' + ico('mais') + ' Criar mês</button></form>';
    prevMes($('form', b));
  };
  function prevMes(f) {
    const k = N.mk(+f.y.value, +f.m.value), existe = !!D.meses[k], base = f.base.value, prev = N.mesAnterior(D, k);
    const tmp = N.criarMes(D, k, { base, valores: f.valores.checked }), cards = tmp.contas.filter(N.ehCartao).map(c => c.n), parc = tmp.contas.filter(c => c.pid).length;
    const tot = N.soma(tmp.contas, c => c.v), ren = N.soma(tmp.rendas.filter(r => !r.va));
    $('#prev-mes').innerHTML = existe ? '<p><b>' + esc(N.nomeCurto(k)) + ' já existe.</b> O botão abaixo só vai até ele.</p>' :
      '<p><b>' + esc(N.nomeCurto(k)) + '</b> ' + (base === 'anterior' && prev ? 'copiando ' + esc(N.nomeCurto(prev)) : 'a partir do modelo') + ':</p><p>' + tmp.rendas.length + ' rendas · ' + (tmp.contas.length - parc) + ' contas · ' + parc + ' parcelas (entram sozinhas)</p><p>Cartões: ' + esc(cards.join(', ') || 'nenhum') + '</p>' + (f.valores.checked ? '<p>Renda ' + brl(ren) + ' · contas ' + brl(tot) + '</p>' : '<p>Valores zerados (parcelas mantêm o valor).</p>');
    $('#bt-criar-mes').innerHTML = existe ? 'Ir para ' + esc(N.nomeCurto(k)) : ico('mais') + ' Criar ' + esc(N.nomeCurto(k));
  }
  R.fGasto = b => {
    if (!M()) return semMes(b);
    b.innerHTML = '<p class="dica">Em ' + esc(N.nomeCurto(sel)) + '. A janela fica aberta para lançar vários seguidos.</p>' + formGasto('gastoF', M(), (J.el('f.gasto').ctx || {}).f);
  };
  R.fConta = (b, w) => {
    if (!M()) return semMes(b);
    const ctx = w.ctx || {};
    b.innerHTML = '<form class="secao" data-form="conta"><p class="dica">Em ' + esc(N.nomeCurto(sel)) + '.</p><label class="rot">Descrição<input class="campo" name="n" required placeholder="Ex.: Academia, IPVA, presente" maxlength="80"></label>' +
      '<div class="linha"><label class="rot">Categoria<select class="campo" name="c">' + catOpts(ctx.cat || 'DIVERSOS') + '</select></label><label class="rot">Valor<input class="campo" name="v" inputmode="decimal" required placeholder="0,00"></label></div>' +
      '<label class="rot">Dia do vencimento (opcional)<input class="campo" name="dia" inputmode="numeric" placeholder="Ex.: 10"></label>' +
      '<div class="rot">Tipo<div class="seg"><label><input type="radio" name="t" value="rec" checked data-in="tipoConta">Todo mês</label><label><input type="radio" name="t" value="uma" data-in="tipoConta">Só neste mês</label><label><input type="radio" name="t" value="parc" data-in="tipoConta">Parcelada</label></div></div>' +
      '<div class="linha" id="fc-parc" hidden><label class="rot">Parcela atual<input class="campo" name="k" inputmode="numeric" placeholder="Ex.: 3"></label><label class="rot">De quantas?<input class="campo" name="tot" inputmode="numeric" placeholder="Ex.: 12"></label></div>' +
      '<div id="fc-mod">' + chave('mod', 'Colocar também no modelo (próximos meses)', true) + '</div>' +
      '<button class="btn pri largo">' + ico('mais') + ' Adicionar conta</button></form>';
  };
  R.fRenda = b => {
    if (!M()) return semMes(b);
    b.innerHTML = '<form class="secao" data-form="renda"><p class="dica">Em ' + esc(N.nomeCurto(sel)) + '.</p><label class="rot">Nome<input class="campo" name="n" required placeholder="Ex.: Salário, extra, 13º" maxlength="80"></label>' +
      '<div class="linha"><label class="rot">Valor<input class="campo" name="v" inputmode="decimal" required placeholder="0,00"></label><label class="rot" style="flex:0 0 90px">Dia<input class="campo" name="dia" inputmode="numeric" placeholder="1"></label></div>' +
      chave('va', 'É vale-alimentação (VA)', false) + chave('rec', 'Repete todo mês', true) + '<button class="btn pri largo">' + ico('mais') + ' Adicionar renda</button></form>';
  };
  R.fMeta = (b, w) => {
    const ctx = w.ctx || {}, m = ctx.id ? achar(D.cfg.metas, ctx.id) : null, v = m || ctx;
    tit(w, m ? 'Editar meta' : 'Nova meta');
    const modo = v.modo || 'prazo', prazo = N.validoK(v.prazo) ? v.prazo : N.mk(new Date().getFullYear(), 12);
    b.innerHTML = '<form class="secao" data-form="meta" data-id="' + (m ? m.id : '') + '"><label class="rot">Nome da meta<input class="campo" name="n" required value="' + esc(v.n || '') + '" placeholder="Ex.: Chegar em dezembro com dinheiro, Carro, Viagem" maxlength="60"></label>' +
      '<div class="linha"><label class="rot">Valor que quero ter<input class="campo" name="alvo" inputmode="decimal" required data-in="prevMeta" value="' + N.fmtIn(v.alvo || 0) + '" placeholder="0,00"></label>' + (m ? '' : '<label class="rot">Já tenho guardado<input class="campo" name="tenho" inputmode="decimal" data-in="prevMeta" value="' + N.fmtIn(v.tenho || 0) + '" placeholder="0,00"></label>') + '</div>' +
      '<div class="rot">Como você quer chegar lá?<div class="seg"><label><input type="radio" name="modo" value="prazo" data-in="prevMeta"' + (modo === 'prazo' ? ' checked' : '') + '>Até uma data</label><label><input type="radio" name="modo" value="aporte" data-in="prevMeta"' + (modo === 'aporte' ? ' checked' : '') + '>Guardando X por mês</label></div></div>' +
      '<div class="linha" data-modo="prazo"' + (modo === 'prazo' ? '' : ' hidden') + '>' + mesesSelect('pm', 'py', prazo).replace(/<select /g, '<select data-in="prevMeta" ') + '</div>' +
      '<div class="linha" data-modo="aporte"' + (modo === 'aporte' ? '' : ' hidden') + '><label class="rot">Quanto por mês?<input class="campo" name="aporte" inputmode="decimal" data-in="prevMeta" value="' + N.fmtIn(v.aporte || 0) + '" placeholder="Ex.: 800,00"></label></div>' +
      '<label class="rot">Rendimento ao ano (%) — opcional<input class="campo" name="taxa" inputmode="decimal" data-in="prevMeta" value="' + String(v.taxa || 0).replace('.', ',') + '"></label>' +
      chave('orc', 'Separar esse valor todo mês (o assistente avisa quando você começar a gastar o dinheiro da meta)', v.orc !== false && (m ? m.orc : true)) +
      '<div class="resultado" id="prev-meta"></div><button class="btn pri largo">' + ico('alvo') + (m ? ' Salvar meta' : ' Criar meta') + '</button></form>';
    prevMeta($('form', b));
  };
  function lerMeta(f) {
    const modo = f.modo.value, m = f.dataset.id ? achar(D.cfg.metas, f.dataset.id) : null;
    return { n: f.n.value.trim(), alvo: N.cent(f.alvo.value) || 0, tenho: m ? N.guardado(m) : (N.cent(f.tenho.value) || 0), modo, prazo: N.mk(+f.py.value, +f.pm.value), aporte: N.cent(f.aporte.value) || 0, taxa: parseFloat(String(f.taxa.value).replace(',', '.')) || 0, orc: f.orc.checked };
  }
  function prevMeta(f) {
    const v = lerMeta(f), k = N.hojeK();
    $$('[data-modo]', f).forEach(x => { x.hidden = x.dataset.modo !== v.modo; });
    let h;
    if (!v.alvo) h = '<p>Diga quanto você quer ter.</p>';
    else if (v.modo === 'prazo') {
      const n = N.diffM(k, v.prazo) + 1;
      h = n <= 0 ? '<p>Escolha uma data a partir de ' + N.curto(k) + '.</p>' : '<span class="dica">Para chegar em ' + N.curto(v.prazo) + ' com ' + brl(v.alvo) + '</span><span class="grande">' + brl(N.aporteNecessario(v.alvo, v.tenho, n, v.taxa)) + ' <small class="dica">por mês</small></span><p>' + n + (n > 1 ? ' meses' : ' mês') + ', contando este.</p>';
    } else {
      const n = N.mesesPara(v.alvo, v.tenho, v.aporte, v.taxa);
      h = n === Infinity ? '<p>Quanto por mês você quer guardar? Eu digo em quanto tempo chega.</p>' : '<span class="dica">Guardando ' + brl(v.aporte) + ' por mês você chega em</span><span class="grande">' + N.durTxt(n) + '</span><p>Por volta de ' + N.curto(N.addM(k, n - 1)) + '.</p>';
    }
    const c = N.calc(D, sel); if (c && v.alvo) h += '<p class="dica">Hoje sobram ' + brl(Math.max(0, c.sobra)) + ' por mês em ' + N.curto(sel) + '.</p>';
    $('#prev-meta').innerHTML = h;
  }

  /* ================= barra superior e trilho ================= */
  function topo() {
    const Mx = M(), c0 = N.calc(D, sel);
    $('#mes-lbl').innerHTML = '<span>' + esc(N.nomeCurto(sel)) + (Mx && Mx.nome ? '<small>' + esc(Mx.nome) + '</small>' : !Mx ? '<small>não criado</small>' : '') + '</span>' + ico('baixo');
    $('#metas-topo').innerHTML = '<button class="meta-chip guard" data-act="verGuardado" title="Dinheiro guardado (acumulado)"><div class="l1"><span>Guardado</span><b>' + brl(N.saldoGuardado(D, sel), true) + '</b></div><div class="dica" style="font-size:.7rem;line-height:1.2">' + (c0 ? '+' + brl(c0.G, true) + (c0.Ge ? ' · −' + brl(c0.Ge, true) : '') + ' este mês' : '') + '</div></button>' + (D.cfg.metas || []).map(m => { const p = Math.min(100, N.pct(N.guardado(m), m.alvo)); return '<button class="meta-chip" data-act="verMeta" data-id="' + m.id + '" title="' + esc(m.n + ': ' + brl(N.guardado(m)) + ' de ' + brl(m.alvo)) + '"><div class="l1"><span>' + esc(m.n) + '</span><b>' + p + '%</b></div><div class="bar"><i class="' + (p >= 100 ? 'ok' : '') + '" style="width:' + p + '%"></i></div></button>'; }).join('') +
      '<button class="meta-chip add" data-act="abrirJan" data-id="f.meta">' + ico('mais') + ' Meta</button>';
    const c = N.calc(D, sel), cl = $('#chip-livre');
    if (c) { cl.hidden = false; cl.className = 'chip-livre ' + nivel(c); cl.innerHTML = '<span class="rot-l">Livre </span><b>' + brl(c.livre) + '</b>'; } else cl.hidden = true;
    $('#bt-tema').innerHTML = ico(pref.tema === 'escuro' ? 'sol' : 'lua');
    $('#bt-tema').title = pref.tema === 'escuro' ? 'Modo dia' : 'Modo noturno';
  }
  function railResumo() {
    const c = N.calc(D, sel), dd = (t, v, cls) => '<dt>' + t + '</dt><dd class="' + (cls || '') + '">' + v + '</dd>';
    $('#resumo').innerHTML = c ? dd('Mês', esc(N.curto(sel))) + dd('Renda', brl(c.R, true)) + dd('Contas', brl(c.gastoTotal, true)) + dd('Guardar/mês', brl(c.G, true)) + dd('Guardado', brl(N.saldoGuardado(D, sel), true)) + dd('Metas/mês', brl(c.res, true)) + dd('Livre', brl(c.livre, true), c.livre < 0 ? 'neg' : 'pos') : dd('Mês', esc(N.curto(sel)) + ' (não criado)');
  }
  function montarNav() {
    const bt = ([t, n, i]) => '<button data-act="tela" data-t="' + t + '">' + ico(i) + '<span>' + n + '</span></button>';
    const tl = Object.fromEntries(TELAS.map(x => [x[0], x]));
    $('#nav').innerHTML = '<div class="nav-grupo">Visão</div>' + bt(tl.painel) + bt(tl.mes) + '<div class="nav-grupo">Planejar</div>' + bt(tl.metas) + bt(tl.assist) +
      '<div class="nav-grupo">Criar</div>' + CRIAR.map(([id, n, i]) => '<button class="criar" data-act="abrirJan" data-id="' + id + '">' + ico(i) + '<span>' + n + '</span></button>').join('') +
      '<div class="nav-grupo">Ajustes</div>' + bt(tl.ajustes) + '<button data-act="buscar">' + ico('busca') + '<span>Buscar</span><kbd>Ctrl L</kbd></button>';
    $('#abas-cel').innerHTML = bt(tl.painel) + bt(tl.mes) + '<button class="mais" data-act="menuCriar" aria-label="Criar">' + ico('mais') + '</button>' + bt(tl.metas) + bt(tl.assist) + bt(tl.ajustes).replace('Ajustes', 'Ajustes');
    $('#abas-cel').querySelectorAll('span').forEach(s => { if (s.textContent === 'Contas do mês') s.textContent = 'Mês'; });
    $$('.mes-nav .btn-ico')[0].innerHTML = ico('esq'); $$('.mes-nav .btn-ico')[1].innerHTML = ico('dir');
    $('#bt-buscar').innerHTML = ico('busca') + '<span class="txt">Buscar</span><kbd>Ctrl L</kbd>';
    $('#bt-janelas').innerHTML = ico('janelas'); $('#busca-ico').innerHTML = ico('busca');
    $('#versao').textContent = 'versão ' + VERSAO;
  }
  function aplicarTema() { document.documentElement.setAttribute('data-tema', pref.tema === 'claro' ? 'claro' : 'escuro'); const m = $('meta[name=theme-color]'); if (m) m.content = pref.tema === 'claro' ? '#0F4B55' : '#051619'; }
  function aplicarRail() { $('#app').classList.toggle('sem-rail', !pref.rail); $('#bt-rail').textContent = pref.rail ? '‹' : '›'; $('#bt-rail').style.left = pref.rail ? '' : '0px'; setTimeout(() => J.todas().forEach(w => { if (!w.hidden) w.style.left = w.style.left; }), 0); }

  /* ================= menus (mês, janelas, criar) ================= */
  function abrirPop(html, ancora) {
    const p = $('#pop'); p.innerHTML = html; p.hidden = false;
    const r = ancora.getBoundingClientRect(), W = innerWidth, H = innerHeight;
    p.style.left = Math.max(8, Math.min(r.left, W - p.offsetWidth - 8)) + 'px';
    const cima = r.bottom + p.offsetHeight > H - 8; p.style.top = (cima ? Math.max(8, r.top - p.offsetHeight - 6) : r.bottom + 6) + 'px';
    const f = p.querySelector('button.on') || p.querySelector('button'); if (f) f.focus({ preventScroll: true });
  }
  function fecharPop() { $('#pop').hidden = true; }
  function menuMes(a) {
    const anos = [...new Set(Object.keys(D.meses).map(k => +k.slice(0, 4)).concat([+sel.slice(0, 4)]))].sort();
    abrirPop(anos.map(y => '<h5>' + y + '</h5><div class="anos-grade">' + N.MES.map((m, i) => { const k = N.mk(y, i + 1); return '<button class="' + (k === sel ? 'on' : '') + (D.meses[k] ? '' : ' vazio') + '" data-act="irMes" data-k="' + k + '" title="' + (D.meses[k] ? N.nomeCurto(k) : N.nomeCurto(k) + ' (não criado)') + '">' + m + '</button>'; }).join('') + '</div>').join('') +
      '<hr><button data-act="irMes" data-k="' + N.hojeK() + '">' + ico('cal') + ' Mês atual</button><button data-act="abrirJan" data-id="f.mes">' + ico('mais') + ' Criar mês…</button>', a);
  }
  function menuJanelas(a) {
    const ids = J.porTela(pref.tela);
    abrirPop('<h5>Janelas desta tela</h5>' + ids.map(id => '<button data-act="alternarJan" data-id="' + id + '">' + ico(J.def(id).i) + ' ' + esc(J.def(id).t) + (J.aberta(id) ? '<span class="marca-ok">' + ico('ok') + '</span>' : '') + '</button>').join('') +
      '<hr><button data-act="resetJan" data-t="' + pref.tela + '">' + ico('reset') + ' Reorganizar esta tela</button><button data-act="destravarTodas">' + ico('pin') + ' Destravar todas</button>', a);
  }
  function menuCriar(a) { abrirPop('<h5>Criar</h5>' + CRIAR.map(([id, n, i]) => '<button data-act="abrirJan" data-id="' + id + '">' + ico(i) + ' ' + n + '</button>').join('') + '<hr><button data-act="buscar">' + ico('busca') + ' Buscar</button>', a); }

  /* ================= busca (Ctrl+L) ================= */
  let bRes = [], bSel = 0;
  function indice() {
    const it = [], add = (g, i, t, s, fn) => it.push({ g, i, t, s: s || '', fn, q: N.norm(t + ' ' + (s || '')) });
    CRIAR.forEach(([id, n, i]) => add('Ações', i, n, '', () => abrirJan(id)));
    add('Ações', pref.tema === 'escuro' ? 'sol' : 'lua', pref.tema === 'escuro' ? 'Modo dia' : 'Modo noturno', 'tema', () => ACT.tema());
    add('Ações', 'reset', 'Reorganizar janelas desta tela', '', () => J.resetar(pref.tela));
    add('Ações', 'disco', 'Baixar cópia dos dados', 'backup', () => ACT.baixar());
    add('Ações', 'disco', 'Dinheiro guardado', brl(N.saldoGuardado(D, sel)) + ' · histórico', () => ACT.verGuardado());
    add('Ações', 'menos', 'Tirar do guardado (emergência)', '', () => abrirJan('f.gasto', { f: 'emerg' }));
    TELAS.forEach(([t, n, i]) => add('Telas', i, n, 'tela', () => irTela(t)));
    JANS.filter(d => d.tela).forEach(d => add('Janelas', d.i, d.t, TELAS.find(x => x[0] === d.tela)[1], () => { irTela(d.tela); J.abrir(d.id); }));
    Object.keys(D.meses).sort().reverse().forEach(k => add('Meses', 'cal', N.nomeCurto(k), D.meses[k].nome, () => irMes(k)));
    (D.cfg.metas || []).forEach(m => add('Metas', 'alvo', m.n, brl(N.guardado(m)) + ' de ' + brl(m.alvo), () => verMeta(m.id)));
    (D.cfg.parcelas || []).forEach(p => add('Parcelamentos', 'cartao', p.n, brl(p.v) + ' · até ' + N.curto(N.fimParcela(p)), () => { irTela('ajustes'); J.abrir('ajustes.parc'); }));
    Object.keys(D.meses).sort().reverse().forEach(k => {
      const Mx = D.meses[k];
      Mx.contas.forEach(c => add('Contas', 'lista', c.n, N.curto(k) + ' · ' + brl(N.valConta(Mx, c)) + (c.pago ? ' · paga' : ''), () => { irMes(k); irTela('mes'); flash(c.id); }));
      Mx.gastos.forEach(g => add('Gastos', 'carteira', g.n, String(g.d).padStart(2, '0') + '/' + N.curto(k) + ' · ' + brl(g.v), () => { irMes(k); irTela('mes'); J.abrir('mes.gastos'); flash(g.id); }));
      Mx.rendas.forEach(r => add('Rendas', 'moeda', r.n, N.curto(k) + ' · ' + brl(r.v), () => { irMes(k); irTela('mes'); J.abrir('mes.rendas'); }));
    });
    return it;
  }
  let IDX = [];
  function buscar() { IDX = indice(); $('#busca').hidden = false; const q = $('#busca-q'); q.value = ''; filtrar(); q.focus(); }
  function fecharBusca() { $('#busca').hidden = true; }
  function filtrar() {
    const q = N.norm($('#busca-q').value).trim(), ps = q.split(/\s+/).filter(Boolean);
    bRes = (ps.length ? IDX.filter(x => ps.every(p => x.q.includes(p))) : IDX.filter(x => x.g === 'Ações' || x.g === 'Telas' || (x.g === 'Meses'))).slice(0, 60);
    bSel = 0; let g = '';
    $('#busca-res').innerHTML = bRes.length ? bRes.map((x, i) => (x.g !== g ? '<li class="grp">' + (g = x.g) + '</li>' : '') + '<li class="it' + (i === bSel ? ' sel' : '') + '" data-i="' + i + '" role="option">' + ico(x.i) + '<span>' + esc(x.t) + '</span><small>' + esc(x.s) + '</small></li>').join('') : '<li class="grp">Nada encontrado</li>';
  }
  function moverSel(d) { if (!bRes.length) return; bSel = (bSel + d + bRes.length) % bRes.length; $$('#busca-res .it').forEach(li => li.classList.toggle('sel', +li.dataset.i === bSel)); const s = $('#busca-res .sel'); if (s) s.scrollIntoView({ block: 'nearest' }); }
  function escolher(i) { const x = bRes[i]; if (!x) return; fecharBusca(); x.fn(); }
  function flash(id) { flashId = id; desenharTudo(); setTimeout(() => { const r = $('tr.flash'); if (r) r.scrollIntoView({ block: 'center', behavior: 'smooth' }); flashId = null; }, 60); }

  /* ================= avisos do assistente ================= */
  function aviso(t, x, lvl = 'ok', tempo) {
    const el = document.createElement('div'); el.className = 'aviso ' + (lvl === 'bad' || lvl === 'warn' ? lvl : '');
    el.innerHTML = '<span class="avatar">' + ico('brilho') + '</span><div><b>' + esc(t) + '</b>' + (x ? '<div>' + esc(x) + '</div>' : '') + '</div><button class="fx" aria-label="Fechar aviso">' + ico('x') + '</button>';
    el.querySelector('.fx').onclick = () => el.remove();
    const av = $('#avisos'); av.appendChild(el); while (av.children.length > 3) av.firstChild.remove();
    setTimeout(() => el.remove(), tempo || (lvl === 'bad' ? 12000 : 7000));
  }
  function ping() {
    const c = N.calc(D, sel); if (!c || !c.R) return;
    const m = N.analisar(D, sel).find(x => x.id === 'livre'); if (!m) return;
    const k = m.lvl + '|' + c.livre; if (k === ultimoPing) return; ultimoPing = k;
    aviso(m.t, m.x, m.lvl);
  }

  /* ================= ações ================= */
  function abrirJan(id, ctx) { fecharPop(); const d = J.def(id); if (d.tela && d.tela !== pref.tela) irTela(d.tela); J.abrir(id, ctx); }
  function irMes(k) { sel = k; calDia = null; fecharPop(); desenharTudo(); }
  function verMeta(id) { irTela('metas'); J.abrir('metas.lista'); setTimeout(() => { const e = document.getElementById('meta-' + id); if (e) { e.scrollIntoView({ block: 'center', behavior: 'smooth' }); e.style.outline = '2px solid var(--teal)'; setTimeout(() => { e.style.outline = ''; }, 1600); } }, 50); }
  const ACT = {
    tela: b => irTela(b.dataset.t),
    abrirJan: b => abrirJan(b.dataset.id, b.dataset.k ? { k: b.dataset.k } : b.dataset.cat ? { cat: b.dataset.cat } : b.dataset.f ? { f: b.dataset.f } : {}),
    alternarJan: b => { J.alternarAberta(b.dataset.id); menuJanelas($('#bt-janelas')); if (J.aberta(b.dataset.id)) desenharJan(J.el(b.dataset.id)); },
    resetJan: b => { fecharPop(); J.resetar(b.dataset.t || null); aviso(b.dataset.t ? 'Janelas desta tela reorganizadas' : 'Todas as janelas voltaram ao padrão', '', 'ok', 3000); },
    destravarTodas: () => { fecharPop(); J.porTela(pref.tela).forEach(id => { const w = J.el(id); if (w.classList.contains('fixa')) w.querySelector('.bt-pin').click(); }); },
    menuMes: b => $('#pop').hidden ? menuMes(b) : fecharPop(),
    menuJanelas: b => $('#pop').hidden ? menuJanelas(b) : fecharPop(),
    menuCriar: b => $('#pop').hidden ? menuCriar(b) : fecharPop(),
    irMes: b => irMes(b.dataset.k),
    mesAnt: () => irMes(N.addM(sel, -1)),
    mesProx: () => irMes(N.addM(sel, 1)),
    buscar: () => { fecharPop(); buscar(); },
    tema: () => { pref.tema = pref.tema === 'escuro' ? 'claro' : 'escuro'; salvarPref(); aplicarTema(); desenharTudo(); },
    rail: () => { pref.rail = !pref.rail; salvarPref(); aplicarRail(); },
    calDia: b => { const d = +b.dataset.d; calDia = calDia === d ? null : d; J.visiveis().filter(w => w.dataset.tipo === 'cal').forEach(w => desenharJan(w)); },
    verMeta: b => verMeta(b.dataset.id),
    verGuardado: () => { irTela('metas'); J.abrir('metas.guardado'); },
    gAuto: () => { M().guardar = null; mudou({ ping: true }); },
    perg: b => perguntar(b.dataset.q),
    delConta: b => { if (!confirmar(b, 'Excluir?')) return; M().contas = M().contas.filter(x => x.id !== b.dataset.id); mudou({ ping: true }); },
    delRenda: b => { if (!confirmar(b, 'Excluir?')) return; M().rendas = M().rendas.filter(x => x.id !== b.dataset.id); mudou({ ping: true }); },
    delGasto: b => { if (!confirmar(b, 'Excluir?')) return; M().gastos = M().gastos.filter(x => x.id !== b.dataset.id); mudou({ ping: true }); },
    editMeta: b => abrirJan('f.meta', { id: b.dataset.id }),
    delMeta: b => { if (!confirmar(b, 'Excluir?')) return; copia('Antes de excluir meta'); D.cfg.metas = D.cfg.metas.filter(m => m.id !== b.dataset.id); mudou(); },
    delParc: b => {
      if (!confirmar(b, 'Excluir?')) return; copia('Antes de excluir parcelamento');
      const id = b.dataset.id, hk = N.hojeK();
      D.cfg.parcelas = D.cfg.parcelas.filter(p => p.id !== id);
      Object.values(D.meses).forEach(Mx => { if (Mx.k >= hk) Mx.contas = Mx.contas.filter(c => c.pid !== id); else Mx.contas.forEach(c => { if (c.pid === id) { delete c.pid; c.rec = 0; } }); });
      mudou();
    },
    addModelo: b => { const q = b.dataset.q; D.cfg.modelo[q].push(q === 'contas' ? { c: 'DIVERSOS', n: 'Nova conta', v: 0, dia: 0 } : { n: 'Nova renda', v: 0, dia: 1 }); mudou(); const l = D.cfg.modelo[q].length - 1; pendFoco = (q === 'contas' ? 'mcn' : 'mrn') + l; desenharTudo(); },
    delModelo: b => { if (!confirmar(b, 'Excluir?')) return; D.cfg.modelo[b.dataset.q].splice(+b.dataset.i, 1); mudou(); },
    modeloDoMes: b => { if (!confirmar(b, 'Trocar o modelo?')) return; copia('Antes de trocar o modelo'); const Mx = M(); D.cfg.modelo = { rendas: Mx.rendas.filter(r => r.rec !== 0).map(r => ({ n: r.n, v: r.v, dia: r.dia, va: r.va })), contas: Mx.contas.filter(c => !c.pid && c.rec !== 0).map(c => ({ c: c.c, n: c.n, v: c.v, dia: c.dia })) }; mudou(); aviso('Modelo atualizado', 'Os próximos meses criados “a partir do modelo” vão usar as contas de ' + N.nomeCurto(sel) + '.', 'ok'); },
    tirarSenha: b => { if (!confirmar(b, 'Tirar a senha?')) return; pref.senha = ''; salvarPref(); desenharTudo(); },
    baixar: () => {
      const blob = new Blob([JSON.stringify({ app: 'financas', versao: VERSAO, data: new Date().toISOString(), dados: D }, null, 1)], { type: 'application/json' });
      const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'financas-copia-' + new Date().toISOString().slice(0, 10) + '.json';
      document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 4000);
      aviso('Cópia baixada', 'Guarde o arquivo. Para usar em outro aparelho: Ajustes → Restaurar de arquivo.', 'ok');
    },
    restaurarArq: () => $('#arq').click(),
    voltarCopia: b => {
      if (!confirmar(b, 'Voltar a esta?')) return;
      const x = ls.get('fin:copias', [])[+b.dataset.i]; if (!x) return;
      try { const nd = N.sanear(JSON.parse(x.d)); copia('Antes de voltar uma cópia'); D = nd; if (!D.meses[sel]) sel = Object.keys(D.meses).sort().pop() || sel; mudou(); aviso('Dados voltaram para ' + new Date(x.t).toLocaleString('pt-BR'), '', 'ok'); }
      catch (e) { aviso('Essa cópia está com defeito', e.message, 'bad'); }
    },
    delMes: b => { if (!confirmar(b, 'Excluir o mês todo?')) return; copia('Antes de excluir ' + N.nomeCurto(sel)); delete D.meses[sel]; mudou(); aviso(N.nomeCurto(sel) + ' excluído', 'Se foi sem querer: Ajustes → Cópias automáticas → Voltar.', 'warn'); }
  };

  /* mudanças em células e chaves */
  const valOk = (el, v) => { if (isNaN(v) || v < 0) { el.classList.add('erro'); aviso('Valor não entendido', 'Use números, ex.: 1.234,56', 'warn', 4000); desenharTudo(); return false; } return true; };
  const dia = el => Math.min(31, Math.max(0, parseInt(el.value, 10) || 0));
  const CH = {
    pago: el => { achar(M().contas, el.dataset.id).pago = el.checked; mudou(); },
    cNome: el => { const x = achar(M().contas, el.dataset.id), novo = el.value.trim(); if (!novo) return desenharTudo(); if (N.ehCartao(x)) M().gastos.forEach(g => { if (g.f === 'card:' + x.n) g.f = 'card:' + novo; }); x.n = novo; mudou(); },
    cDia: el => { achar(M().contas, el.dataset.id).dia = dia(el); mudou(); },
    cVal: el => { const v = el.value.trim() ? N.cent(el.value) : 0; if (!valOk(el, v)) return; achar(M().contas, el.dataset.id).v = v; mudou({ ping: true }); },
    rNome: el => { const v = el.value.trim(); if (v) achar(M().rendas, el.dataset.id).n = v; mudou(); },
    rDia: el => { achar(M().rendas, el.dataset.id).dia = dia(el); mudou(); },
    rVal: el => { const v = el.value.trim() ? N.cent(el.value) : 0; if (!valOk(el, v)) return; achar(M().rendas, el.dataset.id).v = v; mudou({ ping: true }); },
    rVa: el => { achar(M().rendas, el.dataset.id).va = el.checked ? 1 : 0; mudou({ ping: true }); },
    gMes: el => { const v = el.value.trim() ? N.cent(el.value) : 0; if (!valOk(el, v)) return; M().guardar = v; mudou({ ping: true }); },
    gPct: el => { const v = parseFloat(String(el.value).replace(',', '.').replace('%', '')); if (!(v >= 0 && v <= 100)) { aviso('Percentual entre 0 e 100', '', 'warn', 3000); return desenharTudo(); } D.cfg.guardar.pct = v; mudou({ ping: true }); },
    gIni: el => { const v = el.value.trim() ? N.cent(el.value) : 0; if (!valOk(el, v)) return; D.cfg.guardar.inicial = v; mudou(); },
    nome: el => { D.cfg.nome = el.value.trim().slice(0, 40); mudou(); },
    temaChave: el => { pref.tema = el.checked ? 'escuro' : 'claro'; salvarPref(); aplicarTema(); desenharTudo(); },
    railChave: el => { pref.rail = el.checked; salvarPref(); aplicarRail(); },
    mrNome: el => { D.cfg.modelo.rendas[+el.dataset.i].n = el.value.trim() || 'Renda'; mudou(); },
    mrDia: el => { D.cfg.modelo.rendas[+el.dataset.i].dia = dia(el); mudou(); },
    mrVal: el => { const v = el.value.trim() ? N.cent(el.value) : 0; if (valOk(el, v)) { D.cfg.modelo.rendas[+el.dataset.i].v = v; mudou(); } },
    mcNome: el => { D.cfg.modelo.contas[+el.dataset.i].n = el.value.trim() || 'Conta'; mudou(); },
    mcCat: el => { D.cfg.modelo.contas[+el.dataset.i].c = el.value; mudou(); },
    mcDia: el => { D.cfg.modelo.contas[+el.dataset.i].dia = dia(el); mudou(); },
    mcVal: el => { const v = el.value.trim() ? N.cent(el.value) : 0; if (valOk(el, v)) { D.cfg.modelo.contas[+el.dataset.i].v = v; mudou(); } },
    pNome: el => { const p = achar(D.cfg.parcelas, el.dataset.id), n = el.value.trim(); if (!n) return desenharTudo(); p.n = n; Object.values(D.meses).forEach(Mx => Mx.contas.forEach(c => { if (c.pid === p.id) c.n = n; })); mudou(); },
    pVal: el => { const p = achar(D.cfg.parcelas, el.dataset.id), v = N.cent(el.value); if (!valOk(el, v)) return; const hk = N.hojeK(); Object.values(D.meses).forEach(Mx => { if (Mx.k >= hk) Mx.contas.forEach(c => { if (c.pid === p.id && !c.pago) c.v = v; }); }); p.v = v; mudou({ ping: true }); },
    pFolha: el => { achar(D.cfg.parcelas, el.dataset.id).folha = el.checked; mudou({ ping: true }); }
  };
  const IN = {
    calc: el => {
      const f = el.form;
      Object.assign(calcS, { alvo: N.cent(f.alvo.value) || 0, tenho: N.cent(f.tenho.value) || 0, modo: f.modo.value, aporte: N.cent(f.aporte.value) || 0, meses: parseInt(f.meses.value, 10) || 1, taxa: parseFloat(String(f.taxa.value).replace(',', '.')) || 0 });
      f.aporte.closest('label').hidden = calcS.modo !== 'aporte'; f.meses.closest('label').hidden = calcS.modo !== 'prazo';
      $('#calc-res').innerHTML = calcTexto();
    },
    prevMes: el => prevMes(el.form),
    prevMeta: el => prevMeta(el.form),
    tipoConta: el => { const f = el.form, t = f.t.value; $('#fc-parc').hidden = t !== 'parc'; $('#fc-mod').hidden = t !== 'rec'; },
    simGasto: el => {
      const v = N.cent(el.value), c = N.calc(D, sel), out = $('#sim-res'); if (!out || !c) return;
      if (!(v > 0)) { out.textContent = ''; return; }
      const depois = c.livre - v;
      out.innerHTML = depois >= 0 ? '✓ Pode. Depois disso ainda ficam <b>' + brl(depois) + '</b> livres.' : c.sobra - v >= 0 ? '⚠ Esse gasto sai da meta: você guardaria ' + brl(-depois) + ' a menos este mês.' : '✕ Não cabe: o mês ficaria ' + brl(v - c.sobra) + ' no vermelho.';
    }
  };
  /* formulários */
  const FORM = {
    destravar: async f => {
      const ok = pref.senha && (await sha(f.senha.value)) === pref.senha;
      if (ok) { try { sessionStorage.setItem('fin:ok', '1'); } catch (e) { /* aba privada */ } $('#trava').hidden = true; f.senha.value = ''; iniciarApp(); }
      else { $('#trava-erro').textContent = 'Senha incorreta.'; f.senha.value = ''; f.senha.focus(); }
    },
    senha: async f => {
      if (!f.s1.value || f.s1.value !== f.s2.value) { aviso('As senhas não batem', 'Digite a mesma senha nos dois campos.', 'warn'); return; }
      pref.senha = await sha(f.s1.value); salvarPref(); try { sessionStorage.setItem('fin:ok', '1'); } catch (e) { /* ok */ }
      aviso('Senha ligada', 'Na próxima vez que abrir, o app vai pedir a senha.', 'ok'); desenharTudo();
    },
    novoMes: f => {
      const k = N.mk(+f.y.value, +f.m.value);
      if (!D.meses[k]) { D.meses[k] = N.criarMes(D, k, { nome: f.nome.value, base: f.base.value, valores: f.valores.checked }); aviso(N.nomeCurto(k) + ' criado', f.valores.checked ? 'Confira os valores na janela Contas do mês.' : 'Agora é só preencher os valores.', 'ok'); }
      J.fechar('f.mes'); sel = k; calDia = null; gravar(); irTela('mes');
    },
    gasto: f => lancarGasto(f), gastoF: f => lancarGasto(f),
    conta: f => {
      const v = N.cent(f.v.value), n = f.n.value.trim(), t = f.t.value, d = Math.min(31, Math.max(0, parseInt(f.dia.value, 10) || 0));
      if (!n || !(v >= 0)) return aviso('Preencha descrição e valor', '', 'warn');
      if (t === 'parc') {
        const k = parseInt(f.k.value, 10), tot = parseInt(f.tot.value, 10);
        if (!(k >= 1 && tot >= k)) return aviso('Parcelas inválidas', 'A parcela atual precisa ser entre 1 e o total.', 'warn');
        const p = { id: N.uid(), n, c: f.c.value, v, ini: sel, p0: k, tot, dia: d, folha: false };
        D.cfg.parcelas.push(p); Object.values(D.meses).forEach(Mx => N.addParcelas(D, Mx));
        aviso('Parcelamento criado', n + ': ' + k + '/' + tot + ', última em ' + N.curto(N.fimParcela(p)) + '. Entra sozinho nos próximos meses.', 'ok');
      } else {
        M().contas.push({ id: N.uid(), n, c: f.c.value, v, dia: d, pago: false, rec: t === 'rec' ? 1 : 0 });
        if (t === 'rec' && f.mod.checked) D.cfg.modelo.contas.push({ c: f.c.value, n, v, dia: d });
      }
      J.fechar('f.conta'); mudou({ ping: true });
    },
    renda: f => {
      const v = N.cent(f.v.value), n = f.n.value.trim();
      if (!n || !(v >= 0)) return aviso('Preencha nome e valor', '', 'warn');
      const r = { id: N.uid(), n, v, dia: Math.min(31, Math.max(0, parseInt(f.dia.value, 10) || 0)), va: f.va.checked ? 1 : 0, rec: f.rec.checked ? 1 : 0 };
      M().rendas.push(r); if (r.rec) D.cfg.modelo.rendas.push({ n, v, dia: r.dia, va: r.va });
      J.fechar('f.renda'); mudou({ ping: true });
    },
    meta: f => {
      const v = lerMeta(f); if (!v.n || !v.alvo) return aviso('Preencha nome e valor', '', 'warn');
      if (f.dataset.id) { Object.assign(achar(D.cfg.metas, f.dataset.id), { n: v.n, alvo: v.alvo, modo: v.modo, prazo: v.prazo, aporte: v.aporte, taxa: v.taxa, orc: v.orc }); }
      else {
        const m = { id: N.uid(), n: v.n, alvo: v.alvo, modo: v.modo, prazo: v.prazo, aporte: v.aporte, taxa: v.taxa, orc: v.orc, h: [] };
        if (v.tenho) m.h.push({ id: N.uid(), d: N.dataBR(), k: N.hojeK(), v: v.tenho, n: 'saldo inicial' });
        D.cfg.metas.push(m);
        aviso('Meta criada: ' + m.n, N.planoMeta(m, sel).txt, 'ok', 9000);
      }
      J.fechar('f.meta'); mudou({ ping: true });
    },
    calcMeta: () => abrirJan('f.meta', { n: '', alvo: calcS.alvo, tenho: calcS.tenho, modo: calcS.modo, aporte: calcS.aporte, prazo: N.addM(N.hojeK(), Math.max(1, calcS.meses) - 1), taxa: calcS.taxa }),
    guardar: (f, sub) => {
      const v = N.cent(f.v.value), m = achar(D.cfg.metas, f.dataset.id); if (!(v > 0)) { f.v.focus(); return; }
      const sinal = sub && sub.value === '-' ? -1 : 1;
      m.h.push({ id: N.uid(), d: N.dataBR(), k: sel, v: sinal * v });
      mudou(); const g = N.guardado(m);
      if (sinal > 0) aviso(brl(v) + ' guardados em ' + m.n, g >= m.alvo ? 'Meta alcançada! 🎉' : 'Agora são ' + brl(g) + ' (' + N.pct(g, m.alvo) + '%).', 'ok');
    },
    chat: f => { const q = f.q.value.trim(); if (q) perguntar(q); },
    parc: f => {
      const v = N.cent(f.v.value), k = parseInt(f.k.value, 10), tot = parseInt(f.tot.value, 10), n = f.n.value.trim();
      if (!n || !(v > 0) || !(k >= 1 && tot >= k)) return aviso('Confira os campos', 'Nome, valor, parcela atual (1 até o total) e total.', 'warn');
      const p = { id: N.uid(), n, c: f.c.value, v, ini: sel, p0: k, tot, dia: Math.min(31, Math.max(0, parseInt(f.dia.value, 10) || 0)), folha: false };
      D.cfg.parcelas.push(p); Object.values(D.meses).forEach(Mx => N.addParcelas(D, Mx)); mudou({ ping: true });
      aviso('Parcelamento criado', n + ' termina em ' + N.curto(N.fimParcela(p)) + '.', 'ok');
    }
  };
  function lancarGasto(f) {
    const v = N.cent(f.v.value), n = f.n.value.trim();
    if (!n || !(v > 0)) { aviso('Preencha o que foi e o valor', '', 'warn', 3000); return; }
    const g = { id: N.uid(), d: Math.min(N.dias(sel), Math.max(1, parseInt(f.d.value, 10) || 1)), n, v, f: f.f.value };
    M().gastos.push(g); const forma = f.f.value;
    gravar(); desenharTudo();
    const fj = J.el('f.gasto'); if (!fj.hidden) { fj.ctx = { f: forma }; desenharJan(fj, true); const i = fj.querySelector('[name=n]'); if (i) i.focus(); }
    else { const i = $('[data-form="gasto"] [name=n]'); if (i && !J.empilhado()) i.focus(); }
    if (forma === 'emerg') aviso(brl(v) + ' tirados do guardado', 'Saldo guardado agora: ' + brl(N.saldoGuardado(D, sel)) + '.', 'warn');
    else { ultimoPing = ''; ping(); }
  }
  function perguntar(q) {
    chat.push({ q: 'eu', t: q });
    const r = N.responder(D, sel, q, chatCtx); chatCtx = r.ctx; chat.push({ q: 'ele', t: r.txt });
    if (chat.length > 40) chat.splice(0, chat.length - 40);
    if (pref.tela !== 'assist') irTela('assist');
    const w = J.el('assist.chat'); if (w.hidden) J.abrir('assist.chat'); else desenharJan(w);
    const i = w.querySelector('[name=q]'); if (i && !J.empilhado()) i.focus();
  }
  async function sha(t) { const b = await crypto.subtle.digest('SHA-256', new TextEncoder().encode('financas:' + t)); return [...new Uint8Array(b)].map(x => x.toString(16).padStart(2, '0')).join(''); }

  /* ================= eventos ================= */
  document.addEventListener('click', e => {
    const b = e.target.closest('[data-act]');
    if (!$('#pop').hidden && !e.target.closest('#pop') && !(b && /^menu/.test(b.dataset.act))) fecharPop();
    if (b && ACT[b.dataset.act]) { e.preventDefault(); ACT[b.dataset.act](b, e); }
    const it = e.target.closest('#busca-res .it'); if (it) escolher(+it.dataset.i);
    if (e.target.id === 'busca') fecharBusca();
  });
  document.addEventListener('keydown', e => {
    if (e.key === 'Enter' && e.target.closest && e.target.closest('[data-act]') && e.target.matches('.marca')) { e.target.click(); return; }
    const k = e.key.toLowerCase();
    if ((e.ctrlKey || e.metaKey) && (k === 'l' || k === 'k')) { e.preventDefault(); if ($('#busca').hidden) buscar(); else fecharBusca(); return; }
    if (!$('#busca').hidden) {
      if (e.key === 'Escape') { e.preventDefault(); fecharBusca(); }
      else if (e.key === 'ArrowDown') { e.preventDefault(); moverSel(1); }
      else if (e.key === 'ArrowUp') { e.preventDefault(); moverSel(-1); }
      else if (e.key === 'Enter') { e.preventDefault(); escolher(bSel); }
      return;
    }
    if (e.key === 'Escape') { if (!$('#pop').hidden) return fecharPop(); const f = J.visiveis().find(w => w.classList.contains('jan-form') && w.classList.contains('foco')); if (f) J.fechar(f.dataset.id); return; }
    if (e.key === 'Enter' && e.target.classList && e.target.classList.contains('cel') && e.target.tagName === 'INPUT') {
      e.preventDefault(); const w = e.target.closest('.jan'), l = $$('.cel[data-ch="' + e.target.dataset.ch + '"]', w), nx = l[l.indexOf(e.target) + 1];
      pendFoco = nx ? nx.dataset.foco : null; const alvo = pendFoco; e.target.blur();
      setTimeout(() => { if (alvo && pendFoco === alvo) { pendFoco = null; const n = $('[data-foco="' + alvo + '"]'); if (n) { n.focus(); n.select(); } } }, 0);
    }
  });
  document.addEventListener('change', e => { const c = e.target.dataset && e.target.dataset.ch; if (c && CH[c]) CH[c](e.target); });
  document.addEventListener('input', e => { const c = e.target.dataset && e.target.dataset.in; if (c && IN[c]) IN[c](e.target); if (e.target.id === 'busca-q') filtrar(); });
  document.addEventListener('submit', e => { const f = e.target, n = f.dataset.form; if (!n || !FORM[n]) return; e.preventDefault(); FORM[n](f, e.submitter); });
  document.addEventListener('focusin', e => { if (e.target.classList && e.target.classList.contains('cel') && e.target.select && e.target.classList.contains('val')) setTimeout(() => { try { e.target.select(); } catch (x) { /* ok */ } }, 0); });
  $('#arq').addEventListener('change', async e => {
    const f = e.target.files[0]; e.target.value = ''; if (!f) return;
    try { const nd = N.importar(JSON.parse(await f.text())); copia('Antes de restaurar arquivo'); D = nd; const ks = Object.keys(D.meses).sort(); if (!D.meses[sel]) sel = D.meses[N.hojeK()] ? N.hojeK() : ks.pop() || sel; mudou(); aviso('Dados restaurados', Object.keys(D.meses).length + ' meses, ' + D.cfg.metas.length + ' metas. Se não era isso: Cópias automáticas → Voltar.', 'ok', 9000); }
    catch (x) { aviso('Não consegui ler esse arquivo', x.message, 'bad'); }
  });

  /* ================= início ================= */
  let iniciado = false;
  function iniciarApp() {
    if (iniciado) return; iniciado = true;
    $('#app').hidden = false;
    J.init($('#mesa'), JANS, { desenhar: desenharJan });
    J.criarTodas();
    aplicarRail(); irTela(pref.tela);
    const c = N.calc(D, sel);
    if (c) { const m = N.analisar(D, sel)[0]; if (m && (m.lvl === 'bad' || m.lvl === 'warn')) setTimeout(() => aviso(m.t, m.x, m.lvl), 700); ultimoPing = (N.analisar(D, sel).find(x => x.id === 'livre') || {}).lvl + '|' + c.livre; }
    window.FIN.pronto = true;
  }
  montarNav(); aplicarTema(); carregar(); statusSalvo();
  window.FIN = { D: () => D, sel: () => sel, N, J, irTela, irMes, abrirJan, pronto: false };
  if (navigator.storage && navigator.storage.persist) navigator.storage.persist().catch(() => {});
  let liberado = !pref.senha; try { liberado = liberado || sessionStorage.getItem('fin:ok') === '1'; } catch (e) { /* ok */ }
  if (liberado) iniciarApp(); else { $('#app').hidden = true; $('#trava').hidden = false; setTimeout(() => $('#trava-senha').focus(), 50); }
  if ('serviceWorker' in navigator && location.protocol === 'https:') navigator.serviceWorker.register('sw.js').catch(() => {});
})();
