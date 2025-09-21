import {controller} from "../../../controller.js";
import {clamp} from "../../../maths.js";
import {stringToReal} from "../../../dataStructureOperations.js";
import {typicalIconSize} from "../../../constants.js";

export class timeCursor{
    constructor(parentTimeline) {
        this.parentTimeline = parentTimeline

        this.cursor = document.createElement("div")
        this.cursor.id = "timeCursor"

        const head = document.createElement("div")
        head.id = "timeCursorHead"
        this.cursor.appendChild(head)

        this.currentTime = document.createElement("input")
        this.currentTime.type = "text"
        this.currentTime.inputMode = "numeric"
        this.currentTime.id = "currentTimeInput"

        // removes non-numeric characters from input
        this.currentTime.oninput = () => {
            if (stringToReal(this.currentTime.value) === null){
                this.currentTime.value = this.currentTime.value.slice(0,this.currentTime.value.length-1)
            }
        }
        this.currentTime.onchange = () => {

            if (stringToReal(this.currentTime.value) === null){
                this.currentTime.value = "0"
            }

            controller.beginAction()
            controller.takeStep("goToTime",
                [clamp(parseFloat(this.currentTime.value),0,controller.animationEndTime())])
            controller.endAction()
        }
        this.currentTime.onpointerdown = (pointerEvent) => {
            pointerEvent.stopPropagation()
        }

        this.cursor.appendChild(this.currentTime)

        this.buttonContainer = document.createElement("div")
        this.buttonContainer.id = "timeCursorButtons"
        this.cursor.appendChild(this.buttonContainer)

        this.addToTimelineButton = document.createElement("button")
        this.addToTimelineButton.textContent = "Add to timeline"

        this.addToTimelineButton.onpointerdown = (pointerEvent) => {

            controller.addPreviousTimelineEventToTimeline()

            pointerEvent.stopPropagation()
        }

        this.removeButton = document.createElement("button")
        this.removeButton.textContent = "Remove from timeline"

        const stem = document.createElement("div")
        stem.id = "timeCursorStem"
        this.cursor.appendChild(stem)

        this.updateTimeCursor()
    }

    updateTimeCursor(){
        const windowPosition = this.parentTimeline.timeToWindowPosition(controller.clock())

        this.cursor.style.left = clamp(windowPosition,0.15,1)*100+"%"

        // ensures button is on right if close to left and left if close to right
        if (windowPosition < 0.6){
            this.buttonContainer.style.right = null
            this.buttonContainer.style.left = typicalIconSize
            this.buttonContainer.style.transform = null
        } else {
            this.buttonContainer.style.left = null
            this.buttonContainer.style.right = `${typicalIconSize}`
            this.buttonContainer.style.transform = "translate(-100%,0)"
        }

        // ensures values displayed to appropriate precision to input box
        const numberOfDigits = Math.max(Math.floor(Math.log10(controller.clock()))+1,1)
        this.currentTime.value = controller.clock().toFixed(Math.max(3-numberOfDigits,0))
    }

    previousActionTimelineEventsReady(){
        this.buttonContainer.appendChild(this.addToTimelineButton)
    }

    previousActionTimelineEventsGone(){
        this.addToTimelineButton.remove()
    }

    removeEventReady(stepsToRemove){
        this.removeButton.onpointerdown = (pointerEvent) => {
            controller.beginAction()
            for (const step of stepsToRemove){
                controller.takeStep(...step)
            }
            controller.endAction()
            pointerEvent.stopPropagation()
            this.removeEventGone()
        }
        this.buttonContainer.appendChild(this.removeButton)
    }

    removeEventGone(){
        this.removeButton.remove()
    }

}