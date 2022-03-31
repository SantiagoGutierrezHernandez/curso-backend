document.getElementById("message-button").addEventListener("click", (e)=>{
    e.preventDefault()
    const MAIL = document.getElementById("message-mail").value

    if(MAIL === "") return

    const MESSAGE = document.getElementById("message-msg").value

    socket.emit("message", {user: MAIL, msg: MESSAGE})
})

socket.on("global-message", (data)=>{
    const MESSAGES = document.getElementById("message-container")

    const newMsg = document.createElement("div")
    newMsg.innerHTML = `
        <span class="msg-user-mail">${data.user}</span>
        <span class="msg-time">- [${data.datetime}] :</span>
        <span class="msg-user-msg">${data.msg}</span>
    `

    MESSAGES.appendChild(newMsg)

})