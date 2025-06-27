import {timelineSnapLength} from "../globalValues.js";

export const model = {
    "allShapes":{
        "content": new Set(), // of shape objects
        "subscribers": new Set() // of view objects (all other subscribers fields are identical)
    },
    "timelineEvents":{
        // ordered list of timelineEvents, sorted in order of time they occur
        // timeLineEvent structure - {type: string, shape:shape object, time: float (s), forward: function, backward: function}
        // type could be "appearance", "disappearance", or some other unforeseen event
        "content": [],
        "subscribers": new Set()
    },
    "clock":{
        "content": timelineSnapLength/2, // current time in animation
        "subscribers": new Set()
    },
    "displayShapes": {
        "content": new Set(), // of shape objects
        "subscribers": new Set()
    }
}