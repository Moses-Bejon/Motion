// mathematical functions are defined here

export function clamp(number,lower,upper){
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
    const x1 = line[0][0]
    const y1 = line[0][1]
    const x2 = line[line.length-1][0]
    const y2 = line[line.length-1][1]

    const lineLength = distanceBetween2dPoints([x1,y1],[x2,y2])

    // getting straight section in form ax + y + c = 0
    const a = (y1-y2)/(x2-x1)

    const c = -x1*a-y1

    const denominator = (a**2+1)**0.5

    let greatestDistance = -1
    let greatestIndex = null

    for (let i = 1; i<line.length-1; i++){

        const point = line[i]
        const perpendicularDistance = Math.abs(a*point[0]+point[1]+c)/denominator
        const distanceToFirstEndPoint = distanceBetween2dPoints([x1,y1],point)
        const distanceToSecondEndPoint = distanceBetween2dPoints([x2,y2],point)

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