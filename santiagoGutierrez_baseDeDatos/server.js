const Contenedor = require("./contenedor.js").Contenedor
const { Router } = require("express")
const EXPRESS = require("express")
const HBS = require("express-handlebars")
const {Server: IOServer} = require("socket.io")
const {Server: HTTPServer} = require("http")

const PORT = 8080
const APP = EXPRESS()
const ROUTER_PRODUCTOS = Router()
const PRODUCTS = new Contenedor("products", false, true)
const MESSAGES = new Contenedor("messages", false, true)

const httpServer = new HTTPServer(APP)
const io = new IOServer(httpServer)


//Visualizacion
const ACTIVE_VIEW = "hbs"

APP.engine("hbs", 
HBS({
    extname:".hbs",
    defaultLayout: null,
}))

APP.set('views','./views');
APP.set('view engine', ACTIVE_VIEW);

APP.use(EXPRESS.static("./public"))

//Router de productos
ROUTER_PRODUCTOS.get("/", (req, res)=>{
    res.render("form.hbs")
})
ROUTER_PRODUCTOS.get('/productos', (req, res) => {
    PRODUCTS.getAll().then((products)=>{
        MESSAGES.getAll().then((messages)=>{
            res.render("products.hbs", {products: products, messages:messages})
        })
    })
})
ROUTER_PRODUCTOS.get('/productos/:id', (req,res)=>{
    let result = PRODUCTS.getById(parseInt(req.params.id))
    
    if(result)
    res.json(result)
    else
    res.json({error:`No se encontro ningún producto con id ${req.params.id}`})
})
ROUTER_PRODUCTOS.post('/productos', (req,res)=>{
    try{
        let product = JSON.parse(req.query.product)
        PRODUCTS.save(product)
        res.send(product)
        
        io.sockets.emit("add-product", product)
    }
    catch(e){
        res.send({error:`JSON inválido. ${e}`})
    }
})
ROUTER_PRODUCTOS.put('/productos/:id', (req,res)=>{
    try{
        const ID = parseInt(req.params.id)
        let product = JSON.parse(req.query.product)
        PRODUCTS.replaceAtId(ID, product)
        res.json({msg:"Objeto reemplazado exitosamente", product: product})
    }
    catch(e){
        res.send({error:`JSON inválido. ${e}`})
    }
})
ROUTER_PRODUCTOS.delete('/productos/:id', (req,res)=>{
    const ID = parseInt(req.params.id)
    const DELETED = PRODUCTS.deleteById(ID)
    if(DELETED) res.json({msg:"Producto borrado", product: DELETED})
    else res.json({msg:`No se ha encontrado ningún producto para eliminar con el id ${ID}`})
})

APP.use('/api', ROUTER_PRODUCTOS)

//Apertura y manejo de errores del server
const SERVER = httpServer.listen(PORT,()=>{
    console.log(`Servidor http escuchando en el puerto ${SERVER.address().port}`)
})

SERVER.on("error", error => console.log(`Error en servidor ${error}`))

//IO
io.on("connect", socket =>{
    socket.on("message", (data)=>{
        const MESSAGE = {datetime:new Date().toLocaleString(), user: data.user, msg: data.msg}
        io.sockets.emit("global-message", MESSAGE)
        MESSAGES.save(MESSAGE)
    })
})
