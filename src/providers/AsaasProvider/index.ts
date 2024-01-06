import { getStatusCode } from "http-status-codes";

import AxiosHttpClientInstance from '../../clients/HttpClient';
import { ASAAS_BASE_URL, ASAAS_SAND_BOX_BASE_URL } from "./consts";
import { BILLING_TYPE, ICreatePixPayload, ICreatePixResult, ICreatePixTransferPayload, ICreatePixTransferResult, IProvider, IProviderConfig, OPERATION_TYPE, PIX_STATUS } from "../../shared/interfaces";
import { ICreateCustomerPayload, ICreateCustomerResponse, ICreatePixPaymentPayload, ICreatePixPaymentResponse, ICreatePixTransferResponse, IDeletePixChargeByPaymentIdResponse, IGetPaymentStatusByPaymentIdResponse, IGetQrCodeByPaymentIdResponse } from "./interfaces";
import { HttpClientError } from "../../clients/HttpClient/errors";
import { IHttpClient } from "../../clients/HttpClient/interfaces";
import { AsaasProviderError } from "./errors/AsaasProviderError";
import { MissingApiKey } from "../../shared/errors";

export class AsaasProvider implements IProvider {
    private readonly ASAAS_BASE_URL: string;

    private readonly ASAAS_KEY: string;

    private readonly httpClient: IHttpClient;

    constructor({ API_KEY = null, useSandbox = true, httpClient = AxiosHttpClientInstance }: IProviderConfig) {
        if (!API_KEY) {
            throw new MissingApiKey();
        }

        this.ASAAS_KEY = API_KEY;
        this.ASAAS_BASE_URL = useSandbox ? ASAAS_SAND_BOX_BASE_URL : ASAAS_BASE_URL;
        this.httpClient = httpClient;
    }

    private getFormatedDateNow(): string {
        const gmt3 = new Date();
        const year = gmt3.getFullYear() + 1;
        const month = String(gmt3.getMonth() + 1).padStart(2, "0");
        const day = String(gmt3.getDate()).padStart(2, "0");
        return `${year}-${month}-${day}`;
    }

    private async createCustomer({ name, cpfCnpj }: ICreateCustomerPayload): Promise<ICreateCustomerResponse> {
        try {
            const { body } = await this.httpClient.post<ICreateCustomerPayload, ICreateCustomerResponse>(
                `${this.ASAAS_BASE_URL}/customers`,
                { name, cpfCnpj },
                {
                    headers: {
                        access_token: this.ASAAS_KEY,
                    },
                }
            );

            return body;
        } catch (error) {
            if (error instanceof HttpClientError) {
                throw new AsaasProviderError(
                    `Error creating the customer, expected and id and status code 200, received status ${getStatusCode(error.statusCodeAsString || '')
                    } and body ${JSON.stringify(error.body)}`
                );
            }

            throw new AsaasProviderError(
                `Unexpected Error creating the customer - ${(error as Error).message} - ${(error as Error).stack}`,
            );
        }
    }

    private async createPayment({
        value,
        dueDate,
        customer,
        description,
        billingType,
        postalService,
        externalReference,
    }: ICreatePixPaymentPayload): Promise<ICreatePixPaymentResponse> {
        try {
            const { body } = await this.httpClient.post<ICreatePixPaymentPayload, ICreatePixPaymentResponse>(
                `${this.ASAAS_BASE_URL}/payments`,
                {
                    value,
                    dueDate,
                    customer,
                    description,
                    billingType,
                    postalService,
                    externalReference,
                },
                {
                    headers: {
                        access_token: this.ASAAS_KEY,
                    },
                }
            );

            return body;
        } catch (error) {
            if (error instanceof HttpClientError) {
                throw new AsaasProviderError(
                    `Error creating the pix, expected and id and status code 200, received status ${getStatusCode(error.statusCodeAsString || '')
                    } and body ${JSON.stringify(error.body || '')}`
                );
            }

            throw new AsaasProviderError(
                `Unexpected Error creating the pix payment - ${(error as Error).message} - ${(error as Error).stack}`
            );
        }

    }

    private async getPixPaymentQrCodeByPaymentId(paymentId: string): Promise<IGetQrCodeByPaymentIdResponse> {
        try {
            const { body } = await this.httpClient.get<IGetQrCodeByPaymentIdResponse>(
                `${this.ASAAS_BASE_URL}/payments/${paymentId}/pixQrCode`,
                {
                    headers: {
                        access_token: this.ASAAS_KEY,
                    },
                }
            );

            return body;
        } catch (error) {
            if (error instanceof HttpClientError) {
                throw new AsaasProviderError(
                    `Error looking for the qr code, expected status code 200, received status ${getStatusCode(error.statusCodeAsString || '')
                    } and body ${JSON.stringify(error.body || '')}`
                );
            }

            throw new AsaasProviderError(
                `Unexpected Error looking for the qr code - ${(error as Error).message} - ${(error as Error).stack}`
            );
        }
    }

