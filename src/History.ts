interface SavedState {
    gameTick: number;
    entities: { [entityId: number]: any };
}

export default class History {
    private savedStates: SavedState[] = [];
    private static instance: History | null;

    constructor() {}

    static getInstance() {
        if (!History.instance) {
            History.instance = new History();
        }
        return History.instance;
    }

    saveState(gameTick: number, entityId: number, entityState: any) {
        let savedState: SavedState | null;
        // Get saved state to store entityState on
        if (this.savedStates.length) {
            let lastSavedState = this.savedStates[this.savedStates.length - 1];
            if (lastSavedState.gameTick < gameTick) {
                // Push new saved state
                savedState = { gameTick, entities: {} };
                this.savedStates.push(savedState);
            } else if (lastSavedState.gameTick == gameTick) {
                // Use the last saved state
                savedState = lastSavedState;
            } else {
                throw Error("Trying to push a saved state to the past");
            }
        } else {
            savedState = { gameTick, entities: {} };
            this.savedStates.push(savedState);
        }
        // Store entityState
        savedState.entities[entityId] = entityState;
    }

    getState(gameTick: number): SavedState {
        // TODO Can optimize with a hash map
        for (let i = this.savedStates.length - 1; i >= 0; i--) {
            const savedState = this.savedStates[i];
            if (savedState.gameTick == gameTick) {
                return savedState;
            }
        }
        throw Error(`State with gameTick '${gameTick}' not found!`);
    }

    getStateBefore(gameTick: number): SavedState {
        // TODO Can optimize with a hash map
        for (let i = this.savedStates.length - 1; i >= 0; i--) {
            const savedState = this.savedStates[i];
            if (savedState.gameTick < gameTick) {
                return savedState;
            }
        }
        throw Error(`State with gameTick less than '${gameTick}' not found!`);
    }

    eraseStatesAfter(gameTick: number) {
        if (this.savedStates.length == 0) {
            throw Error(
                "Attempt to erase states after but there are no states."
            );
        }
        for (let i = this.savedStates.length - 1; i >= 0; i--) {
            const savedState = this.savedStates[i];
            if (savedState.gameTick == gameTick) {
                // Done, exit
                return;
            } else if (savedState.gameTick > gameTick) {
                // Erase
                this.savedStates.pop();
            } else if (savedState.gameTick < gameTick) {
                throw Error(
                    `State with gameTick '${gameTick}' not found while erasing states after!`
                );
            }
        }
    }

    eraseStatesBefore(gameTick: number) {
        if (this.savedStates.length == 0) {
            throw Error(
                "Attempt to erase states before but there are no states."
            );
        }
        while (true) {
            const savedState = this.savedStates[0];
            if (savedState.gameTick == gameTick) {
                // Done, exit
                return;
            } else if (savedState.gameTick < gameTick) {
                // Erase
                this.savedStates.shift();
            } else if (savedState.gameTick > gameTick) {
                throw Error(
                    `State with gameTick '${gameTick}' not found while erasing states before!`
                );
            }
        }
    }
}
