const socket = io()

function getCompressionPercentage(oldNum, newNum){
    let diff = oldNum - newNum
    return (diff/oldNum)*100
}

socket.on("load-messages", data =>{
    /* La denormalización no está funcionando correctamente por lo que lo hacemos manualmente
    const messages = normalizr.denormalize(data.messages.result, data.schema, data.messages.entities)*/

    let messages = []
    for(const key in data.messages.entities.messages){
        const message = data.messages.entities.messages[key]
        messages.push({
            author: data.messages.entities.authors[message.author],
            msg: message.msg
        })
    }

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
    
    document.getElementById("compression").innerText = `Compresión:${getCompressionPercentage(JSON.stringify(messages).length, parseInt(JSON.stringify(data.messages.entities).length))}%`
})