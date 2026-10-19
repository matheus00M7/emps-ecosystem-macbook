# EMPS - Relatório completo de trabalho e continuidade

**Data de consolidação:** 19/10/2026, fuso America/Sao_Paulo.\
**Destinatário:** desenvolvedor ou ChatGPT que continuará o projeto com o amigo de Matheus.\
**Finalidade:** explicar o ambiente preparado, o código alterado, a revisão corretiva, as evidências, os limites e o próximo trabalho necessário.\
**Estado da entrega:** desenvolvimento local; não houve commit, push, merge ou deploy deste lote.

## 1. Leitura inicial: o que o próximo desenvolvedor precisa saber

O EMPS foi preparado neste MacBook a partir do repositório pessoal privado de Matheus. Depois da preparação, o usuário solicitou melhorias no site, no fluxo Web Charge e no aplicativo Expo com base em um PDF de contexto técnico. Foi implementado um lote local e, em seguida, feita uma segunda revisão de todo o lote, com correções e testes adicionais.

O resultado não deve ser apresentado como uma atualização já publicada na Hostinger. O código local do backend contém mudanças que ainda não existem necessariamente na API oficial. O aplicativo nativo continua configurado para consultar a API oficial atual. Portanto, testar o app pelo Expo não testa automaticamente o backend modificado neste Mac.

**Atenção para a transferência:** os arquivos estão modificados e há arquivos novos ainda não versionados. Clonar a main do GitHub, no estado informado neste relatório, não transfere essas alterações. O próximo desenvolvedor precisa receber uma cópia autorizada do código de trabalho ou aguardar um envio ao GitHub que Matheus autorize expressamente. Este relatório explica o trabalho, mas não substitui o código.

Foram registradas 455 aprovações de testes automatizados: 218 do frontend, 134 do backend, 87 do app, 11 HTTP do GIE e 5 de estrutura. Oito testes MySQL opt-in não foram executados. Também passaram os builds e verificações descritos adiante. Isso não representa homologação visual completa, teste financeiro real, teste com equipamento ou uma release mobile.

Não foram compartilhadas neste relatório senhas, hashes de senha de usuários reais, tokens, conteúdos de .env, chaves SSH, configurações SQL privadas ou dumps. Não há um login EMPS oficial confirmado para fornecer ao próximo agente.

## 2. Repositório, referência de código e prioridade das instruções

- Repositório de trabalho: https://github.com/matheus00M7/emps-ecosystem-macbook.git
- Visibilidade: privada. Acesso do amigo deve ser concedido pelo proprietário por um meio apropriado; não foi concedido pelo assistente.
- Branch local: main.
- HEAD observado: a8e88e4958131e0a59aa6d0e3b621be253e402fa.
- Diretório no Mac: `/Users/matheus/Documents/Codex/emps-ecosystem-macbook`.
- O lote de melhorias e correções está por cima desse HEAD, no diretório de trabalho, sem commit.
- Inventário desta consolidação: 47 arquivos modificados/novos, incluindo documentação. O inventário detalhado está no apêndice.

O PDF de contexto recebido citava o repositório do Tommaso, commits e uma auditoria de produção anteriores. Isso foi tratado como contexto histórico. A instrução direta de Matheus e `docs/change-requests/CR-2026-10-18-002-personal-repository.md` determinam o repositório pessoal acima. Não trocar origin, não enviar código ao repositório do Tommaso e não assumir que branches dos colegas foram mescladas.

Na preparação foram lidos README, documentação de instalação e as CRs relevantes. Há instruções em `site/emps-site-main/frontend/AGENTS.md`: a versão do Next.js exige consultar os guias locais em `node_modules/next/dist/docs/` antes de modificar APIs e convenções do framework. Os guias pertinentes foram consultados no trabalho.

A cópia pessoal contém trabalho posterior ao contexto antigo, inclusive alterações de dashboard, app, ciclo pré-pago e contratos documentados nas CRs. Não foi realizado um redesenho integral desses módulos nem afirmado que todas essas integrações já foram homologadas.

## 3. Arquitetura: três interfaces que não devem ser confundidas

### 3.1 Site administrativo

Diretório: `site/emps-site-main/frontend`. Usa Next.js, React e TypeScript. É o painel de instalações, carregadores, sessões, pagamentos, clientes, alertas, configurações e interfaces de energia/GIE conforme permissões.

O site publicado é https://emps-charge.tech. O site local usa a porta 3000. A configuração local preservada aponta para uma API local, não representa acesso configurado ao banco oficial.

### 3.2 Web Charge ou Subapp

É o fluxo de recarga pelo link/QR em `/charge/[token]`, implementado dentro do frontend Next.js. Pode apresentar estação/carregador, identificação de conta ou visitante quando permitido, autorização de pagamento, sessão, retirada e comprovante. Não é uma segunda aplicação com banco de usuários separado.

Arquivos principais: `components/charge/WebCharge.tsx`, `WebChargeEntry.tsx`, `StripeCard.tsx` e a rota `app/charge/[token]/page.tsx`.

### 3.3 Aplicativo Expo e sua versão web

Diretório: `app/emps-charge`. Usa Expo/React Native. O mesmo projeto pode gerar uma prévia no navegador, mas câmera, localização, PaymentSheet, compartilhamento e outros recursos nativos podem funcionar de modo diferente. A prévia web do app não é o painel administrativo e não é o Web Charge.

O app nativo está configurado para a API pública HTTPS: `https://api.emps-charge.tech`. Não acessa MySQL diretamente. A versão web de desenvolvimento possui uma opção específica de ponte de leitura, explicada na seção de ambiente.

### 3.4 Backend, banco e GIE

- `site/emps-site-main/backend`: NestJS, Prisma, autenticação, contratos mobile/web, sessões, pagamentos e integração operacional.
- MySQL 8: fonte de dados do backend. Banco local e banco oficial são ambientes separados.
- `gie/GIE`: Python/FastAPI e modelos/rotinas de gerenciamento de energia.
- Produção, conforme a auditoria histórica da sessão: Caddy encaminha HTTPS para frontend/API; MySQL e GIE ficam internos. Nenhuma infraestrutura foi reconfigurada por este lote.

## 4. Etapa de preparação do MacBook

O Mac é Apple Silicon ARM64, com macOS 26.6. A preparação foi conduzida com participação do usuário nas janelas que exigiam ação local, como instalação das ferramentas Apple, senha administrativa do Mac e inicialização/permissão do Docker.

| Ferramenta | Versão registrada |
|---|---|
| Apple Command Line Tools / Git | Git 2.50.1, Apple Git-155 |
| Homebrew | 7.0.9, registrado na preparação |
| Node.js | 22.23.3; fórmula node@22 22.23.3_3 observada na consolidação |
| npm | 10.9.9 |
| Python | 3.12.15 |
| libomp | 23.1.3 |
| GitHub CLI | 2.102.0 |
| Docker Desktop | 4.95.0, registrado na preparação |
| Docker CLI / engine | 29.8.2, confirmado na etapa inicial |

