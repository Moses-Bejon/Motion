import {IdleState} from "./controllerComponents/idle.js";
import {SceneController} from "./controllerComponents/sceneController.js";
import {KeyboardInputsManager} from "./controllerComponents/keyboardInputsManager.js";
import {OnionSkinsManager} from "./controllerComponents/onionSkinsManager.js";
import {HistoryManager} from "./controllerComponents/historyManager.js";
import {SelectedShapesManager} from "./controllerComponents/selectedShapesManager.js"

class ControllerClass {
    constructor() {

        this.currentState = new IdleState()
        // views we have to tell about changes in state
        this.stateSubscribers = new Set()

        this.currentScene = new SceneController()
        this.selectedShapesManager = new SelectedShapesManager()
        this.keyboardManager = new KeyboardInputsManager()
        this.onionSkinsManager = new OnionSkinsManager()
        this.historyManager = new HistoryManager()
    }

    // the following methods may be used by absolutely anyone

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
        return this.selectedShapesManager.selectedShapes
    }
    animationEndTime(){
        return this.currentScene.animationEndTimeSeconds
    }
    getSelectedShapesManager(){
        return this.selectedShapesManager
    }

    // the following methods may only be used by views

    beginAction(){
        try {
            this.#newState(this.currentState.beginAction())
            return true
        } catch (e){
            console.error(e)
            this.#newState(new IdleState())
            return false
        }
    }

    takeStep(operation,operands){
        try {
            this.#newState(this.currentState.takeStep(operation,operands))
            return true
        } catch (e){
            console.error(e)
            this.#newState(new IdleState())
            return false
        }

    }

    endAction(){
        try {

            // SAVE HERE BEFORE YOU GET TO HASTY EXECUTING STEPS NOT KNOWING WHAT TO DO IF IT FAILS HALF WAY THROUGH
            this.currentScene.executeSteps(this.currentState.steps)

            this.#newState(this.currentState.endAction())

            return true
        } catch (e){
            console.error(e)
            this.#newState(new IdleState())
            return false
        }

    }

    play(){
        try {
            this.#newState(this.currentState.play())
            return true
        } catch (e){
            console.error(e)
            this.#newState(new IdleState())
            return false
        }
    }

    subscribeToSceneModel(subscriber,aggregateModel){
        this.currentScene.subscribeTo(subscriber,aggregateModel)
    }

    unsubscribeToSceneModel(subscriber,aggregateModel){
        this.currentScene.unsubscribeTo(subscriber,aggregateModel)
    }

    subscribeToInputs(subscriber){
        this.keyboardManager.subscribeToInputs(subscriber)
    }

    unsubscribeToInputs(subscriber){
        this.keyboardManager.unsubscribeToInputs(subscriber)
    }

    subscribeToOnionSkins(subscriber){
        this.onionSkinsManager.subscribeToOnionSkins(subscriber)
    }

    unsubscribeToOnionSkins(subscriber) {
        this.onionSkinsManager.unsubscribeFromOnionSkins(subscriber)
    }

    subscribeToControllerState(subscriber){
        subscriber.newControllerState(this.currentState)

        this.stateSubscribers.add(subscriber)
    }

    unsubscribeToControllerState(subscriber){
        this.stateSubscribers.delete(subscriber)
    }

    subscribeToPreviousAction(subscriber){
        this.historyManager.subscribeToPreviousAction(subscriber)
    }

    unsubscribeToPreviousAction(subscriber){
        this.historyManager.unsubscribeToPreviousAction(subscriber)
    }

    subscribeToSelectedShapes(subscriber){
        this.selectedShapesManager.subscribeToSelectedShapes(subscriber)
    }

    unsubscribeToSelectedShapes(subscriber){
        this.selectedShapesManager.unsubscribeToSelectedShapes(subscriber)
    }

    // the following methods may only be used by index.js

    undoAction(){
    }

    redoAction(){
    }

    // the following methods are private, only to be used by us

    #newState(state){
        this.currentState = state

        for (const subscriber of this.stateSubscribers){
            try {
                subscriber.newControllerState(state)
            } catch (e) {
                console.error(e)
            }
        }
    }
}

export const controller = new ControllerClass()

console.log(controller)