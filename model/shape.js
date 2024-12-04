import {controller} from "../controller.js";

export class shape{
    constructor(geometry,appearanceTime,disappearanceTime,zIndex) {
        this.geometry = geometry
        this.appearanceTime = appearanceTime
        this.disappearanceTime = disappearanceTime
        this.zIndex = zIndex
    }

    getPosition(){
        return [(this.getLeft()+this.getRight())/2,(this.getTop()+this.getBottom())/2]
    }
}