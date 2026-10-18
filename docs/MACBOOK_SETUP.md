# EMPS no MacBook

Guia de transferencia da versao local de 18/10/2026. O codigo foi conferido no
Windows; a instalacao e os testes em macOS ainda precisam ser executados no Mac.
Este guia nao publica servicos nem concede acesso ao banco oficial.

## 1. O que instalar

| Requisito | Uso |
|---|---|
| Git e Command Line Tools da Apple | Clonar e compilar dependencias nativas |
| Node.js 22, com npm | Versao da CI do projeto; site, API e Expo |
| Python 3.12 | GIE, em ambiente virtual proprio |
| Docker Desktop para o processador do Mac | MySQL 8 local, se for rodar a pilha local |
| OpenMP / libomp | Dependencia do LightGBM no macOS |
| Editor de codigo | Opcional; use o editor que preferir |
| Xcode completo e simulador iOS | Somente para simulador ou compilacao iOS local |

O Expo CLI vem das dependencias do app: nao instalar o antigo expo-cli global.
Next.js, NestJS, React, Prisma e bibliotecas Python sao instalados pelos arquivos
do repositorio. Nao instalar MySQL diretamente se usar o container Docker.

Instale as Command Line Tools pelo Terminal:

```sh
xcode-select --install
```

Se usar Homebrew, depois de instala-lo pelo site oficial e seguir sua orientacao
de PATH, instale as ferramentas:

```sh
brew install git node@22 python@3.12 libomp
export PATH="$(brew --prefix node@22)/bin:$PATH"
node --version
npm --version
python3.12 --version
git --version
```

A linha de PATH vale para o terminal atual. Para novos terminais, aplique a
orientacao exibida pelo Homebrew para node@22. Docker Desktop deve ser instalado
e aberto separadamente. Escolha Apple Silicon para M1/M2/M3/M4 ou equivalente,
e Intel para Macs Intel. Nao misture Python Intel/Rosetta com libomp ARM.

Referencias oficiais:
- https://brew.sh/
- https://docs.docker.com/desktop/setup/install/mac-install/
- https://github.com/lightgbm-org/LightGBM/tree/master/python-package#installation
- https://docs.expo.dev/get-started/set-up-your-environment/

## 2. Clonar a versao certa

As melhorias locais estao na main deste novo repositorio pessoal privado:

```sh
git clone https://github.com/matheus00M7/emps-ecosystem-macbook.git
cd emps-ecosystem-macbook
git branch --show-current
git status --short
```

Essa main preserva o estado deste PC, baseado em 6d5c0f8. No repositorio original
do Tommaso ha trabalho posterior dos colegas nas branches
integration/gie-v3-multistation e feat/gie-demo-history-mysql. Essas branches nao
foram copiadas nem integradas nesta transferencia. Nao combinar/substituir essas
versoes automaticamente.

O repositorio pessoal e privado: autentique no Mac com a conta matheus00M7 ou
outra conta explicitamente autorizada, por GitHub Desktop, SSH ou autenticacao
HTTPS compativel. A senha comum da conta GitHub nao funciona como senha Git.
O origin deve apontar somente para matheus00M7/emps-ecosystem-macbook, nao para
o Tommaso. O envio anterior foi retirado de la; consulte a CR-2026-10-18-002.

## 3. Escolher o ambiente

**App conectado a API publica:** requer Node/npm e a conta existente. Nao requer
MySQL local, Python, GIE local ou acesso SSH apenas para abrir o app. Configuracao
padrao do app: EXPO_PUBLIC_EMPS_API_URL=https://api.emps-charge.tech. Disponibilidade
de pagamentos e operacoes depende da API publicada e das permissoes da conta.

**Pilha completa local:** requer Docker, Node e Python. Usa um banco novo local,
sem os usuarios, instalacoes ou pagamentos da Hostinger. Siga as secoes 4 a 7.

