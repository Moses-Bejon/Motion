import {Shape} from "./shape.js";
import {isLess, increment2dVectorBy, scale2dVectorAboutPoint, getRotateByAngle} from "../maths.js";
import {maximumOfArray} from "../dataStructureOperations.js";

export class Drawing extends Shape{
    constructor(appearanceTime,disappearanceTime,ZIndex,name,directory,colour,thickness,points) {

        super(appearanceTime,disappearanceTime,ZIndex,name,directory)

        this.colour = colour
        this.thickness = thickness
        this.points = points

        this.updateGeometry()

        super.setupOffset()
    }

    static lineBetween(x1,y1,x2,y2,thickness,colour){
        const line = document.createElementNS("http://www.w3.org/2000/svg","line")
        line.setAttribute("x1",x1)
        line.setAttribute("y1",y1)
        line.setAttribute("x2",x2)
        line.setAttribute("y2",y2)
        line.style.stroke = colour
        line.style.strokeWidth = thickness

        return line
    }

    static circleAt(x,y,r,fill,outlineThickness=0,outlineColour="transparent"){
        const circle = document.createElementNS("http://www.w3.org/2000/svg","circle")
        circle.setAttribute("cx",x)
        circle.setAttribute("cy",y)
        circle.setAttribute("r",r)
        circle.style.fill = fill
        circle.style.stroke = outlineColour
        circle.style.strokeWidth = outlineThickness

        return circle
    }

    save(fileSerializer){
        const shapeSave = super.save(fileSerializer)

        shapeSave.colour = this.colour
        shapeSave.thickness = this.thickness
        shapeSave.points = this.points
        shapeSave.shapeType = "drawing"

        return shapeSave
    }

    load(save){
        super.load(save)

        this.colour = save.colour
        this.thickness = save.thickness
        this.points = save.points

        this.updateGeometry()
        this.setupOffset()
    }

    getNewGeometryGroup(){
        const newGeometry = document.createElementNS("http://www.w3.org/2000/svg","g")

        for (let i = 0;i<this.points.length-1;i++){
            newGeometry.appendChild(Drawing.circleAt(...this.points[i],this.thickness/2,this.colour))
            newGeometry.appendChild(Drawing.lineBetween(...this.points[i],...this.points[i+1],this.thickness,this.colour))
        }

        newGeometry.appendChild(Drawing.circleAt(...this.points[this.points.length-1],this.thickness/2,this.colour))

        return newGeometry
    }

    updateGeometry(){
        this.geometry = this.getNewGeometryGroup().innerHTML

        this.top = maximumOfArray(this.points,(point)=>{return point[1]},isLess) - this.thickness/2
        this.left = maximumOfArray(this.points,(point) => {return point[0]},isLess) - this.thickness/2
        this.bottom = maximumOfArray(this.points,(point)=>{return point[1]}) + this.thickness/2
        this.right = maximumOfArray(this.points,(point) => {return point[0]}) + this.thickness/2
    }

    translate(translationVector){
        for (const point of this.points){
            increment2dVectorBy(point,translationVector)
        }

        this.updateGeometry()
        this.translateOffsetPointBy(translationVector)
    }

    scale(scaleFactor,aboutCentre){
        for (const point of this.points){
            scale2dVectorAboutPoint(point,aboutCentre,scaleFactor)
        }

        this.thickness = Math.abs(scaleFactor*this.thickness)

        this.updateGeometry()
        this.scaleOffsetPointAbout(aboutCentre,scaleFactor)
    }

    rotate(angle,aboutCentre){
        const rotationFunction = getRotateByAngle(angle,aboutCentre)
        for (let i = 0; i<this.points.length;i++){
            this.points[i] = rotationFunction(this.points[i])
        }

        this.updateGeometry()
        this.rotateOffsetPointAbout(aboutCentre,angle)
    }

    copy(){
        return new Drawing(
            this.appearanceTime,
            this.disappearanceTime,
            this.colour,
            this.thickness,
            structuredClone(this.points)
        )
    }
}