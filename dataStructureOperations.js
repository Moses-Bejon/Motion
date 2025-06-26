import { isGreater } from "./maths.js";
import {canvasEpsilon} from "./globalValues.js";
import {validateColour} from "./validator.js";

// may be optimised by reduce function if performance becomes concern:
export function maximumOfArray(array,key,comparison=isGreater){
    let maximum = key(array[0])

    for (let i = 1; i < array.length; i++){
        const value = key(array[i])
        if (comparison(value,maximum)){
            maximum = value
        }
    }

    return maximum
}

export function binaryInsertion(list,value,listToValue=(value)=>{return value}){
    // binary search to ensure inserted in position to maintain ascending order
    let left = 0
    let right = list.length

    // edge case where we have been passed an empty array
    if (right === 0){
        return 0
    }

    while (left < right){
        const middle = Math.trunc((left+right)/2)
        if (listToValue(list[middle]) > value){
            right = middle
        } else {
            left = middle + 1
        }
    }

    return right
}

export function binarySearch(list,value,listToValue=(value)=>{return value}){
    // binary search to ensure inserted in position to maintain ascending order
    let left = 0
    let right = list.length

    while (true){
        const middle = Math.trunc((left+right)/2)

        const valueAtMiddle = listToValue(list[middle])

        if (valueAtMiddle === value){
            return middle
        }

        if (left + 1 >= right){
            return false
        }

        if (valueAtMiddle > value){
            right = middle
        } else{
            left = middle
        }
    }
}

export function stringToNatural(possibleNatural){
    possibleNatural = parseInt(possibleNatural)

    if (isNaN(possibleNatural)){
        return null
    }

    return Math.max(1,possibleNatural)
}

export function stringToReal(possibleNumber){
    possibleNumber = parseFloat(possibleNumber)

    if (isNaN(possibleNumber)){
        return null
    } else {
        return possibleNumber
    }
}

export function stringToPositiveReal(possibleNumber){
    const value = stringToReal(possibleNumber)

    if (value === null){
        return null
    }

    return Math.max(value,canvasEpsilon)
}

export function stringToColour(string){
    if (validateColour(string)){
        return string
    }
    return null
}