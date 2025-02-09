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

        // taken from child class
        // kept track of in case the user makes the length zero and then increases length again
        this.goToTimeNonZeroLength = this.goToTime

        this.modelConstructed = true
    }

    // used to handle situations where the length of the tween is zero
    startForwardNonZeroLength(){
        controller.addTween(this)
    }
    startForwardZeroLength(){}
    startBackwardNonZeroLength(){
        controller.removeTween(this)
        this.beforeStart()
    }
    startBackwardZeroLength(){
        this.beforeStart()
    }
    endForwardNonZeroLength(){
        controller.removeTween(this)
        this.finish()
    }
    endForwardZeroLength(){
        this.finish()
    }
    endBackwardNonZeroLength(){
        controller.addTween(this)
    }
    endBackwardZeroLength(){}

    updateLength(){
        if (this.timeLength === 0){
            this.goToTime = () => {
                console.error("going to time when length is zero")
            }

            controller.currentTimelineTweens.delete(this)

            this.tweenStartEvent.forward = this.startForwardZeroLength.bind(this)
            this.tweenStartEvent.backward = this.startBackwardZeroLength.bind(this)
            this.tweenEndEvent.forward = this.endForwardZeroLength.bind(this)
            this.tweenEndEvent.backward = this.endBackwardZeroLength.bind(this)
        } else {
            this.goToTime = this.goToTimeNonZeroLength

            this.tweenStartEvent.forward = this.startForwardNonZeroLength.bind(this)
            this.tweenStartEvent.backward = this.startBackwardNonZeroLength.bind(this)
            this.tweenEndEvent.forward = this.endForwardNonZeroLength.bind(this)
            this.tweenEndEvent.backward = this.endBackwardNonZeroLength.bind(this)
        }
    }

    newStartTime(startTime){
        this.timeLength += this.startTime-startTime
        this.startTime = startTime

        this.updateLength()
    }

    newEndTime(endTime){
        this.timeLength = endTime-this.startTime

        this.updateLength()
    }

    getTimelineEvents(){

        this.tweenStartEvent = {
            "type":"tweenStart",
            "shape":this.shape,
            "forward":this.startForwardNonZeroLength.bind(this),
            "backward":this.startBackwardNonZeroLength.bind(this),
            "timeChange":(time) => {
                return Math.max(0,time-defaultTweenLength)
            },
            "tween":this
        }

        this.tweenEndEvent = {
            "type":"tweenEnd",
            "shape":this.shape,
            "forward":this.endForwardNonZeroLength.bind(this),
            "backward":this.endBackwardNonZeroLength.bind(this),
            "timeChange":returnInput,
            "tween":this
        }

        return [this.tweenStartEvent,this.tweenEndEvent]
    }
}