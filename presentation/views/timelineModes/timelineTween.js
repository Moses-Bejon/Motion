import {addDragLogicTo} from "../../../dragLogic.js";
import {clamp} from "../../../maths.js";
import {controller} from "../../../controller.js";

export class timelineTween{
    constructor(parentTimeline,timelineContainer,tween) {
        this.parentTimeline = parentTimeline
        this.timelineContainer = timelineContainer
        this.tween = tween

        this.receivedStart = false
        this.receivedEnd = false
    }

    receiveStart(start){
        this.receivedStart = true
        this.start = start

        this.startNode = document.createElement("div")
        this.startNode.className = "eventToken"
        this.startNode.style.backgroundColor = this.start.colour
        this.startProportion = this.parentTimeline.timeToTimelinePosition(this.start.time)
        this.startPositionPercent = this.startProportion*100
        this.startNode.style.left = this.startPositionPercent + "%"

        addDragLogicTo(
            this.startNode,
            this.dragLeftBumper.bind(this),
            this.finishDraggingLeftBumper.bind(this),
            this.setInitialPointerPosition.bind(this),
            "ew-resize",
            "ew-resize"
        )

        if (this.receivedEnd){
            this.finaliseTween()
        }
    }

    receiveEnd(end){
        this.receivedEnd = true
        this.end = end

        this.endNode = document.createElement("div")
        this.endNode.className = "eventToken"
        this.endProportion = this.parentTimeline.timeToTimelinePosition(this.end.time)
        this.endPositionPercent = this.endProportion*100
        this.endNode.style.left = this.endPositionPercent + "%"

        addDragLogicTo(
            this.endNode,
            this.dragRightBumper.bind(this),
            this.finishDraggingRightBumper.bind(this),
            this.setInitialPointerPosition.bind(this),
            "ew-resize",
            "ew-resize"
        )

        if (this.receivedStart){
            this.finaliseTween()
        }
    }

    finaliseTween(){
        this.endNode.style.backgroundColor = this.start.colour

        this.connector = document.createElement("div")
        this.connector.className = "tweenConnector"
        this.connector.style.left = this.startPositionPercent + "%"
        this.connector.style.right = (100-this.endPositionPercent) + "%"
        this.connector.style.backgroundColor = this.start.colour

        this.timelineContainer.appendChild(this.startNode)
        this.timelineContainer.appendChild(this.endNode)
        this.timelineContainer.appendChild(this.connector)
    }

    remove(){
        this.startNode.remove()
        this.connector.remove()
        this.endNode.remove()
    }

    removeStart(){
        this.remove()
        this.receivedStart = false
    }

    removeEnd(){
        this.remove()
        this.receivedEnd = false
    }

    newStartProportion(proportion){
        this.startPositionPercent = proportion*100
        this.startNode.style.left = this.startPositionPercent + "%"
        this.connector.style.left = this.startPositionPercent + "%"
    }

    newEndProportion(proportion){
        this.endPositionPercent = proportion*100
        this.endNode.style.left = this.endPositionPercent + "%"
        this.connector.style.right = (100-this.endPositionPercent) + "%"
    }

    setInitialPointerPosition(pointerEvent) {
        this.initialPosition = pointerEvent.clientX
        pointerEvent.stopPropagation()
    }

    dragRightBumper(pointerEvent){
        const currentPosition = pointerEvent.clientX

        const newEndProportion = clamp(
            this.endProportion + this.parentTimeline.globalWidthToTimelineWidth(currentPosition-this.initialPosition),
            this.startProportion,
            1
        )

        this.newEndProportion(newEndProportion)

        return newEndProportion
    }

    finishDraggingRightBumper(pointerEvent){
        const newEnd = this.dragRightBumper(pointerEvent)

        this.endProportion = newEnd

        const previousTime = this.tween.endTime
        const newTime = this.parentTimeline.snapValueToCell(this.parentTimeline.timeLinePositionToTime(newEnd))

        controller.newAction(
            () => {
                this.tween.newEndTime(newTime)
                controller.changeTimeOfEvent(this.end,newTime)

                // if we are in the middle of a tween, this ensures the tween is in the right place
                controller.newClockTime(controller.clock())
            },
            () => {
                this.tween.newEndTime(previousTime)
                controller.changeTimeOfEvent(this.end,previousTime)
                controller.newClockTime(controller.clock())
            },
            []
        )
    }

    dragLeftBumper(pointerEvent){
        const currentPosition = pointerEvent.clientX

        const newStartProportion = clamp(
            this.startProportion + this.parentTimeline.globalWidthToTimelineWidth(currentPosition-this.initialPosition),
            0,
            this.endProportion
        )

        this.newStartProportion(newStartProportion)

        return newStartProportion
    }

    finishDraggingLeftBumper(pointerEvent){
        const newStart = this.dragLeftBumper(pointerEvent)

        this.startProportion = newStart

        const previousTime = this.tween.startTime
        const newTime = this.parentTimeline.snapValueToCell(this.parentTimeline.timeLinePositionToTime(newStart))

        controller.newAction(
            () => {
                this.tween.newStartTime(newTime)
                controller.changeTimeOfEvent(this.start,newTime)

                // if we are in the middle of a tween, this ensures the tween is in the right place
                controller.newClockTime(controller.clock())
            },
            () => {
                this.tween.newEndTime(previousTime)
                controller.changeTimeOfEvent(this.start,previousTime)
                controller.newClockTime(controller.clock())
            },
            []
        )
    }
}