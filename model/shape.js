import {getRotateByAngle, increment2dVectorBy, scale2dVectorAboutPoint, midPoint2d} from "../maths.js";
import {controller} from "../controller.js";

export class Shape {
    constructor(appearanceTime,disappearanceTime) {
        this.appearanceTime = appearanceTime
        this.disappearanceTime = disappearanceTime

        // all the things that occur to the shape throughout the animation
        this.timelineEvents = new Set()

        this.modelConstructed = false
    }

    setupOffset(){
        this.offset = midPoint2d([this.left,this.top],[this.right,this.bottom])
    }

    // The model needs to also construct shapes to ensure shapes have attributes which
    // are necessary for their proper functionality, such as setting a unique name or
    // initializing the z-index. This function assigns these attributes to the shapes.

    // the function should only be called once
    // the modelConstructed boolean is used to ensure the controller doesn't do this twice
    modelConstruct(newZIndex,name,directory){
        this.ZIndex = newZIndex
        this.name = name

        // indicates which directory I am a part of
        this.directory = directory

        // once the controller knows about us we create our appearance and disappearance events
        this.appearanceEvent = {
            "type": "appearance",
            "shape": this,
            "time": this.appearanceTime,
            "forward": () => {controller.showShape(this)},
            "backward": () => {controller.hideShape(this)}
        }
        this.disappearanceEvent = {
            "type": "disappearance",
            "shape": this,
            "time": this.disappearanceTime,
            "forward": () => {controller.hideShape(this)},
            "backward": () => {controller.showShape(this)}
        }

        controller.addTimeLineEvent(this.appearanceEvent)
        controller.addTimeLineEvent(this.disappearanceEvent)

        this.modelConstructed = true
    }

    save(){

        const savedTimelineEvents = []

        for (const timelineEvent of this.timelineEvents){
            savedTimelineEvents.push(controller.saveTimelineEvent(timelineEvent))
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

        for (const timelineEvent of save.timelineEvents){
            this.timelineEvents.add(controller.loadTimelineEvent(this,timelineEvent))
        }

        this.modelConstructed = true
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

        controller.updateShape(this)
    }

    addTimelineEvent(event){
        this.timelineEvents.add(event)
    }

    removeTimelineEvent(event){
        this.timelineEvents.delete(event)
    }
}