Node, npm, Python, Git, arquitetura e macOS foram novamente consultados ao preparar este relatório. Docker não foi iniciado nem revalidado por esta tarefa de documentação; a versão acima é a evidência da preparação.

Foi configurado o PATH do Homebrew e Node 22 em `~/.zprofile`. A autenticação do GitHub CLI foi feita pelo fluxo do próprio usuário, e a credencial ficou no mecanismo local apropriado. Não foi solicitado que ele enviasse senhas ou tokens pelo chat.

Foi executado `npm ci` separadamente no frontend, backend e app, usando seus lockfiles. O GIE recebeu uma `.venv` nova com `requirements-test.txt` e seus includes. Não houve cópia de `node_modules` nem de ambiente Python do Windows. Dependências Python sem pin foram resolvidas conforme os requirements; foi registrado `pip check` aprovado e importação de LightGBM 4.7.0 em ARM64 com libomp.

Não se executou atualização automática de versões para resolver avisos. Os lockfiles dos componentes não foram alterados pelo lote de produto ou por sua revisão corretiva.

## 5. Configuração local, bancos e limites de acesso

### 5.1 Arquivos privados criados na preparação

Os arquivos abaixo são locais e ignorados pelo Git. Foram preservados durante a implementação das melhorias. Não copiar seu conteúdo para outra conversa, commit ou relatório.

| Arquivo | Finalidade e estado relevante |
|---|---|
| `app/emps-charge/.env` | API oficial HTTPS, demo desligada e sem segredo de backend no bundle. |
| `app/emps-charge/.env.local` | `EXPO_PUBLIC_EMPS_WEB_READONLY_PREVIEW=true`; afeta a prévia web em desenvolvimento, não o app nativo. |
| `site/emps-site-main/frontend/.env` | API local na porta 3001 e demo desligada. Não é conexão homologada do painel local com a produção. |
| `site/emps-site-main/backend/.env` | Banco local, segredos locais aleatórios e distintos, provider sandbox e flags restritivas para jobs, hardware e efeitos financeiros. |
| Perfil `.env.remote` privado | Preparação incompleta para um modo de leitura remota. Não é uma configuração funcional de acesso oficial. |

A variável `HOST=127.0.0.1` foi colocada na configuração inicial do backend, mas o listener original do modo local não a usa: ao iniciar esse modo, o backend pode escutar em `0.0.0.0:3001`. Esse comportamento original não foi modificado. Não interpretar a existência de HOST como garantia de bind em loopback.

### 5.2 Banco local criado inicialmente

Docker foi utilizado para inicializar apenas a estrutura SQL local prevista pelo projeto. Foi entregue um override fora do repositório para publicar o MySQL somente em `127.0.0.1:3306`. A etapa inicial registrou MySQL 8.0.46 ARM64 healthy e consultas somente de leitura com zero usuários e zero estações.

Não houve importação de dados oficiais, seed, criação de administrador ou migration Prisma. O volume local foi preservado. Depois, Matheus disse expressamente que queria usar o banco original; o banco local não foi apresentado como substituto do oficial e não foi preenchido para simular as contas reais.

### 5.3 Banco oficial e VPS

Houve uma inspeção de leitura da VPS com o acesso interativo que o usuário disponibilizou. Foram observados frontend, backend, MySQL, Caddy e GIE em contêineres e um perfil de desenvolvimento SSH/SQL restrito já existente. Isso foi uma observação pontual, não uma auditoria atual de toda a produção.

O acesso do computador antigo não veio no GitHub. Preparou-se uma proposta de chave individual do Mac e túnel restrito para leitura. Uma chave local foi gerada, mas Matheus respondeu expressamente: **não alterar o acesso da VPS**. A proposta não foi aplicada: nenhuma chave foi registrada na VPS, nenhum PermitOpen foi ampliado, nenhum usuário SQL foi criado e nenhuma senha oficial foi transferida.

Também houve tentativas de conexão SSH que expiraram em redes usadas durante a sessão. A causa externa não foi conclusivamente determinada. Não foram alterados firewall, isolamento de rede ou CORS de produção para contornar isso.

**Consequência:** o painel local ainda não tem integração confirmada com o banco oficial. O app fala com a API oficial, porém nenhum login EMPS real foi validado pelo assistente. O e-mail `admin.dev@emps.local` foi mencionado pelo usuário e passou a ser a identidade exigida para GIE no código; não foi criada uma conta com esse e-mail nem confirmada uma senha.

### 5.4 Logins são independentes

GitHub, Expo e EMPS são autenticações diferentes. O usuário informou que conseguiu abrir o projeto no Expo após fazer login na CLI com a mesma conta usada no Expo Go. Isso não cria usuário no EMPS, não libera banco de dados e não comprova um login no sistema.

Não foi recuperada senha do banco. O código usa hash de senha; não há uma senha em texto claro entregue neste relatório. Recuperação ou redefinição deve seguir o fluxo legítimo do sistema e autorização adequada.

## 6. Rede, Expo Go, iPhone e prévia web

A sessão passou por várias redes, incluindo redes institucionais e acesso pessoal. Em algumas delas o iPhone não alcançou o servidor do Mac. A mudança de rede também muda o endereço anunciado pelo Expo e exige gerar um QR atual.

Foi identificado um acesso pessoal IPv6 com CLAT, em que o Mac apresentava `192.0.0.2`. Esse endereço não deve ser tratado como um IPv4 LAN comum para o iPhone acessar. O iniciador entregue detecta o intervalo CLAT e, quando disponível, anuncia um IPv6 global do Mac usando `EXPO_PACKAGER_PROXY_URL` com colchetes na URL.

Esse uso da variável apenas ajusta o endereço anunciado pelo Expo. Não cria um túnel público. Matheus recusou explicitamente o túnel temporário do Expo; nenhum túnel público foi ligado para contornar a conectividade.

Depois apareceu uma mensagem específica no iPhone: Expo Go conectado à conta do usuário e Expo CLI sem login correspondente. Foi orientado `npx expo login` no diretório do app e o usuário informou que funcionou. Essa é a evidência de abertura do app relatada pelo usuário; não equivale a teste de todos os recursos nativos.

Foram criados QRs durante as tentativas, mas eles contêm endereços daquela rede e podem estar obsoletos. Usar o QR do servidor atual. O atalho `Iniciar app no iPhone.command` detecta a rede no momento em que é executado e evita abrir uma segunda instância se a porta 8081 estiver ocupada.

A prévia web de leitura do app usa `scripts/web-readonly-preview.cjs`, com bind em loopback na porta 8082 e lista limitada de rotas. Seu contrato aceita login/consultas e bloqueia mutações operacionais. Ela não foi ampliada para LAN ou internet. A configuração web aponta para `127.0.0.1:8082`; no Safari do celular, esse endereço significa o próprio celular. Por isso, compartilhar somente a URL do Metro não torna o login dessa prévia web funcional no iPhone.

## 7. Escopo solicitado e o que já existia

