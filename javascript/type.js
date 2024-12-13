const types = {
    // Useless = does no damage to
    // Weak = Takes more damage from
    // Strong = Does more damage to
    "Normal": {
        "Useless": ["Ghost"],
        "Weak": ["Fighting"],
        "Strong": []
    },
    "Fighting": {
        "Useless": ["Ghost"],
        "Weak": ["Flying", "Poison", "Bug", "Psychic"],
        "Strong": ["Normal", "Rock", "Ice"]
    },
    "Flying": {
        "Useless": [],
        "Weak": ["Rock", "Electric", "Ice"],
        "Strong": ["Fighting", "Bug", "Grass"]
    },
    "Poison": {
        "Useless": [],
        "Weak": ["Ground", "Psychic", "Rock", "Ghost"],
        "Strong": ["Grass", "Bug"]
    },
    "Ground": {
        "Useless": ["Flying"],
        "Weak": ["Water", "Grass", "Ice"],
        "Strong": ["Fire", "Electric", "Poison", "Rock"]
    },
    "Rock": {
        "Useless": [],
        "Weak": ["Fighting", "Ground", "Water", "Grass"],
        "Strong": ["Flying", "Bug", "Fire", "Ice"]
    },
    "Bug": {
        "Useless": [],
        "Weak": ["Flying", "Rock", "Fire"],
        "Strong": ["Grass", "Psychic"]
    },
    "Ghost": {
        "Useless": ["Normal", "Psychic"],
        "Weak": [],
        "Strong": ["Ghost"]
    },
    "Fire": {
        "Useless": [],
        "Weak": ["Water", "Rock", "Dragon"],
        "Strong": ["Bug", "Grass", "Ice"]
    },
    "Water": {
        "Useless": [],
        "Weak": ["Electric", "Grass"],
        "Strong": ["Fire", "Rock", "Ground"]
    },
    "Grass": {
        "Useless": [],
        "Weak": ["Bug", "Flying", "Fire", "Poison", "Grass", "Dragon"],
        "Strong": ["Water", "Rock", "Ground"]
    },
    "Electric": {
        "Useless": ["Ground"],
        "Weak": ["Grass", "Electric", "Dragon"],
        "Strong": ["Flying", "Water"]
    },
    "Psychic": {
        "Useless": [],
        "Weak": ["Bug", "Ghost"],
        "Strong": ["Fighting", "Poison"]
    },
    "Ice": {
        "Useless": [],
        "Weak": ["Fighting", "Rock", "Fire"],
        "Strong": ["Flying", "Grass", "Ground", "Dragon"]
    },
    "Dragon": {
        "Useless": [],
        "Weak": ["Ice"],
        "Strong": ["Dragon"]
    }
};

// attacking, defending: String
function getTypeEffectiveness(attacking, defending) {
    let atkModifiers = types[attacking];
    if (defending in atkModifiers["Useless"]) { return 0; }
    if (defending in atkModifiers["Strong"]) { return 2; }
    return 1;
}

module.exports = { getTypeEffectiveness };