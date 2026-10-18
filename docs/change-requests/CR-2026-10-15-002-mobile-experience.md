# CR-2026-10-15-002 - Experiencia do EMPS Charge

Inicio: 15/10/2026. Conclusao: 16/10/2026. Implementado e validado localmente; nao publicado.
Branch: codex/app-review-2026-10-15.

## Escopo

Revisar Inicio, Escanear, Recargas e Perfil com referencia visual no site EMPS:
cores escuras neutras, destaque vermelho, tipografia legivel e controles consistentes.
Esta entrega continua a CR-2026-10-15-001, sem substituir seu registro.

Nao foram alterados backend, GIE, schema, migrations, dados oficiais, permissoes,
contratos HTTP ou regras de cobranca nesta entrega. Nao houve push ou deploy.

## Arquivos e alteracoes

Caminhos abaixo relativos a app/emps-charge/.

| Arquivo | Mudanca |
| --- | --- |
| src/app/(tabs)/index.tsx | Inicio reorganizado: perfil, saudacao, leitura QR, sessao ativa, contagem de locais/conectores. Busca por nome/bairro/endereco ignorando acentos. Filtros por conector e disponibilidade. Mapa/lista lado a lado a partir de 900 px e empilhados abaixo disso. Removido sino com notificacoes sem fonte de dados. Localizacao sem autorizacao mostra mensagem visivel; coordenada inicial nao e apresentada como posicao real. |
| src/app/(tabs)/history.tsx | Filtros Todas/Este mes/7 dias e Todas/Finalizadas/Pendentes; pesquisa por ID, carregador ou eletroposto. Totais dos registros filtrados. Estados distintos para conta vazia, filtro vazio, carregamento e erro. Mantido acesso aos detalhes/recibos e a sessao ativa. |
| src/app/(tabs)/profile.tsx | Identidade da conta, dados consultaveis, atalhos reais para recargas/eletropostos/sessao, preferencias, ajuda expansivel e confirmacao de saida. Removidas acoes que somente exibiam aviso de implementacao futura: editar, veiculo, carteira, notificacoes, seguranca e privacidade. Nenhuma API ficticia foi criada para essas funcoes. Versao vem da configuracao Expo. |
| src/app/(tabs)/_layout.tsx | Rotulos maiores e altura considerando a area segura inferior. Preservada rota propria do leitor. |
| src/app/_layout.tsx | Provedor de preferencias dentro do contexto autenticado. Sem alterar protecao de rotas. |
| src/app/scan.tsx | Modos Camera/Codigo; entrada vazia inicialmente, bloqueio de envio vazio, rolagem e ajuste ao teclado. Falha pausa leitura ate nova tentativa. Camera somente na tela em foco/modo correto; lanterna nativa. Preservados Expo Camera e leitor Android. Removidos logs do QR bruto. Respostas atrasadas nao navegam apos sair/trocar de modo; falha de vibracao nao impede resolucao. |
| src/components/session-card.tsx | ID da recarga visivel, texto secundario maior e raio mais compacto. Preservadas pendencias de pagamento e retirada. |
| src/components/station-card.tsx | Espacamentos compactos, tarifa maior, endereco com fallback e distancia opcional. Carregadores ainda nao recebidos nao viram status offline automaticamente. |
| src/components/station-map.web.tsx | Tema claro/escuro do mesmo provedor do site; altura configuravel; ponto do usuario apenas apos localizacao obtida. Disponibilidade respeita horario da estacao. IDs do iframe validados antes de navegar. Timeout e acao Recarregar mapa. Legenda no topo, creditos preservados. |
| src/components/station-map.tsx | Mesmas opcoes no mapa nativo. Escape de texto embutido em script; validacao de IDs; estados de pronto/erro associados ao documento corrente; timeout e nova tentativa. |
| src/components/ui/app-sheet.tsx (novo) | Janela reutilizavel com entrada 240 ms/saida 160 ms, respeito a movimento reduzido, area segura, rolagem e conteudo preservado durante fechamento. Animacao JS na web e driver nativo em aparelhos. |
| src/components/ui/segmented-control.tsx (novo) | Seletor reutilizado no leitor, historico e preferencias, alvos de toque e estado acessivel de selecao. |
| src/context/preferences-context.tsx (novo) | Tema do mapa e vibracao salvos localmente por ID de usuario. Reinicializacao ao trocar conta; mensagens de falha de persistencia. Sem senha/token nessas preferencias. |
| src/domain/history-filters.ts (novo) | Filtro puro, busca normalizada, ordenacao decrescente sem mutacao. Calendario local: sete dias inclui hoje e seis anteriores. Retirada pendente nao e finalizacao. |
| tests/history-filters.test.ts (novo) | Seis testes de busca, limites de datas, registros futuros, pendencias e imutabilidade. |
| src/domain/station-filters.ts (novo) | Busca e filtros puros para eletropostos. Normaliza TYPE2/Tipo 2 na comparacao sem alterar a resposta da API. Disponibilidade exige um carregador livre do conector escolhido e respeita o fechamento da estacao. |
| tests/station-filters.test.ts (novo) | Quatro testes de formatos de conector, busca sem acentos, disponibilidade do conector selecionado e estacoes fechadas/sem disponibilidade conhecida. |

