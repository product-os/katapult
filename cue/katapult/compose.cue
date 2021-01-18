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
		text: yaml.MarshalStream([composes[distribution.slug]])
	}
}

for name, keyframe in keyframes {

    composes: "\(name)": compose.#Compose & {

        version: "2.0"

        let _volumes = {}
        
        for contractRef in keyframe.children {

            let _contract = contracts[contractRef.slug]

            // service per contract of service type
		    if (list.Contains(contract.ServiceTypes, _contract.type)) { // TODO: replace string match with type matching

                services: "\(_contract.slug)": {
                    cap_add: ["SYS_ADMIN", "SYS_RESOURCE"]  // TODO: use permission requirements from contract                
                    depends_on: [ for ref in _contract.requires if ref.type == "sw.containerized-service" { ref.slug } ]                             
                    environment: { 
                        "CONFD_BACKEND": "ENV",
                        for config_name, config in _contract.config { "\(config_name)": config.value } 
                    }
                    expose: [ for ref in _contract.provides if ref.type == "net.expose" { "\(ref.data.port)" }]
                    image: _contract.data.image
                    // networks: { for ref in _contract.requires if ref.type == "net.alias" { "\(ref.data.network)": aliases: [ ref.data.name ]}}
                    ports: [ for ref in _contract.requires if ref.type == "net.endpoint" { published: ref.data.published, target: ref.data.target }]
                    privileged: true
                    tmpfs: ["/run", "/sys/fs/cgroup"]
                    volumes: [ for ref in _contract.requires if ref.type == "hw.disk" 
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

        volumes: _volumes
    }
}