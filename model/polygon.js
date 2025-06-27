import {Drawing} from "./drawing.js"

export class Polygon extends Drawing{
    constructor(appearanceTime,disappearanceTime,ZIndex,name,directory,colour,fillColour,thickness,points){
        super(appearanceTime,disappearanceTime,ZIndex,name,directory,colour,thickness,points)

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

    save(){
        const shapeSave = super.save()

        shapeSave.fillColour = this.fillColour

        shapeSave.shapeType = "polygon"

        return shapeSave
    }

    load(save){
        super.load(save)

        this.fillColour = save.fillColour

        this.updateGeometry()
    }

    updateGeometry() {
        super.updateGeometry()

        // the polygon is like a drawing but with a background colour and connection between first and last point
        const extraGeometry = document.createElementNS("http://www.w3.org/2000/svg","g")

        extraGeometry.appendChild(
            Drawing.lineBetween(...this.points[this.points.length-1],...this.points[0],this.thickness,this.colour)
        )

        this.geometry += extraGeometry.innerHTML

        extraGeometry.replaceChildren()

        extraGeometry.appendChild(Polygon.fillArea(this.points,this.fillColour))
        this.geometry = extraGeometry.innerHTML + this.geometry
    }

    copy(){
        return new Polygon(
            this.appearanceTime,
            this.disappearanceTime,
            this.colour,
            this.fillColour,
            this.thickness,
            structuredClone(this.points)
        )
    }
}