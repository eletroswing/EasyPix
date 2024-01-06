"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MercadopagoProviderError = void 0;
const interfaces_1 = require("../../../shared/interfaces");
class MercadopagoProviderError extends Error {
    constructor(message = `Unexpected error executing operation in [${interfaces_1.PROVIDERS.MERCADOPAGO} provider`) {
        super(message);
        this.provider = interfaces_1.PROVIDERS.MERCADOPAGO;
        this.name = this.constructor.name;
        Error.captureStackTrace(this.constructor);
    }
}
exports.MercadopagoProviderError = MercadopagoProviderError;
