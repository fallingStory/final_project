/ Listen for the opponent's Pokémon selection from the server
            socket.on("opponentSelectPokemon", (opponentPokemon) => {
                console.log("Opponent's selected Pokémon:", opponentPokemon);
    
                // Get the opponent's name
                const opponentName = opponentPokemon.name.toLowerCase();
    
                // Update opponent's Pokémon image using the name
                const opponentImg = document.querySelector('img[name="pokemonIMGOPP"]');
                opponentImg.src = `https://play.pokemonshowdown.com/sprites/gen1/${opponentName}.png`; // Generate image using name
                opponentImg.alt = opponentPokemon.name;
            });