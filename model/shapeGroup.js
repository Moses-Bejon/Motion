import {shape} from "./shape.js";

export class shapeGroup extends shape{
    constructor(appearanceTime,disappearanceTime,innerShapes) {

        super(appearanceTime,disappearanceTime)

        this.innerShapes = innerShapes

        this.updateGeometry()
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
    }

    scale(scaleFactor,aboutCentre){
        for (const shape of this.innerShapes){
            shape.scale(scaleFactor,aboutCentre)
        }

        this.updateGeometry()
    }

    rotate(angle,aboutCentre){
        for (const shape of this.innerShapes){
            shape.rotate(angle,aboutCentre)
        }

        this.updateGeometry()
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