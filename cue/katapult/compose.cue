package katapult

import (
    "encoding/yaml"
    "tool/cli"
    "list"
    "github.com/product-os/katapult/cue/adapter/compose"
)

command: printCompose: {
    task: print: cli.Print & {
		text: yaml.MarshalStream([configs[input.product].data])
	}
}

// generate compose service
#func_service: {

    #contract: #SwContainerizedService
    #links: [string]: string
    #isEnvironment: bool
    #id: string

    cap_add: list.FlattenN([ for ref in #contract.requires if (#CapabilitiesRef&ref) != _|_ { ref.data.add } ], 1)
    cap_drop: list.FlattenN([ for ref in #contract.requires if (#CapabilitiesRef&ref) != _|_ { ref.data.drop } ], 1)
    if #contract.data.command != _|_ {
        command: #contract.data.command
    }  
    depends_on: [ for _, target in #links { target } ]                          
    environment: { 
        "CONFD_BACKEND": "ENV",
        for config_name, config in #contract.config { "\(config_name)": config.value } 
    }
    expose: [ for ref in #contract.provides if ref.type == "net.expose" { "\(ref.data.port)" }]
    // healthcheck: TODO: how to select only one health check
    image: #contract.data.assets.image.url
    labels: list.FlattenN([ for ref in #contract.requires if (#LabelRef&ref) != _|_ { ref.data.labels } ], 1)
    // networks: { for ref in #contract.requires if ref.type == "net.alias" { "\(ref.data.network)": aliases: [ ref.data.name ]}}
    ports: [ for ref in #contract.requires if ref.type == "net.endpoint" { published: ref.data.published, target: ref.data.target }]
    tmpfs: list.FlattenN([ for ref in #contract.requires if (#TmpfsRef&ref) != _|_ { ref.data.paths } ], 1)
    restart: #contract.data.restart
    security_opt: list.FlattenN([ for ref in #contract.requires if (#SecurityOptRef&ref) != _|_ { ref.data.labels } ], 1)
    volumes: [ for ref in #contract.requires if ref.type == "hw.disk" 
        {                             
            type: "volume"
            source: ref.data.name
            target: ref.data.target
            read_only: ref.data.readonly
        }
    ]
}

let productKeyframe = keyframes[input.product]
let productServices = { for id, child in productKeyframe.data.children if (#SwContainerizedService&child) != _|_ { "\(id)": child } }

let environmentKeyframe = keyframes[input.environment]
let environmentServices = { for id, child in environmentKeyframe.data.children if (#SwContainerizedService&child) != _|_ { "\(id)": child } }

// each product service depends on every environment service
environmentLinks: { for id, child in environmentKeyframe.data.children if (#SwContainerizedService&child) != _|_ { "\(id)": id } }

// generate one compose containing both product and environment services
configs: "\(input.product)": {
    slug: "\(input.product)-compose"
    type: "compose"
    version: "1.0.0"
    data: compose.#Compose & {
        version: "2.1"
        // gen product services
        for id, service in productServices {
            for index in list.Range(1, service.data.replicas + 1, 1) {
                services: "\(id)_\(index)": #func_service&{#contract:service, #isEnvironment:false, #links: productKeyframe.data.links[id] & environmentLinks, #id: id}
            }            
        }
        // gen environment services
        for id, service in environmentServices {
            for index in list.Range(1, service.data.replicas + 1, 1) {
                services: "\(id)_\(index)": #func_service&{#contract:service, #isEnvironment:true, #id: id}
            }            
        }

        volumes: {}
    }
}
