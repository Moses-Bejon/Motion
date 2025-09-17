import {multiply2dVectorByScalar, returnInput} from "./maths.js";

export const operationToInverse = {
    // 0 is inverse operation, 1 is function to run on operands and save to reverse them
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
export const shapeCreation = ["createDrawing","createEllipse","createGraphic","createPolygon","createText",
    "duplicate"]

export const operationsWhichReturn = shapeCreation.concat([
    "shapeAttributeUpdate","changeTimeOfTimelineEvent","newTweenStart","newTweenEnd","changeTimeOfShapeAttributeChange"
])