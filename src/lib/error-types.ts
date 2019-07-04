/*
Copyright 2019 Balena Ltd.

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

   http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
*/

import { TypedError } from 'typed-error';
import { ConfigManifestItem } from './controllers/config-manifest/config-manifest-schema';

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

export class ValidationError extends TypedError {
	public property: string;
	public schema: ConfigManifestItem;

	constructor(message: string, property: string, schema: ConfigManifestItem) {
		super(message);
		this.property = property;
		this.schema = schema;
	}
}
