package katapult

import (    
    "github.com/product-os/katapult/cue/productos"
)

contracts: productos.contracts
blueprints: productos.blueprints

input: {
    product: "product-os"
    environment: "balena-compose"
}

// input: {
//     product: {
//         slug: "product-os"
//         children: {
//             "jellyfish-action-server": data: replicas: 2
//         }
//     }
//     environment: "balena-compose"
// }

// for key, child in input.product.children {
//     keyframes: "\(input.product.slug)": data: children: "\(key)": child
// }

keyframes: "\(input.product)": data: children: "jellyfish-action-server": data: replicas: 2

configs: "\(input.product)": {
    data: {
        services: {
            postgres: {
                image: "balena/open-balena-db:4.1.0"
                restart: "always"
                networks: internal: {}
            },
            redis: {
                image: "balena/balena-redis:0.0.3"
                command: ["sh", "-c", "redis-server /usr/local/etc/redis/redis.conf --save ''"]
                restart: "always"
                networks: internal: {}
            },
        }
        networks: internal: {}
    }
}