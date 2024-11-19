// The base window class that all types of window are inherited from
export class abstractWindow extends HTMLElement{
    constructor() {
        super()

        // used to declare the sets of vertical and horizontal subEdges
        this.resetSubEdges()

        // these values will only be used if we don't have a parent (when we are the root).
        // they are changed in the receiveParent function

        // parents have different things they want done when a child window changes
        this.updateParentFunction = () => {}

        // as the root, this is our position, otherwise these functions are recursive eventually reaching the root
        this.getGlobalLeftPosition = () => {return 0}
        this.getGlobalRightPosition = () => {return 1}
        this.getGlobalTopPosition = () => {return 0}
        this.getGlobalBottomPosition = () => {return 1}
    }

    setFullScreen(newFullScreen){
        this.fullScreen = newFullScreen
    }

    connectedCallback(){
        // this ensures no content is displayed outside the window
        this.style.overflow = "hidden"
    }

    receiveParent(parent,updateParentFunction){

        // parents may modify these functions further, depending on how the window is positioned within them
        this.getGlobalLeftPosition = () => {return parent.getGlobalLeftPosition()}
        this.getGlobalRightPosition = () => {return parent.getGlobalRightPosition()}
        this.getGlobalTopPosition = () => {return parent.getGlobalTopPosition()}
        this.getGlobalBottomPosition = () => {return parent.getGlobalBottomPosition()}

        this.updateParentFunction = updateParentFunction
    }

    resetSubEdges(){

        // subEdges on a vertical border (left or right) that connect to us
        this.verticalSubEdges = new Set()

        // on the top/bottom border
        this.horizontalSubEdges = new Set()
    }

    replaceSubEdges(newVerticalSubEdges,newHorizontalSubEdges){

        // clears the previous subEdges
        this.resetSubEdges()

        for (const subEdge of (newVerticalSubEdges)){
            this.addVerticalSubEdge(subEdge)
        }

        for (const subEdge of (newHorizontalSubEdges)){
            this.addHorizontalSubEdge(subEdge)
        }
    }

    getAllSubEdgesOfLabel(label){
        for (const subEdge of this.verticalSubEdges){
            if (subEdge.label === label){
                // a typical window can have a maximum of one subEdge on a given side (or of a given label).
                // A special type of window will override this behaviour
                return [subEdge]
            }
        }

        for (const subEdge of this.horizontalSubEdges){
            if (subEdge.label === label){
                return [subEdge]
            }
        }

        return []
    }

    // Puts the new window into the position of this window
    switchWindowTo(newWindow) {

        // I alert my parent that the window has been replaced, it handles appending to document and such
        this.updateParentFunction(newWindow)

        // give the new window my subEdges
        newWindow.replaceSubEdges(this.verticalSubEdges,this.horizontalSubEdges)

        // remove myself from the document
        this.remove()
    }

    addHorizontalSubEdge(subEdge){
        this.horizontalSubEdges.add(subEdge)

        // gives the subEdge a pointer to us for when it gets clicked and such
        subEdge.associatedWindow = this
    }

    addVerticalSubEdge(subEdge){
        this.verticalSubEdges.add(subEdge)

        // gives the subEdge a pointer to us for when it gets clicked and such
        subEdge.associatedWindow = this
    }

    // these functions project the edges of a window onto a subEdge
    // as this window has no edges within it, these functions simply add them on
    projectLeftSubEdgeOn(subEdge){
        this.addVerticalSubEdge(subEdge)
    }

    projectRightSubEdgeOn(subEdge){
        this.addVerticalSubEdge(subEdge)
    }

    projectTopSubEdgeOn(subEdge){
        this.addHorizontalSubEdge(subEdge)
    }

    projectBottomSubEdgeOn(subEdge){
        this.addHorizontalSubEdge(subEdge)
    }

    // this function exists for polymorphism,
    // so that if a window without an edge is told to update its edge it will not raise an error
    updateEdgePosition(newPosition){
    }
}
