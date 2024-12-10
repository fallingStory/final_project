class Pokemon {
    constructor(name, type, moves, image, hp, attack, defense, special, speed) {
        this.name = name;
        this.nickname = name;
        this.type = type;
        this.moves = moves;
        this.image = image;
        this.level = 100;
        this.condition = null;
        this.hp = hp;
        this.attack = attack;
        this.defense = defense;
        this.special = special;
        this.speed = speed;
    }
}