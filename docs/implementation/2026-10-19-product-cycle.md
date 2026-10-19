# Ciclo de produto - 19/10/2026

## Referencia e limites

Requisitos: PDF EMPS_CONTEXT_TECH_AUDITORIA_PROXIMAS_ALTERACOES fornecido pelo usuario.
Repositorio de trabalho: matheus00M7/emps-ecosystem-macbook. O repositorio e o
estado de producao citados no PDF sao contexto historico, nao destino de envio
nem evidencia de homologacao desta copia. Sem commit, push, deploy, migrations,
seeds, alteracoes de acesso VPS ou escrita no banco oficial neste trabalho.

## Mapa antes das alteracoes

- Navegacao global: frontend/components/shell/{SidebarNavigation,shell-navigation}.
  Perfil, configuracoes e logout ja estao em components/account/ProfileMenu.
- Painel de estacao: frontend/components/dashboard/{AdminDashboard,StationDashboard,
  MonitoringChart,StationNotices,StationFinancialSummary}; ja possui fluxo de
  energia, series com procedencia, filtros, dados ausentes e responsividade.
- Localizacao: frontend/components/stations/{StationLocationFields,
  StationLocationMap,station-location-map}. MapLibre ja instalado, mapa e
  geolocalizacao existentes; falta pesquisa de enderecos.
- GIE: backend/src/gie.service.ts (controller e servico), local-gie-demo.service,
  telemetry.controller (readiness/dataset); frontend/dashboard e StationTelemetry.
  Controle existente por estacao/role nao equivale a restricao por email pedida.
- Web Charge: frontend/components/charge/WebCharge, StripeCard, charge.module.css.
  Fotos publicas usam path; privadas usam StationPhoto e token.
- Fotos: frontend/components/stations/StationPhoto; backend/src/station-photos.
- Identidade: /auth/register -> WebAuthService e /mobile/v1/auth/register ->
  MobileService; ambos usam prisma.user, email normalizado, bcrypt, CUSTOMER e
  validacao de termos. Nao ha necessidade de criar outra tabela/conta.
- Pagamentos: backend/src/payment-gateway.service, session-billing.service,
  tariff-engine, charge-lifecycle.service. Total zero ja libera autorizacao;
  consumo positivo abaixo de 50 centavos e rejeitado sem alterar o total.
  Nova politica para esse intervalo depende da escolha do usuario.
- App: app/emps-charge/src/app; components/ui; context/app-context;
  services/mobile-api, payment-sheet e receipt; API publica preservada.

## Implementacao e aceite local

| Requisito | Resultado neste checkout |
|---|---|
| Painel de estacao inspirado na organizacao GoodWe | Preservados o fluxo, indicadores, series, proveniencia, filtros e estados sem dados que ja existiam nesta copia. GIE separado dos indicadores comuns. Nao houve clonagem de ativos nem reescrita integral do dashboard. |
| Sidebar | Rotas EMPS em primeiro plano, com icones e item ativo. Links externos GoodWe em grupo secundario expansivel. Perfil/configuracoes/logout permanecem no menu de usuario existente. Nenhuma rota EMPS retirada. |
| CSS | Ajustes incrementais em navegacao, busca de endereco e Web Charge: foco, tamanhos de toque, campos, galeria, cards e grade em celular. Tokens e temas existentes preservados. Revisao visual de todas as paginas ainda pendente. |
| Maps | Busca explicita com sugestoes via Photon, selecao e preenchimento de campos/coordenadas no MapLibre ja existente. Requisicoes canceladas ao trocar contexto; timeout e preenchimento manual preservados. Se um resultado nao possui parte do endereco anterior, esse campo e limpo para evitar misturar locais. |
| GIE por email | UI e endpoints privilegiados somente para admin.dev@emps.local. Guard relê email/status atual no banco, nao confia no email do JWT. Permissoes por estacao continuam obrigatorias. Guard inclui replay isolado, readiness e dataset. Telemetria/historico comuns permanecem acessiveis pelas permissoes existentes. |
| Fotos Web Charge | Fotos publicas e privadas passam pelas rotas canonicas, com token somente nas privadas. Respostas 401/403/404 sao diferenciadas; ha nova tentativa e cancelamento de pedidos antigos. Troca de foto/usuario/versao oculta a imagem anterior; object URLs sao liberadas. Sem sessao ha orientacao de login, e o carregamento tem prazo de 15 segundos. |
| Identidade Web/App | Ja usavam a mesma tabela users. Adicionado teste de cadastro web seguido de login mobile, preservando ID, nome e email por emissao real dos DTOs de autenticacao, com rejeicao de email duplicado. O telefone permanece na tabela users; o DTO mobile atual nao expoe esse campo. Sem tabela ou conta paralela. |
| Minimo Stripe | Decisao expressa do usuario: manter total pendente sem aumentar a cobranca. Fluxo congelado retorna pending com motivo e mensagem, persiste o motivo no registro pendente idempotente e nao chama o provedor. Registros com recebimento ja informado nao sao sobrescritos e exigem conciliacao. Fluxo legado com autorizacao manual fica pendente sem captura/cancelamento/estorno. Zero e valores pagaveis preservam comportamento existente. |
| App Expo | Melhorias de foco, leitura de erros, botoes ocupados/desabilitados, quebra de texto, fotos com carregamento/nova tentativa e orientacao sobre identidade EMPS. Falha de haptics nao transforma login/cadastro bem-sucedido em erro. API publica preservada. |
| Distribuicao | eas.json ja possui preview Android APK e perfis de desenvolvimento/producao. Bundle iOS gerado localmente. Nao equivale a IPA/APK instalavel, build EAS ou TestFlight. Nenhuma publicacao realizada. |

