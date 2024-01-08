# FORK
Antes de tudo, faça um fork do projeto no seu github(aproveite e largue a estrelinha 🌟)

# CLONE
Antes de iniciar, certifique-se de dar o git clone, você pode seguir os passos abaixo para criar um clone e trocar de branch:

```bash
git clone https://github.com/eletroswing/EasyPix EasyPix
cd EasyPix
git checkout -b nome-do-seu-branch
```

# As dependencias
Existem duas formas de você prosseguir, ultilize:
```bash
npm i
```
para instalar os módulos atualizados ou:
```bash
npm ci
```
para instalar do package-lock!

# Rodando os testes
Para rodar os testes ultilize `npm run test`, ele usa o jest para realizar os testes determinados na pasta **tests**. 
Em alguns casos, será necessessário um comando mais elaborado, por exemplo, para dar watch você pode usar o comando com o prefixo --watch.
Para rodar testes especificos, ultilize -- seguido de espaço e um regex com match para o nome do arquivo.

# Fazendo o commit
Para não fugir muito da estrutura de commits, ao terminar suas alterações, ultilize o comando para adicionat(`git add`) seguido de: 
```bash
npm run commit
```
Dai só seguir os passos do commitzen pra sua mensagem ficar bem bonita. E então, siga com o push para o seu branch do seu fork!

# Build local
Caso queira gerar uma build para usar localmente, use o comando:
```bash
npm run build
```
Uma build será gerada no diretório dist pra você!

# PixMe a coffee ☕
![PixMe a Coffee](https://pixmeacoffee.vercel.app/_next/image?url=https%3A%2F%2Fapi.qrserver.com%2Fv1%2Fcreate-qr-code%2F%3Fsize%3D206x206%26data%3D00020126360014BR.GOV.BCB.PIX0114%2B55329848279105204000053039865802BR5922Ytalo%20da%20Silva%20Batalha6003Uba62070503***63049B02&w=256&q=75 "PixMe a coffee")

# Esse projeto está sob a licença MIT.
