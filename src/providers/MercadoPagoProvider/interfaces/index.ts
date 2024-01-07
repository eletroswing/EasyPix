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
    description: string;
    payer: {
        email: string;
    },
    external_reference: string;
    payment_method_id: "Pix" | "Account_money" | "Debin_transfer" | 'Ted' | 'Cvu';
    transaction_amount: number;
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

export interface IPayer {
    id: number
    email: string
    identification: IIdentification
    type: string
}

export interface IIdentification {
    number: number
    type: string
}

export interface IMetadata {}

export interface IAdditionalInfo {
    items: IItem[]
    payer: IPayer2
    shipments: Shipments
}

export interface IItem {
    id: string
    title: string
    description: string
    picture_url: string
    category_id: string
    quantity: number
    unit_price: number
}

export interface IPayer2 {
    registration_date: string
}

export interface Shipments {
    receiver_address: IReceiverAddress
}

export interface IReceiverAddress {
    street_name: string
    street_number: number
    zip_code: number
    city_name: string
    state_name: string
}

export interface ITransactionDetails {
    net_received_amount: number
    total_paid_amount: number
    overpaid_amount: number
    installment_amount: number
}

export interface IFeeDetail {
    type: string
    amount: number
    fee_payer: string
}

export interface IIdentification2 {
    number: number
    type: string
}

export interface ICardholder {
    name: string
    identification: IIdentification2
}

export interface ICard {
    first_six_digits: number
    last_four_digits: number
    expiration_month: number
    expiration_year: number
    date_created: string
    date_last_updated: string
    cardholder: ICardholder
}

export interface IApplicationData {
    name: string
    version: string
}

export interface ITransactionData {
    qr_code_base64: string
    qr_code: string
    ticket_url: string
}

export interface IPointOfInteraction {
    type: string
    application_data: IApplicationData
    transaction_data: ITransactionData
}

export interface ICreatePixPaymentResponse {
    id: number
    date_created: string
    date_of_expiration?: string | null;
    date_approved: string
    date_last_updated: string
    money_release_date: string
    issuer_id: number
    payment_method_id: string
    payment_type_id: string
    status: string
    status_detail: string
    currency_id: string
    description: string
    taxes_amount: number
    shipping_amount: number
    collector_id: number
    payer: IPayer
    metadata: IMetadata
    additional_info: IAdditionalInfo
    external_reference: string
    transaction_amount: number
    transaction_amount_refunded: number
    coupon_amount: number
    transaction_details: ITransactionDetails
    fee_details: IFeeDetail[]
    statement_descriptor: string
    installments: number
    card: ICard
    notification_url: string
    processing_mode: string
    point_of_interaction: IPointOfInteraction
}

export interface IGetPaymentResponse {
    id: number
    date_created: string
    date_of_expiration?: string | null;
    date_approved: string
    date_last_updated: string
    money_release_date: string
    issuer_id: number
    payment_method_id: string
    payment_type_id: string
    status: string
    status_detail: string
    currency_id: string
    description: string
    taxes_amount: number
    shipping_amount: number
    collector_id: number
    payer: IPayer
    metadata: IMetadata
    additional_info: IAdditionalInfo
    external_reference: string
    transaction_amount: number
    transaction_amount_refunded: number
    coupon_amount: number
    transaction_details: ITransactionDetails
    fee_details: IFeeDetail[]
    statement_descriptor: string
    installments: number
    card: ICard
    notification_url: string
    processing_mode: string
    point_of_interaction: IPointOfInteraction
}