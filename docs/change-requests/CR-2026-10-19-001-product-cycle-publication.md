# CR-2026-10-19-001 - Codigo e relatorio de continuidade no repositorio pessoal

## Pedido e destino

Depois de receber o relatorio completo, Matheus autorizou enviar o trabalho ao
repositorio provisorio pessoal privado `matheus00M7/emps-ecosystem-macbook`.
Nao usar o repositorio do Tommaso. Seguindo CONTRIBUTING.md, a entrega usa
`codex/product-cycle-handoff-2026-10-19`, com pull request para `main`, sem merge
automatico ou force push.

Base conferida: `a8e88e4958131e0a59aa6d0e3b621be253e402fa`.
A branch `origin/main` tinha essa mesma base antes do envio.

## Conteudo

- Lote funcional e revisao: 47 arquivos, incluindo modulos novos e testes.
- Navegacao EMPS, busca de endereco Photon e restricao GIE por identidade atual.
- Fotos com tratamento de autorizacao, versao, falha, prazo e nova tentativa.
- Pagamento positivo abaixo do minimo mantido pendente, com total original,
  motivo persistido, idempotencia e verificacoes de conciliacao.
- Isolamento de conta no pagamento nativo e no Web Charge; formularios e feedback.
- Correcao do iniciador de testes isolados da API no Mac.
- Relatorio completo de 19 paginas em PDF e Markdown, com inventario por arquivo,
  SHA-256 abreviado, limites de validacao e instrucoes de continuidade.
- Indices de documentacao e aviso sobre o estado historico do relatorio.

[Relatorio e orientacao de continuidade](../handoff/2026-10-19/README.md).
[Registro tecnico do lote](../implementation/2026-10-19-product-cycle.md).

O PDF e o Markdown foram preservados como retrato anterior ao envio; suas
mencoes a "sem commit/push" descrevem aquele momento. Esta CR registra a
posterior autorizacao de publicacao do codigo, sem sugerir deploy na Hostinger.
Nao sao incluidos .env, chaves, dumps, configuracoes individuais, auditorias de
infraestrutura, capturas da VPS, atalhos absolutos do Mac, dependencias ou builds.

## Verificacoes

Antes deste envio, as impressoes de integridade dos 47 arquivos foram comparadas
com o relatorio: todos correspondem exatamente ao lote revisado e testado.
Nao houve nova alteracao funcional durante a preparacao de publicacao.

Evidencias consolidadas desse lote:

| Componente | Resultado local |
|---|---|
| Frontend | 218 testes, TypeScript e Next build aprovados |
| Backend | Prisma generate, Nest build e 134 testes aprovados; 8 MySQL opt-in ignorados |
| App | Lint, TypeScript e 87 testes aprovados; exportacao web e bundle iOS aprovados |
| GIE HTTP | 11 testes aprovados |
| Estrutura | 5 testes aprovados |

Total do lote: 455 aprovacoes e 8 skips. As suites completas nao foram repetidas
apenas para copiar o relatorio; os hashes conferem com os arquivos testados.
O verificador de publicacao, os cinco testes de estrutura e `git diff --check`
sao conferidos novamente para a entrega. O resultado do CI remoto deve ser
consultado no pull request; nao confundir evidencias locais com checks remotos.

## Limites preservados

Sem deploy, mudanca de acesso VPS, migration, seed, escrita no banco oficial,
comando de carregador ou transacao financeira. Sem atualizacao de dependencias
ou lockfiles. O app nativo local continua apontando para a API oficial atual,
que pode ainda nao conter as correcoes de backend desta branch.

O usuario recusou alterar o acesso da VPS e abrir tunel publico do Expo. Essas
decisoes continuam vigentes. Nao foi recuperada uma senha EMPS oficial.
As pendencias de integracao e homologacao do relatorio permanecem aplicaveis.