O usuário enviou um PDF de contexto, auditoria e próximas alterações. Ele descrevia navegação, dashboard inspirado em organização GoodWe, revisão de CSS, busca de endereços, GIE exclusivo por e-mail, fotos e identidade do Web Charge, erro de valor mínimo Stripe, melhoria do app e auditoria.

A investigação mostrou que esta cópia já tinha um dashboard de estação com fluxo de energia, séries, filtros, métricas com procedência, estados sem dados e componentes responsivos. MapLibre, mapa de localização e geolocalização também já existiam. Perfil/configurações/logout já estavam no menu de usuário. Esses pontos foram preservados, evitando afirmar como novidade um trabalho já presente.

O trabalho implementado acrescentou o que foi identificado como necessário nesse lote e corrigiu fluxos afetados. Não se fez uma reescrita geral de todas as páginas, não se clonou código proprietário GoodWe e não se homologou todo o ecossistema. A referência visual do PDF não foi usada para substituir indiscriminadamente o design recente desta cópia.

## 8. Alterações no site administrativo e no mapa

### 8.1 Navegação principal

`SidebarNavigation.tsx` foi reorganizado para apresentar as rotas EMPS como navegação principal, com ícones e estado ativo. Recursos externos GoodWe foram reunidos em um grupo secundário expansível. Os destinos desses recursos foram preservados; perfil e ações da conta continuam no menu existente.

O CSS da barra foi ajustado para marca EMPS, expansão, rolagem e altura do grupo secundário. A lista funcional EMPS não foi eliminada. A separação entre navegação global e abas da estação foi preservada, sem criar uma arquitetura nova de rotas.

### 8.2 Busca de endereços

Foram criados `StationAddressSearch.tsx` e `station-address-search.ts` e integrados a `StationLocationFields.tsx`.

O usuário digita um endereço e aciona Buscar. O serviço Photon retorna até cinco sugestões. Selecionar uma sugestão preenche latitude, longitude e os campos de endereço que estiverem presentes e forem válidos. O mapa existente recebe as coordenadas pelo mesmo estado do wizard.

A pesquisa é explícita, não um autocomplete que dispara em cada tecla. Há tamanho mínimo de texto, limitação de tamanho, estado de busca, timeout de dez segundos, cancelamento ao trocar consulta/contexto e mensagens de falha ou ausência de resultados. O formulário manual e o mapa permanecem utilizáveis se a busca falhar.

A seleção cancela uma geolocalização pendente. Campos ausentes no novo resultado, incluindo complemento, são limpos para não combinar a rua nova com número/CEP/complemento do local anterior. Dados de nome da estação e demais configurações não são substituídos pela busca.

O parser verifica geometria Point, números finitos, limites de latitude/longitude, elimina resultados duplicados, normaliza UFs brasileiras e aceita CEP brasileiro somente quando o formato recebido é válido. Códigos de país malformados não são truncados para parecerem válidos. O formulário atual mantém suas validações de CEP/UF; não foi prometido suporte completo a endereços internacionais.

### 8.3 Serviço externo e configuração

O endpoint padrão é `https://photon.komoot.io/api/`. Foi adicionado ao `.env.example` o nome público `NEXT_PUBLIC_EMPS_GEOCODER_URL`, aceitando um endpoint compatível HTTPS. Não se colocou chave secreta no cliente nem se modificou um .env privado neste lote.

A busca omite cookies e credenciais de conta e usa política sem referrer. A interface informa que o texto da busca será enviado ao Photon/OpenStreetMap e exibe a atribuição. Não envia JWT, senha ou coordenadas privadas automaticamente.

Uma consulta de exemplo com endereço público retornou HTTP 200 e sugestões. Uma requisição com Origin recebeu cabeçalho CORS apropriado. Isso comprova o serviço consultado naquele teste, não disponibilidade garantida nem navegação visual completa do wizard.

O endpoint público é demonstrativo e tem limites de uso/disponibilidade. Um uso maior exige avaliar um serviço adequado ou instância própria; nada disso foi contratado ou implantado.

Referência técnica: https://github.com/komoot/photon e https://github.com/komoot/photon/blob/master/docs/api-v1.md.

## 9. Restrição de GIE em duas camadas

### 9.1 Política definida pelo usuário

Somente a conta de e-mail `admin.dev@emps.local` deve ver e utilizar as interfaces/ações de GIE abrangidas pelo lote. Isso não concede acesso a estações que a conta não pode acessar e não cria essa conta automaticamente.

### 9.2 Backend

Foi criado `src/gie-access.ts`, contendo `GieAccessGuard`, registrado no módulo do backend. O guard lê o usuário autenticado e consulta novamente email e status da conta no Prisma. Exige conta ACTIVE e e-mail correspondente. Não usa apenas o e-mail contido no JWT para liberar GIE.

O guard foi aplicado ao controller GIE, incluindo state, health, modos, apresentação, eventos de demo e mapeamentos, e aos endpoints privilegiados de readiness/dataset da telemetria. O caminho de replay isolado também passa pela restrição do controller. As proteções existentes de JWT, escopo de estação e operações continuam presentes.

### 9.3 Frontend

Foram criados `domain/gie-access.ts` e `use-gie-access.ts`. O hook acompanha mudanças de sessão e começa sem autorização até que a identidade do navegador seja conhecida. A checagem visual não substitui o guard do backend.

`AdminDashboard`, `StationDashboard`, `StationNotices` e `StationTelemetry` passaram a separar GIE do uso comum do painel. Badge, aba de inteligência, controles, prontidão, dataset, contrato e avisos GIE são condicionados à autorização. Telemetria e histórico comuns continuam disponíveis conforme as permissões existentes.

Na revisão corretiva, foi resolvido o caso de a permissão ser removida com a aba Inteligência selecionada: o conteúdo visível volta ao dashboard normal. O diálogo de avisos também usa a lista filtrada; não mantém o detalhe de um aviso GIE selecionado antes da mudança de permissão.

Não foram alterados modelos de ML, otimizadores, pesos, contratos do serviço Python ou modos de execução do GIE. A alteração é de acesso/interface e requer deploy futuro do backend para valer na API oficial.

## 10. Fotos do site, Web Charge e app

### 10.1 Web Charge e frontend

O Web Charge passou a usar o componente de foto para imagens públicas e privadas. As rotas canônicas são `/public/station-photos/:id` e `/v2/station-photos/:id`. Token de conta é enviado somente na rota privada. Não foi aberta a rota privada nem removida a autorização do backend.

O componente faz fetch sem cache, cria object URL para a imagem e a revoga ao trocar contexto/desmontar. Respostas 401, 403 e 404 geram mensagens distintas; falhas transitórias oferecem nova tentativa. Sem uma sessão, informa a necessidade de login em vez de ficar indefinidamente em carregamento.

O estado é associado à foto, identidade, versão e tentativa. Alterar o usuário, a imagem ou a versão deixa de apresentar a imagem anterior. A versão recebida no path da foto é passada pelo Web Charge: substituir um arquivo mantendo o mesmo ID provoca um novo download.

Há timeout de 15 segundos, inclusive quando a obtenção/renovação da autenticação demora. Uma resposta atrasada ou evento de erro da imagem anterior não deve substituir a imagem do contexto atual.

