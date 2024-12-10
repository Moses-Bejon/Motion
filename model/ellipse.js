import {shape} from "./shape.js";

export class ellipse extends shape{
    constructor(geometry,appearanceTime,disappearanceTime,centre,height,width,outlineColour,colour,rotation,thickness){
        super(geometry,appearanceTime,disappearanceTime)

        this.centre = centre
        this.height = height
        this.width = width
        this.outlineColour = outlineColour
        this.colour = colour
        this.rotation = rotation
        this.thickness = thickness
    }

    getTop(){
        return this.centre[1]-this.height/2
    }

    getBottom(){
        return this.centre[1]+this.height/2
    }

    getLeft(){
        return this.centre[0]-this.width/2
    }

    getRight(){
        return this.centre[1]+this.width/2
    }
}