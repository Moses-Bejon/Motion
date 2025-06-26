import {ReceivingActionState} from "./receivingAction.js";
import {PlayingState} from "./playing.js";

export class IdleState {
    constructor() {
    }

    beginAction(){
        return new ReceivingActionState()
    }

    takeStep(){
        throw new Error("can't take a step without starting an action")
    }

    endAction(){
        throw new Error("can't end an action if haven't started one")
    }

    play(){
        return new PlayingState()
    }
}