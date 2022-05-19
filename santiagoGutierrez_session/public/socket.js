const socket = io()

socket.on("load-messages", data =>{
    const messages = data.messages //normalizr.denormalize(data.messages.result, data.schema, data.messages.entities)

    for (const i of messages) {
        const div = document.createElement("div")
        div.innerHTML = `
            <div>
                <span class="msg-user-mail">${i.author.id} </span>
                <span class="msg-time"> : </span>
                <span class="msg-user-msg">${i.msg}</span>
            </div>
        `
        document.getElementById("message-container").appendChild(div)
    }
    
    console.log(`${JSON.stringify(data.messages).length} / ${JSON.stringify(messages).length} = ${JSON.stringify(data.messages).length/ JSON.stringify(messages).length}`)
    document.getElementById("compression").innerText = `Compresión:${parseInt(JSON.stringify(data.messages).length/ JSON.stringify(messages).length * 100)}%`
})