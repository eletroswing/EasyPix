export class MethodNotImplemented extends Error {
    constructor(public readonly provider: string) {
        super(`[${provider}] - this method does not exists on current provider`);
        this.name = this.constructor.name;
        Error.captureStackTrace(this.constructor);
    }
}