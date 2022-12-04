import * as PIXI from "pixi.js";
import Entity from "./Entity";
import GoOnline from "./goonline";
import History from "./History";
import InputHistory from "./InputHistory";

class Main extends PIXI.Application {
    private tickCount = 0;
    private nextGameTick = 1;
    private entities: Entity[] = [];
    private static GAME_LOOP_PERIOD = 100;
    private shouldUpdateGame = true;

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

        /**
         * The loop of game updates
         * This is where the synchronized state of the game is updated
         */
        window.setInterval(() => {
            // TODO Maybe synchronize this interval between players with timestamps?
            if (this.shouldUpdateGame) {
                // Push input here as input should be updated with some period and the tick
                // must be processed once. Furthermore, the player sees the current state as render loop
                // tries to get here as fast as possible. 
                const currentInputs = {};   // TODO
                InputHistory.getInstance().updateInputs(this.nextGameTick, currentInputs);
                this.updateLoop(this.nextGameTick++);
            }
        }, Main.GAME_LOOP_PERIOD);
    }

    /**
     * Rewinds back to last known good state and reprogresses until
     * current time
     * @param rewindToStateBefore Tick value to load a state before
     */
    rewindAndCatchUp(rewindToStateBefore: number) {
        const oldNextGameTick = this.nextGameTick;
        this.shouldUpdateGame = false;
        const state = History.getInstance().getStateBefore(rewindToStateBefore);
        this.loadState(state.gameTick);
        // TODO Optimize this
        // TODO Make sure this loaded state is a common aggrement point (like if packets are reordered, this breaks)
        History.getInstance().eraseStatesAfter(state.gameTick);
        History.getInstance().eraseStatesBefore(state.gameTick);
        // Catch up to current game tick quickly
        // BUG The time lost here might desync players, synchronize with timestamps
        for (; this.nextGameTick < oldNextGameTick; this.nextGameTick++) {
            this.updateLoop(this.nextGameTick);
        }
        this.shouldUpdateGame = true;
    }

    loadState(gameTick: number) {
        this.entities.forEach((e) => {
            e.loadState(gameTick);
        });
        this.nextGameTick = gameTick + 1;
    }

    saveState(gameTick: number) {
        this.entities.forEach((e) => {
            e.saveState(gameTick);
        });
    }

    /**
     * This is where the game is updated, states are saved.
     * This loop can rewind and process again.
     * The actual loop count for entities might differ.
     * They should handle synchronizing the state themselves.
     *
     * @param gameTick First tick to receive has to be 1 as 0 is for initialization
     */
    updateLoop(gameTick: number) {
        this.entities.forEach((e) => {
            e.updateLoop(gameTick);
        });
    }

    inputTick() { }
}

(window as any).GoOnline = GoOnline.getInstance();
const main: Main = new Main();
