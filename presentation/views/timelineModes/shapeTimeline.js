import {addDragLogicTo} from "../../../dragLogic.js";
import {clamp} from "../../../maths.js";
import {controller} from "../../../controller.js";
import {
    bumperTranslation,
    timelineRightMenuSizePercentage
} from "../../../constants.js";
import {timelineTween} from "./timelineTween.js";
import {timelineChange} from "./timelineChange.js";

export class shapeTimeline{
    constructor(parentTimeline,shape) {

        // timeline event object to event token geometry on timeline
        this.attributeChangeToEventToken = new Map()

        // tween model to relevant tween presentation class
        this.tweenToTimelineTween = new Map()

        this.shapeSection = document.createElement("div")
        this.shapeSection.className = "timeline"

        const labelContainer = document.createElement("div")
        labelContainer.className = "labelContainer"

        this.label = document.createElement("h2")
        this.label.textContent = shape.name
        labelContainer.appendChild(this.label)

        this.parentTimeline = parentTimeline
        this.shape = shape

        this.timelineContainer = document.createElement("div")
        this.timelineContainer.style.width = timelineRightMenuSizePercentage+"%"
        this.timelineContainer.style.height = "100%"
        this.timelineContainer.style.position = "relative"

        // setting up a local stacking context, so the super high z indices in this window don't leak
        // (I need them to be high to ensure that thinner tweens are above thicker tweens)
        this.timelineContainer.style.zIndex = 0

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

        this.shapeSection.appendChild(labelContainer)

        this.timelineContainer.appendChild(this.timeline)
        this.shapeSection.appendChild(this.timelineContainer)

        parentTimeline.timelineList.appendChild(this.shapeSection)
        parentTimeline.shapeToTimeline.set(shape,this)

        for (const tween of shape.tweens){
            this.tweenToTimelineTween.set(tween,new timelineTween(this.parentTimeline,this.timelineContainer,tween))
        }

        for (const [attribute,changes] of Object.entries(shape.attributes)){
            for (let i = 1; i < changes.length; i++){
                this.attributeChangeToEventToken.set(
                    changes[i],
                    new timelineChange(this.parentTimeline,this.timelineContainer,changes[i],this.shape,attribute)
                )
            }
        }
    }

    updatePosition(){

        this.startTime = this.shape.appearanceTime
        this.endTime = this.shape.disappearanceTime

        this.startProportion = this.parentTimeline.timeToTimelinePosition(this.startTime)
        this.endProportion = this.parentTimeline.timeToTimelinePosition(this.endTime)

        const startPosition = 100*this.startProportion + "%"

        const width = 100*(this.endProportion-this.startProportion) + "%"

        this.timeline.style.left = startPosition
        this.timeline.style.width = width
    }

    setInitialPointerPosition(pointerEvent) {
        this.initialPosition = pointerEvent.clientX
        pointerEvent.stopPropagation()
    }

    dragRightBumper(pointerEvent){
        const currentPosition = pointerEvent.clientX

        const newEndProportion = clamp(
            this.endProportion + this.parentTimeline.globalWidthToTimelineWidth(currentPosition-this.initialPosition),
            this.startProportion+controller.timelineSnapLength()/controller.animationEndTime(),
            1
        )

        this.timeline.style.width = 100*(newEndProportion-this.startProportion) + "%"

        return newEndProportion
    }

    finishDraggingRightBumper(pointerEvent){
        const newEnd = this.dragRightBumper(pointerEvent)

        const newTime = this.parentTimeline.snapValueToCellBorder(this.parentTimeline.timeLinePositionToTime(newEnd))

        controller.beginAction()
        controller.takeStep("newDisappearanceTime",[this.shape,newTime])
        controller.endAction()
    }

    dragLeftBumper(pointerEvent){
        const currentPosition = pointerEvent.clientX

        const newStartProportion = clamp(
            this.startProportion + this.parentTimeline.globalWidthToTimelineWidth(currentPosition-this.initialPosition),
            0,
            this.endProportion-controller.timelineSnapLength()/controller.animationEndTime()
        )

        this.timeline.style.left = 100*newStartProportion + "%"
        this.timeline.style.width = 100*(this.endProportion-newStartProportion) + "%"

        return newStartProportion
    }

    finishDraggingLeftBumper(pointerEvent){
        const newStart = this.dragLeftBumper(pointerEvent)

        const newTime = this.parentTimeline.snapValueToCellBorder(this.parentTimeline.timeLinePositionToTime(newStart))

        controller.beginAction()
        controller.takeStep("newAppearanceTime",[this.shape,newTime])
        controller.endAction()
    }

    deselectAll(){
        for (const [event,token] of this.attributeChangeToEventToken){
            token.deselect()
        }

        for (const [tween,token] of this.tweenToTimelineTween){
            token.deselect()
        }
    }
}