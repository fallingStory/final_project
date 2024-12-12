// Ensure the DOM is fully loaded before running the script
document.addEventListener("DOMContentLoaded", () => {
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

    const loadPokemon = async() => {
        try{
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
            });
        }
        catch {
            console.error("Error loading pokemon:");
            alert("Failed to load pokemon. Please try again.");
        }
    }

    loadPokemon()

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
            });
        } catch (error) {
            console.error("Error loading moves:", error);
            alert("Failed to load moves. Please try again.");
        }
    };

    // Load moves when the DOM is ready
    loadMoves();

    const getActivePokemon = async () => {
        console.log("getting active pokemon")

    }

    // Listen for turn result (new turn from server)
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

    socket.on("turnResult", (result) => {
        result.actions.forEach(action => {
            const logEntry = document.createElement("div");
            logEntry.textContent = `${action.player} used ${action.move}: ${action.outcome}`;
            chatMessages.appendChild(logEntry);
        });
    });

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

    // Listen for battle updates
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
});