Documentacao: esta CR e seu indice em docs/README.md.
Formatacao aplicada aos arquivos desta entrega. Nenhuma dependencia adicionada
ao manifesto ou lockfile.

## Dados e limites preservados

Interface -> contexto existente -> consultas da API EMPS -> modelos existentes
-> apresentacao de estacoes, recargas e conta.

- O modo demo do aplicativo continua desligado. Registros de QA/demonstracao
  retornados pela API ja existiam; nao foram criados nem renomeados nesta entrega.
- Navegador local: permanece a ponte restrita da CR anterior, com autenticacao
  e consultas. Inicio/fim de recarga, cadastro e pagamentos continuam bloqueados.
- App nativo: permanece o endereco HTTPS configurado para a API.
- Esta entrega nao habilita cobrancas nem afirma validacao de equipamento fisico.
- Posicao inicial e referencia cartografica; ponto pessoal e distancia dependem
  de localizacao real obtida com permissao.
- Validacao original de dominio/token do QR permanece obrigatoria.
- Preferencias sao locais por conta/aparelho, sem sincronizacao no servidor.
- Historico filtra registros devolvidos pela API atual; paginacao, limite e
  escopo do endpoint nao foram alterados.
- Arquivos ja modificados na CR anterior (runtime, contexto de dados, relay,
  configuracao local e documentacao anterior) foram preservados.

## Verificacao

- npm run check: lint, TypeScript e 58 testes aprovados, confirmado em 16/10/2026.
- Busca por consolacao encontrou a estacao de Consolacao.
- Detectado e corrigido o filtro Tipo 2 que nao reconhecia TYPE2 recebido da API.
  A verificacao final no navegador retornou cinco eletropostos, incluindo Shopping
  Frei Caneca. A opcao Todos restaurou o estado sem filtros.
- Periodo e situacao responderam aos controles. A conta atual nao possui recargas,
  por isso a apresentacao com registros foi testada pela suite, e o vazio no browser.
- Tema claro/escuro refletiu no mapa e persistiu depois de recarregar.
- Login permaneceu ativo ao recarregar o perfil.
- Em 16/10/2026, os servidores locais foram reiniciados; o app abriu autenticado
  e carregou os eletropostos da API. A ponte de consultas permaneceu restrita.
- Ajuda expandiu perguntas; confirmacao de saida foi cancelada, preservando sessao.
- Leitor manual: botao vazio desabilitado, codigo invalido recusado, troca de modo
  e retorno ao Inicio funcionando. Nenhuma recarga foi iniciada.
- Inspecao visual em larguras reais de 425, 1053 e 1255 px; sem overflow horizontal
  do documento nos tamanhos medidos. O controle de viewport nao aplicou exatamente
  390/1280 px; os valores registrados sao os medidos, nao os solicitados.
- Nao foram observados erros de aplicacao no console. Ha avisos de estilos legados
  e de um sprite do provedor de mapa, sem bloquear a navegacao.
- Backend, GIE e banco oficial nao foram modificados.

Capturas privadas em output/app-review-2026-10-15/:
app-inicio-revisado.png, app-leitor.png, app-recargas.png e app-perfil.png.
Nao publicar automaticamente: mostram dados da conta/operacao.

## Pendencias para homologacao

Camera, lanterna, vibracao, teclado e leitor Android devem ser testados em
aparelhos fisicos. O agente nao concedeu permissoes de camera/localizacao nem
realizou pagamentos durante esta verificacao.

Os dados sinteticos usados pelos testes ficam apenas nos testes; nenhum historico
artificial foi inserido no app/banco. O mapa depende de servicos externos de tiles.
Edicao de conta, veiculo, carteira, push e politicas legais nao foram implementados;
as entradas anteriores sem funcionalidade foram retiradas.

Revisar esta branch em grupo e testar iPhone/Android antes de incorporar ao oficial.
