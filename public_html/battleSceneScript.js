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

    // Validate battleId
    if (!battleId) {
        alert("No battle ID found. Returning to the main menu.");
        window.location.href = "/";
        return;
    }

    // Join the battle room
    socket.emit("joinBattle", { battleId });

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

    // Handle battle actions
    battleActions.forEach(actionButton => {
        actionButton.addEventListener("click", () => {
            console.log("moveClicked")
            const action = actionButton.dataset.action;
            socket.emit("battleAction", { battleId, action });
        });
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
