const PRODUCT_LIST = document.getElementById("product-list")

socket.on("add-product", data =>{
    const NEW_PRODUCT = document.createElement("li")
    NEW_PRODUCT.innerHTML = `
        <div>${data.title}</div>
        <div>${data.price}</div>
        <img class="product-img" src=${data.thumbnail} alt=${data.title}>
    `
    PRODUCT_LIST.appendChild(NEW_PRODUCT)
})