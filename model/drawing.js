import {shape} from "./shape.js";
import {maximumOfArray,isLess} from "../maths.js";

export class drawing extends shape{
    constructor(appearanceTime,disappearanceTime,colour,thickness,points) {

        super(appearanceTime,disappearanceTime)

        this.colour = colour
        this.thickness = thickness
        this.points = points

        this.updateGeometry()
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

    getNewGeometryGroup(){
        const newGeometry = document.createElementNS("http://www.w3.org/2000/svg","g")

        for (let i = 0;i<this.points.length-1;i++){
            newGeometry.appendChild(drawing.circleAt(...this.points[i],this.thickness/2,this.colour))
            newGeometry.appendChild(drawing.lineBetween(...this.points[i],...this.points[i+1],this.thickness,this.colour))
        }

        newGeometry.appendChild(drawing.circleAt(...this.points[this.points.length-1],this.thickness/2,this.colour))

        return newGeometry
    }

    updateGeometry(){
        this.geometry = this.getNewGeometryGroup().innerHTML

        this.top = maximumOfArray(this.points,(point)=>{return point[1]},isLess) - this.thickness/2
        this.left = maximumOfArray(this.points,(point) => {return point[0]},isLess) - this.thickness/2
        this.bottom = maximumOfArray(this.points,(point)=>{return point[1]}) + this.thickness/2
        this.right = maximumOfArray(this.points,(point) => {return point[0]}) + this.thickness/2
    }
}