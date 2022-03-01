const Contenedor = require("./contenedor.js").Contenedor
const EXPRESS = require("express")

const PORT = 8080
const APP = EXPRESS()
const PRODUCTS = new Contenedor("./products.txt", false)

//Función wrapper para tener un minimo y maximo de Random
function randInt(min = 0, max = 1){
    return Math.round(Math.random() * (max - min) + min)
}

const SERVER = APP.listen(PORT,()=>{
    console.log(`Servidor http escuchando en el puerto ${SERVER.address().port}`)
})

SERVER.on("error", error => console.log(`Error en servidor ${error}`))

APP.get('/productos', (req, res) => {
    res.send(PRODUCTS.getAll())
})
     
APP.get('/productoRandom', (req, res) => {
    res.send(PRODUCTS.getById(randInt(Contenedor.MIN_ID, PRODUCTS.size)))
})
