import {shape} from "./shape.js";
import {fontSize,fontFamily} from "../constants.js";
import {increment2dVectorBy} from "../maths.js";

export class text extends shape{
    constructor(appearanceTime,disappearanceTime,bottomLeft,rotation,colour,size=fontSize,family=fontFamily){
        super(appearanceTime,disappearanceTime)

        this.text = "Begin typing"
        this.defaultTextReplaced = false

        this.bottomLeft = bottomLeft
        this.rotation = rotation
        this.fontColour = colour
        this.fontSize = size
        this.fontFamily = family

        this.updateGeometry()

    }

    updateWidthAndHeightFromText(){
        // canvas used to measure width and height of text
        const canvas = document.createElement("canvas")
        const context = canvas.getContext("2d")

        context.font = `${this.fontSize} ${this.fontFamily}`

        const metrics = context.measureText(this.text)

        this.ascent = metrics.actualBoundingBoxAscent
        this.descent = metrics.actualBoundingBoxDescent

        this.width = metrics.width
        this.height = this.ascent + this.descent
    }

    getNewGeometryGroup(){
        const newGeometryGroup = document.createElementNS("http://www.w3.org/2000/svg","g")

        const text = document.createElementNS("http://www.w3.org/2000/svg","text")

        text.setAttribute("x",this.bottomLeft[0])
        text.setAttribute("y",this.bottomLeft[1])

        text.style.fontFamily = this.fontFamily
        text.style.fontSize = this.fontSize
        text.style.userSelect = "none"
        text.style.whiteSpace = "normal"

        // sanitizing user input
        // This is for their personal convenience, not for security, as they are, of course, only in their own browser
        text.innerHTML = this.text
            .replaceAll("&", "&amp;")
            .replaceAll("<", "&lt;")
            .replaceAll(">", "&gt;")
            .replaceAll("\"", "&quot;")
            .replaceAll("'", "&#x27;")
            .replaceAll(" ","&nbsp;")

        newGeometryGroup.appendChild(text)

        return newGeometryGroup
    }

    updateGeometry(){
        this.updateWidthAndHeightFromText()

        this.geometry = this.getNewGeometryGroup().innerHTML

        this.top = this.bottomLeft[1] - this.ascent
        this.bottom = this.bottomLeft[1] + this.descent
        this.left = this.bottomLeft[0]
        this.right = this.bottomLeft[0] + this.width
    }

    translate(translationVector){
        increment2dVectorBy(this.bottomLeft,translationVector)

        this.updateGeometry()
    }

    copy(){
        const copy = new text(
            this.appearanceTime,
            this.disappearanceTime,
            this.bottomLeft,
            this.rotation,
            this.fontColour,
            this.fontSize,
            this.fontFamily
        )

        copy.text = this.text
        copy.defaultTextReplaced = this.defaultTextReplaced

        copy.updateGeometry()

        return copy
    }
}