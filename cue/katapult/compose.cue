package katapult

import (
    "list"
    "encoding/yaml"
	"tool/cli"
    "github.com/product-os/katapult/cue/adapter/compose"
    "github.com/product-os/katapult/cue/contract"
)

command: printCompose: {
    task: print: cli.Print & {
		text: yaml.MarshalStream([configs[input.product].data])
	}
}

for name, keyframe in keyframes {

    configs: "\(name)": {
        slug: "\(keyframe.slug)-compose"
        type: "compose"
        data: compose.#Compose & {
            version: "2.1"
            
            let _volumes = {}        
            for _, child in keyframe.data.children {

                // service per contract of service type
                if (list.Contains(contract.ServiceTypes, child.type)) { // TODO: replace string match with type matching

                    for index in list.Range(1, child.data.replicas + 1, 1) {

                        services: "\(child.slug)_\(index)": {
                            cap_add: ["SYS_ADMIN", "SYS_RESOURCE"]  // TODO: use permission requirements from contract                
                            depends_on: [ for ref in child.requires if ref.type == "sw.containerized-service" { ref.slug } ]                             
                            environment: { 
                                "CONFD_BACKEND": "ENV",
                                for config_name, config in child.config { "\(config_name)": config.value } 
                            }
                            expose: [ for ref in child.provides if ref.type == "net.expose" { "\(ref.data.port)" }]
                            // healthcheck: TODO: how to select only one health check
                            image: child.data.assets.image.url
                            // networks: { for ref in child.requires if ref.type == "net.alias" { "\(ref.data.network)": aliases: [ ref.data.name ]}}
                            ports: [ for ref in child.requires if ref.type == "net.endpoint" { published: ref.data.published, target: ref.data.target }]
                            privileged: true
                            tmpfs: ["/run", "/sys/fs/cgroup"]
                            volumes: [ for ref in child.requires if ref.type == "hw.disk" 
                                {                             
                                    type: "volume"
                                    source: ref.data.name
                                    target: ref.data.target
                                    read_only: ref.data.readonly
                                }
                            ]
                        }
                    }
                }
            }

            volumes: _volumes
        }
    }
}