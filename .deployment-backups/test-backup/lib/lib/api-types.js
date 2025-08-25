export class BoviAPIError extends Error {
    constructor(code, message, details) {
        super(message);
        this.code = code;
        this.message = message;
        this.details = details;
        this.name = 'BoviAPIError';
    }
}
//# sourceMappingURL=api-types.js.map