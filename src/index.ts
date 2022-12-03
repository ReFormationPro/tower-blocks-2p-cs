import * as PIXI from "pixi.js";
import * as onl from "./goonline";

class Main extends PIXI.Application {
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

        this.ticker.add((delta) => {
            // console.log(delta);
        });
    }
}

(window as any).onl = onl;
const main: Main = new Main();
