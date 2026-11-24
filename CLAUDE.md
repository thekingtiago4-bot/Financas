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
- **Telas** (trilho lateral / barra de baixo no celular): Painel · Contas do mês · Metas · Assistente · Ajustes. Cada tela tem suas janelas; trocar de tela esconde as outras. "Criar" (Novo mês, Lançar gasto, Nova conta, Nova renda, Nova meta) abre janelas-formulário por cima de qualquer tela.
- **Janelas**: arrastar pelo título; alças direita/baixo/canto redimensionam; alfinete = fixa (trava SÓ o arrastar); − recolhe (ou duplo clique no título); × fecha (reabre pelo botão Janelas da barra superior). Estado por janela em `fin:jan` (x, y, w, h, pin, min, fechada, z). Reset por tela ou geral (Ajustes). Até 860 px de largura as janelas viram cartões empilhados.
- **Mês** = `D.meses["AAAA-MM"]` com `rendas` (dia, `va`), `contas` (categoria, dia de vencimento, `pago`, `rec`, parcelas com `pid/pk/tot`) e `gastos` (dia, forma: `pix`, `din`, `va`, `card:<nome do cartão>`). Novo mês copia o anterior ou o modelo (`cfg.modelo`), com ou sem valores; parcelas entram sozinhas com o número certo.
- Compras no cartão somam na fatura do cartão do mesmo mês. VA tem saldo próprio e não entra no dinheiro livre.
- **Livre** = renda (sem VA) − contas − gastos Pix/dinheiro − reserva das metas (`orc`). Meta "até uma data" reserva `aporteNecessario`; meta "X por mês" reserva o aporte e calcula o tempo (`mesesPara`, com rendimento opcional).
- **Assistente** (`N.analisar`): mês no vermelho, usando dinheiro da meta, "não gaste nem mais R$ 1", livre por dia, cartão subindo (média dos 3 últimos meses vs anteriores, +15% e +R$ 30), cartão pesando na renda, contas vencendo/atrasadas, VA, parcelas acabando, metas do mês. Conversa (`N.responder`) entende frases simples ("quero juntar 100 mil" → pergunta quanto por mês). Avisos (toasts) aparecem ao abrir e quando o livre muda.
- **Ctrl+L** (ou Ctrl+K / Cmd+L): busca em ações, telas, janelas, meses, contas, gastos, rendas, metas e parcelamentos.

## Publicar
Trocar `VERSAO` em `app.js`, `CACHE` em `sw.js` e `version.json`; rodar os testes; commit e push.
