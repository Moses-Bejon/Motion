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
        try {
            this.currentState = this.currentState.beginAction()
            return true
        } catch (e){
            console.error(e)
            this.currentState = new idleState()
            return false
        }
    }

    takeStep(operation,operands){
        try {
            this.currentState = this.currentState.takeStep(operation,operands)
            return true
        } catch (e){
            console.error(e)
            this.currentState = new idleState()
            return false
        }

    }

    endAction(){
        try {
            this.currentState = this.currentState.endAction()
            return true
        } catch (e){
            console.error(e)
            this.currentState = new idleState()
            return false
        }

    }

    play(){
        try {
            this.currentState = this.currentState.play()
            return true
        } catch (e){
            console.error(e)
            this.currentState = new idleState()
            return false
        }
    }
}

export const controller = new controllerClass()

console.log(controller)