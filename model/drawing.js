import {shape} from "./shape.js";

export class drawing extends shape{
    constructor(position,appearanceTime,disappearanceTime,colour,thickness,zIndex="") {
        super(position,appearanceTime,disappearanceTime,zIndex)

        this.points = []

        this.geometry = document.createElementNS("http://www.w3.org/2000/svg", "path")
        this.geometry.style.fill = "none"
        this.geometry.style.stroke = colour
        this.geometry.style.strokeWidth = thickness
    }

    updatePoints() {
        let d = `M ${this.position[0]} ${this.position[1]}`

        for(const point of this.points){
            d += ` L ${point[0]} ${point[1]}`
        }

        this.geometry.setAttribute("d",d)

        this.updateGeometry()
    }

    addPoints(points){
        this.points = this.points.concat(points)
        this.updatePoints()
    }
}