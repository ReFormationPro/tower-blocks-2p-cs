import Entity from "./Entity";
import { Point } from "../utils";

export default class TowerBlock extends Entity {
    // History states
    private swingPercent: number = 0;
    private isDropped = false;
    private isLanded = false;
    private position: Point;
    // Non history states
    private swingCenter: { x: number; y: number; };
    private swingLength: number;
    // Configuration
    private static FALL_SPEED = 10;
    private static SWING_MAGNITUDE_RAD = 45;

    constructor(swingCenter: { x: number, y: number }, swingLength: number, swingPercent: number) {
        super();
        this.swingCenter = swingCenter;
        this.swingLength = swingLength;
        this.swingPercent = swingPercent;
        this.position = this.getSwingPosition();
    }

    getSwingPosition() {
        const angle = this.getAngle();
        const x = this.swingCenter.x + this.swingLength * Math.cos(angle);
        const y = this.swingCenter.y + this.swingLength * Math.sin(angle);
        return { x, y };
    }

    getAngle() {
        const startAngle = -Math.PI / 2;
        return startAngle + TowerBlock.SWING_MAGNITUDE_RAD * Math.sin(this.swingPercent / 100 * 2 * Math.PI);
    }

    drop(swingPercent: number) {
        this.swingPercent = swingPercent;
        this.position = this.getSwingPosition();
        this.isDropped = true;
    }

    setSwingPercent(swingPercent: number) {
        this.swingPercent = swingPercent;
    }

    protected _updateLoop(gameTick: number) {
        if (this.isLanded) return;
        if (this.isDropped) {
            // Update position
            const angle = this.getAngle();
            this.position.x += TowerBlock.FALL_SPEED * Math.cos(angle);
            this.position.y += TowerBlock.FALL_SPEED * Math.sin(angle);
            // TODO Check for collision and update isLanded
            // TODO If landed, update position and rotation
        }
    }

    updateRender() { }
    protected _createState() {
        return {
            swingPercent: this.swingPercent,
            isDropped: this.isDropped,
            isLanded: this.isLanded,
            position: this.position
        };
    }
    
    protected _loadState(state: any) {
        this.swingPercent = state.swingPercent;
        this.isDropped = state.isDropped;
        this.isLanded = state.isLanded;
        this.position = state.position;
    }
}