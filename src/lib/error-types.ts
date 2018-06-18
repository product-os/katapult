import { TypedError } from 'typed-error';

export class ConfigStoreAdapterError extends TypedError {
	constructor(message: string) {
		super(message);
	}
}

export class NotImplementedError extends TypedError {
	constructor(message: string) {
		super(message);
	}
}

export class UnsupportedError extends TypedError {
	constructor(message: string) {
		super(message);
	}
}

export class FileLoadError extends TypedError {
	constructor(message: string) {
		super(message);
	}
}

export class URILoadError extends TypedError {
	constructor(message: string) {
		super(message);
	}
}
