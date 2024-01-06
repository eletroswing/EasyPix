import { getStatusCode } from "http-status-codes";
import { MercadoPagoConfig, Payment } from "mercadopago";

import AxiosHttpClientInstance from '../../clients/HttpClient';
import { BILLING_TYPE, ICreatePixPayload, ICreatePixResult, ICreatePixTransferPayload, ICreatePixTransferResult, IProvider, IProviderConfig, OPERATION_TYPE, PIX_STATUS } from "../../shared/interfaces";
import { HttpClientError } from "../../clients/HttpClient/errors";
import { MercadopagoProviderError } from "./errors/MercadopagoProviderError";
import { MissingApiKey } from "../../shared/errors";
import { ICreatePixPaymentPayload } from "./interfaces";
import { PaymentResponse } from "mercadopago/dist/clients/payment/commonTypes";

export class MercadopagoProvider implements IProvider {
    private readonly MERCADOPAGO_CONFIG_CLIENT: MercadoPagoConfig;
    private readonly MERCADOPAGO_PAYMENT_CLIENT: Payment;

    private readonly MERCADOPAGO_KEY: string;

    constructor({ API_KEY = null, useSandbox = true, httpClient = AxiosHttpClientInstance }: IProviderConfig) {
        if (!API_KEY) {
            throw new MissingApiKey();
        }

        this.MERCADOPAGO_KEY = API_KEY;
        this.MERCADOPAGO_CONFIG_CLIENT = new MercadoPagoConfig({ accessToken: API_KEY});
        this.MERCADOPAGO_PAYMENT_CLIENT = new Payment(this.MERCADOPAGO_CONFIG_CLIENT);
    }

    private getFormatedDateNow(): string {
        const gmt3 = new Date();
        const year = gmt3.getFullYear() + 1;
        const month = String(gmt3.getMonth() + 1).padStart(2, "0");
        const day = String(gmt3.getDate()).padStart(2, "0");
        return `${year}-${month}-${day}`;
    }

    private async createPayment({
        value,
        taxId,
        name,       
        description,
        payment_method_id,
        date_of_expiration,
        external_reference,
    }: ICreatePixPaymentPayload): Promise<PaymentResponse> {
        try {
            const formattedDate = date_of_expiration instanceof Date ? date_of_expiration.toISOString() : undefined;

            const data = await this.MERCADOPAGO_PAYMENT_CLIENT.create({
                body: {
                    description: description,
                    transaction_amount: value,
                    payer: {
                        email: taxId,
                        first_name: name.split(" ")[0] || " "
                    },
                    external_reference: external_reference,
                    payment_method_id: payment_method_id,
                    date_of_expiration: formattedDate,
                }
            });

            return data;
        } catch (error) {
            throw new MercadopagoProviderError(
                `Unexpected Error creating the pix payment - ${(error as Error).message} - ${(error as Error).stack}`
            );
        }

    }

    public async createPixPayment({ id, name, taxId, value, description }: ICreatePixPayload): Promise<ICreatePixResult> {
        const dueDate = this.getFormatedDateNow();
        const pixPayment = await this.createPayment({
            value,
            description,
            payment_method_id: BILLING_TYPE.PIX,
            name: name,
            taxId: taxId,
            date_of_expiration: new Date(dueDate),
            external_reference: id
        })

        return {
            encodedImage: pixPayment.point_of_interaction?.transaction_data?.qr_code_base64 as string,
            payload: pixPayment.point_of_interaction?.transaction_data?.qr_code as string,
            expirationDate: pixPayment.date_of_expiration as string,
            originalId: (pixPayment.id as number).toString(),
            value: pixPayment.transaction_amount as number,
            netValue: pixPayment.transaction_amount as number - (pixPayment.taxes_amount as number || 0),
        };
    }

    public async getPixPaymentStatusByPaymentId(paymentId: string): Promise<PIX_STATUS> {
        try {
            const { status } = await this.MERCADOPAGO_PAYMENT_CLIENT.get({id: paymentId});
            
            const pixStatusMap: any = {
                "approved": PIX_STATUS.CONFIRMED,
                "authorized": PIX_STATUS.CONFIRMED,
                "cancelled": PIX_STATUS.OVERDUE,
                "rejected": PIX_STATUS.OVERDUE,
                "pending": PIX_STATUS.PENDING,
            }
            
            const mappedStatus = status ? pixStatusMap[status] : undefined;
            return mappedStatus || PIX_STATUS.PENDING;
        } catch (error) {
            throw new MercadopagoProviderError(
                `Unexpected Error getting the payment status - ${(error as Error).message} - ${(error as Error).stack}`
            );
        }
    }

    public async deletePixChargeByPaymentId(paymentId: string): Promise<boolean> {
        try {
            await this.MERCADOPAGO_PAYMENT_CLIENT.cancel({id: paymentId});
            return true;
        } catch (error) {
            throw new MercadopagoProviderError(
                `Unexpected Error pix charge, expected status code 200, received status - ${(error as Error).message} - ${(error as Error).stack}`
            );
        }
    }

    public async createPixTransfer(...args: any): Promise<ICreatePixTransferResult> {
        throw new MercadopagoProviderError(
            `Unexpected Error creating transfer by pix - Method not implemented by the gateway`
        );
    }
}