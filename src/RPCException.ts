export class RPCException extends Error {
	public code: number = 0;
	public data?: Uint8Array;

	constructor(message: string, code: number, data?: any) {
		super(message);

		this.code = code;
		this.data = data;
	}
}
