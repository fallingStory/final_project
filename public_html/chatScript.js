const socket = io('http://localhost:3000')

const messageForm = document.getElementById("send-container")
const messageInput = document.getElementById("message-input")
const yourName = prompt('what is your name')
appendMessage("you joined")
socket.emit('new-user',yourName)
socket.on('chat-message',data=>{
    appendMessage(`${data.name}: ${data.message}`)
})
socket.on('user-connected',yourName=>{
    appendMessage(`${yourName} connected`)
})
socket.on('user-disconnected',yourName=>{
    appendMessage(`${yourName} disconnected`)
})
messageForm.addEventListener('submit',e=>{
    e.preventDefault()
    const message = messageInput.value
    appendMessage(`You: ${message}`)
    socket.emit('send-chat-message',message)
    messageInput.value=''
})

function appendMessage(message){
    const messageElement=document.createElement('div')
    messageElement.innerText=message
    messageContainer.append('messageElement')
}

