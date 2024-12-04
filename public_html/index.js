
const mongoose = require("mongoose")
console.log("hi");
mongoose.connect("mongodb://localhost/pokemondb",{
    useNewUrlParser: true,
    useUnifiedTopology: true,
})
.then(()=>{
    console.log("connected")
})