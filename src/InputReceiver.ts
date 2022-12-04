export default class InputReceiver {
    private static instance: InputReceiver | null = null;
    private keyIsDown: {[key: string]: boolean} = {};

    private constructor() { }
    
    static getInstance() {
        if (!InputReceiver.instance) {
            InputReceiver.instance = new InputReceiver();
        }
        return InputReceiver.instance;
    }

    initialize() {
        window.addEventListener("keydown", (ev: KeyboardEvent) => {
            this.keyIsDown[ev.key.toLowerCase()] = true;
        });
        window.addEventListener("keyup", (ev: KeyboardEvent) => {
            this.keyIsDown[ev.key.toLowerCase()] = false;
        });
        // TODO Do not use this, use canvas or PIXI containers instead
        window.addEventListener('mousedown', (ev: MouseEvent) => {
            this.keyIsDown["mouse1"] = true;
        });
        window.addEventListener('mouseup', (ev: MouseEvent) => {
            this.keyIsDown["mouse1"] = false;
        });

    }

    isKeyDown(key: string): boolean {
        return !!this.keyIsDown[key.toLowerCase()];
    }
    
    getCurrentInputs() {
        const currentInputs: {[key: string]: boolean} = {};
        currentInputs[InputKeys.CURR_PLAYER_DROP] = this.isKeyDown("space") || this.isKeyDown("mouse1");
        return currentInputs;
    }
}

export enum InputKeys {
    CURR_PLAYER_DROP = "CURR_PLAYER_DROP"
}