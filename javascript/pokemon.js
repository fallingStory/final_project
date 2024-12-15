const { Move } = require('./move');

const PKMNTOID = { 'BULBASAUR': 0, 'IVYSAUR': 1, 'VENUSAUR': 2, 'CHARMANDER': 3, 'CHARMELEON': 4, 'CHARIZARD': 5, 'SQUIRTLE': 6, 'WARTORTLE': 7, 'BLASTOISE': 8, 'CATERPIE': 9, 'METAPOD': 10, 'BUTTERFREE': 11, 'WEEDLE': 12, 'KAKUNA': 13, 'BEEDRILL': 14, 'PIDGEY': 15, 'PIDGEOTTO': 16, 'PIDGEOT': 17, 'RATTATA': 18, 'RATICATE': 19, 'SPEAROW': 20, 'FEAROW': 21, 'EKANS': 22, 'ARBOK': 23, 'PIKACHU': 24, 'RAICHU': 25, 'SANDSHREW': 26, 'SANDSLASH': 27, 'NIDORAN-F': 28, 'NIDORINA': 29, 'NIDOQUEEN': 30, 'NIDORAN-M': 31, 'NIDORINO': 32, 'NIDOKING': 33, 'CLEFAIRY': 34, 'CLEFABLE': 35, 'VULPIX': 36, 'NINETALES': 37, 'JIGGLYPUFF': 38, 'WIGGLYTUFF': 39, 'ZUBAT': 40, 'GOLBAT': 41, 'ODDISH': 42, 'GLOOM': 43, 'VILEPLUME': 44, 'PARAS': 45, 'PARASECT': 46, 'VENONAT': 47, 'VENOMOTH': 48, 'DIGLETT': 49, 'DUGTRIO': 50, 'MEOWTH': 51, 'PERSIAN': 52, 'PSYDUCK': 53, 'GOLDUCK': 54, 'MANKEY': 55, 'PRIMEAPE': 56, 'GROWLITHE': 57, 'ARCANINE': 58, 'POLIWAG': 59, 'POLIWHIRL': 60, 'POLIWRATH': 61, 'ABRA': 62, 'KADABRA': 63, 'ALAKAZAM': 64, 'MACHOP': 65, 'MACHOKE': 66, 'MACHAMP': 67, 'BELLSPROUT': 68, 'WEEPINBELL': 69, 'VICTREEBEL': 70, 'TENTACOOL': 71, 'TENTACRUEL': 72, 'GEODUDE': 73, 'GRAVELER': 74, 'GOLEM': 75, 'PONYTA': 76, 'RAPIDASH': 77, 'SLOWPOKE': 78, 'SLOWBRO': 79, 'MAGNEMITE': 80, 'MAGNETON': 81, 'FARFETCH D': 82, 'DODUO': 83, 'DODRIO': 84, 'SEEL': 85, 'DEWGONG': 86, 'GRIMER': 87, 'MUK': 88, 'SHELLDER': 89, 'CLOYSTER': 90, 'GASTLY': 91, 'HAUNTER': 92, 'GENGAR': 93, 'ONIX': 94, 'DROWZEE': 95, 'HYPNO': 96, 'KRABBY': 97, 'KINGLER': 98, 'VOLTORB': 99, 'ELECTRODE': 100, 'EXEGGCUTE': 101, 'EXEGGUTOR': 102, 'CUBONE': 103, 'MAROWAK': 104, 'HITMONLEE': 105, 'HITMONCHAN': 106, 'LICKITUNG': 107, 'KOFFING': 108, 'WEEZING': 109, 'RHYHORN': 110, 'RHYDON': 111, 'CHANSEY': 112, 'TANGELA': 113, 'KANGASKHAN': 114, 'HORSEA': 115, 'SEADRA': 116, 'GOLDEEN': 117, 'SEAKING': 118, 'STARYU': 119, 'STARMIE': 120, 'MR. MIME': 121, 'SCYTHER': 122, 'JYNX': 123, 'ELECTABUZZ': 124, 'MAGMAR': 125, 'PINSIR': 126, 'TAUROS': 127, 'MAGIKARP': 128, 'GYARADOS': 129, 'LAPRAS': 130, 'DITTO': 131, 'EEVEE': 132, 'VAPOREON': 133, 'JOLTEON': 134, 'FLAREON': 135, 'PORYGON': 136, 'OMANYTE': 137, 'OMASTAR': 138, 'KABUTO': 139, 'KABUTOPS': 140, 'AERODACTYL': 141, 'SNORLAX': 142, 'ARTICUNO': 143, 'ZAPDOS': 144, 'MOLTRES': 145, 'DRATINI': 146, 'DRAGONAIR': 147, 'DRAGONITE': 148, 'MEWTWO': 149, 'MEW': 150 };
const IDTOPKMN = { 0: 'BULBASAUR', 1: 'IVYSAUR', 2: 'VENUSAUR', 3: 'CHARMANDER', 4: 'CHARMELEON', 5: 'CHARIZARD', 6: 'SQUIRTLE', 7: 'WARTORTLE', 8: 'BLASTOISE', 9: 'CATERPIE', 10: 'METAPOD', 11: 'BUTTERFREE', 12: 'WEEDLE', 13: 'KAKUNA', 14: 'BEEDRILL', 15: 'PIDGEY', 16: 'PIDGEOTTO', 17: 'PIDGEOT', 18: 'RATTATA', 19: 'RATICATE', 20: 'SPEAROW', 21: 'FEAROW', 22: 'EKANS', 23: 'ARBOK', 24: 'PIKACHU', 25: 'RAICHU', 26: 'SANDSHREW', 27: 'SANDSLASH', 28: 'NIDORAN-F', 29: 'NIDORINA', 30: 'NIDOQUEEN', 31: 'NIDORAN-M', 32: 'NIDORINO', 33: 'NIDOKING', 34: 'CLEFAIRY', 35: 'CLEFABLE', 36: 'VULPIX', 37: 'NINETALES', 38: 'JIGGLYPUFF', 39: 'WIGGLYTUFF', 40: 'ZUBAT', 41: 'GOLBAT', 42: 'ODDISH', 43: 'GLOOM', 44: 'VILEPLUME', 45: 'PARAS', 46: 'PARASECT', 47: 'VENONAT', 48: 'VENOMOTH', 49: 'DIGLETT', 50: 'DUGTRIO', 51: 'MEOWTH', 52: 'PERSIAN', 53: 'PSYDUCK', 54: 'GOLDUCK', 55: 'MANKEY', 56: 'PRIMEAPE', 57: 'GROWLITHE', 58: 'ARCANINE', 59: 'POLIWAG', 60: 'POLIWHIRL', 61: 'POLIWRATH', 62: 'ABRA', 63: 'KADABRA', 64: 'ALAKAZAM', 65: 'MACHOP', 66: 'MACHOKE', 67: 'MACHAMP', 68: 'BELLSPROUT', 69: 'WEEPINBELL', 70: 'VICTREEBEL', 71: 'TENTACOOL', 72: 'TENTACRUEL', 73: 'GEODUDE', 74: 'GRAVELER', 75: 'GOLEM', 76: 'PONYTA', 77: 'RAPIDASH', 78: 'SLOWPOKE', 79: 'SLOWBRO', 80: 'MAGNEMITE', 81: 'MAGNETON', 82: 'FARFETCH D', 83: 'DODUO', 84: 'DODRIO', 85: 'SEEL', 86: 'DEWGONG', 87: 'GRIMER', 88: 'MUK', 89: 'SHELLDER', 90: 'CLOYSTER', 91: 'GASTLY', 92: 'HAUNTER', 93: 'GENGAR', 94: 'ONIX', 95: 'DROWZEE', 96: 'HYPNO', 97: 'KRABBY', 98: 'KINGLER', 99: 'VOLTORB', 100: 'ELECTRODE', 101: 'EXEGGCUTE', 102: 'EXEGGUTOR', 103: 'CUBONE', 104: 'MAROWAK', 105: 'HITMONLEE', 106: 'HITMONCHAN', 107: 'LICKITUNG', 108: 'KOFFING', 109: 'WEEZING', 110: 'RHYHORN', 111: 'RHYDON', 112: 'CHANSEY', 113: 'TANGELA', 114: 'KANGASKHAN', 115: 'HORSEA', 116: 'SEADRA', 117: 'GOLDEEN', 118: 'SEAKING', 119: 'STARYU', 120: 'STARMIE', 121: 'MR. MIME', 122: 'SCYTHER', 123: 'JYNX', 124: 'ELECTABUZZ', 125: 'MAGMAR', 126: 'PINSIR', 127: 'TAUROS', 128: 'MAGIKARP', 129: 'GYARADOS', 130: 'LAPRAS', 131: 'DITTO', 132: 'EEVEE', 133: 'VAPOREON', 134: 'JOLTEON', 135: 'FLAREON', 136: 'PORYGON', 137: 'OMANYTE', 138: 'OMASTAR', 139: 'KABUTO', 140: 'KABUTOPS', 141: 'AERODACTYL', 142: 'SNORLAX', 143: 'ARTICUNO', 144: 'ZAPDOS', 145: 'MOLTRES', 146: 'DRATINI', 147: 'DRAGONAIR', 148: 'DRAGONITE', 149: 'MEWTWO', 150: 'MEW' };

