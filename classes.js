class Producto {

    constructor(id, nombre, categoria, talles, precio, imagen){
        this.id = id;
        this.nombre = nombre;
        this.categoria = categoria;
        this.talles = talles;
        this.precio = precio;
        this.imagen = imagen;
    }

    obtenerStockActual(carrito){
        return this.talles.map(
            (stockOriginal, index) => {
                const talle = index + 1;
                const itemCarrito = carrito.find(item => item.producto.id == this.id && item.talle == talle);
                const cantidadEnCarrito = itemCarrito ? itemCarrito.cantidad : 0;
                return stockOriginal - cantidadEnCarrito;
            }
        )
    }

    obtenerStockPorTalle(carrito, talle){
        const index = talle - 1;
        const itemCarrito = carrito.find(item => item.producto.id == this.id && item.talle == talle);
        const cantidadEnCarrito = itemCarrito ? itemCarrito.cantidad : 0;
        return this.talles[index] - cantidadEnCarrito;
    }

    hayStock(carrito, talle){
        return this.obtenerStockPorTalle(carrito, talle) > 0;
    }

}

class Item {

    constructor(producto, talle, cantidad = 1){
        this.producto = producto;
        this.talle = talle;
        this.cantidad = cantidad;
    }

    agregarUnidad(){
        this.cantidad += 1;
    }

    eliminarUnidad(){
        this.cantidad -= 1;
    }

}