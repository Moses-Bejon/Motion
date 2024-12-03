import {controller} from "../controller.js";

export class shape{
    constructor(position,appearanceTime,disappearanceTime,zIndex) {
        this.position = position
        this.appearanceTime = appearanceTime
        this.disappearanceTime = disappearanceTime
        this.zIndex = zIndex
    }

    // abstract function
    updateGeometry(){
        controller.modelUpdate(this)
    }
}