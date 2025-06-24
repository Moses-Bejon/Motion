import {receivingActionState} from "./receivingAction.js";
import {playingState} from "./playing.js";

export class idleState{
    constructor() {
    }

    beginAction(){
        return new receivingActionState()
    }

    endAction(){
        console.error("can't end an action if haven't started one")
        return this
    }

    play(){
        return new playingState()
    }
}