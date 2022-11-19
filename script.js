// Obtengo elementos del DOM

const contenedorProductos = document.querySelector("#productos");
const contenedorCarrito = document.querySelector("#carritoLista");
const contenedorTotal = document.querySelector("#total");
const dropdownCategorias = document.querySelector("#dropdown-categorias");
const dropdownCarrito = document.querySelector("#carrito");
const badgeCarrito = document.querySelector("#badgeCarrito");

dropdownCarrito.addEventListener("click", e => e.stopPropagation())

// Cargo productos desde JSON
// Cargo el carrito desde el storage, en caso de que exista
// Modifico los elementos del DOM

let misProductos = [];
let carrito = [];
fetch("./productos.json")
.then(res => res.json())
.then(data => {
    data.forEach(producto => misProductos.push(new Producto(producto.id, producto.nombre, producto.categoria, producto.talles, producto.precio, producto.imagen)));
    JSON.parse(localStorage.getItem('carrito'))?.map(item => carrito.push(new Item(misProductos.find(prod => prod.id == item.producto.id), item.talle, item.cantidad)))
    const categoria = window.location.hash.substr(1);
    refrescarProductos(categoria);
    refrescarCarrito();
})

// Actualizo los productos visualizados capturando la interacción del usuario

dropdownCategorias.childNodes.forEach(item => item.addEventListener("click", e => {
    refrescarProductos(e.target.innerText);
    dropdownCategorias.childNodes.forEach(item => item.classList?.remove("categoria-seleccionada"));
    e.target.classList.add("categoria-seleccionada");
}))


function agregarAlCarrito(producto) {

    const talleSelect = document.querySelector(`.talle-select[data-product-id="${producto.id}"]`)
    const talleItem = talleSelect?.value;
    if(!talleItem){
        Swal.fire({
            title: 'Talle no seleccionado',
            text: 'Por favor, seleccione el talle deseado',
            icon: 'error',
            confirmButtonText: 'Entendido'
        })
        return;
    }
    const itemEnCarrito = carrito.find(item => item.producto.id == producto.id && item.talle == talleItem)
    if(!itemEnCarrito){
        carrito.push(new Item(producto, talleItem));
    } else {
        itemEnCarrito.agregarUnidad()
    }
    const stock =  producto.obtenerStockPorTalle(carrito, talleItem);
    const stockDisplay = document.querySelector(`#stock-${producto.id}`);
    
    if(stock < 1){
        talleSelect.querySelector(`#option-${producto.id}-${talleItem}`).setAttribute("disabled", "");
        talleSelect.value = "";
    }
    stockDisplay.innerText = toStringUnidadesDisponibles(stock)

    localStorage.setItem('carrito', JSON.stringify(carrito));
    refrescarCarrito();
}

function eliminarDelCarrito(item){

    if(item.cantidad > 1){
        item.eliminarUnidad();
    } else {
        const indexElem = carrito.indexOf(item);
        carrito.splice(indexElem, 1);
    }
    if(document.querySelector(`.talle-select[data-product-id="${item.producto.id}"]`)?.value == item.talle){
        const stock =  item.producto.obtenerStockPorTalle(carrito, item.talle)
        document.querySelector(`#stock-${item.producto.id}`).innerText = toStringUnidadesDisponibles(stock);
    }
    document.querySelector(`#option-${item.producto.id}-${item.talle}`).disabled = false;


    localStorage.setItem('carrito', JSON.stringify(carrito));
    refrescarCarrito();
}

function refrescarCarrito() {

    contenedorCarrito.innerHTML = "";
    carrito.forEach(item => {
        let contenidoItem = item.producto.nombre + " $" + item.producto.precio + " -  x" + item.cantidad + " (talle " + item.talle + ")";
        contenedorCarrito.innerHTML += `<li id="carrito-${item.producto.id}-${item.talle}">${contenidoItem} <a href="#" id="eliminar-${item.producto.id}-${item.talle}">X</a></li>`;;
    })

    carrito.forEach(item => document.querySelector(`#eliminar-${item.producto.id}-${item.talle}`).addEventListener("click", e => {e.preventDefault(); eliminarDelCarrito(item)}))

    contenedorTotal.innerText = "Total a pagar: $" + carrito.map(item => item.producto.precio * item.cantidad).reduce((a, b) => a + b, 0);

    if(carrito.length > 0){
        badgeCarrito.classList.remove("badgeOculto");
        badgeCarrito.innerHTML = carrito.reduce((acumulador, itemActual) => acumulador + itemActual.cantidad, 0);
    } else {
        badgeCarrito.classList.add("badgeOculto");
    }
    
}

function toStringUnidadesDisponibles(stock){
    return stock > 0 ? `Queda${stock == 1 ? '' : 'n'} ${ stock } unidad${stock == 1 ? '' : 'es'}` : '\u00a0'
}

function refrescarProductos(categoria = "") {

    contenedorProductos.innerHTML = '';
    const productosMostrados = misProductos.filter(producto => categoria != "" && categoria != "Todos" ? producto.categoria == categoria : true);

    productosMostrados.forEach(producto =>
            contenedorProductos.innerHTML += `
            <div class="col">
                <div class="card mt-4">
                    <img class="card-img-top" src="${producto.imagen}" alt="Card image">
                    <div class="card-body">
                        <h4 class="card-title">${producto.nombre}</h4>
                            <p class="card-text-precio">$${producto.precio}</p>
                            <p class="card-text-cat">${producto.categoria}</p>
                            <select class="talle-select" data-product-id="${producto.id}" aria-label="Seleccion de talle">
                                <option selected value="">Seleccioná un talle</option>
                                ${producto.obtenerStockActual(carrito).map(
                                    (stock, index) => {
                                        const talle = index + 1;
                                        return `<option ${stock < 1 ? 'disabled' : ''} value="${talle}" data-stock="${stock}" name="option-${producto.id}" id="option-${producto.id}-${talle}"/>
                                                    ${talle}
                                                </option>`
                                    }
                                ).join('')}
                            </select>
                            <span id="stock-${producto.id}">&nbsp</span>
                            <a id="addButton-${producto.id}" class="btn btn-primary mt-2">Añadir al carrito</a>
                    </div>
                </div>
            </div>`
    );

    productosMostrados.forEach(producto => {
        document.querySelector(`#addButton-${producto.id}`).addEventListener("click", function() {
            agregarAlCarrito(producto);
        });
    });

    document.querySelectorAll(`.talle-select`).forEach(
        element => element.addEventListener("change", e => {
            const idProducto = element.getAttribute("data-product-id");
            const talle = e.target.value;
            const item = carrito.find(item => item.producto.id == idProducto && item.talle == talle);
            const stock = item == null ? e.target.querySelector(`#option-${element.getAttribute("data-product-id")}-${e.target.value}`)?.getAttribute("data-stock") : item.producto.obtenerStockPorTalle(carrito, talle);
            document.querySelector(`#stock-${idProducto}`).innerText=
            talle ? toStringUnidadesDisponibles(stock) : '\u00a0'
        })
    )
}
