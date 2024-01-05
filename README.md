## Quer Ajudar a desenvolver?
Acesse o github agora, de sua estrelinha e aguarde o upload!
https://github.com/eletroswing/EasyPix


# Easy Pix
EasyPix foi construido para ser um ecossistema pix completo de uso simples em nodejs, desde a geração do pix, até as chamadas de callback!

# Gatways de pagamento
Atualmente só suportamos o gatway Asaas, porém a planos para expandir para outros provedores como Mercado Pago, OpenPix, etc!

# Ainda em testes
Considere em colaborar para tornar essa lib algo melhor pra comunidade! Tenha em mente que ainda está em fase inicial e pode falhar.

# Como usar
- Primeiro instale a lib:
```bash
npm install easy-pix
```

- Importe a lib
```js
import EasyPix from "easy-pix";
```

- Iniciar a lib
Note, easy-pix é uma classe que precisa ser iniciada antes de ser usada.
```js
const EasyPixLib = new EasyPix(Chave);
```

# Docs
<details>
  <summary>Exibir docs</summary>
  
# EasyPix: Constructor
O construtor EasyPix recebe parametros obrigatorios e opcionais, sendo eles:

**Obrigatorios**:
- **apiKey**: A chave de api, por padrão, a sua chave asaas sandbox.

**Opcionais**:<br />
- **useSandbox**: Define se é a api em modo de testes ou não, por padrão vem definido como true, lembre-se, a chave de api deve acompanhar esse argumento, se sua chave for sandbox, isso deve ser definido como true, se não, como false
- **loopSecondsDelay**: Define o tempo do loop que irá checar se os pagamentos foram efetuados ou não. Por padrão vem definido como 60 segundos.
- **provider**: O provedor do gatway. Atualmente so asaas é suportado.
- **configPath**: Caminho do json de configuração. É onde será salvo os pagamentos pendentes para caso o script venha a cair, os dados ainda estejam salvos.

# EasyPix: Metódos:
A classe easypix após iniciada exporta alguns metódos para acesso. Confira-os:

<details>
  <summary>EasyPixLib.onDue e EasyPixLib.onPaid</summary>
  
### onDue e onPaid
São os callbacks de quando um pix é pagou ou expirado. Recebe uma função de argumentos (id: seu id passado para o pagamento, metadata: seus_metadados), sendo aplicado como:
```js
EasyPixLib.onDue((id: string, metadata: any): void => {});
```
Ou:
```js
EasyPixLib.onPaid((id: string, metadata: any): void => {});
```
</details>

<details>
  <summary>EasyPixLib.create</summary>
  
## EasyPixLib.create

Sua função mais parceira. Ela cria codigos pix expiraveis pra você.

### Parâmetros:

- **id** (string): Identificador único para a transação PIX.
- **clientName** (string): Nome do cliente associado à transação.
- **cpfCnpj** (string): Documento identificador do cliente (sem pontuação).
- **value** (number): Valor a ser cobrado na transação PIX.
- **description** (string): Descrição da transação PIX.
- **expiresIn** (number): Tempo de expiração da transação em segundos 
  - Padrão: 5 minutos
  - Mínimo: 1 minuto
  - Máximo: 48 horas
- **metadata** (any): Dados adicionais a serem salvos na transação e recuperados posteriormente.

### Retorno:

- Retorna uma Promise que resolve em um objeto com as seguintes propriedades:

  - **encodedImage** (string): A imagem em formato base64.
  - **payload** (string): O código PIX que pode ser copiado e colado.
  - **expirationDate** (Date): Objeto Date representando a data de expiração da transação PIX.
  - **value** (number): O valor total cobrado na transação PIX.
  - **netValue** (number): O valor líquido após descontos do provedor de gateway.


### Exemplo de Uso:

```javascript
const pix = await EasyPixLib.create(
  id: "Seu identificador único",
  clientName: "Nome do seu cliente",
  cpfCnpj: "Documento identificador do seu cliente (sem pontuação)",
  value: Valor a ser cobrado,
  description: "Descrição do pix",
  expiresIn: Valor em segundos para expiração (padrão: 5 minutos, mínimo: 1 minuto, máximo: 48 horas),
  metadata: são os dados que você quer salvar nesse pagamento e receber depois
);

```

</details>

<details>
  <summary>EasyPixLib.deleteCob</summary>
  
## EasyPixLib.deleteCob

Essa função deleta uma cobrança.

### Parâmetros:

- **id** (string): Seu identificador único da cobrança

### Retorno:

- Retorna uma Promise que resolve em Void

### Exemplo de Uso:

```javascript
await EasyPixLib.deleteCob(
  id: "Seu identificador único"
);

```

</details>

<details>
  <summary>EasyPixLib.transfer</summary>
  
## EasyPixLib.transfer

Essa função faz uma transferencia bancária via pix

### Parâmetros:

- **value** (number): Valor a ser transferido
- **pixAddressKey** (string): A chave pix
- **pixAddressKeyType** ("CPF" | "EMAIL" | "CNPJ" | "PHONE" | "EVP"): Enum do tipo de chave
- **description** (string): Descrição da transferencia.

### Retorno:

- Retorna uma Promise que resolve em um objeto com as seguintes propriedades:

  - **authorized** (boolean): se a transferencia foi autorizada.
  - **transferFee** (number): taxa da transferencia
  - **netValue** (number): o valor(ja descontado da taxa) que foi transferido
  - **value** (number): O valor que foi transferido

### Exemplo de Uso:

```javascript
const pix = await EasyPixLib.transfer(
  value: o valor,
  pixAddressKey: a chave,
  pixAddressKeyType: o tipo da chave,
  description: a descrição.
);

```

</details>

<details>
  <summary>EasyPixLib.pendingPayments</summary>

### pendingPayments
É o objeto de pagamentos pendentes. Pode ser acessado com:
```js
EasyPixLib.pendingPayments;
```
</details>
</details>

# PixMe a coffee ☕
![PixMe a Coffee](https://pixmeacoffee.vercel.app/_next/image?url=https%3A%2F%2Fapi.qrserver.com%2Fv1%2Fcreate-qr-code%2F%3Fsize%3D206x206%26data%3D00020126360014BR.GOV.BCB.PIX0114%2B55329848279105204000053039865802BR5922Ytalo%20da%20Silva%20Batalha6003Uba62070503***63049B02&w=256&q=75 "PixMe a coffee")

# Esse projeto está sob a licença MIT.