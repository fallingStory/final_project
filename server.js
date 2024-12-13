const { MongoClient } = require('mongodb');
require('dotenv').config(); // required to access mongo database

// Mongo imports
const uri = process.env.MONGO_URI;
const client = new MongoClient(uri, {});
const path = require('path');

// Express
const express = require('express');
const app = express();
const flash = require('express-flash');
const session = require('express-session');

// Socket server stuff
const http = require('http');
const server = http.createServer(app);
const socketio = require('socket.io');
const io = socketio(server);
const sharedSession = require('express-socket.io-session');

// Our modules
const { PKMNTOID, IDTOPKMN, Pokemon, getPokemonModels } = require('./javascript/pokemon');
const { userJoin, getCurrentUser, userLeave, } = require('./javascript/user');
const { Move } = require('./javascript/move');

const port = 3000;

// Main function is neccessary to use getPokemonModels, requires await
async function main() {

    const models = await getPokemonModels(client);

    app.set('views', path.join(__dirname, "public_html")); //file where public ejs/html/css/js are
    app.use(express.static("public_html")); //static files use things in public_html
    app.set('view-engine', 'ejs'); //i don't know what this does
    app.use(express.urlencoded({ extended: false })); //or this
    app.use(flash()); //flash is what shows messages (ie username not found)

    //make a session
    //i don't know what this stuff is and SESSION_SECRET doesn't exist
    //it always reaches default-secret-key
    const sessionMiddleware = session({
        secret: process.env.SESSION_SECRET || 'default-secret-key',
        resave: false,
        saveUninitialized: false,
    });
    app.use(sessionMiddleware);

    //set up shared session with Socket.io
    io.use(sharedSession(sessionMiddleware, {
        autoSave: true
    }));

    // ----------------------------------------
    // Express routes
    // ----------------------------------------
    app.get('/', checkAuthenticated, (req, res) => {
        res.render('mainMenu.ejs', { name: req.session.username });
    });

    app.get('/login', checkNotAuthenticated, (req, res) => {
        const message = req.query.message || '';
        res.render('login.ejs', { message });
    });

    app.post('/login', checkNotAuthenticated, async (req, res) => {
        const { username } = req.body;

        try {
            await client.connect();
            const database = client.db("Users");
            const collection = database.collection("users");

            const user = await collection.findOne({ username: username });
            if (user == null) {
                req.flash('error', 'Invalid username');
                return res.redirect('/login');
            }
            //when you log in set the session's user id and username
            req.session.userId = user._id;
            req.session.username = user.username;
            res.redirect('/');
        } catch (err) {
            console.error(err);
            res.status(500).send("Internal Server Error");
        } finally {
            await client.close();
        }
    });

    app.get('/register', checkNotAuthenticated, (req, res) => {
        res.render('register.ejs', { messages: req.flash() });
    });

    app.post('/register', checkNotAuthenticated, async (req, res) => {
        const { username } = req.body;

        try {
            await client.connect();
            const database = client.db("Users");
            const collection = database.collection("users");

            const userFound = await collection.findOne({ username: username });

            if (userFound == null) {
                await collection.insertOne({ username: username });
                res.redirect('/login');
            } else {
                req.flash('error', 'Username taken');
                res.redirect('/register');
            }
        } catch {
            res.redirect('/register');
        } finally {
            await client.close();
        }
    });

    //when user clicks find battle do this stuff
    app.post('/findBattle', checkAuthenticated, (req, res) => {
        const { friendName } = req.body;
        const username = req.session.username;
        const socketId = req.session.socketId;

        if (!friendName || friendName.trim() === '') {
            req.flash('error', 'Friend name is required');
            return res.redirect('/');
        }

        if (!socketId) {
            req.flash('error', 'Unable to initiate battle. Please reconnect.');
            return res.redirect('/');
        }

        const friend = waitingPlayers.find(p => p.username === friendName && p.friendName === username);

        if (friend) {
            const battleId = `${friendName}-${username}`;
            battles[battleId] = { player1: friend.username, player2: username };

            io.to(friend.socketId).emit('battleStart', { battleId, opponent: username });
            io.to(socketId).emit('battleStart', { battleId, opponent: friendName });

            waitingPlayers = waitingPlayers.filter(p => p !== friend);
            //req.flash('info', 'Battle found!');
            res.redirect(`/battleScene?battleId=${battleId}`);
        } else {
            waitingPlayers.push({ socketId, username, friendName });
            req.flash('info', 'Looking for a battle...');
            res.redirect('/');
        }
    });

    app.get('/battleScene', checkAuthenticated, (req, res) => {
        const battleId = req.query.battleId;
        //console.log(battleId)
        const battle = battles[battleId];

        if (!battle) {
            return res.status(404).send("Battle not found");
        }

        res.render('battleScene.ejs', {
            battleId,
            opponent: battle.player1 === req.session.username ? battle.player2 : battle.player1
        });
    });

    app.get('/getRandomMoves', checkAuthenticated, async (req, res) => {
        try {
            await client.connect();
            const database = client.db("MovesDB");
            const movesCollection = database.collection("moves");

            // Fetch a random sample of 4 moves
            const moves = await movesCollection.aggregate([{ $sample: { size: 4 } }]).toArray();
            res.json(moves);
        } catch (err) {
            console.error(err);
            res.status(500).send("Error fetching moves");
        } finally {
            await client.close();
        }
    });

    app.get('/getRandomPokemon', checkAuthenticated, async (req, res) => {
        try {
            await client.connect();
            const pokemonDB = client.db("PokemonDB");
            const pokemonCollection = pokemonDB.collection("pokemon");

            // Fetch a random sample of 4 moves
            const pokemon = await pokemonCollection.aggregate([{ $sample: { size: 6 } }]).toArray();
            res.json(pokemon);
        } catch (err) {
            console.error(err);
            res.status(500).send("Error fetching pokemon");
        } finally {
            await client.close();
        }
    });


    app.delete('/logout', (req, res) => {
        req.session.destroy();
        res.redirect('/login');
    });

    // Authentication check functions
    function checkAuthenticated(req, res, next) {
        if (req.session.userId) {
            return next();
        }
        res.redirect('/login');
    }

    function checkNotAuthenticated(req, res, next) {
        if (req.session.userId) {
            return res.redirect('/');
        }
        next();
    }

    // ----------------------------------------
    // Socket.io for real-time interactions
    // ----------------------------------------
    let waitingPlayers = []; // Queue for players looking for a match
    let battles = {}; // Store active battles

    io.on('connection', (socket) => {
        const session = socket.handshake.session;
        if (session) {
            session.socketId = socket.id;
            session.save();
        }

        socket.on('login', ({ username }) => {
            console.log(`${username} has logged in with ID: ${socket.id}`);
            getDefaultTeam().then(team => {
                userJoin(socket.id, username, team);
                socket.emit('loadInfo', { team });
            });
        });

        socket.on('disconnect', () => {
            const user = userLeave(socket.id);
            console.log(`${user.username} has disconnected with ID: ${user.id}`);
            waitingPlayers = waitingPlayers.filter(p => p.socketId !== socket.id);
        });

        socket.on('saveSocketId', (sessionId) => {
            const session = sessions[sessionId];
            if (session) {
                session.socketId = socket.id;
            }
        });

        socket.on('findBattle', ({ username, friendName }) => {
            //console.log(`Received findBattle event: username=${username}, friendName=${friendName}`);
            const friend = waitingPlayers.find(p => p.username === friendName && p.friendName === username);
            //console.log('Found friend:', friend);

            console.log(`${getCurrentUser(socket.id).id}`);

            if (friend) {
                const battleId = `${friendName}-${username}`;
                battles[battleId] = { player1: friend.username, player2: username };

                io.to(friend.socketId).emit('battleStart', { battleId, opponent: username });
                socket.emit('battleStart', { battleId, opponent: friendName });

                waitingPlayers = waitingPlayers.filter(p => p !== friend);
            } else {
                waitingPlayers.push({ socketId: socket.id, username, friendName });
                socket.emit('waitingForBattle');
            }
        });

        socket.on('chatMessage', ({ battleId, message }) => {
            if (!battles[battleId]) {
                socket.emit('error', { message: 'Battle not found' });
                return;
            }
            const sender = socket.handshake.session.username || 'Anonymous';
            io.to(battleId).emit('chatMessage', { sender, message });
        });

        socket.on('battleAction', ({ battleId, action }) => {
            const battle = battles[battleId];
            if (!battle) {
                socket.emit('error', { message: 'Battle not found' });
                return;
            }

            // Increment the turn number (this example assumes players take turns)
            battle.turn += 1;

            // Send an updated move to the players at the start of a new turn
            io.to(battleId).emit('newTurn', {
                turn: battle.turn,
                moves: battle.moves, // or fetch new moves here
                pokemon: battle.pokemon
            });

            // Optionally, update battle state here (like calculating damage or actions)
            io.to(battleId).emit('updateBattle', { action });
        });

        socket.on('joinBattle', ({ battleId }) => {
            if (battles[battleId]) {
                socket.join(battleId);
                console.log(`Socket ${socket.id} joined battle ${battleId}`);
            } else {
                console.log(`Battle ${battleId} not found`);
            }
        });
    });

    // Generate the default team
    async function getDefaultTeam() {
        let pikachu = new Pokemon(models[PKMNTOID['PIKACHU']], [
            new Move('Scratch', "No additional effect", "Normal", "Physical", 40, 100, 56, null, 0)
        ]);
        let charizard = new Pokemon(models[PKMNTOID['CHARIZARD']], [
            new Move('Scratch', "No additional effect", "Normal", "Physical", 40, 100, 56, null, 0)
        ]);
        let venusaur = new Pokemon(models[PKMNTOID['VENUSAUR']], [
            new Move('Scratch', "No additional effect", "Normal", "Physical", 40, 100, 56, null, 0)
        ]);
        let blastoise = new Pokemon(models[PKMNTOID['BLASTOISE']], [
            new Move('Scratch', "No additional effect", "Normal", "Physical", 40, 100, 56, null, 0)
        ]);
        let snorlax = new Pokemon(models[PKMNTOID['SNORLAX']], [
            new Move('Scratch', "No additional effect", "Normal", "Physical", 40, 100, 56, null, 0)
        ]);
        let lapras = new Pokemon(models[PKMNTOID['LAPRAS']], [
            new Move('Scratch', "No additional effect", "Normal", "Physical", 40, 100, 56, null, 0)
        ]);
        return [pikachu, charizard, venusaur, blastoise, snorlax, lapras];
    }

    server.listen(port, () => {
        console.log(`Server is running on http://localhost:${port}`);
    });

}

main();