// Calculates a pokemon's real hp stat. Uses Gen III+ formula for simplicity, but
// filling in the blanks to account for Gen I differences
function _calc_hp(hp_base, level) {
    let evs = 252;  // Assume max evs
    let ivs = 31;   // Assume max ivs

    let result = Math.floor((((2 * hp_base) + ivs + (evs / 4)) * level) / 100);
    result += level + 10;

    return result;
}

// Calculates a pokemon's real atk/def/special/speed stat. Uses Gen III+ formula for
// simplicity, but filling in the blanks to account for Gen I differences
function _calc_stat(stat_base, level) {
    let evs = 252;  // Assume max evs
    let ivs = 31;   // Assume max ivs

    // No nature in Gen I
    let result = Math.floor((((2 * stat_base) + ivs + (evs / 4)) * level) / 100);
    result += 5;

    return result;
}

// Represents an abstraction of a pokemon, containing things like its typing and base stats
class PokemonModel {
    constructor(id_v, name_v, types_v, image_v, baseStats_v, preevos_v, evos_v) {
        this.id = id_v;
        this.name = name_v;
        this.types = types_v;
        this.image = image_v;
        this.baseStats = baseStats_v;
        this.preevos = preevos_v;
        this.evos = evos_v;
    }

    toString() {
        let toString = `${this.name} (${this.id}): `;
        toString += `${(this.types.length === 1) ? `${this.types[0]}` : `${this.types[0]}/${this.types[1]}`}`;
        return toString.toUpperCase();
    }
}

