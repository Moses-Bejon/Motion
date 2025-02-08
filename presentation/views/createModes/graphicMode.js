import {animationEndTimeSeconds} from "../../../constants.js";
import {controller} from "../../../controller.js";
import {graphic} from "../../../model/graphic.js";

export class graphicMode{

    constructor(inputFile) {

        // a graphic is always a persistent shape. (persistent/temporary slider has no effect)
        // using a different graphic for every frame of your animation would grind things to a halt
        // as such, they are not intended to be temporary shapes
        const graphicShape = new graphic(0,animationEndTimeSeconds,[0,0],0)

        const fileLoadPromise = graphicShape.loadImageSource(inputFile)

        fileLoadPromise.then(() => {

            controller.newAction(() => {
                    controller.newShape(graphicShape)
                },
                () => {
                    controller.removeShape(graphicShape)
                },
                []
            )

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