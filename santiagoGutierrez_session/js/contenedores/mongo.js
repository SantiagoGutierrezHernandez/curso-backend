const mongoose = require("mongoose")
const {Contenedor } = require("./contenedor.js")

const URL = "mongodb://localhost:27017/ecommerce"

class ContenedorMongo extends Contenedor{
    _constructor({name,schema}){
        this.name = name
        this.schema = new mongoose.Schema(schema)
        this.model = mongoose.models[name] || mongoose.model(name, this.schema)

        this.start()
    }

    static connecting = false

    start(){
        if(ContenedorMongo.connecting){
            console.log("Base de datos ya conectandose. Se cancelo la coneccion.")
            return  
        } 
        ContenedorMongo.connecting = true

        mongoose.connect(URL, {
            useNewUrlParser: true,
            useUnifiedTopology: true
        })
        .then((res)=>{ContenedorMongo.connected = true})
        .catch((err) => {
            console.log("Error en la coneccion", err)
        })
    }

    async save(object){
        if(object instanceof Array)
        {
            return this.model.insertMany(object)
            .then((res)=>{
                console.log(`Agregado exitosamente el objeto ${object}`)
                return res
            })
            .catch(err=>console.log(`Error al agregar el objeto: ${err}`))
        }
        else if(object instanceof Object){
            return this.model.create(object)
            .then((res)=>{
                console.log(`Agregado exitosamente el objeto ${object}`)
                return res
            })
            .catch(err=>console.log(`Error al agregar el objeto: ${err}`))
        }
        else{
            console.log(`${object} no es de tipo objeto. No se ha agregado.`)
        }
    }

    async replaceAtFilter(filter, object){
        if(!object instanceof Object){
            console.log("No se puede actualizar porque no se ha pasado un objeto")
            return
        }
        
        return await this.model.updateOne(filter,{$set:object})
    }
    async replaceAtId(id, object){
        return this.replaceAtFilter({_id:id},object)
    }

    async getAll(){
        return await this.model.find().lean()
    }
    async getByFilter(filter){
        if(!filter instanceof Object){
            console.log("El filtro no es del tipo objeto")
            return null
        }
        return await this.model.find(filter).lean()
    }
    async getById(id){
        return this.getByFilter({_id:id})
    }

    async overwrite(array){
        if(!array instanceof Object){
            console.log("El array de sobreescrito no es de tipo objeto")
            return
        }
        this.deleteAll()
        await this.model.insertMany(array)
    }

    async deleteAll(){
        await this.model.deleteMany()
    }
    async deleteByFilter(filter){
        if(!filter instanceof Object){
            console.log("El filtro no es del tipo objeto")
            return null
        }
        return await this.model.deleteMany(filter)
    }
    async deleteById(id){
        return this.deleteByFilter({_id:id})
    }
}

module.exports = {ContenedorMongo}