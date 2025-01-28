import {midPoint2d} from "../maths.js";
import {controller} from "../controller.js";

export class shape{
    constructor(appearanceTime,disappearanceTime) {
        this.appearanceTime = appearanceTime
        this.disappearanceTime = disappearanceTime

        this.modelConstructed = false
    }

    // The model needs to also construct shapes to ensure shapes have attributes which
    // are necessary for their proper functionality, such as setting a unique name or
    // initializing the z-index. This function assigns these attributes to the shapes.

    // the function should only be called once
    // the modelConstructed boolean is used to ensure the controller doesn't do this twice
    modelConstruct(newZIndex,name){
        this.ZIndex = newZIndex
        this.name = name

        this.modelConstructed = true
    }

    getPosition(){
        return midPoint2d([this.left,this.top],[this.right,this.bottom])
    }

    geometryAttributeUpdate(attribute, newValue){
        this[attribute] = newValue

        this.updateGeometry()

        controller.updateModel("displayShapes",this)

        if (controller.isSelected(this)) {
            controller.updateModel("selectedShapes", this)
        }
    }
}