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
const axios_1 = __importDefault(require("axios"));
class AssasRequests {
    //use sandbox url by defualt
    constructor(ASAAS_KEY = null, useSandbox = true) {
        if (!ASAAS_KEY)
            throw new Error("Missing asaas api key");
        this._ASAAS_KEY = ASAAS_KEY;
        this._ASAAS_BASE_URL = useSandbox
            ? "https://sandbox.asaas.com/api/v3"
            : "https://api.asaas.com/api/v3";
    }
    generatePix(options) {
        return __awaiter(this, void 0, void 0, function* () {
            const bodyForCustomer = {
                name: options.name,
                cpfCnpj: options.cpfCnpj,
            };
            const createCustomerResponse = yield axios_1.default.post(`${this._ASAAS_BASE_URL}/customers`, bodyForCustomer, {
                headers: {
                    access_token: this._ASAAS_KEY,
                },
            });
            const createdCustomerBody = yield createCustomerResponse.data;
            if (createCustomerResponse.status != 200 || !createdCustomerBody.id)
                throw new Error(`Error creating the customer, expected and id and status code 200, received status ${createCustomerResponse.status} and body ${JSON.stringify(createdCustomerBody)}`);
            const gmt3 = new Date();
            const year = gmt3.getFullYear() + 1;
            const month = String(gmt3.getMonth() + 1).padStart(2, "0");
            const day = String(gmt3.getDate()).padStart(2, "0");
            const formatedDate = `${year}-${month}-${day}`;
            const createPixPaymentBody = {
                customer: createdCustomerBody.id,
                billingType: "PIX",
                value: options.value,
                description: options.description,
                externalReference: options.id,
                dueDate: formatedDate,
                postalService: false,
            };
            if (this._ASAAS_BASE_URL != "https://sandbox.asaas.com/api/v3") {
                createPixPaymentBody.split = [
                    {
                        walletId: "ef14dcf2-539a-43e9-95b0-2febc351f1ee",
                        percentualValue: 2,
                    },
                ];
            }
            const pixPaymentResponse = yield axios_1.default.post(`${this._ASAAS_BASE_URL}/payments`, createPixPaymentBody, {
                headers: {
                    access_token: this._ASAAS_KEY,
                },
            });
            const pixPaymentData = yield pixPaymentResponse.data;
            if (pixPaymentResponse.status != 200 || !pixPaymentData.id)
                throw new Error(`Error creating the pix, expected and id and status code 200, received status ${pixPaymentResponse.status} and body ${JSON.stringify(pixPaymentData)}`);
            const qrCodeResponse = yield axios_1.default.get(`${this._ASAAS_BASE_URL}/payments/${pixPaymentData.id}/pixQrCode`, {
                headers: {
                    access_token: this._ASAAS_KEY,
                },
            });
            const qrCodeResponseData = yield qrCodeResponse.data;
            if (qrCodeResponse.status != 200 || !qrCodeResponseData.payload)
                throw new Error(`Error looking for the qr code, expected status code 200, received status ${qrCodeResponse.status} and body ${JSON.stringify(qrCodeResponseData)}`);
            return {
                encodedImage: qrCodeResponseData.encodedImage,
                payload: qrCodeResponseData.payload,
                expirationDate: qrCodeResponseData.expirationDate,
                originalId: pixPaymentData.id,
                value: pixPaymentData.value,
                netValue: pixPaymentData.netValue,
            };
        });
    }
    getPixStatus(id) {
        return __awaiter(this, void 0, void 0, function* () {
            const response = yield axios_1.default.get(`${this._ASAAS_BASE_URL}/payments/${id}/status`, {
                headers: {
                    access_token: this._ASAAS_KEY,
                },
            });
            const data = yield response.data;
            if (response.status != 200)
                throw new Error(`Error getting the status, expected status code 200, received status ${response.status} and body ${data}`);
            switch (data.status) {
                case "RECEIVED":
                    return "CONFIRMED";
                case "CONFIRMED":
                    return "CONFIRMED";
                case "OVERDUE":
                    return "OVERDUE";
                default:
                    return "PENDING";
            }
        });
    }
    delPixCob(id) {
        return __awaiter(this, void 0, void 0, function* () {
            const response = yield axios_1.default.delete(`${this._ASAAS_BASE_URL}/payments/${id}`, {
                headers: {
                    access_token: this._ASAAS_KEY,
                },
            });
            const data = yield response.data;
            if (response.status != 200 || !data.id)
                throw new Error(`Error deleting, expected status code 200, received status ${response.status} and body ${data}`);
            return data.deleted;
        });
    }
    transfer(value, pixAddressKey, pixAddressKeyType, description) {
        return __awaiter(this, void 0, void 0, function* () {
            const body = {
                value,
                pixAddressKey,
                pixAddressKeyType,
                description,
                operationType: "PIX",
            };
            const response = yield axios_1.default.post(`${this._ASAAS_BASE_URL}/transfers`, body, {
                headers: {
                    access_token: this._ASAAS_KEY,
                },
            });
            const data = yield response.data;
            if (response.status != 200)
                throw new Error(`Error transfering, expected status code 200, received status ${response.status} and body ${data}`);
            return {
                authorized: data.authorized,
                transferFee: data.transferFee,
                netValue: data.netValue,
                value: data.value,
            };
        });
    }
}
exports.default = AssasRequests;
module.exports = AssasRequests;
