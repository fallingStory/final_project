// Ensure the DOM is fully loaded before running the script
document.addEventListener("DOMContentLoaded", async() => {
    const socket = io("http://localhost:3000");
    
    // Get battleId from the URL query parameters
    const battleId = new URLSearchParams(window.location.search).get("battleId");
    console.log("Battle ID from URL:", battleId);
    
    // Debugging: Check the full window location
    console.log("Window Location:", window.location);

    // DOM elements
    const chatForm = document.getElementById("chatForm");
    const chatInput = document.getElementById("chatInput");
    const chatMessages = document.getElementById("chatMessages");
    const battleLog = document.getElementById("battleLog");
    const battleActions = document.querySelectorAll(".battleAction");
    const moveButtons = document.querySelectorAll(".moveButtons");
    const pokemonButtons = document.querySelectorAll(".pokemonButtons");

    // Validate battleId
    if (!battleId) {
        alert("No battle ID found. Returning to the main menu.");
        window.location.href = "/";
        return;
    }

    // Join the battle room
    socket.emit("joinBattle", { battleId });

    const loadPokemon = async () => {
        try {
            let pokemon;
            const savedPokemon = sessionStorage.getItem("pokemon");
            if (savedPokemon) {
                pokemon = JSON.parse(savedPokemon);
                console.log("Using pokemon from sessionStorage:", pokemon);
            } else {
                const response = await fetch("/getRandomPokemon");
                pokemon = await response.json();
                if (pokemon.length < pokemonButtons.length) {
                    throw new Error("Not enough pokemon fetched to populate buttons.");
                }
                console.log("Fetched new mons:", pokemon);
                // Save the fetched moves to sessionStorage
                sessionStorage.setItem("pokemon", JSON.stringify(pokemon));
            }
    
            pokemonButtons.forEach((button, index) => {
                const mon = pokemon[index];
                button.textContent = `${mon.name}`;
                button.dataset.pokemonId = `${mon._id}`;
                button.addEventListener("click", () => {
                    socket.emit('sendMove', battleId, 0, index);
                });
            });
    
            // Emit the event only after data is available
            socket.emit("getPokemon", pokemon, battleId, (response) => {
                if (response.success) {
                    //socket.emit("battleStatus", battleId);
                } else {
                    console.error("Failed to get Pokémon data.");
                }
            });
        } catch (error) {
            console.error("Error loading pokemon:", error);
            alert("Failed to load pokemon. Please try again.");
        }
    };


    await loadPokemon()

    const loadMoves = async () => {
        console.log("did we even hit load moves");

        try {
            let moves;
            // Check if moves are saved in sessionStorage
            const savedMoves = sessionStorage.getItem("moves");
            if (savedMoves) {
                moves = JSON.parse(savedMoves);
                console.log("Using moves from sessionStorage:", moves);
            } else {
                const response = await fetch("/getRandomMoves");
                moves = await response.json();
                if (moves.length < moveButtons.length) {
                    throw new Error("Not enough moves fetched to populate buttons.");
                }
                console.log("Fetched new moves:", moves);
                // Save the fetched moves to sessionStorage
                sessionStorage.setItem("moves", JSON.stringify(moves));
            }

            // Populate buttons with moves
            moveButtons.forEach((button, index) => {
                const move = moves[index];
                button.textContent = `${move.name} (${move.type}) - Power: ${move.basePower}`;
                button.dataset.moveId = move._id; // Store the move ID for reference
                console.log(move.basePower)
                button.addEventListener("click", () => {
                    socket.emit('sendMove', battleId, move.basePower,-1);
                });
            });
        } catch (error) {
            console.error("Error loading moves:", error);
            alert("Failed to load moves. Please try again.");
        }
    };

    await loadMoves();
    
    // does nothing
    socket.on('newTurn', ({ turn, moves }) => {
        console.log(`It's turn ${turn}`);
    
        // Update the UI with new moves or other battle state information
        // For example, update the moves on the buttons
        moves.forEach((move, index) => {
            const button = document.querySelector(`#move${index + 1}`);
            if (button) {
                button.textContent = `${move.name} (${move.type}) - Power: ${move.basePower}`;
            }
        });
    });

    //does nothing
    socket.on("waitingForOpponent", () => {
        const logEntry = document.createElement("div");
        logEntry.textContent = "Waiting for opponent...";
        chatMessages.appendChild(logEntry);
    });

    // Listen for chat messages
    socket.on("chatMessage", ({ sender, message }) => {
        const newMessage = document.createElement("div");
        newMessage.textContent = `${sender}: ${message}`;
        chatMessages.appendChild(newMessage);
    });

    // does nothing
    socket.on("updateBattle", ({ action }) => {
        const newLogEntry = document.createElement("div");
        newLogEntry.textContent = action;
        battleLog.appendChild(newLogEntry);
    });

    // Handle chat form submission
    chatForm.addEventListener("submit", (event) => {
        event.preventDefault();
        const message = chatInput.value.trim();
        if (message) {
            socket.emit("chatMessage", { battleId, message });
            chatInput.value = ""; // Clear the input
        }
    });

    // Handle disconnection
    socket.on("disconnect", () => {
        alert("You have been disconnected from the server.");
        window.location.href = "/";
    });

    // Debugging: Receive battle details from the server if needed
    socket.on("battleDetails", ({ battleId }) => {
        console.log("Battle ID received from server:", battleId);
    });

const hp = document.getElementById("hp");
const yourPokemon = document.getElementById("your-pokemon");
const theirHp = document.getElementById("their-hp");
const theirPokemonLabel = document.getElementById("their-pokemon");
const theirPokemonIMG = document.getElementById("pokeImgOPP");
const yourPokemonIMG = document.getElementById("pokeImgPLAYER");

let player1FaintedCount = 0;
let player2FaintedCount = 0;

socket.on("turnResult", async ([yourHP, theirHP, yourMon, theirMon]) => {
    console.log(yourMon, theirMon, yourHP, theirHP);
    console.log("turn happened");

    // Update the opponent's Pokémon details
    theirPokemonLabel.innerText = theirMon;
    theirHp.innerText = "HP: " + theirHP;
    theirPokemonIMG.src = `https://play.pokemonshowdown.com/sprites/gen1/${theirMon.toLowerCase()}.png`;

    // Update the player's Pokémon details
    yourPokemon.innerText = yourMon;
    hp.innerText = "HP: " + yourHP;
    yourPokemonIMG.src = `https://play.pokemonshowdown.com/sprites/gen1/${yourMon.toLowerCase()}.png`;

    // Disable the Pokémon if HP is below or equal to 0
    if (yourHP <= 0) {
        // Disable player's Pokémon actions
        disablePokemon('your');
        player1FaintedCount++; 
    }

    if (theirHP <= 0) {
        // Disable opponent's Pokémon actions
        disablePokemon('their');
        player2FaintedCount++; // Increment the fainted count for player2
    }

    if (player1FaintedCount === 6) {
        // End the game for player 1
        console.log('Player 1 has no Pokémon left. Game Over!');
        socket.emit('gameOver', { winner: 'Player 2', message: 'Player 1 has no Pokémon left!'}); 
        return; // Stop further game processing
    }

    if (player2FaintedCount === 6) {
        // End the game for player 2
        console.log('Player 2 has no Pokémon left. Game Over!');
        socket.emit('gameOver', { winner: 'Player 1', message: 'Player 2 has no Pokémon left!'}); 
        return; // Stop further game processing
    }

    // Fetch new moves for the player
    const response = await fetch("/getRandomMoves");
    const moves = await response.json();

    if (moves.length < moveButtons.length) {
        throw new Error("Not enough moves fetched to populate buttons.");
    }

    console.log("Fetched new moves:", moves);
    sessionStorage.setItem("moves", JSON.stringify(moves));

    // Loop through buttons and enable only the ones for the active Pokémon
    moveButtons.forEach((button, index) => {
        const move = moves[index];
        button.textContent = `${move.name} (${move.type}) - Power: ${move.basePower}`;
        button.dataset.moveId = move._id; // Store the move ID for reference

        // Disable buttons for fainted Pokémon
        if (yourHP <= 0) {
            if (button.dataset.pokemon === "your") {
                button.disabled = true;
            }
        }

        if (theirHP <= 0) {
            if (button.dataset.pokemon === "their") {
                button.disabled = true;
            }
        }

        // Only allow moves if both Pokémon are still alive
        button.addEventListener("click", () => {
            if (yourHP > 0 && theirHP > 0) {
                socket.emit('sendMove', battleId, move.basePower, -1);
            }
        });
    });
});

function disablePokemon(type) {
    // Determine the elements to update based on the Pokémon type ('your' or 'their')
    const pokemonLabel = type === 'your' ? yourPokemon : theirPokemon;
    const pokemonImage = type === 'your' ? yourPokemonIMG : theirPokemonIMG;
    const hpLabel = type === 'your' ? hp : theirHp;


    pokemonLabel.innerText += " - Fainted";

    pokemonImage.src = "https://www.skullsunlimited.com/cdn/shop/products/European_Male_S-BC-107_768x768.jpg?v=1603481777";

    hpLabel.innerText = "HP: 0/100";

    moveButtons.forEach(button => {
        if(hpLa.contains(" - Fainted")){
        button.disabled = true; // Disable the button
        button.textContent = "Fainted"; // Update button text
        }
    });
}





    socket.on("loadPokemon", async ([yourHP, theirHP, yourMon, theirMon]) => {
        console.log(yourMon,theirMon,yourHP, theirHP)
        console.log("turn happened");
        theirPokemonLabel.innerText = theirMon;
        theirHp.innerText = "HP: " + theirHP;
        yourPokemon.innerText = yourMon;
        hp.innerText = "HP: " + yourHP;
        yourPokemonIMG.src = `https://play.pokemonshowdown.com/sprites/gen1/${yourMon.toLowerCase()}.png`;
        theirPokemonIMG.src = `https://play.pokemonshowdown.com/sprites/gen1/${theirMon.toLowerCase()}.png`;

    });

    function displayActivePokemon(){
        socket.emit(getActivePokemon(battleId))

    }

});
