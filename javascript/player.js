const fs = require('fs');

// Define the Pokemon class with the new properties
class Pokemon {
    constructor(name, type, moves, image) {
        this.name = name;
        this.type = type;
        this.moves = moves; // This will store an array of moves
        this.image = image;
        this.level = 100; // Default level, can be changed if needed
        this.condition = null; // This could be used for status effects like 'poisoned'
        this.hp = 100; // Health points
    }
}

class Player {
    constructor(username, password) {
        this.username = username;
        this.password = password;
        this.team = [];
        this.active = null;
        this.pokedata = null;
    }

    getData(callback) {
        fs.readFile('final_project/pokemon.json', 'utf8', (err, data) => {
            if (err) {
                console.error('Error reading the file:', err);
                return;
            }
            this.pokedata = JSON.parse(data);
            callback();
        });
    }

    setTeam(PokemonNames) {
        if (!this.pokedata) {
            console.log("Pokémon data not loaded yet.");
            return;
        }

        const team = [];

        for (let pokemonName of PokemonNames) {
            const matchedPokemon = this.pokedata.find(pokemon => pokemon.name === pokemonName);

            if (matchedPokemon) {
                // Create a new Pokemon instance from the matched data
                const pokemonInstance = new Pokemon(
                    matchedPokemon.name,
                    matchedPokemon.type,
                    matchedPokemon.moves,
                    matchedPokemon.image,
                    matchedPokemon.hp
                );
                team.push(pokemonInstance);
            } else {
                console.log(`Pokémon ${pokemonName} not found.`);
            }
        }

        this.team = team; // Set the team for the player
    }

    // Set the active Pokémon in the team
    setActive(PokemonName) {
        if (!this.team.some(pokemon => pokemon.name === PokemonName)) {
            console.log("Pokemon not in team");
        } else {
            this.active = this.team.find(pokemon => pokemon.name === PokemonName);
            console.log("Active Pokémon set to:", this.active.name); // Only print the name of the active Pokémon
        }
    }

    // Method to log player data without printing the entire JSON file
    logPlayerInfo() {
        console.log(`Username: ${this.username}`);
        console.log(`Active Pokémon: ${this.active ? this.active.name : "None"}`);
        console.log("Team: ");
        this.team.forEach(pokemon => {
            console.log(`- ${pokemon.name} (${pokemon.type}, HP: ${pokemon.hp})`);
        });
    }
}

// Test function
function testing() {
    let me = new Player("Player1", "password123");

    // Load Pokémon data and then set the team and active Pokémon
    me.getData(() => {
        me.setTeam(["Pikachu", "Charmander", "Squirtle"]);
        me.setActive("Pikachu");

        me.logPlayerInfo(); // Only print relevant player information
    });

    let you = new Player("Player 2", "password123");
    you.getData(() => {
        you.setTeam(["Pikachu", "Charmander", "Squirtle"]);
        you.setActive("Squirtle");

        // Log player information
        you.logPlayerInfo(); // Only print relevant player information
    });
}

testing();
