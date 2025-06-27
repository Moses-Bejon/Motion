import {animationEndTimeSeconds} from "../../../globalValues.js";
import {controller} from "../../../controller.js";

export class GraphicMode {

    constructor(inputFile) {
        controller.beginAction()
        controller.takeStep("createGraphic",[0,animationEndTimeSeconds,inputFile,[0,0],0])
        controller.endAction()
    }

    static acceptKeyDownOnShape(keyboardEvent,shape){
        return false
    }

    acceptKeyDown(keyboardEvent){
        return false
    }

    switchMode(){

        // deselects shape once done
        controller.getSelectedShapesManager().selectNewShapes(new Set())
    }
}