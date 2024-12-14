const { MongoClient } = require('mongodb');
const express = require('express');
const app = express();
const port = process.env.PORT || 3000;
require('dotenv').config();

const uri = process.env.MONGO_URI;
const client = new MongoClient(uri, {});
const path = require('path');
const flash = require('express-flash');
const session = require('express-session');
const http = require('http');
const { Server } = require('socket.io');
const server = http.createServer(app);
const io = new Server(server);
const sharedSession = require('express-socket.io-session');

// Our modules
const { BattleState, createBattle, getCurrentBattle, closeBattle } = require('./javascript/battleUtils');
const { Move } = require('./javascript/pokemon');
const { PKMNTOID, IDTOPKMN, Pokemon, getPokemonModels, getDefaultTeam } = require('./javascript/pokemon');
const { userJoin, getCurrentUser, userLeave } = require('./javascript/user');

async function main() {
    // Load all the 151 pokemon on server startup
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

    // ----------------------------------------------------
    // EXPRESS ROUTES
    // ----------------------------------------------------
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

    async function delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    //when user clicks find battle do this stuff
    app.post('/findBattle', checkAuthenticated, async (req, res) => {
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
            battles[battleId] = {
                player1: { username: friend.username, pokemon: [] },
                player2: { username: username, pokemon: [] }
            };

            battles[battleId].userSocketId = socketId;
            battles[battleId].oppSocketId = friend.socketId;

            // Trigger the battleStart socket events
            io.to(friend.socketId).emit('battleStart', { battleId, opponent: username });
            io.to(socketId).emit('battleStart', { battleId, opponent: friendName });

            waitingPlayers = waitingPlayers.filter(p => p !== friend);

            res.redirect(`/battle?battleId=${battleId}&user=${req.session.username}`);
        } else {
            waitingPlayers.push({ socketId, username, friendName });
            req.flash('info', 'Looking for a battle...');
            res.redirect('/');
        }
    });

    app.get('/battle', checkAuthenticated, (req, res) => {
        const battleId = req.query.battleId;
        const battle = battles[battleId];

        if (!battle) {
            return res.status(404).send("Battle not found");
        }

        res.render('battle.ejs', {
            battleId,
            opponent: battle.player1 === req.session.username ? battle.player2 : battle.player1
        });
    });

    /*app.get('/getRandomMoves', checkAuthenticated, async (req, res) => {
        try {
            console.log("TRYING TO GET MOVES")
            await client.connect();
            const database = client.db("MovesDB");
            const movesCollection = database.collection("moves");
            // Fetch a random sample of 4 moves
            const moves = await movesCollection.aggregate([{ $sample: { size: 4 } }]).toArray();
            //await delay(100); 
            console.log("MOVE WERE FOUND WHAT")
            res.json(moves);
        } catch (err) {
            console.error(err);
            res.status(500).send("Error fetching moves");
        } finally {
            //await client.close();
        }
    });*/

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

    // ----------------------------------------------------
    // Socket.io stuff
    // ----------------------------------------------------
    let waitingPlayers = []; // Queue for players looking for a match
    let battles = {}; // Store active battles

    io.on('connection', (socket) => {
        const session = socket.handshake.session;

        if (session && session.username) {
            // Check if the user is currently in a battle and update the socket ID
            for (let battleId in battles) {
                const battle = battles[battleId];

                // Update player1 socket if the username matches
                if (battle.player1.username === session.username) {
                    battle.player1.socketId = socket.id;
                    console.log(`Updated player1's socket ID in battle ${battleId}`);
                }

                // Update player2 socket if the username matches
                if (battle.player2.username === session.username) {
                    battle.player2.socketId = socket.id;
                    console.log(`Updated player2's socket ID in battle ${battleId}`);
                }
            }
        }

        socket.on('login', (origin) => {
            // Update the session's socketID
            session.socketId = socket.id;
            session.origin = origin;
            session.save((err) => {
                if (err) console.error("Session save error:", err);
            });

            // Add the user to the user arrays
            const user = userJoin(socket.id, session.username, getDefaultTeam(models), origin);
            console.log(`User ${user.username} has joined ${origin}, ID: ${socket.id}.`)
        });

        socket.on('disconnect', () => {
            // Remove the user from our user arrays
            //console.log(`Preparing to disconnect ${session.username} with ID ${socket.id} from ${session.origin}`);
            userLeave(socket.id, session.origin);
            console.log(`User ${session.username} has left ${session.origin}, ID: ${socket.id}`);

            // Remove user from waiting players list if they're disconnected
            waitingPlayers = waitingPlayers.filter(p => p.socketId !== socket.id);

            // If the user is part of a battle, you might need to handle disconnection cleanup here
            for (let battleId in battles) {
                const battle = battles[battleId];

                // Check if the player was part of this battle and clean up their data
                if (battle.player1.socketId === socket.id) {
                    console.log(`Player1 disconnected in battle ${battleId}`);
                    battle.player1.socketId = null; // Reset or clean up as needed
                }

                if (battle.player2.socketId === socket.id) {
                    console.log(`Player2 disconnected in battle ${battleId}`);
                    battle.player2.socketId = null; // Reset or clean up as needed
                }
            }
        });

        socket.on('changeActivePokemon', (battleId, index) => {
            battles[battleId].activeIndex = index;
        })

        socket.on('getActivePokemon', (battleId) => {
            socket.emit("gotActivePokemon", battles[battleId].activeIndex, battles[battleId])
        })

        socket.on('getPokemon', (pokemon, battleId) => {
            const username = socket.handshake.session.username;
            const battle = battles[battleId];

            if (!battle) {
                console.error(`Battle with ID ${battleId} not found.`);
                return;
            }

            // Determine if the user is player1 or player2
            let playerKey;
            if (battle.player1.username === username) {
                playerKey = 'player1';
            } else if (battle.player2.username === username) {
                playerKey = 'player2';
            } else {
                console.error(`User ${username} not found in battle ${battleId}.`);
                return;
            }


            // Assign Pokémon data to the correct player
            battle[playerKey].pokemon = pokemon;
            console.log(battle[playerKey].pokemon)
            //battle[playerKey].activeIndex = 0; // Set active Pokémon index to 0 by default
            battle[playerKey].currentPokemon = battle[playerKey].pokemon.map(p => {
                const att = (parseInt(p.baseStats.atk + p.baseStats.spa)) * 2 + 5;
                const def = (parseInt(p.baseStats.def + p.baseStats.spd)) * 2 + 5;
                const hp = ((parseInt(p.baseStats.hp)) * 2 + 10 + 100) * 2;
                return new Pokemon(p.name, p.id, att, def, hp, p.baseStats.spe, p.types, 0);
            });


            // Ensure the socket ID is updated in the battle structure
            battle[playerKey].socketId = socket.id;
            battle[playerKey].ready = true;
            if (battle.player1.ready && battle.player2.ready) {
                updateBattle(battleId); // Call updateBattle when both players are ready
            }
        });

        function updateBattle(battleId) {
            const battle = battles[battleId]
            const p1mon = battle.player1.currentPokemon[battle.player1.activeIndex]
            const p2mon = battle.player2.currentPokemon[battle.player2.activeIndex]

            io.to(battle.player1.socketId).emit('loadPokemon', [p1mon.hp, p2mon.hp, p1mon.name, p2mon.name])
            io.to(battle.player2.socketId).emit('loadPokemon', [p2mon.hp, p1mon.hp, p2mon.name, p1mon.name])
        }

        socket.on('sendMove', (battleId, move, swap) => {
            const battle = battles[battleId]
            if (!battle) {
                socket.emit('error', { message: 'Battle not found' });
                return;
            }
            if (socket.id === battle.player1.socketId) {
                sender = 'player1';
                if (swap === -1) {
                    battle.player1.move = move
                } else {
                    battle.player1.activeIndex = swap
                    battle.player1.move = move
                }

            }

            if (socket.id === battle.player2.socketId) {
                sender = 'player2';
                if (swap === -1) {
                    battle.player2.move = move
                } else {
                    battle.player2.activeIndex = swap
                    battle.player2.move = move
                }
            }

            // Record the move for the sender
            battle[sender].move = move;
            // Check if both players have made a move
            if (battle.player1.move != null && battle.player2.move != null) {
                processTurn(battleId);
            }
        })

        function processTurn(battleId) {
            const battle = battles[battleId];
            if (!battle) {
                console.error(`Battle ID ${battleId} not found`);
                return;
            }
            // Extract player moves
            const p1mon = battle.player1.currentPokemon[battle.player1.activeIndex]
            const p2mon = battle.player2.currentPokemon[battle.player2.activeIndex]

            const move1 = Math.round((42 * parseInt(battle.player1.move) * (p1mon.att / p2mon.def)) / 50)
            const move2 = Math.round((42 * parseInt(battle.player2.move) * (p2mon.att / p1mon.def)) / 50)

            // Process the moves (simplified example)
            p1mon.hp -= move2
            p2mon.hp -= move1

            // Clear moves for the next turn
            battle.player1.move = null;
            battle.player2.move = null;

            // Notify players of the result
            io.to(battle.player1.socketId).emit('turnResult', [p1mon.hp, p2mon.hp, p1mon.name, p2mon.name])
            io.to(battle.player2.socketId).emit('turnResult', [p2mon.hp, p1mon.hp, p2mon.name, p1mon.name])

            // io.to(battle.player2.socketId).emit('turnResult', {
            //     yourMove: move2,
            //     opponentMove: move1,
            //     yourPokemon: battle.player2.currentPokemon,
            //     opponentPokemon: battle.player1.currentPokemon
            // });

            console.log('Turn processed successfully');
        }

        class Pokemon {
            constructor(name, id, att, def, hp, spe, type, dead) {
                this.name = name;
                this.id = id;
                this.att = att;
                this.def = def;
                this.hp = hp;
                this.spe = spe;
                this.type = type;
                this.dead = dead;
            }
        }

        socket.on('findBattle', async ({ username, friendName }) => {
            // Server recieves a battle event of a player seeking a friend
            const friend = waitingPlayers.find(p => p.username === friendName && p.friendName === username);
            if (friend) {
                // If friend is active, connect and start battle
                const battleId = `${friendName}-${username}`;
                battles[battleId] = {
                    player1: { username: friend.username, socketId: friend.socketId, move: null, activeIndex: 0, ready: false },
                    player2: { username: username, socketId: socket.id, move: null, activeIndex: 0, ready: false },
                };

                io.to(friend.socketId).emit('battleStart', { battleId, opponent: username });
                socket.emit('battleStart', { battleId, opponent: friendName });

                waitingPlayers = waitingPlayers.filter(p => p !== friend);
            } else {
                // Else onto the queue
                waitingPlayers.push({ socketId: socket.id, username, friendName });
                socket.emit('waitingForBattle');
            }
        });

        socket.on('chatMessage', ({ battleId, message }) => {
            if (!battles[battleId]) {
                socket.emit('error', { message: 'Battle not found' });
                return;
            }
            console.log("testing123")
            const sender = socket.handshake.session.username || 'Anonymous';
            io.to(battleId).emit('chatMessage', { sender, message });
        });


        socket.on('joinBattle', ({ battleId }) => {
            if (battles[battleId]) {
                socket.join(battleId);
            }
        });
    });

    server.listen(port, () => {
        console.log('Server is running on http://localhost:3000/');
    });
}

main();