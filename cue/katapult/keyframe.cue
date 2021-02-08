package katapult

for id, blueprint in blueprints {
    keyframes: "\(id)": {
        slug: "\(id)-keyframe",
        data: children: {
            for ref in blueprint.data.selector {
                "\(ref.slug)": contracts[ref.slug]
            }
        }
    }
}

keyframeComponentBySlug: {
    for id, keyframe in keyframes {
        for _, component in keyframe.data.children {
            "\(id)-\(component.slug)": component
        }
    }
}
