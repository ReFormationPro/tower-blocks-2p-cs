import * as PIXI from "pixi.js";
import Entity from "./Entity";
import GoOnline from "./goonline";

class Main extends PIXI.Application {
    private tickCount = 0;
    private entities: Entity[] = [];

    public constructor() {
        // PIXI.utils.skipHello();
        PIXI.settings.SCALE_MODE = PIXI.SCALE_MODES.NEAREST;

        let view = document.querySelector(
            "#canvas-container canvas"
        ) as HTMLCanvasElement;

        super({
            view: view,
            backgroundColor: 0x222222,
            width: window.innerWidth,
            height: window.innerHeight,
            antialias: false
            // resolution: window.devicePixelRatio || 1
        });

        /**
         * Ticker for render
         * This updates what we see but not what the game state is
         * This is where interpolation is used to "catch" the game state,
         * which is the actual state.
         */
        this.ticker.add((delta) => {
            this.inputTick();

            this.tickCount++;
        });
    }

    /**
     * This is where the game is updated, states are saved.
     * This loop can rewind and process again.
     * The actual loop count for entities might differ.
     * They should handle synchronizing the state themselves.
     */
    updateLoop(delta: number, inputs: any) {
        this.entities.forEach((e) => {
            e.updateLoop(delta, inputs);
        });
    }

    inputTick() {}
}

(window as any).GoOnline = GoOnline.getInstance();
const main: Main = new Main();
