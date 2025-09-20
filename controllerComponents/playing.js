import {IdleState} from "./idle.js";
import {controller} from "../controller.js";

export class PlayingState {
    constructor() {
        this.previousTime = performance.now()
    }

    nextFrame(getTime,goToTime) {
        const currentTime = performance.now()
        const deltaTime = currentTime - this.previousTime

        let time = getTime()+deltaTime/1000

        if (time > controller.animationEndTime()){
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
        return this
    }

    play(){
        this.beginAction()
        this.endAction()

        return new IdleState()
    }

    saveFile(){
        throw new Error("Cannot save the file while an animation is being played")
    }
}