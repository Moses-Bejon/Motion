import {randomBrightColour} from "../../random.js";
import {binaryInsertion} from "../../dataStructureOperations.js";
import {Shape} from "../../model/shape.js";

const attributeProperties = [
    "colour",
    "outlineColour",
    "width",
    "height",
    "fillColour",
    "thickness",
    "text",
    "fontSize",
    "fontColour",
    "fontFamily"
]

async function getShapeAtZero(shape){
    shape.tweens = []

    shape.attributes = {}
    for (const attribute of attributeProperties){
        if (Object.hasOwn(shape,attribute)){
            shape.attributes[attribute] = [{"time":0,"value":shape[attribute],"colour":randomBrightColour()}]
        }
    }

    // placeholder, will be changed later
    shape.offset = [0,0]

    const shapeInstance = await Shape.load(shape)

    shapeInstance.goToTime(0)
    shapeInstance.setupOffset()

    return shapeInstance
}

function finaliseShape(shape,tweens){
    for (const timelineEvent of shape.timelineEvents){

        switch (timelineEvent.type){
            case "appearance":
                shape.appearanceTime = timelineEvent.time
                break
            case "disappearance":
                shape.disappearanceTime = timelineEvent.time
                break
            case "tweenStart":
                shape.tweens.push(tweens[timelineEvent.tween])
                break
            case "change":
                const indexToInsertAt = binaryInsertion(
                    shape.attributes[timelineEvent.attribute],
                    timelineEvent.time,
                    (item) => item.time
                )

                shape.attributes[timelineEvent.attribute][indexToInsertAt-1].value = timelineEvent.previousValue

                shape.attributes[timelineEvent.attribute].splice(indexToInsertAt,0,{
                    "time":timelineEvent.time,
                    "value":timelineEvent.value,
                    "colour":timelineEvent.colour,
                })
                break
        }
    }

    delete shape.timelineEvents
    delete shape.directory
}

export async function translateFromZero(file){
    let warnedUser = false

    const newFile = {}

    newFile.fileVersion = 1

    newFile.settings = {
        "animationEndTimeSeconds": file.animationEndTimeSeconds,
        "canvasWidth": file.canvasWidth,
        "canvasHeight": file.canvasHeight,
        "defaultTweenLength": file.defaultTweenLength,
        "timelineSnapLength": file.timelineSnapLength,
        "lineSimplificationEpsilon": file.lineSimplificationEpsilon,
        "onionSkinTimeGap": file.onionSkinTimeGap,
        "onionSkinsOn": file.onionSkinsOn
    }

    // overviews no longer exist in version 1
    newFile.rootWindow = JSON.parse(
        JSON.stringify(file.rootWindow).replaceAll("overview", "settings")
    )

    const scene = {}

    scene.ZIndexOfLowestShape = -1
    scene.ZIndexOfHighestShape = file.ZIndexOfHighestShape
    scene.numberOfEachTypeOfShape = file.numberOfEachTypeOfShape

    const aggregateModels = {}

    aggregateModels.clock = file.aggregateModels.clock

    const tweens = []

    for (const tween of file.allTweens){

        switch (tween.tweenType){
            case "translationTween":
                tween.previousTranslation = [0,0]
                break
            case "rotationTween":
                tween.previousAngle = 0
                tween.translationCausedByUs = [0,0]

                break
            case "scaleTween":
                tween.previousScale = 1
                tween.translationCausedByUs = [0,0]
                break
        }

        tweens.push(tween)
    }

    const shapes = []

    for (let i = 0; i < file.aggregateModels.allShapes.length; i++){

        const shape = file.aggregateModels.allShapes[i]

        if (shape.shapeType === "shapeGroup"){

            if (!warnedUser){
                window.alert("Shape groups were removed in file version 1. They exist in this save and will be removed.")
                warnedUser = true
            }

            continue
        }

        const toFindOffset = await getShapeAtZero(shape)
        shape.offset = Array.from(toFindOffset.offset)

        finaliseShape(shape,tweens)

        shapes.push(shape)
    }

    aggregateModels.allShapes = shapes

    scene.aggregateModels = aggregateModels

    newFile.currentScene = scene

    return newFile
}