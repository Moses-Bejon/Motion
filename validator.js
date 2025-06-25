// this is potentially the most bored I've ever been

import {fontsList} from "./globalValues.js";
import {controller} from "./controller.js";
import {shapeGroup} from "./model/shapeGroup.js";

export function validateReal(possibleNumber){
    return typeof possibleNumber === "number"
}

export function validateInteger(possibleInteger){
    return validateReal(possibleInteger) && possibleInteger%1 === 0
}

export function validateNatural(possibleNatural){
    return validateInteger(possibleNatural) && possibleNatural > 0
}

export function validatePositiveReal(possibleNumber){
    return validateReal(possibleNumber) && possibleNumber > 0
}

export function validateBoolean(possibleBoolean){
    return typeof possibleBoolean === "boolean"
}

export function validateString(possibleString){
    return typeof possibleString === "string"
}

export function validateDirectory(directory){
    return validateString(directory) || directory === null
}

export function validateColour(colour) {
    const regularExpression = /^#[0-9a-f]{6}$/i

    return validateString(colour) && regularExpression.test(colour)
}

export function validateTime(time){
    return time >= 0 && time <= controller.animationEndTime()
}

export function validatePoint(point){
    return point.length === 2 && validateReal(point[0]) && validateReal(point[1])
}

export function validateList(list,validation){
    for (const item of list){
        if (!validation(item)){
            return false
        }
    }
    return true
}

export function validateLine(line){
    return validateList(line,validatePoint)
}

export function validateShape(possibleShape){
    return controller.allShapes().includes(possibleShape)
}

export function validateShapeGroup(possibleShapeGroup){
    return validateShape(possibleShapeGroup) && possibleShapeGroup instanceof shapeGroup
}

export function validateShapeList(possibleShapeList){
    return validateList(possibleShapeList,validateShape)
}

export function validateFont(possibleFont){
    return validateString(possibleFont) && fontsList.includes(possibleFont)
}

const shapeValidation = [validateTime,validateTime,validateInteger,validateString,validateDirectory]

export const operationToValidation = {
    "goToTime":[validateTime],
    "createDrawing":shapeValidation.concat([validateColour,validatePositiveReal,validateLine]),
    "createEllipse":shapeValidation.concat([validatePoint,validatePositiveReal,validatePositiveReal,
        validateColour,validateColour,validateReal,validatePositiveReal]),
    "createGraphic":shapeValidation.concat([validatePoint,validateReal]),
    "createPolygon":shapeValidation.concat([validateColour,validateColour,validatePositiveReal,validateLine]),
    "createShapeGroup":shapeValidation.concat([validateShapeList]),
    "createText":shapeValidation.concat([validatePoint,validateReal,validateColour,validatePositiveReal,validateFont]),
    "mergeShapes":[validateShapeList],
    "splitShape":[validateShapeGroup],
    "deleteShape":[validateShape],
    "moveOneAbove":[validateShape],
    "moveOneBelow":[validateShape],
    "moveToFront":[validateShape],
    "moveToBack":[validateShape],

    // additional checks are done for these two in the receivingAction file
    "newAppearanceTime":[validateShape,validateTime],
    "newDisappearanceTime":[validateShape,validateTime]

}