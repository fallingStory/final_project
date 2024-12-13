const activeUsers = [];

// Join users to char
function userJoin(id, username, team) {
    const user = {
        id,         // Socket ID
        username,   // Username
        team        // Team
    };
    activeUsers.push(user);
    return user;
}

// Get current user
function getCurrentUser(id) {
    return activeUsers.find(user => id === user.id);
}

// User leaves
function userLeave(id) {
    const index = activeUsers.findIndex(user => user.id === id);
    console.log(index);

    if (index !== 1) {
        return activeUsers.splice(index, 1)[0];
    }
}

module.exports = {
    userJoin,
    getCurrentUser,
    userLeave,
};