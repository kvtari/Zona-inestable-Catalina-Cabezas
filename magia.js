gsap.registerPlugin(ScrollTrigger);
const { Engine, Render, Runner, Bodies, Composite, Events, Body, Mouse, MouseConstraint } = Matter;

const engine = Engine.create();
const world = engine.world;

const render = Render.create({
    element: document.body,
    engine: engine,
    options: {
        width: window.innerWidth,
        height: window.innerHeight,
        wireframes: false,
        background: 'transparent' 
    }
});

Render.run(render);
Runner.run(Runner.create(), engine);

// Límites del escenario
const suelo = Bodies.rectangle(window.innerWidth / 2, window.innerHeight - 20, window.innerWidth, 40, { isStatic: true, render: { fillStyle: '#8C2041' } });
const muroIzq = Bodies.rectangle(0, window.innerHeight / 2, 40, window.innerHeight, { isStatic: true, render: { visible: false } });
const muroDer = Bodies.rectangle(window.innerWidth, window.innerHeight / 2, 40, window.innerHeight, { isStatic: true, render: { visible: false } });

Composite.add(world, [suelo, muroIzq, muroDer]);

// Las Piezas desordenadas
const piezas = [];
for (let i = 0; i < 3; i++) {
    const xAleatoria = window.innerWidth * 0.2 + (Math.random() * (window.innerWidth * 0.6));
    const pieza = Bodies.rectangle(xAleatoria, -50 - (i * 40), 120, 80, {
        render: { fillStyle: '#FEFBF2' }, 
        friction: 0.8, 
        density: 0.05
    });
    piezas.push(pieza);
}
Composite.add(world, piezas);

// Control por Mouse
const mouse = Mouse.create(render.canvas);
const mouseConstraint = MouseConstraint.create(engine, {
    mouse: mouse,
    constraint: { stiffness: 0.2, render: { visible: false } }
});
Composite.add(world, mouseConstraint);
render.mouse = mouse;

let nivelNervio = 0;

// ------------------------------------------------------------------
// EL SENSOR INTELIGENTE: La Regla del Segundo de Estabilidad
// ------------------------------------------------------------------
let tiempoEstable = 0; // Nuestro cronómetro

Events.on(engine, 'afterUpdate', () => {
    if (document.body.classList.contains("bloqueado")) {
        let pisoY = window.innerHeight - 20; // La posición central del suelo
        let piezaMasAltaY = pisoY;
        let todasQuietas = true; // Asumimos que están quietas hasta que se demuestre lo contrario

        piezas.forEach(pieza => {
            // Si alguna pieza se está moviendo rápido (rebotando o cayendo), arruina la estabilidad
            if (pieza.speed > 0.5) {
                todasQuietas = false;
            }
            
            // Registramos qué tan arriba está la pieza más alta
            if (pieza.position.y < piezaMasAltaY) {
                piezaMasAltaY = pieza.position.y;
            }
        });

        // Verificamos si el usuario tiene una pieza agarrada con el mouse
        let usuarioAgarrando = mouseConstraint.body !== null;

        // Calculamos la altura de la torre (3 bloques miden aprox 120px)
        let alturaTorre = pisoY - piezaMasAltaY;

        // CONDICIÓN MÁXIMA: La torre mide más de 90px + Todo está quieto + No estás agarrando nada
        if (alturaTorre > 150 && todasQuietas && !usuarioAgarrando) {
            tiempoEstable++; // El cronómetro empieza a sumar
            
            // Si logra mantenerse así por 60 fotogramas (1 segundo completo)
            if (tiempoEstable > 60) {
                // ¡META LOGRADA! Rompemos los candados
                document.documentElement.classList.remove("bloqueado");
                document.body.classList.remove("bloqueado");
                
                // Le avisamos a la animación que la página ya es larga
                ScrollTrigger.refresh();

                // Cambiamos el texto
                const instruccion = document.getElementById("instruccion-armado");
                if (instruccion) {
                    instruccion.innerText = "¡Estructura estable! El scroll se ha desbloqueado.";
                    instruccion.style.color = "#4da6ff"; 
                }
            }
        } else {
            // Si la torre tambalea, una pieza cae o agarras otra, el cronómetro vuelve a CERO
            tiempoEstable = 0;
        }
    }
});

// ------------------------------------------------------------------
// EL DIRECTOR DE ESCENA (Scroll y Caída)
// ------------------------------------------------------------------
ScrollTrigger.create({
    trigger: "body",
    start: "top top",
    end: "bottom bottom",
    onUpdate: (self) => {
        const progreso = self.progress;

        if (progreso < 0.33) {
            nivelNervio = 0;
            Body.setPosition(suelo, { x: window.innerWidth / 2, y: window.innerHeight - 20 });
        }
        else if (progreso >= 0.33 && progreso < 0.66) {
            nivelNervio = (progreso - 0.33) * 2; 
            Body.setPosition(suelo, { x: window.innerWidth / 2, y: window.innerHeight - 20 });
        }
        else if (progreso >= 0.66) {
            nivelNervio = 0;
            Body.setPosition(suelo, { x: 9999, y: 9999 }); 
        }

        // Si el usuario se devuelve hacia arriba
        if (progreso < 0.66) {
            piezas.forEach(pieza => {
                if (pieza.position.y > window.innerHeight + 60) {
                    Body.setPosition(pieza, { x: window.innerWidth / 2 + (Math.random() - 0.5) * 200, y: -50 });
                    Body.setVelocity(pieza, { x: 0, y: 0 });
                    Body.setAngularVelocity(pieza, 0);
                }
            });
        }
    }
});

Events.on(engine, 'beforeUpdate', () => {
    if (nivelNervio > 0) {
        piezas.forEach((pieza) => {
            const fuerzaX = (Math.random() - 0.5) * nivelNervio;
            const fuerzaY = -Math.random() * (nivelNervio * 0.7); 
            Body.applyForce(pieza, pieza.position, { x: fuerzaX, y: fuerzaY });
            Body.setAngularVelocity(pieza, (Math.random() - 0.5) * (nivelNervio * 0.2));
        });
    }
}); 

// Registramos el plugin
gsap.registerPlugin(ScrollTrigger);

// 1. Transición de color de fondo
gsap.to("body", {
    backgroundColor: "#8C2041", // Tu color Frambuesa
    scrollTrigger: {
        trigger: "#escenario-interactivo",
        start: "top top", 
        end: "+=1000", // La transición dura 1000px de scroll
        scrub: true, // Esto hace que el color siga al mouse fluidamente
        onEnter: () => {
            // Aquí dispararemos la aparición de las piezas "nuevas"
            revelarPiezasNuevas();
        }
    }
});

// 2. Función para revelar las piezas
function revelarPiezasNuevas() {
    // Aquí puedes cambiar el color de las piezas existentes
    // o crear nuevas con Matter.Bodies.rectangle(...)
    console.log("¡Las piezas emergen del vacío!");
    
    // Ejemplo: Animamos el color de las piezas que ya creamos
    piezas.forEach(pieza => {
        gsap.to(pieza.render, {
            fillStyle: "#8C2041", // Frambuesa
            duration: 1
        });
    });
}























