import {shape} from "./shape.js";
import {controller} from "../controller.js";

export class shapeGroup extends shape{
    constructor(appearanceTime,disappearanceTime,innerShapes) {

        super(appearanceTime,disappearanceTime)

        // this sort retains the z-index of the shapes initially before they were merged
        this.innerShapes = innerShapes.sort((shape1,shape2) => {return shape1.ZIndex-shape2.ZIndex})

        this.updateGeometry()

        super.setupOffset()
    }

    save(){
        const shapeSave = super.save()

        const serialisedInnerShapes = []

        for (const innerShape of this.innerShapes){
            serialisedInnerShapes.push(innerShape.save())
        }

        shapeSave.innerShapes = serialisedInnerShapes

        shapeSave.shapeType = "shapeGroup"

        return shapeSave
    }

    async load(save){
        super.load(save)

        this.innerShapes = []

        for (const innerShape of save.innerShapes){
            this.innerShapes.push(await controller.loadShape(innerShape))
        }

        this.updateGeometry()
        this.setupOffset()
    }

    updateGeometry(){

        this.geometry = ""

        this.top = Infinity
        this.bottom = -Infinity
        this.left = Infinity
        this.right = -Infinity

        for (const shape of this.innerShapes){
            this.geometry += shape.geometry

            if (shape.top < this.top){
                this.top = shape.top
            }

            if (shape.bottom > this.bottom){
                this.bottom = shape.bottom
            }

            if (shape.left < this.left){
                this.left = shape.left
            }

            if (shape.right > this.right){
                this.right = shape.right
            }
        }
    }

    translate(translationVector){
        for (const shape of this.innerShapes){
            shape.translate(translationVector)
        }

        this.updateGeometry()
        this.translateOffsetPointBy(translationVector)
    }

    scale(scaleFactor,aboutCentre){
        for (const shape of this.innerShapes){
            shape.scale(scaleFactor,aboutCentre)
        }

        this.updateGeometry()
        this.scaleOffsetPointAbout(aboutCentre,scaleFactor)
    }

    rotate(angle,aboutCentre){
        for (const shape of this.innerShapes){
            shape.rotate(angle,aboutCentre)
        }

        this.updateGeometry()
        this.rotateOffsetPointAbout(aboutCentre,angle)
    }

    copy(){

        const innerShapesCopy = []

        for (const shape of this.innerShapes){
            innerShapesCopy.push(shape.copy())
        }

        return new shapeGroup(
            this.appearanceTime,
            this.disappearanceTime,
            innerShapesCopy
        )
    }
}