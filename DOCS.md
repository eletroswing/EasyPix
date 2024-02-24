
# Como usar
- Primeiro instale a lib:
```bash
npm install easy-pix
```

- Importe a lib
```js
import {EasyPix} from "easy-pix";
```

- Iniciar a lib<br >
> Note, easy-pix é uma classe que precisa ser iniciada antes de ser usada.
```js
const EasyPix = new EasyPix({config});
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
- **provider**: O provedor do gateway. Pode ser "ASAAS" e "MERCADOPAGO", importe de PROVIDERS.
- **configPath**: Caminho do json de configuração. É onde será salvo os pagamentos pendentes para caso o script venha a cair, os dados ainda estejam salvos.

# EasyPix: Metódos:
A classe easypix após iniciada exporta alguns metódos para acesso. Confira-os:

<details>
  <summary>EasyPix.onDue e EasyPix.onPaid</summary>
  
### onDue e onPaid
São os callbacks de quando um pix é pagou ou expirado. Recebe uma função de argumentos (id: seu id passado para o pagamento, metadata: seus_metadados), sendo aplicado como:
```js
EasyPix.onDue((id: string, metadata: any): void => {});
```
Ou:
```js
EasyPix.onPaid((id: string, metadata: any): void => {});
```
</details>

<details>
  <summary>EasyPix.create</summary>
  
## EasyPix.create

Sua função mais parceira. Ela cria codigos pix expiraveis pra você.

### Parâmetros:

- **id** (string): Identificador único para a transação PIX.
- **clientName** (string): Nome do cliente associado à transação.
- **taxId** (string): Documento identificador do cliente (sem pontuação), no asaas o cpf ou cnpj. no mercado pago o email.
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
const pix = await EasyPix.create(
  {
    id: "Seu identificador único",
    clientName: "Nome do seu cliente",
    taxId: "Documento identificador do seu cliente",
    value: Valor a ser cobrado,
    description: "Descrição do pix",
    expiresIn: Valor em segundos para expiração (padrão: 5 minutos, mínimo: 1 minuto, máximo: 48 horas),
    metadata: são os dados que você quer salvar nesse pagamento e receber depois
  }
);

```

</details>

<details>
  <summary>EasyPix.deleteCob</summary>
  
## EasyPix.deleteCob

Essa função deleta uma cobrança.

### Parâmetros:

- **id** (string): Seu identificador único da cobrança

### Retorno:

- Retorna uma Promise que resolve em Void

### Exemplo de Uso:

```javascript
await EasyPix.deleteCob("Seu identificador único");
```

</details>

<details>
  <summary>EasyPix.transfer</summary>
  
## EasyPix.transfer

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
const pix = await EasyPix.transfer({
    value: o valor,
    pixAddressKey: a chave,
    pixAddressKeyType: o tipo da chave,
    description: a descrição.
});

```

</details>

<details>
  <summary>EasyPix.quit</summary>
  
## EasyPix.quit

Essa função encerra o main loop da biblioteca. Ideal para fechar o programa.

### Parâmetros:
Nenhum

### Retorno:
Nenhum

### Exemplo de Uso:

```javascript
await EasyPix.quit()
```

</details>

<details>
  <summary>EasyPix.pendingPayments</summary>

### pendingPayments
É o objeto de pagamentos pendentes. Pode ser acessado com:
```js
EasyPix.pendingPayments;
```
</details>
</details>

# PixMe a coffee ☕
+32 984827910

# Esse projeto está sob a licença MIT.
