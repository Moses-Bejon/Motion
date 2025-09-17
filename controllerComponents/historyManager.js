import {RootAction} from "../model/rootAction.js";
import {Action} from "../model/action.js";
import {autoAddToTimeline} from "../globalValues.js";
import {controller} from "../controller.js";
import {
    operationToInverse,
    operationToAttribute,
    operationsWhichReturn,
    shapeCreation,
    stepToAddableToTimeline
} from "../typesOfOperation.js";
import {TranslationTween} from "../model/tweens/translateTween.js";
import {RotationTween} from "../model/tweens/rotationTween.js";
import {ScaleTween} from "../model/tweens/scaleTween.js";

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
            if (!stepToAddableToTimeline.has(step[0])){
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

    getStepsToAddPreviousActionToTimeline(){
        if (!this.previousAction.addableToTimeline){
            throw new Error("cannot add non-addable action to timeline")
        }

        // reverse the operation we are going to turn into an event
        controller.currentScene.executeSteps(this.previousAction.backwardAction)

        const stepsToAddToTimeline = []
        const steps = this.previousAction.forwardAction

        for (const step of steps){
            switch (step[0]){
                case "translate": {
                    const tween = new TranslationTween(step[1][0])
                    tween.setup(controller.clock(), step[1][1])

                    stepsToAddToTimeline.push(["addTween", [step[1][0], tween]])
                    break
                }

                case "rotate": {
                    const tween = new RotationTween(step[1][0])
                    tween.setup(controller.clock(), step[1][1], step[1][2])

                    stepsToAddToTimeline.push(["addTween", [step[1][0], tween]])
                    break
                }

                case "scale": {
                    const tween = new ScaleTween(step[1][0])
                    tween.setup(controller.clock(), step[1][1], step[1][2])

                    stepsToAddToTimeline.push(["addTween", [step[1][0], tween]])
                    break
                }

                case "shapeAttributeUpdate": {

                    // if you changed an attribute for the pure reason
                    this.previousAction = this.previousAction.previousAction

                    stepsToAddToTimeline.push(["newShapeAttributeChange", [step[1][0], step[1][1], step[1][2],controller.clock()]])
                    break
                }
            }
        }

        return stepsToAddToTimeline
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
            controller.addPreviousTimelineEventToTimeline()
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