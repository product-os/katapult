export declare interface ConfigManifestArgs {
	// To be used for merging target-specific and product config manifest.
	// This feature is not yet implemented
	productRepo?: string;
	schema: object;
	// The merged/unified configManifest path for the environment.
	configManifestPath: string;
}
