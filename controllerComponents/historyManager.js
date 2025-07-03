import {RootAction} from "../model/rootAction.js";
import {Action} from "../model/action.js";
import {autoAddToTimeline} from "../globalValues.js";
import {shapeCreation} from "../validator.js";
import {returnInput,multiply2dVectorByScalar} from "../maths.js";
import {controller} from "../controller.js";
import {TranslationTween} from "../model/tweens/translateTween.js";
import {RotationTween} from "../model/tweens/rotationTween.js";
import {ScaleTween} from "../model/tweens/scaleTween.js";

const operationToInverse = {
    // 0 is inverse operation, 1 is function to run on operands and save to reverse them
    "goToTime":["goToTime",
        (operands,save) => {
            const toReturn = save.aggregateModels.clock

            // this means the next step to be reversed has the right clock value
            save.aggregateModels.clock = operands[0]

            return [toReturn]
        }
    ],
    "deleteShape":["restoreShape",returnInput],
    "restoreShape":["deleteShape",returnInput],
    "translate":["translate",
        (operands) => {
        return [operands[0],multiply2dVectorByScalar(-1,operands[1])]
        }
    ],
    "rotate":["rotate",(operands) => {
        return [operands[0],-operands[1],operands[2]]
    }],
    "scale":["scale",(operands) => {
        return [operands[0],1/operands[1],operands[2]]
    }]
}

const stepToTimelineEvents = {
    "translate":(operands) => {
        const shapeTween = new TranslationTween(operands[1], operands[0])

        return shapeTween.getTimelineEvents()
    },
    "rotate": (operands) => {
        const shapeTween = new RotationTween(operands[1],operands[2],operands[0])

        return shapeTween.getTimelineEvents()
    },
    "scale": (operands) => {
        const shapeTween = new ScaleTween(operands[1],operands[2],operands[0])

        return shapeTween.getTimelineEvents()
    }
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

        const forwardSteps = []

        for (const step of Array.from(steps)){

            // if step involves creating a shape
            if (shapeCreation.includes(step[0])){
                forwardSteps.push(["restoreShape",[returnValues[0]]])
                returnValues.shift()
            } else{
                forwardSteps.push(step)
            }
        }

        return forwardSteps
    }

    static reverseSteps(steps,beforeSteps){

        const reversedSteps = []

        // steps is copied to ensure the original steps aren't replaced with the reversed ones
        for (const step of steps){
            const reverseApproach = operationToInverse[step[0]]
            const reversedStep = []

            // operation
            reversedStep.push(reverseApproach[0])

            // new operand
            reversedStep.push(reverseApproach[1](step[1],beforeSteps))

            reversedSteps.push(reversedStep)
        }
        return reversedSteps.reverse()
    }

    static canBeAddedToTimeline(steps){
        for (const step of steps){
            // if there is no way to turn this into a timeline event
            if (stepToTimelineEvents[step[0]] === undefined){
                return false
            }
        }

        return true
    }

    #updatePreviousAction(newAction){
        for (const subscriber of this.previousActionSubscribers){
            subscriber.newPreviousAction(newAction)
        }

        this.previousAction = newAction
    }

    newAction(steps,returnValues,beforeSteps){

        // copy of returnValues made as returnValues is used again down the line and forwardSteps is destructive
        const forwardSteps = HistoryManager.forwardSteps(steps,Array.from(returnValues))
        // copy of forwardSteps and beforeSteps for same reason
        const backwardSteps = HistoryManager.reverseSteps(Array.from(forwardSteps),structuredClone(beforeSteps))

        const addable = HistoryManager.canBeAddedToTimeline(forwardSteps)

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