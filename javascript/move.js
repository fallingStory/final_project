const { getTypeEffectiveness } = require("./type");

class Move {
    constructor(name_v, desc_v, type_v, cat_v, power_v, acc_v, pp_v, effect_v, priority_v) {
        this.name = name_v;
        this.desc = desc_v;
        this.type = type_v;
        this.cat = cat_v;
        this.pow = power_v;
        this.acc = acc_v;
        this.pp = pp_v;
        this.effect = effect_v;
        this.priority = priority_v;
    }
}

/** Gets the damage for a move
 *  var move: Move = The attacker's move
 *  var attacker: Pokemon = The attacking pokemon
 *  var defender: Pokemon = The defending pokemon
 */
function getDamage(move, attacker, defender) {
    console.log(move);
    // Get all the modifiers
    let crit = (Math.random() * 100) < 6.25 ? 2 : 1; // 6.25% of landing critical hit
    let attack = attacker.stats[1];
    let defense = defender.stats[2];
    if (move.cat == "Special") {
        attack = attacker.stats[3];
        defense = defender.stats[3];
    }
    let stab = (move.type in attacker.types) ? 1.5 : 1;
    let weak1 = getTypeEffectiveness(move.type, defender.types[0]);
    let weak2 = (defender.types.length === 2) ? getTypeEffectiveness(move.type, defender.types[1]) : 1;
    let random = ((Math.random() * 38) + 217) / 255;

    // Calculate the damage
    let damage = ((2 * attacker.level * crit) / 5) + 2;
    damage = (damage * move.pow * (attack / defense)) / 50 + 2;
    damage = damage * stab * weak1 * weak2 * random;
    return damage;
}

module.exports = { Move, getDamage };