# CR-2026-10-16-002 - Checkout mobile, Stripe e demonstracao

Data: 16/10/2026. Branch local: codex/app-review-2026-10-15.
Status: implementado e verificado localmente; publicacao/ativacao oficial pendente.

Decisao do usuario nesta entrega: **Nao, manter somente as alteracoes locais**.
Portanto, nao realizar a ativacao descrita abaixo sem nova autorizacao.
O app conectado a API oficial continuara recebendo Pix/carteira indisponiveis
enquanto o servidor mantiver demoPayments=false. O patch local nao muda isso.

## Pedido e escopo

Corrigir a selecao dos tres meios de pagamento no app. Manter cartao na
integracao Stripe Sandbox ja existente. Pix e Apple Pay / Google Pay devem
permitir demonstracao sem dinheiro real, com comprovante em PDF.

Esta entrega nao implementa Pix bancario, Apple Pay nativo ou Google Pay
nativo. Esses nomes no modo Demo sao opcoes ficticias identificadas na tela.
Nao foram criadas transacoes, sessoes ou comandos de equipamento no ambiente
oficial durante estes testes. Nenhuma senha ou chave privada foi alterada.

## Diagnostico confirmado

Uma consulta de leitura da API oficial retornou paymentProvider=stripe,
demoPayments=false e chave publica Stripe de teste. O app desabilitava Pix e
carteira conforme essa resposta. A selecao de metodo e de valor ficava travada
apos autorizar; nao havia caminho claro para cancelar e escolher novamente.

O cartao dependia da chave publica local, embora a API ja entregasse a chave
publica no carregador. A confirmacao de demonstracao exigia duas etapas.
Falhas de vibracao tambem podiam interromper a navegacao apos uma operacao
bem-sucedida. O PDF existente era somente o recibo final aprovado pelo servidor.

## Comportamento implementado

- Metodos em linhas selecionaveis com radio, estado indisponivel e etiqueta Demo.
- Limites predefinidos e outro valor entre R$ 1,00 e R$ 10.000,00; ate duas
  casas decimais, incluindo entrada com virgula. Sem arredondar fracao de centavo.
- Ao trocar metodo ou limite, cancela a autorizacao anterior antes de aplicar
  a escolha. Se o cancelamento falhar, preserva a escolha e apresenta o erro.
- Pix/carteira Demo autorizam pelo backend e solicitam inicio em um toque.
  Nao criam aprovacao financeira apenas na memoria do app.
- Cartao abre Stripe PaymentSheet e aguarda autorizacao confirmada pelo backend.
  Depois, o motorista inicia a recarga. Cancelar a tela nao conta como pagamento.
- Toques repetidos nao iniciam operacoes simultaneas. Repeticoes apos falha de
  rede preservam as chaves de idempotencia e os parametros da mesma operacao.
- Inicio continua validando QR vinculado, conta atual e autorizacao no servidor.
  Troca de conta invalida a operacao anterior. Nao ha bypass de permissao.
- Vibra somente em plataforma nativa e conforme preferencia. Erro de vibracao
  nao bloqueia a abertura da recarga ou do recibo apos encerramento confirmado.

## PDF

Durante uma sessao ativa Pix/carteira Demo, ha a acao Comprovante de teste em
PDF. O arquivo informa sessao, instalacao, carregador, metodo, horario e limite
autorizado. Usa dados da sessao e nao afirma que o limite ja foi consumido.
Traz a identificacao DEMONSTRACAO - SEM VALOR BANCARIO e informa que nenhuma
transferencia bancaria ocorreu. Nao substitui documento fiscal.

O comprovante final continua dependendo de sessao concluida e pagamento
aprovado pelo backend, com os valores de consumo e permanencia registrados.
Sua apresentacao foi reutilizada sem remover as validacoes anteriores.
No nativo, o arquivo e compartilhado pelo sistema, em cache privado com
expiracao dos PDFs gerados apos 24 horas no proximo compartilhamento.
Na web, o compartilhamento oferece o download do arquivo.

Exemplo local sintetico: output/pdf/EMPS-autorizacao-demo-exemplo.pdf.
Nao corresponde a pagamento ou sessao criados no banco oficial.

