export class action{
    constructor(forwardAction,backwardAction) {
        this.forwardAction = forwardAction
        this.backwardAction = backwardAction
    }

    appendToUndoRedoStack(previousAction){
        this.previousAction = previousAction
    }

    addActionAfter(nextAction){
        this.nextAction = nextAction
    }
}