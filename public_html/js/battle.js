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
            return this.playerB.team[this.getOpponentActive(playerID)];
        }
        return this.playerA.team[this.getOpponentActive(playerID)];
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
            let oldButton = document.getElementById(`move${i + 1}`);

            // Make the new text
            let text = `${move.name} (${move.type}) - Power: ${move.pow}`;

            // Create a new button
            // Needed to erase the old event listener
            let newButton = document.createElement('button');
            newButton.id = `move${i + 1}`;
            newButton.className = 'moveButtons';
            newButton.textContent = text;

            // Add event listener
            newButton.addEventListener("click", () => {
                const moveInfo = {
                    type: 'attack',
                    target: 'enemy',
                    model: move
                };
                socket.emit('move', moveInfo);
                disableButtons()
            });

            // Replace it
            oldButton.parentNode.replaceChild(newButton, oldButton);
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
            let oldButton = document.getElementById(`pokemon${i + 1}`);

            // Create a new button
            // Needed to erase the old event listener
            let newButton = document.createElement('button');
            newButton.textContent = `${pokemon.name}`;
            newButton.className = 'pokemonButtons';
            newButton.id = `pokemon${i + 1}`;
            newButton.dataset.pokemonId = `${pokemon._id}`;
            newButton.addEventListener("click", () => {
                const move = {
                    type: 'switch',
                    target: i,
                };
                socket.emit('move', move);
                disableButtons();
            });

            // Replace it
            oldButton.parentNode.replaceChild(newButton, oldButton);

            // Don't let the player switch in their own pokemon
            if (i == curActive || pokemon.stats[0] === 0) {
                newButton.disabled = true;
            }
            else {
                newButton.disabled = false;
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
        let pokemonButtons = document.getElementsByClassName('pokemonButtons');
        for (let i = 0; i < pokemonButtons.length; i++) {
            let button = pokemonButtons[i];
            button.disabled = true;
        }

        let moveButtons = document.getElementsByClassName('moveButtons');
        for (let i = 0; i < moveButtons.length; i++) {
            let button = moveButtons[i];
            button.disabled = true;
        }
    }

    function enableButtons() {
        let pokemonButtons = document.getElementsByClassName('pokemonButtons');
        for (let i = 0; i < pokemonButtons.length; i++) {
            let button = pokemonButtons[i];
            button.disabled = false;
        }

        let moveButtons = document.getElementsByClassName('moveButtons');
        for (let i = 0; i < moveButtons.length; i++) {
            let button = moveButtons[i];
            button.disabled = false;
        }
    }

});
