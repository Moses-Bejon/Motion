import {add2dVectors, subtract2dVectors,increment2dVectorBy} from "../../maths.js";
import {controller} from "../../controller.js";
import {Tween} from "./tween.js";

export class RotationTween extends Tween{
    constructor(shape) {

        super(shape)

        // we need to ensure we don't get confused by our own translations
        this.translationCausedByUs = [0,0]
    }

    setup(time,angle,aboutCentre){
        super.setup(time)

        this.totalAngle = angle
        this.previousAngle = 0

        this.relativeCentre = subtract2dVectors(aboutCentre,this.shape.getOffsetPoint())
    }

    static load(save,shape){
        const loadedTween = new RotationTween(shape)

        loadedTween.totalAngle = save.totalAngle
        loadedTween.relativeCentre = save.relativeCentre
        loadedTween.previousAngle = save.previousAngle
        loadedTween.translationCausedByUs = save.translationCausedByUs

        super.loadTimes(save,loadedTween)

        return loadedTween
    }

    save(){
        const tweenSave = super.save()

        tweenSave.tweenType = "rotationTween"
        tweenSave.totalAngle = this.totalAngle
        tweenSave.relativeCentre = this.relativeCentre
        tweenSave.previousAngle = this.previousAngle
        tweenSave.translationCausedByUs = this.translationCausedByUs

        return tweenSave
    }

    copy(){
        const copy = new RotationTween(this.shape)
        copy.setup(
            this.startTime+this.timeLength,
            this.totalAngle,
            add2dVectors(this.relativeCentre,this.shape.getOffsetPoint())
        )
        copy.newStartTime(this.startTime)
        copy.previousAngle = this.previousAngle
        return copy
    }

    rotateByAngle(angle){
        const centre = add2dVectors(
            this.shape.getOffsetPoint(),
            subtract2dVectors(
                this.relativeCentre,
                this.translationCausedByUs
            )
        )

        const positionBeforeRotation = this.shape.getOffsetPoint()

        controller.currentScene.executeInvisibleSteps([
            ["rotate",[this.shape,angle,centre]]
        ])

        increment2dVectorBy(this.translationCausedByUs,subtract2dVectors(this.shape.getOffsetPoint(),positionBeforeRotation))
    }

    goToTweenProportion(proportion){
        const currentAngle = this.totalAngle*proportion

        const angleToRotate = currentAngle-this.previousAngle

        this.rotateByAngle(angleToRotate)

        this.previousAngle = currentAngle
    }

    finish(){
        this.rotateByAngle(this.totalAngle-this.previousAngle)

        this.previousAngle = this.totalAngle
    }

    beforeStart(){
        this.rotateByAngle(-this.previousAngle)

        this.previousAngle = 0
    }
}