### 10.2 App nativo

O componente de foto do app passou a mostrar carregamento, falha e nova tentativa em vez de somente um ícone silencioso. Conserva a proteção contra mostrar imagem de outra foto/conta. O botão de repetição em miniatura foi ajustado para caber na área de toque.

### 10.3 Limite da conclusão

Foram testados cenários de rota pública/privada, autorização, erro, troca de foto/versão e timeout com mocks. Não foi reproduzido o defeito original das fotos na hospedagem com uma conta oficial autenticada. Se o arquivo estiver ausente no volume remoto, se houver contrato diferente na API publicada ou outra falha de produção, ainda será necessário diagnosticar esse ambiente. Não se deve afirmar que todas as imagens da Hostinger foram homologadas por este trabalho.

## 11. Identidade compartilhada entre Web Charge e app

A análise encontrou dois endpoints de registro, `/auth/register` e `/mobile/v1/auth/register`, mas ambos usam a mesma entidade Prisma user/tabela users, e-mail normalizado, bcrypt, validação de confirmação/termos e papel CUSTOMER. Não foi criada tabela de usuário paralela nem um mecanismo de duplicar contas.

Foi adicionado teste de cadastro pelo serviço web e login pelo serviço mobile usando a mesma persistência simulada. A versão final executa os métodos reais de emissão dos DTOs e refresh tokens dos dois serviços, mantendo banco e assinatura JWT simulados. Confere o mesmo ID, nome e e-mail, preservação do dado de telefone na linha de usuário e recusa de e-mail duplicado.

Esse teste foi melhorado na revisão porque a primeira versão substituía a emissão de autenticação por uma resposta construída no teste. A primeira versão não comprovava o contrato de retorno real. Na versão corrigida não se afirma que telefone é retornado pelo app: o DTO mobile atual ainda expõe ID, nome e e-mail, não o campo telefone.

Cadastro/login com conta oficial e associação de histórico real não foram realizados. Os testes não autorizam concluir que toda a produção já está na mesma versão desses contratos.

## 12. Pagamento abaixo do mínimo: decisão e implementação

### 12.1 Decisão expressa

Foi perguntado ao usuário qual comportamento desejava para consumo positivo menor que o mínimo do cartão. Ele escolheu: **manter o total pendente, sem aumentar a cobrança**. Não houve autorização para isentar o consumo, arredondar para o mínimo, acumular automaticamente outras dívidas ou criar uma cobrança agregada.

O código já utilizava R$ 0,50 como limite BRL e essa referência foi conferida na documentação Stripe durante a implementação. O contexto continua sendo Stripe Sandbox. Uma conta/configuração diferente exige conferir as condições aplicáveis antes de uma futura release financeira.

Referência: https://docs.stripe.com/currencies#minimum-and-maximum-charge-amounts.

### 12.2 Sessão com cobrança congelada

`payment-minimum.ts` centraliza a identificação de um valor positivo em centavos inteiros abaixo do mínimo, o código `BELOW_PROVIDER_MINIMUM` e a mensagem de pendência.

Em `SessionBillingService.pay`, depois das verificações de titularidade e cobrança congelada, o caminho Stripe abaixo do mínimo entra em transação com bloqueio da sessão. Mantém WAITING_PAYMENT e usa a chave idempotente `v1-session-<id>` para registrar a pendência com o valor original e o motivo em failureCode/failureMessage. Não faz create, capture, cancel ou refund no provedor por esse novo caminho.

Na revisão, foram adicionadas verificações para não sobrescrever registros com recebimento, paidAt, estado financeiro incompatível, sessão divergente ou valor divergente. Esses casos devolvem conflito para conciliação. Uma tentativa repetida de uma pendência elegível não duplica o registro; uma rejeição/cancelamento elegível pode ser reapresentado como pendência, preservando as verificações financeiras.

A resposta contém status pending, provider, reason, amountDue e message. A sessão não recebe aprovação fictícia. Sessão já concluída conserva o caminho de conclusão existente.

### 12.3 Fluxo legado

No gateway, o caso de autorização manual Stripe em requires_capture com total abaixo do mínimo retorna pending sem solicitar captura, cancelamento ou estorno. Esse resultado leva o motivo da pendência para a persistência do fluxo legado.

Casos de zero e valores pagáveis preservam seus caminhos existentes. O novo comportamento não se estende como uma política financeira nova ao provider de simulação. Nenhuma tarifa ou valor de energia foi recalculado para encaixar no gateway.

### 12.4 Histórico e interfaces

`MobileService` inclui `paymentPending` na apresentação de uma sessão pendente cujo pagamento tem o motivo correspondente. O app valida esse objeto na normalização do histórico e o recibo/tela da sessão o apresenta. O Web Charge também apresenta o motivo recebido do servidor.

O aviso temporário do Web Charge é vinculado ao ID da sessão e não aparece depois em outra sessão ou em um comprovante concluído. O motivo persistido pode reaparecer após fechar e reabrir a interface, desde que o backend em uso tenha esta implementação.

### 12.5 O que essa regra não faz

Não baixa a dívida, não captura dinheiro abaixo do mínimo, não cria saldo fictício e não cancela automaticamente a autorização por esta nova regra. A autorização segue seu ciclo no provedor. Um acerto posterior precisa seguir mecanismo autorizado existente ou nova decisão de produto. A dívida não foi agregada a uma cobrança futura automaticamente.

Não houve transação Stripe real ou Sandbox remota, acionamento de webhook real nem escrita no banco oficial nesta implementação. Os caminhos foram exercitados em testes locais com persistência/provedor simulados. A compatibilidade com a API implantada ainda precisa ser validada antes do deploy.

## 13. Segurança de sessão e melhorias do app

### 13.1 Pagamento depois de trocar de conta

Foi extraído `src/services/session-payment.ts`, com a função `payOwnedSession`, usada pelo contexto do app. Ela verifica se a autenticação ainda corresponde à conta que iniciou o fluxo antes e depois das esperas assíncronas: retirada, atualização de histórico, solicitação de pagamento, carregamento do carregador, confirmação do provedor e polling.

Uma resposta de uma conta anterior não pode abrir PaymentSheet na conta atual ou marcar a interface da conta atual como concluída. O pagamento só é mostrado como concluído após o histórico do servidor confirmar a mesma sessão, com a autenticação ainda vigente. Cancelamento do usuário retorna sem alegar aprovação.

### 13.2 Isolamento do Web Charge

A rota usa `WebChargeEntry`, que acompanha o ID da conta por useSyncExternalStore. A chave do checkout depende de QR e conta: trocar um deles remonta o estado privado/Stripe; uma simples renovação do token da mesma conta não provoca esse reset.

As funções de requisição do checkout verificam se a tela ainda está montada antes de iniciar chamadas e depois de operações aguardadas. Uma tela encerrada não deve seguir enviando novas requisições de pagamento. O acesso de visitante existente continua usando seu contrato de token, sem criar uma identidade paralela.

### 13.3 Formulários e feedback

