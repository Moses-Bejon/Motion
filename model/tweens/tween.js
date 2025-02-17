import {controller} from "../../controller.js";
import {returnInput} from "../../maths.js";
import {defaultTweenLength} from "../../globalValues.js";

export class tween{
    constructor(shape) {
        this.shape = shape

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

    save(){
        return {
            "startTime":this.startTime,
            "timeLength":this.timeLength
        }
    }

    load(save){
        this.goToTimeNonZeroLength = this.goToTime
        this.modelConstructed = true

        this.startTime = save.startTime
        this.timeLength = save.timeLength

        this.updateLength()
    }

    // used to handle situations where the length of the tween is zero
    startForwardNonZeroLength(){
        controller.addTweenToCurrentTweens(this)
    }
    startForwardZeroLength(){}
    startBackwardNonZeroLength(){
        controller.removeTweenFromCurrentTweens(this)
        this.beforeStart()
    }
    startBackwardZeroLength(){
        this.beforeStart()
    }
    endForwardNonZeroLength(){
        controller.removeTweenFromCurrentTweens(this)
        this.finish()
    }
    endForwardZeroLength(){
        this.finish()
    }
    endBackwardNonZeroLength(){
        controller.addTweenToCurrentTweens(this)
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

    getTweenStartEvent(){
        return this.tweenStartEvent
    }

    getTweenEndEvent(){
        return this.tweenEndEvent
    }

    getTimelineEvents(){
        return [this.getTweenStartEvent(),this.getTweenEndEvent()]
    }
}