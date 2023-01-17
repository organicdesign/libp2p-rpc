export class RPCException extends Error {
    constructor(message, code, data) {
        super(message);
        this.code = 0;
        this.code = code;
        this.data = data;
    }
}
