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
var __classPrivateFieldSet = (this && this.__classPrivateFieldSet) || function (receiver, state, value, kind, f) {
    if (kind === "m") throw new TypeError("Private method is not writable");
    if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a setter");
    if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot write private member to an object whose class did not declare it");
    return (kind === "a" ? f.call(receiver, value) : f ? f.value = value : state.set(receiver, value)), value;
};
var __classPrivateFieldGet = (this && this.__classPrivateFieldGet) || function (receiver, state, kind, f) {
    if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a getter");
    if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot read private member from an object whose class did not declare it");
    return kind === "m" ? f : kind === "a" ? f.call(receiver) : f ? f.value : state.get(receiver);
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var _MercadopagoRequests_MP_KEY;
Object.defineProperty(exports, "__esModule", { value: true });
const axios_1 = __importDefault(require("axios"));
class MercadopagoRequests {
    //use sandbox url by defualt
    constructor(MP_KEY = null, useSandbox = true) {
        _MercadopagoRequests_MP_KEY.set(this, void 0);
        if (!MP_KEY)
            throw new Error("Missing mercado-pago api key");
        this._MP_KEY = MP_KEY;
        __classPrivateFieldSet(this, _MercadopagoRequests_MP_KEY, `Bearer ${MP_KEY}`, "f");
        this._MP_BASE_URL = `https://api.mercadopago.com/v1`;
    }
    generatePix(options) {
        var _a;
        return __awaiter(this, void 0, void 0, function* () {
            const body = {
                description: options.description,
                transaction_amount: options.value,
                payment_method_id: "pix",
                payer: {
                    email: options.cpfCnpj,
                },
                external_reference: options.id,
            };
            const createPaymentData = yield axios_1.default.post(`${this._MP_BASE_URL}/payments`, body, {
                headers: {
                    Authorization: __classPrivateFieldGet(this, _MercadopagoRequests_MP_KEY, "f"),
                    "Content-Type": "application/json",
                },
            });
            const createPaymentBody = yield createPaymentData.data;
            if (createPaymentData.status != 200 && createPaymentData.status != 201)
                throw new Error(`Error creating the pix, expected status code 200 or 201, received status ${createPaymentData.status} and body ${JSON.stringify(createPaymentBody)}`);
            const gmt3 = new Date();
            const year = gmt3.getFullYear() + 1;
            const month = String(gmt3.getMonth() + 1).padStart(2, "0");
            const day = String(gmt3.getDate()).padStart(2, "0");
            const formatedDate = `${year}-${month}-${day}`;
            return {
                encodedImage: createPaymentBody.point_of_interaction.transaction_data.qr_code_base64,
                payload: createPaymentBody.point_of_interaction.transaction_data.qr_code,
                expirationDate: new Date(createPaymentBody.date_of_expiration || formatedDate),
                originalId: (_a = createPaymentBody.id) === null || _a === void 0 ? void 0 : _a.toString(),
                value: options.value,
                netValue: options.value - (createPaymentBody.taxes_amount || 0),
            };
        });
    }
    getPixStatus(id) {
        return __awaiter(this, void 0, void 0, function* () {
            const response = yield axios_1.default.get(`${this._MP_BASE_URL}/payments/${id}`, {
                headers: {
                    Authorization: __classPrivateFieldGet(this, _MercadopagoRequests_MP_KEY, "f"),
                    "Content-Type": "application/json",
                },
            });
            const data = yield response.data;
            if (response.status != 200 || !data.status)
                throw new Error(`Error getting the status, expected status code 200, received status ${response.status} and body ${data}`);
            switch (data.status) {
                case "approved":
                    return "CONFIRMED";
                case "authorized":
                    return "CONFIRMED";
                case "cancelled":
                    return "OVERDUE";
                case "rejected":
                    return "OVERDUE";
                default:
                    return "PENDING";
            }
        });
    }
    delPixCob(id) {
        return __awaiter(this, void 0, void 0, function* () {
            yield axios_1.default.put(`${this._MP_BASE_URL}/payments/${id}`, { status: "cancelled" }, {
                headers: {
                    Authorization: __classPrivateFieldGet(this, _MercadopagoRequests_MP_KEY, "f"),
                    "Content-Type": "application/json",
                },
            });
            return true;
        });
    }
    transfer(value, pixAddressKey, pixAddressKeyType, description) {
        return __awaiter(this, void 0, void 0, function* () {
            throw new Error(`Not implemented by the gatway`);
        });
    }
}
_MercadopagoRequests_MP_KEY = new WeakMap();
exports.default = MercadopagoRequests;
module.exports = MercadopagoRequests;
