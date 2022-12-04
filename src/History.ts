interface SavedState {
    time: number;
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

    saveState(time: number, entityId: number, entityState: any) {
        let savedState: SavedState | null;
        // Get saved state to store entityState on
        if (this.savedStates.length) {
            let lastSavedState = this.savedStates[this.savedStates.length - 1];
            if (lastSavedState.time < time) {
                // Push new saved state
                savedState = { time, entities: {} };
                this.savedStates.push(savedState);
            } else if (lastSavedState.time == time) {
                // Use the last saved state
                savedState = lastSavedState;
            } else {
                throw Error("Trying to push a saved state to the past");
            }
        } else {
            savedState = { time, entities: {} };
            this.savedStates.push(savedState);
        }
        // Store entityState
        savedState.entities[entityId] = entityState;
    }

    getState(time: number): SavedState {
        // TODO Can optimize with a hash map
        for (let i = this.savedStates.length - 1; i >= 0; i--) {
            const savedState = this.savedStates[i];
            if (savedState.time == time) {
                return savedState;
            }
        }
        throw Error(`State with time '${time}' not found!`);
    }

    eraseStatesAfter(time: number) {
        if (this.savedStates.length == 0) {
            throw Error(
                "Attempt to erase states after but there are no states."
            );
        }
        for (let i = this.savedStates.length - 1; i >= 0; i--) {
            const savedState = this.savedStates[i];
            if (savedState.time == time) {
                // Done, exit
                return;
            } else if (savedState.time > time) {
                // Erase
                this.savedStates.pop();
            } else if (savedState.time < time) {
                throw Error(
                    `State with time '${time}' not found while erasing states after!`
                );
            }
        }
    }

    eraseStatesBefore(time: number) {
        if (this.savedStates.length == 0) {
            throw Error(
                "Attempt to erase states before but there are no states."
            );
        }
        while (true) {
            const savedState = this.savedStates[0];
            if (savedState.time == time) {
                // Done, exit
                return;
            } else if (savedState.time < time) {
                // Erase
                this.savedStates.shift();
            } else if (savedState.time > time) {
                throw Error(
                    `State with time '${time}' not found while erasing states before!`
                );
            }
        }
    }
}
