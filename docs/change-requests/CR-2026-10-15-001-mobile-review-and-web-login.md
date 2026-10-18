# CR-2026-10-15-001 - Revisao do app e login na previa web

## Pedido e escopo

O usuario pediu iniciar site e aplicativo, revisar as telas do app e deixar
ambos autenticados no navegador do Codex. Autorizou usar a conta existente
que havia fornecido. Nao pediu alterar a senha, publicar codigo, criar
recargas, registrar recebimentos ou ampliar o acesso ao banco oficial.

- Checkout separado: EMPS-Ecosystem-integration-2026-10-13.
- Branch local: `codex/app-review-2026-10-15`, base `6d5c0f8`.
- Sem merge das branches novas de GIE/backend dos colegas.
- Sem commit, push, deploy, alteracao de CORS oficial ou reinicio da VPS.

## Diagnostico do acesso

O app apontava para a API HTTPS oficial com modo demonstracao desativado.
O health respondia, mas o preflight do navegador com origem localhost:8081
era rejeitado com HTTP 500 e sem Access-Control-Allow-Origin. A mesma rota
OPTIONS sem origem respondia 204. Por isso o app mostrava erro de conexao,
nao uma resposta de senha incorreta.

Nao foi tentado adivinhar senhas, recuperar hashes ou transformar o token do
site em uma sessao mobile. O login foi realizado pelo formulario normal do
app e aceito pela API oficial apos corrigir o transporte local.

## Arquivos alterados

Os caminhos da tabela sao relativos a `app/emps-charge/`, exceto quando indicado.

| Arquivo | Alteracao |
|---|---|
| `src/app/(tabs)/index.tsx` | Atualizacao manual e puxar para atualizar; carregamento inicial distinto de lista vazia; erro visivel mesmo com dados anteriores; tentativa novamente; evita busca duplicada apos GPS; cartao da sessao informa estado real e conexao, sem assumir AO VIVO; ajustes de quebra de linha e acessibilidade. |
| `src/app/(tabs)/history.tsx` | Atualizacao ao focar, por gesto ou icone; tratamento de falha sem apagar registros; carregamento e vazio separados; acao de buscar eletropostos; resultado de consulta antiga ignorado pela tela; troca de rotulos que confundiam registros/custos com recibos quitados; resumo com limites de largura. |
| `src/components/session-card.tsx` | Mostra iniciando, carregando, encerrando, pagamento pendente, finalizada ou retirada pendente; pendencias nao recebem check verde; fallback do carregador sem texto undefined; estado no rotulo acessivel e ajustes de quebra. |
| `src/domain/session-presentation.ts` (novo) | Mapeamento compartilhado de estados para texto e tom visual; preserva a separacao entre pagamento concluido e conector ainda ocupado. Nao calcula cobranca nem altera objetos. |
| `src/context/app-context.tsx` | Consulta de estacoes antiga nao encerra o indicador de uma consulta mais nova. Realtime usa a URL HTTPS original, separado da ponte HTTP de consultas. Ownership, autenticacao, tarifas e metodos financeiros preservados. |
| `src/config/runtime.ts` | Opt-in de previa web somente em desenvolvimento. Usa ponte loopback fixa apenas no browser quando habilitada. Nativo e producao continuam na URL normal. Mantem URL independente de realtime. |
| `scripts/web-readonly-preview.cjs` (novo) | Ponte local para login e leituras da API oficial, sem acesso MySQL. Destino HTTPS fixo; bind em 127.0.0.1:8082; host/origem e rotas em allowlist; bearer repassado para validacao oficial; sem cookies, redirecionamentos, cache de respostas ou log de credenciais; timeout e limites de corpo. Nao repete POST. |
| `tests/session-presentation.test.ts` (novo) | Nove casos cobrindo todos os estados, retirada apos pagamento, prioridade de pendencia e ausencia de mutacao dos dados. |
| `tests/web-readonly-preview.test.ts` (novo) | Cinco testes agrupados cobrindo rotas permitidas/negadas, host/origem, autenticacao, preflight, query, cookies, destino fixo, redirect, falha, tamanho e ausencia de repeticao. Apenas fixtures e API falsa; sem registros oficiais. |
| `.env.example` | Documenta flag da previa, desativada por padrao. Nenhum segredo adicionado. |
| `package.json` | Adiciona `preview:web:api` para iniciar a ponte. Nao muda dependencias ou versoes. |
| `README.md` | Instrucoes e limites da previa web, conta existente, banco oficial e diferenca do nativo. |
| `docs/README.md` (raiz) | Indice desta CR. |
| Este documento | Registro de escopo, alteracoes, verificacao e reversao. |