A pesquisa de endereco usa HTTPS e nao envia cookies, JWT ou dados de conta ao
geocoder. O texto digitado e enviado somente quando o usuario aciona Buscar.
A interface informa o provedor e pede conferencia dos campos. O endpoint publico
pode ser configurado por NEXT_PUBLIC_EMPS_GEOCODER_URL (somente exemplo publico;
nenhum .env privado modificado). Resultado real da consulta de exemplo publico:
HTTP 200, 2 sugestoes; com Origin, Access-Control-Allow-Origin: *.
Documentacao do servico: https://github.com/komoot/photon e
https://github.com/komoot/photon/blob/master/docs/api-v1.md.
O servidor demonstrativo possui limites e nao garante disponibilidade; em caso
de falha, endereco/coordenadas manuais e mapa continuam disponiveis.

A politica de minimo respeita o limite BRL de R$ 0,50 que ja era usado no codigo,
conferido em https://docs.stripe.com/currencies#minimum-and-maximum-charge-amounts.
Nao cria isencao, arredondamento, agregacao de dividas ou baixa financeira.
A autorizacao abaixo do minimo nao e cancelada por esta nova regra: segue seu
ciclo no provedor. Nenhum recebimento/liberacao ficticio e registrado. Um acerto
posterior deve seguir os mecanismos autorizados existentes; nao foi criado um
fluxo novo de cobranca agregada.

## Revisao corretiva solicitada pelo usuario

Em uma segunda revisao de todo o lote, foram corrigidos estes pontos:

1. A confirmacao de pagamento no App agora verifica a conta antes e depois de
   cada espera assincrona. Uma resposta da conta anterior nao abre PaymentSheet,
   nao conclui a interface da conta atual e nao continua as etapas seguintes.
2. O motivo de valor abaixo do minimo e persistido em failureCode/failureMessage
   e volta no historico da sessao. O aviso permanece apos reabrir o App/Web Charge.
   Repetir a tentativa reapresenta uma pendencia valida; registros aprovados,
   recebidos ou de valor divergente sao preservados para conciliacao.
3. No Web Charge, o aviso temporario e associado ao ID da sessao e desaparece
   quando outra sessao e aberta ou quando ha comprovante. Trocar QR ou usuario
   remonta o checkout e descarta estado privado/Stripe anterior. Chamadas de uma
   tela desmontada sao recusadas antes de enviar novas requisicoes.
4. As fotos do Web Charge recebem a versao informada pela API. Substituir um
   arquivo com o mesmo ID provoca novo carregamento. Sem login, a foto privada
   informa que e necessario entrar; requisicoes lentas deixam o estado de
   carregamento apos 15 segundos, inclusive se a renovacao de sessao nao responder.
   O botao de repeticao da miniatura nativa cabe na area de toque.
5. Revogar a permissao de GIE com a aba Inteligencia selecionada volta a exibir
   o dashboard comum. O dialogo de avisos tambem filtra o conteudo que deixou
   de ser permitido, em vez de manter um aviso selecionado anteriormente.
6. Selecionar outro endereco limpa tambem o complemento antigo. Codigos de pais
   e CEP invalidos nao sao truncados para parecerem valores validos.
7. O teste de identidade compartilhada passou a executar a emissao real dos
   DTOs e refresh tokens dos dois servicos com persistencia/JWT simulados. A
   versao anterior substituia a emissao por uma resposta fabricada e nao
   comprovava o contrato real. O telefone foi conferido como preservado no banco,
   sem afirmar que ele e retornado pelo DTO mobile atual.

Foram adicionados testes de regressao para troca de conta em cada etapa do
pagamento, motivos pendentes apos reload, avisos de outra sessao, checkout
encerrado, versao de fotos, ausencia de login, timeout, revogacao do GIE e
enderecos invalidos. A politica financeira escolhida pelo usuario permanece
inalterada: manter o total original pendente, sem inflar ou dispensar a divida.

