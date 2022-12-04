import History from "../History";

export default class Entity {
    private static nextEntityId = 0;
    private id: number;
    private lastGameTick = 0;
    constructor() {
        this.id = Entity.nextEntityId++;
    }
    getId() {
        return this.id;
    }
    updateLoop(gameTick: number) {
        if (gameTick - this.lastGameTick > 1) {
            throw Error(
                `Expected game tick was ${
                    this.lastGameTick + 1
                } but got ${gameTick}`
            );
        }
        // Actually update
        this._updateLoop(gameTick);
        this.lastGameTick = gameTick;
    }
    /**
     * Reads the input at gameTick and updates one game loop
     */
    protected _updateLoop(gameTick: number) {}
    updateRender() {}
    saveState(gameTick: number) {
        History.getInstance().saveState(gameTick, this.id, this._createState());
    }
    /**
     * Loads the state wth gameTick `gameTick` and the next updateLoop should be
     * with gameTick `gameTick+1`
     */
    loadState(gameTick: number) {
        const entityStates = History.getInstance().getState(gameTick).entities;
        if (!(this.id in entityStates)) {
            console.error(
                `Entity with id '${this.id}' attempted to load state but it has no record! Ignoring.`
            );
            return;
        }
        // Load the state and progress onwards
        this.lastGameTick = gameTick;
        this._loadState(entityStates[this.id]);
    }
    /**
     * Returns entity state to be saved.
     * Needs to be overriden.
     */
    protected _createState(): any {
        return null;
    }
    /**
     * Loads the entty state by overwriting current state
     * Needs to be overriden.
     */
    protected _loadState(state: any) {}
}