## Inventario desta entrega

Os caminhos abaixo sao relativos a raiz do repositorio. Mudancas anteriores
de QR, Inicio, mapa, perfil e historico foram preservadas e nao sao novas
implementacoes desta entrega.

| Arquivo | Mudanca |
|---|---|
| app/emps-charge/src/app/checkout.tsx | Nova composicao da tela, metodos, valores, cancelamento/troca, confirmacao unica Demo, estados, acessibilidade e bloqueio de toque duplicado. |
| app/emps-charge/src/domain/checkout.ts | Regras de disponibilidade, identificacao Demo e validacao de valor. |
| app/emps-charge/src/services/checkout-authorization.ts | Operacao de autorizacao/cancelamento/inicio, idempotencia, espera de confirmacao e verificacao da conta. |
| app/emps-charge/src/context/app-context.tsx | Integra a operacao, expoe cancelamento, limpa operacoes ao sair da conta e fornece chave publica da API ao Stripe, inclusive no pagamento final. |
| app/emps-charge/src/services/mobile-api.ts | Cliente do endpoint de cancelamento de intent ja existente no backend. |
| app/emps-charge/src/domain/models.ts | Campo opcional stripePublishableKey em paymentOptions. |
| app/emps-charge/src/services/payment-sheet-core.ts | Inicializacao testavel do SDK e tratamento separado de cancelamento/erro. Aceita somente chave publica de teste. |
| app/emps-charge/src/services/payment-sheet.native.ts | Inicializa Stripe com chave publica fornecida pelo servidor ou fallback local e retorno Expo/deep link. |
| app/emps-charge/src/services/payment-sheet.web.ts | Assinatura compativel; cartao continua restrito ao app nativo. |
| app/emps-charge/src/services/payment-authorization-pdf.ts | PDF de autorizacao Demo, validacao de sessao/vaga/metodo e identificacao sem valor bancario. |
| app/emps-charge/src/services/receipt-pdf.ts | Extrai renderizador reutilizavel; preserva origem e validacao do recibo final. Rotulo do total ajustado de 18 para 16 pontos. |
| app/emps-charge/src/services/receipt-share.ts | Compartilhamento nativo do novo PDF e reutilizacao do cache privado existente. |
| app/emps-charge/src/services/receipt-share.web.ts | Download web do novo PDF. |
| app/emps-charge/src/app/charging.tsx | Acao do PDF Demo, carregamento/erro e vibracao sem bloquear encerramento. |
| app/emps-charge/src/app/receipt.tsx | Aviso explicito de ausencia de transferencia para recibos Demo. |
| app/emps-charge/tests/checkout-screen.test.ts | Quatro testes do JSX real com dependencias nativas/contexto isolados. Nao sao testes de aparelho. |
| app/emps-charge/tests/checkout.test.ts | Dez testes de operacao, cancelamento, retry, conta, disponibilidade e valores. |
| app/emps-charge/tests/mobile-api.test.ts | Regressao do contrato de cancelamento HTTP. |
| app/emps-charge/tests/payment-sheet.test.ts | Tres testes do adaptador Stripe com SDK isolado, chave, cancelamento e erro. |
| app/emps-charge/tests/payment-authorization-pdf.test.ts | Tres testes do PDF, restricoes e textos longos/multiplas paginas. |
| app/emps-charge/README.md | Configuracao, fluxo misto e limites de demonstracao/validacao nativa. |
| site/emps-site-main/backend/src/payment-gateway.service.ts | Opt-in Demo em producao com Stripe de teste, mantendo cartao no Stripe. paymentCapabilities recebe env opcional para testes sem alterar contrato de resposta. |
| site/emps-site-main/backend/.env.example | Documenta ENABLE_DEMO_PAYMENTS=false como padrao e condicoes do modo misto. |
| site/emps-site-main/backend/tests/payment-demo.test.ts | Dois testes de opt-in e roteamento: Pix/carteira no Sandbox, cartao no Stripe. |
| docs/README.md | Indice deste registro. |
| docs/change-requests/CR-2026-10-16-002-mobile-payments.md | Este documento de alteracao e roteiro de ativacao. |

