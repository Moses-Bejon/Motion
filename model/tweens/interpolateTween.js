import {controller} from "../../controller.js";
import {tween} from "./tween.js";

export class interpolateTween extends tween{
    constructor(startState,endState,operation,inverseOperation,shape) {

        super(shape)

        this.startState = startState
        this.endState = endState
        this.stateLength = this.endState - this.startState
        this.operation = operation
        this.inverseOperation = inverseOperation

        this.previousValue = this.startState
    }

    save(){
        console.error("cannot save interpolate tween")

        return super.save()
    }

    load(save){
        console.error("cannot load interpolate tween")

        super.load(save)
    }

    goToTime(time){

        const value = this.startState+this.stateLength*(time-this.startTime)/this.timeLength

        this.inverseOperation(this.shape,this.previousValue)
        this.operation(this.shape,value)

        this.previousValue = value

        controller.updateShape(this.shape)
    }

    finish(){
        this.inverseOperation(this.shape,this.previousValue)
        this.operation(this.shape,this.endState)

        this.previousValue = this.endState

        controller.updateShape(this.shape)
    }

    beforeStart(){
        this.inverseOperation(this.shape,this.previousValue)
        this.operation(this.shape,this.startState)

        this.previousValue = this.startState

        controller.updateShape(this.shape)
    }
}