// Represents an actually existing pokemon, with things like a level and status condition
class Pokemon extends PokemonModel {
    constructor(model, moves_v, index_v) {
        super(
            model.id, model.name, model.types, model.image, model.baseStats, model.preevos, model.evos
        );
        this.level = 100;
        this.nickname = "";
        this.condition = "";
        // Represents a Pokemon's actual stats on the field. Can be lowered and raised in battle
        this.stats = [
            _calc_hp(model.baseStats[0], this.level),    // HP
            _calc_stat(model.baseStats[1], this.level),  // Attack
            _calc_stat(model.baseStats[2], this.level),  // Defense
            _calc_stat(model.baseStats[3], this.level),  // Special
            _calc_stat(model.baseStats[4], this.level),  // Speed
        ];
        // Represents what a Pokemon's stats should be. Cannot be lowered or raised in battle.
        // Used for displaying what percent of a Pokemon's health remains, for example
        this.statsNormal = [
            this.stats[0], this.stats[1], this.stats[2], this.stats[3], this.stats[4]
        ];
        this.moves = moves_v;
        this.index = index_v;
    }

    // Heal a pokemon after a battle
    heal() {
        this.stats = [
            model.statsNormal[0],  // HP
            model.statsNormal[1],  // Attack
            model.statsNormal[2],  // Defense
            model.statsNormal[3],  // Special
            model.statsNormal[4],  // Speed
        ];
        this.condition = "";
    }
}

