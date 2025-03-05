import {shape} from "./shape.js";
import {
    getEdgesOfEllipseAfterRotation,
    getRotateByAngle,
    increment2dVectorBy,
    scale2dVectorAboutPoint
} from "../maths.js";

export class ellipse extends shape{
    constructor(appearanceTime,disappearanceTime,centre,height,width,outlineColour,colour,rotation,thickness){
        super(appearanceTime,disappearanceTime)

        this.centre = centre
        this.height = height
        this.width = width
        this.outlineColour = outlineColour
        this.colour = colour
        this.rotation = rotation
        this.thickness = thickness

        this.updateGeometry()
    }

    save(){
        const shapeSave = super.save()

        shapeSave.centre = this.centre
        shapeSave.height = this.height
        shapeSave.width = this.width
        shapeSave.outlineColour = this.outlineColour
        shapeSave.colour = this.colour
        shapeSave.rotation = this.rotation
        shapeSave.thickness = this.thickness

        shapeSave.shapeType = "ellipse"

        return shapeSave
    }

    load(save){
        super.load(save)

        this.centre = save.centre
        this.height = save.height
        this.width = save.width
        this.outlineColour = save.outlineColour
        this.colour = save.colour
        this.rotation = save.rotation
        this.thickness = save.thickness

        this.updateGeometry()
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

        this.updateGeometry()
        this.translateOffsetPointBy(translationVector)
    }

    scale(scaleFactor,aboutCentre){
        scale2dVectorAboutPoint(this.centre,aboutCentre,scaleFactor)
        this.height *= Math.abs(scaleFactor)
        this.width *= Math.abs(scaleFactor)
        this.thickness *= Math.abs(scaleFactor)

        this.updateGeometry()
        this.scaleOffsetPointAbout(aboutCentre,scaleFactor)
    }

    rotate(angle,aboutCentre){
        const rotation = getRotateByAngle(angle,aboutCentre)

        this.centre = rotation(this.centre)

        this.rotation += angle
        this.updateGeometry()
        this.rotateOffsetPointAbout(aboutCentre,angle)
    }

    copy(){
        return new ellipse(
            this.appearanceTime,
            this.disappearanceTime,
            Array.from(this.centre),
            this.height,this.width,
            this.outlineColour,
            this.colour,
            this.rotation,
            this.thickness)
    }
}