const FAKER = require("@faker-js/faker").faker
FAKER.locale = "es"

function getProducts(amount = 5){
    const res = []

    for (let i = 0; i < amount; i++) {
        res.push({
            title: FAKER.commerce.product(),
            thumbnail: FAKER.image.imageUrl(),
            price: FAKER.random.numeric(4)
        })
    }
    return res
}

module.exports = {getProducts}