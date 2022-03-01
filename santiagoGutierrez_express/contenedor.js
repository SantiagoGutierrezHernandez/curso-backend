const FS = require("fs")

class Contenedor{
    constructor(pathName, overwrite){
        this.pathName = pathName
        this.id = 1
        this.size = 0

        if(overwrite) this.deleteAll()
        else this.start()
    }

    static MIN_ID = 1

    //Obtener el último id del archivo y setearlo
    start(){
        const file = this.getAll()

        for (const i of file) {
            if(i.id > this.id) this.id = i.id
        }
        this.size = file.length
    }

    //Sobreescribe el archivo al array especificado
    overwrite(array){
        try{
            FS.writeFileSync(this.pathName, JSON.stringify(array))
            console.log(`Archivo sobreescrito!`)
            this.size = array.length
        }
        catch(err){
            console.log(`No se ha podido agregar al archivo. ${err}`)
        }
    }
    
    //Agrega un objeto al archivo y actualiza el id si hay exito
    save(object){
        let fileObject = this.getAll()
        
        object.id = this.id
        fileObject.push(object)
        
        try{
            FS.writeFileSync(this.pathName, JSON.stringify(fileObject))
            const ID = this.id
            this.id++
            console.log(`Objeto agregado exitosamente al archivo!`)
            this.size = fileObject.length
            return ID
        }
        
        catch(err){
            console.log(`No se ha podido agregar al archivo. ${err}`)
            return -1
        }
    }
    
    //Retorna todo el array de objetos o uno vacío si no hay nada
    getAll(){
        let result
        try{
            result = JSON.parse(FS.readFileSync(this.pathName, "utf-8"))
        }
        catch (err){
            console.log(`No se pudo leer el archivo en "${this.pathName}". ${err}`)
            result = []
        }
        return result
    }
    //Retorna el objeto con el ID coincidente o null si no existe
    getById(index){
        const file = this.getAll()

        for (const i of file) {
            if(i.id === index)
                return i
        }
        console.log(file)
        console.log(`Array de tamaño ${file.length} e indice ${index}. No se ha podido encontrar resultado.`)
        return null
    }

    //Borra el objeto con el id especificado y lo retorna
    deleteById(index){
        const file = this.getAll()

        for (let i = 0; i < file.length; i++) {
            const element = file[i];
            if(element.id === index){
                const DELETED = file.splice(i, 1)
                this.overwrite(file)
                return DELETED
            }
        }

        return null
    }

    //Borra el archivo especificado
    deleteAll(){
        try{
            FS.unlinkSync(this.pathName)
            this.size = 0
        }
        catch(err){
            console.log(`No se pudo borrar el archivo. ${err}`)
        }
    }
}

module.exports = {Contenedor}