- Login evita envio vazio, usa e-mail sem espaços externos, bloqueia edição durante a solicitação e explica que a conta EMPS é diferente da conta Expo.
- Login/cadastro não tratam uma falha do feedback tátil como falha de uma autenticação que já deu certo.
- AppButton informa estado ocupado/desabilitado para acessibilidade e permite quebra adequada do texto.
- AppInput mostra foco, preserva style e callbacks recebidos, sinaliza erro e respeita edição desabilitada no controle de senha.
- Fotos e mensagens pendentes receberam os tratamentos descritos nas seções anteriores.

Não foi refeito todo o visual do app, não foram mudados seus contratos de negócio gerais e não foram instaladas novas bibliotecas para esses ajustes.

## 14. Verificações, evidências e alcance dos testes

| Componente | Resultado final registrado | O que permanece fora dessa prova |
|---|---|---|
| Frontend | 218 testes; TypeScript; next build aprovados | Navegação visual completa, Console/Network autenticados e todas as larguras de tela |
| Backend | Prisma generate e Nest build; 134 testes aprovados | Oito testes MySQL opt-in não executados; integração com banco oficial |
| App | Lint, TypeScript e 87 testes aprovados | Câmera, localização, QR nativo, PaymentSheet e demais fluxos reais no aparelho |
| Exportação web | Aprovada | Publicação/hosting e equivalência completa com recursos nativos |
| Bundle iOS | Exportação local aprovada | IPA instalável, assinatura, EAS Build, TestFlight e App Store |
| GIE | 11 testes HTTP aprovados | Equipamento, telemetria real, modelos em operação e treinamento |
| Estrutura | 5 testes aprovados | Auditoria exaustiva de segurança |
| Publicação | Verificador sem sinais bloqueantes nas regras existentes | Garantia absoluta de ausência de informação privada |
| Git | diff --check sem problemas de whitespace | Commit, push, merge e CI remoto não realizados |

**Total registrado: 455 aprovações e 8 testes MySQL ignorados.** As verificações foram realizadas nas etapas do trabalho e consolidadas pelos logs e código. Não se executou novamente toda a suíte apenas para escrever este relatório.

Foram consultados novamente os logs finais: frontend 218/0 falhas; app 87/0 falhas; backend 134/0 falhas e 8 skips. Foram conferidos os registros de build Next, exportação web e bundle iOS. GIE/estrutura são os resultados da etapa correspondente, sem mudanças nos seus testes/algoritmos por esta revisão.

Os testes novos cobrem permissões GIE, claims de e-mail antigos, conta inativa, identidade web/mobile, limites monetários, repetição de pendência, preservação de recebimento, troca de conta em cada etapa do pagamento, motivos após reload, troca de sessão/QR, checkout desmontado, versão/timeout de foto e endereço malformado.

### 14.1 Correção do iniciador de testes da API

Na preparação, seis testes da API falharam por ambiente: flags restritivas locais interferiam nos mocks e um teste procurava o comando python, ausente naquele PATH do Mac.

`scripts/check-component.cjs` foi ajustado para isolar o processo filho de testes. Ele usa URL de banco fictícia em `127.0.0.1:1`, desliga os testes MySQL opt-in, remove configurações remotas/credenciais reais e define placeholders apenas para os testes. As flags necessárias para exercitar os mocks ficam somente nesse processo filho. O Python é selecionado pela .venv do GIE quando disponível, com fallback adequado ao sistema.

Isso não muda os .env do servidor nem é uma orientação para ligar hardware ou pagamentos reais. Não copiar as flags de teste para o ambiente de aplicação.

### 14.2 Avisos não resolvidos por upgrade

Permaneceram avisos de NO_COLOR/FORCE_COLOR, exports de tslib/pdf-lib no Expo e depreciação httpx/Starlette nos testes GIE. Não foi executado npm audit fix --force nem atualização de lockfile para suprimi-los.

## 15. Iniciar, parar e repetir as verificações

Os comandos abaixo assumem que as dependências já foram preparadas. Adapte apenas o caminho do repositório ao computador de destino e consulte README/AGENTS. Não usar uma URL de banco oficial para fazer uma inicialização local.

### 15.1 Checagens na raiz

```sh
npm run check:web
npm run check:api
npm run check:app
npm run check:gie
npm run test:structure
npm run check:publication
git diff --check
```

`check:gie` requer a .venv já instalada. `check:api` foi preparado para os testes isolados descritos acima; os testes de MySQL continuam opt-in e não devem ser habilitados contra produção.

### 15.2 Site local

```sh
npm --prefix site/emps-site-main/frontend run dev -- --hostname 127.0.0.1
```

Endereço: `http://127.0.0.1:3000/login`. A porta pode estar ocupada por uma instância existente. Esse frontend local continua apontando para backend local; abrir a página não significa que as contas oficiais funcionem nela.

### 15.3 App nativo no Expo

```sh
cd app/emps-charge
npm start -- --lan --go
```

Em outro Terminal no diretório do app, quando necessário, executar `npx expo login` e entrar interativamente com a mesma conta do Expo Go. Não colar senha no chat. Usar o QR atual e uma rede em que o iPhone possa alcançar o Mac.

No Mac deste trabalho, preferir o atalho `Iniciar app no iPhone.command` já entregue para lidar com a rede CLAT/IPv6. Esse atalho inclui caminhos deste Mac; não copiar seu caminho absoluto para Windows sem adaptar. Não ligar túnel público, pois o usuário recusou essa alternativa.

### 15.4 Prévia web do app

O atalho `Iniciar aplicativo.command` inicia ponte de leitura 8082 e Expo web em loopback 8081. Essa modalidade é limitada às rotas de login/consulta permitidas pela ponte e depende da sua configuração de prévia. Não representa autorização para criar contas, pagar ou comandar carregadores pela ponte.

### 15.5 API, MySQL e GIE locais

Os atalhos `Iniciar API local.command`, `Iniciar banco local.command` e seus equivalentes de parada foram entregues fora do repositório. Não foram usados para preencher dados oficiais. O GIE exige configuração coerente de estação, token e ambiente; o ID de exemplo não deve ser tratado como uma estação real existente.

Este relatório não orienta iniciar esses serviços contra a VPS. O usuário rejeitou o uso do banco local como substituto do oficial; decidir e autorizar um ambiente de integração é uma etapa separada.

### 15.6 Parada

Usar Ctrl+C no terminal de cada servidor. O atalho `Parar serviços.command` tenta encerrar somente processos do clone nas portas previstas; não apaga dados ou volumes. `Parar banco local.command` para o banco local preservando o volume. Nunca usar `docker compose down -v` como procedimento comum de parada.

### 15.7 Estado observado ao consolidar este relatório

Havia listeners do Next em `127.0.0.1:3000` e do Metro em `*:8081`. Não havia listeners observados nas portas 8082, 3001 e 8510. Isso é apenas a fotografia de processos daquele momento: não é teste HTTP, login ou comprovação de uma conexão com banco. O estado do Docker/MySQL não foi novamente auditado nesta tarefa documental.

