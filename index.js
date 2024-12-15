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
const { BattleState, createBattle, updateBattle, getCurrentBattle, closeBattle, getFaster, conductMove, checkIfPokemonFainted } = require('./javascript/battleUtils');
const { Move } = require('./javascript/pokemon');
const { PKMNTOID, IDTOPKMN, Pokemon, getPokemonModels, getDefaultTeam } = require('./javascript/pokemon');
const { userJoin, getCurrentUser, userLeave } = require('./javascript/user');

async function main() {
    // Load all the 151 pokemon on server startup
    const models = await getPokemonModels(client);

    // Declare battle stuff
    let waitingPlayers = []; // Queue for players looking for a match
    let battles = {}; // Store active battles

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
                    session.battleID = battleId;
                }

                // Update player2 socket if the username matches
                if (battle.player2.username === session.username) {
                    battle.player2.socketId = socket.id;
                    console.log(`Updated player2's socket ID in battle ${battleId}`);
                    session.battleID = battleId;
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
            session.user = userJoin(socket.id, session.username, getDefaultTeam(models), origin);
        });

        socket.on('disconnect', () => {
            // Remove the user from our user arrays
            //console.log(`Preparing to disconnect ${session.username} with ID ${socket.id} from ${session.origin}`);
            userLeave(socket.id, session.origin);

            // Remove user from waiting players list if they're disconnected
            waitingPlayers = waitingPlayers.filter(p => p.socketId !== socket.id);

            // If the user is part of a battle, you might need to handle disconnection cleanup here
            for (let battleId in battles) {
                const battle = battles[battleId];

                // Check if the player was part of this battle and clean up their data
                if (battle.player1.socketId === socket.id) {
                    //console.log(`Player1 disconnected in battle ${battleId}`);
                    battle.player1.socketId = null; // Reset or clean up as needed
                    session.battleID = -1;
                }

                if (battle.player2.socketId === socket.id) {
                    //console.log(`Player2 disconnected in battle ${battleId}`);
                    battle.player2.socketId = null; // Reset or clean up as needed
                    session.battleID = -1;
                }
            }
        });

        // Recieved from battle.js, should only be accessed during a battle
        socket.on('move', move => {
            // Declare variables
            const battle = getCurrentBattle(session.battleID);
            let newBattleState = battle;
            let player = 0;

            // Figure out which player did the move
            if (socket.id === battle.playerA.id) {
                battle.AMove = move;
                player = 0;
            }
            else if (socket.id === battle.playerB.id) {
                battle.BMove = move;
                player = 1;
            }
            else console.log(`Error: Player not in match with id ${socket.id} attempted to make a move!`);

            // Exit function if both players haven't made their move
            if (!battle.AMove || !battle.BMove) return;

            let turnInfo = {
                aMove: battle.AMove,
                bMove: battle.BMove,
                aMon: battle.playerA.team[battle.AActivePokemon],
                bMon: battle.playerB.team[battle.BActivePokemon]
            };

            // Set new turn
            newBattleState.botComments = ['----------------------------'];
            newBattleState.turn++;
            newBattleState.botComments.push(`Turn ${newBattleState.turn}`);

            // Determine the results of the move
            const fasterPokemonSide = getFaster(turnInfo);
            const slowerPokemonSide = (fasterPokemonSide == 'a') ? 'b' : 'a';

            // Faster pokemon moves
            newBattleState = conductMove(newBattleState, fasterPokemonSide);

            // Check if the taking pokemon fainted
            let results = checkIfPokemonFainted(newBattleState, fasterPokemonSide);
            let fainted = results.fainted;
            newBattleState = results.newBattleState;


            // If the defending pokemon fainted, they don't get to move 
            if (fainted) {
                // Clear moves
                newBattleState.AMove = null;
                newBattleState.BMove = null;
                io.to(battle.id).emit('newTurn', newBattleState);
                return;
            }

            // Slower pokemon moves
            newBattleState = conductMove(newBattleState, slowerPokemonSide);

            // Check if the taking pokemon fainted
            results = checkIfPokemonFainted(newBattleState, slowerPokemonSide);
            fainted = results.fainted;
            newBattleState = results.newBattleState;

            // Clear moves
            newBattleState.AMove = null;
            newBattleState.BMove = null;

            updateBattle(session.battleID, newBattleState);

            io.to(battle.id).emit('newTurn', newBattleState);
        });

        // Recieved from main menu
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

                // Create battle instance
                // Players will be updated/replaced upon joining a battle, so we make a struct to make
                // life easier
                let friendTeam = friend.team
                let friendID = friend.socketId;
                createBattle(
                    battleId,
                    { id: socket.id, username: username, team: session.user.team },
                    { id: friendID, username: friendName, team: friendTeam }
                );

                // Sent to main menu, redirects user to battle window
                io.to(friend.socketId).emit('battleStart', { battleId });
                socket.emit('battleStart', { battleId });

                waitingPlayers = waitingPlayers.filter(p => p !== friend);
            } else {
                // Else onto the queue
                waitingPlayers.push({ socketId: socket.id, username, friendName, team: session.user.team });
                socket.emit('waitingForBattle');
            }
        });

        // Recieved from battle
        // Updates the battle object created in onFindBattle to contain the users'
        // new objects, with the correct sessionIDs
        socket.on('initializeBattle', (battleID) => {
            // First we update the user
            const curBattle = getCurrentBattle(battleID);
            if (curBattle.playerA.username == session.username) {
                curBattle.playerA = session.user;
            }
            else if (curBattle.playerB.username == session.username) {
                curBattle.playerB = session.user;
            }
            else {
                console.log(`ERROR!!! User ${session.username} isnt in the battle!`);
            }

            // Then we join the right room for chat
            socket.join(battleID);

            // Create game start messages
            let botComments = [];

            const myActiveIndex = curBattle.getPlayerActive(socket.id);
            const myPokemon = curBattle.getPlayer(socket.id).team[myActiveIndex];

            const oppsActiveIndex = curBattle.getOpponentActive(socket.id);
            const oppsPokemon = curBattle.getOpponent(socket.id).team[oppsActiveIndex];

            botComments.push(`Turn ${curBattle.turn}`);
            botComments.push(`Battle started between ${curBattle.playerA.username} and ${curBattle.playerA.username}!`)
            botComments.push(`Go! ${myPokemon.name}!`);
            botComments.push(`${curBattle.getOpponent(socket.id).username} sent out ${oppsPokemon.name}!`);

            curBattle.botComments = botComments;

            // For debugging purposes
            console.log(curBattle);

            // Tells the battle.js client to start the game
            socket.emit('newTurn', curBattle);
        })

        socket.on('chatMessage', ({ battleId, message }) => {
            if (!battles[battleId]) {
                socket.emit('error', { message: 'Battle not found' });
                return;
            }
            const sender = socket.handshake.session.username || 'Anonymous';
            io.to(battleId).emit('chatMessage', { sender, message });
        });

    });

    server.listen(port, () => {
        console.log('Server is running on http://localhost:3000/');
    });
}

main();