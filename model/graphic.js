import {Shape} from "./shape.js";
import {
    add2dVectors,
    getEdgesOfBoxAfterRotation,
    getRotateByAngle,
    increment2dVectorBy,
    scale2dVectorAboutPoint
} from "../maths.js";

export class Graphic extends Shape{
    constructor(appearanceTime,disappearanceTime,ZIndex,name,directory,source,topLeft,rotation){
        super(appearanceTime,disappearanceTime,ZIndex,name,directory)

        this.source = source
        this.topLeft = topLeft
        this.rotation = rotation
    }

    save(fileSerializer){
        const shapeSave = super.save(fileSerializer)

        shapeSave.topLeft = this.topLeft
        shapeSave.rotation = this.rotation
        shapeSave.width = this.width
        shapeSave.height = this.height
        shapeSave.source = this.source

        shapeSave.shapeType = "graphic"

        return shapeSave
    }

    async load(save){
        super.load(save)

        this.topLeft = save.topLeft
        this.rotation = save.rotation

        this.source = save.source

        await this.loadImage()

        this.width = save.width
        this.height = save.height

        this.updateGeometry()
    }

    // as loading up a new image source can take a while, it is separate from the update geometry and constructor logic
    loadImageSource(){
        const fileReader = new FileReader()
        fileReader.readAsDataURL(this.source)

        return new Promise((resolve,reject) => {
            fileReader.onload = () => {
                this.source = fileReader.result

                this.loadImage().then(resolve).catch((error) => {reject(error)})
            }

            fileReader.onerror = () => {
                reject(new Error("The file reader could not read your file (likely because the format is unsupported)"))
            }
        })
    }

    loadImage(){
        return new Promise((resolve,reject) => {
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
                super.setupOffset()

                resolve()
            }

            htmlImage.onerror = () => {
                reject(
                    new Error("Cannot load HTML image (likely because the format is unsupported or isn't an image)")
                )
            }
        })
    }

    updateGeometry(){
        [this.top,this.bottom,this.left,this.right] = getEdgesOfBoxAfterRotation(
            [
                this.topLeft,
                add2dVectors(this.topLeft,[this.width,this.height]),
                add2dVectors(this.topLeft,[0,this.height]),
                add2dVectors(this.topLeft,[this.width,0])
            ],
            this.rotation,
            this.topLeft
        )

        const group = document.createElementNS("http://www.w3.org/2000/svg","g")

        const clonedImage = this.image.cloneNode(false)

        clonedImage.style.width = this.width
        clonedImage.style.height = this.height
        clonedImage.setAttribute("preserveAspectRatio","none")
        clonedImage.setAttribute("x",this.topLeft[0])
        clonedImage.setAttribute("y",this.topLeft[1])

        clonedImage.style.transformOrigin = `${this.topLeft[0]}px ${this.topLeft[1]}px`
        clonedImage.style.transform = `rotate(${this.rotation}rad)`

        group.appendChild(clonedImage)

        this.geometry = group.innerHTML
    }

    translate(translationVector){
        increment2dVectorBy(this.topLeft,translationVector)

        this.updateGeometry()
        this.translateOffsetPointBy(translationVector)
    }

    scale(scaleFactor,aboutCentre){
        scale2dVectorAboutPoint(this.topLeft,aboutCentre,scaleFactor)
        this.width *= Math.abs(scaleFactor)
        this.height *= Math.abs(scaleFactor)

        this.updateGeometry()
        this.scaleOffsetPointAbout(aboutCentre,scaleFactor)
    }

    rotate(angle,aboutCentre){
        const rotation = getRotateByAngle(angle,aboutCentre)

        this.topLeft = rotation(this.topLeft)

        this.rotation += angle
        this.updateGeometry()
        this.rotateOffsetPointAbout(aboutCentre,angle)
    }

    copy(){
        const copy = new Graphic(
            this.appearanceTime,
            this.disappearanceTime,
            this.ZIndex,
            this.name,
            this.directory,
            this.source,
            Array.from(this.topLeft),
            this.rotation
        )

        copy.image = this.image
        copy.width = this.width
        copy.height = this.height
        copy.rotation = this.rotation

        Shape.copyTimelineEvents(this,copy)
        copy.updateGeometry()
        copy.setupOffset()

        return copy
    }
}