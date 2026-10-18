# CR-2026-10-18-001 - Preservacao no GitHub e guia para MacBook

**Destino corrigido:** este registro descreve o primeiro envio, retirado a
pedido do usuario. O destino atual e o repositorio pessoal privado
matheus00M7/emps-ecosystem-macbook, branch main. Consulte
[CR-2026-10-18-002](CR-2026-10-18-002-personal-repository.md). As referencias
ao repositorio publico abaixo sao historicas, nao instrucoes de envio.

## Pedido e destino

Consolidar o trabalho local de site, app, API e documentacao no repositorio
TommasoNagliatti/EMPS-Ecosystem para continuar em outro computador.
Branch: codex/app-review-2026-10-15. Base local: 6d5c0f8.

O repositorio e publico. Nao incluir configuracoes privadas, credenciais,
backups, dados de usuarios, logs nem os PDFs/capturas operacionais em output/.
As dependencias continuam descritas nos lockfiles e requirements; nao copiar
node_modules ou .venv entre sistemas operacionais.

## Conteudo consolidado

- Revisoes do app de 15 e 16/10: Inicio, mapa, busca/filtros, leitor QR,
  historico, perfil, preferencias, navegacao e componentes compartilhados.
- Fluxo de checkout, idempotencia, cancelamento de autorizacao no cliente,
  adaptador Stripe de teste e comprovantes PDF Demo. Ver limites abaixo.
- Ponte web de autenticacao/consultas, com operacoes financeiras bloqueadas.
- Correcao do QR emitido no site e seus consumidores.
- Logo/insignia limpas e derivadas para site, app e comprovantes, incluindo
  fontes de marca e testes de assets.
- Opt-in local de capacidades de pagamento Demo no backend, padrao desligado.
- Testes e registros de alteracao correspondentes.
- Guia MACBOOK_SETUP.md com ferramentas, clone da branch exata, instalacao,
  configuracao local, execucao manual no macOS e separacao do ambiente oficial.

Nesta publicacao nao se altera o comportamento de negocio alem do trabalho
ja pendente. Somente o guia de migracao e este registro sao novos; os indices
README sao atualizados. O next-env.d.ts gerado deixa de ser versionado, conforme
a regra que ja existe no .gitignore. O arquivo deste PC e preservado no disco;
Next.js o regenera no clone ao iniciar/compilar o site.

## Preservacao do trabalho dos colegas

O fetch de 18/10 encontrou trabalho posterior nas branches
integration/gie-v3-multistation e feat/gie-demo-history-mysql. Esta entrega nao
mescla nem sobrescreve essas branches, nao atualiza main e nao faz force push.
O guia manda clonar explicitamente a branch desta entrega. A integracao das
duas linhas de trabalho exige revisao separada, especialmente nos contratos GIE.

## Pendencias e correcao dos registros anteriores

1. O cliente mobile implementado solicita POST
   /mobile/v1/payment-intents/:id/cancel. O controlador mobile desta base nao
   declara essa rota; existe cancelamento no fluxo WebCharge/servico. Portanto,
   a afirmacao da CR-2026-10-16-002 de que o endpoint mobile ja existia deve ser
   lida com esta correcao. O teste do cliente nao comprova disponibilidade HTTP.
2. Conferir tambem rotas mobile de billing, pagamento e retirada do conector:
   equivalentes WebCharge nao significam automaticamente rotas mobile ativas.
3. A flag de capacidade Demo e compartilhada: pode afetar reservas e WebCharge,
   nao apenas os radios Pix/carteira do app. Manter opt-in desligado na API
   oficial ate revisar, publicar e homologar separadamente.
4. O servidor oficial ainda pode anunciar demoPayments=false. Git push nao
   habilita esses meios na hospedagem. Nao foi autorizada ativacao oficial.
5. Previa web nao comprova camera, PaymentSheet, compartilhamento ou hardware
   em aparelho real. Instalacao/compilacao macOS nao foi executada neste PC.
6. Scripts .ps1/.bat e o supervisor start-ecosystem.cjs ainda possuem caminhos
   Windows. O guia fornece execucao manual; nao afirma portabilidade desses
   iniciadores nem altera o GIE para suprir essa diferenca.

As pendencias sao registradas, nao corrigidas silenciosamente nesta publicacao.

## Verificacoes nesta publicacao

- check:app: lint e tipos aprovados; 82 testes aprovados.
- Site: 201 testes aprovados e TypeScript sem erros.
- API: build aprovado; 128 testes aprovados, 8 testes MySQL opt-in ignorados.
  DATABASE_URL de testes aponta para uma porta local ficticia nao conectavel;
  credenciais e flags de integracao operacionais nao sao herdadas.
- Estrutura/publicacao: 5 testes aprovados; verificacao de caminhos, segredos
  conhecidos, SQL estrutural e arquivos necessarios sem bloqueios.
- Scan adicional: sem arquivos acima de 20 MB e sem credenciais detectadas
  pelas regras revisadas; nao substitui auditoria de seguranca.
- check:gie nao executou: esta copia nao tem gie/GIE/.venv. GIE nao foi alterado
  nesta consolidacao. Nao se declara novo resultado de testes do GIE.
- Nao foi repetido build Next.js sobre o servidor em uso. Nao foram executados
  testes reais de aparelho, instalacao macOS ou qualquer teste na VPS.

## Fora do escopo

Nenhum deploy, reinicio de VPS, migration, seed, alteracao do banco oficial,
pagamento, comando de equipamento, transferencia de chave SSH, integracao do
GIE dos colegas ou mudanca de permissao de conta. O acesso privado autorizado
neste Windows nao e automaticamente concedido ao MacBook pelo clone.

Os relatorios privados de 16/10 continuam na pasta output/pdf deste PC, nao
no repositorio publico. A transferencia privada deles e independente do Git.
