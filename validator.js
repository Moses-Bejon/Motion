// this is potentially the most bored I've ever been

import {fontsList} from "./globalValues.js";
import {controller} from "./controller.js";
import {ShapeGroup} from "./model/shapeGroup.js";
import {Shape} from "./model/shape.js";
import {operationToAttribute} from "./typesOfOperation.js";
import {Tween} from "./model/tweens/tween.js";

export function validateReal(possibleNumber){
    return typeof possibleNumber === "number"
}

export function validateNonZeroReal(possibleNonZeroReal){
    return validateReal(possibleNonZeroReal) && possibleNonZeroReal !== 0
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

export function validateNonNegativeReal(possibleNumber){
    return validateReal(possibleNumber) && possibleNumber >= 0
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
    const regularExpression = /^#[0-9a-f]{6}$|^transparent$/i

    return validateString(colour) && regularExpression.test(colour)
}

export function validateTime(time){
    return validateReal(time) && time >= 0 && time <= controller.animationEndTime()
}

export function validateVector2d(vector){
    return vector.length === 2 && validateReal(vector[0]) && validateReal(vector[1])
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
    return validateList(line,validateVector2d)
}

export function validateShape(possibleShape){
    return possibleShape instanceof Shape
}

export function validateShapeGroup(possibleShapeGroup){
    return validateShape(possibleShapeGroup) && possibleShapeGroup instanceof ShapeGroup
}

export function validateShapeList(possibleShapeList){
    return validateList(possibleShapeList,validateShape)
}

export function validateNonEmptyShapeList(possibleShapeList){
    return validateShapeList(possibleShapeList) && possibleShapeList.length > 0
}

export function validateFont(possibleFont){
    return validateString(possibleFont) && fontsList.includes(possibleFont)
}

export function validateFile(file){
    return file instanceof File
}

export function validateAttribute(attribute){
    return Object.values(operationToAttribute).includes(attribute)
}

export function validateTween(tween){
    return tween instanceof Tween
}

const shapeValidation = [validateTime,validateTime]

export const operationToValidationViewLevel = {
    "goToTime":[validateTime],
    "createDrawing":shapeValidation.concat([validateColour,validatePositiveReal,validateLine]),
    "createEllipse":shapeValidation.concat([validateVector2d,validatePositiveReal,validatePositiveReal,
        validateColour,validateColour,validateReal,validatePositiveReal]),
    "createGraphic":shapeValidation.concat([validateFile,validateVector2d,validateReal]),
    "createPolygon":shapeValidation.concat([validateColour,validateColour,validatePositiveReal,validateLine]),
    "createShapeGroup":shapeValidation.concat([validateShapeList]),
    "createText":shapeValidation.concat([validateVector2d,validateReal,validateColour,validatePositiveReal,validateFont]),
    "translate":[validateShape,validateVector2d],
    "rotate":[validateShape,validateReal,validateVector2d],
    "scale":[validateShape,validateNonZeroReal,validateVector2d],
    "duplicate":[validateShape],
    "merge":[validateNonEmptyShapeList],
    "split":[validateShapeGroup],
    "deleteShape":[validateShape],
    "swapZIndices":[validateShape,validateShape],
    "moveToFront":[validateShape],
    "moveToBack":[validateShape],
    "newText":[validateShape,validateString],
    "newAppearanceTime":[validateShape,validateTime],
    "newDisappearanceTime":[validateShape,validateTime],
    "newColour":[validateShape,validateColour],
    "newOutlineColour":[validateShape,validateColour],
    "newThickness":[validateShape,validatePositiveReal],
    "newFillColour":[validateShape,validateColour],
    "newFont":[validateShape,validateFont],
    "newFontSize":[validateShape,validatePositiveReal],
    "newFontColour":[validateShape,validateColour],
    "newHeight":[validateShape,validatePositiveReal],
    "newWidth":[validateShape,validatePositiveReal],
    "addTween":[validateShape,validateTween],
    "removeTween":[validateShape,validateTween],
    "newTweenStart":[validateTween,validateTime],
    "newTweenEnd":[validateTween,validateTime]
}

export function validateOperation(operation, operands,operationToValidation){
    const validation = operationToValidation[operation]

    // is the operation valid
    if (validation === undefined){
        return false
    }

    // are there the right number of operands
    if (operands.length !== validation.length){
        return false
    }

    // are the operands valid
    for (let i = 0; i<validation.length; i++){
        if (!validation[i](operands[i])){
            return false
        }
    }

    // if all validation checks pass, it is valid
    return true
}

export function validateOperationViewLevel(operation, operands){
    return validateOperation(operation,operands,operationToValidationViewLevel)
}