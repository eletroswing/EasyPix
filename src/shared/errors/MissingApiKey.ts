import { PROVIDERS } from "../interfaces";

export class MissingApiKey extends Error {
    constructor(public readonly provider = PROVIDERS.ASAAS) {
        super(`[${provider}] - Missing API KEY`);
        this.name = this.constructor.name;
        Error.captureStackTrace(this.constructor);
    }
}