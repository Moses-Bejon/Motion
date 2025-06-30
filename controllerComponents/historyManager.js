import {RootAction} from "../model/rootAction.js";
import {Action} from "../model/action.js";
import {autoAddToTimeline} from "../globalValues.js";
import {shapeCreation} from "../validator.js";
import {returnInput} from "../maths.js";
import {controller} from "../controller.js";

const operationToInverse = {
    // 0 is inverse operation, 1 is function to run on operands to reverse them
    "deleteShape":["restoreShape",returnInput],
    "restoreShape":["deleteShape",returnInput],
}

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

        let canBeAddedToTimeline = true

        const forwardSteps = []

        for (const step of Array.from(steps)){
            if (shapeCreation.includes(step[0])){

                // if a shape is created, the operation cannot be added to the timeline
                canBeAddedToTimeline = false

                forwardSteps.push(["restoreShape",[returnValues[0]]])
                returnValues.shift()
            } else {
                forwardSteps.push(step)
            }
        }

        return [forwardSteps,canBeAddedToTimeline]
    }

    static reverseSteps(steps){

        const reversedSteps = []

        // steps is copied to ensure the original steps aren't replaced with the reversed ones
        for (const step of Array.from(steps).reverse()){
            const reverseApproach = operationToInverse[step[0]]
            const reversedStep = []

            // operation
            reversedStep.push(reverseApproach[0])

            // new operand
            reversedStep.push(reverseApproach[1](step[1]))

            reversedSteps.push(reversedStep)
        }

        return reversedSteps
    }

    #updatePreviousAction(newAction){
        for (const subscriber of this.previousActionSubscribers){
            subscriber.newPreviousAction(newAction)
        }

        this.previousAction = newAction
    }

    newAction(steps,returnValues){

        // copy of returnValues made as returnValues is used again down the line and forwardSteps is destructive
        const [forwardSteps,addable] = HistoryManager.forwardSteps(steps,Array.from(returnValues))
        const backwardSteps = HistoryManager.reverseSteps(forwardSteps)

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