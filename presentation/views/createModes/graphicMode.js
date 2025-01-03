import {animationEndTimeSeconds} from "../../../constants.js";
import {controller} from "../../../controller.js";
import {graphic} from "../../../model/graphic.js";

export class graphicMode{

    constructor(inputFile) {
        const graphicShape = new graphic(0,animationEndTimeSeconds,[0,0],0)

        const fileLoadPromise = graphicShape.loadImageSource(inputFile)

        fileLoadPromise.then(() => {
                controller.newShape(graphicShape)
            }
        )
    }

    static acceptKeyDownOnShape(keyboardEvent,shape){
        return false
    }

    acceptKeyDown(keyboardEvent){
        return false
    }

    // for polymorphic reasons:
    switchMode(){

    }
}