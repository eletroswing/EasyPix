import { IHttpClient } from "../../clients/HttpClient/interfaces";

export enum PIX_STATUS {
    "PENDING" = "PENDING",
    "OVERDUE" = "OVERDUE",
    "CONFIRMED" = "CONFIRMED",
}

export enum BILLING_TYPE {
    PIX = 'PIX',
    CREDIT_CARD = 'CREDIT_CARD',
    BANK_BILL = 'BOLETO'
}

export enum OPERATION_TYPE {
    PIX = 'PIX',
    TED = 'TED',
}

export enum PIX_ADDRESS_KEY_TYPE {
    TAX_ID = "CPF",
    EMAIL = "EMAIL",
    EMPLOYER_IDENTIFICATION = "CNPJ",
    PHONE = "PHONE",
    EVP = "EVP",
}

export interface ICreatePixPayload {
    id: string;
    name: string;
    taxId: string;
    value: number;
    description: string;
}

export interface ICreatePixResult {
    value: number;
    payload: string;
    netValue: number;
    originalId: string;
    encodedImage: string;
    expirationDate: Date | string;
}

export interface ICreatePixTransferPayload {
    value: number;
    description: string;
    pixAddressKey: string;
    operationType: OPERATION_TYPE;
    pixAddressKeyType: PIX_ADDRESS_KEY_TYPE;
}

export interface ICreatePixTransferResult {
    authorized: boolean;
    transferFee: number;
    netValue: number;
    value: number;
}

export interface IPendingPayment {
    id: string;
    originalId: string;
    expirationDate: Date;
    metadata: any;
    value: number;
    netValue: number;
}

export enum PROVIDERS {
    ASAAS = "ASAAS",
}

export interface IProvider {
    createPixPayment({ id, name, taxId, value, description }: ICreatePixPayload): Promise<ICreatePixResult>;
    getPixPaymentStatusByPaymentId(id: string): Promise<PIX_STATUS>;
    deletePixChargeByPaymentId(paymentId: string): Promise<boolean>;
    createPixTransfer({ description, pixAddressKey, pixAddressKeyType, value }: ICreatePixTransferPayload): Promise<ICreatePixTransferResult>;
}

export interface IProviderConfig {
    API_KEY?: string | null;
    useSandbox?: boolean;
    httpClient?: IHttpClient;
}

