import {RootAction} from "../model/rootAction.js";
import {Action} from "../model/action.js";
import {autoAddToTimeline} from "../globalValues.js";

export class HistoryManager{
    constructor() {
        // used as pointer to undo/redo stack, which is implemented as a linked list
        this.previousAction = new RootAction()

        this.previousActionSubscribers = new Set()
    }

    static reverseSteps(steps){

        const reversedSteps = []

        // steps is copied to ensure the original steps aren't replaced with the reversed ones
        for (const step of Array.from(steps).reverse()){

        }

        return reversedSteps
    }

    static canBeAddedToTimeline(steps){
        return true
    }

    #updatePreviousAction(newAction){
        for (const subscriber of this.previousActionSubscribers){
            subscriber.newPreviousAction(newAction)
        }

        this.previousAction = newAction
    }

    newAction(steps){

        const reversedSteps = HistoryManager.reverseSteps(steps)

        const addable = HistoryManager.canBeAddedToTimeline(steps)

        const newAction = new Action(steps,reversedSteps,addable)

        this.previousAction.addActionAfter(newAction)
        newAction.appendToUndoRedoStack(this.previousAction)

        this.#updatePreviousAction(newAction)

        // if we automatically add timeline events and there are timeline events automatically add them
        if (autoAddToTimeline && addable){
            this.addPreviousActionTimelineEventToTimeline()
        }
    }

    undoAction(){
        this.previousAction.backwardAction()

        this.previousAction = this.previousAction.previousAction
    }

    redoAction(){
        if (this.previousAction.nextAction === undefined){
            return
        }

        this.previousAction = this.previousAction.nextAction

        this.previousAction.forwardAction()
    }

    subscribeToPreviousAction(subscriber){
        subscriber.newPreviousAction(this.previousAction)
        this.previousActionSubscribers.add(subscriber)
    }

    unsubscribeToPreviousAction(subscriber){
        this.previousActionSubscribers.delete(subscriber)
    }
}