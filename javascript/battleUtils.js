const { getDamage } = require("./move");

const battles = [];

class BattleState {
    constructor(id_v, player_a_v, player_b_v) {
        this.id = id_v;
        this.playerA = player_a_v;
        this.playerB = player_b_v;
        this.turn = 1;
        this.AActivePokemon = 0;
        this.BActivePokemon = 0;
        this.AMove = false;
        this.BMove = false;
        this.endState = {
            isOver: false,
            winnder: null
        };
        this.botComments = [];
    }

    getPlayer(playerID) {
        return (this.playerA.id === playerID) ? this.playerA : this.playerB;
    }

    getOpponent(playerID) {
        return (this.playerA.id === playerID) ? this.playerB : this.playerA;
    }

    getPlayerActive(playerID) {
        return (this.playerA.id === playerID) ? this.AActivePokemon : this.BActivePokemon;
    }

    getOpponentActive(playerID) {
        return (this.playerA.id === playerID) ? this.BActivePokemon : this.AActivePokemon;
    }

    getPlayerPokemon(playerID) {
        if (this.playerA.id === playerID) {
            return this.playerA.team[this.getPlayerActive(playerID)];
        }
        return this.playerB.team[this.getPlayerActive(playerID)];
    }

    getOpponentPokemon(playerID) {
        if (this.playerA.id === playerID) {
            return this.playerB.team[this.getPlayerActive(playerID)];
        }
        return this.playerA.team[this.getPlayerActive(playerID)];
    }
}

// Creates a new battle
function createBattle(id_v, player_a_v, player_b_v) {
    battles.push(new BattleState(id_v, player_a_v, player_b_v))
}

function updateBattle(id, newBattle) {
    for (let i = 0; i < battles.length; i++) {
        if (battles[i].id == id) {
            battles[i].id = newBattle.id;
            battles[i].playerA = newBattle.playerA;
            battles[i].playerB = newBattle.playerB;
            battles[i].turn = newBattle.turn;
            battles[i].AActivePokemon = newBattle.AActivePokemon;
            battles[i].BActivePokemon = newBattle.BActivePokemon;
            battles[i].AMove = newBattle.AMove;
            battles[i].BMove = newBattle.BMove;
            battles[i].endState = newBattle.endState;
            battles[i].botComments = newBattle.botComments;
        }
    }
}

// Get current user
function getCurrentBattle(id) {
    for (let i = 0; i < battles.length; i++) {
        if (battles[i].id == id) return battles[i];
    }
    console.log(`Error: Battle with id ${id} not found!`)
    console.log(battles);
    return battles[0];
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

// Figure out the faster move
function getFaster(turnInfo) {
    const moveA = turnInfo.aMove;
    const moveB = turnInfo.bMove;
    const pokemonA = turnInfo.aMon;
    const pokemonB = turnInfo.bMon;
    let winner = 'speed'; // should be either 'speed', 'a', 'b'

    if (moveA.type == 'switch' && moveB.type == 'switch') winner = 'speed';
    else if (moveA.type == 'switch' && moveB.type == 'attack') winner = 'a'
    else if (moveA.type == 'attack' && moveB.type == 'switch') winner = 'b'
    else winner = 'speed'

    // Switches always go before attacks
    // In case of a speed tie, Player A goes first
    if (winner != 'speed') return winner;
    else return (pokemonB.stats[4] > pokemonA.stats[4]) ? 'a' : 'b';
}


function conductMove(battleState, faster) {
    // Declare important variables
    const msg = battleState.botComments
    const aMove = battleState.AMove;
    const bMove = battleState.BMove;
    const aMon = battleState.playerA.team[battleState.AActivePokemon];
    const bMon = battleState.playerB.team[battleState.BActivePokemon];

    const move = (faster == 'a') ? aMove : bMove;
    const attacker = (faster == 'a') ? aMon : bMon;
    const defender = (faster == 'a') ? bMon : aMon;
    const attackingPlayer = (faster == 'a') ? battleState.playerA : battleState.playerB;

    // Actually do the move
    if (move.type == 'switch') {
        if (attackingPlayer.id == battleState.playerA.id) {
            battleState.AActivePokemon = move.target;
        }
        else if (attackingPlayer.id == battleState.playerB.id) {
            battleState.BActivePokemon = move.target;
        }
        else {
            console.log('Error with switching!');
        }

        // message
        msg.push(`${attackingPlayer.username} withdrew ${aMon.name}!`);
        msg.push(`${attackingPlayer.username} sent out ${battleState.playerA.team[move.target]}!`);
    }
    else if (move.type == 'attack') {
        // Calculate damage
        const hp = defender.stats[0];
        let damage = Math.floor(getDamage(move.model, attacker, defender));
        damage = (damage > hp) ? hp : damage;
        defender.stats[0] = hp - damage;

        // message
        msg.push(`${attackingPlayer.username} used ${move.model.name}!`);
    }

    return battleState;
}

/**
 * Checks if the pokemon on the recieving end of an attack fainted, forcefully switching
 * in a healthy pokemon or ending the game if that pokemon fainted
 * @param {BattleState} newBattleState 
 * @param {string} attacker may be either 'a' or 'b' to represent Player A's or B's pokemon
 * @returns { newBattleState, fainted }
 */
function checkIfPokemonFainted(newBattleState, attacker) {
    const msg = newBattleState.botComments;

    let fainted = false;
    // If slower faints, switch in a new Pokemon and end the turn
    if (attacker == 'a') {
        let taker = newBattleState.playerB.team[newBattleState.BActivePokemon];
        if (taker.stats[0] === 0) {
            // Create message for bot to write to chat
            msg.push(`${newBattleState.playerB.username}'s ${taker.name} fainted!`);

            fainted = true;
            let nextPokemon = newBattleState.playerB.team.find(mon => mon.stats[0] > 0);
            if (nextPokemon) {
                newBattleState.BActivePokemon = nextPokemon.index;
                msg.push(`Sending in ${newBattleState.playerB.team[newBattleState.BActivePokemon].name}!`);
            }
            else {
                newBattleState.endState = {
                    isOver: true,
                    winnder: newBattleState.playerA
                }
                msg.push(`Game over, ${newBattleState.playerB.username} wins!`);
            }
        }
    }
    else if (attacker == 'b') {
        let taker = newBattleState.playerA.team[newBattleState.AActivePokemon];
        if (taker.stats[0] === 0) {
            // Create message for bot to write to chat
            msg.push(`${newBattleState.playerB.username}'s ${taker.name} fainted!`);

            fainted = true;
            let nextPokemon = newBattleState.playerA.team.find(mon => mon.stats[0] > 0);
            if (nextPokemon) {
                newBattleState.AActivePokemon = nextPokemon.index;
                msg.push(`Sending in ${newBattleState.playerA.team[newBattleState.AActivePokemon].name}!`);
            }
            else {
                newBattleState.endState = {
                    isOver: true,
                    winnder: newBattleState.playerB
                }
                msg.push(`Game over, ${newBattleState.playerA.username} wins!`);
            }
        }
    }
    return { newBattleState, fainted };
}

module.exports = {
    BattleState,
    createBattle,
    updateBattle,
    getCurrentBattle,
    closeBattle,
    getFaster,
    conductMove,
    checkIfPokemonFainted
};
