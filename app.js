class Producto {
  constructor(id, nombre, precio, categoria, imagen = false) {
    this.id = id;
    this.nombre = nombre;
    this.precio = precio;
    this.categoria = categoria;
    this.imagen = imagen;
  }
}

// Esta clase va a simular una base de datos. Vamos a cargar todos los productos
// de nuestro e-commerce.
class BaseDeDatos {
  constructor() {
    // Array de la base de datos
    this.productos = [];
  }

  // Nos retorna el array con todos los productos que tiene el archivo JSON
  async traerRegistros() {
    const response = await fetch("./productos.json");
    this.productos = await response.json();
    return this.productos;
  }

  // Busca un producto por ID, si lo encuentra lo retorna en forma de objeto
  // A tener en cuenta: Los IDs son únicos, debe haber uno solo por producto para evitar errores
  registroPorId(id) {
    return this.productos.find((producto) => producto.id === id);
  }

  // Retorna una lista (array) de productos que incluyan en el nombre los caracteres
  // que le pasamos por parámetro. Si le pasamos "a" como parámetro, va a buscar y
  // devolver todos los productos que tengan la letra "a" en el nombre del producto
  registrosPorNombre(palabra) {
    return this.productos.filter((producto) => producto.nombre.toLowerCase().includes(palabra));
  }

  // Similar a registrosPorNombre, pero filtra los productos por categoría
  registrosPorCategoria(categoria) {
    return this.productos.filter((producto) => producto.categoria == categoria);
  }
}

// Objeto de la base de datos
const bd = new BaseDeDatos();

// Elementos
const divProductos = document.querySelector("#productos");
const divCarrito = document.querySelector("#carrito");
const spanCantidadProductos = document.querySelector("#cantidadProductos");
const spanTotalCarrito = document.querySelector("#totalCarrito");
const inputBuscar = document.querySelector("#inputBuscar");
const botonCarrito = document.querySelector("section h1");
const botonComprar = document.querySelector("#botonComprar");
const botonesCategorias = document.querySelectorAll(".btnCategoria");

// Botones para filtrar productos por categoría
botonesCategorias.forEach((boton) => {
  boton.addEventListener("click", (event) => {
    event.preventDefault();
    quitarClase();
    boton.classList.add("seleccionado");
    const productosPorCategoria = bd.registrosPorCategoria(boton.innerText);
    cargarProductos(productosPorCategoria);
  });
});

const botonTodos = document.querySelector("#btnTodos");
botonTodos.addEventListener("click", (event) => {
  event.preventDefault();
  quitarClase();
  botonTodos.classList.add("seleccionado");
  // En el botón Todos no usamos asincronismo, sino que directamente
  // cargamos lo que ya cargó previamente la primera vez que llamamos
  // al fetch
  cargarProductos(bd.productos);
});

// Esta clase busca algún botón que ya tenga la clase "seleccionado"
// y le remueve la clase, quedando así todos los botones sin estar
// seleccionados
function quitarClase() {
  const botonSeleccionado = document.querySelector(".seleccionado");
  if (botonSeleccionado) {
    botonSeleccionado.classList.remove("seleccionado");
  }
}

// Llamamos a la función regular cargarProductos, le pasamos como parámetro
// el método de la base de datos que trae todos los productos
bd.traerRegistros().then((productos) => cargarProductos(productos));

// Esta función regular recibe como parámetro un array de productos y se encarga
// de renderizarlos en el HTML
function cargarProductos(productos) {
  divProductos.innerHTML = "";
  // Recorremos todos los productos y lo agregamos al div #productos
  for (const producto of productos) {
    // A cada div lo agregamos un botón de Agregar al carrito, y a ese botón le pasamos
    // el atributo data-id, con el id del producto. Eso después nos va a ser muy útil
    // para saber desde que producto estamos haciendo click
    divProductos.innerHTML += `
        <div class="producto">
            <h2>${producto.nombre}</h2>
            <p class="precio">$${producto.precio}</p>
            <div class="imagen">
              <img src="img/${producto.imagen}" />
            </div>
            <a href="#" class="btn btnAgregar" data-id="${producto.id}">Agregar al carrito</a>
        </div>
    `;
  }
  // Botones agregar al carrito: como no sabemos cuántos productos hay en nuestra base de datos,
  // buscamos TODOS los botones que hayamos renderizado recién, y los recorremos uno por uno
  const botonesAgregar = document.querySelectorAll(".btnAgregar");
  for (const boton of botonesAgregar) {
    // Le agregamos un evento click a cada uno
    boton.addEventListener("click", (event) => {
      event.preventDefault();
      // Obtenemos el ID del producto del atributo data-id
      const id = Number(boton.dataset.id);
      // Con ese ID, consultamos a nuestra base de datos por el producto
      const producto = bd.registroPorId(id);
      // Agregamos el registro (producto) a nuestro carrito
      carrito.agregar(producto);
    });
  }
}

// Clase carrito, para manipular los productos de nuestro carrito
class Carrito {
  constructor() {
    // Cargamos del storage
    const carritoStorage = JSON.parse(localStorage.getItem("carrito"));
    // Inicializamos variables
    this.carrito = carritoStorage || [];
    this.total = 0;
    this.totalProductos = 0;
    // Apenas se crea el carrito, que llame al método listar para que
    // renderice todos los productos que haya en el storage
    this.listar();
  }

