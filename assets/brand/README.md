# Marca EMPS

`emps-logo.svg` e `emps-symbol.svg` sao as fontes vetoriais da marca completa
e da insignia. Os contornos foram obtidos da silhueta da logo ja existente,
preservando o desenho das letras e do plugue/raio. Os vazados sao transparentes.
O preenchimento vermelho tem degrade limpo; a variante prateada usa #AFB6BD.
Nao adicionar fundo branco, halo, textura, sombra ou contorno preto.

## Gerar os arquivos de uso

Na raiz do repositorio, com as dependencias do frontend ja instaladas:

```powershell
node scripts/build-brand-assets.cjs
```

O gerador utiliza o Sharp ja presente no frontend. Nao adiciona dependencias
ao app nem ao backend. Atualiza as copias usadas pelo site/app a partir destas
fontes; nao edite os PNGs individualmente.

- Logo vermelha PNG: 2522 x 856, fundo transparente, compartilhada entre
  aplicativo, site e PDFs novos.
- Simbolo prateado PNG: 338 x 572, transparente, usado pelos componentes do
  app. A mascara do menu web usa diretamente o SVG do simbolo.
- Icone de aplicativo: 1024 x 1024, fundo escuro opaco para iOS.
- Favicon do app: 256 x 256; splash: 600 x 600.
- Foreground adaptativo: 1024 x 1024, com margem de seguranca.
- Monocromatico Android: 1024 x 1024, somente insignia branca transparente,
  separado do badge colorido para nao virar um circulo solido no tema do sistema.
- SVGs publicos e favicon web sao produzidos pelo mesmo gerador.

Verificar com `node --test tests/brand-assets.test.cjs` na pasta do frontend.
As copias PNG do site/app e as copias SVG publica/fonte devem ser identicas.

Atualizacoes no icone/splash do aplicativo instalado exigem novo build nativo.
Para imagens dentro do app, recarregar o projeto no Expo normalmente basta.
PDFs ja exportados e versoes historicas de outros checkouts nao sao reescritos.
