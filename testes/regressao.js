/* Testes de regressão do Finanças. (navegador real + dados de exemplo).
   Rodar:  node testes/regressao.js   (precisa do Playwright; no ambiente do Claude: NODE_PATH=$(npm root -g)) */
const path = require('path');
const { chromium, devices } = require('playwright');
const { subir } = require('./servidor.js');
const N = require('../nucleo.js');

const PORTA = 8131, URL = 'http://localhost:' + PORTA + '/';
let ok = 0; const falhas = [];
function igual(real, esperado, nome) {
  const a = JSON.stringify(real), b = JSON.stringify(esperado);
  if (a === b) { ok++; console.log('  ✔', nome); } else { falhas.push(nome); console.log('  ✘', nome, '\n      esperado:', b, '\n      recebido:', a); }
}
const verdade = (c, nome) => igual(!!c, true, nome);

(async () => {
  console.log('Núcleo');
  {
    const D = { cfg: N.padrao(), meses: {} };
    D.meses['2026-11'] = N.criarMes(D, '2026-11', {});
    const c = N.calc(D, '2026-11');
    igual(c.R, 592341, 'renda de novembro sem VA');
    igual(D.meses['2026-11'].contas.find(x => x.pid === 'gel').pk, 4, 'geladeira em nov/26 = parcela 4/15');
    D.meses['2026-12'] = N.criarMes(D, '2026-12', { base: 'anterior', valores: false });
    igual(D.meses['2026-12'].contas.find(x => x.pid === 'clt3').pk, 3, 'CLT III em dez/26 = parcela 3/18');
    igual(D.meses['2026-12'].contas.find(x => x.n === 'Nubank').v, 0, 'mês novo zerado quando pedido');
    igual(D.meses['2026-12'].contas.find(x => x.pid === 'clt3').v, 63575, 'parcela mantém o valor mesmo zerado');
    igual(N.mesesPara(10000000, 0, 80000, 0), 125, '100 mil guardando 800/mês = 125 meses');
    igual(N.durTxt(125), '10 anos e 5 meses', 'texto da duração');
    igual(N.aporteNecessario(500000, 0, 2, 0), 250000, 'chegar em 2 meses com 5 mil = 2.500/mês');
    igual([N.cent('1.234,56'), N.cent('1234.56'), N.cent('800'), N.cent('1.500'), N.cent('R$ 99,9')], [123456, 123456, 80000, 150000, 9990], 'leitura de valores');
    const m = { id: 'x', n: 'Dezembro', alvo: 500000, modo: 'prazo', prazo: '2026-12', taxa: 0, orc: true, h: [] };
    D.cfg.metas = [m]; D.meses['2026-11'].contas.forEach(x => { x.v = 0; });
    const c2 = N.calc(D, '2026-11');
    igual(c2.res, 250000, 'meta com prazo reserva o valor do mês');
    const parc = N.soma(D.meses['2026-11'].contas.filter(x => x.pid), x => x.v);
    igual([c2.G, c2.livre], [Math.round((592341 - parc) * .1), 592341 - parc - 250000 - Math.round((592341 - parc) * .1)], 'livre = sobra − guardado (10%) − reserva da meta');
    D.meses['2026-11'].gastos.push({ id: 'g', d: 3, n: 'Mercado', v: 10000, f: 'card:Nubank' });
    igual(N.valConta(D.meses['2026-11'], D.meses['2026-11'].contas.find(x => x.n === 'Nubank')), 10000, 'gasto no cartão soma na fatura');
    const r1 = N.responder(D, '2026-11', 'quero juntar 100 mil', {}); verdade(/Quanto por mês/.test(r1.txt), 'assistente pergunta quanto por mês');
    const r2 = N.responder(D, '2026-11', '800', r1.ctx); verdade(/10 anos e 5 meses/.test(r2.txt), 'assistente responde o tempo');
    {
      const E = { cfg: N.padrao(), meses: {} };
      E.cfg.guardar.pct = 20;
      ['2026-10', '2026-11'].forEach(k => { E.meses[k] = N.criarMes(E, k, {}); E.meses[k].contas.forEach(x => { x.v = 0; }); E.meses[k].rendas = [{ id: 'r', n: 'Sal', v: 600000, dia: 1, va: 0 }]; });
      igual(N.calc(E, '2026-10').G, 120000, 'guarda 20% da sobra (6.000 → 1.200)');
      E.meses['2026-11'].gastos.push({ id: 'e', d: 2, n: 'Conserto', v: 30000, f: 'emerg' });
      igual(N.historicoGuardado(E).map(x => x.saldo), [120000, 210000], 'saldo guardado acumula e desconta a emergência (1.200 + 1.200 − 300)');
      igual(N.calc(E, '2026-11').livre, N.calc(E, '2026-10').livre, 'emergência não sai do salário do mês');
      E.meses['2026-11'].guardar = 50000;
      igual(N.saldoGuardado(E), 140000, 'valor fixo de guardar no mês substitui o %');
    }
    const imp = N.importar({ meses: { '2026-10': { rendas: [{ id: 'a', n: 'Salário - Tiago', v: 3323.41, rec: 1 }], contas: [{ id: 'b', c: 'OUTROS', n: 'X', v: 10.5, rec: 1 }] } }, parcelas: [], metas: [{ id: 'carro', n: 'Carro', a: 40000, h: [{ d: '01/10/2026', v: 100 }] }] });
    igual([imp.meses['2026-10'].rendas[0].v, imp.meses['2026-10'].rendas[0].dia, imp.meses['2026-10'].contas[0].c, imp.cfg.metas[0].alvo, imp.cfg.metas[0].h[0].k], [332341, 1, 'DIVERSOS', 4000000, '2026-10'], 'importa backup do Orange');
  }

  const srv = await subir(path.join(__dirname, '..'), PORTA);
  const browser = await chromium.launch();
  const erros = [];
  const nova = async (opts) => {
    const ctx = await browser.newContext(Object.assign({ viewport: { width: 1440, height: 900 }, reducedMotion: 'reduce' }, opts || {}));
    const p = await ctx.newPage();
    p.on('pageerror', e => erros.push('pageerror: ' + e.message));
    p.on('console', m => { if (m.type() === 'error') erros.push('console: ' + m.text()); });
    return { ctx, p };
  };
  const abrir = async p => { await p.goto(URL); await p.waitForFunction(() => window.FIN && FIN.pronto, null, { timeout: 15000 }); };
  const caixa = (p, id) => p.locator('.jan[data-id="' + id + '"]').boundingBox();

  console.log('Janelas flutuantes');
  const { ctx, p } = await nova();
  await abrir(p);
  igual(await p.locator('.jan:not([hidden])').count(), 3, 'abre limpo: Contas, Resumo e Calendário');
  const b0 = await caixa(p, 'resumo');
  await p.mouse.move(b0.x + 60, b0.y + 18); await p.mouse.down(); await p.mouse.move(b0.x - 200, b0.y + 120, { steps: 6 }); await p.mouse.up();
  const b1 = await caixa(p, 'resumo');
  verdade(Math.abs(b1.x - (b0.x - 260)) < 3 && Math.abs(b1.y - (b0.y + 102)) < 3, 'arrastar pelo título move a janela');
  await p.mouse.move(b1.x + b1.width - 4, b1.y + b1.height - 4); await p.mouse.down(); await p.mouse.move(b1.x + b1.width + 40, b1.y + b1.height + 30, { steps: 4 }); await p.mouse.up();
  const b2 = await caixa(p, 'resumo');
  verdade(b2.width > b1.width + 30, 'redimensionar pelo canto');
  await p.reload(); await p.waitForFunction(() => FIN.pronto);
  const b3 = await caixa(p, 'resumo');
  verdade(Math.abs(b3.x - b2.x) < 2 && Math.abs(b3.width - b2.width) < 2, 'posição e tamanho voltam iguais ao reabrir');
  await p.locator('.jan[data-id="resumo"] [data-j="pin"]').click();
  await p.mouse.move(b3.x + 60, b3.y + 18); await p.mouse.down(); await p.mouse.move(b3.x + 260, b3.y + 200, { steps: 5 }); await p.mouse.up();
  const b4 = await caixa(p, 'resumo');
  verdade(Math.abs(b4.x - b3.x) < 2 && Math.abs(b4.y - b3.y) < 2, 'fixada (alfinete) não se move');
  await p.mouse.move(b4.x + b4.width - 4, b4.y + b4.height - 4); await p.mouse.down(); await p.mouse.move(b4.x + b4.width - 60, b4.y + b4.height - 40, { steps: 4 }); await p.mouse.up();
  verdade((await caixa(p, 'resumo')).width < b4.width - 40, 'fixada continua redimensionando');
  await p.locator('.jan[data-id="cal"] [data-j="x"]').click();
  verdade(!(await p.locator('.jan[data-id="cal"]').isVisible()), 'fechar janela');
  await p.click('#menu [data-id="cal"]');
  verdade(await p.locator('.jan[data-id="cal"]').isVisible() && await p.locator('#menu [data-id="cal"].on').count() === 1, 'menu de cima reabre e marca a aba');
  await p.click('#menu [data-id="cal"]');
  verdade(!(await p.locator('.jan[data-id="cal"]').isVisible()), 'clicar de novo no menu fecha');
  await p.click('#menu [data-id="parc"]'); await p.click('#menu [data-id="contas"]');
  verdade(await p.evaluate(() => FIN.J.topo().dataset.id === 'contas'), 'menu traz janela de trás para a frente');

  console.log('Contas, gastos e assistente');
  const livre0 = await p.evaluate(() => FIN.N.calc(FIN.D(), FIN.sel()).livre);
  const nub = p.locator('.jan[data-id="contas"] tr:has(input.cel[data-ch="cNome"][value="Nubank"]) .cel.val');
  await nub.fill('1000,00'); await nub.press('Tab');
  igual(await p.evaluate(() => FIN.D().meses[FIN.sel()].contas.find(x => x.n === 'Nubank').v), 100000, 'editar valor da conta na tabela');
  verdade(await p.locator('.aviso').count() > 0, 'assistente avisa depois da mudança');
  await p.click('#menu [data-id="gastos"]');
  const g = p.locator('[data-form="gasto"]');
  await g.locator('[name=n]').fill('Mercado'); await g.locator('[name=v]').fill('50'); await g.locator('[name=f]').selectOption('pix'); await g.locator('button').click();
  const livre1 = await p.evaluate(() => FIN.N.calc(FIN.D(), FIN.sel()).livre);
  igual(livre1, livre0 + 16548 - 5000, 'gasto no Pix desconta do livre');
  await p.locator('.jan[data-id="contas"] tr:has(input.cel[data-ch="cNome"][value="Aluguel"]) .ck').check();
  igual(await p.evaluate(() => FIN.D().meses[FIN.sel()].contas.find(x => x.n === 'Aluguel').pago), true, 'marcar conta como paga');
  await p.click('#bt-novo'); await p.click('#pop [data-id="f.mes"]');
  await p.locator('[data-form="novoMes"] [name=valores]').uncheck({ force: true });
  await p.locator('#bt-criar-mes').click();
  const dez = await p.evaluate(() => ({ sel: FIN.sel(), clt2: FIN.D().meses[FIN.sel()].contas.find(x => x.pid === 'clt2').pk, nub: FIN.D().meses[FIN.sel()].contas.find(x => x.n === 'Nubank').v }));
  igual(dez, { sel: N.addM(N.hojeK(), 1), clt2: 2 + N.diffM('2026-10', N.addM(N.hojeK(), 1)), nub: 0 }, 'criar mês seguinte com parcelas numeradas e valores zerados');

  console.log('Dinheiro guardado');
  await p.evaluate(() => FIN.abrirJan('contas'));
  const gm = p.locator('[data-ch="gMes"]'); await gm.fill('1200,00'); await gm.press('Tab');
  await p.click('#bt-novo'); await p.click('#pop [data-id="f.gasto"]');
  const fe = p.locator('[data-form="gastoF"]');
  await fe.locator('[name=n]').fill('Pneu'); await fe.locator('[name=v]').fill('300'); await fe.locator('[name=f]').selectOption('emerg'); await fe.locator('button').click();
  igual(await p.evaluate(() => FIN.N.saldoGuardado(FIN.D(), FIN.sel())), await p.evaluate(() => FIN.N.historicoGuardado(FIN.D()).reduce((s, x) => s + x.entrou - x.saiu, 0)), 'saldo guardado = entradas − emergências');
  verdade(/R\$/.test(await p.locator('#menu [data-id="guardado"]').textContent()), 'saldo guardado no menu de cima');
  await p.evaluate(() => FIN.abrirJan('guardado'));
  verdade(await p.locator('.jan[data-id="guardado"] table').count() >= 1, 'janela Dinheiro guardado com histórico');
  await p.evaluate(() => FIN.J.fechar('f.gasto'));

  console.log('Metas');
  await p.click('#bt-novo'); await p.click('#pop [data-id="f.meta"]');
  const fm = p.locator('[data-form="meta"]');
  await fm.locator('[name=n]').fill('Chegar em dezembro'); await fm.locator('[name=alvo]').fill('5000');
  verdade(/por mês/.test(await p.locator('#prev-meta').textContent()), 'prévia da meta mostra quanto por mês');
  await fm.locator('button.pri').click();
  igual(await p.evaluate(() => FIN.D().cfg.metas.some(m => m.n === 'Chegar em dezembro' && m.orc)), true, 'meta criada e reservada no mês');
  verdade(/Metas\s*\d+%/.test(await p.locator('#menu [data-id="metas"]').textContent()), 'progresso das metas no menu de cima');
  await p.evaluate(() => FIN.abrirJan('metas'));
  const fg = p.locator('[data-form="guardar"][data-id="carro"]');
  await fg.locator('[name=v]').fill('400'); await fg.locator('button[value="+"]').click();
  igual(await p.evaluate(() => FIN.N.guardado(FIN.D().cfg.metas.find(m => m.id === 'carro'))), 40000, 'guardar dinheiro na meta');

  console.log('Busca (Ctrl+L), tema e dados');
  await p.keyboard.press('Control+l'); await p.keyboard.type('bradesco'); await p.keyboard.press('Enter');
  verdade(await p.locator('.jan[data-id="contas"]').isVisible(), 'Ctrl+L acha a conta e abre a planilha');
  await p.locator('[data-ch="addConta"][data-cat="DIVERSOS"]').fill('Presente'); await p.locator('[data-ch="addConta"][data-cat="DIVERSOS"]').press('Enter');
  igual(await p.evaluate(() => FIN.D().meses[FIN.sel()].contas.some(x => x.n === 'Presente' && x.c === 'DIVERSOS')), true, 'digitar na última linha da faixa cria a conta');
  verdade(await p.evaluate(() => document.activeElement.dataset.ch === 'cVal'), 'cursor vai direto para o valor da conta nova');
  await p.click('#bt-tema');
  await p.reload(); await p.waitForFunction(() => FIN.pronto);
  igual(await p.evaluate(() => document.documentElement.dataset.tema), 'claro', 'tema fica guardado');
  igual(await p.evaluate(() => Object.keys(FIN.D().meses).length), 2, 'dados continuam depois de recarregar');
  verdade(await p.evaluate(() => (JSON.parse(localStorage.getItem('fin:copias')) || []).length >= 1), 'cópia automática do dia existe');
  await ctx.close();

  console.log('Celular');
  const cel = await nova(devices['iPhone 13']);
  await abrir(cel.p);
  const largura = await cel.p.evaluate(() => [document.documentElement.scrollWidth, innerWidth]);
  verdade(largura[0] <= largura[1], 'sem rolagem para o lado no iPhone');
  verdade(await cel.p.locator('#menu').isVisible() && await cel.p.locator('#fab').isVisible(), 'menu e botão + no celular');
  const pl = await cel.p.evaluate(() => { const w = document.querySelector('.pl-wrap'); return w.scrollWidth <= w.clientWidth + 1; });
  verdade(pl, 'planilha cabe na largura do iPhone');
  verdade(await cel.p.evaluate(() => getComputedStyle(document.querySelector('.jan')).position === 'relative'), 'janelas viram cartões empilhados');
  await cel.ctx.close();

  igual(erros, [], 'nenhum erro no console');
  await browser.close(); srv.close();
  console.log('\n' + ok + ' ok, ' + falhas.length + ' falha(s)' + (falhas.length ? ': ' + falhas.join(' | ') : ''));
  process.exit(falhas.length ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
