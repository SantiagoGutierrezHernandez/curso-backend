require("dotenv").config()

const MONGO = process.env.MONGO
const MONGO_STORE = process.env.MONGO_STORE

module.exports = {
    mongoUrl : MONGO,
    mongoStoreUrl : MONGO_STORE
}