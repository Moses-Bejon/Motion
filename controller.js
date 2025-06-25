import {idleState} from "./controllerComponents/idle.js";
import {sceneController} from "./controllerComponents/sceneController.js";

class controllerClass {
    constructor() {
        this.currentState = new idleState()
        this.currentScene = new sceneController()
    }

    // makes it so data can be easily read
    allShapes(){
        return this.currentScene.aggregateModels.allShapes.content
    }
    timelineEvents(){
        return this.currentScene.aggregateModels.timelineEvents.content
    }
    clock(){
        return this.currentScene.aggregateModels.clock.content
    }
    displayShapes(){
        return this.currentScene.aggregateModels.displayShapes.content
    }
    selectedShapes(){
        return this.currentScene.aggregateModels.selectedShapes.content
    }
    animationEndTime(){
        return this.currentScene.animationEndTimeSeconds
    }

    beginAction(){
        this.currentState = this.currentState.beginAction()
    }

    takeStep(operation,operands){
        this.currentState = this.currentState.takeStep(operation,operands)
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