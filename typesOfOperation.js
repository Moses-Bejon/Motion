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
        return [operands[0],operands[1],returnValue]
    }],
    "addTimelineEvent":["removeTimelineEvent",returnInput],
    "removeTimelineEvent":["addTimelineEvent",returnInput],
    "changeTimeOfTimelineEvent":["changeTimeOfTimelineEvent",(operands,returnValue) => {
        return [operands[0],returnValue]
    }],
}

export const stepToAddableToTimeline = new Set([
    "newText",
    "newColour",
    "newOutlineColour",
    "newThickness",
    "newFillColour",
    "newFont",
    "newFontSize",
    "newFontColour",
    "newHeight",
    "newWidth",
])

export const stepToTimelineEvents = {
    "translate":(step,inverseStep,time) => {
        const shapeTween = new TranslationTween(operands[1], operands[0])

        return shapeTween.getTimelineEvents()
    },
    "rotate": (step,inverseStep,time) => {
        const shapeTween = new RotationTween(operands[1],operands[2],operands[0])

        return shapeTween.getTimelineEvents()
    },
    "scale": (step,inverseStep,time) => {
        const shapeTween = new ScaleTween(operands[1],operands[2],operands[0])

        return shapeTween.getTimelineEvents()
    },
    "shapeAttributeUpdate": (step,inverseStep,time) => {
        return {
            "type":"change",
            "shape":step[1][0],
            "time":time,
            "forward":[step],
            "backward":[inverseStep]
        }
    }
}

export const operationToAttribute = {
    "moveToFront":"ZIndex",
    "moveToBack":"ZIndex",
    "newText":"text",
    "newAppearanceTime":"appearanceTime",
    "newDisappearanceTime":"disappearanceTime",
    "newColour":"colour",
    "newThickness":"thickness",
    "newFillColour":"fillColour",
    "newOutlineColour":"outlineColour",
    "newWidth":"width",
    "newHeight":"height",
    "newFontColour":"fontColour",
    "newFontSize":"fontSize",
    "newFont":"fontFamily"
}

// list of operations that involve creating a shape
export const shapeCreation = ["createDrawing","createEllipse","createGraphic","createPolygon",
    "createShapeGroup","createText","duplicate","merge"]

export const operationsWhichReturn = Object.keys(operationToInverse).concat(shapeCreation).concat([
    "goToTime",
    "split",
    "merge",
])