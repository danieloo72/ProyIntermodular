const contenedor = document.querySelector(".contenedor");
const modal = document.getElementById("modalCoche");

// Variables de estado
let cochesOriginales = [];
let favoritos = JSON.parse(localStorage.getItem("favoritos")) || []; // IDs de favoritos
let cocheSeleccionadoActual = null;
let viendoFavoritos = false; // Variable para saber si estamos en la vista de favoritos
const btnFavoritosTop = document.getElementById("favoritos");

// Modal Filtros variables
const modalFiltro = document.getElementById("modalFiltro");
const btnAbrirFiltros = document.getElementById("filtros");
const btnCerrarFiltro = document.getElementById("btnCerrarFiltro");
const btnAplicarFiltros = document.getElementById("btnAplicarFiltros");

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
        contenedor.innerHTML = "<p>No se han encontrado coches con esos filtros.</p>";
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

// 3. Lógica del Buscador Simple
document.getElementById("buscar").addEventListener("input", (e) => {
    const termino = e.target.value.toLowerCase();
    const filtrados = cochesOriginales.filter(c => 
        (c.marca && c.marca.toLowerCase().includes(termino)) || 
        (c.modelo && c.modelo.toLowerCase().includes(termino))
    );
    listarCoches(filtrados);
});

// 4. Lógica de Favoritos (Botón Superior como Interruptor)
btnFavoritosTop.addEventListener("click", () => {
    viendoFavoritos = !viendoFavoritos;

    if (viendoFavoritos) {
        btnFavoritosTop.innerText = "Salir de Favoritos";
        btnFavoritosTop.style.backgroundColor = "#ef4444";
        
        const soloFavoritos = cochesOriginales.filter(c => favoritos.includes(c.id || c.idCoche));
        listarCoches(soloFavoritos);
    } else {
        btnFavoritosTop.innerText = "Favoritos";
        btnFavoritosTop.style.backgroundColor = "#7c3aed";
        
        listarCoches(cochesOriginales);
    }
});

// 5. Resetear vista (Buscador, Filtros y Favoritos)
document.getElementById("resetear").addEventListener("click", () => {
    document.getElementById("buscar").value = "";
    
    viendoFavoritos = false;
    btnFavoritosTop.innerText = "Favoritos";
    btnFavoritosTop.style.backgroundColor = "#7c3aed";
    
    // Resetea también los selectores del filtro avanzado si existen
    const selectores = modalFiltro.querySelectorAll("select");
    selectores.forEach(select => select.value = "");

    listarCoches(cochesOriginales);
});

// 6. Modal y Relleno de datos del Coche
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

// 7. Evento para añadir/quitar favorito dentro del modal
document.getElementById("btnFavoritoModal").addEventListener("click", () => {
    const id = cocheSeleccionadoActual.id || cocheSeleccionadoActual.idCoche;
    
    if (favoritos.includes(id)) {
        favoritos = favoritos.filter(favId => favId !== id);
    } else {
        favoritos.push(id);
    }
    
    localStorage.setItem("favoritos", JSON.stringify(favoritos));
    abrirModal(cocheSeleccionadoActual); // Recarga para cambiar color
    
    if (viendoFavoritos) {
        const soloFavoritos = cochesOriginales.filter(c => favoritos.includes(c.id || c.idCoche));
        listarCoches(soloFavoritos);
    }
});
document.getElementById("cerrarModal").addEventListener("click", () => modal.close());

// ============================================
// LÓGICA DE BÚSQUEDA AVANZADA (NUEVO)
// ============================================

// Mapa de los IDs de los selectores a las propiedades del objeto coche
const mapeoAtributos = {
    "modalFMarca": "marca",
    "modalFModelo": "modelo",
    "modalFAnio": ["anioFabricacion", "anio"], 
    "modalFPrecio": ["precioVenta", "precio"],
    "modalFColor": "color",
    "modalFCombustible": "combustible",
    "modalFTransmision": "transmision",
    "modalFKM": ["kilometraje", "km"],
    "modalFCiudad": "ciudad",
    "modalFEtiqAmb": "etiquetaAmbiental",
    "modalFVersion": "version",
    "modalFDisponible": ["estado", "disponible"]
};

// Función auxiliar para obtener un valor del coche teniendo en cuenta distintas posibles propiedades
function obtenerValorCoche(coche, propiedades) {
    if (Array.isArray(propiedades)) {
        for (let prop of propiedades) {
            if (coche[prop] !== undefined) return coche[prop];
        }
        return undefined;
    }
    return coche[propiedades];
}

btnAbrirFiltros.addEventListener("click", () => {
    // Al abrir el modal, poblamos las opciones dinámicamente según los coches cargados
    for (let selectId in mapeoAtributos) {
        const selectElement = document.getElementById(selectId);
        const propiedad = mapeoAtributos[selectId];
        
        // Guardamos el valor seleccionado actual para no perderlo al re-abrir
        const valorActual = selectElement.value;
        
        // Extraemos valores únicos
        const valoresUnicos = [...new Set(cochesOriginales.map(c => obtenerValorCoche(c, propiedad)))].filter(v => v !== undefined && v !== "");
        
        // Limpiamos y recreamos las opciones
        selectElement.innerHTML = '<option value="">Todos</option>';
        valoresUnicos.sort().forEach(valor => {
            selectElement.innerHTML += `<option value="${valor}" ${valorActual == valor ? 'selected' : ''}>${valor}</option>`;
        });
    }
    
    modalFiltro.showModal();
});

btnAplicarFiltros.addEventListener("click", () => {
    const cochesFiltrados = cochesOriginales.filter(coche => {
        // Para que un coche pase el filtro, debe cumplir TODAS las condiciones de los selectores que no estén en "Todos"
        return Object.keys(mapeoAtributos).every(selectId => {
            const selectValor = document.getElementById(selectId).value;
            if (selectValor === "") return true; // Si el select está en "Todos", ignora esta condición
            
            const cocheValor = obtenerValorCoche(coche, mapeoAtributos[selectId]);
            return String(cocheValor) === String(selectValor);
        });
    });

    // Desactivamos la vista de favoritos si filtramos de forma general
    viendoFavoritos = false;
    btnFavoritosTop.innerText = "Favoritos";
    btnFavoritosTop.style.backgroundColor = "#7c3aed";

    listarCoches(cochesFiltrados);
    modalFiltro.close();
});

btnCerrarFiltro.addEventListener("click", () => {
    modalFiltro.close();
});

// Iniciamos la app
cargarPrimerosDiezCoches();