import History from "./History";

export default class Entity {
    private static nextEntityId = 0;
    private id: number;
    constructor() {
        this.id = Entity.nextEntityId++;
    }
    updateLoop(delta: number, input: any) {}
    updateRender() {}
    saveState(time: number) {
        History.getInstance().saveState(time, this.id, this._createState());
    }
    loadState(time: number) {
        const entityStates = History.getInstance().getState(time).entities;
        if (!(this.id in entityStates)) {
            console.error(
                `Entity with id '${this.id}' attempted to load state but it has no record! Ignoring.`
            );
            return;
        }
        this._loadState(entityStates[this.id]);
    }
    /**
     * Returns entity state to be saved.
     * Needs to be overriden.
     */
    protected _createState() {
        return null;
    }
    /**
     * Loads the entty state by overwriting current state
     * Needs to be overriden.
     */
    protected _loadState(state: any) {}
}
