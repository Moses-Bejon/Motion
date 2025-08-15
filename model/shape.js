import {getRotateByAngle, increment2dVectorBy, scale2dVectorAboutPoint, midPoint2d} from "../maths.js";
import {randomBrightColour} from "../random.js";
import {binaryInsertion} from "../dataStructureOperations.js";

export class Shape {
    constructor() {
        this.tweens = new Set()
    }

    setupInScene(appearanceTime,disappearanceTime,ZIndex,name,directory){
        this.appearanceTime = appearanceTime
        this.disappearanceTime = disappearanceTime

        this.ZIndex = ZIndex
        this.name = name

        // indicates which directory I am a part of
        this.directory = directory

        this.attributes = {}
    }

    static getShapeAttributeChange(time,value){
        return {
            "time":time,
            "value":value,
            "colour":randomBrightColour(),
        }
    }

    updateAttributes(time){
        for (const [attribute,attributeChanges] of Object.entries(this.attributes)){
            let attributeIndex = 0
            while (attributeIndex<attributeChanges.length && attributeChanges[attributeIndex].time <= time){
                attributeIndex++
            }
            attributeIndex--

            this[attribute] = attributeChanges[attributeIndex].value
        }
    }

    shapeAttributeUpdate(attribute,value){

        const attributeEntry = this.attributes[attribute]

        // not an attribute that changes over time
        if (attributeEntry === undefined){
            this[attribute] = value
            return
        }

        // attribute that could change but doesn't currently
        if (attributeEntry.length === 1){
            this.attributes[attribute] = [Shape.getShapeAttributeChange(0,value)]
            this[attribute] = value
            return
        }

        // attribute that already changes over time
        this[attribute] = value
    }

    newShapeAttributeChange(attribute,value,time){
        this.attributes[attribute].push(Shape.getShapeAttributeChange(time,value))
    }

    changeTimeOfShapeAttributeChange(attribute,changeAttribute,newTime){
        const index = this.attributes[attribute].findIndex(change => change === changeAttribute)
        changeAttribute.time = newTime
        this.attributes[attribute].splice(index,1)
        this.attributes[attribute].splice(
            binaryInsertion(this.attributes[attribute],newTime,(item) => item.time),
            0,
            changeAttribute
        )
    }

    removeShapeAttributeChange(attribute,value,time){
        const index = this.attributes[attribute].findIndex(change => change.time === time && change.value === value)
        this.attributes[attribute].splice(index,1)
    }

    addTween(tween){
        this.tweens.add(tween)
    }

    removeTween(tween){
        this.tweens.delete(tween)
    }

    static load(save,shape){
        shape.name = save.name
        shape.directory = save.directory
        shape.appearanceTime = save.appearanceTime
        shape.disappearanceTime = save.disappearanceTime
        shape.ZIndex = save.ZIndex

        for (const tween of save.tweens){
            // TODO: FIX THIS, NEEDS DESERIALISING
            shape.tweens.add(tween)
        }
    }

    setupOffset(){
        this.offset = midPoint2d([this.left,this.top],[this.right,this.bottom])
    }

    save(){

        const serialisedTweens = []

        for (const tween of this.tweens){
            serialisedTweens.push(tween.save())
        }

        return {
            "name":this.name,
            "directory":this.directory,
            "appearanceTime":this.appearanceTime,
            "disappearanceTime":this.disappearanceTime,
            "ZIndex":this.ZIndex,
            "tweens":serialisedTweens
        }
    }

    goToTime(time){

        // TODO: improve efficiency by only considering active tweens
        for (const tween of this.tweens){
            tween.goToTime(time)
        }

        this.updateAttributes(time)

        this.updateGeometry()
    }

    getOffsetPoint(){

        // we would never let them have our actual offset, they might do something crazy, like change it
        return Array.from(this.offset)
    }

    rotateOffsetPointAbout(centreOfRotation,angle){
        this.offset = getRotateByAngle(angle,centreOfRotation)(this.offset)
    }

    scaleOffsetPointAbout(centreOfScale,scaleFactor){
        scale2dVectorAboutPoint(this.offset,centreOfScale,scaleFactor)
    }

    translateOffsetPointBy(translationVector){
        increment2dVectorBy(this.offset,translationVector)
    }
}