## Backend e ausencia de migracao

A API ja possuia o ramo Sandbox para metodos nao-cartao, o cancelamento de
intent e o registro/liquidacao de sessoes. O patch nao cria endpoints, tabelas
ou migrations. Somente modifica a condicao de anuncio/uso do modo misto:

- Padrao mantido: ENABLE_DEMO_PAYMENTS=false.
- Em producao, true exige PAYMENT_PROVIDER=stripe e STRIPE_SECRET_KEY com
  prefixo sk_test_ ou rk_test_. Chave live nao habilita o opt-in.
- Cartao continua passando pelo Stripe; Pix/carteira usam o Sandbox existente.
- PAYMENT_PROVIDER=sandbox preserva seu comportamento anterior, inclusive
  cartao simulado nesse modo ja existente. Nao e o modo solicitado para a API oficial.
- Nao ha alteracao no GIE, MySQL, schema, conectores fisicos ou calculo tarifario.

## Validacao

- App: lint e TypeScript aprovados; 82 testes aprovados, sem falhas.
- Backend: build aprovado; 136 testes, 128 aprovados e 8 de MySQL opt-in
  ignorados. Os testes rodaram com configuracao isolada, sem banco real e
  sem credenciais Stripe/OCPP/GIE de operacao.
- O comando agregado check:api encontrou EPERM ao regenerar o Prisma no
  Windows: a DLL estava em uso pela API local em execucao. Como o schema nao
  mudou, executaram-se build e testes separadamente com o cliente existente.
  Nao foi interrompido o site do usuario para regenerar uma DLL sem mudanca.
- Bundle iOS atualizado na porta Metro 8083: HTTP 200, incluindo checkout,
  renderizacao do PDF e integracao initPaymentSheet.
- PDF sintetico gerado: uma pagina, texto/valor/identificador verificados por
  extracao e pagina renderizada e inspecionada visualmente, sem sobreposicao.
- Revisao dos hooks, guards assincronos, dependencias, radios, estados de erro
  e dimensoes responsivas do checkout. Nao substitui captura em iPhone real.
- Nao foi realizado pagamento, leitura por camera ou PaymentSheet em aparelho.
  A verificacao de UI automatizada usa dependencias isoladas; nao afirma que
  Pix/carteira ja funcionam na API oficial ainda desativada.

## Plano de ativacao, sujeito a aprovacao

1. Conferir a revisao da API atualmente publicada e o backup recuperavel.
   Comparar e aplicar apenas este patch, preservando alteracoes dos colegas.
   Nao substituir a API inteira pelo checkout local nem copiar arquivos .env.
2. Manter PAYMENT_PROVIDER=stripe e credenciais de teste existentes. Ativar
   ENABLE_DEMO_PAYMENTS=true na API compartilhada. Nao expor chaves no app.
3. Publicar o patch revisado e reiniciar somente a API conforme procedimento
   da hospedagem; confirmar health e as capacidades de pagamento por leitura.
4. Recarregar o app no Expo e consultar novamente o carregador. Validar no
   iPhone a troca dos tres metodos e a abertura/compartilhamento do PDF.
5. Qualquer teste que crie sessao/recebimento no banco oficial deve ser
   combinado separadamente. Mesmo ficticio financeiramente, cria registros
   reais no MySQL e pode seguir o controle operacional existente da instalacao.

O opt-in afeta a API compartilhada pelo site e app, nao apenas este telefone.
Nao protege equipamentos reais por si so: a autorizacao para iniciar uma
recarga continua seguindo a instalacao e o backend existentes.
O navegador local somente leitura permanece sem permissoes financeiras;
este trabalho nao amplia a ponte de preview para gravar no banco.

Rollback funcional: desativar ENABLE_DEMO_PAYMENTS e reiniciar a API remove
novas selecoes Demo. Nao apagar sessoes/pagamentos existentes; conferir
operacoes pendentes antes de desativar. Reverter codigo exige preservar a
compatibilidade com os registros e versoes publicados pelos colegas.

Nenhum commit, push, deploy, alteracao de configuracao oficial, cobranca ou
comando de carregador foi realizado nesta entrega. A ativacao esta pendente.
