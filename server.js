const MOCK_PRODUCTS = require("./js/mockProducts")
const Contenedor = require("./js/contenedores/mongo").ContenedorMongo
const { Router } = require("express")
const EXPRESS = require("express")
const HBS = require("express-handlebars")
const {Server: IOServer} = require("socket.io")
const {Server: HTTPServer} = require("http")
const BODY_PARSER = require("body-parser")

const normalizr = require("normalizr")
const messageSchema = require("./schema/normalizrSchema").messagesSchema
const util = require("util")

const PORT = 8080
const APP = EXPRESS()

/* MONGOOSE*/
const SCHEMAS = require("./schema/schema.js")
const PRODUCTS = new Contenedor({dbName:"products", name:"products", schema:SCHEMAS.products})
const MESSAGES = new Contenedor({dbName:"messages", name:"messages", schema:SCHEMAS.messages})

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
APP.use(BODY_PARSER.json())
APP.use(BODY_PARSER.urlencoded({extended:true}))

//Router de productos
const ROUTER_PRODUCTOS = Router()

ROUTER_PRODUCTOS.get("/", (req, res)=>{
    res.render("form.hbs")
})
ROUTER_PRODUCTOS.get('/productos', (req, res) => {
    PRODUCTS.getAll().then((products)=>{
        MESSAGES.getAll().then((messages)=>{
            messages = messages.map(i=>{
                try{
                    i.datetime = new Date(i.datetime._seconds)
                    return i
                }
                catch(err){
                    return i
                }
            })
            res.render("products.hbs", {products: products, messages:messages})
        })
    })
})
ROUTER_PRODUCTOS.get('/productos/:id', (req,res)=>{
    PRODUCTS.getById(req.params.id).then(product=>{
        MESSAGES.getAll().then((messages)=>{
            messages = messages.map(i=>{
                try{
                    i.datetime = new Date(i.datetime._seconds)
                    return i
                }
                catch(err){
                    return i
                }
            })
            res.render("products.hbs", {products: [product], messages:messages})
        })
        .catch(err=>{
            res.json({msg:`No se encontro ningún producto con id ${req.params.id}`,err:err})
        })
    })
})
ROUTER_PRODUCTOS.post('/productos', (req,res)=>{
    try{
        let product = req.body
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
        const ID = req.params.id
        let product = req.body
        PRODUCTS.replaceAtId(ID, product)
        .then(result=>{
            res.json({msg:"Objeto reemplazado exitosamente", product: result})
        })
        .catch(err=>console.log(`No se pudo actualizar. ${err}`))
    }
    catch(e){
        res.send({error:`JSON inválido. ${e}`})
    }
})
ROUTER_PRODUCTOS.delete('/productos/:id', (req,res)=>{
    const ID = req.params.id
    PRODUCTS.deleteById(ID).then(deleted=>{
        if(deleted)
            res.json({msg:"Producto borrado", result: deleted})
        else
            res.json({msg:`No se ha encontrado ningún producto para eliminar con el id ${ID}`})
    })
    .catch(err=>{
        console.log(`Error al borrar. ${err}`)
    })
})
ROUTER_PRODUCTOS.get("/productos-test", (req,res)=>{
    MESSAGES.getAll().then((messages)=>{
        /*messages = messages.map(i=>{
            i.datetime = new Date(i.datetime._seconds)
            return i
        })*/
        messages.id = "messages"
        messages = normalizr.normalize(messages, [messageSchema])
        console.log(util.inspect(messages,true, 6, true))
        res.render("products.hbs", {products: MOCK_PRODUCTS.getProducts(5), messages:messages})
    })
})

APP.use('/api', ROUTER_PRODUCTOS)

//Apertura y manejo de errores del server
const SERVER = httpServer.listen(PORT,()=>{
    console.log(`Servidor http escuchando en el puerto ${SERVER.address().port}`)
})
SERVER.on("error", error => console.log(`Error en servidor ${error}`))

//IO
io.on("connect", socket =>{
    MESSAGES.getAll().then((messages)=>{
        messages.id = "messages"
        messages = normalizr.normalize(messages, [messageSchema])
        socket.emit("load-messages", {messages:messages, schema:messageSchema})
    })
    socket.on("message", (data)=>{
        const author = {
            id: data.user,
            name: data.user,
            surname : data.user,
            age: 20,
            nick: data.user,
            avatar: "https://i.imgur.com/5KERSGb.gif"
        }

        const MESSAGE = {id:data.msg,author:author, msg: data.msg}
        io.sockets.emit("global-message", MESSAGE)
        MESSAGES.save(MESSAGE)
        
    })
})