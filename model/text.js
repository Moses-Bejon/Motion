import {shape} from "./shape.js";
import {fontSize,fontFamily,canvasWidth,canvasHeight} from "../constants.js";

export class text extends shape{
    constructor(appearanceTime,disappearanceTime,topLeft,rotation,colour,size=fontSize,family=fontFamily){
        super(appearanceTime,disappearanceTime)

        this.text = "Begin typing"
        this.defaultTextReplaced = false

        this.topLeft = topLeft
        this.rotation = rotation
        this.fontColour = colour
        this.fontSize = size
        this.fontFamily = family

        this.updateGeometry()

    }

    getTop(){
        return this.topLeft[1]
    }

    getBottom(){
        return this.topLeft[1] - this.height
    }

    getLeft(){
        return this.topLeft[0]
    }

    getRight(){
        return this.topLeft[0] + this.width
    }

    updateWidthAndHeightFromText(){
        // canvas used to measure width and height of text
        const canvas = document.createElement("canvas")
        const context = canvas.getContext("2d")

        context.font = `${this.fontSize} ${this.fontFamily}`

        const metrics = context.measureText(this.text)

        this.width = metrics.width
        this.height = metrics.actualBoundingBoxAscent + metrics.actualBoundingBoxDescent
    }

    getNewGeometryGroup(){
        const newGeometryGroup = document.createElementNS("http://www.w3.org/2000/svg","g")

        const text = document.createElementNS("http://www.w3.org/2000/svg","text")

        text.setAttribute("x",this.topLeft[0])
        text.setAttribute("y",this.topLeft[1])

        text.style.fontFamily = this.fontFamily
        text.style.fontSize = this.fontSize

        text.innerHTML = this.text

        newGeometryGroup.appendChild(text)

        return newGeometryGroup
    }

    updateGeometry(){
        this.updateWidthAndHeightFromText()

        this.geometry = this.getNewGeometryGroup().innerHTML
    }
}