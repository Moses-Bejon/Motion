import {controller} from "../../../controller.js";
import {clamp} from "../../../maths.js";
import {addDragLogicTo} from "../../../dragLogic.js";

export class timelineChange{
    constructor(parentTimeline,timelineContainer,changeEvent) {
        this.parentTimeline = parentTimeline
        this.timelineContainer = timelineContainer
        this.changeEvent = changeEvent

        this.proportion = this.parentTimeline.timeToTimelinePosition(this.changeEvent.time)

        this.eventToken = document.createElement("div")
        this.eventToken.className = "eventToken"
        this.eventToken.style.backgroundColor = changeEvent.colour
        this.eventToken.style.left = `${this.proportion*100}%`

        addDragLogicTo(
            this.eventToken,
            this.drag.bind(this),
            this.finishDragging.bind(this),
            this.beginDragging.bind(this),
            "ew-resize",
            "ew-resize"
        )

        this.timelineContainer.appendChild(this.eventToken)

        this.select()
    }

    select(){

        // only one thing can be selected at a time for timeline events
        this.parentTimeline.deselectAll()

        this.eventToken.style.outline = "1px solid"

        this.parentTimeline.cursor.removeEventReady(
            () => {
                controller.removeTimeLineEvent(this.changeEvent)
            },
            () => {
                controller.addTimeLineEvent(this.changeEvent)
            }
        )
    }

    deselect(){
        this.eventToken.style.outline = "none"
    }

    beginDragging(pointerEvent) {
        this.initialPosition = pointerEvent.clientX
        pointerEvent.stopPropagation()
    }

    drag(pointerEvent){
        const currentPosition = pointerEvent.clientX

        const newProportion = clamp(
            this.proportion + this.parentTimeline.globalWidthToTimelineWidth(currentPosition-this.initialPosition),
            0,
            1
        )

        this.eventToken.style.left = `${newProportion*100}%`

        return newProportion
    }

    finishDragging(pointerEvent){
        const newProportion = this.drag(pointerEvent)
        const newTime = this.parentTimeline.snapValueToCell(
            this.parentTimeline.timeLinePositionToTime(newProportion)
        )

        controller.beginAction()
        controller.takeStep("changeTimeOfTimelineEvent",[this.changeEvent,newTime])
        controller.endAction()

        this.select()
    }

    remove(){
        this.eventToken.remove()
    }

    update(){
        this.proportion = this.parentTimeline.timeToTimelinePosition(this.changeEvent.time)
        this.eventToken.style.left = `${this.proportion*100}%`
    }
}