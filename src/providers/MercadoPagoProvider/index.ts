import { getStatusCode } from 'http-status-codes';
import AxiosHttpClientInstance from '../../clients/HttpClient';
import { HttpClientError } from '../../clients/HttpClient/errors';

import { IHttpClient } from "../../clients/HttpClient/interfaces";
import { MethodNotImplemented, MissingApiKey } from "../../shared/errors";
import { ICreatePixPayload, ICreatePixResult, ICreatePixTransferResult, IProvider, IProviderConfig, PIX_STATUS, PROVIDERS } from "../../shared/interfaces";
import { MERCADO_PAGO_BASE_URL } from "./consts";
import { MercadoPagoProviderError } from './errors';
import { ICreatePixPaymentPayload, ICreatePixPaymentResponse, IGetPaymentResponse } from './interfaces';
import { getFormattedDateNow } from '../../shared/getFormattedDateNow';

export class MercadoPagoProvider implements IProvider {
    private readonly BASE_URL: string;

    private readonly API_KEY: string;

    private readonly httpClient: IHttpClient;

    constructor({ API_KEY = null, useSandbox = true, httpClient = AxiosHttpClientInstance }: IProviderConfig) {
        if (!API_KEY) {
            throw new MissingApiKey(PROVIDERS.MERCADO_PAGO);
        }

        this.API_KEY = API_KEY;
        this.BASE_URL = MERCADO_PAGO_BASE_URL;
        this.httpClient = httpClient;
    }

    public async createPixPayment({ id, name: _name, taxId, value, description }: ICreatePixPayload): Promise<ICreatePixResult> {
        try {
            const { body: payment } = await this.httpClient.post<ICreatePixPaymentPayload, ICreatePixPaymentResponse>(
                `${this.BASE_URL}/payments`,
                {
                    description,
                    payer: {
                        email: taxId,
                    },
                    external_reference: id,
                    payment_method_id: "Pix",
                    transaction_amount: value,
                },
                {
                    headers: {
                        Authorization: `Bearer ${this.API_KEY}`,
                        "Content-Type": "application/json",
                    },
                }
            );

            return {
                value,
                originalId: String(payment.id),
                netValue: value - (payment.taxes_amount || 0),
                expirationDate: new Date(
                    payment.date_of_expiration || getFormattedDateNow()
                ),
                payload: payment.point_of_interaction.transaction_data.qr_code,
                encodedImage: payment.point_of_interaction.transaction_data.qr_code_base64,
            };
        } catch (error) {
            if (error instanceof HttpClientError) {
                throw new MercadoPagoProviderError(`Error creating the pix, expected status code 200 or 201, received status ${getStatusCode(error.statusCodeAsString || '')
                    } and body ${JSON.stringify(error.body || '')}`)
            }

            throw new MercadoPagoProviderError(`Unexpected Error creating the pix payment - ${(error as Error).message} - ${(error as Error).stack}`);
        }
    }

    public async getPixPaymentStatusByPaymentId(paymentId: string): Promise<PIX_STATUS> {
        try {
            const { body: { status: paymentStatus } } = await this.httpClient.get<IGetPaymentResponse>(`${this.BASE_URL}/payments/${paymentId}`, {
                headers: {
                    Authorization: `Bearer ${this.API_KEY}`,
                    "Content-Type": "application/json",
                },
            });

            const pixStatusMap = {
                approved: PIX_STATUS.CONFIRMED,
                authorized: PIX_STATUS.CONFIRMED,
                cancelled: PIX_STATUS.OVERDUE,
                rejected: PIX_STATUS.OVERDUE,
            }

            return pixStatusMap[paymentStatus as keyof typeof pixStatusMap] || PIX_STATUS.PENDING;
        } catch (error) {
            if (error instanceof HttpClientError) {
                throw new MercadoPagoProviderError(`Error getting the payment status, expected status code 200, received status ${getStatusCode(error.statusCodeAsString || '')} and body ${JSON.stringify(error.body || '')}`)
            }

            throw new MercadoPagoProviderError(`Unexpected Error getting the payment status - ${(error as Error).message} - ${(error as Error).stack}`);
        }
    }

    public async deletePixChargeByPaymentId(paymentId: string): Promise<boolean> {
        try {
            await this.httpClient.put<{ status: string }, void>(
                `${this.BASE_URL}/payments/${paymentId}`,
                { status: "cancelled" },
                {
                    headers: {
                        Authorization: `Bearer ${this.API_KEY}`,
                        "Content-Type": "application/json",
                    },
                }
            );

            return true;
        } catch (error) {
            if (error instanceof HttpClientError) {
                throw new MercadoPagoProviderError(`Error deleting, expected status code 200, received status ${getStatusCode(error.statusCodeAsString || '')} and body ${JSON.stringify(error.body || '')}`);
            }

            throw new MercadoPagoProviderError(`Unexpected Error pix charge, expected status code 200, received status - ${(error as Error).message} - ${(error as Error).stack}`);
        }
    }

    createPixTransfer(): Promise<ICreatePixTransferResult> {
        throw new MethodNotImplemented(PROVIDERS.MERCADO_PAGO);
    }
}