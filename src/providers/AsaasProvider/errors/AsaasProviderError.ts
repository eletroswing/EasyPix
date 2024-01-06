import { PROVIDERS } from "../../../shared/interfaces";

export class AsaasProviderError extends Error {
    public readonly provider = PROVIDERS.ASAAS;

    constructor(message = `Unexpected error executing operation in [${PROVIDERS.ASAAS} provider`) {
        super(message);
        this.name = this.constructor.name;
        Error.captureStackTrace(this.constructor);
    }
}