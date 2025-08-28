import {IdleState} from "./controllerComponents/idle.js";
import {SceneController} from "./controllerComponents/sceneController.js";
import {KeyboardInputsManager} from "./controllerComponents/keyboardInputsManager.js";
import {OnionSkinsManager} from "./controllerComponents/onionSkinsManager.js";
import {HistoryManager} from "./controllerComponents/historyManager.js";
import {SelectedShapesManager} from "./controllerComponents/selectedShapesManager.js"
import {FileSerializer} from "./controllerComponents/fileSerializer.js";
import {validateShape} from "./validator.js";

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
        this.fileSerializer = new FileSerializer()
        this.clipboard = new Set()
    }

    // the following methods may be used by absolutely anyone

    // makes it so data can be easily read
    allShapes(){
        return this.currentScene.allShapes()
    }
    timelineEvents(){
        return this.currentScene.timelineEvents()
    }
    clock(){
        return this.currentScene.clock()
    }
    displayShapes(){
        return this.currentScene.displayShapes()
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
    paste(){
        return this.clipboard
    }

    // the following methods may only be used by views

    beginAction(){
        try {
            this.#newState(this.currentState.beginAction())
        } catch (e){
            console.error(e)
            this.#newState(new IdleState())
        }
    }

    takeStep(operation,operands){
        try {
            this.#newState(this.currentState.takeStep(operation,operands))
        } catch (e){
            console.error(e)
            this.#newState(new IdleState())
        }

    }

    async endAction(){

        // if the steps fail this is a backup (history manager also gleans some info from this)
        const beforeSteps = JSON.parse(this.fileSerializer.serializeScene(this.currentScene))

        try {
            const returnValues = await this.currentScene.executeSteps(this.currentState.steps)

            this.historyManager.newAction(this.currentState.steps,returnValues)

            this.#newState(this.currentState.endAction())

            return returnValues
        } catch (e){
            console.error(e)

            this.currentScene = await this.fileSerializer.loadScene(beforeSteps)

            this.#newState(new IdleState())
        }

    }

    async executeScript(script,scriptVariables = {}){

        // if the steps fail this is a backup (history manager also gleans some info from this)
        const beforeSteps = JSON.parse(this.fileSerializer.serializeScene(this.currentScene))

        try {
            this.#newState(this.currentState.executeScript(script))

            const [steps,returnValues] = await this.currentScene.executeScript(script,scriptVariables)

            this.historyManager.newAction(steps,returnValues)

            this.#newState(new IdleState())

            return returnValues

        } catch (e){
            console.error(e)

            this.currentScene = await this.fileSerializer.loadScene(beforeSteps)

            this.#newState(new IdleState())
        }
    }

    play(){
        try {
            this.#newState(this.currentState.play())
        } catch (e){
            console.error(e)
            this.#newState(new IdleState())
        }
    }

    copy(shapes){

        // validation
        for (const shape of shapes){
            if (!validateShape(shape)){
                console.error("invalid shape copy occurred")
                return
            }
        }

        this.clipboard = new Set()

        for (const shape of shapes){
            this.clipboard.add(shape.copy())
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

    addPreviousTimelineEventToTimeline(){
        this.beginAction()

        const stepsToAddToTimeline = this.historyManager.getStepsToAddPreviousActionToTimeline()

        for (const step of stepsToAddToTimeline){
            this.currentState.takeStep(step[0],step[1])
        }

        this.endAction()
    }
}

export const controller = new ControllerClass()

console.log(controller)