const MOCK_PRODUCTS = require("./js/mockProducts")
const Contenedor = require("./js/contenedores/mongo").ContenedorMongo
const { Router } = require("express")
const EXPRESS = require("express")
const HBS = require("express-handlebars")
const {Server: IOServer} = require("socket.io")
const {Server: HTTPServer} = require("http")
const SESSION = require("express-session")
const PASSPORT = require("passport")
const LOCAL_STRATEGY = require("passport-local").Strategy
const bCrypt = require("bcrypt")

const BODY_PARSER = require("body-parser")
const COOKIE_PARSER = require('cookie-parser')
const MONGO_STORE = require("connect-mongo")

/*const normalizr = require("normalizr")
const messageSchema = require("./options/normalizrSchema").messagesSchema
const util = require("util")*/

const PORT = 8080
const APP = EXPRESS()

/*AUTENTICACION*/
const MIN_PASS_LEN = 8
function isValidPassword(password){
    return password.length >= MIN_PASS_LEN
}
function passwordMatch(user, password){
    return bCrypt.compareSync(password, user.password)
}
function createHash(password) {
    return bCrypt.hashSync(password, bCrypt.genSaltSync(10), null);
}
PASSPORT.use('login', new LOCAL_STRATEGY((username, password, done) => {
        return USERS.getByFilter({ username:username })
        .then(user=>{
            user = user[0]
            if (!user) {
              console.log('User Not Found with username ' + username);
              return done(null, false);
            }
            if (!passwordMatch(user, password)) {
              console.log('Invalid Password');
              return done(null, false);
            }
            console.log("Login succesful")
            return done(null, user);
        })
        .catch(err=>{
            return done(err)
        })
    })
);
   
PASSPORT.use('signup', new LOCAL_STRATEGY({passReqToCallback: true},
    (req, username, password, done) => {
        if(!isValidPassword(password)) return done(`La contraseña debe tener al menos ${MIN_PASS_LEN} caractéres.`)
        return USERS.getByFilter({ 'username': username })
        .then(user=>{
            if (user.length) {
                console.log('User already exists', user);
                return done(null, false)
            }
            const newUser = {
                username: username,
                password: createHash(password)
            }
            USERS.save(newUser)
            .then(result=>{
                console.log('User Registration succesful');
                return done(null, result);
            })
            .catch(err=>{
                console.log('Error in Saving user: ' + err);
                return done(err);
            })
        })
        .catch(err=>{
            console.log('Error in SignUp: ' + err);
            return done(err);
        })   
    })
)

PASSPORT.serializeUser((user, done) => {
    done(null, user._id);
});
  
PASSPORT.deserializeUser((id, done) => {
    return USERS.getById(id)
    .then(res=>{
        return done(null, res)
    })
    .catch(err=>{
        return done(err)
    })
});
  
/* MONGOOSE*/
const SCHEMAS = require("./options/schema.js")
const PRODUCTS = new Contenedor({dbName:"products", name:"products", schema:SCHEMAS.products})
const MESSAGES = new Contenedor({dbName:"messages", name:"messages", schema:SCHEMAS.messages})
const USERS = new Contenedor({dbName:"users",name:"users",schema:SCHEMAS.users})

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
APP.use(COOKIE_PARSER())
APP.use(SESSION({
    secret:"secret",
    resave:true,
    saveUninitialized:false,
    rolling: true,
    cookie:{
        httpOnly: false,
        secure: false,
        maxAge  : 60000, // 10 minutos
        expires : 60000
    }
    ,
    store: MONGO_STORE.create({
        mongoUrl: "mongodb+srv://santigutih:0303456@cluster0.ha8lo.mongodb.net/myFirstDatabase?retryWrites=true&w=majority",
        mongoOptions: {useNewUrlParser:true, useUnifiedTopology:true}
    })
}))
APP.use(PASSPORT.initialize())
APP.use(PASSPORT.session())

//Router general
const ROUTER_API = Router()

ROUTER_API.get("/register", (req, res)=>{
    res.render("register.hbs")
})
ROUTER_API.get("/login", (req, res)=>{
    res.render("login.hbs")
})
ROUTER_API.post("/signup", PASSPORT.authenticate("signup", {failureRedirect:"/api/failsignup"}), (req, res)=>{
    req.session.username = req.user.username
    res.json({msg:"Registrado exitosamente."})
})
ROUTER_API.post("/login", PASSPORT.authenticate("login", {failureRedirect:"/api/faillogin"}), (req, res)=>{
    req.session.username = req.user.username
    res.json({msg:"Logeado exitosamente"})
})
ROUTER_API.get("/logout", (req, res)=>{
    req.session.destroy(err=>{
        if(err){
            res.json({msg:"Error al desloguearse.", err:err})
            return
        }
        res.json({msg:"Deslogueado exitosamente!"})
    })
})
ROUTER_API.get("/faillogin", (req, res)=>{
    res.render("faillogin.hbs")
})
ROUTER_API.get("/failsignup", (req, res)=>{
    res.render("failsignup.hbs")
})
APP.use("/api", ROUTER_API)

//Router de productos
const ROUTER_PRODUCTOS = Router()

ROUTER_PRODUCTOS.get('/', (req, res) => {
    PRODUCTS.getAll().then((products)=>{
        res.render("products.hbs", {products: products, username: req.session.username})
    })
})
ROUTER_PRODUCTOS.get('/:id', (req,res)=>{
    PRODUCTS.getById(req.params.id).then(product=>{
        res.render("products.hbs", {products: [product], username: req.session.username})
        .catch(err=>{
            res.json({msg:`No se encontro ningún producto con id ${req.params.id}`,err:err})
        })
    })
})
ROUTER_PRODUCTOS.post('/', (req,res)=>{
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
ROUTER_PRODUCTOS.put('/:id', (req,res)=>{
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
ROUTER_PRODUCTOS.delete('/:id', (req,res)=>{
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
ROUTER_PRODUCTOS.get("/add", (req, res)=>{
    res.render("form.hbs",{username: req.session.username})
})
ROUTER_PRODUCTOS.get("/productos-test", (req,res)=>{
    res.render("products.hbs", {products: MOCK_PRODUCTS.getProducts(5), username: req.session.username})
})

APP.use('/api/productos', ROUTER_PRODUCTOS)

//Apertura y manejo de errores del server
const SERVER = httpServer.listen(PORT,()=>{
    console.log(`Servidor http escuchando en el puerto ${SERVER.address().port}`)
})
SERVER.on("error", error => console.log(`Error en servidor ${error}`))

//IO
io.on("connect", socket =>{
    MESSAGES.getAll().then((messages)=>{
        messages.id = "messages"
        //messages = normalizr.normalize(messages, [messageSchema])
        socket.emit("load-messages", {messages:messages/*, schema:messageSchema*/})
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