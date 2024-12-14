const socket = io(); // Connect to the server
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

const place = 'menu';
socket.emit('login', (place));

// Listen for a battle start
socket.on("battleStart", ({ battleId, opponent }) => {
    window.location.href = `/battle?battleId=${battleId}&user=${username}`;
});

// Listen for waiting feedback
socket.on("waitingForBattle", () => {
    battleMessage.textContent = "Waiting for a friend to join the battle...";
});

// Listen for disconnection
socket.on("disconnect", () => {
    alert("You have been disconnected from the server.");
});
const logoutButton = document.getElementById("logout-button")
const logoutForm = document.getElementById("logout-form")
logoutButton.addEventListener("submit", (event) => {
    socket.emit("logout")
})