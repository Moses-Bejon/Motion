// main javascript file for the project

import {controller} from "./controller.js";
import {replaceRootWindowWithSave} from "./rootWindowOperations.js";

document.getElementById("undoButton").onpointerdown = () => controller.historyManager.undoAction()
document.getElementById("redoButton").onpointerdown = () => controller.historyManager.redoAction()

const loadButton = document.getElementById("loadButton")
const fakeLoadButton = document.getElementById("fakeLoadButton")

/* Simulating hover over button effect */
loadButton.onpointerenter = () => {
        fakeLoadButton.style.backgroundColor = "#d5d5d5"
}
loadButton.onpointerleave = () => {
        fakeLoadButton.style.backgroundColor = "#e0e0e0"
}

loadButton.oninput = (input) => {
        controller.loadFile(input.target.files[0]).then((savedRootWindow) => {
                    replaceRootWindowWithSave(savedRootWindow)
            }
        )

        // clears input so the user can input the same file multiple times
        input.target.value = ""
}

document.getElementById("saveButton").onpointerdown = () => {
        controller.saveFile(rootWindow.save())
}

const topEdge = document.getElementById("topEdge")
const leftEdge = document.getElementById("leftEdge")
const bottomEdge = document.getElementById("bottomEdge")
const rightEdge = document.getElementById("rightEdge")
window.rootWindow = document.getElementById("rootWindow")

makeWindowFullScreen(window.rootWindow)

const defaultCanvas = document.createElement("create-edit-canvas")
const defaultShapeEditor = document.createElement("shape-editor")
const defaultTopWindow = document.createElement("horizontally-split-window")
const defaultTimeline = document.createElement("time-line")
const defaultWindow = document.createElement("vertically-split-window")

window.rootWindow.switchWindowTo(defaultWindow)
defaultWindow.topWindow.switchWindowTo(defaultTopWindow)
defaultTopWindow.leftWindow.switchWindowTo(defaultCanvas)
defaultTopWindow.rightWindow.switchWindowTo(defaultShapeEditor)
defaultTopWindow.updateEdgePosition(0.8)
defaultWindow.bottomWindow.switchWindowTo(defaultTimeline)
defaultWindow.updateEdgePosition(0.8)

function setNewRootWindow(newRootWindow){
        window.rootWindow.removeAttribute("id")
        newRootWindow.id = "rootWindow"
        newRootWindow.removeAttribute("style")

        newRootWindow.updateParentFunction = setNewRootWindow
        newRootWindow.setFullScreen(makeWindowFullScreen)

        window.rootWindow = newRootWindow

        document.body.appendChild(newRootWindow)
}

function makeWindowFullScreen(newRootWindow){
        window.rootWindow.remove()
        setNewRootWindow(newRootWindow)

        const firstTopSubEdge = topEdge.activate(leftEdge,rightEdge,window.rootWindow,"top",(subEdge) => {

                const windowToReplace = subEdge.associatedWindow
                const replaceWindowWith = document.createElement("vertically-split-window")

                windowToReplace.switchWindowTo(replaceWindowWith)
                replaceWindowWith.bottomWindow.switchWindowTo(windowToReplace)

                return replaceWindowWith
        })
        const firstLeftSubEdge = leftEdge.activate(topEdge,bottomEdge,window.rootWindow,"left",(subEdge) => {

                const windowToReplace = subEdge.associatedWindow
                const replaceWindowWith = document.createElement("horizontally-split-window")

                windowToReplace.switchWindowTo(replaceWindowWith)
                replaceWindowWith.rightWindow.switchWindowTo(windowToReplace)

                return replaceWindowWith
        })
        const firstBottomSubEdge = bottomEdge.activate(leftEdge,rightEdge,window.rootWindow,"bottom",(subEdge) => {

                const windowToReplace = subEdge.associatedWindow
                const replaceWindowWith = document.createElement("vertically-split-window")

                windowToReplace.switchWindowTo(replaceWindowWith)
                replaceWindowWith.topWindow.switchWindowTo(windowToReplace)

                return replaceWindowWith
        })
        const firstRightSubEdge = rightEdge.activate(topEdge,bottomEdge,window.rootWindow,"right",(subEdge) =>{

                const windowToReplace = subEdge.associatedWindow
                const replaceWindowWith = document.createElement("horizontally-split-window")

                windowToReplace.switchWindowTo(replaceWindowWith)
                replaceWindowWith.leftWindow.switchWindowTo(windowToReplace)

                return replaceWindowWith
        })

        window.rootWindow.addVerticalSubEdge(firstRightSubEdge)
        window.rootWindow.addVerticalSubEdge(firstLeftSubEdge)
        window.rootWindow.addHorizontalSubEdge(firstTopSubEdge)
        window.rootWindow.addHorizontalSubEdge(firstBottomSubEdge)
}