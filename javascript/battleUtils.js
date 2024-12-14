const battles = [];

function createBattle(id_v, player_a_v, player_b_v) {
    battles.push(new BattleState(id_v, player_a_v, player_b_v))
}

class BattleState {
    constructor(id_v, player_a_v, player_b_v) {
        this.id = id_v;
        this.playerA = player_a_v;
        this.playerB = player_b_v;
        this.turn = 1;
        this.AActivePokemon = 0;
        this.BActivePokemon = 0;
        this.over = false;
    }
}

// Get current user
function getCurrentBattle(id) {
    for (let i = 0; i < battles.length; i++) {
        if (battles[i].id == id) return battles[i];
    }
}

// Close battle
function closeBattle(id) {
    const index = -1;
    for (let i = 0; i < battles.length; i++) {
        if (battles[i].id === id) index = i;
    }

    if (index !== 1) {
        return activeUsers.splice(index, 1)[0];
    }
}

module.exports = {
    BattleState,
    createBattle,
    getCurrentBattle,
    closeBattle
};
