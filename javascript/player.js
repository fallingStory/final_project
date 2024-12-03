class Player {
    constructor(username, password) {
        this.username = username;
        this.password = password;
        this.team = null;
    }

    setTeam(newTeam) {
        this.team = newTeam
    }
}