**Mesmo painel remoto deste PC (3010/3011):** requer configurar o acesso individual
do Mac conforme REMOTE_DEVELOPMENT_HOSTINGER.md. Chaves, tunel e configuracao
privada nao acompanham o clone. Nao reutilize a chave privada do Windows nem
troque credenciais do banco para tornar o clone funcional.

## 4. Instalar dependencias do codigo

Na raiz do clone:

```sh
npm --prefix site/emps-site-main/backend ci
npm --prefix site/emps-site-main/frontend ci
npm --prefix app/emps-charge ci
python3.12 -m venv gie/GIE/.venv
gie/GIE/.venv/bin/python -m pip install --upgrade pip
gie/GIE/.venv/bin/python -m pip install -r gie/GIE/requirements-test.txt
```

Nao copiar node_modules ou .venv do Windows. Preserve os lockfiles. Nao usar sudo
com npm ou pip nesse ambiente. Se uma versao fixada nao instalar no Mac, registre
o erro/arquitetura antes de alterar dependencias de todo o grupo. Streamlit e
dependencias extras das demos sao opcionais, conforme o README do GIE.

Crie os exemplos somente se os arquivos ainda nao existirem:

```sh
for component in site/emps-site-main/backend site/emps-site-main/frontend app/emps-charge; do
  if [ ! -f "$component/.env" ]; then
    cp "$component/.env.example" "$component/.env"
  fi
done
node -e "console.log(require('node:crypto').randomBytes(48).toString('base64url'))"
```

Edite os .env localmente. Gere dois segredos diferentes para JWT_SECRET e
GIE_SERVICE_TOKEN; substitua os marcadores dos exemplos. Nao colocar senhas
privadas em variaveis NEXT_PUBLIC_* ou EXPO_PUBLIC_*. Nao publicar .env.

Para pilha local: DATABASE_URL deve apontar para localhost:3306/emps_db, como
no exemplo, e PAYMENT_PROVIDER deve permanecer sandbox. O frontend usa a API
local http://localhost:3001. Para testar o app com a mesma API no navegador,
altere EXPO_PUBLIC_EMPS_API_URL para http://localhost:3001. No celular fisico,
use o IP LAN do Mac (mesma rede) ou um endpoint HTTPS autorizado; localhost no
iPhone e o proprio iPhone. Reinicie o Expo depois de mudar essas variaveis.

## 5. Banco local, Prisma e primeiro usuario

Abra o Docker Desktop. Na raiz:

```sh
docker compose -f site/emps-site-main/docker-compose.yml up -d mysql
docker compose -f site/emps-site-main/docker-compose.yml ps
npm --prefix site/emps-site-main/backend run prisma:generate
npm --prefix site/emps-site-main/backend run build
```

Um volume novo recebe somente a estrutura SQL. Nao apague volumes existentes.
Nao usar docker compose down -v, seeds ou migrations no banco oficial.

Para criar um administrador **apenas no MySQL local**, confira o destino do .env
e rode no terminal interativo do macOS, usando uma senha sua:

```sh
cd site/emps-site-main/backend
export ADMIN_EMAIL='admin@example.invalid'
export ADMIN_NAME='Administrador local'
read -s 'ADMIN_PASSWORD?Senha do administrador local: '
echo
export ADMIN_PASSWORD
npm run bootstrap:admin
unset ADMIN_PASSWORD ADMIN_EMAIL ADMIN_NAME
cd ../../..
```

O exemplo de read acima e para o zsh padrao do macOS. Nao cria conta no app ou
em producao. Contas oficiais so funcionam com a API e a autorizacao corretas.

## 6. Iniciar no Mac (terminais separados)

Os iniciadores .ps1/.bat existentes sao voltados ao Windows. Instalar PowerShell
no Mac nao corrige seus caminhos .exe. Use estes comandos manuais no macOS.
Nao execute o supervisor start-ecosystem.cjs, que ainda aponta para Python Windows.

