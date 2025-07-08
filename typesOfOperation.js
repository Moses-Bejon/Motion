import {multiply2dVectorByScalar, returnInput} from "./maths.js";
import {TranslationTween} from "./model/tweens/translateTween.js";
import {RotationTween} from "./model/tweens/rotationTween.js";
import {ScaleTween} from "./model/tweens/scaleTween.js";

export const operationToInverse = {
    // 0 is inverse operation, 1 is function to run on operands and save to reverse them
    "goToTime":["goToTime",
        (operands,returnValue) => {
            return [returnValue]
        }
    ],
    "deleteShape":["restoreShape",returnInput],
    "restoreShape":["deleteShape",returnInput],
    "translate":["translate",
        (operands) => {
            return [operands[0],multiply2dVectorByScalar(-1,operands[1])]
        }
    ],
    "rotate":["rotate",(operands) => {
        return [operands[0],-operands[1],operands[2]]
    }],
    "scale":["scale",(operands) => {
        return [operands[0],1/operands[1],operands[2]]
    }],
    "swapZIndices":["swapZIndices",returnInput],
    "shapeAttributeUpdate":["shapeAttributeUpdate",(operands,returnValue) => {
        return [operands[0],returnValue]
    }],
}

export const stepToTimelineEvents = {
    "translate":(operands) => {
        const shapeTween = new TranslationTween(operands[1], operands[0])

        return shapeTween.getTimelineEvents()
    },
    "rotate": (operands) => {
        const shapeTween = new RotationTween(operands[1],operands[2],operands[0])

        return shapeTween.getTimelineEvents()
    },
    "scale": (operands) => {
        const shapeTween = new ScaleTween(operands[1],operands[2],operands[0])

        return shapeTween.getTimelineEvents()
    }
}

export const operationToAttribute = {
    "moveToFront":"ZIndex",
    "moveToBack":"ZIndex"
}

// list of operations that involve creating a shape
export const shapeCreation = ["createDrawing","createEllipse","createGraphic","createPolygon",
    "createShapeGroup","createText","duplicate","merge"]

export const operationsWhichReturn = Object.keys(operationToInverse).concat(shapeCreation).concat([
    "goToTime",
    "split",
    "merge",
])