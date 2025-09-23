import {currentFileVersion} from "../constants.js";
import {translateFromZero} from "./backwardCompatibility/translateFromZero.js";

const translationArray = [
    translateFromZero
]

export async function translateToMostRecent(file){
    while (file.fileVersion < currentFileVersion){
        file = await translationArray[file.fileVersion](file)
    }
    return file
}