// ===================================
// LÓGICA DE LA GALERÍA CON LIGHTBOX
// ===================================
const imagenes = document.querySelectorAll(".grid img");
const lightbox = document.getElementById("lightbox");
const imagenAmpliada = document.getElementById("imagen-ampliada");
const cerrar = document.querySelector(".cerrar");

imagenes.forEach(imagen => {
    imagen.addEventListener("click", () => {
        lightbox.style.display = "flex";
        imagenAmpliada.src = imagen.src;
    });
});

cerrar.addEventListener("click", () => {
    lightbox.style.display = "none";
});

lightbox.addEventListener("click", (e) => {
    if(e.target === lightbox){
        lightbox.style.display = "none";
    }
});

// ===================================
// LÓGICA DEL CARRUSEL
// ===================================
let index = 0;
function mover(direccion) {
    const track = document.getElementById('track');
    index += direccion;
    
    // Limita el movimiento
    if (index < 0) index = 0;
    if (index > 2) index = 2; 
    
    track.style.transform = `translateX(-${index * 33.33}%)`;
}
