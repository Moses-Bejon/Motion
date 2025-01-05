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
        return midPoint2d([this.left,this.top],[this.right,this.bottom])
    }

    geometryAttributeUpdate(attribute, newValue){
        this[attribute] = newValue

        this.updateGeometry()

        controller.updateModel("displayShapes",this)

        if (controller.aggregateModels.selectedShapes.content.has(this)) {
            controller.updateModel("selectedShapes", this)
        }
    }
}