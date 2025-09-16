import {Shape} from "./shape.js";
import {
    add2dVectors,
    getEdgesOfBoxAfterRotation,
    getRotateByAngle,
    increment2dVectorBy,
    scale2dVectorAboutPoint
} from "../maths.js";

export class Text extends Shape{
    constructor(){
        super()
    }

    setupInScene(appearanceTime, disappearanceTime, ZIndex, name,bottomLeft,rotation,colour,size,family) {
        super.setupInScene(appearanceTime, disappearanceTime, ZIndex, name)

        this.attributes.text = [Shape.getShapeAttributeChange(0,"Begin Typing")]
        this.defaultTextReplaced = false

        this.bottomLeft = bottomLeft
        this.rotation = rotation
        this.attributes.fontColour = [Shape.getShapeAttributeChange(0,colour)]
        this.attributes.fontSize = [Shape.getShapeAttributeChange(0,size)]
        this.attributes.fontFamily = [Shape.getShapeAttributeChange(0,family)]

        this.updateAttributes(0)
        this.updateGeometry()

        super.setupOffset()
    }

    static load(save){
        const loadedShape = new Text()
        Shape.load(save,loadedShape)

        loadedShape.defaultTextReplaced = true

        loadedShape.bottomLeft = save.bottomLeft
        loadedShape.rotation = save.rotation

        return loadedShape
    }

    save(fileSerializer){
        const shapeSave = super.save(fileSerializer)

        shapeSave.bottomLeft = this.bottomLeft
        shapeSave.rotation = this.rotation

        shapeSave.shapeType = "text"

        return shapeSave
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

        this.translateOffsetPointBy(translationVector)
    }

    scale(scaleFactor,aboutCentre){
        scale2dVectorAboutPoint(this.bottomLeft,aboutCentre,scaleFactor)

        this.fontSize *= Math.abs(scaleFactor)
        for (const change of this.attributes.fontSize){
            change.value *= Math.abs(scaleFactor)
        }

        this.scaleOffsetPointAbout(aboutCentre,scaleFactor)
    }

    rotate(angle,aboutCentre){
        const rotation = getRotateByAngle(angle,aboutCentre)

        this.bottomLeft = rotation(this.bottomLeft)

        this.rotation += angle
        this.rotateOffsetPointAbout(aboutCentre,angle)
    }

    copy(){
        const copy = new Text()

        copy.setupInScene(
            this.appearanceTime,
            this.disappearanceTime,
            this.ZIndex,
            this.name,
            Array.from(this.bottomLeft),
            this.rotation,
            this.fontColour,
            this.fontSize,
            this.fontFamily
        )

        copy.text = this.text
        copy.defaultTextReplaced = this.defaultTextReplaced

        Shape.copyTimelineEvents(this,copy)
        copy.updateGeometry()

        return copy
    }
}