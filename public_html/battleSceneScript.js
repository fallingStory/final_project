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

            console.log("Fetched new Pokémon:", pokemon);
            // Save the fetched Pokémon to sessionStorage
            sessionStorage.setItem("pokemon", JSON.stringify(pokemon));
        }

        pokemonButtons.forEach((button, index) => {
            const mon = pokemon[index];

            // Set button text and ID
            button.textContent = `${mon.name}`;
            button.dataset.pokemonId = `${mon._id}`;

            // Create image element
            const imgElement = document.createElement("img");
            imgElement.src = mon.img; // Set the Pokémon's image
            imgElement.alt = mon.name;
            imgElement.style.width = "50px"; // Adjust size as needed
            imgElement.style.height = "50px";

            // Clear existing content and append the image and text
            button.innerHTML = ""; // Clear existing content
            button.appendChild(imgElement);
            button.appendChild(document.createTextNode(` ${mon.name}`));

            // Add click event listener
            button.addEventListener("click", () => {
                // Update player's Pokémon image
                const playerImg = document.querySelector('img[name="pokemonIMGPLA"]');
                playerImg.src = `https://play.pokemonshowdown.com/sprites/gen1/${mon.name.toLowerCase()}.png`; // Use the Pokémon's name directly
                playerImg.alt = mon.name;

                // Emit player's Pokémon selection to the server
                socket.emit("playerSelectPokemon", battleId, mon, (response) => {
                    if (response.success) {
                        console.log("Player's Pokémon selected:", mon.name);
                    } else {
                        console.error("Failed to send player's Pokémon selection");
                    }
                });
            });
        });

        // Listen for the opponent's Pokémon selection from the server
        socket.on("opponentSelectPokemon", (opponentPokemon) => {
            console.log("Opponent's selected Pokémon:", opponentPokemon);

            const opponentName = document.querySelector("#their-pokemon").textContent.trim().toLowerCase();
            const opponentImg = document.querySelector('img[name="pokemonIMGOPP"]');
                opponentImg.src = "https://play.pokemonshowdown.com/sprites/gen1/charmander.png"; 
                opponentImg.alt = opponentPokemon.name;
            
        });

        // Emit the event to get Pokémon data for both players
        socket.emit("getPokemon", pokemon, battleId, (response) => {
            if (response.success) {
                console.log("Pokémon data successfully loaded.");
            } else {
                console.error("Failed to get Pokémon data.");
            }
        });
    } catch (error) {
        console.error("Error loading pokemon:", error);
        alert("Failed to load Pokémon. Please try again.");
    }
};

await loadPokemon();

    
    
    

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

    const hp = document.getElementById("hp")
    const yourPokemon = document.getElementById("your-pokemon")

    const theirHp = document.getElementById("their-hp")
    const theirPokemonLabel = document.getElementById("their-pokemon")


    socket.on("turnResult", async ([yourHP, theirHP, yourMon, theirMon]) => {
        console.log(yourMon,theirMon,yourHP, theirHP)
        console.log("turn happened");
        theirPokemonLabel.innerText = theirMon;
        theirHp.innerText = "HP: " + theirHP;
        yourPokemon.innerText = yourMon;
        hp.innerText = "HP: " + yourHP;
        

        const response = await fetch("/getRandomMoves");
            moves = await response.json();
            if (moves.length < moveButtons.length) {
                throw new Error("Not enough moves fetched to populate buttons.");
            }
            console.log("Fetched new moves:", moves);
            // Save the fetched moves to sessionStorage
            sessionStorage.setItem("moves", JSON.stringify(moves));
            moveButtons.forEach((button, index) => {
                const move = moves[index];
                button.textContent = `${move.name} (${move.type}) - Power: ${move.basePower}`;
                button.dataset.moveId = move._id; // Store the move ID for reference
                console.log(move.basePower)
                button.addEventListener("click", () => {
                    socket.emit('sendMove', battleId, move.basePower,-1);
                });
            });
    });

    socket.on("loadPokemon", async ([yourHP, theirHP, yourMon, theirMon]) => {
        console.log(yourMon,theirMon,yourHP, theirHP)
        console.log("turn happened");
        theirPokemonLabel.innerText = theirMon;
        theirHp.innerText = "HP: " + theirHP;
        yourPokemon.innerText = yourMon;
        hp.innerText = "HP: " + yourHP;
    });

    function displayActivePokemon(){
        socket.emit(getActivePokemon(battleId))

    }

});
