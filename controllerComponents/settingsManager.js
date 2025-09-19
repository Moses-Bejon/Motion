import {controller} from "../controller.js";
import {replaceRootWindowWithSave} from "../rootWindowOperations.js";

export class SettingsManager {
    constructor() {
        this.canvasWidth = 960
        this.canvasHeight = 540
        this.animationEndTimeSeconds = 10
        this.defaultTweenLength = 0.2

        // this is coupled to model.js where half of it is the default start time
        this.timelineSnapLength = 0.2

        this.lineSimplificationEpsilon = 1
        this.onionSkinTimeGap = 0.2
        this.onionSkinsOn = false
        this.autoAddToTimeline = false
    }

    updateSettings(){
        const viewsSave = window.rootWindow.save()
        replaceRootWindowWithSave(viewsSave)
    }

    getCanvasWidth() {
        return this.canvasWidth
    }

    setCanvasWidth(newWidth) {
        this.canvasWidth = newWidth
        this.updateSettings()
    }

    getCanvasHeight() {
        return this.canvasHeight
    }

    setCanvasHeight(newHeight) {
        this.canvasHeight = newHeight
        this.updateSettings()
    }

    getSnappingDistance(){
        return Math.hypot(this.canvasHeight,this.canvasWidth)/100
    }

    getAnimationEndTimeSeconds() {
        return this.animationEndTimeSeconds
    }

    setAnimationEndTimeSeconds(newTime) {

        if (controller.clock() > newTime){
            controller.beginAction()
            controller.takeStep("goToTime",[newTime])
            controller.endAction()
        }

        this.animationEndTimeSeconds = newTime
        this.updateSettings()
    }

    getDefaultTweenLength() {
        return this.defaultTweenLength
    }

    setDefaultTweenLength(newTweenLength) {
        this.defaultTweenLength = newTweenLength
        this.updateSettings()
    }

    getTimelineSnapLength() {
        return this.timelineSnapLength
    }

    setTimelineSnapLength(newSnapLength) {
        this.timelineSnapLength = newSnapLength
        this.updateSettings()
    }

    getLineSimplificationEpsilon() {
        return this.lineSimplificationEpsilon
    }

    setLineSimplificationEpsilon(newLineSimplificationEpsilon) {
        this.lineSimplificationEpsilon = newLineSimplificationEpsilon
        this.updateSettings()
    }

    getOnionSkinTimeGap() {
        return this.onionSkinTimeGap
    }

    setOnionSkinTimeGap(newOnionSkinTimeGap) {
        this.onionSkinTimeGap = newOnionSkinTimeGap
        this.updateSettings()
    }

    getOnionSkinsOn() {
        return this.onionSkinsOn
    }

    setOnionSkinsOn(newOnionSkinsOn) {
        this.onionSkinsOn = newOnionSkinsOn
        this.updateSettings()
    }

    getAutoAddToTimeline() {
        return this.autoAddToTimeline
    }

    setAutoAddToTimeline(newAutoAddToTimeline) {
        this.autoAddToTimeline = newAutoAddToTimeline
        this.updateSettings()
    }
}