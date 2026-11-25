# Finanças. — instruções para o Claude

Controle financeiro pessoal do Tiago (único usuário). Mesma identidade, linguagem e jeito de trabalhar do Health Log (`thekingtiago4-bot/Health-Log`): cores teal/aqua, Barlow, trilho lateral, janelas flutuantes de vidro, tema escuro padrão.

## Regras
- Português do Brasil em tudo que o usuário lê. Linguagem simples, de quem não é de finanças.
- Botão criado é botão clicado: testar antes de entregar. `node testes/regressao.js` precisa passar.
- **Dinheiro em centavos inteiros** (`N.cent`, `N.brl`). Nada de ponto flutuante nas somas.
- Dados só no aparelho (`localStorage` `fin:dados`). Erro de leitura nunca recria por cima: o texto com defeito vai para `fin:dados-com-erro`. Cópia (`fin:copias`, até 6) antes de toda ação destrutiva + uma por dia.
- **Nunca versionar dados reais** exportados (`financas-copia-*.json`, backups do Orange). Os valores padrão em `N.padrao()` vieram do Orange a pedido do Tiago.
- CSP no `index.html`: nenhum script embutido nem `onclick=`; nenhum serviço externo (o app funciona sem internet).
- Todo texto do usuário que vai para `innerHTML` passa por `esc()`.

## Arquivos
`nucleo.js` regras puras (datas, centavos, cálculo do mês, metas, assistente, importação; roda no Node para os testes) · `janelas.js` janelas flutuantes + ícones (`FN.J`, `FN.ico`) · `graficos.js` gráficos SVG (`FN.G`) · `app.js` telas, formulários, busca, eventos · `tema.js` tema antes de pintar · `sw.js` offline (rede primeiro).

## Como funciona
- **Sem telas/abas laterais** (v0.2, pedido do Tiago: "achei bagunçado"). Topo em 2 linhas: marca + mês + Livre/Novo/busca/tema; embaixo a **faixa de menu tipo Word** (`MENU`): Contas · Gastos · Calendário │ Metas (com % geral) · Guardado (saldo) │ Assistente (nº de avisos) · Relatórios · Parcelas · Ajustes. Botão do menu: fechada → abre; aberta atrás → traz para a frente; na frente → fecha (`J.alternar`). Aba acesa = janela aberta. Primeiro uso abre só Contas, Resumo (logo) e Calendário. "+ Novo" abre os formulários (Lançar gasto, Nova conta, Nova renda, Novo mês, Nova meta).
- **Contas = planilha única do mês** (`R.contas`): faixas coloridas ENTRADAS · FIXAS · PESSOAIS · CARTÕES · EMPRÉSTIMOS · DIVERSOS · DIA A DIA · GUARDADO e rodapé Entradas/Saídas/Sobra/Guardado+metas/LIVRE. Cada faixa termina numa linha "+ adicionar…": digitar o nome + Enter cria a conta e o cursor vai para o valor. Tipo (todo mês/só este mês, salário/VA) troca clicando na etiqueta. No celular as colunas % e Tipo somem (largura 0).
- **Janelas**: arrastar pelo título; alças direita/baixo/canto redimensionam; alfinete = fixa (trava SÓ o arrastar); − recolhe (ou duplo clique no título); × fecha. Estado por janela em `fin:jan2` (x, y, w, h, pin, min, fechada, z). "Voltar as janelas ao padrão" em Ajustes. Até 860 px de largura viram cartões empilhados (a última aberta em cima) e aparece o botão + flutuante.
- **Mês** = `D.meses["AAAA-MM"]` com `rendas` (dia, `va`), `contas` (categoria, dia de vencimento, `pago`, `rec`, parcelas com `pid/pk/tot`) e `gastos` (dia, forma: `pix`, `din`, `va`, `emerg`, `card:<nome do cartão>`), mais `guardar` (null = automático pelo %, ou valor fixo em centavos). Novo mês copia o anterior ou o modelo (`cfg.modelo`), com ou sem valores; parcelas entram sozinhas com o número certo.
- Compras no cartão somam na fatura do cartão do mesmo mês. VA tem saldo próprio e não entra no dinheiro livre.
- **Dinheiro guardado** (pedido do Tiago): todo mês entra `cfg.guardar.pct`% de (renda − contas) — ou o valor fixo digitado na linha GUARDADO da janela Contas — e sai o que foi lançado como gasto **Emergência** (`emerg`: sai do guardado, não do salário). Saldo acumulado = `cfg.guardar.inicial` + Σ(entrou − saiu) (`N.historicoGuardado`/`N.saldoGuardado`). Janela "Guardado" no menu (saldo, %, histórico, gráfico); o saldo aparece na própria aba do menu.
- **Livre** = renda (sem VA) − contas − gastos Pix/dinheiro − guardado do mês − reserva das metas (`orc`). Meta "até uma data" reserva `aporteNecessario`; meta "X por mês" reserva o aporte e calcula o tempo (`mesesPara`, com rendimento opcional).
- **Assistente** (`N.analisar`): mês no vermelho, usando dinheiro da meta, "não gaste nem mais R$ 1", livre por dia, cartão subindo (média dos 3 últimos meses vs anteriores, +15% e +R$ 30), cartão pesando na renda, contas vencendo/atrasadas, VA, parcelas acabando, metas do mês. Conversa (`N.responder`) entende frases simples ("quero juntar 100 mil" → pergunta quanto por mês). Avisos (toasts) aparecem ao abrir e quando o livre muda.
- **Ctrl+L** (ou Ctrl+K / Cmd+L): busca em ações, telas, janelas, meses, contas, gastos, rendas, metas e parcelamentos.

## Publicar
Trocar `VERSAO` em `app.js`, `CACHE` em `sw.js` e `version.json`; rodar os testes; commit e push.
