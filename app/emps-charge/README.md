# EMPS Charge

Aplicativo do motorista em Expo SDK 57, React Native e Expo Router. Consome a
API NestJS compartilhada em `/mobile/v1`, respaldada pelo MySQL 8.

Inclui login/cadastro, mapa, localizacao opcional, consulta de eletropostos,
QR, acompanhamento de recarga, pagamento Sandbox e historico/recibos. Tokens
nativos usam SecureStore; os detalhes dos contratos estao na documentacao da
API e nos testes de `tests/`.

## Executar no celular

Prepare banco e API pelo [guia da raiz](../../STARTUP.md). Configure `.env`
a partir de `.env.example`, usando o IP da API local no computador ou um
endpoint HTTPS autorizado. `localhost` no celular aponta para o celular.

```powershell
npm ci
npx expo start --lan --clear
```

Um tunel Expo transporta o bundle, nao expoe automaticamente a API. Em outra
rede, a API tambem precisa ser alcancavel. O acesso ao banco oficial nao e
entregue a quem clona este repositorio.

O Expo Go precisa ser compativel com o SDK. Funcionalidades nativas e Stripe
podem exigir um development build; executar no navegador nao valida camera,
mapa nativo, PaymentSheet ou compartilhamento no iPhone/Android. Nao ha build
nativo publicado por esta organizacao do repositorio.

## Previa local pelo navegador

Para consultar a API oficial no navegador sem alterar o CORS da hospedagem,
use `EXPO_PUBLIC_EMPS_WEB_READONLY_PREVIEW=true` no `.env.local` ignorado pelo
Git, mantendo `EXPO_PUBLIC_EMPS_DEMO_MODE=false`. A URL normal da API continua
sendo usada pelo app nativo e pelo realtime autenticado.

Em um terminal, inicie `npm run preview:web:api`. Em outro, inicie o Expo
na porta 8081 e abra `http://localhost:8081`. Reinicie o Expo depois de mudar
as variaveis locais. A ponte escuta apenas `127.0.0.1:8082`, tem destino HTTPS
fixo e aceita somente a origem local da porta 8081. Nao e um servico para deploy.

O login usa a conta existente e emite tokens normalmente na API oficial.
A ponte nao grava senhas, tokens ou conteudo em arquivos. Cadastro, recargas,
reservas e pagamentos nao podem ser criados ou alterados por essa previa;
somente login, renovacao, logout e consultas autorizadas sao encaminhados.
Ela nao recupera senhas, nao ignora permissao de conta e nao fornece dados ficticios.
Para desativar, encerre a ponte e remova a flag local; o padrao e desativado.

## Pagamentos de demonstracao e cartao

O app respeita `paymentOptions` retornado pela API. Pix e carteira digital so
podem ser selecionados quando o servidor anuncia `demoPayments=true` ou o
provedor Sandbox. O cartao continua na integracao Stripe de teste existente;
nao e substituido por uma aprovacao ficticia do cliente.

Para o modo misto, a API precisa de `PAYMENT_PROVIDER=stripe` e
`ENABLE_DEMO_PAYMENTS=true`. Em producao, o opt-in de demonstracao exige chave
Stripe de teste. Isso afeta a API compartilhada pelo site e pelo aplicativo:
a mudanca na hospedagem depende de revisao e publicacao separadas.
Nao habilite `EXPO_PUBLIC_EMPS_DEMO_MODE` para tentar contornar essa etapa.

O checkout cancela a autorizacao anterior antes de trocar metodo ou limite.
Pix/carteira confirmam o teste e solicitam o inicio em um toque; cartao abre
o PaymentSheet e so permite iniciar apos confirmacao do servidor. A chave
publica Stripe de teste vem do carregador, com fallback para a configuracao
publica local. Chaves privadas nunca sao entregues ao app.

Durante uma sessao Pix/carteira Demo, o botao **Comprovante de teste em PDF**
compartilha o limite autorizado e informa que nao houve movimentacao bancaria.
Nao e recibo do consumo final. O comprovante final continua no historico,
somente depois de o backend confirmar o pagamento da sessao encerrada.
Apple Pay / Google Pay nessa opcao sao demonstracoes, nao carteiras nativas.
O PaymentSheet e o compartilhamento precisam de verificacao em aparelho real.

## Verificar

```powershell
npm run check
npm run export:web
```

O primeiro comando executa lint, TypeScript e testes. A exportacao web pode
ser usada para validar o bundle, mas nao substitui testes em aparelho real.
Chaves privadas e configuracoes de producao nunca devem entrar em campos
`EXPO_PUBLIC_*`.
