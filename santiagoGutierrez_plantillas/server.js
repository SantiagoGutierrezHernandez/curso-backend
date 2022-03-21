const Contenedor = require("./contenedor.js").Contenedor
const { Router } = require("express")
const EXPRESS = require("express")
const HBS = require("express-handlebars")

const PORT = 8080
const APP = EXPRESS()
const ROUTER_PRODUCTOS = Router()
const PRODUCTS = new Contenedor("./products.txt", false)

//Visualizacion
const VIEW_ENGINES = {
        pug:"pug",
        handlebars:"hbs",
        ejs:"ejs"
    }
const ACTIVE_VIEW = VIEW_ENGINES.ejs

if(ACTIVE_VIEW === VIEW_ENGINES.handlebars){
    APP.engine("hbs", 
    HBS({
        extname:".hbs",
        defaultLayout: null,
    }))
}

APP.set('views','./views');
APP.set('view engine', ACTIVE_VIEW);

function getView(path){
    return `${path}.${ACTIVE_VIEW}`
}

//Router de productos
ROUTER_PRODUCTOS.get("/", (req, res)=>{
    res.render(getView("form"))
})
ROUTER_PRODUCTOS.get('/productos', (req, res) => {
    res.render(getView("products"), {products: PRODUCTS.getAll()})
})
ROUTER_PRODUCTOS.get('/productos/:id', (req,res)=>{
    let result = PRODUCTS.getById(parseInt(req.params.id))
    
    if(result)
        res.json(result)
    else
        res.json({error:`No se encontro ningún producto con id ${req.params.id}`})
})
ROUTER_PRODUCTOS.post('/productos', (req,res)=>{
    console.log(req.query)
    try{
        let product = JSON.parse(req.query.product)
        const ID = PRODUCTS.save(product)
        res.send(PRODUCTS.getById(ID))
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
const SERVER = APP.listen(PORT,()=>{
    console.log(`Servidor http escuchando en el puerto ${SERVER.address().port}`)
})

SERVER.on("error", error => console.log(`Error en servidor ${error}`))
