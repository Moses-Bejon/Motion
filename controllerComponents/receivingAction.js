import {IdleState} from "./idle.js";
import {validateOperation} from "../validator.js";

export class ReceivingActionState {
    constructor() {
        this.steps = []
    }

    beginAction(){
        throw new Error("can't begin an action before ending current one")
    }

    takeStep(operation,operands){
        if (!validateOperation(operation,operands)){
            throw new Error("invalid step sent to controller")
        }

        this.steps.push([operation,operands])

        return this
    }

    endAction(){
        return new IdleState()
    }

    play(){
        throw new Error("can't play while still receiving an action")
    }
}