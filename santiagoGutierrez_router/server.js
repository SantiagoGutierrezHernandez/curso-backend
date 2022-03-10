const Contenedor = require("./contenedor.js").Contenedor
const { Router } = require("express")
const EXPRESS = require("express")

const PORT = 8080
const APP = EXPRESS()
const ROUTER_PRODUCTOS = Router()
const PRODUCTS = new Contenedor("./products.txt", false)

//Función wrapper para tener un minimo y maximo de Random
function randInt(min = 0, max = 1){
    return Math.round(Math.random() * (max - min) + min)
}

//Router de productos
ROUTER_PRODUCTOS.get('/productos', (req, res) => {
    res.send(PRODUCTS.getAll())
})
ROUTER_PRODUCTOS.get('/productoRandom', (req, res) => {
    res.send(PRODUCTS.getById(randInt(Contenedor.MIN_ID, PRODUCTS.size)))
})
ROUTER_PRODUCTOS.get('/productos/:id', (req,res)=>{
    let result = PRODUCTS.getById(parseInt(req.params.id))
    
    if(result)
        res.json(result)
    else
        res.json({error:`No se encontro ningún producto con id ${req.params.id}`})
})
ROUTER_PRODUCTOS.post('/productos', (req,res)=>{
    let product = req
    try{
        product = JSON.parse(req.query.product)
    }
    catch(e){
        res.send({error:`JSON inválido. ${e}`})
    }
    const ID = PRODUCTS.save(product)

    res.send(PRODUCTS.getById(ID))
})
ROUTER_PRODUCTOS.put('/productos/:id', (req,res)=>{
    const ID = parseInt(req.params.id)
    let product = req
    try{
        product = JSON.parse(req.query.product)
    }
    catch(e){
        res.send({error:`JSON inválido. ${e}`})
    }
    PRODUCTS.replaceAtId(ID, product)
    res.json({msg:"Objeto reemplazado exitosamente", product: product})
})
ROUTER_PRODUCTOS.delete('/productos/:id', (req,res)=>{
    const ID = parseInt(req.params.id)
    const DELETED = PRODUCTS.deleteById(ID)
    console.log(DELETED)
    if(DELETED) res.json({msg:"Producto borrado", product: DELETED})
    else res.json({msg:`No se ha encontrado ningún producto para eliminar con el id ${ID}`})
})

APP.use('/api', ROUTER_PRODUCTOS)

//Apertura y manejo de errores del server
const SERVER = APP.listen(PORT,()=>{
    console.log(`Servidor http escuchando en el puerto ${SERVER.address().port}`)
})

SERVER.on("error", error => console.log(`Error en servidor ${error}`))
