import {defaultTweenLength} from "../../globalValues.js";
import {randomBrightColour} from "../../random.js";

export class Tween {
    constructor(shape) {
        this.shape = shape

        this.colour = randomBrightColour()
    }

    setup(time){
        this.startTime = Math.max(0,time-defaultTweenLength)
        this.timeLength = time - this.startTime
    }

    static load(save,tween){
        tween.startTime = save.startTime
        tween.timeLength = save.timeLength
    }

    save(){
        return {
            "startTime":this.startTime,
            "timeLength":this.timeLength
        }
    }

    goToTime(time){
        const tweenAmount = (time-this.startTime)/this.timeLength

        if (tweenAmount <= 0){
            this.beforeStart()
        } else if (tweenAmount >= 1){
            this.finish()
        } else {
            this.goToTweenProportion(tweenAmount)
        }
    }

    newStartTime(startTime){
        const toReturn = this.startTime

        this.timeLength += this.startTime-startTime
        this.startTime = startTime

        return toReturn
    }

    newEndTime(endTime){
        const toReturn = this.startTime+this.timeLength

        this.timeLength = endTime-this.startTime

        return toReturn
    }
}