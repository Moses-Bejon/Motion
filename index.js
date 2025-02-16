// main javascript file for the project

import {controller} from "./controller.js";
import {abstractWindow} from "./presentation/window.js";

document.getElementById("undoButton").onpointerdown = controller.undoAction.bind(controller)
document.getElementById("redoButton").onpointerdown = controller.redoAction.bind(controller)

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

                // collapse root window into single window
                while (true){
                        if (rootWindow.constructor.name === "horizontallySplitWindow"){
                                rootWindow.collapseLeftWindow()
                        } else if (rootWindow.constructor.name === "verticallySplitWindow"){
                                rootWindow.collapseTopWindow()
                        } else {
                                break
                        }
                }

                rootWindow.switchWindowTo(abstractWindow.loadWindow(savedRootWindow))

                rootWindow.load(savedRootWindow)
            }
        )/*.catch((error) => {
                alert("There was an error loading the file",error)
        })*/
}

document.getElementById("saveButton").onpointerdown = () => {
        controller.saveFile(rootWindow.save())
}

const topEdge = document.getElementById("topEdge")
const leftEdge = document.getElementById("leftEdge")
const bottomEdge = document.getElementById("bottomEdge")
const rightEdge = document.getElementById("rightEdge")
let rootWindow = document.getElementById("rootWindow")

makeWindowFullScreen(rootWindow)

const defaultCanvas = document.createElement("create-edit-canvas")
const defaultTimeline = document.createElement("time-line")
const defaultWindow = document.createElement("vertically-split-window")

rootWindow.switchWindowTo(defaultWindow)
defaultWindow.topWindow.switchWindowTo(defaultCanvas)
defaultWindow.bottomWindow.switchWindowTo(defaultTimeline)

function setNewRootWindow(newRootWindow){
        rootWindow.removeAttribute("id")
        newRootWindow.id = "rootWindow"
        newRootWindow.removeAttribute("style")

        newRootWindow.updateParentFunction = setNewRootWindow
        newRootWindow.setFullScreen(makeWindowFullScreen)

        rootWindow = newRootWindow

        document.body.appendChild(newRootWindow)
}

function makeWindowFullScreen(newRootWindow){
        rootWindow.remove()
        setNewRootWindow(newRootWindow)

        const firstTopSubEdge = topEdge.activate(leftEdge,rightEdge,rootWindow,"top",(subEdge) => {

                const windowToReplace = subEdge.associatedWindow
                const replaceWindowWith = document.createElement("vertically-split-window")

                windowToReplace.switchWindowTo(replaceWindowWith)
                replaceWindowWith.bottomWindow.switchWindowTo(windowToReplace)

                return replaceWindowWith
        })
        const firstLeftSubEdge = leftEdge.activate(topEdge,bottomEdge,rootWindow,"left",(subEdge) => {

                const windowToReplace = subEdge.associatedWindow
                const replaceWindowWith = document.createElement("horizontally-split-window")

                windowToReplace.switchWindowTo(replaceWindowWith)
                replaceWindowWith.rightWindow.switchWindowTo(windowToReplace)

                return replaceWindowWith
        })
        const firstBottomSubEdge = bottomEdge.activate(leftEdge,rightEdge,rootWindow,"bottom",(subEdge) => {

                const windowToReplace = subEdge.associatedWindow
                const replaceWindowWith = document.createElement("vertically-split-window")

                windowToReplace.switchWindowTo(replaceWindowWith)
                replaceWindowWith.topWindow.switchWindowTo(windowToReplace)

                return replaceWindowWith
        })
        const firstRightSubEdge = rightEdge.activate(topEdge,bottomEdge,rootWindow,"right",(subEdge) =>{

                const windowToReplace = subEdge.associatedWindow
                const replaceWindowWith = document.createElement("horizontally-split-window")

                windowToReplace.switchWindowTo(replaceWindowWith)
                replaceWindowWith.leftWindow.switchWindowTo(windowToReplace)

                return replaceWindowWith
        })

        rootWindow.addVerticalSubEdge(firstRightSubEdge)
        rootWindow.addVerticalSubEdge(firstLeftSubEdge)
        rootWindow.addHorizontalSubEdge(firstTopSubEdge)
        rootWindow.addHorizontalSubEdge(firstBottomSubEdge)
}