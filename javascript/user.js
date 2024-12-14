const menuUsers = [];
const battleUsers = [];

// Join users to char
function userJoin(id, username, team, place) {
    const user = {
        id,         // Socket ID
        username,   // Username
        team        // Team
    };
    if (place == 'menu') {
        menuUsers.push(user);
    }
    else if (place == 'battle') {
        battleUsers.push(user)
    }
    return user;
}

// Get current user
function getCurrentUser(id, place) {
    let userArray = (place == 'menu') ? menuUsers : battleUsers;
    return userArray.find(user => id === user.id);
}

// User leaves
function userLeave(id, place) {
    let userArray = (place == 'menu') ? menuUsers : battleUsers;
    //console.log(userArray);
    const index = userArray.findIndex(user => user.id === id);

    if (index !== 1) {
        return userArray.splice(index, 1)[0];
    }
}

module.exports = {
    userJoin,
    getCurrentUser,
    userLeave,
};