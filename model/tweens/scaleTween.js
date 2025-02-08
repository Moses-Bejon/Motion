import {add2dVectors, subtract2dVectors,increment2dVectorBy} from "../../maths.js";
import {controller} from "../../controller.js";
import {tween} from "./tween.js";

export class scaleTween extends tween{
    constructor(scaleFactor,aboutCentre,shape) {

        super(shape)

        this.totalScale = scaleFactor
        this.previousScale = 1

        // we need to ensure we don't get confused by our own translations
        this.translationCausedByUs = [0,0]

        this.relativeCentre = subtract2dVectors(aboutCentre,this.shape.getPosition())
    }

    goToTime(time){
        const currentScale = 1+(this.totalScale-1)*(time-this.startTime)/this.timeLength

        const amountToScale = currentScale/this.previousScale

        const centre = add2dVectors(
            this.shape.getPosition(),
            subtract2dVectors(
                this.relativeCentre,
                this.translationCausedByUs
            )
        )

        const positionBeforeScale = this.shape.getPosition()

        this.shape.scale(amountToScale,centre)

        increment2dVectorBy(this.translationCausedByUs,subtract2dVectors(this.shape.getPosition(),positionBeforeScale))

        controller.updateShape(this.shape)

        this.previousScale = currentScale
    }

    finish(){
        this.goToTime(this.startTime+this.timeLength)
    }

    beforeStart(){
        this.goToTime(this.startTime)
    }
}