  // Método para agregar el producto al carrito
  agregar(producto) {
    // Si el producto está en el carrito, lo guardo en esta variable
    const productoEnCarrito = this.estaEnCarrito(producto);
    if (productoEnCarrito) {
      // Si está en el carrito, le sumo la cantidad
      productoEnCarrito.cantidad++;
    } else {
      // Si no está, lo agrego al carrito
      this.carrito.push({ ...producto, cantidad: 1 });
    }
    // Actualizo el storage
    localStorage.setItem("carrito", JSON.stringify(this.carrito));
    // Actualizo el carrito en el HTML
    this.listar();
    // Toastify
    Toastify({
      text: `${producto.nombre} fue agregado al carrito`,
      position: "center",
      className: "info",
      gravity: "bottom",
      style: {
        background: "linear-gradient(to right, grey, rgb(107, 107, 107))",
      },
    }).showToast();
  }

  // Verificamos si el producto está en el carrito. Usamos desectruración en el parámetro:
  // recibimos el objeto producto en el parámetro pero solo usamos la propiedad id
  estaEnCarrito({ id }) {
    return this.carrito.find((producto) => producto.id === id);
  }

  // Este método es el encargado de actualizar el HTML de nuestro carrito
  listar() {
    // Reiniciamos las variables
    this.total = 0;
    this.totalProductos = 0;
    divCarrito.innerHTML = "";
    // Recorremos todos los productos del carrito y lo agregamos al div #carrito
    for (const producto of this.carrito) {
      // A cada div lo agregamos un botón de Quitar del carrito, y a ese botón le pasamos
      // el atributo data-id, con el id del producto. Eso después nos va a ser muy útil
      // para saber desde que producto estamos haciendo click
      divCarrito.innerHTML += `
        <div class="productoCarrito">
            <h2>${producto.nombre}</h2>
            <p>$${producto.precio}</p>
            <p>Cantidad: ${producto.cantidad}</p>
            <a href="#" data-id="${producto.id}" class="btn btnQuitar">Quitar del carrito</a>
        </div>
    `;
      // Actualizamos los totales
      this.total += producto.precio * producto.cantidad;
      this.totalProductos += producto.cantidad;
    }
    // Oculto el botón Comprar si no hay productos
    if (this.totalProductos > 0) {
      botonComprar.classList.remove("oculto"); // Muestro el botón
    } else {
      botonComprar.classList.add("oculto"); // Oculto el botón
    }
    // Botones de quitar: como no sabemos cuántos productos hay en el carrito,
    // buscamos TODOS los botones que hayamos renderizado recién, y los recorremos uno por uno
    const botonesQuitar = document.querySelectorAll(".btnQuitar");
    for (const boton of botonesQuitar) {
      // Le agregamos un evento onclick a cada uno
      boton.onclick = (event) => {
        event.preventDefault();
        // Llamamos al método quitar, pasándole el ID del producto que sacamos
        // del atributo data-id del HTML
        this.quitar(Number(boton.dataset.id));
      };
    }
    // Actualizamos variables carrito
    spanCantidadProductos.innerText = this.totalProductos;
    spanTotalCarrito.innerText = this.total;
  }

  // Método para quitar o restar productos del carrito
  quitar(id) {
    // Recibimos como parámetro el ID del producto, con ese ID buscamos el índice
    // del producto para poder usar el splice y borrarlo en caso de que haga falta
    const indice = this.carrito.findIndex((producto) => producto.id === id);
    // Si la cantidad del producto es mayor a 1, le resto
    if (this.carrito[indice].cantidad > 1) {
      this.carrito[indice].cantidad--;
    } else {
      // Sino, signica que hay un solo producto, así que lo borro
      this.carrito.splice(indice, 1);
    }
    // Actualizo el storage
    localStorage.setItem("carrito", JSON.stringify(this.carrito));
    // Actualizo el carrito en el HTML
    this.listar();
  }

  // Método para vaciar el carrito
  vaciar() {
    this.carrito = [];
    localStorage.removeItem("carrito");
    this.listar();
  }
}

// Buscador: al soltar una tecla se ejecuta el evento keyup
inputBuscar.addEventListener("keyup", () => {
  // Obtenemos el atributo value del input
  const palabra = inputBuscar.value;
  // Pedimos a nuestra base de datos que nos traiga todos los registros
  // que coincidan con la palabra que pusimos en nuestro input
  const productosEncontrados = bd.registrosPorNombre(palabra.toLowerCase());
  // Lo mostramos en el HTML
  cargarProductos(productosEncontrados);
});

// Toggle para ocultar/mostrar el carrito
botonCarrito.addEventListener("click", () => {
  document.querySelector("section").classList.toggle("ocultar");
});

// Mensaje de compra realizada con la librería Sweet Alert
botonComprar.addEventListener("click", (event) => {
  event.preventDefault();
  Swal.fire({
    title: "Su pedido está en camino",
    text: "¡Su compra ha sido realizada con éxito!",
    icon: "success",
    confirmButtonText: "Aceptar",
  });
  // Vacíamos el carrito
  carrito.vaciar();
  // Ocultamos el carrito en el HTML
  document.querySelector("section").classList.add("ocultar");
});

// Objeto carrito: lo instanciamos a lo último de nuestro archivo JavaScript
// para asegurarnos que TODO esté declarado e inicializado antes de crear el carrito
const carrito = new Carrito();
