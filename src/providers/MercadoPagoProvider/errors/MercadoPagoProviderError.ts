import { PROVIDERS } from "../../../shared/interfaces";

export class MercadoPagoProviderError extends Error {
    public readonly provider = PROVIDERS.MERCADO_PAGO;

    constructor(message = `Unexpected error executing operation in [${PROVIDERS.MERCADO_PAGO} provider`) {
        super(message);
        this.name = this.constructor.name;
        Error.captureStackTrace(this.constructor);
    }
}