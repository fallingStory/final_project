const { MongoClient } = require('mongodb');
const express = require('express');
const app = express();
const port = 3000;
require('dotenv').config();
const uri = process.env.MONGO_URI;
const client = new MongoClient(uri, {});
const path = require('path');
const flash = require('express-flash');
const session = require('express-session');

app.set('views', path.join(__dirname, "public_html"));
app.use(express.static("public_html"))
app.set('view-engine', 'ejs');
app.use(express.urlencoded({ extended: false }));
app.use(flash());
app.use(session({ 
  secret: process.env.SESSION_SECRET || 'default-secret-key',
  resave: false,
  saveUninitialized: false
}));
app.use(express.urlencoded({ extended: false }));

app.get('/', checkAuthenticated, (req, res) => {
    console.log("redirecting to somewhere", req.session.username);
    res.render('mainMenu.ejs', { name: req.session.username });
});

app.get('/login', checkNotAuthenticated, (req, res) => {
    console.log("dead auth");
    const message = req.query.message || '';
    res.render('login.ejs', { message });
});

app.post('/login', checkNotAuthenticated, async (req, res) => {
    const { username } = req.body;
    console.log("Attempting to log in with username:", username);

    try {
        await client.connect();
        const database = client.db("Users");
        const collection = database.collection("users");

        const user = await collection.findOne({ username: username });
        if (user == null) {
            console.log("User not found");
            req.flash('error', 'Invalid username');
            return res.redirect('/login');
        }

        req.session.userId = user._id;
        req.session.username = user.username;
        console.log("User logged in successfully");
        res.redirect('/');
    } catch (err) {
        console.error(err);
        res.status(500).send("Internal Server Error");
    } finally {
        await client.close();
    }
});

app.get('/register', checkNotAuthenticated, (req, res) => {
    console.log("register");
    res.render('register.ejs', { messages: req.flash() });
});

app.post('/register', checkNotAuthenticated, async (req, res) => {
    const { username } = req.body;
    console.log("registering as", username);

    try {
        await client.connect();
        const database = client.db("Users");
        const collection = database.collection("users");

        const userFound = await collection.findOne({ username: username });

        if (userFound == null) {
            console.log(`name not found, registering ${username}`);
            await collection.insertOne({ username: username });
            res.redirect('/login');
        } else {
            console.log(`username ${username} taken`);
            req.flash('error', 'Username taken');
            res.redirect('/register');
        }
    } catch {
        res.redirect('/register');
    } finally {
        await client.close();
    }
});

app.delete('/logout', (req, res) => {
    req.session.destroy();
    res.redirect('/login');
});

function checkAuthenticated(req, res, next) {
    console.log("checkauth");
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

app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});

console.log("banana");

async function connectToMongo() {
    try {
        await client.connect();
        const database = client.db('PokemonDB');
        const collection = database.collection('pokemon');

        const query = { name: "Bulbasaur" };
        const pokemon = await collection.findOne(query);
    } catch (err) {
        console.error(err);
        res.status(500).send("Internal Server Error");
    } finally {
        await client.close();
    }
}
