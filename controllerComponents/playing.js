import {IdleState} from "./idle.js";
import {animationEndTimeSeconds} from "../globalValues.js";

export class PlayingState {
    constructor() {
        this.previousTime = performance.now()
    }

    nextFrame(getTime,goToTime) {
        const currentTime = performance.now()
        const deltaTime = currentTime - this.previousTime

        let time = getTime()+deltaTime/1000

        if (time > animationEndTimeSeconds){
            time = 0
        }

        goToTime(time)

        this.previousTime = currentTime

        this.nextAnimationFrame = requestAnimationFrame(() => {this.nextFrame(getTime,goToTime)})
    }

    beginAction(){
        cancelAnimationFrame(this.nextAnimationFrame)
        return this
    }

    takeStep(operation,operands){
        return this
    }

    endAction(){
        return this
    }

    executeScript(script){
        cancelAnimationFrame(this.nextAnimationFrame)
        throw new Error("can't execute a script while playing an animation")
    }

    play(){
        this.beginAction()
        this.endAction()

        return new IdleState()
    }
}