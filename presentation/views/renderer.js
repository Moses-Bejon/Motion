import {controller} from "../../controller.js";
import {canvas} from "./canvas.js";
import {animationEndTimeSeconds, canvasHeight, canvasWidth, typicalIconSizeInt} from "../../constants.js";
import {fontsCSS} from "../../fontsCSS.js";
import {ArrayBufferTarget,Muxer} from "../../mp4-muxer.mjs";

const serializer = new XMLSerializer()
const DOMURL = self.URL || self.webkitURL || self
const frame = new Image()

const template = document.createElement("template")
template.innerHTML = `
    <style>
         #buttonsContainer{
            position: relative;
            left: ${typicalIconSizeInt * 2}px;
            height: ${typicalIconSizeInt}px;
            display: flex;
            align-items: center;
        }
        #renderAnimationButton,#renderFrameButton{
            cursor: pointer;
        }
    </style>
    <div id="buttonsContainer">
        <button id="renderAnimationButton">Render animation</button>
        <button id="renderFrameButton">Render current frame</button>
        <label for="fps">FPS: </label>
        <input type="number" name="fps" id="fpsInput" min="1" max="120" value="30">
    </div>
`

export class renderer extends canvas{
    constructor() {
        super()

        this.shadowRoot.appendChild(template.content.cloneNode(true))

        this.fps = this.shadowRoot.getElementById("fpsInput")

        this.shadowRoot.getElementById("renderAnimationButton").onpointerdown = this.renderAnimation.bind(this)
        this.shadowRoot.getElementById("renderFrameButton").onpointerdown = () => {
            controller.downloadFile(this.getSVGURL(),"animation frame")
        }
    }

    connectedCallback() {
        super.connectedCallback()

        // ensures the background is white when we render the animation
        const background = document.createElementNS("http://www.w3.org/2000/svg","rect")
        background.setAttribute("x",0)
        background.setAttribute("y",0)
        background.setAttribute("width",canvasWidth)
        background.setAttribute("height",canvasHeight)
        background.setAttribute("stroke", "white")
        background.setAttribute("fill", "white")
        this.canvas.prepend(background)

        // this could be optimised in the future by only loading fonts that are actually used
        // (rather than all of them every time)
        const fonts = document.createElementNS("http://www.w3.org/2000/svg","defs")
        fonts.innerHTML = fontsCSS
        this.canvas.prepend(fonts)
    }

    disconnectedCallback(){

        // clean stuff up when we get disconnected from the DOM
        this.loseFocus()

        // cancels the current renderAnimation (since it's an async function)
        this.renderCancelled = true

        super.disconnectedCallback()
    }

    async renderAnimation(){
        const fps = parseFloat(this.fps.value)

        if (isNaN(fps) || fps < 1 || fps > 120){
            alert("Please enter a valid fps between 1 and 120")
            return
        }

        this.renderCancelled = false
        const now = controller.clock()

        let muxer = new Muxer({
            target: new ArrayBufferTarget(),
            video: {
                codec: 'avc',
                width: canvasWidth,
                height: canvasHeight
            },
            fastStart: 'in-memory'
        })

        this.videoEncoder = new VideoEncoder({
            output: (chunk, meta) => muxer.addVideoChunk(chunk, meta),
            error: error => console.error(error)
        })
        this.videoEncoder.configure({
            codec: 'avc1.42001f',
            width: canvasWidth,
            height: canvasHeight,
            bitrate: 1e6
        })

        const timePerFrame = 1/fps
        const timePerTimestamp = Math.round(1000000/fps)

        const numberOfFrames = Math.trunc(animationEndTimeSeconds*fps)

        for (let i = 0; i<numberOfFrames;i++){
            if (this.renderCancelled){
                break
            }

            controller.newClockTime(i*timePerFrame)

            await this.captureFrame(timePerTimestamp*i,timePerTimestamp)
        }

        if (!this.renderCancelled) {

            await this.videoEncoder.flush()
            muxer.finalize()

            let {buffer} = muxer.target // Buffer contains final MP4 file

            const videoUrl = URL.createObjectURL(new Blob([buffer], {type: 'video/mp4'}))

            controller.downloadFile(videoUrl,"animation render")
        }

        controller.newClockTime(now)
    }

    async captureFrame(timeStamp,duration){

        // fun fact, it's actually faster to recreate the canvas each time from scratch than it is to clone the node
        const canvas = document.createElement("canvas")
        canvas.width = canvasWidth
        canvas.height = canvasHeight
        const ctx = canvas.getContext("2d")

        frame.src = this.getSVGURL()

        return new Promise((resolve) => {
            frame.onload = () => {
                ctx.drawImage(frame,0,0)

                const videoFrame = new VideoFrame(canvas, { timestamp: timeStamp, duration: duration, alpha: "keep"})
                this.videoEncoder.encode(videoFrame)
                videoFrame.close()

                resolve()
            }
        })
    }

    getSVGURL(){
        const svgString = serializer.serializeToString(this.canvas)
        console.log(svgString)

        const svgBinary = new Blob([svgString],{type:"image/svg+xml;charset=utf-8"})

        return DOMURL.createObjectURL(svgBinary)
    }

    // here for polymorphic reasons
    loseFocus(){
    }
}

window.customElements.define("renderer-window",renderer)