## 16. Pendências, limites e riscos concretos para a continuidade

1. **Código não transferido:** obter de Matheus uma cópia autorizada do estado de trabalho. Há módulos novos que não aparecem em um git diff simples sem tratamento de arquivos não versionados. Não esquecer esses arquivos ao revisar/transferir.
2. **Integração do painel local:** continua sem acesso oficial validado. Matheus recusou alterar acesso da VPS. Uma futura proposta precisa ser específica e autorizada, sem abrir MySQL/GIE publicamente.
3. **Conta de teste:** não há usuário/senha EMPS oficial validado nesta sessão. O e-mail permitido para GIE não foi provisionado. Não inventar credenciais nem redefinir senha casualmente.
4. **Inspeção visual:** a ferramenta de navegador recusou acesso à página local por política. Não houve contorno do bloqueio; revisão visual completa, Console e Network das telas autenticadas permanecem pendentes.
5. **Fotos de produção:** não foi comprovada a causa do defeito original hospedado. Validar rota, autorização, arquivo, volume e versão publicada com uma conta autorizada antes de afirmar correção completa em produção.
6. **Financeiro:** os cenários foram simulados. Validar o comportamento no ambiente apropriado antes de release, incluindo webhook e estados já existentes, preservando o valor original e a conciliação.
7. **Privacidade GIE:** a proteção só vale na API em que esse backend for implantado. UI local escondida não protege endpoints antigos publicados. Guard e interface devem ser entregues de forma coordenada.
8. **Telefone/perfil:** o telefone foi preservado na tabela compartilhada no teste; o DTO mobile atual não o expõe. Uma tela completa de edição/sincronização de todos os campos não foi implementada por este lote.
9. **Aparelho/hardware:** ainda faltam testes reais de câmera, QR, localização, PaymentSheet, recibo/compartilhamento, conectores e início/parada de recarga.
10. **Distribuição:** `eas.json` já tinha preview APK e perfis de desenvolvimento/produção. Nenhum APK ou IPA instalável foi entregue e nenhum EAS Build/TestFlight foi solicitado ou publicado pelo assistente.
11. **Auditoria ampla:** os testes e a leitura do lote não provam que não existem outros bugs. As pendências de integração e ativação documentadas nas CRs continuam aplicáveis.
12. **CI e deploy:** não houve CI remoto deste lote porque não houve push. Não declarar 4/4 checks verdes do novo lote com base nos checks históricos do PDF antigo.

## 17. O que permaneceu intacto

Não houve commit, push, merge, deploy Hostinger, execução de script de atualização no servidor, mudança de acesso da VPS, nova permissão SSH/SQL, troca de senha oficial, abertura de portas internas, flexibilização de CORS de produção, migration, seed, reset, dump/reimportação ou escrita em dados oficiais.

Não foram enviados comandos a carregadores, executadas cobranças reais ou acionadas integrações físicas. Nenhum segredo foi incluído em bundle mobile ou arquivo versionado. Os .env privados foram preservados durante o lote de produto e a revisão. Os lockfiles não foram atualizados.

Modelos, otimizadores e código Python do GIE não foram modificados. O dashboard energético existente foi preservado em sua estrutura funcional. Não houve uma alegação de integração oficial/homologada com GoodWe/SEMS+ apenas por usar referências visuais ou links.

Os arquivos de orientação iniciais de 18/10 descrevem a fase em que o código ainda estava limpo. Depois houve este lote de mudanças autorizado em 19/10. Se um relatório inicial disser que o git estava limpo e o presente disser que há alterações locais, são momentos diferentes; prevalece o inventário atual para a continuidade.

## 18. Próximos passos recomendados para o amigo

Primeiro, ler este relatório, README, AGENTS e as CRs locais, obter o código completo do lote e comparar sua base com o HEAD informado. Conferir todos os arquivos novos antes de tentar compilar. Não presumir que a main remota ou o backend hospedado já os contém.

Depois, repetir os checks nos ambientes adequados, revisar especialmente autorização GIE, persistência de pendência, troca de usuário e fotos. Preparar uma forma autorizada de testar as telas autenticadas sem contrariar a decisão de acesso à VPS nem escrever em produção por conveniência.

Na validação visual, percorrer site administrativo, wizard, dashboard, Web Charge e app em tamanhos de tela reais. Conferir estados de espera/erro/vazio, navegação, fotos, mudança de conta e consumo abaixo do mínimo. Registrar falhas reproduzíveis e não atribuir ao app uma limitação de rede ou uma versão antiga de API sem evidência.

Só depois de autorização explícita para publicar, organizar uma entrega de código com revisão, CI e processo de deploy do projeto. O PDF de contexto cita scripts operacionais existentes; sua presença e adequação no servidor devem ser conferidas pelo responsável antes de usá-los. Não executar migrations/seeds automaticamente. Mudanças apenas no Expo não atualizam o app instalado nem exigem, por si, rebuild da VPS; a distribuição mobile tem seu próprio fluxo.

### Texto para abrir a próxima conversa

```text
Quero continuar o projeto EMPS a partir do relatório completo de 19/10/2026 e do código correspondente.
Use o repositório pessoal matheus00M7/emps-ecosystem-macbook, sem enviar nada ao repositório do Tommaso.
Antes de editar, confira README, AGENTS, CRs e o inventário do relatório. As mudanças descritas estavam locais, sem commit/push/deploy; não presuma que chegaram ao GitHub ou à API da Hostinger.
Revise os contratos e repita as verificações possíveis. Priorize validar as pendências de UI, conta oficial, fotos e pagamentos em ambiente autorizado.
Preserve a decisão financeira: valor positivo abaixo do mínimo continua pendente, sem aumentar a cobrança ou dispensar a dívida.
Não exponha credenciais, não altere acesso VPS, não abra banco/GIE, não execute migrations/seeds, não grave em produção e não faça commit/push/deploy sem minha autorização específica.
Ao concluir, separe código implementado, testes automatizados, validação manual e o que de fato foi publicado.
```

## 19. Fontes e rastreabilidade desta consolidação

Este documento foi produzido com leitura do estado Git, arquivos modificados/novos, módulos pertinentes, logs finais dos checks e relatórios locais da própria sessão. Também incorpora decisões expressas de Matheus sobre repositório pessoal, preservação da produção, recusa de novo acesso VPS/túnel público e política de valor pendente.

Fontes locais principais: README, `docs/MACBOOK_SETUP.md`, CR-2026-10-18-002, `docs/implementation/2026-10-19-product-cycle.md`, relatório inicial de preparação, proposta remota não aplicada e código/lockfiles dos componentes. O PDF técnico recebido orientou o escopo, mas suas afirmações de produção/CI não foram convertidas automaticamente em evidência atual.

Este relatório não é uma autorização de acesso, uma migração, um deploy ou uma certificação de segurança. Ele é o registro de continuidade do trabalho e deve acompanhar a versão correta do código.

## 20. Apêndice: inventário completo de arquivos

