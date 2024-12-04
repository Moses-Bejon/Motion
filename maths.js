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