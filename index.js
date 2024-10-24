const topEdge = document.getElementById("topEdge")
const leftEdge = document.getElementById("leftEdge")
const bottomEdge = document.getElementById("bottomEdge")
const rightEdge = document.getElementById("rightEdge")
let rootWindow = document.getElementById("rootWindow")

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

function setNewRootWindow(newRootWindow){
        rootWindow.removeAttribute("id")
        newRootWindow.id = "rootWindow"
        newRootWindow.removeAttribute("style")

        newRootWindow.updateParentFunction = setNewRootWindow

        rootWindow = newRootWindow

        document.body.appendChild(newRootWindow)
}

setNewRootWindow(rootWindow)

rootWindow.addVerticalSubEdge(firstRightSubEdge)
rootWindow.addVerticalSubEdge(firstLeftSubEdge)
rootWindow.addHorizontalSubEdge(firstTopSubEdge)
rootWindow.addHorizontalSubEdge(firstBottomSubEdge)