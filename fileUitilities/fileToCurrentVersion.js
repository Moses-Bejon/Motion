import {currentFileVersion} from "../constants.js";
import {translateFromZero} from "./backwardCompatibility/translateFromZero.js";

const translationArray = [
    translateFromZero
]

export async function translateToMostRecent(file){
    while (file.fileVersion < currentFileVersion){
        console.log(structuredClone(file))
        file = await translationArray[file.fileVersion](file)
        console.log(structuredClone(file))
    }
    return file
}