    public async createPixPayment({ id, name, taxId, value, description }: ICreatePixPayload): Promise<ICreatePixResult> {
        const createdCustomer = await this.createCustomer({ name, cpfCnpj: taxId });
        const dueDate = this.getFormatedDateNow();
        const pixPayment = await this.createPayment({
            value,
            dueDate,
            description,
            billingType: BILLING_TYPE.PIX,
            postalService: false,
            externalReference: id,
            customer: createdCustomer.id,
        })

        const qrCode = await this.getPixPaymentQrCodeByPaymentId(pixPayment.id);
        return {
            encodedImage: qrCode.encodedImage,
            payload: qrCode.payload,
            expirationDate: qrCode.expirationDate,
            originalId: pixPayment.id,
            value: pixPayment.value,
            netValue: pixPayment.netValue,
        };
    }

    public async getPixPaymentStatusByPaymentId(paymentId: string): Promise<PIX_STATUS> {
        try {
            const { body: { status: paymentStatus } } = await this.httpClient.get<IGetPaymentStatusByPaymentIdResponse>(
                `${this.ASAAS_BASE_URL}/payments/${paymentId}/status`,
                {
                    headers: {
                        access_token: this.ASAAS_KEY,
                    },
                }
            );

            const pixStatusMap = {
                "RECEIVED": PIX_STATUS.CONFIRMED,
                CONFIRMED: PIX_STATUS.CONFIRMED,
                OVERDUE: PIX_STATUS.OVERDUE,
                PENDING: PIX_STATUS.PENDING,
            }

            return pixStatusMap[paymentStatus] || PIX_STATUS.PENDING;
        } catch (error) {
            if (error instanceof HttpClientError) {
                throw new AsaasProviderError(
                    `Error getting the payment status, expected status code 200, received status ${getStatusCode(error.statusCodeAsString || '')} and body ${JSON.stringify(error.body || '')}`
                );
            }

            throw new AsaasProviderError(
                `Unexpected Error getting the payment status - ${(error as Error).message} - ${(error as Error).stack}`
            );
        }
    }

    public async deletePixChargeByPaymentId(paymentId: string): Promise<boolean> {
        try {
            const { body: { deleted: wasDeletedSuccessfuly } } = await this.httpClient.delete<IDeletePixChargeByPaymentIdResponse>(
                `${this.ASAAS_BASE_URL}/payments/${paymentId}`,
                {
                    headers: {
                        access_token: this.ASAAS_KEY,
                    },
                }
            );

            return wasDeletedSuccessfuly;
        } catch (error) {

            if (error instanceof HttpClientError) {
                throw new AsaasProviderError(
                    `Error deleting, expected status code 200, received status ${getStatusCode(error.statusCodeAsString || '')} and body ${JSON.stringify(error.body || '')}`
                );
            }

            throw new AsaasProviderError(
                `Unexpected Error pix charge, expected status code 200, received status - ${(error as Error).message} - ${(error as Error).stack}`
            );
        }

    }

    public async createPixTransfer({
        value,
        description,
        pixAddressKey,
        pixAddressKeyType,
    }: ICreatePixTransferPayload): Promise<ICreatePixTransferResult> {
        try {
            const { body } = await this.httpClient.post<ICreatePixTransferPayload, ICreatePixTransferResponse>(
                `${this.ASAAS_BASE_URL}/transfers`,
                {
                    value,
                    description,
                    pixAddressKey,
                    pixAddressKeyType,
                    operationType: OPERATION_TYPE.PIX,
                },
                {
                    headers: {
                        access_token: this.ASAAS_KEY,
                    },
                }
            );

            return {
                authorized: body.authorized,
                transferFee: body.transferFee,
                netValue: body.netValue,
                value: body.value,
            };
        } catch (error) {
            if (error instanceof HttpClientError) {
                throw new AsaasProviderError(
                    `Error creating transfer by pix, expected status code 200, received status ${getStatusCode(error.statusCodeAsString || '')} and body ${JSON.stringify(error.body || '')}`
                );
            }

            throw new AsaasProviderError(
                `Unexpected Error creating transfer by pix - ${(error as Error).message} - ${(error as Error).stack}`
            );
        }
    }
}