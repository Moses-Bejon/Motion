import {ReceivingActionState} from "./receivingAction.js";
import {PlayingState} from "./playing.js";
import {ExecutingScriptState} from "./executingScript.js";
import {controller} from "../controller.js";
import {animationEndTimeSeconds} from "../globalValues.js";

export class IdleState {
    constructor() {
    }

    beginAction(){
        return new ReceivingActionState()
    }

    takeStep(){
        throw new Error("can't take a step without starting an action")
    }

    endAction(){
        throw new Error("can't end an action if haven't started one")
    }

    executeScript(script){
        return new ExecutingScriptState(script)
    }

    play(){

        const animation = {"previousTime":performance.now()}

        function nextFrame(animation){
            const currentTime = performance.now()
            const deltaTime = currentTime - animation.previousTime

            let time = controller.clock()+deltaTime/1000

            if (time > animationEndTimeSeconds){
                time = 0
            }

            controller.currentScene.executeSteps([["goToTime",[time]]])

            animation.previousTime = currentTime

            animation.nextAnimationFrame = requestAnimationFrame(() => {nextFrame(animation)})
        }

        nextFrame(animation)

        return new PlayingState(animation)
    }
}