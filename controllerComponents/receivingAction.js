import {idleState} from "./idle";
import {
    operationToValidation
} from "../validator.js";

export class receivingActionState{
    constructor() {
        this.steps = []
    }

    beginAction(){
        console.error("can't begin an action before ending current one")
        return new idleState()
    }

    takeStep(operation,operands){
        const validation = operationToValidation[operation]

        if (validation === undefined){
            console.error("unrecognised operation",operation)
            return new idleState()
        }

        if (validation(...operands)){
            console.error("invalid operands")
            return new idleState()
        }

        this.steps.push([operation,operands])

        return this
    }

    endAction(){
        return new idleState()
    }

    play(){
        console.error("can't play while still receiving an action")
        return new idleState()
    }
}