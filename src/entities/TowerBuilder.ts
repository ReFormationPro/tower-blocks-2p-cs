import InputHistory from "../InputHistory";
import { InputKeys } from "../InputReceiver";
import Entity from "./Entity";
import TowerBlock from "./TowerBlock";

interface Point {
    x: number,
    y: number
}

/**
 * TowerBuilder instantiates TowerBlocks, swings them, and when
 * the related input is received, drops them and instantiates a new tower block.
 */
export default class TowerBuilder extends Entity {
    // History state
    private swingPercent = 0;
    private nextTowerBlockGeneration: number = -1;
    private currentTowerBlock: TowerBlock | null = null;
    // Non history state
    private swingCenter: Point;
    // Configuration
    // How many updates after should a new tower block be generated after drop?
    private static TB_GEN_DELAY = 10;
    private static SWING_AMOUNT_PER_LOOP = 5;
    private static SWING_LENGTH = 100;

    constructor(swingCenter: Point) {
        super();
        this.swingCenter = swingCenter;
    }

    protected _updateLoop(gameTick: number) {
        const inputs = InputHistory.getInstance().getInputs(gameTick);
        // Handle swinging
        this.swingPercent = (this.swingPercent + TowerBuilder.SWING_AMOUNT_PER_LOOP) % 100;
        this.currentTowerBlock?.setSwingPercent(this.swingPercent);
        // Handle drop
        if (this.currentTowerBlock && inputs[InputKeys.CURR_PLAYER_DROP]) {
            // Drop the tower block
            this.currentTowerBlock.drop(this.swingPercent);
            this.nextTowerBlockGeneration = gameTick + TowerBuilder.TB_GEN_DELAY;
        }
        // Handle tower block generation
        if (gameTick == this.nextTowerBlockGeneration) {
            this.currentTowerBlock = new TowerBlock(this.swingCenter, TowerBuilder.SWING_LENGTH, this.swingPercent);
        }
    }
    updateRender() { }
    protected _createState() {
        return {
            swingPercent: this.swingPercent,
            nextTowerBlockGeneration: this.nextTowerBlockGeneration,
            currentTowerBlockId: this.currentTowerBlock?.getId()
        };
    }
    protected _loadState(state: any) {
        this.swingPercent = state.swingPercent;
        this.nextTowerBlockGeneration = state.nextTowerBlockGeneration;
        // TODO load the current tower block with id state.currentTowerBlockId
    }
}