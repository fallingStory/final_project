const typedName = document.getElementById('player-name-register')
const loginButton = document.getElementById('login-button')
const registerButton = document.getElementById('register-button')

const {MongoClient} = require('mongodb');
const express = require('express');
require('dotenv').config();
const uri = process.env.MONGO_URI;
const client = new MongoClient(uri,{});

console.log("mainMenuJsloaded");

//Connect to mongo
try {
    await client.connect();
    //const query = { name: "Bulbasaur" };
    //const pokemon = await collection.findOne(query);
} catch (err) {
    console.error(err);
    res.status(500).send("Internal Server Error");
} finally {
    await client.close();
}


loginButton.addEventListener("click", async function(){
    const database = client.db('Users');
    const collection = database.collection('users');
    var inputtedUsername = typedName.value
    const query = { username: inputtedUsername };
    const profile = await collection.findOne(query);
    if (profile==null){
        typedName.innerText="";
        typedName.placeholder=`user ${inputtedUsername} not found`;
        
    }
})