## Verificacoes executadas

- Site: 218 testes aprovados, TypeScript sem erros e next build aprovado.
- API: Prisma generate, nest build e 134 testes aprovados; 8 testes MySQL
  opt-in nao executados. Nenhum banco real acessado pelos novos testes.
- App: npm run check aprovado (lint, TypeScript, 87 testes); exportacao web e
  bundle iOS aprovados. Bundle iOS e exportacao web nao comprovam execucao nativa.
- GIE: 11 testes HTTP aprovados; modelos/contratos de controle nao alterados.
- Estrutura: 5 testes aprovados. Total: 455 aprovados, 8 ignorados.
- Verificacao de publicacao sem sinais bloqueantes e git diff --check limpo.
- CI GitHub nao executado: usuario nao autorizou commit/push.

Antes das alteracoes, site e app tinham 201 e 82 testes aprovados. Os testes da
API executados diretamente herdaram flags restritivas do .env de desenvolvimento
e o comando python ausente no macOS, causando seis falhas de ambiente.
O iniciador check:api agora isola as flags dos mocks no processo filho e seleciona
Python da .venv ou python3. Conexao de banco e credenciais reais continuam
removidas; a URL de teste aponta para a porta 1 e MySQL opt-in fica desabilitado.
As flags de seguranca do aplicativo e seus .env nao foram alteradas.
O comando npm run check:api da raiz passou apos esse ajuste.

Avisos remanescentes: dependencias atuais emitem avisos de NO_COLOR/FORCE_COLOR,
exports de tslib/pdf-lib no Expo e depreciacao httpx/Starlette nos testes GIE.
Nenhuma versao de dependencia ou lockfile foi atualizada para suprimir avisos.

## Limites da homologacao

1. A ferramenta do navegador recusou observar a pagina local por politica de
   acesso. A inspeção visual automatica e Console/Network das paginas autenticadas
   nao foi realizada; nao se tentou contornar o bloqueio.
2. Nao havia conta EMPS oficial validada nesta sessao. Cadastro/login cruzado foi
   verificado em teste com persistencia simulada, nao com uma conta real.
3. O defeito original de fotos na hospedagem nao foi reproduzido com sessao
   oficial. Os cenarios corrigidos foram validados em mocks (incluindo 403 e
   troca de imagem). Arquivo ausente no volume remoto exige diagnostico separado.
4. Pagamento abaixo do minimo foi reproduzido/validado por testes locais. Nao
   houve transacao Stripe, disparo de webhook real, comando de carregador ou
   escrita de dados de negocio. Testes existentes de webhook continuam aprovados.
5. Camera, localizacao no dispositivo, QR nativo, PaymentSheet, compartilhamento,
   hardware, EAS Android/iOS e TestFlight exigem homologacao propria.
6. Esta implementacao nao foi enviada ao GitHub nem a Hostinger. As correcoes de
   backend so terao efeito na API oficial depois de revisao, CI e deploy autorizado.
   O App local ainda consulta a API oficial atual, que pode ter comportamento antigo.

## Servicos locais e retomada

No encerramento do trabalho foram iniciados:

- Site: http://127.0.0.1:3000 (Next dev). Seu .env foi preservado e ainda aponta
  para backend local; isso nao configura acesso ao banco oficial. Sem backend
  correspondente, login/dados do painel nao estao homologados.
- App: Expo/Metro na porta 8081, modo LAN/Expo Go. Usado o iniciador existente
  que detecta IPv4 CLAT e anuncia IPv6. A abertura no iPhone depende da rede e do
  login Expo ja configurado; nao foi confirmada nesta etapa.

A API local, banco e GIE nao foram iniciados. Nenhuma alteracao de acesso VPS,
porta/firewall, CORS de producao, secrets, modelo ML, schema, migration, seed,
volume Docker ou dados oficiais.

Para conferir o codigo, na raiz do repositorio:

```sh
npm run check:web
npm run check:api
npm run check:app
npm run check:gie
npm run test:structure
npm run check:publication
```

Iniciar site: npm --prefix site/emps-site-main/frontend run dev -- --hostname 127.0.0.1
Iniciar app: npm --prefix app/emps-charge start -- --lan --go
Para a rede IPv6/CLAT atual, preferir o iniciador Iniciar app no iPhone.command
ja entregue na pasta outputs/EMPS desta conversa. Para parar, Ctrl+C no terminal
de cada servidor ou o iniciador Parar servicos existente. Evitar iniciar uma
segunda instancia na mesma porta. A ponte web de leitura localhost:8082 nao foi
iniciada; a previsualizacao web do app continua com essa dependencia existente.
