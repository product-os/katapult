package environment

contracts: {
	"open-balena-haproxy": {
		slug:    "balena-haproxy"
		type:    "sw.containerized-service"
		version: "latest"
		data: {
            assets: {
			    image: url: "balena/open-balena-haproxy:\(version)"
                repo: {
                    ssh: "git@github.com:balena-io/open-balena-haproxy.git"
                    https: "https://github.com/balena-io/open-balena-haproxy"
                }
            }
		}
		requires: []
		provides: []
		config: {
			BALENA_HAPROXY_CRT: {
				value: string
			}
			BALENA_HAPROXY_KEY: {
				value: string
			}
			BALENA_ROOT_CA: {
				value: string
			}
			BAPROXY_HOSTNAME: {
				value: string
			}
		}
	}
    "balena-mdns-publisher": {
        slug: "balena-mdns-publisher"
        type: "sw.containerized-service"
        version: "latest"
        data: {
            assets: {
                image: url: "balena/balena-mdns-publisher:\(version)"
                repo: {
                    ssh: "git@github.com:balena-io/balena-mdns-publisher.git"
                    https: "https://github.com/balena-io/balena-mdns-publisher.git"
                }
            }
        }		
		requires: [
            { type: "cap_add", data: { value: ["SYS_RESOURCE", "SYS_ADMIN"] } },
            { type: "security_opt", data: { value: "apparmor=unconfined" } },
            { type: "tmpfs", data: { path: "/run" } },
            { type: "tmpfs", data: { path: "/sys/fs/cgroup"} },
			{ type: "label", data: { name: "io.balena.features.dbus", value: "1" } },
			{ type: "label", data: { name: "io.balena.features.supervisor-api", value: "1"} }
        ]
		config: {
			MDNS_TLD:        { value: string }
			MDNS_SUBDOMAINS: { value: string }
			DBUS_SESSION_BUS_ADDRESS: { value: string }
			CONFD_BACKEND:            { value: string }
		}
	}
}
