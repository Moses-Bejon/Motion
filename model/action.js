export class Action{
    constructor(forwardAction,backwardAction,addableToTimeline) {
        this.forwardAction = forwardAction
        this.backwardAction = backwardAction
        this.addableToTimeline = addableToTimeline
    }

    appendToUndoRedoStack(previousAction){
        this.previousAction = previousAction
    }

    addActionAfter(nextAction){
        this.nextAction = nextAction
    }
}