## Configuracao privada e arquivos gerados

- `.env.local` do app, ignorado pelo Git: API oficial, demonstracao false e
  opt-in de previa web true. Sem senha ou token no arquivo.
- Site iniciado pelo perfil remoto somente leitura ja existente, usando
  configuracao privada preexistente. Nao foi copiada para a documentacao.
- Next gerou automaticamente `site/emps-site-main/frontend/next-env.d.ts`,
  trocando imports de tipos `.next/types` por `.next/dev/types`. Nao houve
  edicao manual desse arquivo nem mudanca de comportamento do site.
- Logs e capturas em `output/app-review-2026-10-15/`, fora da publicacao Git.
  A captura autenticada e privada; nao anexar ao repositorio automaticamente.

## Protecoes e efeitos oficiais

A ponte nao e um backend novo de producao. Ela existe somente no PC,
aceita as origens locais da porta 8081 e envia requisicoes ao mesmo destino
HTTPS oficial. Nao desativa validacao de certificado e nao entrega credenciais
de banco. POST e aceito apenas para login, refresh e logout; consultas
protegidas continuam exigindo bearer e autorizacao do backend oficial.

Cadastro, criacao/cancelamento de reserva, payment intents, pagamento,
START/STOP de recarga e desconexao nao sao encaminhados por essa previa.
Nao foram executadas operacoes financeiras nem comandos de equipamento.
O login/renovacao emitem tokens normalmente no sistema oficial: isso pode
gravar registros de autenticacao/refresh na API, nao registros de recarga.

Banco oficial nao foi substituido por copia, nem recebeu seed, reset,
migration, db push, alteracao de usuario, senha, grants, historico ou tarifa.
O GIE e os contratos NestJS/SQL nao foram editados. O site local continua
no perfil somente leitura; o app consulta a API HTTPS oficial.

## Verificacao

- `npm run check`: lint, TypeScript e 48 testes aprovados, zero falhas.
- `git diff --check`: aprovado.
- Preflight da ponte com a origem real do browser: 204 e origem exata permitida.
- Login pelo formulario aceito; inicio mostra a conta autenticada.
- Mapa carregou marcadores e cinco instalacoes da API oficial.
- Historico retornou vazio para a conta, sem gerar recargas para preencher a tela.
- Pagina do app atualizada no navegador; autenticacao persistiu e o historico
  continuou acessivel, sem novo preenchimento da senha. Inicio reaberto ao final.
- Site na porta 3010 confirmado aberto, autenticado e consultando carregadores.
- Servicos locais mantidos: site 3010, API somente leitura 3011,
  Expo 8081 e ponte do app 8082 (esta somente em loopback).

Nao foram validados pagamentos, carregamento fisico, camera, PaymentSheet,
build nativo ou acesso remoto pelo celular. A previa de leitura nao comprova
que esses fluxos estejam operacionais. Dados QA/Demo existentes na API sao
cadastros oficiais ja presentes; nao foram fabricados por esta revisao.

## Reversao e continuidade

Encerrar somente a ponte local e remover/desativar a flag do `.env.local`;
reiniciar o Expo. Nao ha alteracoes SQL a reverter. O login volta a depender
do acesso direto e da origem permitida pela API oficial. O nativo nunca usa
esta ponte. Nao desfazer mudancas de colegas para reverter estes arquivos.

Manter os terminais/processos locais ativos para continuar usando a previa.
A sessao esta sujeita a validade/revogacao normal da API; nao foi criado
login permanente nem desativado o mecanismo de expiracao.
