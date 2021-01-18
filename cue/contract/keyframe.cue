package contract

#Keyframe: Base & {
	type: "keyframe"
	children: [...#Ref]
	links: [string]: [string]: string
}

keyframes: [Name=string]: #Keyframe & {
	slug: Name
	children: [
		...#Ref & {
			as:      string | *slug
			version: string
			slug:    string
		},
	]
}