// Gets the pokemon models from the database and loads them into an array
async function getPokemonModels(client) {
    let pokemonList = []; //new Array < PokemonModel > (pokemon.length);

    try {
        await client.connect();

        const pokemonDB = client.db("PokemonDB");
        const pokemonCollection = pokemonDB.collection("pokemon");
        const pokemon = await pokemonCollection.aggregate().toArray();

        for (let i = 0; i < pokemon.length; i++) {
            let curPokemon = pokemon[i];
            let curPokemonObj = new PokemonModel(
                curPokemon.id, curPokemon.name, curPokemon.types, `https://play.pokemonshowdown.com/sprites/gen1/${curPokemon.name.toLowerCase()}.png`, [curPokemon.baseStats.hp, curPokemon.baseStats.atk, curPokemon.baseStats.def, curPokemon.baseStats.spa, curPokemon.baseStats.spe], curPokemon.prevo, curPokemon.evos
            );
            pokemonList.push(curPokemonObj);
        }
    } catch (err) {
        console.error(err);
        res.status(500).send("Error fetching pokemon");
    }

    await client.close();

    console.log(`${pokemonList.length} pokemon loaded.`)

    return pokemonList;
}

// Generate the default team
function getDefaultTeam(models) {
    let pikachu = new Pokemon(models[PKMNTOID['PIKACHU']], [
        new Move('Thunder Shock', "No additional effect", "Electric", "Special", 40, 100, 30, "Paralyze chance", 0),
        new Move('Quick Attack', "No additional effect", "Normal", "Physical", 40, 100, 30, "Priority move", 1),
        new Move('Electro Ball', "No additional effect", "Electric", "Special", 60, 100, 10, null, 0),
        new Move('Iron Tail', "No additional effect", "Steel", "Physical", 100, 75, 15, "Lowers Defense chance", 0)
    ], 0);
    let charizard = new Pokemon(models[PKMNTOID['CHARIZARD']], [
        new Move('Flamethrower', "No additional effect", "Fire", "Special", 90, 100, 15, "Burn chance", 0),
        new Move('Air Slash', "No additional effect", "Flying", "Special", 75, 95, 20, "Flinch chance", 1),
        new Move('Dragon Claw', "No additional effect", "Dragon", "Physical", 80, 100, 15, null, 0),
        new Move('Fire Blast', "No additional effect", "Fire", "Special", 110, 85, 5, "Burn chance", 0)
    ], 1);
    let venusaur = new Pokemon(models[PKMNTOID['VENUSAUR']], [
        new Move('Vine Whip', "No additional effect", "Grass", "Physical", 45, 100, 25, null, 0),
        new Move('Razor Leaf', "No additional effect", "Grass", "Physical", 55, 95, 25, "High crit chance", 1),
        new Move('Sludge Bomb', "No additional effect", "Poison", "Special", 90, 100, 10, "Poison chance", 0),
        new Move('Strength', "No additional effect", "Normal", "Physcial", 120, 100, 10, null, 0)
    ], 2);
    let blastoise = new Pokemon(models[PKMNTOID['BLASTOISE']], [
        new Move('Water Gun', "No additional effect", "Water", "Special", 40, 100, 25, null, 0),
        new Move('Hydro Pump', "No additional effect", "Water", "Special", 110, 80, 5, null, 1),
        new Move('Ice Beam', "No additional effect", "Ice", "Special", 90, 100, 10, "Freeze chance", 0),
        new Move('Bite', "No additional effect", "Dark", "Physical", 60, 100, 25, "Flinch chance", 0)
    ], 3);
    let snorlax = new Pokemon(models[PKMNTOID['SNORLAX']], [
        new Move('Body Slam', "No additional effect", "Normal", "Physical", 85, 100, 15, "Paralyze chance", 0),
        new Move('Crunch', "No additional effect", "Dark", "Physical", 80, 100, 15, "Lowers Defense chance", 1),
        new Move('Earthquake', "No additional effect", "Ground", "Physical", 100, 100, 10, null, 0),
        new Move('Strength', "No additional effect", "Normal", "Physical", 150, 90, 5, null, 0)
    ], 4);
    let lapras = new Pokemon(models[PKMNTOID['LAPRAS']], [
        new Move('Surf', "No additional effect", "Water", "Special", 90, 100, 15, null, 0),
        new Move('Ice Beam', "No additional effect", "Ice", "Special", 90, 100, 10, "Freeze chance", 1),
        new Move('Strength', "No additional effect", "Normal", "Physical", 80, 0, 5, null, 0),
        new Move('Blizzard', "No additional effect", "Ice", "Special", 110, 70, 5, "Freeze chance", 0)
    ], 5);
    return [pikachu, charizard, venusaur, blastoise, snorlax, lapras];
}

module.exports = {
    PKMNTOID, IDTOPKMN, Pokemon, getPokemonModels, getDefaultTeam
};