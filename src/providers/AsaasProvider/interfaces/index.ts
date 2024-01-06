import { BILLING_TYPE, OPERATION_TYPE, PIX_ADDRESS_KEY_TYPE, PIX_STATUS } from "../../../shared/interfaces";

export interface ICreateCustomerPayload {
    /**
     * Nome do cliente
     */
    name: string;
    /**
     * CPF ou CNPJ do cliente
     */
    cpfCnpj: string;
    /**
     * Email do cliente
     */
    email?: string;
    /**
     * Fone fixo
     */
    phone?: string;
    /**
     * Fone celular
     */
    mobilePhone?: string;
    /**
     * Logradouro
     */
    address?: string;
    /**
     * Número do endereço
     */
    addressNumber?: string;
    /**
     * Complemento do endereço
     */
    complement?: string;
    /**
     * Bairro
     */
    province?: string;
    /**
     * CEP do endereço
     */
    postalCode?: string;
    /**
     * Identificador do cliente no seu sistema
     */
    externalReference?: string;
    /**
     * true para desabilitar o envio de notificações de cobrança
     */
    notificationDisabled?: boolean;
    /**
     * Emails adicionais para envio de notificações de cobrança separados por ","
     */
    additionalEmails?: string;
    /**
     * Inscrição municipal do cliente
     */
    municipalInscription?: string;
    /**
     * Inscrição estadual do cliente
     */
    stateInscription?: string;
    /**
     * Observações adicionais
     */
    observations?: string;
    /**
     * Nome do grupo ao qual o cliente pertence
     */
    groupName?: string;
    /**
     * Empresa
     */
    company?: string;
}

export interface ICreateCustomerResponse {
    id: string;
    city: number;
    name: string;
    state: string;
    email: string;
    phone: string;
    object: string;
    country: string;
    address: string;
    cpfCnpj: string;
    province: string;
    deleted: boolean;
    postalCode: string;
    personType: string;
    complement: string;
    mobilePhone: string;
    dateCreated: string;
    observations: string;
    addressNumber: string;
    additionalEmails: string;
    externalReference: string;
    notificationDisabled: boolean;
}

export interface ICreatePixPaymentPayload {
    /**
     * Define se a cobrança será enviada via Correios
     */
    postalService?: boolean;
    /**
     * Identificador único do cliente no Asaas
     */
    customer: string;
    /**
     * Forma de pagamento
     */
    billingType: BILLING_TYPE;
    /**
     * Valor da cobrança
     */
    value: number;
    /**
     * Data de vencimento da cobrança
     */
    dueDate: Date | string;
    /**
     * Descrição da cobrança(máx. 500 caracteres)
     */
    description?: string;
    /**
     * Dias após o vencimento para cancelamento do registro(somente para boleto bancário)
     */
    daysAfterDueDateToCancellationRegistration?: number;
    /**
     * Campo livre para busca
     */
    externalReference?: string;
    /**
     * Número de parcelas(somente no caso de cobrança parcelada)
     */
    installmentCount?: number;
    /**
     * Informe o valor total de uma cobrança que será parcelada(somente no caso de cobrança parcelada).Caso enviado este campo o installmentValue não é necessário, o cálculo por parcela será automático.
     */
    totalValue?: number;
    /**
     * Valor de cada parcela(somente no caso de cobrança parcelada).Envie este campo em caso de querer definir o valor de cada parcela.
     */
    installmentValue?: number;
}

export interface IDiscount {
    value: number
    dueDateLimitDays: number
}

export interface IFine {
    value: number
}

export interface IInterest {
    value: number
}

export interface ICreatePixPaymentResponse {
    object: string;
    id: string;
    dateCreated: string;
    customer: string;
    paymentLink: string | null;
    dueDate: string;
    value: number;
    netValue: number;
    billingType: string;
    canBePaidAfterDueDate: boolean;
    pixTransaction: string | null;
    status: string;
    description: string;
    externalReference: string;
    originalValue: number | null;
    interestValue: number | null;
    originalDueDate: string;
    paymentDate: Date | null;
    clientPaymentDate: Date | null;
    installmentNumber: Date | null;
    transactionReceiptUrl: string | null;
    nossoNumero: string;
    invoiceUrl: string;
    bankSlipUrl: string;
    invoiceNumber: string;
    discount: IDiscount;
    fine: IFine;
    interest: IInterest;
    deleted: boolean;
    postalService: boolean;
    anticipated: boolean;
    anticipable: boolean;
    refunds: number | null;
}

export interface IGetQrCodeByPaymentIdResponse {
    payload: string;
    encodedImage: string;
    expirationDate: string;
}

export interface IGetPaymentStatusByPaymentIdResponse {
    status: PIX_STATUS;
}

export interface IDeletePixChargeByPaymentIdResponse {
    id: string;
    deleted: boolean;
}

export interface IBank {
    ispb: string
    code: string
    name: string
}

export interface IBankAccount {
    bank: IBank
    accountName: string
    ownerName: string
    cpfCnpj: string
    agency: string
    account: string
    accountDigit: string
    pixAddressKey: any
}

export interface ICreatePixTransferResponse {
    object: string
    id: string
    type: string
    dateCreated: string
    value: number
    netValue: number
    status: string
    transferFee: number
    effectiveDate: any
    endToEndIdentifier: any
    scheduleDate: string
    authorized: boolean
    failReason: any
    bankAccount: IBankAccount
    transactionReceiptUrl: any
    operationType: string
    description: string
}







