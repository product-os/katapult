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

blueprints: [Name=string]: Blueprint & {
	slug: "\(Name)-blueprint"
}
