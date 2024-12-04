import {shape} from "./shape.js";
import {maximumOfArray,isLess} from "../maths.js";

export class drawing extends shape{
    constructor(geometry,appearanceTime,disappearanceTime,colour,thickness,points,zIndex="") {

        super(geometry,appearanceTime,disappearanceTime,zIndex)

        this.colour = colour
        this.thickness = thickness
        this.points = points
    }

    getTop(){
        return maximumOfArray(this.points,(point)=>{point[1]},isLess)
    }
    getBottom(){
        return maximumOfArray(this.points,(point)=>{point[1]})
    }
    getLeft(){
        return maximumOfArray(this.points,(point) => {point[0]},isLess)
    }
    getRight(){
        return maximumOfArray(this.points,(point) => {point[0]})
    }
}