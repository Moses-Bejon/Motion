export class RootAction{
    constructor() {
        this.forwardAction = () => {}
        this.backwardAction = () => {}

        // you can't go before the root action
        this.previousAction = this
    }

    addActionAfter(nextAction){
        this.nextAction = nextAction
    }
}