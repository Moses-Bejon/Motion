// global constants are defined here

export const fontFamily = "Helvetica,sans-serif"
export const fontSizeInt = 12
export const fontSize = `${fontSizeInt}pt`

export const innerEdgeThicknessInt = 5
export const innerEdgeThickness = innerEdgeThicknessInt + "px"

// the proportion along a window an edge should appear at by default
export const defaultEdgePosition = 0.5

// canvas offset from top left on initial appendChild
export const canvasOffsetX = 250
export const canvasOffsetY = 40
// canvas width and height
export const canvasWidth = 960
export const canvasHeight = 540

// how quickly the canvas moves when "wasd" pressed
export const sensitivity = 0.75

// the minimum/maximum outline thickness for the slider on the canvas
export const minimumThickness = 0
export const maximumThickness = 100

// the number of seconds the animation lasts
export const animationEndTimeSeconds = 10

// how close points have to be to be considered "connected"
export const snappingDistance = Math.hypot(canvasWidth,canvasHeight)/100

// how large UI overlays (like rotate icons) on the canvas typically are
export const canvasOverlayUISize = 50