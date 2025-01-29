import {controller} from "../../../controller.js";
import {clamp} from "../../../maths.js";

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
        this.cursor.style.left = clamp(this.parentTimeline.timeToWindowPosition(controller.clock()),0.15,1)*100+"%"
    }
}