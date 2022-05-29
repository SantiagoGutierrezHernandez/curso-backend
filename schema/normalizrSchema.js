const normalizr = require("normalizr")
const schema = normalizr.schema

const author = new schema.Entity("authors")

const messagesSchema = new schema.Entity("messages", {
    author : author
},{idAttribute:"_id"})

module.exports = {
    messagesSchema : messagesSchema
}