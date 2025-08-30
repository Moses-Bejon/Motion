import {IdleState} from "./idle.js";
import {controller} from "../controller.js";
import {animationEndTimeSeconds} from "../globalValues.js";

export class PlayingState {
    constructor() {
        this.previousTime = performance.now()
        this.nextFrame()
    }

    nextFrame() {
        const currentTime = performance.now()
        const deltaTime = currentTime - this.previousTime

        let time = controller.clock()+deltaTime/1000

        if (time > animationEndTimeSeconds){
            time = 0
        }

        controller.currentScene.executeSteps([["goToTime",[time]]])

        this.previousTime = currentTime

        this.nextAnimationFrame = requestAnimationFrame(this.nextFrame.bind(this))
    }

    beginAction(){
        cancelAnimationFrame(this.nextAnimationFrame)
        throw new Error("can't begin an action while playing an animation")
    }

    takeStep(){
        cancelAnimationFrame(this.nextAnimationFrame)
        throw new Error("can't take a step while playing an animation")
    }

    endAction(){
        cancelAnimationFrame(this.nextAnimationFrame)
        throw new Error("can't end an action while playing an animation")
    }

    executeScript(script){
        cancelAnimationFrame(this.nextAnimationFrame)
        throw new Error("can't execute a script while playing an animation")
    }

    play(){
        cancelAnimationFrame(this.nextAnimationFrame)
        return new IdleState()
    }
}