# CR-2026-10-16-003 - Limpeza e padronizacao da marca EMPS

Data: 16/10/2026. Implementacao no checkout de integracao em uso.
Escopo: identidade visual EMPS no site, app, icones e novos comprovantes.
Sem commit, push ou publicacao na Hostinger nesta entrega.

## Problema

A logo vermelha e a insignia prateada continham residuos escuros, claros e
bordas irregulares no recorte rasterizado. Em fundo branco, especialmente no
PDF, os pixels estranhos ficavam evidentes. As duas copias do site e do app
tinham os mesmos arquivos de origem, portanto o defeito era compartilhado.

## Correcao

Criadas fontes vetoriais da silhueta existente: a logo completa e a insignia.
Nao foi substituida a tipografia por outra fonte. Mantidos desenho, orientacao
e composicao EMPS. Removidos residuos, textura, halo e contorno contaminado.
Os vazados continuam transparentes; o vermelho usa degrade limpo e o prateado
usa cor uniforme #AFB6BD. Foi acrescentado um gerador para manter as variantes
sincronizadas sem corrigir cada copia manualmente no futuro.

O site usa agora SVG no cabecalho e no Web Charge. O menu usa a insignia SVG
como mascara. App e PDFs continuam usando os nomes PNG ja consumidos, agora
com a imagem limpa. Assim nao foi necessario alterar servicos de pagamento
ou geradores de comprovantes. A logo completa PNG ganhou resolucao 2x,
preservando a proporcao 1261:428.

## Arquivos alterados ou criados

| Arquivo | Alteracao |
|---|---|
| assets/brand/emps-logo.svg | Fonte vetorial da logo completa, transparente. |
| assets/brand/emps-symbol.svg | Fonte vetorial da insignia plugue/raio, transparente. |
| assets/brand/README.md | Guia das variantes, geracao, testes e atualizacao nativa. |
| scripts/build-brand-assets.cjs | Gerador deterministico com Sharp, usando as duas fontes vetoriais. |
| app/emps-charge/assets/images/emps-logo-red.png | Logo limpa 2522 x 856, usada pelo Brand e pelos PDFs. |
| site/emps-site-main/frontend/public/emps-logo-red.png | Copia identica da logo PNG para compatibilidade. |
| app/emps-charge/assets/images/emps-icon-silver.png | Insignia limpa 338 x 572 usada pelo Brand compacto e LogoMark. |
| site/emps-site-main/frontend/public/emps-icon-silver.png | Copia identica da insignia PNG para compatibilidade. |
| app/emps-charge/assets/images/emps-app-icon.png | Badge refeito da insignia limpa; 1024 x 1024, fundo escuro opaco, sem canal alpha. |
| app/emps-charge/assets/images/emps-favicon.png | Favicon 256 x 256 derivado do badge limpo. |
| app/emps-charge/assets/images/emps-splash-icon.png | Splash 600 x 600 com badge e margens transparentes. |
| app/emps-charge/assets/images/emps-adaptive-foreground.png | Foreground 1024 x 1024, badge dentro da margem segura. |
| app/emps-charge/assets/images/emps-monochrome.png | Novo derivado Android com insignia branca e vazados transparentes, sem circulo colorido. |
| app/emps-charge/app.json | Somente monochromeImage passa a apontar emps-monochrome.png; demais configuracoes preservadas. |
| site/emps-site-main/frontend/public/emps-logo.svg | Copia publica da fonte da logo para uso web sem perda de definicao. |
| site/emps-site-main/frontend/public/emps-symbol.svg | Copia publica da fonte da insignia para a mascara do menu. |
| site/emps-site-main/frontend/public/icon.svg | Favicon atualizado para a insignia EMPS, substituindo o desenho anterior de E/raio. |
| site/emps-site-main/frontend/components/shell/AppShell.tsx | Apenas src da logo passa de PNG para /emps-logo.svg; tamanho/layout e comportamento preservados. |
| site/emps-site-main/frontend/components/charge/WebCharge.tsx | Apenas src da logo passa de PNG para /emps-logo.svg. |
| site/emps-site-main/frontend/styles/shell.css | mask e -webkit-mask passam da imagem prateada para /emps-symbol.svg, preservando cores e estados do menu. |
| site/emps-site-main/frontend/tests/brand-assets.test.cjs | Cinco testes de dimensoes, consistencia das copias, ausencia de residuos, transparencia/monocromatico e consumidores. |
| docs/README.md | Indice deste registro. |
| docs/change-requests/CR-2026-10-16-003-brand-cleanup.md | Este registro. |

## Cobertura e limites

- Cabecalhos e modulo EMPS na navegacao do site.
- Web Charge no navegador.
- Brand completo/compacto e LogoMark do app, incluindo login e telas que usam
  esses componentes compartilhados.
- Novos PDFs de autorizacao e recibos gerados pelo app a partir do PNG atual.
- Favicon, icone principal, splash e foreground/monocromatico Android.
- A marca GoodWe/SEMS+ e seus arquivos nao foram alterados.
- Nao alteradas copias antigas de projetos fora deste checkout, arquivos de
  identidade Expo/React nao usados, imagens do eletroposto ou relatorios ja
  exportados. Essas imagens historicas nao sao consumidores atuais da marca.

Nao houve mudanca de API, banco, GIE, autenticacao, permissoes, contratos,
pagamentos ou infraestrutura. As alteracoes locais de pagamentos da CR-002
foram preservadas; esta limpeza nao ativa Pix/carteira na API oficial.

## Verificacao

- Frontend: TypeScript e 201 testes aprovados, incluindo os cinco novos.
- App: lint, TypeScript e 82 testes aprovados, incluindo geracao dos PDFs.
- Bundle iOS atualizado servido pelo Metro na porta 8083: HTTP 200; hash MD5
  e dimensoes da nova logo confirmados nos metadados do asset no bundle.
- Conferencia visual no cabecalho/menu da pagina local de carregadores.
- Conferencia no navegador da marca/simbolos em fundo branco e escuro.
- Conferencia por pixels: residuos pretos/brancos/cinza nao fazem parte da
  logo vermelha visivel; vazados e areas externas permanecem transparentes.
- PDF sintetico de teste gerado sem usar banco, renderizado e inspecionado:
  insignia limpa em fundo branco, sem sobreposicoes ou manchas no contorno.
- Derivados do site/app byte a byte identicos nas variantes compartilhadas.

Evidencias locais, ignoradas pelo Git:

- output/brand-review-2026-10-16/brand-preview.png
- output/brand-review-2026-10-16/comprovante-logo-corrigida.pdf
- output/brand-review-2026-10-16/comprovante-logo-corrigida.png

A pagina temporaria usada para captura e as ferramentas da conversao inicial
nao acompanham a publicacao. Nao foi adicionada dependencia de conversao ao
site/app; gerar derivados futuros requer somente Sharp ja instalado no frontend.

## Como visualizar e reverter

Recarregar o site local e o projeto no Expo. A troca de PNG por SVG no site
tambem separa a logo nova da URL PNG que poderia estar no cache do otimizador.
Para icone/splash do aplicativo instalado, gerar um novo build nativo; o Expo
Go nao modifica seu proprio icone no iPhone. PDFs novos recebem a logo nova,
mas PDFs anteriormente baixados nao sao alterados automaticamente.

Reverter apenas os arquivos listados desta CR, preservando o trabalho anterior.
Se remover o PNG monocromatico, retornar tambem a referencia em app.json.
Nenhuma operacao no banco ou rollback de dados e necessaria.
