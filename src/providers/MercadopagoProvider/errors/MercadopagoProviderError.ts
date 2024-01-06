import { PROVIDERS } from "../../../shared/interfaces";

export class MercadopagoProviderError extends Error {
    public readonly provider = PROVIDERS.MERCADOPAGO;

    constructor(message = `Unexpected error executing operation in [${PROVIDERS.MERCADOPAGO} provider`) {
        super(message);
        this.name = this.constructor.name;
        Error.captureStackTrace(this.constructor);
    }
}