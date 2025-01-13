import {shape} from "./shape.js";
import {increment2dVectorBy, scale2dVectorAboutPoint} from "../maths.js";

export class graphic extends shape{
    constructor(appearanceTime,disappearanceTime,topLeft,rotation){
        super(appearanceTime,disappearanceTime)

        this.topLeft = topLeft
        this.rotation = rotation
    }

    // as loading up a new image source can take a while, it is separate from the update geometry and constructor logic
    loadImageSource(source){
        const fileReader = new FileReader()
        fileReader.readAsDataURL(source)

        return new Promise((resolve,reject) => {
            fileReader.onload = () => {
                this.source = fileReader.result

                this.image = document.createElementNS("http://www.w3.org/2000/svg","image")
                this.image.setAttribute("href",this.source)

                // using a html image in order to get the width and height of the image
                // it seems to not be trivial to get the width/height of an SVG image before it is appended
                const htmlImage = document.createElement("img")
                htmlImage.src = this.source

                htmlImage.onload = () => {
                    this.width = htmlImage.width
                    this.height = htmlImage.height

                    this.updateGeometry()

                    resolve()
                }

                htmlImage.onerror = () => {
                    reject(
                        new Error("Cannot load HTML image (likely because the format is unsupported or isn't an image)")
                    )
                }
            }

            fileReader.onerror = () => {
                reject(new Error("The file reader could not read your file (likely because the format is unsupported)"))
            }
        })
    }

    updateGeometry(){
        const group = document.createElementNS("http://www.w3.org/2000/svg","g")

        const clonedImage = this.image.cloneNode(false)

        clonedImage.style.width = this.width
        clonedImage.style.height = this.height
        clonedImage.setAttribute("x",this.topLeft[0])
        clonedImage.setAttribute("y",this.topLeft[1])

        group.appendChild(clonedImage)

        this.geometry = group.innerHTML

        this.top = this.topLeft[1]
        this.bottom = this.topLeft[1] + this.height
        this.left = this.topLeft[0]
        this.right = this.topLeft[0] + this.width
    }

    translate(translationVector){
        increment2dVectorBy(this.topLeft,translationVector)

        this.updateGeometry()
    }

    scale(scaleFactor,aboutCentre){
        scale2dVectorAboutPoint(this.topLeft,aboutCentre,scaleFactor)
        this.width *= Math.abs(scaleFactor)
        this.height *= Math.abs(scaleFactor)

        this.updateGeometry()
    }

    copy(){
        const copy = new graphic(this.appearanceTime,this.disappearanceTime,Array.from(this.topLeft),this.rotation)

        // it is too expensive to reload the image's source
        copy.source = this.source
        copy.image = this.image
        copy.width = this.width
        copy.height = this.height

        copy.updateGeometry()

        return copy
    }
}