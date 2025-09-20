export const model = {
    "allShapes":{
        "content": new Set(), // of shape objects
        "subscribers": new Set() // of view objects (all other subscribers fields are identical)
    },
    "clock":{
        "content": 0.1, // current time in animation
        "subscribers": new Set()
    },
    "displayShapes": {
        "content": new Set(), // of shape objects
        "subscribers": new Set()
    }
}