import {getRotateByAngle, increment2dVectorBy, scale2dVectorAboutPoint, midPoint2d} from "../maths.js";
import {controller} from "../controller.js";

export class Shape {
    constructor(appearanceTime,disappearanceTime,ZIndex,name,directory) {
        this.appearanceTime = appearanceTime
        this.disappearanceTime = disappearanceTime

        // all the things that occur to the shape throughout the animation
        this.timelineEvents = new Set()

        this.ZIndex = ZIndex
        this.name = name

        // indicates which directory I am a part of
        this.directory = directory
    }

    setupOffset(){
        this.offset = midPoint2d([this.left,this.top],[this.right,this.bottom])
    }

    save(fileSerializer){

        const savedTimelineEvents = []

        for (const timelineEvent of this.timelineEvents){
            savedTimelineEvents.push(fileSerializer.serializeTimelineEvent(timelineEvent))
        }
        return {
            "name":this.name,
            "directory":this.directory,
            "appearanceTime":this.appearanceTime,
            "disappearanceTime":this.disappearanceTime,
            "ZIndex":this.ZIndex,
            "timelineEvents":savedTimelineEvents
        }
    }

    load(save){
        this.name = save.name
        this.directory = save.directory
        this.appearanceTime = save.appearanceTime
        this.disappearanceTime = save.disappearanceTime
        this.ZIndex = save.ZIndex

        this.timelineEvents = new Set()
    }

    newAppearanceTime(newTime){
        this.appearanceTime = newTime
        controller.changeTimeOfEvent(this.appearanceEvent,newTime)
    }

    newDisappearanceTime(newTime){
        this.disappearanceTime = newTime
        controller.changeTimeOfEvent(this.disappearanceEvent,newTime)
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

    geometryAttributeUpdate(attribute, newValue){
        this[attribute] = newValue

        this.updateGeometry()
    }

    addTimelineEvent(event){
        this.timelineEvents.add(event)
    }

    removeTimelineEvent(event){
        this.timelineEvents.delete(event)
    }

    static copyTimelineEvents(fromShape,toShape){
        const fileSerializer = controller.fileSerializer

        // copies timeline events over
        for (const timelineEvent of fromShape.timelineEvents){
            toShape.addTimelineEvent(
                fileSerializer.loadTimelineEvent(toShape,fileSerializer.serializeTimelineEvent(timelineEvent))
            )
        }
    }
}