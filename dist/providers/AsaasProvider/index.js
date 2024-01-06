"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AsaasProvider = void 0;
const http_status_codes_1 = require("http-status-codes");
const HttpClient_1 = __importDefault(require("../../clients/HttpClient"));
const consts_1 = require("./consts");
const interfaces_1 = require("../../shared/interfaces");
const errors_1 = require("../../clients/HttpClient/errors");
const AsaasProviderError_1 = require("./errors/AsaasProviderError");
const errors_2 = require("../../shared/errors");
class AsaasProvider {
    constructor({ API_KEY = null, useSandbox = true, httpClient = HttpClient_1.default }) {
        if (!API_KEY) {
            throw new errors_2.MissingApiKey();
        }
        this.ASAAS_KEY = API_KEY;
        this.ASAAS_BASE_URL = useSandbox ? consts_1.ASAAS_SAND_BOX_BASE_URL : consts_1.ASAAS_BASE_URL;
        this.httpClient = httpClient;
    }
    getFormatedDateNow() {
        const gmt3 = new Date();
        const year = gmt3.getFullYear() + 1;
        const month = String(gmt3.getMonth() + 1).padStart(2, "0");
        const day = String(gmt3.getDate()).padStart(2, "0");
        return `${year}-${month}-${day}`;
    }
    createCustomer({ name, cpfCnpj }) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { body } = yield this.httpClient.post(`${this.ASAAS_BASE_URL}/customers`, { name, cpfCnpj }, {
                    headers: {
                        access_token: this.ASAAS_KEY,
                    },
                });
                return body;
            }
            catch (error) {
                if (error instanceof errors_1.HttpClientError) {
                    throw new AsaasProviderError_1.AsaasProviderError(`Error creating the customer, expected and id and status code 200, received status ${(0, http_status_codes_1.getStatusCode)(error.statusCodeAsString || '')} and body ${JSON.stringify(error.body)}`);
                }
                throw new AsaasProviderError_1.AsaasProviderError(`Unexpected Error creating the customer - ${error.message} - ${error.stack}`);
            }
        });
    }
    createPayment({ value, dueDate, customer, description, billingType, postalService, externalReference, }) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { body } = yield this.httpClient.post(`${this.ASAAS_BASE_URL}/payments`, {
                    value,
                    dueDate,
                    customer,
                    description,
                    billingType,
                    postalService,
                    externalReference,
                }, {
                    headers: {
                        access_token: this.ASAAS_KEY,
                    },
                });
                return body;
            }
            catch (error) {
                if (error instanceof errors_1.HttpClientError) {
                    throw new AsaasProviderError_1.AsaasProviderError(`Error creating the pix, expected and id and status code 200, received status ${(0, http_status_codes_1.getStatusCode)(error.statusCodeAsString || '')} and body ${JSON.stringify(error.body || '')}`);
                }
                throw new AsaasProviderError_1.AsaasProviderError(`Unexpected Error creating the pix payment - ${error.message} - ${error.stack}`);
            }
        });
    }
    getPixPaymentQrCodeByPaymentId(paymentId) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { body } = yield this.httpClient.get(`${this.ASAAS_BASE_URL}/payments/${paymentId}/pixQrCode`, {
                    headers: {
                        access_token: this.ASAAS_KEY,
                    },
                });
                return body;
            }
            catch (error) {
                if (error instanceof errors_1.HttpClientError) {
                    throw new AsaasProviderError_1.AsaasProviderError(`Error looking for the qr code, expected status code 200, received status ${(0, http_status_codes_1.getStatusCode)(error.statusCodeAsString || '')} and body ${JSON.stringify(error.body || '')}`);
                }
                throw new AsaasProviderError_1.AsaasProviderError(`Unexpected Error looking for the qr code - ${error.message} - ${error.stack}`);
            }
        });
    }
    createPixPayment({ id, name, taxId, value, description }) {
        return __awaiter(this, void 0, void 0, function* () {
            const createdCustomer = yield this.createCustomer({ name, cpfCnpj: taxId });
            const dueDate = this.getFormatedDateNow();
            const pixPayment = yield this.createPayment({
                value,
                dueDate,
                description,
                billingType: interfaces_1.BILLING_TYPE.PIX,
                postalService: false,
                externalReference: id,
                customer: createdCustomer.id,
            });
            const qrCode = yield this.getPixPaymentQrCodeByPaymentId(pixPayment.id);
            return {
                encodedImage: qrCode.encodedImage,
                payload: qrCode.payload,
                expirationDate: qrCode.expirationDate,
                originalId: pixPayment.id,
                value: pixPayment.value,
                netValue: pixPayment.netValue,
            };
        });
    }
    getPixPaymentStatusByPaymentId(paymentId) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { body: { status: paymentStatus } } = yield this.httpClient.get(`${this.ASAAS_BASE_URL}/payments/${paymentId}/status`, {
                    headers: {
                        access_token: this.ASAAS_KEY,
                    },
                });
                const pixStatusMap = {
                    "RECEIVED": interfaces_1.PIX_STATUS.CONFIRMED,
                    CONFIRMED: interfaces_1.PIX_STATUS.CONFIRMED,
                    OVERDUE: interfaces_1.PIX_STATUS.OVERDUE,
                    PENDING: interfaces_1.PIX_STATUS.PENDING,
                };
                return pixStatusMap[paymentStatus] || interfaces_1.PIX_STATUS.PENDING;
            }
            catch (error) {
                if (error instanceof errors_1.HttpClientError) {
                    throw new AsaasProviderError_1.AsaasProviderError(`Error getting the payment status, expected status code 200, received status ${(0, http_status_codes_1.getStatusCode)(error.statusCodeAsString || '')} and body ${JSON.stringify(error.body || '')}`);
                }
                throw new AsaasProviderError_1.AsaasProviderError(`Unexpected Error getting the payment status - ${error.message} - ${error.stack}`);
            }
        });
    }
    deletePixChargeByPaymentId(paymentId) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { body: { deleted: wasDeletedSuccessfuly } } = yield this.httpClient.delete(`${this.ASAAS_BASE_URL}/payments/${paymentId}`, {
                    headers: {
                        access_token: this.ASAAS_KEY,
                    },
                });
                return wasDeletedSuccessfuly;
            }
            catch (error) {
                if (error instanceof errors_1.HttpClientError) {
                    throw new AsaasProviderError_1.AsaasProviderError(`Error deleting, expected status code 200, received status ${(0, http_status_codes_1.getStatusCode)(error.statusCodeAsString || '')} and body ${JSON.stringify(error.body || '')}`);
                }
                throw new AsaasProviderError_1.AsaasProviderError(`Unexpected Error pix charge, expected status code 200, received status - ${error.message} - ${error.stack}`);
            }
        });
    }
    createPixTransfer({ value, description, pixAddressKey, pixAddressKeyType, }) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { body } = yield this.httpClient.post(`${this.ASAAS_BASE_URL}/transfers`, {
                    value,
                    description,
                    pixAddressKey,
                    pixAddressKeyType,
                    operationType: interfaces_1.OPERATION_TYPE.PIX,
                }, {
                    headers: {
                        access_token: this.ASAAS_KEY,
                    },
                });
                return {
                    authorized: body.authorized,
                    transferFee: body.transferFee,
                    netValue: body.netValue,
                    value: body.value,
                };
            }
            catch (error) {
                if (error instanceof errors_1.HttpClientError) {
                    throw new AsaasProviderError_1.AsaasProviderError(`Error creating transfer by pix, expected status code 200, received status ${(0, http_status_codes_1.getStatusCode)(error.statusCodeAsString || '')} and body ${JSON.stringify(error.body || '')}`);
                }
                throw new AsaasProviderError_1.AsaasProviderError(`Unexpected Error creating transfer by pix - ${error.message} - ${error.stack}`);
            }
        });
    }
}
exports.AsaasProvider = AsaasProvider;
