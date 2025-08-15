import {multiply2dVectorByScalar, returnInput} from "./maths.js";
import {TranslationTween} from "./model/tweens/translateTween.js";
import {RotationTween} from "./model/tweens/rotationTween.js";
import {ScaleTween} from "./model/tweens/scaleTween.js";

export const operationToInverse = {
    // 0 is inverse operation, 1 is function to run on operands and save to reverse them
    "goToTime":["goToTime",
        (operands,returnValue) => [returnValue]
    ],
    "deleteShape":["restoreShape",returnInput],
    "restoreShape":["deleteShape",returnInput],
    "translate":["translate",
        (operands) => [operands[0],multiply2dVectorByScalar(-1,operands[1])]
    ],
    "rotate":["rotate",(operands) => [operands[0],-operands[1],operands[2]]],
    "scale": ["scale", (operands) => [operands[0], 1 / operands[1], operands[2]]],
    "swapZIndices":["swapZIndices",returnInput],
    "shapeAttributeUpdate": ["shapeAttributeUpdate",
        (operands, returnValue) => [operands[0], operands[1], returnValue]],
    "addTween":["removeTween",returnInput],
    "removeTween":["addTween",returnInput],
    "changeTimeOfTimelineEvent": ["changeTimeOfTimelineEvent", (operands, returnValue) => [operands[0], returnValue]],
    "newTweenStart":["newTweenStart",(operands,returnValue) => [operands[0],returnValue]],
    "newTweenEnd":["newTweenEnd",(operands,returnValue) => [operands[0],returnValue]],
    "newShapeAttributeChange":["removeShapeAttributeChange",returnInput],
    "removeShapeAttributeChange":["newShapeAttributeChange",returnInput],
    "changeTimeOfShapeAttributeChange":["changeTimeOfShapeAttributeChange",
        (operands,returnValue) => [operands[0],operands[1],operands[2],returnValue]],
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
    "translate",
    "scale",
    "rotate"
])

export const stepToTimelineEvents = {
    "translate":(step,inverseStep,time) => {
        const shapeTween = new TranslationTween(step[1][1],step[1][0],time)

        return [shapeTween.getTimelineEvents()]
    },
    "rotate": (step,inverseStep,time) => {
        const shapeTween = new RotationTween(step[1][1],step[1][2],step[1][0],time)

        return shapeTween.getTimelineEvents()
    },
    "scale": (step,inverseStep,time) => {
        const shapeTween = new ScaleTween(step[1][1],step[1][2],step[1][0],time)

        return shapeTween.getTimelineEvents()
    },
    "shapeAttributeUpdate": (step,inverseStep,time) => {
        return [{
            "type":"change",
            "shape":step[1][0],
            "time":time,
            "forward":[step],
            "backward":[inverseStep]
        }]
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