# CR-2026-10-18-002 - Correcao do repositorio de destino

## Pedido

Retirar o envio indevido ao repositorio do Tommaso e criar um repositorio novo
na conta do usuario. Nenhuma nova alteracao funcional solicitada.

## Retirada

- Conferida a branch codex/app-review-2026-10-15 em
  TommasoNagliatti/EMPS-Ecosystem, no commit
  744515c0dd5bf579bb4d371e15966d7911b8d92e.
- Excluida somente essa branch, com lease no SHA acima, para recusar a operacao
  se houvesse trabalho posterior nela. A copia local foi preservada.
- Nao houve merge nessa main nem force push nela. Sua referencia permaneceu
  3fc3bc58fb27b48c21fc69a2ce44049365ddf7b1.
- Nenhuma outra branch, PR ou alteracao dos colegas foi removida.

## Novo destino

- Repositorio: https://github.com/matheus00M7/emps-ecosystem-macbook
- Proprietario: matheus00M7.
- Visibilidade: privado.
- Branch de uso no novo computador: main.
- Conteudo: historico e codigo do checkout local, site, app, API, GIE,
  imagens, lockfiles, testes e documentacao. Nao e uma mescla das branches
  mais novas dos colegas.
- origin local trocado para o novo repositorio. O repositorio do Tommaso nao
  permanece como destino de push desta copia.
- README e guia MacBook corrigidos para o destino pessoal. O registro 001
  foi mantido com aviso de substituicao para rastreabilidade.

## Limites

Sem mudancas no codigo funcional, banco, VPS, permissoes de contas ou
dependencias. Senhas, .env privados, chaves, dumps, relatorios operacionais
e dependencias instaladas continuam fora do Git, mesmo com repositorio privado.
Os testes e as pendencias do registro 001 continuam aplicaveis; nao ha nova
homologacao macOS, nativa ou do GIE nesta correcao de destino.
