// mathematical functions are defined here

import {maximumOfArray} from "./dataStructureOperations.js";

export function clamp(number, lower, upper){
    if (number < lower){
        return lower
    }
    if (number > upper){
        return upper
    }
    return number
}

export function add2dVectors(vector1,vector2){
    return [vector1[0]+vector2[0],vector1[1]+vector2[1]]
}

export function increment2dVectorBy(vector,by){
    vector[0] += by[0]
    vector[1] += by[1]
}

export function subtract2dVectors(vector1,vector2){
    return [vector1[0]-vector2[0],vector1[1]-vector2[1]]
}

export function decrement2dVectorBy(vector,by){
    vector[0] -= by[0]
    vector[1] -= by[1]
}

export function multiply2dVectorByScalar(scalar,vector){
    return [scalar*vector[0],scalar*vector[1]]
}

export function scale2dVectorBy(vector,by){
    vector[0] *= by
    vector[1] *= by
}

export function transformVectorByMatrix(vector,matrix){
    return [
        matrix[0][0]*vector[0]+matrix[0][1]*vector[1],
        matrix[1][0]*vector[0]+matrix[1][1]*vector[1]
    ]
}

export function scale2dVectorAboutPoint(vector,point,scaleFactor){
    decrement2dVectorBy(vector,point)
    scale2dVectorBy(vector,scaleFactor)
    increment2dVectorBy(vector,point)
}

export function isGreater(a,b){
    return a > b
}

export function isLess(a,b){
    return a < b
}

export function distanceBetween2dPoints(point1,point2){
    return Math.hypot(point1[0]-point2[0],point1[1]-point2[1])
}

export function midPoint2d(point1,point2){
    return [(point1[0]+point2[0])/2,(point1[1]+point2[1])/2]
}

export function getDistanceToStraightLineThrough(gradientPoint1,gradientPoint2,linePoint){

    // getting straight section in form ax + y + c = 0

    // gradientPoints are used to compute the gradient
    const a = (gradientPoint1[1]-gradientPoint2[1])/(gradientPoint2[0]-gradientPoint1[0])

    // and line points to find the position of the line
    const c = -linePoint[0]*a-linePoint[1]

    const denominator = (a**2+1)**0.5

    return (point) => {return (a*point[0]+point[1]+c)/denominator}
}

export function getRotateByAngle(angle,aboutCentre){
    const cosine = Math.cos(angle)
    const sine = Math.sin(angle)
    const rotationMatrix = [[cosine,-sine],[sine,cosine]]

    return (point) => {
        return add2dVectors(transformVectorByMatrix(subtract2dVectors(point,aboutCentre),rotationMatrix),aboutCentre)
    }
}

export function dotProduct2d(vector1,vector2){
    return vector1[0]*vector2[0] + vector1[1]*vector2[1]
}

export function angleBetweenThreePoints(A,B,C){
    const BA = subtract2dVectors(A,B)
    const BC = subtract2dVectors(C,B)

    return Math.acos(dotProduct2d(BA,BC)/(Math.hypot(...BA)*Math.hypot(...BC)))
}

// simplifies a line
export function decimateLine(line,epsilon){
    return [line[0]].concat(decimateLineRecursivePart(line,epsilon)).concat([line[line.length-1]])
}

// returns all points between start and end that should be included
export function decimateLineRecursivePart(line,epsilon){
    if (line.length <= 2){
        return []
    }

    // start and end of straight section
    const first = line[0]
    const last = line[line.length-1]

    const lineLength = distanceBetween2dPoints(first,last)

    const pointToDistance = getDistanceToStraightLineThrough(first,last,first)

    let greatestDistance = -1
    let greatestIndex = null

    for (let i = 1; i<line.length-1; i++){

        const point = line[i]
        const perpendicularDistance = Math.abs(pointToDistance(point))
        const distanceToFirstEndPoint = distanceBetween2dPoints(first,point)
        const distanceToSecondEndPoint = distanceBetween2dPoints(last,point)

        let distanceToClosestEndPoint
        let distanceToFurthestEndPoint

        if (distanceToFirstEndPoint < distanceToSecondEndPoint){
            distanceToClosestEndPoint = distanceToFirstEndPoint
            distanceToFurthestEndPoint = distanceToSecondEndPoint
        } else {
            distanceToClosestEndPoint = distanceToSecondEndPoint
            distanceToFurthestEndPoint = distanceToFirstEndPoint
        }

        // check if point is within endpoints of line.
        // If it is return perpendicular distance, otherwise return distance to closest endpoint

        if ((distanceToFurthestEndPoint**2-perpendicularDistance**2)**0.5 < lineLength){
            if (perpendicularDistance>greatestDistance){
                greatestDistance = perpendicularDistance
                greatestIndex = i
            }
        } else {
            if (distanceToClosestEndPoint>greatestDistance){
                greatestDistance = distanceToClosestEndPoint
                greatestIndex = i
            }
        }
    }

    if (greatestDistance < epsilon){
        return []
    }

    return decimateLineRecursivePart(line.slice(0,greatestIndex),epsilon).concat(
        [line[greatestIndex]]).concat(decimateLineRecursivePart(line.slice(greatestIndex),epsilon)
    )

}

export function getEdgesOfBoxAfterRotation(corners,angle,aboutCentre){
    const rotation = getRotateByAngle(angle,aboutCentre)

    // rotate each corner
    for (let i = 0; i < 4; i++){
        corners[i] = rotation(corners[i])
    }

    // use corners to find top, bottom, left and right
    const top = maximumOfArray(corners,(corner) => {return corner[1]},isLess)
    const bottom = maximumOfArray(corners,(corner) => {return corner[1]})
    const left = maximumOfArray(corners,(corner) => {return corner[0]},isLess)
    const right = maximumOfArray(corners,(corner) => {return corner[0]})

    return [top,bottom,left,right]
}