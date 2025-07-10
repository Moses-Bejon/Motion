import {RootAction} from "../model/rootAction.js";
import {Action} from "../model/action.js";
import {autoAddToTimeline} from "../globalValues.js";
import {controller} from "../controller.js";
import {
    operationToInverse,
    operationToAttribute,
    operationsWhichReturn,
    stepToTimelineEvents,
    shapeCreation, stepToAddableToTimeline
} from "../typesOfOperation.js";

export class HistoryManager{
    constructor() {
        // used as pointer to undo/redo stack, which is implemented as a linked list
        this.previousAction = new RootAction()

        this.previousActionSubscribers = new Set()
    }

    // forward steps are what is done to redo the action
    // (not necessarily the same as doing the action for the first time ever)
    // (for example, if you add a new shape you want it on top of other shapes
    // (but if you undo and redo its creation, you don't want it to jump to the top but retain its position)
    static forwardSteps(steps,returnValues){

        const forwardSteps = []

        for (const step of Array.from(steps)){

            let returnValue
            if (operationsWhichReturn.includes(step[0])){
                returnValue = returnValues.shift()
            }

            const attribute = operationToAttribute[step[0]]

            if (attribute !== undefined){
                forwardSteps.push(["shapeAttributeUpdate",[step[1][0],attribute,step[1][0][attribute]]])
                continue
            }

            if (step[0] === "split"){
                forwardSteps.push(["deleteShape",step[1]])

                for (const shape of returnValue){
                    forwardSteps.push(["restoreShape",[shape]])
                }

                // we don't want to have a split pushed into the forward steps so we continue here
                continue
            }

            if (step[0] === "merge"){
                // forward steps should include deletion of shapes that merged
                // it is a shape creation so its created merged shape will be created later
                for (const shape of step[1][0]){
                    forwardSteps.push(["deleteShape",[shape]])
                }
            }

            // if step involves creating a shape
            if (shapeCreation.includes(step[0])){
                forwardSteps.push(["restoreShape",[returnValue]])
            } else{
                forwardSteps.push(step)
            }
        }

        return forwardSteps
    }

    static reverseSteps(steps,returnValues){

        const reversedSteps = []

        // steps is copied to ensure the original steps aren't replaced with the reversed ones
        for (const step of steps){

            let returnValue
            if (operationsWhichReturn.includes(step[0])){
                returnValue = returnValues.shift()
            }

            const reverseApproach = operationToInverse[step[0]]
            const reversedStep = []

            // operation
            reversedStep.push(reverseApproach[0])

            // new operand
            reversedStep.push(reverseApproach[1](step[1],returnValue))

            reversedSteps.push(reversedStep)
        }
        return reversedSteps.reverse()
    }

    static canBeAddedToTimeline(steps){
        for (const step of steps){
            if (!stepToAddableToTimeline[step[0]]){
                return false
            }
        }

        return true
    }

    #updatePreviousAction(newAction){
        for (const subscriber of this.previousActionSubscribers){
            try {
                subscriber.newPreviousAction(newAction)
            } catch (e) {
                console.error(e)
            }
        }

        this.previousAction = newAction
    }

    getPreviousActionTimelineEvents(){
        if (!this.previousAction.addableToTimeline){
            throw new Error("cannot add non-addable action to timeline")
        }

        const shapeToTimelineEvents = {}

        const steps = this.previousAction.forwardAction.length
        for (let i = 0; i < steps; i++){
            const event = stepToTimelineEvents[this.previousAction.forwardAction[i][0]](
                this.previousAction.forwardAction[i],
                this.previousAction.backwardAction[steps-i-1],
                controller.clock()
            )

            const existingEventGroup = shapeToTimelineEvents[event.shape]

            if (existingEventGroup === undefined){
                shapeToTimelineEvents[event.shape] = {}
            }

            const existingEvent = shapeToTimelineEvents[event.shape][event.type]

            if (existingEvent !== undefined){
                existingEvent.forward = existingEvent.forward.concat(event.forward)
                existingEvent.backward = event.backward.concat(existingEvent.backward)

            } else {
                shapeToTimelineEvents[event.shape][event.type] = event
            }
        }

        const timelineEvents = []

        for (const timelineEventGroup of Object.values(shapeToTimelineEvents)){
            for (const timelineEvent of Object.values(timelineEventGroup)){
                timelineEvents.push(timelineEvent)
            }
        }
        return timelineEvents
    }

    newAction(steps,returnValues){

        // copy of returnValues made as returnValues is used again down the line and forwardSteps is destructive
        const forwardSteps = HistoryManager.forwardSteps(steps,Array.from(returnValues))
        // copy of forwardSteps and returnValues for same reason
        const backwardSteps = HistoryManager.reverseSteps(Array.from(forwardSteps),Array.from(returnValues))

        const addable = HistoryManager.canBeAddedToTimeline(steps)

        const newAction = new Action(forwardSteps,backwardSteps,addable)

        this.previousAction.addActionAfter(newAction)
        newAction.appendToUndoRedoStack(this.previousAction)

        this.#updatePreviousAction(newAction)

        // if we automatically add timeline events and there are timeline events automatically add them
        if (autoAddToTimeline && addable){
            this.addPreviousActionTimelineEventToTimeline()
        }
    }

    undoAction(){
        controller.currentScene.executeSteps(this.previousAction.backwardAction)

        this.previousAction = this.previousAction.previousAction
    }

    redoAction(){
        if (this.previousAction.nextAction === undefined){
            return
        }

        this.previousAction = this.previousAction.nextAction

        controller.currentScene.executeSteps(this.previousAction.forwardAction)
    }

    subscribeToPreviousAction(subscriber){
        subscriber.newPreviousAction(this.previousAction)
        this.previousActionSubscribers.add(subscriber)
    }

    unsubscribeToPreviousAction(subscriber){
        this.previousActionSubscribers.delete(subscriber)
    }
}