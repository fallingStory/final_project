const socket = io("http://localhost:3000"); // Connect to the server
const findBattleForm = document.getElementById("findBattleForm");
const battleMessage = document.getElementById("battleMessage");
const username = document.getElementById("userInfo").getAttribute("data-username");

// Emit 'findBattle' when the form is submitted
findBattleForm.addEventListener("submit", (event) => {
    console.log("hi")
    event.preventDefault();
    const friendName = document.getElementById("friendName").value.trim();

    if (!friendName) {
        battleMessage.textContent = "Please enter a friend's name.";
        return;
    }
    socket.emit("findBattle", { username, friendName });
    battleMessage.textContent = "Looking for a battle...";
});

// Listen for a battle start
socket.on("battleStart", ({ battleId, opponent }) => {
    window.location.href = `/battleScene?battleId=${battleId}`;
});

// Listen for waiting feedback
socket.on("waitingForBattle", () => {
    battleMessage.textContent = "Waiting for a friend to join the battle...";
});

// Listen for disconnection
socket.on("disconnect", () => {
    alert("You have been disconnected from the server.");
});