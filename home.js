const contenedor = document.querySelector(".contenedor");
const modal = document.getElementById("modalCoche");

// Variables de estado
let cochesOriginales = [];
let favoritos = JSON.parse(localStorage.getItem("favoritos")) || []; // IDs de favoritos
let cocheSeleccionadoActual = null;
let viendoFavoritos = false; // Variable para saber si estamos en la vista de favoritos
const btnFavoritosTop = document.getElementById("favoritos");

// 1. Cargar y guardar los coches
async function cargarPrimerosDiezCoches() {
    const ids = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
    contenedor.innerHTML = "<p>Cargando catálogo...</p>";

    try {
        const promesas = ids.map(id => 
            fetch(`http://localhost:8080/api/coches/${id}`).then(res => res.ok ? res.json() : null)
        );

        const resultados = await Promise.all(promesas);
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
        const imagen = coche.urlImagen || coche.imagen;

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
        btnFavoritosTop.style.backgroundColor = "#ef4444";
        
        const soloFavoritos = cochesOriginales.filter(c => favoritos.includes(c.id || c.idCoche));
        listarCoches(soloFavoritos);
    } else {
        // Salimos de favoritos, volvemos a la lista general
        btnFavoritosTop.innerText = "Favoritos";
        btnFavoritosTop.style.backgroundColor = "#7c3aed";
        
        listarCoches(cochesOriginales);
    }
});

// 5. Resetear vista (Buscador y Favoritos)
document.getElementById("resetear").addEventListener("click", () => {
    document.getElementById("buscar").value = "";
    
    viendoFavoritos = false;
    btnFavoritosTop.innerText = "Favoritos";
    btnFavoritosTop.style.backgroundColor = "#7c3aed";
    
    listarCoches(cochesOriginales);
});

// 6. Modal y Relleno de datos
function abrirModal(coche) {
    cocheSeleccionadoActual = coche;
    
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

function openModal(filtrados) {
    filtradoCoche = cocheFiltrado;
    
    const precio = cocheFiltrado.precioVenta || cocheFiltrado.precio || 0;
    const kms = cocheFiltrado.kilometraje || cocheFiltrado.km || 0;
    const anio = cocheFiltrado.anioFabricacion || cocheFiltrado.anio || "N/A";

    document.getElementById("modalFAnio").innerText = `${anio}`;
    document.getElementById("modalFPrecio").innerText = `${precio}`;
    document.getElementById("modalFMarca").innerText = `${marca}`;
    document.getElementById("modalFModelo").innerText = `${modelo}`;
    document.getElementById("modalFColor").innerText = `${color}`;
    document.getElementById("modalFCombustible").innerText = `${combustible}`;
    document.getElementById("modalFTransmision").innerText = `${transmision}`;
    document.getElementById("modalFKM").innerText = `${km}`;
    document.getElementById("modalFCiudad").innerText = `${ciudad}`;
    document.getElementById("modalFEtiqAmb").innerText = `${etiquetaAmbiental}`;
    document.getElementById("modalFVersion").innerText = `${version}`;
    document.getElementById("modalFDisponible").innerText = `${disponible}`;

    modal.showModal();
}


// 7. Evento para añadir/quitar favorito dentro del modal
document.getElementById("btnFavoritoModal").addEventListener("click", () => {
    const id = cocheSeleccionadoActual.id || cocheSeleccionadoActual.idCoche;
    
    if (favoritos.includes(id)) {
        favoritos = favoritos.filter(favId => favId !== id);
    } else {
        favoritos.push(id);
    }
    
    localStorage.setItem("favoritos", JSON.stringify(favoritos));
    abrirModal(cocheSeleccionadoActual);
    
    // Si estamos en la vista de favoritos y quitamos un coche, actualizar la lista de fondo
    if (viendoFavoritos) {
        const soloFavoritos = cochesOriginales.filter(c => favoritos.includes(c.id || c.idCoche));
        listarCoches(soloFavoritos);
    }
});

cargarPrimerosDiezCoches();

document.getElementById("cerrarModal").addEventListener("click", () => modal.close());