Os caminhos a seguir são relativos à raiz do repositório. M significa arquivo já versionado e modificado; N significa arquivo novo ainda não versionado. A impressão SHA-256 abreviada é uma referência de integridade deste conteúdo local, não um commit. Mudanças posteriores alteram essas impressões.

### 20.1 Aplicativo Expo

**01. [M] `app/emps-charge/src/app/(auth)/login.tsx`**\
Validação de campos, e-mail aparado, bloqueio de edição em espera, orientação de conta e isolamento de falha tátil.\
SHA-256 (12 primeiros caracteres): `094e197f5a39`.

**02. [M] `app/emps-charge/src/app/(auth)/register.tsx`**\
Falha no feedback tátil deixa de transformar cadastro/autenticação bem-sucedidos em erro de interface.\
SHA-256 (12 primeiros caracteres): `987136ce8693`.

**03. [M] `app/emps-charge/src/app/receipt.tsx`**\
Apresenta o motivo persistido de pagamento pendente no recibo da sessão.\
SHA-256 (12 primeiros caracteres): `7d69e15ac56b`.

**04. [M] `app/emps-charge/src/components/station-photo.tsx`**\
Feedback de carregamento/erro e nova tentativa; resguarda mudanças de foto/identidade.\
SHA-256 (12 primeiros caracteres): `bf275697fc1f`.

**05. [M] `app/emps-charge/src/components/ui/app-button.tsx`**\
Acessibilidade dos estados ocupado/desabilitado, texto com quebra e ajuste do botão compacto.\
SHA-256 (12 primeiros caracteres): `7bcc487b219f`.

**06. [M] `app/emps-charge/src/components/ui/app-input.tsx`**\
Tratamento de foco/erro, preservação dos estilos e callbacks e respeito ao estado de edição da senha.\
SHA-256 (12 primeiros caracteres): `8cf3a1f9b08f`.

**07. [M] `app/emps-charge/src/context/app-context.tsx`**\
Integra o pagamento ao fluxo extraído com controle de identidade vigente.\
SHA-256 (12 primeiros caracteres): `e87b77e955d9`.

**08. [M] `app/emps-charge/src/domain/models.ts`**\
Inclui a representação opcional paymentPending no modelo de sessão.\
SHA-256 (12 primeiros caracteres): `6312ad503152`.

**09. [M] `app/emps-charge/src/domain/normalizers.ts`**\
Valida e preserva o motivo de pendência retornado pelo histórico da API.\
SHA-256 (12 primeiros caracteres): `79b938052747`.

**10. [M] `app/emps-charge/src/services/mobile-api.ts`**\
Adapta o contrato de resposta do pagamento pendente.\
SHA-256 (12 primeiros caracteres): `6fca63044136`.

**11. [N] `app/emps-charge/src/services/session-payment.ts`**\
Novo fluxo payOwnedSession: acompanha a identidade vigente durante pagamento, confirmação e atualização do histórico; impede continuação na conta errada.\
SHA-256 (12 primeiros caracteres): `e5d9c9a55725`.

**12. [M] `app/emps-charge/tests/normalizers.test.ts`**\
Casos adicionais para o contrato de paymentPending do histórico.\
SHA-256 (12 primeiros caracteres): `105ff2e4487a`.

**13. [N] `app/emps-charge/tests/session-payment.test.ts`**\
Cenários de troca de conta em etapas assíncronas, cancelamento e confirmação da mesma sessão no histórico.\
SHA-256 (12 primeiros caracteres): `2a416e2817e7`.

### 20.2 Backend NestJS

**14. [M] `site/emps-site-main/backend/src/app.module.ts`**\
Registra o guard GIE e o aplica ao controller correspondente.\
SHA-256 (12 primeiros caracteres): `3e4056e7c8c5`.

**15. [N] `site/emps-site-main/backend/src/gie-access.ts`**\
Guard de acesso GIE que consulta status e e-mail atuais da conta no banco, preservando as demais proteções.\
SHA-256 (12 primeiros caracteres): `058e6ddea98a`.

**16. [M] `site/emps-site-main/backend/src/gie.service.ts`**\
Integra a proteção de acesso ao serviço/controller GIE.\
SHA-256 (12 primeiros caracteres): `6c3e38e94221`.

**17. [M] `site/emps-site-main/backend/src/mobile.service.ts`**\
Expõe o motivo de pendência financeira elegível no DTO da sessão mobile.\
SHA-256 (12 primeiros caracteres): `1716762d0a00`.

**18. [M] `site/emps-site-main/backend/src/payment-gateway.service.ts`**\
No fluxo legado manual Stripe abaixo do mínimo, devolve pendência sem capturar/cancelar/estornar por essa regra.\
SHA-256 (12 primeiros caracteres): `4097e2806237`.

**19. [N] `site/emps-site-main/backend/src/payment-minimum.ts`**\
Centralização do limite já utilizado, código e mensagem da pendência por valor positivo abaixo do mínimo Stripe.\
SHA-256 (12 primeiros caracteres): `6becd1c4749a`.

**20. [M] `site/emps-site-main/backend/src/session-billing.service.ts`**\
Registra pendência idempotente com bloqueio e verificações de conciliação, sem aumentar o valor devido.\
SHA-256 (12 primeiros caracteres): `a5b542f4aeb7`.

**21. [M] `site/emps-site-main/backend/src/telemetry.controller.ts`**\
Restringe endpoints privilegiados de readiness/dataset com o guard GIE.\
SHA-256 (12 primeiros caracteres): `bb6bd5c3c0f9`.

**22. [N] `site/emps-site-main/backend/tests/product-cycle.test.ts`**\
Testes de autorização GIE, identidade web/mobile e pendência financeira com persistência e provedor simulados.\
SHA-256 (12 primeiros caracteres): `25fdc86e9298`.

### 20.3 Frontend Next.js

**23. [M] `site/emps-site-main/frontend/.env.example`**\
Documenta o endpoint público configurável do geocodificador, sem incluir credenciais.\
SHA-256 (12 primeiros caracteres): `4819a13bda58`.

**24. [M] `site/emps-site-main/frontend/app/charge/[token]/page.tsx`**\
Usa WebChargeEntry para isolar o ciclo do checkout por QR/conta.\
SHA-256 (12 primeiros caracteres): `1e553a25b754`.

**25. [M] `site/emps-site-main/frontend/components/charge/WebCharge.tsx`**\
Foto canônica com versão, motivo de pendência por sessão e interrupção de requisições de tela desmontada.\
SHA-256 (12 primeiros caracteres): `80279882aa9b`.

**26. [N] `site/emps-site-main/frontend/components/charge/WebChargeEntry.tsx`**\
Remonta o checkout ao mudar QR/conta, preservando o estado em uma renovação de token da mesma conta.\
SHA-256 (12 primeiros caracteres): `a7052e57117c`.

**27. [M] `site/emps-site-main/frontend/components/charge/charge.module.css`**\
Estilos de apoio à apresentação das mudanças no Web Charge.\
SHA-256 (12 primeiros caracteres): `59f201bfd28c`.

