const Contenedor = require("./contenedor.js").Contenedor
const { Router } = require("express")
const EXPRESS = require("express")
const HBS = require("express-handlebars")
const {Server: IOServer} = require("socket.io")
const {Server: HTTPServer} = require("http")

const PORT = 8080
const APP = EXPRESS()
const PRODUCTS = new Contenedor("./products.txt", false)
const MESSAGES = new Contenedor("./messages.txt", false)
const CART = new Contenedor("./cart.txt", false)

const httpServer = new HTTPServer(APP)
const io = new IOServer(httpServer)

//Visualizacion
const ACTIVE_VIEW = "hbs"

const admin = true

APP.engine("hbs", 
HBS({
    extname:".hbs",
    defaultLayout: null,
}))

APP.set('views','./views');
APP.set('view engine', ACTIVE_VIEW);

APP.use(EXPRESS.static("./public"))

APP.get("/api", (req, res)=>{
    res.render("form.hbs")
})

//Router de productos
const ROUTER_PRODUCTOS = Router()
ROUTER_PRODUCTOS.get('/', (req, res) => {
    res.render("products.hbs", {products: PRODUCTS.getAll()})
})
ROUTER_PRODUCTOS.get('/:id', (req,res)=>{
    let result = PRODUCTS.getById(parseInt(req.params.id))
    
    if(result)
    res.json(result)
    else
    res.json({error:`No se encontro ningún producto con id ${req.params.id}`})
})
ROUTER_PRODUCTOS.post('/', (req,res)=>{
    if(!admin)
        res.json({msg:"Acceso denegado."})
    try{
        let product = JSON.parse(req.query.product)
        product.timestamp = Date.now()
        const ID = PRODUCTS.save(product)
        res.send(PRODUCTS.getById(ID))
        
        io.sockets.emit("add-product", product)
    }
    catch(e){
        res.send({error:`JSON inválido. ${e}`})
    }
})
ROUTER_PRODUCTOS.put('/:id', (req,res)=>{
    if(!admin)
        res.json({msg:"Acceso denegado."})
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
ROUTER_PRODUCTOS.delete('/:id', (req,res)=>{
    if(!admin)
        res.json({msg:"Acceso denegado."})
    const ID = parseInt(req.params.id)
    const DELETED = PRODUCTS.deleteById(ID)
    if(DELETED) res.json({msg:"Producto borrado", product: DELETED})
    else res.json({msg:`No se ha encontrado ningún producto para eliminar con el id ${ID}`})
})

APP.use('/api/productos', ROUTER_PRODUCTOS)

//Router de carrito
ROUTER_CARRITO = Router()
ROUTER_CARRITO.post("/", (req, res)=>{
    const ID = CART.save({
        timestamp : Date.now(),
        products:[],
    })
    res.json({msg:"Carrito creado exitosamente.", id: ID})
})
ROUTER_CARRITO.delete("/:id", (req, res)=>{
    const CART_ID = req.params.id
    const DELETED = CART.deleteById(CART_ID)
    if(!DELETED)
        res.json({msg:"No se ha podido borrar el carrito"})
    else
        res.json({msg:"Carrito eliminado exitosamente", deleted: DELETED})
})
ROUTER_CARRITO.get("/:id/productos", (req, res)=>{
    const ID = req.params.id
    const PRODUCTS = CART.getById(ID)
    res.render("cartview.hbs", PRODUCTS)
})
ROUTER_CARRITO.post("/:id/productos", (req, res)=>{
    try{
        const CART_ID = req.params.id
        const PRODUCT_ID = req.query.productId
        const PRODUCT = PRODUCTS.getById(PRODUCT_ID)
        CART.callbackAtId(CART_ID, (item)=>{
            item.products.push(PRODUCT)
        })
        res.json({msg:"Agregado exitosamente"})
    }
    catch(e){
        res.json({msg:"No se ha podido agregar el producto al carrito.", error: e})
    }
})
ROUTER_CARRITO.delete("/:id/productos/:id_prod", (req, res)=>{
    try{
        const CART_ID = req.params.id
        const PRODUCT_ID = req.params.id_prod
        CART.callbackAtId(CART_ID, (item)=>{
            const NEW_PRODUCTS = []
            let deleted = false
            //El id puede no ser el mismo que el indice, por lo que en vez de hacer un splice iteramos y reemplazamos
            for (const product of item.products) {
                if(product.id !== PRODUCT_ID)
                    NEW_PRODUCTS.push(product)
                else deleted = true
            }
            if(!deleted) throw new Error(`Couldn't find product id ${PRODUCT_ID} in array ${item.products}.`)
            item.products = NEW_PRODUCTS
        })
        res.json({msg:"Eliminado exitosamente"})
    }
    catch(e){
        res.json({msg:"No se ha podido eliminar el producto.", error: e})
    }
})

APP.use("/api/carrito", ROUTER_CARRITO)

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