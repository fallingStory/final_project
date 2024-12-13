socket.on('getActivePokemon',(battleId)=>{
        socket.emit ("gotActivePokemon",battles[battleId].activeIndex,battles[battleId])
    })