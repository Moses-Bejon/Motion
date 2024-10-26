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