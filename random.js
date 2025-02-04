export function randomBrightColour(){
    const colour = {"R":0,"G":0,"B":0}

    const colourComponents = ["R","G","B"]

    const colourComponentOneIndex = randomZeroToInteger(2)
    const colourComponentOne = randomZeroToInteger(255)
    colour[colourComponents[colourComponentOneIndex]] = colourComponentOne
    colourComponents.splice(colourComponentOneIndex,1)

    const colourComponentTwoIndex = randomZeroToInteger(1)
    const colourComponentTwo = randomZeroToInteger(255)
    colour[colourComponents[colourComponentTwoIndex]] = colourComponentTwo
    colourComponents.splice(colourComponentOneIndex,1)

    colour[colourComponents[0]] = 510 - colourComponentOne - colourComponentTwo

    return `rgb(${colour.R} ${colour.G} ${colour.B})`
}

function randomZeroToInteger(integer){
    return Math.floor(Math.random()*(integer+1))
}