**28. [M] `site/emps-site-main/frontend/components/dashboard/AdminDashboard.tsx`**\
Condiciona os elementos de GIE à conta permitida, preservando o dashboard existente.\
SHA-256 (12 primeiros caracteres): `3e99d03c80bd`.

**29. [M] `site/emps-site-main/frontend/components/dashboard/StationDashboard.tsx`**\
Isola GIE e volta à visão comum quando a autorização muda com a aba Inteligência ativa.\
SHA-256 (12 primeiros caracteres): `1c98ab84c7a8`.

**30. [M] `site/emps-site-main/frontend/components/dashboard/StationNotices.tsx`**\
Filtra avisos GIE e o detalhe selecionado conforme a autorização atual.\
SHA-256 (12 primeiros caracteres): `be005dbfbe9d`.

**31. [N] `site/emps-site-main/frontend/components/energy/use-gie-access.ts`**\
Hook que acompanha a identidade do navegador para controlar a apresentação GIE sem autorização inicial presumida.\
SHA-256 (12 primeiros caracteres): `8a751940f426`.

**32. [M] `site/emps-site-main/frontend/components/shell/SidebarNavigation.tsx`**\
Prioriza a navegação EMPS e recolhe referências externas GoodWe, mantendo o menu de perfil.\
SHA-256 (12 primeiros caracteres): `fb03105a2041`.

**33. [N] `site/emps-site-main/frontend/components/stations/StationAddressSearch.tsx`**\
Interface de busca explícita de endereço, sugestões, espera/erro/cancelamento e informação sobre o serviço externo.\
SHA-256 (12 primeiros caracteres): `2033f40148ef`.

**34. [M] `site/emps-site-main/frontend/components/stations/StationLocationFields.tsx`**\
Integra a busca ao formulário/mapa e limpa endereço antigo ao selecionar novo resultado.\
SHA-256 (12 primeiros caracteres): `605120ae6ae2`.

**35. [M] `site/emps-site-main/frontend/components/stations/StationPhoto.tsx`**\
Busca pública/privada autorizada, versão da foto, timeout, limpeza de object URL e mensagens específicas com repetição.\
SHA-256 (12 primeiros caracteres): `d71fbb1d6109`.

**36. [M] `site/emps-site-main/frontend/components/stations/StationTelemetry.tsx`**\
Condiciona os controles e dados privilegiados GIE sem remover a telemetria comum.\
SHA-256 (12 primeiros caracteres): `5d0159d7ad7f`.

**37. [N] `site/emps-site-main/frontend/components/stations/station-address-search.ts`**\
Consulta Photon e interpretação validada de resultados, geometria, limites geográficos, UF/CEP e duplicatas.\
SHA-256 (12 primeiros caracteres): `2ee555a8ca77`.

**38. [M] `site/emps-site-main/frontend/components/stations/station-wizard.module.css`**\
Estilos para o campo de busca de endereço e sugestões.\
SHA-256 (12 primeiros caracteres): `b0484e63224f`.

**39. [N] `site/emps-site-main/frontend/domain/gie-access.ts`**\
Regra de apresentação GIE baseada no e-mail permitido; é complementar ao guard obrigatório da API.\
SHA-256 (12 primeiros caracteres): `4faa2bb7811d`.

**40. [M] `site/emps-site-main/frontend/styles/shell.css`**\
Apoio visual à navegação e ao recolhimento dos recursos externos.\
SHA-256 (12 primeiros caracteres): `e3316b888d91`.

**41. [M] `site/emps-site-main/frontend/tests/dashboard-performance.test.cjs`**\
Ajusta as verificações de desempenho/estrutura do dashboard às condições de acesso GIE.\
SHA-256 (12 primeiros caracteres): `470e2854620b`.

**42. [M] `site/emps-site-main/frontend/tests/local-gie-demo.test.cjs`**\
Atualiza o contrato de apresentação da demonstração local após a restrição GIE.\
SHA-256 (12 primeiros caracteres): `69f1fc0949ef`.

**43. [N] `site/emps-site-main/frontend/tests/product-cycle.test.cjs`**\
Cobertura de endereço, permissões de apresentação, fotos e contratos do lote, com simulações locais.\
SHA-256 (12 primeiros caracteres): `fa7beaf8a902`.

**44. [M] `site/emps-site-main/frontend/tests/station-insights.test.cjs`**\
Ajusta expectativas das abas e insights conforme autorização GIE.\
SHA-256 (12 primeiros caracteres): `8431c28bceae`.

**45. [M] `site/emps-site-main/frontend/tests/web-charge-compatibility.test.cjs`**\
Verifica os contratos de compatibilidade do checkout, identidade, pendência e fotos.\
SHA-256 (12 primeiros caracteres): `4caa9fb46555`.

### 20.4 Verificação e documentação

**46. [N] `docs/implementation/2026-10-19-product-cycle.md`**\
Registro técnico local do escopo, decisões, alterações, verificações e limites da entrega de produto e de sua revisão.\
SHA-256 (12 primeiros caracteres): `1220d25075e1`.

**47. [M] `scripts/check-component.cjs`**\
Correção de flags e Python no processo isolado de testes; preserva banco oficial e arquivos privados.\
SHA-256 (12 primeiros caracteres): `fc8fe8b14087`.

### 20.5 Entregas auxiliares fora do repositório

A pasta `/Users/matheus/Documents/Codex/2026-10-18/cha/outputs/EMPS/` reúne os atalhos e documentos de preparação. Esses arquivos não estão incluídos nos 47 itens de código acima:

- `LEIA-ME.md`: instruções e evidências da preparação inicial de 18/10. Deve ser lido como registro daquela fase.
- `Iniciar site.command` e `Iniciar site oficial - leitura.command`: iniciadores dos respectivos modos do site; o nome do modo remoto não comprova acesso oficial funcional.
- `Iniciar aplicativo.command` e `Iniciar app no iPhone.command`: prévia web/ponte e inicialização nativa pela rede, respectivamente.
- `Iniciar API local.command`, `Iniciar banco local.command`, `Parar banco local.command` e `Parar serviços.command`: operação dos serviços locais já descritos.
- `docker-local.override.yaml`: bind local do MySQL em loopback, preservando o volume.
- `QR-app-iPhone*.png`: registros de QR das redes utilizadas. São históricos; usar o QR da instância atual do Metro.
- `Acesso remoto - proposta.md` e a captura de auditoria da VPS: contexto de acesso restrito que não foi aplicado. Não enviar esses arquivos indiscriminadamente, pois podem revelar detalhes privados de infraestrutura/acesso.
- `Implementacao-2026-10-19.md` e seu PDF: relatório técnico anterior do lote e revisão. O presente documento acrescenta a preparação completa, a continuidade e o inventário consolidado.
- Este relatório completo, em Markdown e PDF: conteúdo de continuidade, preparado sem incluir os segredos locais.

Os atalhos possuem caminhos absolutos deste Mac. Para outra máquina, adaptar os caminhos e verificar as dependências; não presumir portabilidade automática. Nenhum desses documentos dá permissão para modificar infraestrutura, publicar código ou movimentar dados oficiais.
