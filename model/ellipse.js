import {Shape} from "./shape.js";
import {
    getEdgesOfEllipseAfterRotation,
    getRotateByAngle,
    increment2dVectorBy,
    scale2dVectorAboutPoint
} from "../maths.js";

export class Ellipse extends Shape{
    constructor(){
        super()
    }

    setupInScene(appearanceTime, disappearanceTime, ZIndex, name, directory,centre,height,width,outlineColour,colour,rotation,thickness) {
        super.setupInScene(appearanceTime, disappearanceTime, ZIndex, name, directory)

        this.centre = centre
        this.rotation = rotation
        this.attributes.height = [Shape.getShapeAttributeChange(0,height)]
        this.attributes.width = [Shape.getShapeAttributeChange(0,width)]
        this.attributes.outlineColour = [Shape.getShapeAttributeChange(0,outlineColour)]
        this.attributes.colour = [Shape.getShapeAttributeChange(0,colour)]
        this.attributes.thickness = [Shape.getShapeAttributeChange(0,thickness)]
    }

    static load(save){
        const loadedShape = Shape.load(save)

        loadedShape.centre = save.centre
        loadedShape.rotation = save.rotation

        loadedShape.updateGeometry()
        loadedShape.setupOffset()

        return loadedShape
    }

    save(fileSerializer){
        const shapeSave = super.save(fileSerializer)

        shapeSave.centre = this.centre
        shapeSave.rotation = this.rotation

        shapeSave.shapeType = "ellipse"

        return shapeSave
    }

    updateGeometry(){
        const geometryGroup = document.createElementNS("http://www.w3.org/2000/svg","g")

        const ellipse = document.createElementNS("http://www.w3.org/2000/svg","ellipse")

        ellipse.style.fill = this.colour
        ellipse.style.stroke = this.outlineColour
        ellipse.style.strokeWidth = this.thickness

        ellipse.style.transformOrigin = `${this.centre[0]}px ${this.centre[1]}px`
        ellipse.style.transform = `rotate(${this.rotation}rad)`

        let extraScale = 0

        /* check for edge case where there is not enough space in the user's ellipse for the outline */
        if ((this.thickness > this.height || this.thickness > this.width) && (this.outlineColour !== null)){

            ellipse.style.stroke = "transparent"
            ellipse.style.fill = this.outlineColour

            ellipse.setAttribute("rx",this.width/2 + this.thickness/2)
            ellipse.setAttribute("ry",this.height/2 + this.thickness/2)

            extraScale = this.thickness
        } else {

            /* otherwise proceed as usual */

            ellipse.style.stroke = this.outlineColour
            ellipse.style.fill = this.colour

            ellipse.setAttribute("rx",this.width/2)
            ellipse.setAttribute("ry",this.height/2)

            if (this.outlineColour !== null){
                extraScale = this.thickness
                }
        }

        ellipse.setAttribute("cx",this.centre[0])
        ellipse.setAttribute("cy",this.centre[1])

        geometryGroup.appendChild(ellipse)

        this.geometry = geometryGroup.innerHTML

        const edges = getEdgesOfEllipseAfterRotation(
            this.width+extraScale,
            this.height+extraScale,
            this.rotation,this.centre
        )

        this.top = edges[0]
        this.bottom = edges[1]
        this.left = edges[2]
        this.right = edges[3]
    }

    translate(translationVector){
        increment2dVectorBy(this.centre,translationVector)

        this.translateOffsetPointBy(translationVector)
    }

    scale(scaleFactor,aboutCentre){
        scale2dVectorAboutPoint(this.centre,aboutCentre,scaleFactor)

        this.height *= Math.abs(scaleFactor)
        for (const change of this.attributes.height){
            change.value *= Math.abs(scaleFactor)
        }

        this.width *= Math.abs(scaleFactor)
        for (const change of this.attributes.width){
            change.value *= Math.abs(scaleFactor)
        }

        this.thickness *= Math.abs(scaleFactor)
        for (const change of this.attributes.thickness){
            change.value *= Math.abs(scaleFactor)
        }

        this.scaleOffsetPointAbout(aboutCentre,scaleFactor)
    }

    rotate(angle,aboutCentre){
        const rotation = getRotateByAngle(angle,aboutCentre)

        this.centre = rotation(this.centre)

        this.rotation += angle
        this.rotateOffsetPointAbout(aboutCentre,angle)
    }

    copy(){

        const copy = new Ellipse()

        copy.setupInScene(
            this.appearanceTime,
            this.disappearanceTime,
            this.ZIndex,
            this.name,
            this.directory,
            Array.from(this.centre),
            this.height,this.width,
            this.outlineColour,
            this.colour,
            this.rotation,
            this.thickness)

        Shape.copyTimelineEvents(this,copy)

        return copy
    }
}