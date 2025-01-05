import {drawing} from "./drawing.js"

export class polygon extends drawing{
    constructor(appearanceTime,disappearanceTime,colour,fillColour,thickness,points){
        super(appearanceTime,disappearanceTime,colour,thickness,points)

        this.fillColour = fillColour

        this.updateGeometry()
    }

    static fillArea(points,fill){
        const polygon = document.createElementNS("http://www.w3.org/2000/svg","polygon")

        polygon.style.fill = fill

        let polygonPoints = ""

        for (const point of points){
            polygonPoints += point[0] + " " + point[1] +" "
        }

        polygon.setAttribute("points",polygonPoints)

        return polygon
    }

    updateGeometry() {
        super.updateGeometry()

        // the polygon is like a drawing but with a background colour and connection between first and last point
        const extraGeometry = document.createElementNS("http://www.w3.org/2000/svg","g")

        extraGeometry.appendChild(
            drawing.lineBetween(...this.points[this.points.length-1],...this.points[0],this.thickness,this.colour)
        )

        this.geometry += extraGeometry.innerHTML

        extraGeometry.replaceChildren()

        extraGeometry.appendChild(polygon.fillArea(this.points,this.fillColour))
        this.geometry = extraGeometry.innerHTML + this.geometry
    }

    copy(){
        return new polygon(
            this.appearanceTime,
            this.disappearanceTime,
            this.colour,
            this.fillColour,
            this.thickness,
            structuredClone(this.points)
        )
    }
}