Terminal 1, na pasta gie/GIE, para servir o GIE local:

```sh
cd gie/GIE
read -s 'GIE_SERVICE_TOKEN?Token GIE igual ao configurado no backend: '
echo
export GIE_SERVICE_TOKEN
export GIE_STATION_ID='1'
export GIE_NORMAL_DEMO='false'
export GIE_WEATHER_ENABLED='false'
export PYTHONPATH="$PWD:$PWD/src"
.venv/bin/python -m uvicorn service.api:create_app --factory --host 127.0.0.1 --port 8510
```

Use uma instalacao local realmente existente em GIE_STATION_ID e o mesmo ID
no .env da API. O ID 1 e so exemplo. Servico no ar nao cria telemetria, nao
associa carregadores e nao comprova conexao com equipamentos. A demonstracao
automatica fica explicitamente desligada nesse exemplo; alinhe tambem o .env
do backend se optar por manter esse modo desligado.

Terminal 2, na raiz do clone:

```sh
npm run dev:api
```

Terminal 3, na raiz:

```sh
npm run dev:web
```

Terminal 4, na raiz:

```sh
npm --prefix app/emps-charge run start -- --lan
```

Site: http://localhost:3000/login. Saude da API: http://localhost:3001/auth/health.
Expo: porta 8081 e QR no terminal. Ctrl+C encerra cada servico; o banco continua
no Docker. Nao reutilize 3010/3011 achando que sao os mesmos perfis remotos.

## 7. Abrir somente o aplicativo

Depois de npm ci e do .env do app configurado:

```sh
cd app/emps-charge
npx expo start --lan
```

No iPhone, use Expo Go compativel com o SDK 57 ou um development build
compativel. Recursos nativos/Stripe podem exigir o development build; nao e
garantido que tudo funcione no Expo Go. Para simulador/compilacao iOS local,
instale Xcode e siga a documentacao Expo. Nao e preciso Xcode apenas para ler
o QR com o iPhone. O tunel Expo nao publica automaticamente a API local.

Para a previa web de consultas oficiais, configure no .env.local do app
EXPO_PUBLIC_EMPS_WEB_READONLY_PREVIEW=true e mantenha a URL HTTPS oficial e
EXPO_PUBLIC_EMPS_DEMO_MODE=false. Em dois terminais da pasta do app:

```sh
npm run preview:web:api
```

```sh
npx expo start --web --port 8081 --localhost
```

Abra http://localhost:8081. A ponte 8082 e somente login e leitura; nao libera
pagamentos, reservas ou recargas. Nao use essa flag para uma API local: o
destino da ponte e fixo na API oficial. Consulte o README do app.

## 8. Verificar e continuar o trabalho

Na raiz, com as dependencias instaladas:

```sh
npm run test:structure
npm run check:publication
npm run check:app
npm run check:web
npm run check:api
npm run check:gie
```

check:api usa configuracao de testes sem banco real. check:gie aceita o caminho
.venv/bin/python no macOS. Nao habilite testes MySQL de escrita em producao.
Nao atualizar todas as dependencias para latest ao clonar.

Ha pendencias de contrato mobile e validacao fisica descritas na CR de
publicacao de 18/10. O envio ao GitHub nao e uma promessa de homologacao total,
nem ativa os ajustes de pagamento na API oficial.

## 9. O que nao vem pelo GitHub

- Usuarios/registros do banco oficial e volumes locais do Docker.
- Senhas, tokens, chaves SSH, configuracoes remotas privadas e sessoes logadas.
- Dependencias instaladas, cache, logs e builds Windows.
- Capturas e relatorios privados com identificadores operacionais.

Mantenha o PC antigo ate configurar e verificar o Mac. Transfira documentos
privados necessarios por um canal privado, separado do Git. Mesmo privado, este
repositorio nao deve receber senhas, chaves ou dumps operacionais.
