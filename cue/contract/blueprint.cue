package contract

#Blueprint: Base & {
	type: "blueprint"
	data: {
		selector: [...#Ref]
	}
}

blueprints: [Name=string]: #Blueprint & {
	slug: "\(Name)-blueprint"
}
