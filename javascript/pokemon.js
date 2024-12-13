const PKMNTOID = { 'BULBASAUR': 1, 'IVYSAUR': 2, 'VENUSAUR': 3, 'CHARMANDER': 4, 'CHARMELEON': 5, 'CHARIZARD': 6, 'SQUIRTLE': 7, 'WARTORTLE': 8, 'BLASTOISE': 9, 'CATERPIE': 10, 'METAPOD': 11, 'BUTTERFREE': 12, 'WEEDLE': 13, 'KAKUNA': 14, 'BEEDRILL': 15, 'PIDGEY': 16, 'PIDGEOTTO': 17, 'PIDGEOT': 18, 'RATTATA': 19, 'RATICATE': 20, 'SPEAROW': 21, 'FEAROW': 22, 'EKANS': 23, 'ARBOK': 24, 'PIKACHU': 25, 'RAICHU': 26, 'SANDSHREW': 27, 'SANDSLASH': 28, 'NIDORAN'-'F': 29, 'NIDORINA': 30, 'NIDOQUEEN': 31, 'NIDORAN'-'M': 32, 'NIDORINO': 33, 'NIDOKING': 34, 'CLEFAIRY': 35, 'CLEFABLE': 36, 'VULPIX': 37, 'NINETALES': 38, 'JIGGLYPUFF': 39, 'WIGGLYTUFF': 40, 'ZUBAT': 41, 'GOLBAT': 42, 'ODDISH': 43, 'GLOOM': 44, 'VILEPLUME': 45, 'PARAS': 46, 'PARASECT': 47, 'VENONAT': 48, 'VENOMOTH': 49, 'DIGLETT': 50, 'DUGTRIO': 51, 'MEOWTH': 52, 'PERSIAN': 53, 'PSYDUCK': 54, 'GOLDUCK': 55, 'MANKEY': 56, 'PRIMEAPE': 57, 'GROWLITHE': 58, 'ARCANINE': 59, 'POLIWAG': 60, 'POLIWHIRL': 61, 'POLIWRATH': 62, 'ABRA': 63, 'KADABRA': 64, 'ALAKAZAM': 65, 'MACHOP': 66, 'MACHOKE': 67, 'MACHAMP': 68, 'BELLSPROUT': 69, 'WEEPINBELL': 70, 'VICTREEBEL': 71, 'TENTACOOL': 72, 'TENTACRUEL': 73, 'GEODUDE': 74, 'GRAVELER': 75, 'GOLEM': 76, 'PONYTA': 77, 'RAPIDASH': 78, 'SLOWPOKE': 79, 'SLOWBRO': 80, 'MAGNEMITE': 81, 'MAGNETON': 82, 'FARFETCH'’'D': 83, 'DODUO': 84, 'DODRIO': 85, 'SEEL': 86, 'DEWGONG': 87, 'GRIMER': 88, 'MUK': 89, 'SHELLDER': 90, 'CLOYSTER': 91, 'GASTLY': 92, 'HAUNTER': 93, 'GENGAR': 94, 'ONIX': 95, 'DROWZEE': 96, 'HYPNO': 97, 'KRABBY': 98, 'KINGLER': 99, 'VOLTORB': 100, 'ELECTRODE': 101, 'EXEGGCUTE': 102, 'EXEGGUTOR': 103, 'CUBONE': 104, 'MAROWAK': 105, 'HITMONLEE': 106, 'HITMONCHAN': 107, 'LICKITUNG': 108, 'KOFFING': 109, 'WEEZING': 110, 'RHYHORN': 111, 'RHYDON': 112, 'CHANSEY': 113, 'TANGELA': 114, 'KANGASKHAN': 115, 'HORSEA': 116, 'SEADRA': 117, 'GOLDEEN': 118, 'SEAKING': 119, 'STARYU': 120, 'STARMIE': 121, 'MR'. 'MIME': 122, 'SCYTHER': 123, 'JYNX': 124, 'ELECTABUZZ': 125, 'MAGMAR': 126, 'PINSIR': 127, 'TAUROS': 128, 'MAGIKARP': 129, 'GYARADOS': 130, 'LAPRAS': 131, 'DITTO': 132, 'EEVEE': 133, 'VAPOREON': 134, 'JOLTEON': 135, 'FLAREON': 136, 'PORYGON': 137, 'OMANYTE': 138, 'OMASTAR': 139, 'KABUTO': 140, 'KABUTOPS': 141, 'AERODACTYL': 142, 'SNORLAX': 143, 'ARTICUNO': 144, 'ZAPDOS': 145, 'MOLTRES': 146, 'DRATINI': 147, 'DRAGONAIR': 148, 'DRAGONITE': 149, 'MEWTWO': 150, 'MEW': 151, };
const IDTOPKMN = { 1: 'BULBASAUR', 2: 'IVYSAUR', 3: 'VENUSAUR', 4: 'CHARMANDER', 5: 'CHARMELEON', 6: 'CHARIZARD', 7: 'SQUIRTLE', 8: 'WARTORTLE', 9: 'BLASTOISE', 10: 'CATERPIE', 11: 'METAPOD', 12: 'BUTTERFREE', 13: 'WEEDLE', 14: 'KAKUNA', 15: 'BEEDRILL', 16: 'PIDGEY', 17: 'PIDGEOTTO', 18: 'PIDGEOT', 19: 'RATTATA', 20: 'RATICATE', 21: 'SPEAROW', 22: 'FEAROW', 23: 'EKANS', 24: 'ARBOK', 25: 'PIKACHU', 26: 'RAICHU', 27: 'SANDSHREW', 28: 'SANDSLASH', 'NIDORAN'-29: 'F', 30: 'NIDORINA', 31: 'NIDOQUEEN', 'NIDORAN'-32: 'M', 33: 'NIDORINO', 34: 'NIDOKING', 35: 'CLEFAIRY', 36: 'CLEFABLE', 37: 'VULPIX', 38: 'NINETALES', 39: 'JIGGLYPUFF', 40: 'WIGGLYTUFF', 41: 'ZUBAT', 42: 'GOLBAT', 43: 'ODDISH', 44: 'GLOOM', 45: 'VILEPLUME', 46: 'PARAS', 47: 'PARASECT', 48: 'VENONAT', 49: 'VENOMOTH', 50: 'DIGLETT', 51: 'DUGTRIO', 52: 'MEOWTH', 53: 'PERSIAN', 54: 'PSYDUCK', 55: 'GOLDUCK', 56: 'MANKEY', 57: 'PRIMEAPE', 58: 'GROWLITHE', 59: 'ARCANINE', 60: 'POLIWAG', 61: 'POLIWHIRL', 62: 'POLIWRATH', 63: 'ABRA', 64: 'KADABRA', 65: 'ALAKAZAM', 66: 'MACHOP', 67: 'MACHOKE', 68: 'MACHAMP', 69: 'BELLSPROUT', 70: 'WEEPINBELL', 71: 'VICTREEBEL', 72: 'TENTACOOL', 73: 'TENTACRUEL', 74: 'GEODUDE', 75: 'GRAVELER', 76: 'GOLEM', 77: 'PONYTA', 78: 'RAPIDASH', 79: 'SLOWPOKE', 80: 'SLOWBRO', 81: 'MAGNEMITE', 82: 'MAGNETON', 'FARFETCH'’83: 'D', 84: 'DODUO', 85: 'DODRIO', 86: 'SEEL', 87: 'DEWGONG', 88: 'GRIMER', 89: 'MUK', 90: 'SHELLDER', 91: 'CLOYSTER', 92: 'GASTLY', 93: 'HAUNTER', 94: 'GENGAR', 95: 'ONIX', 96: 'DROWZEE', 97: 'HYPNO', 98: 'KRABBY', 99: 'KINGLER', 100: 'VOLTORB', 101: 'ELECTRODE', 102: 'EXEGGCUTE', 103: 'EXEGGUTOR', 104: 'CUBONE', 105: 'MAROWAK', 106: 'HITMONLEE', 107: 'HITMONCHAN', 108: 'LICKITUNG', 109: 'KOFFING', 110: 'WEEZING', 111: 'RHYHORN', 112: 'RHYDON', 113: 'CHANSEY', 114: 'TANGELA', 115: 'KANGASKHAN', 116: 'HORSEA', 117: 'SEADRA', 118: 'GOLDEEN', 119: 'SEAKING', 120: 'STARYU', 121: 'STARMIE', 'MR'. 122: 'MIME', 123: 'SCYTHER', 124: 'JYNX', 125: 'ELECTABUZZ', 126: 'MAGMAR', 127: 'PINSIR', 128: 'TAUROS', 129: 'MAGIKARP', 130: 'GYARADOS', 131: 'LAPRAS', 132: 'DITTO', 133: 'EEVEE', 134: 'VAPOREON', 135: 'JOLTEON', 136: 'FLAREON', 137: 'PORYGON', 138: 'OMANYTE', 139: 'OMASTAR', 140: 'KABUTO', 141: 'KABUTOPS', 142: 'AERODACTYL', 143: 'SNORLAX', 144: 'ARTICUNO', 145: 'ZAPDOS', 146: 'MOLTRES', 147: 'DRATINI', 148: 'DRAGONAIR', 149: 'DRAGONITE', 150: 'MEWTWO', 151: 'MEW', };
class PokemonModel {
    constructor(id_v, name_v, types_v, image_v, basestats_v, preevos_v, evos_v) {
        this.id = id_v;
        this.name = name_v;
        this.types = types_v;
        this.image = image_v;
        this.basestats = basestats_v;
        this.preevos = preevos_v;
        this.evos = evos_v;
    }

    toString() {
        let toString = `${this.name} (${this.id}): `;
        toString += `${(this.types.length === 1) ? `${this.types[0]}` : `${this.types[0]}/${this.types[1]}`}`;
        return toString.toUpperCase();
    }
}

class Pokemon extends PokemonModel {

}

async function createPokemon(client) {
    await client.connect();

    const pokemonDB = client.db("PokemonDB");
    const pokemonCollection = pokemonDB.collection("pokemon");
    const pokemon = await pokemonCollection.aggregate().toArray();
    let pokemonList = []; //new Array < PokemonModel > (pokemon.length);

    for (let i = 0; i < pokemon.length; i++) {
        let curPokemon = pokemon[i];
        let curPokemonObj = new PokemonModel(
            curPokemon.id,
            curPokemon.name,
            curPokemon.types,
            `https://play.pokemonshowdown.com/sprites/gen1/${curPokemon.name.toLowerCase()}.png`,
            curPokemon.baseStats,
            curPokemon.prevo,
            curPokemon.evos
        );
        pokemonList.push(curPokemonObj);
    }

    return pokemonList;
}

module.exports = {
    PKMNTOID,
    IDTOPKMN,
    PokemonModel,
    createPokemon
};