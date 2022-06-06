const SIZE = 1000

process.on("message", msg => {
    try{
        const AMOUNT = parseInt(msg)
        const results = {}
        for (let i = 1; i <= SIZE; i++) {
            results[i] = 0        
        }
        for (let i = 0; i < AMOUNT; i++) {
            results[Math.floor(Math.random() * SIZE + 1)] += 1
        }
        process.send(results)
    }
    catch(err){
        console.log(err)
    }
})