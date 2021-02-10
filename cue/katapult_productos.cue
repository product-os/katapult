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

keyframes: "\(input.product)": data: children: {
    "worker": data: {
        replicas: 2
    }
}

configs: "\(input.product)": {
    data: {
        networks: internal: {}
    }
}