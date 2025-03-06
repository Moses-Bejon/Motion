import {shape} from "./shape.js";
import {fontSizeInt,fontFamily} from "../globalValues.js";
import {
    add2dVectors,
    getEdgesOfBoxAfterRotation,
    getRotateByAngle,
    increment2dVectorBy,
    scale2dVectorAboutPoint
} from "../maths.js";

export class text extends shape{
    constructor(appearanceTime,disappearanceTime,bottomLeft,rotation,colour,size=fontSizeInt,family=fontFamily){
        super(appearanceTime,disappearanceTime)

        this.text = "Begin typing"
        this.defaultTextReplaced = false

        this.bottomLeft = bottomLeft
        this.rotation = rotation
        this.fontColour = colour
        this.fontSize = size
        this.fontFamily = family

        this.updateGeometry()

        super.setupOffset()
    }

    save(){
        const shapeSave = super.save()

        shapeSave.text = this.text
        shapeSave.bottomLeft = this.bottomLeft
        shapeSave.fontColour = this.fontColour
        shapeSave.fontSize = this.fontSize
        shapeSave.fontFamily = this.fontFamily

        shapeSave.shapeType = "text"

        return shapeSave
    }

    load(save){
        super.load(save)

        this.defaultTextReplaced = true

        this.text = save.text
        this.bottomLeft = save.bottomLeft
        this.fontColour = save.fontColour
        this.fontSize = save.fontSize
        this.fontFamily = save.fontFamily

        this.updateGeometry()
        this.setupOffset()
    }

    updateWidthAndHeightFromText(){
        // canvas used to measure width and height of text
        const canvas = document.createElement("canvas")
        const context = canvas.getContext("2d")

        context.font = `${this.fontSize}pt ${this.fontFamily}`

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
        text.style.fontSize = `${this.fontSize}pt`
        text.style.fill = this.fontColour
        text.style.userSelect = "none"
        text.style.whiteSpace = "normal"

        text.style.transformOrigin = `${this.bottomLeft[0]}px ${this.bottomLeft[1]}px`
        text.style.transform = `rotate(${this.rotation}rad)`

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


        const edges = getEdgesOfBoxAfterRotation(
            [
                add2dVectors(this.bottomLeft,[0,-this.ascent]),
                add2dVectors(this.bottomLeft,[0,this.descent]),
                add2dVectors(this.bottomLeft,[this.width,-this.ascent]),
                add2dVectors(this.bottomLeft,[this.width,this.descent])
            ],
            this.rotation,
            this.bottomLeft
        )

        this.top = edges[0]
        this.bottom = edges[1]
        this.left = edges[2]
        this.right = edges[3]
    }

    translate(translationVector){
        increment2dVectorBy(this.bottomLeft,translationVector)

        this.updateGeometry()
        this.translateOffsetPointBy(translationVector)
    }

    scale(scaleFactor,aboutCentre){
        scale2dVectorAboutPoint(this.bottomLeft,aboutCentre,scaleFactor)

        this.fontSize *= Math.abs(scaleFactor)

        this.updateGeometry()
        this.scaleOffsetPointAbout(aboutCentre,scaleFactor)
    }

    rotate(angle,aboutCentre){
        const rotation = getRotateByAngle(angle,aboutCentre)

        this.bottomLeft = rotation(this.bottomLeft)

        this.rotation += angle
        this.updateGeometry()
        this.rotateOffsetPointAbout(aboutCentre,angle)
    }

    copy(){
        const copy = new text(
            this.appearanceTime,
            this.disappearanceTime,
            Array.from(this.bottomLeft),
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