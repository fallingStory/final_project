const place = 'menu';

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

// Ensure the DOM is fully loaded before running the script
document.addEventListener("DOMContentLoaded", async () => {
    // Get battleId and username from the URL query parameters
    const battleId = new URLSearchParams(window.location.search).get("battleId");
    const username = new URLSearchParams(window.location.search).get("user");

    const socket = io();
    socket.emit('login', (place));
    socket.emit('initializeBattle', battleId);

    // DOM elements
    const chatForm = document.getElementById("chatForm");
    const chatInput = document.getElementById("chatInput");
    const chatMessages = document.getElementById("chatMessages");
    const battleLog = document.getElementById("battleLog");
    const battleActions = document.querySelectorAll(".battleAction");
    const moveButtons = document.querySelectorAll(".moveButtons");
    const pokemonButtons = document.querySelectorAll(".pokemonButtons");

    // Battle Info
    const hp = document.getElementById("hp");
    const yourPokemon = document.getElementById("your-pokemon");
    const theirHp = document.getElementById("their-hp");
    const theirPokemonLabel = document.getElementById("their-pokemon");
    const theirPokemonIMG = document.getElementById("pokeImgOPP");
    const yourPokemonIMG = document.getElementById("pokeImgPLAYER");

    let player1FaintedCount = 0;
    let player2FaintedCount = 0;

    // Validate battleId
    if (!battleId) {
        alert("No battle ID found. Returning to the main menu.");
        window.location.href = "/";
        return;
    }

    // ----------------------------------------------------
    // Socket functions
    // ----------------------------------------------------
    // Runs when a new turn has began, updates the battle state to represent the result
    // of the players' previous moves and asks the user to select a new move
    socket.on('newTurn', battleStateInfo => {
        // For debugging purposes
        console.log(battleStateInfo);

        // Reassemble battleState, turned into struct for transmission
        const battleState = cloneBattleState(battleStateInfo);
        const botComments = battleState.botComments;

        // Print the bot's messages
        for (let i = 0; i < botComments.length; i++) {
            loadMessage('PokeBot', botComments[i]);
        }

        // Check if game is over, disable if so
        if (battleState.endState.isOver === true) {
            disableButtons();
            return;
        }

        // Re-enable buttons disabled after move
        enableButtons();

        // Declare useful variables
        const myTeam = battleState.getPlayer(socket.id).team;
        const myPokemon = battleState.getPlayerPokemon(socket.id);
        const oppPokemon = battleState.getOpponentPokemon(socket.id);

        loadBattleScreen(myPokemon, oppPokemon);
        loadMoveButtons(myPokemon, battleState.turn);
        loadPokemonButtons(myTeam, battleState.getPlayerActive(), battleState.turn);
    });

    //does nothing
    socket.on("waitingForOpponent", () => {
        const logEntry = document.createElement("div");
        logEntry.textContent = "Waiting for opponent...";
        chatMessages.appendChild(logEntry);
    });

    // Listen for chat messages
    socket.on("chatMessage", ({ sender, message }) => {
        loadMessage(sender, message);
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

    socket.on("turnResult", async ([yourHP, theirHP, yourMon, theirMon]) => {
        // Update the opponent's Pokémon details
        // Update the player's Pokémon details

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
            socket.emit('gameOver', { winner: 'Player 2', message: 'Player 1 has no Pokémon left!' });
            return; // Stop further game processing
        }

        if (player2FaintedCount === 6) {
            // End the game for player 2
            console.log('Player 2 has no Pokémon left. Game Over!');
            socket.emit('gameOver', { winner: 'Player 1', message: 'Player 2 has no Pokémon left!' });
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
            if (hpLa.contains(" - Fainted")) {
                button.disabled = true; // Disable the button
                button.textContent = "Fainted"; // Update button text
            }
        });
    }

    socket.on("loadPokemon", async ([yourHP, theirHP, yourMon, theirMon]) => {
        console.log(yourMon, theirMon, yourHP, theirHP)
        console.log("turn happened");
        theirPokemonLabel.innerText = theirMon;
        theirHp.innerText = "HP: " + theirHP;
        yourPokemon.innerText = yourMon;
        hp.innerText = "HP: " + yourHP;
        yourPokemonIMG.src = `https://play.pokemonshowdown.com/sprites/gen1/${yourMon.toLowerCase()}.png`;
        theirPokemonIMG.src = `https://play.pokemonshowdown.com/sprites/gen1/${theirMon.toLowerCase()}.png`;

    });

    // ----------------------------------------------------
    // Util functions
    // ----------------------------------------------------
    function loadBattleScreen(myPokemon, oppPokemon) {
        // Update the player's Pokémon details
        yourPokemon.innerText = myPokemon.name;
        hp.innerText = "HP: " + myPokemon.stats[0];
        yourPokemonIMG.src = myPokemon.image;

        // Update the opponent's Pokémon details
        theirPokemonLabel.innerText = oppPokemon.name;
        theirHp.innerText = "HP: " + oppPokemon.stats[0];
        theirPokemonIMG.src = oppPokemon.image;
    }

    function loadMoveButtons(myPokemon, turn) {
        // Fill in the moves
        const moves = myPokemon.moves;
        for (let i = 0; i < moves.length; i++) {
            // Get the variables
            let move = moves[i];
            let button = document.querySelector(`#move${i + 1}`);

            // Update the button
            let text = `${move.name} (${move.type}) - Power: ${move.pow}`;
            button.textContent = text;

            // Add event listener
            if (turn === 1) button.addEventListener("click", () => {
                const move = {
                    type: 'attack',
                    target: 'enemy',
                    model: move
                };
                socket.emit('move', move);
                disableButtons()
            });
        }

        // In case we don't have 4 moves
        if (moves.length >= 4) return;
        for (let i = moves.length; i < 4; i++) {
            let button = document.querySelector(`#move${i + 1}`);
            button.textContent = "-";
            button.disabled = true;
        }

    }

    // curActive = index of the currently active pokemon
    function loadPokemonButtons(myTeam, curActive, turn) {
        for (let i = 0; i < myTeam.length; i++) {
            let pokemon = myTeam[i];
            let button = pokemonButtons[i];

            button.textContent = `${pokemon.name}`;
            button.dataset.pokemonId = `${pokemon._id}`;
            if (turn === 1) button.addEventListener("click", () => {
                const move = {
                    type: 'switch',
                    target: i,
                };
                socket.emit('move', move);
                disableButtons();
            });

            // Don't let the player switch in their own pokemon
            if (i == curActive) {
                button.disabled = true;
            }
            else {
                button.disabled = false;
            }
        }
    }

    function loadMessage(sender, message) {
        const newMessage = document.createElement("div");
        newMessage.textContent = `${sender}: ${message}`;
        chatMessages.appendChild(newMessage);
    }

    function cloneBattleState(battleStateInfo) {
        const battleState = new BattleState(
            battleStateInfo.id,
            battleStateInfo.playerA,
            battleStateInfo.playerB
        );
        battleState.turn = battleStateInfo.turn;
        battleState.AActivePokemon = battleStateInfo.AActivePokemon;
        battleState.BActivePokemon = battleStateInfo.BActivePokemon;
        battleState.AMove = battleStateInfo.AMove;
        battleState.BMove = battleStateInfo.BMove;
        battleState.over = battleStateInfo.over;
        battleState.botComments = battleStateInfo.botComments;

        return battleState;
    }

    function disableButtons() {
        pokemonButtons.forEach((button, index) => {
            button.disabled = true;
        });

        moveButtons.forEach((button, index) => {
            button.disabled = true;
        });
    }

    function enableButtons() {
        pokemonButtons.forEach((button, index) => {
            button.disabled = false;
        });

        moveButtons.forEach((button, index) => {
            button.disabled = false;
        });
    }

});
