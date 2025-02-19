import {add2dVectors, subtract2dVectors,increment2dVectorBy} from "../../maths.js";
import {controller} from "../../controller.js";
import {tween} from "./tween.js";

export class rotationTween extends tween{
    constructor(angle,aboutCentre,shape) {

        super(shape)

        this.totalAngle = angle
        this.previousAngle = 0

        // we need to ensure we don't get confused by our own translations
        this.translationCausedByUs = [0,0]

        this.relativeCentre = subtract2dVectors(aboutCentre,this.shape.getPosition())
    }

    save(){
        const tweenSave = super.save()

        tweenSave.totalAngle = this.totalAngle
        tweenSave.relativeCentre = this.relativeCentre
        tweenSave.tweenType = "rotationTween"

        return tweenSave
    }

    load(save){
        this.totalAngle = save.totalAngle
        this.relativeCentre = save.relativeCentre

        super.load(save)
    }

    rotateByAngle(angle){
        const centre = add2dVectors(
            this.shape.getPosition(),
            subtract2dVectors(
                this.relativeCentre,
                this.translationCausedByUs
            )
        )

        const positionBeforeRotation = this.shape.getPosition()

        this.shape.rotate(angle,centre)

        increment2dVectorBy(this.translationCausedByUs,subtract2dVectors(this.shape.getPosition(),positionBeforeRotation))
    }

    goToTime(time){
        const currentAngle = this.totalAngle*(time-this.startTime)/this.timeLength

        const angleToRotate = currentAngle-this.previousAngle

        this.rotateByAngle(angleToRotate)

        this.previousAngle = currentAngle

        controller.updateShapeWithoutOnionSkins(this.shape)
    }

    finish(){
        this.rotateByAngle(this.totalAngle-this.previousAngle)

        this.previousAngle = this.totalAngle

        controller.updateShape(this.shape)
    }

    beforeStart(){
        this.rotateByAngle(-this.previousAngle)

        this.previousAngle = 0

        controller.updateShape(this.shape)
    }
}