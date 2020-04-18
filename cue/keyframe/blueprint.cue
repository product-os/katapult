package keyframe

Blueprint :: Contract & {
	type: "blueprint"
	data: {
		selector: [...ref]
		links: {
			// TODO
			...
		}
	}
}

blueprints: [Name=_]: Blueprint & {
    slug: "\(Name)-blueprint"
}
