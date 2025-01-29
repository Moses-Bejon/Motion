import {bumperTranslation} from "./timeline.js";
import {addDragLogicTo} from "../../dragLogic.js";
import {clamp} from "../../maths.js";
import {controller} from "../../controller.js";

export class shapeTimeline{
    constructor(parentTimeline,shape,label) {
        this.label = label

        this.parentTimeline = parentTimeline
        this.shape = shape

        this.timeline = document.createElement("div")
        this.timeline.style.position = "relative"
        this.timeline.className = "timelineEvents"

        this.updatePosition()

        const topLeftBumper = document.createElement("div")
        topLeftBumper.className = "bumper"
        topLeftBumper.style.left = "0"
        topLeftBumper.style.top = bumperTranslation + "px"
        this.timeline.appendChild(topLeftBumper)

        const topRightBumper = document.createElement("div")
        topRightBumper.className = "bumper"
        topRightBumper.style.right = "0"
        topRightBumper.style.top = bumperTranslation + "px"
        this.timeline.appendChild(topRightBumper)

        const bottomRightBumper = document.createElement("div")
        bottomRightBumper.className = "bumper"
        bottomRightBumper.style.right = "0"
        bottomRightBumper.style.bottom = bumperTranslation + "px"
        this.timeline.appendChild(bottomRightBumper)

        const bottomLeftBumper = document.createElement("div")
        bottomLeftBumper.className = "bumper"
        bottomLeftBumper.style.left = "0"
        bottomLeftBumper.style.bottom = bumperTranslation + "px"
        this.timeline.appendChild(bottomLeftBumper)

        addDragLogicTo(topLeftBumper,
            this.dragLeftBumper.bind(this),
            this.finishDraggingLeftBumper.bind(this),
            this.setInitialPointerPosition.bind(this),
            "ew-resize",
            "ew-resize"
        )
        addDragLogicTo(bottomLeftBumper,
            this.dragLeftBumper.bind(this),
            this.finishDraggingLeftBumper.bind(this),
            this.setInitialPointerPosition.bind(this),
            "ew-resize",
            "ew-resize"
        )

        addDragLogicTo(topRightBumper,
            this.dragRightBumper.bind(this),
            this.finishDraggingRightBumper.bind(this),
            this.setInitialPointerPosition.bind(this),
            "ew-resize",
            "ew-resize"
        )
        addDragLogicTo(bottomRightBumper,
            this.dragRightBumper.bind(this),
            this.finishDraggingRightBumper.bind(this),
            this.setInitialPointerPosition.bind(this),
            "ew-resize",
            "ew-resize"
        )
    }

    updatePosition(){

        this.startTime = this.shape.appearanceTime
        this.endTime = this.shape.disappearanceTime

        this.startProportion = this.parentTimeline.timeToTimelinePosition(this.startTime)
        this.endProportion = this.parentTimeline.timeToTimelinePosition(this.endTime)

        const startPosition = 85*this.startProportion + "%"

        // width of entire timeline is 100% but that includes 15% of left menu, so 85 used
        const width = 85*(this.endProportion-this.startProportion) + "%"

        this.timeline.style.left = startPosition
        this.timeline.style.width = width
    }

    setInitialPointerPosition(pointerEvent) {
        this.initialPosition = pointerEvent.clientX
    }

    dragRightBumper(pointerEvent){
        const currentPosition = pointerEvent.clientX

        const newEndProportion = clamp(
            this.endProportion + this.parentTimeline.globalWidthToTimelineWidth(currentPosition-this.initialPosition),
            this.startProportion,
            1
        )

        this.timeline.style.width = 85*(newEndProportion-this.startProportion) + "%"

        return newEndProportion
    }

    finishDraggingRightBumper(pointerEvent){
        const newEnd = this.dragRightBumper(pointerEvent)
        const newTime = this.parentTimeline.timeLinePositionToTime(newEnd)

        controller.newAction(
            () => {
                this.shape.disappearanceTime = newTime
                controller.updateTimeLineEvent(
                    {"type":"disappearance","shape":this.shape,"time":this.endTime},
                    {"type":"disappearance","shape":this.shape,"time":newTime}
                )
            },
            () => {
                this.shape.disappearanceTime = this.endTime
                controller.updateTimeLineEvent(
                    {"type":"disappearance","shape":this.shape,"time":newTime},
                    {"type":"disappearance","shape":this.shape,"time":this.endTime}
                )
            }
        )
    }

    dragLeftBumper(pointerEvent){
        const currentPosition = pointerEvent.clientX

        const newStartProportion = clamp(
            this.startProportion + this.parentTimeline.globalWidthToTimelineWidth(currentPosition-this.initialPosition),
            0,
            this.endProportion
        )

        this.timeline.style.left = 85*newStartProportion + "%"
        this.timeline.style.width = 85*(this.endProportion-newStartProportion) + "%"

        return newStartProportion
    }

    finishDraggingLeftBumper(pointerEvent){
        const newStart = this.dragLeftBumper(pointerEvent)
        const newTime = this.parentTimeline.timeLinePositionToTime(newStart)

        controller.newAction(
            () => {
                this.shape.appearanceTime = newTime
                controller.updateTimeLineEvent(
                    {"type":"appearance","shape":this.shape,"time":this.startTime},
                    {"type":"appearance","shape":this.shape,"time":newTime}
                )
            },
            () => {
                this.shape.appearanceTime = this.startTime
                controller.updateTimeLineEvent(
                    {"type":"appearance","shape":this.shape,"time":newTime},
                    {"type":"appearance","shape":this.shape,"time":this.startTime}
                )
            }
        )
    }
}