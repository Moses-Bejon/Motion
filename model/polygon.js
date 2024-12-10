import {drawing} from "./drawing.js"

export class polygon extends drawing{
    constructor(geometry,appearanceTime,disappearanceTime,colour,fillColour,thickness,points){
        super(geometry,appearanceTime,disappearanceTime,colour,thickness,points)

        this.fillColour = fillColour
    }
}