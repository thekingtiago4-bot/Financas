/* Finanças. · tema antes de pintar a tela (sem piscar). Arquivo próprio porque a página não tem script embutido (CSP). */
try { var p = JSON.parse(localStorage.getItem('fin:pref') || '{}'); document.documentElement.setAttribute('data-tema', p.tema === 'claro' ? 'claro' : 'escuro'); }
catch (e) { document.documentElement.setAttribute('data-tema', 'escuro'); }
