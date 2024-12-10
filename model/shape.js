import {midPoint2d} from "../maths.js";

export class shape{
    constructor(geometry,appearanceTime,disappearanceTime) {
        this.geometry = geometry
        this.appearanceTime = appearanceTime
        this.disappearanceTime = disappearanceTime
    }

    getPosition(){
        return midPoint2d([this.getLeft(),this.getTop()],[this.getRight(),this.getBottom()])
    }
}