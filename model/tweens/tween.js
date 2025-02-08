import {controller} from "../../controller.js";
import {returnInput} from "../../maths.js";
import {defaultTweenLength} from "../../constants.js";

export class tween{
    constructor(shape) {
        this.shape = shape

        this.modelConstructed = false
    }

    modelConstruct(timeOfConstruction){
        this.startTime = Math.max(0,timeOfConstruction-defaultTweenLength)
        this.timeLength = timeOfConstruction - this.startTime

        this.modelConstructed = true
    }


    getTimelineEvents(){
        return [
            {
                "type":"tweenStart",
                "shape":this.shape,
                "forward":() => {
                    controller.addTween(this)
                },
                "backward":() => {
                    controller.removeTween(this)
                    this.beforeStart()
                },
                "timeChange":(time) => {
                    return Math.max(0,time-defaultTweenLength)
                },
                "tween":this
            },
            {
                "type":"tweenEnd",
                "shape":this.shape,
                "forward":() => {
                    controller.removeTween(this)
                    this.finish()
                },
                "backward":() => {
                    controller.addTween(this)
                },
                "timeChange":returnInput,
                "tween":this
            }
        ]
    }
}