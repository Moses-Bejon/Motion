export class OnionSkinsManager{
    constructor() {
        // views we need to tell about onion skins
        this.onionSkinSubscribers = new Set()

        this.onionSkinsCurrentlyOn = false

        this.updateOnionSkins()
    }

    updateOnionSkins(){

        if (this.onionSkinsCurrentlyOn){
            this.onionSkinGeometry = ""

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

    onionSkinsOff(){
        this.onionSkinsCurrentlyOn = false

        this.updateOnionSkins()
    }

    onionSkinsOn(){
        this.onionSkinsCurrentlyOn = true

        this.updateOnionSkins()
    }

    subscribeToOnionSkins(subscriber){
        this.onionSkinSubscribers.add(subscriber)

        if (this.onionSkinsCurrentlyOn){
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