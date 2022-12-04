export interface SavedInput { [inputName: string]: any };

export default class InputHistory {
    private savedInputs: { [gameTick: number]: SavedInput} = {};
    private firstSavedInput = 0;
    private static instance: InputHistory | null = null;

    private constructor() {}

    static getInstance() {
        if (!InputHistory.instance) {
            InputHistory.instance = new InputHistory();
        }
        return InputHistory.instance;
    }

    /**
     * Updates inputs at `gameTick` with new inputs.
     * Inputs with keys not in `inputs` are unchanged.
     * @param gameTick 
     * @param inputs 
     */
    updateInputs(gameTick: number, inputs: any) {
        if (gameTick < this.firstSavedInput) {
            throw Error(`Tried to insert input (${gameTick}) before first saved input (${this.firstSavedInput})`);
        }
        if (!this.savedInputs[gameTick]) {
            this.savedInputs[gameTick] = {};
        }
        Object.assign(this.savedInputs[gameTick], inputs);
    }

    getInputs(gameTick: number): SavedInput {
        if (gameTick < this.firstSavedInput) {
            throw Error(`Tried to get input (${gameTick}) before first saved input (${this.firstSavedInput})`);
        }
        if (!this.savedInputs[gameTick]) {
            this.savedInputs[gameTick] = {};
        }
        return this.savedInputs[gameTick];
    }

    /**
     * Erases inputs before the given game tick to free memory.
     * @param gameTick 
     */
    eraseInputsUntil(gameTick: number) {
        for (; this.firstSavedInput < gameTick; this.firstSavedInput++) {
            delete this.savedInputs[this.firstSavedInput];
        }
    }
}