import {Drawing} from "../model/drawing.js";
import {SceneController} from "./sceneController.js";
import {Ellipse} from "../model/ellipse.js";
import {Graphic} from "../model/graphic.js";
import {Polygon} from "../model/polygon.js";
import {Text} from "../model/text.js";
import {Shape} from "../model/shape.js";

export class FileSerializer{
    constructor() {
    }

    readJSONFile(JSONFile){

        const fileReader = new FileReader()

        return new Promise((resolve, reject) => {
            fileReader.onload = () => {
                try {
                    resolve(JSON.parse(fileReader.result))
                } catch (error) {
                    reject(error)
                }
            }
            fileReader.onerror = () => reject(fileReader.error)
            fileReader.readAsText(JSONFile)
        })
    }

    serializeScene(scene){

        const file = {
            "aggregateModels":{"allShapes":[],"clock":scene.clock()},
            "numberOfEachTypeOfShape":scene.numberOfEachTypeOfShape,
            "ZIndexOfHighestShape":scene.ZIndexOfHighestShape,
            "ZIndexOfLowestShape":scene.ZIndexOfLowestShape,
        }

        const allShapes = []

        for (const shape of scene.allShapes()){
            allShapes.push(shape.save(this))
        }

        file.aggregateModels.allShapes = allShapes

        return file
    }

    async loadScene(save){

        const scene = new SceneController()

        scene.executeInvisibleSteps([["goToTime",[save.aggregateModels.clock]]])

        scene.numberOfEachTypeOfShape = save.numberOfEachTypeOfShape
        scene.ZIndexOfHighestShape = save.ZIndexOfHighestShape
        scene.ZIndexOfLowestShape = save.ZIndexOfLowestShape

        for (const shape of save.aggregateModels.allShapes){
            const loadedShape = await this.loadShape(shape)

            scene.executeInvisibleSteps([["restoreShape",[loadedShape]]])
        }

        return scene
    }

    async loadShape(shapeJSON){
        let newShape
        switch (shapeJSON.shapeType){
            case "drawing":
                newShape = Drawing.load(shapeJSON)
                break
            case "ellipse":
                newShape = Ellipse.load(shapeJSON)
                break
            case "graphic":
                newShape = await Graphic.load(shapeJSON)
                break
            case "polygon":
                newShape = Polygon.load(shapeJSON)
                break
            case "text":
                newShape = Text.load(shapeJSON)
                break
            default:
                console.error("unrecognised shape - ",shapeJSON.shapeType)
        }
        return newShape
    }

    serializeSteps(steps){
        const newSteps = []
        for (const step of steps){
            const newStep = [step[0]]

            const newOperands = []

            for (const operand of step[1]){
                if (operand instanceof Shape){
                    newOperands.push({})
                } else{
                    newOperands.push(operand)
                }
            }

            newStep.push(newOperands)
            newSteps.push(newStep)
        }
        return newSteps
    }

    deserializeSteps(steps,shape){
        const newSteps = []
        for (const step of steps){
            const newStep = [step[0]]

            const newOperands = []

            for (const operand of step[1]){
                if (operand.constructor === Object){
                    newOperands.push(shape)
                } else{
                    newOperands.push(operand)
                }
            }

            newStep.push(newOperands)
            newSteps.push(newStep)
        }
        return newSteps
    }
}