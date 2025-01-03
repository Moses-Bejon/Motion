import {midPoint2d} from "../maths.js";
import {controller} from "../controller.js";

const numberOfEachTypeOfShape = {}

export class shape{
    constructor(appearanceTime,disappearanceTime) {
        this.appearanceTime = appearanceTime
        this.disappearanceTime = disappearanceTime

        const shapeType = this.constructor.name
        if (Object.hasOwn(numberOfEachTypeOfShape,shapeType)){
            numberOfEachTypeOfShape[shapeType] ++
        } else {
            numberOfEachTypeOfShape[shapeType] = 1
        }
        this.name = shapeType + " " + numberOfEachTypeOfShape[shapeType]
    }

    getPosition(){
        return midPoint2d([this.getLeft(),this.getTop()],[this.getRight(),this.getBottom()])
    }

    updateAttribute(attribute,newValue){
        controller.removeShape(this)

        this[attribute] = newValue

        this.updateGeometry()

        controller.newShape(this)
    }
}