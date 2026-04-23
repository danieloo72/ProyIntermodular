const contenedor = document.querySelector(".contenedor");
const modal = document.getElementById("modalCoche");

// Variables de estado
let cochesOriginales = []; // Guardamos los 10 coches aquí
let favoritos = JSON.parse(localStorage.getItem("favoritos")) || []; // IDs de favoritos
let cocheSeleccionadoActual = null;
let viendoFavoritos = false; // Variable para saber si estamos en la vista de favoritos
const btnFavoritosTop = document.getElementById("favoritos"); // Referencia al botón superior

// 1. Cargar y guardar los coches
async function cargarPrimerosDiezCoches() {
    const ids = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
    contenedor.innerHTML = "<p>Cargando catálogo...</p>";

    try {
        const promesas = ids.map(id => 
            fetch(`http://localhost:8080/api/coches/${id}`).then(res => res.ok ? res.json() : null)
        );

        const resultados = await Promise.all(promesas);
        // Filtramos los nulos si algún ID no existe
        cochesOriginales = resultados.filter(c => c !== null);
        
        listarCoches(cochesOriginales);
    } catch (error) {
        console.error("Error al conectar:", error);
        contenedor.innerHTML = "<p>Error al conectar con el servidor.</p>";
    }
}

// 2. Renderizar tarjetas
function listarCoches(lista) {
    contenedor.innerHTML = "";
    if (lista.length === 0) {
        contenedor.innerHTML = "<p>No se han encontrado coches.</p>";
        return;
    }

    lista.forEach(coche => {
        const tarjeta = document.createElement("div");
        tarjeta.classList.add("tarjeta");
        
        const precio = coche.precioVenta || coche.precio || "Consultar";
        const imagen = coche.urlImagen || coche.imagen || "img/default.jpg";

        tarjeta.innerHTML = `
            <h3>${coche.marca} ${coche.modelo}</h3>
            <p><strong>${precio} €</strong> - ${coche.ciudad}</p>
            <img src="${imagen}" alt="${coche.marca}">
        `;
        
        tarjeta.addEventListener("click", () => abrirModal(coche));
        contenedor.appendChild(tarjeta);
    });
}

// 3. Lógica del Buscador
document.getElementById("buscar").addEventListener("input", (e) => {
    const termino = e.target.value.toLowerCase();
    const filtrados = cochesOriginales.filter(c => 
        c.marca.toLowerCase().includes(termino) || 
        c.modelo.toLowerCase().includes(termino)
    );
    listarCoches(filtrados);
});

// 4. Lógica de Favoritos (Botón Superior como Interruptor)
btnFavoritosTop.addEventListener("click", () => {
    viendoFavoritos = !viendoFavoritos; // Alterna entre true y false

    if (viendoFavoritos) {
        // Entramos en modo favoritos
        btnFavoritosTop.innerText = "Salir de Favoritos";
        btnFavoritosTop.style.backgroundColor = "#ef4444"; // Se vuelve rojo
        
        // CUIDADO: Dependiendo de tu API, el ID puede venir como 'id' o 'idCoche'
        const soloFavoritos = cochesOriginales.filter(c => favoritos.includes(c.id || c.idCoche));
        listarCoches(soloFavoritos);
    } else {
        // Salimos de favoritos, volvemos a la lista general
        btnFavoritosTop.innerText = "Favoritos";
        btnFavoritosTop.style.backgroundColor = "#7c3aed"; // Vuelve a morado
        
        listarCoches(cochesOriginales);
    }
});

// 5. Resetear vista (Buscador y Favoritos)
document.getElementById("resetear").addEventListener("click", () => {
    document.getElementById("buscar").value = "";
    
    // Restaurar el estado del botón favoritos si estábamos ahí
    viendoFavoritos = false;
    btnFavoritosTop.innerText = "Favoritos";
    btnFavoritosTop.style.backgroundColor = "#7c3aed";
    
    listarCoches(cochesOriginales);
});

// 6. Modal y Relleno de datos
function abrirModal(coche) {
    cocheSeleccionadoActual = coche;
    
    // Rellenar campos asegurando que toman el valor correcto (blindado contra undefined)
    const precio = coche.precioVenta || coche.precio || 0;
    const kms = coche.kilometraje || coche.km || 0;
    const anio = coche.anioFabricacion || coche.anio || "N/A";

    document.getElementById("modalTitulo").innerText = `${coche.marca} ${coche.modelo} ${coche.version ? `(${coche.version})` : ''}`;
    document.getElementById("modalImagen").src = coche.urlImagen || coche.imagen;
    document.getElementById("modalAnio").innerText = anio;
    document.getElementById("modalPrecio").innerText = precio.toLocaleString() + " €";
    document.getElementById("modalColor").innerText = coche.color || "No especificado";
    document.getElementById("modalCarburante").innerText = coche.combustible || "No especificado";
    document.getElementById("modalTransmision").innerText = coche.transmision || "No especificado";
    document.getElementById("modalKM").innerText = Number(kms).toLocaleString() + " km";
    document.getElementById("modalCiudad").innerText = coche.ciudad || "No especificada";
    
    const desc = document.getElementById("modalDescripcion");
    if(desc) desc.innerText = `Estado: ${coche.estado || 'Disponible'} | Etiqueta: ${coche.etiquetaAmbiental || 'N/A'}`;

    // Obtener ID real del coche
    const cocheId = coche.id || coche.idCoche;

    // Actualizar estado del botón de favoritos en el modal
    const btnFav = document.getElementById("btnFavoritoModal");
    if (favoritos.includes(cocheId)) {
        btnFav.innerText = "Quitar de Favoritos";
        btnFav.classList.add("es-favorito");
    } else {
        btnFav.innerText = "Añadir a Favoritos";
        btnFav.classList.remove("es-favorito");
    }

    modal.showModal();
}

// 7. Evento para añadir/quitar favorito dentro del modal
document.getElementById("btnFavoritoModal").addEventListener("click", () => {
    const id = cocheSeleccionadoActual.id || cocheSeleccionadoActual.idCoche;
    
    if (favoritos.includes(id)) {
        favoritos = favoritos.filter(favId => favId !== id); // Eliminar
    } else {
        favoritos.push(id); // Añadir
    }
    
    localStorage.setItem("favoritos", JSON.stringify(favoritos));
    abrirModal(cocheSeleccionadoActual); // Refrescar el texto y color del botón del modal
    
    // Si estamos en la vista de favoritos y quitamos un coche, actualizar la lista de fondo
    if (viendoFavoritos) {
        const soloFavoritos = cochesOriginales.filter(c => favoritos.includes(c.id || c.idCoche));
        listarCoches(soloFavoritos);
    }
});

// Inicialización
cargarPrimerosDiezCoches();

// Evento cerrar modal
document.getElementById("cerrarModal").addEventListener("click", () => modal.close());