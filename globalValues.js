// global constants are defined here

export const fontsList = ["Arial","Roboto","Old Standard TT","Zilla Slab","Sofia","Coming Soon","Pangolin",
    "Comic Neue", "Balsamiq Sans", "EB Garamond", "Playwrite NG Modern", "Modern Antiqua","Doto","Tiny5",
    "Jolly Lodger", "Yellowtail"]

// global epsilons
export const canvasEpsilon = 1e-2
export const timeEpsilon = 1e-4

export const fontFamily = "Arial"
export const fontSizeInt = 12
export const fontSize = `${fontSizeInt}pt`

export const innerEdgeThicknessInt = 5
export const innerEdgeThickness = innerEdgeThicknessInt + "px"

// the proportion along a window an edge should appear at by default
export const defaultEdgePosition = 0.5

// canvas offset from top left on initial appendChild
export const canvasOffsetX = 250
export const canvasOffsetY = 40

// how quickly the canvas moves when "wasd" pressed
export const sensitivity = 0.75

// the minimum/maximum outline thickness for the slider on the canvas
export const minimumThickness = 0.1
export const maximumThickness = 100
export const thicknessLevel = 0.1

// how large UI overlays (like rotate icons) on the canvas typically are
export const canvasOverlayUISize = 50

export const typicalIconSizeInt = 30
export const typicalIconSize = `${typicalIconSizeInt}px`

export const fullScreenAndDropdownContainerWidthInt = 2*typicalIconSizeInt
export const fullScreenAndDropdownContainerWidth = fullScreenAndDropdownContainerWidthInt + "px"

export const buttonSelectedColour = "#b0b0b0"

// timeline positioning constants
export const timelineMargin = 5
export const timelineBorderSize = 2
export const timelineBumperSize = 9
export const timelineLeftMenuSize = 0.15
export const timelineRightMenuSize = 1-timelineLeftMenuSize
export const timelineLeftMenuSizePercentage = timelineLeftMenuSize*100
export const timelineRightMenuSizePercentage = timelineRightMenuSize*100
export const bumperTranslation = -timelineBorderSize/2-timelineBumperSize/2
export const eventTokenWidth = "5px"