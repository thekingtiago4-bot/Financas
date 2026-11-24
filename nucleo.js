/* Finanças. · núcleo: regras puras (datas, dinheiro em CENTAVOS, cálculos do mês, metas e o assistente).
   Não mexe na tela. Funciona no navegador (window.FN.N) e no Node (require) para os testes. */
(function (raiz) {
  const N = {};
  N.MES = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
  N.MESL = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'];
  N.CATS = ['FIXAS', 'PESSOAIS', 'CARTÕES', 'EMPRÉSTIMOS', 'DIVERSOS'];
  N.CAT_NOME = { 'FIXAS': 'Fixas', 'PESSOAIS': 'Pessoais', 'CARTÕES': 'Cartões', 'EMPRÉSTIMOS': 'Empréstimos', 'DIVERSOS': 'Diversos', 'DIA A DIA': 'Dia a dia' };

  /* ---------- datas (mês = "AAAA-MM") ---------- */
  N.mk = (y, m) => y + '-' + String(m).padStart(2, '0');
  N.ym = k => k.split('-').map(Number);
  N.addM = (k, n) => { let [y, m] = N.ym(k); m += n; y += Math.floor((m - 1) / 12); m = ((m - 1) % 12 + 12) % 12 + 1; return N.mk(y, m); };
  N.diffM = (a, b) => { const [y1, m1] = N.ym(a), [y2, m2] = N.ym(b); return (y2 - y1) * 12 + (m2 - m1); };
  N.dias = k => { const [y, m] = N.ym(k); return new Date(y, m, 0).getDate(); };
  N.hojeK = (d = new Date()) => N.mk(d.getFullYear(), d.getMonth() + 1);
  N.nomeM = k => { const [y, m] = N.ym(k); const s = N.MESL[m - 1]; return s[0].toUpperCase() + s.slice(1) + ' de ' + y; };
  N.nomeCurto = k => { const [y, m] = N.ym(k); const s = N.MESL[m - 1]; return s[0].toUpperCase() + s.slice(1) + ' ' + y; };
  N.curto = k => { const [y, m] = N.ym(k); return N.MES[m - 1].toLowerCase() + '/' + String(y).slice(2); };
  N.dataBR = (d = new Date()) => d.toLocaleDateString('pt-BR');
  N.validoK = k => typeof k === 'string' && /^\d{4}-(0[1-9]|1[0-2])$/.test(k);

  /* ---------- dinheiro: sempre centavos inteiros ---------- */
  N.cent = s => {
    if (typeof s === 'number') return Math.round(s * 100);
    s = String(s == null ? '' : s).replace(/[R$\s]/g, '');
    if (!s) return NaN;
    if (s.includes(',')) s = s.replace(/\./g, '').replace(',', '.');
    else if ((s.match(/\./g) || []).length > 1) s = s.replace(/\./g, '');
    else if (/^\d{1,3}\.\d{3}$/.test(s)) s = s.replace('.', '');
    const v = Number(s);
    return isFinite(v) ? Math.round(v * 100) : NaN;
  };
  N.brl = (c, semCentavos) => ((+c || 0) / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: semCentavos ? 0 : 2, maximumFractionDigits: semCentavos ? 0 : 2 });
  N.fmtIn = c => c ? ((c / 100).toFixed(2)).replace('.', ',') : '';
  N.pct = (a, b) => b ? Math.round(a / b * 100) : 0;
  N.soma = (l, f = x => x.v) => l.reduce((s, x) => s + (+f(x) || 0), 0);
  N.uid = () => Math.random().toString(36).slice(2, 9) + Date.now().toString(36).slice(-3);
  N.norm = s => String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');

  /* ---------- dados padrão (as contas do Tiago, vindas do Orange) ---------- */
  N.padrao = () => ({
    v: 1, nome: 'Tiago', guardar: { pct: 10, inicial: 0 },
    modelo: {
      rendas: [{ n: 'Salário - Tiago', v: 332341, dia: 1 }, { n: 'Salário - Sthéfani', v: 260000, dia: 1 }, { n: 'VA', v: 0, dia: 30, va: 1 }],
      contas: [['FIXAS', 'Aluguel', 97542], ['FIXAS', 'Luz', 18000], ['FIXAS', 'Água / Esgoto', 4000], ['PESSOAIS', 'Internet fixa', 9900], ['PESSOAIS', 'Internet móvel', 11156],
        ['PESSOAIS', 'Faculdade - Tiago', 43965], ['PESSOAIS', 'Faculdade - Sthéfani', 92160], ['CARTÕES', 'C6 Bank', 30341], ['CARTÕES', 'InfinitePay', 9927], ['CARTÕES', 'Nubank', 116548],
        ['CARTÕES', 'Bradesco', 126408], ['DIVERSOS', 'Mercado', 0], ['DIVERSOS', 'Diversos', 0]].map(([c, n, v]) => ({ c, n, v, dia: 0 }))
    },
    parcelas: [
      { id: 'gel', n: 'Parcela geladeira', c: 'DIVERSOS', v: 32347, ini: '2026-10', p0: 3, tot: 15, dia: 0, folha: false },
      { id: 'clt1', n: 'Empréstimo CLT I', c: 'EMPRÉSTIMOS', v: 3737, ini: '2026-10', p0: 2, tot: 18, dia: 0, folha: false },
      { id: 'clt2', n: 'Empréstimo CLT II', c: 'EMPRÉSTIMOS', v: 17306, ini: '2026-10', p0: 2, tot: 7, dia: 0, folha: false },
      { id: 'clt3', n: 'Empréstimo CLT III', c: 'EMPRÉSTIMOS', v: 63575, ini: '2026-10', p0: 1, tot: 18, dia: 0, folha: false }],
    metas: [
      { id: 'carro', n: 'Carro', alvo: 4000000, modo: 'aporte', aporte: 0, prazo: '', taxa: 0, orc: false, h: [] },
      { id: 'casa', n: 'Casa', alvo: 8000000, modo: 'aporte', aporte: 0, prazo: '', taxa: 0, orc: false, h: [] },
      { id: 'reserva', n: 'Reserva de emergência', alvo: 1800000, modo: 'aporte', aporte: 0, prazo: '', taxa: 0, orc: false, h: [] }]
  });

  /* ---------- meses ---------- */
  N.numParcela = (p, k) => p.p0 + N.diffM(p.ini, k);
  N.fimParcela = p => N.addM(p.ini, p.tot - p.p0);
  N.addParcelas = (D, M) => {
    (D.cfg.parcelas || []).forEach(p => {
      const n = N.numParcela(p, M.k);
      if (n >= p.p0 && n <= p.tot && !M.contas.some(c => c.pid === p.id))
        M.contas.push({ id: N.uid(), pid: p.id, c: p.c, n: p.n, v: p.v, dia: p.dia || 0, pago: false, pk: n, tot: p.tot });
    });
  };
  N.mesAnterior = (D, k) => Object.keys(D.meses).filter(x => x < k).sort().pop() || null;
  /* base: 'anterior' (copia as contas do mês anterior) ou 'modelo'; valores=false deixa tudo zerado para preencher */
  N.criarMes = (D, k, o = {}) => {
    const prev = N.mesAnterior(D, k);
    let src;
    if (o.base !== 'modelo' && prev) {
      const P = D.meses[prev];
      src = { rendas: P.rendas.filter(r => r.rec !== 0), contas: P.contas.filter(c => !c.pid && c.rec !== 0) };
    } else src = D.cfg.modelo;
    const comValor = o.valores !== false;
    const M = {
      k, nome: (o.nome || '').trim(), criado: Date.now(), guardar: null,
      rendas: src.rendas.map(r => ({ id: N.uid(), n: r.n, v: comValor ? r.v : 0, dia: r.dia || 0, va: r.va ? 1 : 0, rec: 1 })),
      contas: src.contas.map(c => ({ id: N.uid(), c: c.c, n: c.n, v: comValor ? c.v : 0, dia: c.dia || 0, pago: false, rec: 1 })),
      gastos: []
    };
    N.addParcelas(D, M);
    return M;
  };

  /* ---------- cálculos do mês ---------- */
  N.parcela = (D, id) => (D.cfg.parcelas || []).find(p => p.id === id);
  N.ativa = (D, c) => !(c.pid && (N.parcela(D, c.pid) || {}).folha);
  N.ehCartao = c => c.c === 'CARTÕES';
  N.gastosCartao = (M, nome) => N.soma(M.gastos.filter(g => g.f === 'card:' + nome));
  N.valConta = (M, c) => c.v + (N.ehCartao(c) ? N.gastosCartao(M, c.n) : 0);
  N.calc = (D, k) => {
    const M = D.meses[k]; if (!M) return null;
    let R = 0, VA = 0; M.rendas.forEach(r => { if (r.va) VA += r.v; else R += r.v; });
    let C = 0, pagas = 0; const porCat = {}; const cartoes = new Set();
    M.contas.forEach(c => {
      if (!N.ativa(D, c)) return;
      if (N.ehCartao(c)) cartoes.add('card:' + c.n);
      const v = N.valConta(M, c); C += v; if (c.pago) pagas += v; porCat[c.c] = (porCat[c.c] || 0) + v;
    });
    let Gv = 0, Gva = 0, Gc = 0, Ge = 0;
    M.gastos.forEach(g => {
      if (g.f === 'va') Gva += g.v;
      else if (g.f === 'emerg') Ge += g.v;
      else if (g.f.startsWith('card:')) { Gc += g.v; if (!cartoes.has(g.f)) { C += g.v; porCat['CARTÕES'] = (porCat['CARTÕES'] || 0) + g.v; } }
      else Gv += g.v;
    });
    if (Gv) porCat['DIA A DIA'] = Gv;
    const pct = N.pctGuardar(D), auto = Math.max(0, Math.round((R - C) * pct / 100)), G = M.guardar == null ? auto : M.guardar;
    const sobra = R - C - Gv, res = N.reserva(D, k), livre = sobra - res - G;
    return { M, R, VA, C, pagas, aPagar: C - pagas, porCat, Gv, Gva, Gc, Ge, G, Gauto: M.guardar == null, pct, sobra, res, livre, vaSaldo: VA - Gva, gastoTotal: C + Gv };
  };
  /* ---------- dinheiro guardado (a "caixinha" da casa): entra X% da sobra, sai o que foi tirado como Emergência ---------- */
  N.pctGuardar = D => Math.min(100, Math.max(0, +((D.cfg.guardar || {}).pct) || 0));
  N.historicoGuardado = (D, ate) => {
    let saldo = +((D.cfg.guardar || {}).inicial) || 0;
    return Object.keys(D.meses).sort().filter(k => !ate || k <= ate).map(k => { const c = N.calc(D, k); saldo += c.G - c.Ge; return { k, entrou: c.G, saiu: c.Ge, saldo }; });
  };
  N.saldoGuardado = (D, ate) => { const h = N.historicoGuardado(D, ate); return h.length ? h[h.length - 1].saldo : +((D.cfg.guardar || {}).inicial) || 0; };
  N.diasRestantes = (k, hoje = new Date()) => {
    const hk = N.hojeK(hoje);
    if (k < hk) return 0; if (k > hk) return N.dias(k);
    return N.dias(k) - hoje.getDate() + 1;
  };

  /* ---------- metas ---------- */
  N.guardado = m => N.soma(m.h || []);
  N.guardadoAntes = (m, k) => N.soma((m.h || []).filter(h => h.k < k));
  N.guardadoNoMes = (m, k) => N.soma((m.h || []).filter(h => h.k === k));
  N.taxaMes = taxaAno => Math.pow(1 + (+taxaAno || 0) / 100, 1 / 12) - 1;
  /* quanto guardar por mês para ter "alvo" em n meses, já tendo "g" (com rendimento opcional) */
  N.aporteNecessario = (alvo, g, n, taxaAno) => {
    if (n <= 0) return Math.max(0, alvo - g);
    const i = N.taxaMes(taxaAno);
    const falta = i ? alvo - g * Math.pow(1 + i, n) : alvo - g;
    if (falta <= 0) return 0;
    return Math.ceil(i ? falta * i / (Math.pow(1 + i, n) - 1) : falta / n);
  };
  /* em quantos meses chega guardando P por mês */
  N.mesesPara = (alvo, g, P, taxaAno) => {
    if (g >= alvo) return 0;
    const i = N.taxaMes(taxaAno);
    if (P <= 0 && !(i > 0 && g > 0)) return Infinity;
    if (!i) return Math.ceil((alvo - g) / P);
    const n = Math.log((alvo * i + P) / (g * i + P)) / Math.log(1 + i);
    return isFinite(n) ? Math.max(1, Math.ceil(n - 1e-9)) : Infinity;
  };
  N.durTxt = n => {
    if (n === Infinity) return 'nunca (precisa guardar algum valor por mês)';
    if (n <= 0) return 'já chegou lá';
    const a = Math.floor(n / 12), m = n % 12;
    const ta = a ? a + (a > 1 ? ' anos' : ' ano') : '', tm = m ? m + (m > 1 ? ' meses' : ' mês') : '';
    return ta && tm ? ta + ' e ' + tm : ta || tm;
  };
  N.mensalMeta = (m, k) => {
    if (m.modo === 'aporte') return +m.aporte || 0;
    if (!N.validoK(m.prazo)) return 0;
    const n = N.diffM(k, m.prazo) + 1; if (n <= 0) return 0;
    return N.aporteNecessario(m.alvo, N.guardadoAntes(m, k), n, m.taxa);
  };
  N.reserva = (D, k) => N.soma((D.cfg.metas || []).filter(m => m.orc && N.guardado(m) < m.alvo), m => N.mensalMeta(m, k));
  N.planoMeta = (m, k) => {
    const g = N.guardado(m);
    if (g >= m.alvo) return { feito: true, txt: 'Meta alcançada!' };
    if (m.modo === 'prazo' && N.validoK(m.prazo)) {
      const n = N.diffM(k, m.prazo) + 1;
      if (n <= 0) return { atrasada: true, txt: 'O prazo (' + N.curto(m.prazo) + ') já passou. Faltam ' + N.brl(m.alvo - g) + '.' };
      const p = N.mensalMeta(m, k);
      return { mensal: p, n, txt: 'Guarde ' + N.brl(p) + ' por mês até ' + N.curto(m.prazo) + ' (' + n + (n > 1 ? ' meses' : ' mês') + ').' };
    }
    const n = N.mesesPara(m.alvo, g, +m.aporte || 0, m.taxa);
    if (n === Infinity) return { semPlano: true, txt: 'Diga quanto quer guardar por mês e eu calculo o tempo.' };
    return { mensal: +m.aporte, n, fim: N.addM(k, n - 1), txt: 'Guardando ' + N.brl(m.aporte) + ' por mês, chega lá em ' + N.durTxt(n) + ' (' + N.curto(N.addM(k, n - 1)) + ').' };
  };

  /* ---------- séries para tendências ---------- */
  N.mesesAte = (D, k, n) => Object.keys(D.meses).filter(x => x <= k).sort().slice(-n);
  N.serieConta = (D, nome, k, n) => N.mesesAte(D, k, n).map(x => { const M = D.meses[x]; return { k: x, v: N.soma(M.contas.filter(c => c.n === nome && N.ativa(D, c)), c => N.valConta(M, c)) }; });
  N.serieCalc = (D, k, n, campo) => N.mesesAte(D, k, n).map(x => ({ k: x, v: N.calc(D, x)[campo] }));
  N.tendencia = serie => {
    const vs = serie.map(s => s.v); if (vs.length < 4) return null;
    const ult = vs.slice(-3), ant = vs.slice(0, -3).slice(-3);
    const a = N.soma(ult, x => x) / ult.length, b = N.soma(ant, x => x) / ant.length;
    return { a: Math.round(a), b: Math.round(b), pct: b ? Math.round((a - b) / b * 100) : null };
  };

  /* ---------- o assistente: lê os números e devolve avisos ---------- */
  const ORD = { bad: 0, warn: 1, ok: 2, info: 3 };
  N.analisar = (D, k, hoje = new Date()) => {
    const nome = D.cfg.nome || 'Você', out = [], c = N.calc(D, k);
    if (!c) return [{ lvl: 'info', id: 'semmes', t: N.nomeCurto(k) + ' ainda não foi criado', x: nome + ', clique em “Novo mês” para montar este mês com as contas de sempre.' }];
    const hk = N.hojeK(hoje), atual = k === hk, dHoje = hoje.getDate(), nd = N.dias(k), restam = N.diasRestantes(k, hoje);
    if (!c.R) out.push({ lvl: 'warn', id: 'renda', t: 'Falta a renda do mês', x: 'Preencha o salário na janela Rendas para eu conseguir fazer as contas.' });
    if (c.R) {
      if (c.sobra < 0) out.push({ lvl: 'bad', id: 'livre', t: 'Mês no vermelho', x: nome + ', as contas passam a renda em ' + N.brl(-c.sobra) + '. Este mês não sobra nada para guardar: veja o que dá para adiar ou renegociar.' });
      else if (c.res + c.G > 0 && c.livre < 0) out.push({ lvl: 'bad', id: 'livre', t: 'Você já está usando o dinheiro de guardar', x: 'Este mês era para separar ' + N.brl(c.res + c.G) + ' (' + [c.G ? N.brl(c.G) + ' para o guardado' : '', c.res ? N.brl(c.res) + ' para as metas' : ''].filter(Boolean).join(' e ') + '), mas só sobram ' + N.brl(c.sobra) + '. Do jeito que está, vai guardar ' + N.brl(-c.livre) + ' a menos.' });
      else if (c.res + c.G > 0 && c.livre < Math.max(3000, Math.round(c.R * 0.01))) out.push({ lvl: 'bad', id: 'livre', t: 'Não dá para gastar nem mais R$ 1', x: nome + ', você ganha ' + N.brl(c.R) + ' e as contas estão em ' + N.brl(c.gastoTotal) + '. Sobram ' + N.brl(c.sobra) + ', praticamente o que você precisa guardar (' + N.brl(c.res + c.G) + '). Qualquer gasto a mais sai do que você ia guardar.' });
      else {
        const porDia = restam ? Math.floor(c.livre / restam) : 0;
        out.push({ lvl: c.livre < c.R * 0.05 ? 'warn' : 'ok', id: 'livre', t: 'Você ainda tem ' + N.brl(c.livre) + ' livre', x: (c.res + c.G > 0 ? 'É o que dá para gastar antes de começar a usar os ' + N.brl(c.res + c.G) + ' que seriam guardados' + (c.res ? ' (metas + guardado)' : '') + '.' : 'Você ainda não está separando nada para guardar: defina o % em Metas → Dinheiro guardado.') + (atual && restam ? ' Isso dá ' + N.brl(porDia) + ' por dia até o dia ' + nd + '.' : '') });
      }
    }
    {
      const sg = N.saldoGuardado(D, k);
      if (c.Ge > c.G && c.Ge) out.push({ lvl: 'warn', id: 'guardado', t: 'Saiu mais do guardado do que entrou', x: 'Este mês você tirou ' + N.brl(c.Ge) + ' do dinheiro guardado e está colocando ' + N.brl(c.G) + '. Saldo guardado agora: ' + N.brl(sg) + '.' });
      else if (c.R) out.push({ lvl: 'info', id: 'guardado', t: 'Dinheiro guardado: ' + N.brl(sg), x: 'Este mês entram ' + N.brl(c.G) + (c.Gauto ? ' (' + c.pct + '% do que sobra depois das contas)' : '') + (c.Ge ? ' e já saíram ' + N.brl(c.Ge) + ' como emergência' : '') + '.' });
    }
    // tendência: cartões e diversos, últimos 3 meses contra os anteriores
    const nomes = [...new Set(c.M.contas.filter(x => (x.c === 'CARTÕES' || x.c === 'DIVERSOS') && !x.pid).map(x => x.n))];
    nomes.forEach(n => {
      const ct = c.M.contas.find(x => x.n === n), rot = ct.c === 'CARTÕES' ? 'o cartão ' + n : n;
      const s = N.serieConta(D, n, k, 6), t = N.tendencia(s);
      if (t && t.b > 0 && t.a > t.b * 1.15 && t.a - t.b >= 3000) out.push({ lvl: 'warn', id: 'tend:' + n, t: 'Gastando mais com ' + rot, x: nome + ', nos últimos 3 meses você anda gastando muito com ' + rot + ': média de ' + N.brl(t.a) + ', ' + t.pct + '% a mais que antes (' + N.brl(t.b) + '). Precisa economizar aqui.' });
      else if (ct.c === 'CARTÕES' && c.R && s.length >= 3) {
        const a = N.soma(s.slice(-3)) / 3;
        if (a >= c.R * 0.25) out.push({ lvl: 'warn', id: 'peso:' + n, t: rot[0].toUpperCase() + rot.slice(1) + ' pesa muito', x: 'Nos últimos 3 meses ' + rot + ' levou em média ' + N.brl(a) + ' por mês, ' + N.pct(a, c.R) + '% da sua renda.' });
      }
    });
    const tg = N.tendencia(N.serieCalc(D, k, 6, 'Gv'));
    if (tg && tg.b > 0 && tg.a > tg.b * 1.2 && tg.a - tg.b >= 5000) out.push({ lvl: 'warn', id: 'tend:dia', t: 'Gastos do dia a dia subindo', x: 'Os gastos no Pix/débito estão em ' + N.brl(tg.a) + ' por mês (média de 3 meses), ' + tg.pct + '% acima de antes.' });
    if (c.R && (c.porCat['CARTÕES'] || 0) > c.R * 0.4) out.push({ lvl: 'warn', id: 'cartoes', t: 'Cartões: ' + N.pct(c.porCat['CARTÕES'], c.R) + '% da renda', x: 'Juntos, os cartões somam ' + N.brl(c.porCat['CARTÕES']) + ' este mês. O ideal é ficar abaixo de 30% (' + N.brl(c.R * 0.3) + ').' });
    if (atual) {
      const at = c.M.contas.filter(x => !x.pago && x.dia && x.dia < dHoje && N.ativa(D, x) && x.v);
      if (at.length) out.push({ lvl: 'warn', id: 'atraso', t: at.length + (at.length > 1 ? ' contas já venceram' : ' conta já venceu'), x: at.map(x => x.n + ' (dia ' + x.dia + ')').join(', ') + '. Se já pagou, marque como paga.' });
      const vz = c.M.contas.filter(x => !x.pago && x.dia && x.dia >= dHoje && x.dia <= dHoje + 3 && N.ativa(D, x) && x.v);
      if (vz.length) out.push({ lvl: 'warn', id: 'vence', t: 'Vence nos próximos dias', x: vz.map(x => x.n + ' (dia ' + x.dia + ', ' + N.brl(N.valConta(c.M, x)) + ')').join(', ') + '.' });
      const sal = c.M.rendas.filter(r => !r.va && r.dia > dHoje);
      if (sal.length) out.push({ lvl: 'info', id: 'sal', t: 'Próximo pagamento: dia ' + sal[0].dia, x: sal.map(r => r.n + ' ' + N.brl(r.v)).join(' · ') });
    }
    if (c.VA) {
      const r = c.M.rendas.find(x => x.va);
      out.push({ lvl: c.vaSaldo < 0 ? 'warn' : 'info', id: 'va', t: 'VA: ' + N.brl(c.vaSaldo) + ' de saldo', x: 'Caiu ' + N.brl(c.VA) + (r && r.dia ? ' (dia ' + Math.min(r.dia, nd) + ')' : '') + ' e você já usou ' + N.brl(c.Gva) + '.' });
    } else if (c.M.rendas.some(r => r.va)) out.push({ lvl: 'info', id: 'va', t: 'Preencha o valor do VA', x: 'O VA cai no dia 30. Coloque o valor na janela Rendas para eu acompanhar o saldo.' });
    (D.cfg.parcelas || []).forEach(p => {
      const f = N.fimParcela(p), d = N.diffM(k, f);
      if (d >= 0 && d <= 3 && !p.folha) out.push({ lvl: 'info', id: 'parc:' + p.id, t: p.n + ' acaba em ' + N.curto(f), x: (d === 0 ? 'Esta é a última parcela! ' : '') + 'A partir de ' + N.curto(N.addM(f, 1)) + ' sobram ' + N.brl(p.v) + ' por mês. Coloque esse valor direto numa meta antes que ele “suma”.' });
    });
    const metas = D.cfg.metas || [];
    metas.forEach(m => {
      const pl = N.planoMeta(m, k);
      if (pl.feito) return;
      if (m.modo === 'prazo' && pl.mensal) {
        const dep = N.guardadoNoMes(m, k), falta = pl.mensal - dep;
        if (falta > 0) out.push({ lvl: 'info', id: 'meta:' + m.id, t: m.n + ': guarde ' + N.brl(pl.mensal) + ' este mês', x: 'Para chegar em ' + N.curto(m.prazo) + ' com ' + N.brl(m.alvo) + '. ' + (dep ? 'Já guardou ' + N.brl(dep) + ', faltam ' + N.brl(falta) + '.' : 'Ainda não guardou nada este mês.') });
      } else if (pl.semPlano) out.push({ lvl: 'info', id: 'meta:' + m.id, t: m.n + ': quanto por mês?', x: 'Diga quanto quer guardar por mês para ' + m.n + ' e eu digo em quanto tempo você chega lá.' });
      else if (pl.atrasada) out.push({ lvl: 'warn', id: 'meta:' + m.id, t: m.n + ': prazo vencido', x: pl.txt });
      else if (pl.n) out.push({ lvl: 'info', id: 'meta:' + m.id, t: m.n, x: pl.txt });
    });
    if (!metas.length) out.push({ lvl: 'info', id: 'semmeta', t: 'Crie sua primeira meta', x: 'Ex.: “chegar em dezembro com R$ 5.000” ou “juntar R$ 100 mil guardando R$ 800 por mês”. Eu calculo o resto.' });
    return out.sort((a, b) => ORD[a.lvl] - ORD[b.lvl]);
  };

  /* ---------- conversa com o assistente (sem internet: entende frases simples) ---------- */
  N.numeros = txt => {
    const out = []; const re = /(\d+(?:[.,]\d+)*)\s*(mil|k|milh(?:ão|ões|ao|oes))?/gi; let m;
    while ((m = re.exec(txt))) {
      let v = N.cent(m[1]) / 100; if (!isFinite(v)) continue;
      const mult = (m[2] || '').toLowerCase();
      if (mult === 'mil' || mult === 'k') v *= 1000; else if (mult.startsWith('milh')) v *= 1e6;
      out.push(Math.round(v * 100));
    }
    return out;
  };
  N.responder = (D, k, pergunta, ctx = {}, hoje = new Date()) => {
    const q = N.norm(pergunta), nums = N.numeros(pergunta), c = N.calc(D, k), nome = D.cfg.nome || 'Você';
    const r = (txt, novoCtx) => ({ txt, ctx: novoCtx || {} });
    if (ctx.alvo && nums.length && !/(juntar|chegar|quero)/.test(q)) {
      const P = nums[0], n = N.mesesPara(ctx.alvo, ctx.tenho || 0, P, ctx.taxa || 0);
      return r('Guardando ' + N.brl(P) + ' por mês, você junta ' + N.brl(ctx.alvo) + ' em ' + N.durTxt(n) + (n !== Infinity ? ' (por volta de ' + N.curto(N.addM(N.hojeK(hoje), n - 1)) + ')' : '') + '.' + (ctx.taxa ? '' : ' Isso sem contar rendimento: deixando num CDB/Tesouro (~10% ao ano), cai para ' + N.durTxt(N.mesesPara(ctx.alvo, ctx.tenho || 0, P, 10)) + '.') + (c && c.sobra > 0 && P > c.sobra ? ' Atenção: hoje sobram só ' + N.brl(c.sobra) + ' por mês.' : ''));
    }
    if (/(juntar|chegar|quanto tempo|demor|guardar)/.test(q) && nums.length) {
      const alvo = Math.max(...nums), outros = nums.filter(x => x !== alvo);
      const mm = q.match(/(\d+)\s*(mes|meses|ano|anos)/);
      if (mm && /(em|daqui)/.test(q)) {
        const n = +mm[1] * (/ano/.test(mm[2]) ? 12 : 1), p = N.aporteNecessario(alvo, 0, n, 0);
        return r('Para juntar ' + N.brl(alvo) + ' em ' + N.durTxt(n) + ', você precisa guardar ' + N.brl(p) + ' por mês' + (c && c.sobra < p ? '. Hoje sobram ' + N.brl(Math.max(0, c.sobra)) + ', então precisaria cortar ' + N.brl(p - Math.max(0, c.sobra)) + ' das contas.' : '.'));
      }
      if (outros.length) return N.responder(D, k, String(outros[0] / 100), { alvo }, hoje);
      return r('Quanto por mês você quer guardar para juntar ' + N.brl(alvo) + '?', { alvo });
    }
    if (/(gastar|livre|sobra|posso)/.test(q)) {
      if (!c) return r(N.nomeCurto(k) + ' ainda não foi criado.');
      const restam = N.diasRestantes(k, hoje);
      return r(c.livre > 0 ? 'Você tem ' + N.brl(c.livre) + ' livre' + (restam ? ' (' + N.brl(Math.floor(c.livre / restam)) + ' por dia até o fim do mês)' : '') + (c.res + c.G ? ', já separando ' + N.brl(c.res + c.G) + ' para guardar.' : '.') : 'Nada, ' + nome + '. ' + (c.sobra < 0 ? 'As contas já passam a renda em ' + N.brl(-c.sobra) + '.' : 'O que sobra (' + N.brl(c.sobra) + ') já é o dinheiro de guardar (' + N.brl(c.res + c.G) + ').'));
    }
    if (c) {
      const card = c.M.contas.find(x => x.c === 'CARTÕES' && q.includes(N.norm(x.n)));
      if (card || /cart/.test(q)) {
        const lista = card ? [card] : c.M.contas.filter(x => x.c === 'CARTÕES');
        return r(lista.map(x => { const s = N.serieConta(D, x.n, k, 6); return x.n + ': ' + s.map(y => N.curto(y.k) + ' ' + N.brl(y.v, true)).join(' → '); }).join('\n') || 'Não achei cartões neste mês.');
      }
      if (/(venc|pagar|pagou|conta)/.test(q)) {
        const ab = c.M.contas.filter(x => !x.pago && N.ativa(D, x) && x.v).sort((a, b) => (a.dia || 99) - (b.dia || 99));
        return r(ab.length ? 'Faltam pagar ' + N.brl(c.aPagar) + ':\n' + ab.slice(0, 12).map(x => '• ' + x.n + (x.dia ? ' (dia ' + x.dia + ')' : '') + ' ' + N.brl(N.valConta(c.M, x))).join('\n') : 'Tudo pago neste mês.');
      }
    }
    if (/(guardad|caixinha|emergen|reserva da casa)/.test(q)) {
      const h = N.historicoGuardado(D, k).slice(-6);
      return r('Dinheiro guardado: ' + N.brl(N.saldoGuardado(D, k)) + '\n' + h.map(x => '• ' + N.curto(x.k) + ': entrou ' + N.brl(x.entrou) + (x.saiu ? ', saiu ' + N.brl(x.saiu) : '') + ' → ' + N.brl(x.saldo)).join('\n'));
    }
    if (/(parcel|emprest)/.test(q)) return r((D.cfg.parcelas || []).map(p => '• ' + p.n + ': ' + N.brl(p.v) + ', última em ' + N.curto(N.fimParcela(p))).join('\n') || 'Nenhum parcelamento cadastrado.');
    if (/meta/.test(q)) return r((D.cfg.metas || []).map(m => '• ' + m.n + ': ' + N.brl(N.guardado(m)) + ' de ' + N.brl(m.alvo) + ' (' + N.pct(N.guardado(m), m.alvo) + '%). ' + N.planoMeta(m, k).txt).join('\n') || 'Você ainda não tem metas.');
    return r('Posso responder coisas como:\n• “Quanto posso gastar?”\n• “Quero juntar 100 mil” (eu pergunto quanto por mês)\n• “Juntar 20 mil em 2 anos”\n• “Como está o Nubank?”\n• “O que falta pagar?”\n• “Quando acabam os empréstimos?”');
  };

  /* ---------- arquivos: conferir e importar (inclui backup do Orange) ---------- */
  const txt = (s, max = 80) => String(s == null ? '' : s).replace(/[\u0000-\u001f]/g, ' ').slice(0, max);
  const int = (v, min = -1e12, max = 1e12) => { v = Math.round(+v || 0); return Math.min(max, Math.max(min, v)); };
  const cat = c => N.CATS.includes(c) ? c : (c === 'OUTROS' ? 'DIVERSOS' : 'DIVERSOS');
  const id = v => /^[a-z0-9_-]{1,24}$/i.test(v) ? v : N.uid();
  N.sanear = D => {
    const P = N.padrao(), cfg = D.cfg || {};
    const gu = cfg.guardar || P.guardar;
    const out = { cfg: { v: 1, nome: txt(cfg.nome || P.nome, 40), guardar: { pct: Math.min(100, Math.max(0, +gu.pct || 0)), inicial: int(gu.inicial) }, modelo: { rendas: [], contas: [] }, parcelas: [], metas: [] }, meses: {} };
    const m = cfg.modelo || P.modelo;
    out.cfg.modelo.rendas = (m.rendas || []).slice(0, 50).map(r => ({ n: txt(r.n), v: int(r.v, 0), dia: int(r.dia, 0, 31), va: r.va ? 1 : 0 }));
    out.cfg.modelo.contas = (m.contas || []).slice(0, 200).map(c => ({ c: cat(c.c), n: txt(c.n), v: int(c.v, 0), dia: int(c.dia, 0, 31) }));
    out.cfg.parcelas = (cfg.parcelas || []).slice(0, 100).filter(p => N.validoK(p.ini)).map(p => ({ id: id(p.id), n: txt(p.n), c: cat(p.c), v: int(p.v, 0), ini: p.ini, p0: int(p.p0, 1, 600), tot: int(p.tot, 1, 600), dia: int(p.dia, 0, 31), folha: !!p.folha }));
    out.cfg.metas = (cfg.metas || []).slice(0, 50).map(x => ({ id: id(x.id), n: txt(x.n), alvo: int(x.alvo, 0), modo: x.modo === 'prazo' ? 'prazo' : 'aporte', aporte: int(x.aporte, 0), prazo: N.validoK(x.prazo) ? x.prazo : '', taxa: Math.min(100, Math.max(0, +x.taxa || 0)), orc: !!x.orc, h: (x.h || []).slice(-2000).map(h => ({ id: id(h.id), d: txt(h.d, 12), k: N.validoK(h.k) ? h.k : N.hojeK(), v: int(h.v), n: txt(h.n || '', 60) })) }));
    Object.keys(D.meses || {}).filter(N.validoK).forEach(k => {
      const M = D.meses[k];
      out.meses[k] = {
        k, nome: txt(M.nome || '', 40), criado: int(M.criado, 0), guardar: M.guardar == null ? null : int(M.guardar, 0),
        rendas: (M.rendas || []).slice(0, 50).map(r => ({ id: id(r.id), n: txt(r.n), v: int(r.v, 0), dia: int(r.dia, 0, 31), va: r.va ? 1 : 0, rec: r.rec === 0 ? 0 : 1 })),
        contas: (M.contas || []).slice(0, 300).map(c => { const o = { id: id(c.id), c: cat(c.c), n: txt(c.n), v: int(c.v, 0), dia: int(c.dia, 0, 31), pago: !!c.pago, rec: c.rec === 0 ? 0 : 1 }; if (c.pid) { o.pid = id(c.pid); o.pk = int(c.pk, 1, 600); o.tot = int(c.tot, 1, 600); } return o; }),
        gastos: (M.gastos || []).slice(0, 2000).map(g => ({ id: id(g.id), d: int(g.d, 1, 31), n: txt(g.n), v: int(g.v, 0), f: /^(pix|din|va|emerg|card:.{1,80})$/.test(g.f) ? g.f : 'pix' }))
      };
    });
    return out;
  };
  /* backup do Orange (valores em reais, campos k/rec/pid) → formato daqui */
  N.doOrange = O => {
    const c = v => Math.round((+v || 0) * 100), P = N.padrao();
    const D = { cfg: Object.assign(P, { parcelas: (O.parcelas || []).map(p => Object.assign({}, p, { v: c(p.v), c: cat(p.c) })), metas: (O.metas || []).map(m => ({ id: m.id, n: m.n, alvo: c(m.a), modo: 'aporte', aporte: 0, prazo: '', taxa: 0, orc: false, h: (m.h || []).map(h => { const [d, mm, y] = String(h.d || '').split('/'); return { id: N.uid(), d: h.d, k: y ? N.mk(+y, +mm) : N.hojeK(), v: c(h.v) }; }) })) }), meses: {} };
    Object.keys(O.meses || {}).forEach(k => {
      const M = O.meses[k];
      D.meses[k] = { k, nome: '', rendas: (M.rendas || []).map(r => ({ id: r.id, n: r.n, v: c(r.v), dia: /sal[aá]rio/i.test(r.n) ? 1 : 0, va: /\bva\b/i.test(r.n) ? 1 : 0, rec: r.rec ? 1 : 0 })), contas: (M.contas || []).map(x => { const o = { id: x.id, c: x.c, n: x.n, v: c(x.v), dia: 0, pago: false, rec: x.rec ? 1 : 0 }; if (x.pid) { o.pid = x.pid; o.pk = x.k; o.tot = x.tot; } return o; }), gastos: [] };
    });
    return D;
  };
  N.importar = obj => {
    if (!obj || typeof obj !== 'object') throw new Error('arquivo vazio');
    if (obj.app === 'financas' && obj.dados) obj = obj.dados;
    if (obj.cfg && obj.meses) return N.sanear(obj);
    if (obj.meses && (obj.parcelas || obj.metas)) return N.sanear(N.doOrange(obj));
    throw new Error('não é um backup do Finanças nem do Orange');
  };

  if (typeof module !== 'undefined' && module.exports) module.exports = N;
  else { raiz.FN = raiz.FN || {}; raiz.FN.N = N; }
})(typeof window !== 'undefined' ? window : globalThis);
