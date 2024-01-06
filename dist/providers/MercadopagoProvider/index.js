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
exports.MercadopagoProvider = void 0;
const mercadopago_1 = require("mercadopago");
const HttpClient_1 = __importDefault(require("../../clients/HttpClient"));
const interfaces_1 = require("../../shared/interfaces");
const MercadopagoProviderError_1 = require("./errors/MercadopagoProviderError");
const errors_1 = require("../../shared/errors");
class MercadopagoProvider {
    constructor({ API_KEY = null, useSandbox = true, httpClient = HttpClient_1.default }) {
        if (!API_KEY) {
            throw new errors_1.MissingApiKey();
        }
        this.MERCADOPAGO_KEY = API_KEY;
        this.MERCADOPAGO_CONFIG_CLIENT = new mercadopago_1.MercadoPagoConfig({ accessToken: API_KEY });
        this.MERCADOPAGO_PAYMENT_CLIENT = new mercadopago_1.Payment(this.MERCADOPAGO_CONFIG_CLIENT);
    }
    getFormatedDateNow() {
        const gmt3 = new Date();
        const year = gmt3.getFullYear() + 1;
        const month = String(gmt3.getMonth() + 1).padStart(2, "0");
        const day = String(gmt3.getDate()).padStart(2, "0");
        return `${year}-${month}-${day}`;
    }
    createPayment({ value, taxId, name, description, payment_method_id, date_of_expiration, external_reference, }) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const formattedDate = date_of_expiration instanceof Date ? date_of_expiration.toISOString() : undefined;
                const data = yield this.MERCADOPAGO_PAYMENT_CLIENT.create({
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
            }
            catch (error) {
                throw new MercadopagoProviderError_1.MercadopagoProviderError(`Unexpected Error creating the pix payment - ${error.message} - ${error.stack}`);
            }
        });
    }
    createPixPayment({ id, name, taxId, value, description }) {
        var _a, _b, _c, _d;
        return __awaiter(this, void 0, void 0, function* () {
            const dueDate = this.getFormatedDateNow();
            const pixPayment = yield this.createPayment({
                value,
                description,
                payment_method_id: interfaces_1.BILLING_TYPE.PIX,
                name: name,
                taxId: taxId,
                date_of_expiration: new Date(dueDate),
                external_reference: id
            });
            return {
                encodedImage: (_b = (_a = pixPayment.point_of_interaction) === null || _a === void 0 ? void 0 : _a.transaction_data) === null || _b === void 0 ? void 0 : _b.qr_code_base64,
                payload: (_d = (_c = pixPayment.point_of_interaction) === null || _c === void 0 ? void 0 : _c.transaction_data) === null || _d === void 0 ? void 0 : _d.qr_code,
                expirationDate: pixPayment.date_of_expiration,
                originalId: pixPayment.id.toString(),
                value: pixPayment.transaction_amount,
                netValue: pixPayment.transaction_amount - (pixPayment.taxes_amount || 0),
            };
        });
    }
    getPixPaymentStatusByPaymentId(paymentId) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { status } = yield this.MERCADOPAGO_PAYMENT_CLIENT.get({ id: paymentId });
                const pixStatusMap = {
                    "approved": interfaces_1.PIX_STATUS.CONFIRMED,
                    "authorized": interfaces_1.PIX_STATUS.CONFIRMED,
                    "cancelled": interfaces_1.PIX_STATUS.OVERDUE,
                    "rejected": interfaces_1.PIX_STATUS.OVERDUE,
                    "pending": interfaces_1.PIX_STATUS.PENDING,
                };
                const mappedStatus = status ? pixStatusMap[status] : undefined;
                return mappedStatus || interfaces_1.PIX_STATUS.PENDING;
            }
            catch (error) {
                throw new MercadopagoProviderError_1.MercadopagoProviderError(`Unexpected Error getting the payment status - ${error.message} - ${error.stack}`);
            }
        });
    }
    deletePixChargeByPaymentId(paymentId) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                yield this.MERCADOPAGO_PAYMENT_CLIENT.cancel({ id: paymentId });
                return true;
            }
            catch (error) {
                throw new MercadopagoProviderError_1.MercadopagoProviderError(`Unexpected Error pix charge, expected status code 200, received status - ${error.message} - ${error.stack}`);
            }
        });
    }
    createPixTransfer(...args) {
        return __awaiter(this, void 0, void 0, function* () {
            throw new MercadopagoProviderError_1.MercadopagoProviderError(`Unexpected Error creating transfer by pix - Method not implemented by the gateway`);
        });
    }
}
exports.MercadopagoProvider = MercadopagoProvider;
