import Entity from "./Entity";

export default class TowerBlock extends Entity {
    private swingPercent: number = 0;
    private swingCenter: { x: number; y: number; };
    private swingLength: number;
    
    constructor(swingCenter: { x: number, y: number }, swingLength: number, swingPercent: number) {
        super();
        this.swingCenter = swingCenter;
        this.swingLength = swingLength;
        this.swingPercent = swingPercent;
    }

    drop(swingPercent: number) {

    }

    setSwingPercent(swingPercent: number) {

    }
}