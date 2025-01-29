import {controller} from "../../../controller.js";

export class timeCursor{
    constructor(parentTimeline) {
        this.parentTimeline = parentTimeline

        this.cursor = document.createElement("div")
        this.cursor.id = "timeCursor"

        const head = document.createElement("div")
        head.id = "timeCursorHead"
        this.cursor.appendChild(head)

        const stem = document.createElement("div")
        stem.id = "timeCursorStem"
        this.cursor.appendChild(stem)

        this.updateTimeCursor()
    }

    updateTimeCursor(){
        this.cursor.style.left = this.parentTimeline.timeToWindowPosition(controller.clock())*100+"%"
    }
}