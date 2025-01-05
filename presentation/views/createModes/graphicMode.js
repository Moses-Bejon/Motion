import {animationEndTimeSeconds} from "../../../constants.js";
import {controller} from "../../../controller.js";
import {graphic} from "../../../model/graphic.js";

export class graphicMode{

    constructor(inputFile) {
        const graphicShape = new graphic(0,animationEndTimeSeconds,[0,0],0)

        const fileLoadPromise = graphicShape.loadImageSource(inputFile)

        fileLoadPromise.then(() => {
                controller.newShape(graphicShape)

                // select the graphic by default at creation (to allow the user to move it)
                controller.newAggregateModel("selectedShapes", new Set([graphicShape]))
            }
        ).catch((error) => {
            alert(error)
        })
    }

    static acceptKeyDownOnShape(keyboardEvent,shape){
        return false
    }

    acceptKeyDown(keyboardEvent){
        return false
    }

    switchMode(){

        // deselects shape once done
        controller.newAggregateModel("selectedShapes", new Set([]))
    }
}