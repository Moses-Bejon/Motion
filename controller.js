import {idleState} from "./controllerStates/idle.js";

class controllerClass {
    constructor() {
        this.currentState = new idleState()
    }

    beginAction(){
        this.currentState = this.currentState.beginAction()
    }

    endAction(){
        this.currentState = this.currentState.endAction()
    }

    play(){
        this.currentState = this.currentState.play()
    }
}

export const controller = new controllerClass()

console.log(controller)