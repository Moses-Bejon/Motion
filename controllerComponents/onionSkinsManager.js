import {controller} from "../controller.js";

export class OnionSkinsManager{
    constructor() {
        // views we need to tell about onion skins
        this.onionSkinSubscribers = new Set()
    }

    updateOnionSkins(){
        if (controller.onionSkinsOn()){
            const now = controller.clock()

            controller.currentScene.executeInvisibleSteps([
                ["goToTime",[Math.max(controller.clock()-controller.onionSkinTimeGap(),0)]]
            ])

            this.onionSkinGeometry = ""

            for (const shape of controller.displayShapes()){
                this.onionSkinGeometry += shape.geometry
            }

            controller.currentScene.executeInvisibleSteps([
                ["goToTime",[now]]
            ])

            for (const onionSkinSubscriber of this.onionSkinSubscribers){
                try {
                    onionSkinSubscriber.updateOnionSkin(this.onionSkinGeometry)
                } catch (e){
                    console.error(e)
                }
            }
        } else {
            for (const onionSkinSubscriber of this.onionSkinSubscribers){
                try {
                    onionSkinSubscriber.hideOnionSkin()
                } catch (e) {
                    console.error(e)
                }
            }
        }
    }

    subscribeToOnionSkins(subscriber){
        this.onionSkinSubscribers.add(subscriber)

        if (controller.onionSkinsOn()){
            try {
                subscriber.updateOnionSkin(this.onionSkinGeometry)
            } catch (e){
                console.error(e)
            }
        }
    }

    unsubscribeFromOnionSkins(subscriber){
        this.onionSkinSubscribers.delete(subscriber)
    }
}