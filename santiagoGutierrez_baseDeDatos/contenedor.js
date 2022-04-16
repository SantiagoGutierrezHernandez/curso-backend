const {options : SQLiteOptions} = require("./options/SQLite3.js")
const {options : mariaDBOptions} = require("./options/mariaDB.js")
const knex = require("knex")

class Contenedor{
    constructor(name, overwrite=false, filebased=true){
        this.name = name

        if(filebased)
            this.db = knex(SQLiteOptions)
        else
            this.db = knex(mariaDBOptions)

        if(overwrite){this.deleteAll()}  
        else this.start()
    }

    //Crear la tabla si no existe
    start(){
        try{
            this.db.schema.createTable(this.name, table =>{
                table.increments("id")
                table.string("data")
            })
                .then(()=>{console.log(`table ${this.name} created`)})
                .catch((err)=>{console.log(err)})
        }
        catch(e){
            console.log(e)
        }
    }

    //Sobreescribe el archivo al array especificado
    overwrite(array){
        try{
            this.db.dropTableIfExists(this.name)
            .then(()=>{console.log(`table ${this.name} deleted`)})
            .catch((err)=>{console.log(err)})
            .finally(()=>{
                this.db.schema.createTable(this.name, table =>{
                    table.increments("id")
                    table.string("data")
                })
                    .then(()=>{console.log("table created")})
                    .catch((err)=>{console.log(err)})
                    .then(()=>{
                        this.db(this.name).insert(array)
                        .then(response=>{console.log(response)})
                        .catch(err => console.log(err))
                    })
            })
        }
        catch(err){
            this.start()
            console.log(`No se ha podido agregar al archivo. ${err}`)
        }
    }
    //Reemplaza el producto ccon el ID especificado por el producto parametro
    replaceAtId(id, object){
        try{
            this.db.from(this.name).where("id", id).update({data:object})
            .then(()=>console.log(`Replaced at id ${id}`))
            .catch((err)=>console.log(err))
        }        
        catch(err){
            console.log(`No se ha podido reemplazar el item de id ${id}. ${err}`)
        }
    }
    //Agrega un objeto al archivo y si falla retorna -1
    save(object){
        if(typeof object !== "object"){
            console.log(`No se guardo ${object} porque no es un objeto`)
            return -1
        } 
        let id = -1
        try{
            this.db(this.name).insert({data:JSON.stringify(object)})
            .then(response=>{id = response[0]})
            .catch(err => console.log(err))
        }
        catch(err){
            console.log("No se pudo guardar el objeto", err)
        }
        return id
    }
    
    //Retorna todo el array de objetos
    getAll(){
        try{
            return this.db(this.name).select("*")
            .then(response=>{
                return response.map((i)=>{
                    return {
                        id: i.id,
                        data: JSON.parse(i.data)
                    }
                })
            })
            .catch(err=>console.log(err))
        }
        catch (err){
            console.log(`No se pudo leer el archivo en "${this.pathName}". ${err}`)
            return null
        }
    }
    //Retorna el objeto con el ID coincidente o null si no existe
    getById(index){
        let result = null
        try{
            this.db(this.name).select("*").where("id", index)
            .then(response=>{
                console.log(response)
                result = JSON.parse(response.data)
                result.id = response.id
            })
            .catch(err=>console.log(err))
        }
        catch(err){
            console.log(`No se encontro ningun resultado con id ${index}. ${err}`)
        }
        return result
    }

    //Borra el objeto con el id especificado y lo retorna
    deleteById(index){
        let deleted = null
        try{
            this.db.from(this.name).where("id",index).del()
            .then(response=>deleted=response)
            .catch(err=>console.log(err))
        }
        catch(err){
            console.log(err)
        }

        return deleted
    }

    //Borra el archivo especificado
    deleteAll(){
        try{
            this.db.from(this.name).del()
            .then(()=>{console.log(`table ${this.name} deleted`)})
            .catch((err)=>{console.log(err)})
        }
        catch(err){
            console.log(`No se pudo borrar el archivo. ${err}`)
        }
    }
}

module.exports = {Contenedor}