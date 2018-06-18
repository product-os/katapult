import { ApiClient as ApiClientBase } from 'kubernetes-client';

interface ApiVersion {
	v1: any;
}

export interface ApiClient extends ApiClientBase {
	api: ApiVersion;
	loadSpec(): any;
}
