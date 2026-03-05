const urlGeoJSON = "https://raw.githubusercontent.com/WireNext/AlertasAemet/refs/heads/main/avisos_espana.geojson";
let datosGlobales = null;

// 1. TEMA
function initTheme() {
    const theme = localStorage.getItem("theme") || "light";
    document.documentElement.setAttribute("data-theme", theme);
    const btn = document.getElementById("theme-toggle");
    if (btn) {
        btn.onclick = () => {
            const current = document.documentElement.getAttribute("data-theme");
            const nuevo = current === "dark" ? "light" : "dark";
            document.documentElement.setAttribute("data-theme", nuevo);
            localStorage.setItem("theme", nuevo);
        };
    }
}

// 2. BUSCADOR
async function buscarTiempo(poble, targetId) {
    try {
        const geo = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(poble)}&count=1&language=ca`);
        const geoData = await geo.json();
        if (!geoData.results) return;
        const m = geoData.results[0];
        
        const res = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${m.latitude}&longitude=${m.longitude}&current=temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m&hourly=temperature_2m,weather_code,precipitation_probability,precipitation&daily=weather_code,temperature_2m_max,temperature_2m_min,uv_index_max,sunrise,sunset,precipitation_sum&timezone=auto`);
        datosGlobales = await res.json();
        
        const aviso = await obtenerAvisoDesdeGeoJSON(m.latitude, m.longitude);
        renderizar(datosGlobales, m.name, targetId, aviso);
    } catch (e) { console.error(e); }
}

// --- LÓGICA DEL BUSCADOR ---
function ejecutarBusqueda() {
    const input = document.getElementById("buscador-input");
    const ciudad = input.value.trim();
    
    if (ciudad.length > 2) {
        // Guardamos en el historial del navegador
        localStorage.setItem("ultimPobleBuscat", ciudad);
        // Ejecutamos la búsqueda principal
        buscarTiempo(ciudad, "resultado-tiempo-home");
        // Limpiamos el input y quitamos el foco
        input.blur();
    }
}

// Inicialización cuando carga la página
document.addEventListener("DOMContentLoaded", () => {
    initTheme();

    const inputBusqueda = document.getElementById("buscador-input");
    const btnBusqueda = document.getElementById("btn-buscar");

    // 1. Escuchar el clic en la lupa
    if (btnBusqueda) {
        btnBusqueda.onclick = (e) => {
            e.preventDefault();
            ejecutarBusqueda();
        };
    }

    // 2. Escuchar la tecla ENTER
    if (inputBusqueda) {
        inputBusqueda.addEventListener("keypress", (e) => {
            if (e.key === "Enter") {
                e.preventDefault();
                ejecutarBusqueda();
            }
        });
    }

    // 3. Cargar la última ciudad buscada o Valencia por defecto
    const guardado = localStorage.getItem("ultimPobleBuscat") || "Valencia";
    buscarTiempo(guardado, "resultado-tiempo-home");
});

// 3. RENDERIZAR
function renderizar(data, nombre, targetId, aviso) {
    const container = document.getElementById(targetId);
    if(!container) return;
    const { current, daily, hourly } = data;
    const horaActual = new Date().getHours();

    // Lógica de Alerta
    let alertaHtml = "";
    if (aviso && aviso.titulo) {
        const textColor = (aviso.color === "#f3f702" || aviso.color === "yellow") ? "#222" : "#fff";
        alertaHtml = `
            <div class="alerta-card" style="background-color: ${aviso.color}; color: ${textColor};">
                <h4 style="margin:0;">⚠️ ${aviso.titulo}</h4>
                <p class="alerta-desc" style="margin:8px 0; font-size:0.9rem;">${aviso.desc}</p>
                <a href="https://www.aemet.es" target="_blank" style="color:${textColor}; font-weight:bold; font-size:0.8rem; border:1px solid ${textColor}; padding:3px 8px; border-radius:5px; text-decoration:none;">INFO AEMET</a>
            </div>`;
    }

    let html = `
        <div class="weather-hero">
            <h1 class="hero-pueblo">${nombre}</h1>
            <div class="hero-temp">${Math.round(current.temperature_2m)}°</div>
            <div class="hero-icon">${obtenerIcono(current.weather_code)}</div>
            <div class="hero-range">MÀX: ${Math.round(daily.temperature_2m_max[0])}° &nbsp;&nbsp; MÍN: ${Math.round(daily.temperature_2m_min[0])}°</div>
        </div>

        ${alertaHtml}

        <div class="column">
            <h2>Pròximes 24 hores</h2>
            <div class="scroll-x">`;
    
    for (let i = horaActual; i < horaActual + 24; i++) {
        html += `<div class="hora-item"><span class="hora-txt">${(i % 24)}h</span><span>${obtenerIcono(hourly.weather_code[i])}</span><span>${Math.round(hourly.temperature_2m[i])}°</span></div>`;
    }
    
    html += `</div></div><div class="column"><h2>Previsió 7 dies</h2><div class="lista-vertical">`;
    
    for (let i = 0; i < 7; i++) {
        const fecha = new Date(daily.time[i]);
        const diaNombre = fecha.toLocaleDateString("ca", { weekday: 'long' });
        html += `
            <div class="dia-fila" onclick="abrirDetalleDia(${i})">
                <span class="dia-nom">${i === 0 ? 'Hui' : diaNombre}</span>
                <span class="dia-icon">${obtenerIcono(daily.weather_code[i])}</span>
                <span class="dia-temps">${Math.round(daily.temperature_2m_max[i])}° <small>${Math.round(daily.temperature_2m_min[i])}°</small></span>
            </div>`;
    }
    
    html += `</div></div>
        <div class="detalles-grid">
            <div class="detalle-card"><h3>💨 VENT</h3><div class="detalle-valor">${Math.round(current.wind_speed_10m)} <small>km/h</small></div></div>
            <div class="detalle-card"><h3>💧 HUMITAT</h3><div class="detalle-valor">${current.relative_humidity_2m}%</div></div>
            <div class="detalle-card"><h3>☔ PLUJA</h3><div class="detalle-valor">${hourly.precipitation_probability[horaActual]}%</div></div>
            <div class="detalle-card"><h3>🌅 ALBA</h3><div class="detalle-valor">${daily.sunrise[0].split("T")[1]}</div></div>
            <div class="detalle-card"><h3>🌇 OCÀS</h3><div class="detalle-valor">${daily.sunset[0].split("T")[1]}</div></div>
            <div class="detalle-card"><h3>☀️ ÍNDEX UV</h3><div class="detalle-valor">${Math.round(daily.uv_index_max[0])}</div></div>
        </div>`;

    container.innerHTML = html;
}

// 4. MODAL
function abrirDetalleDia(index) {
    const modal = document.getElementById("modal-detalle");
    const overlay = document.getElementById("modal-overlay");
    const d = datosGlobales;
    if(!d) return;
    
    const fecha = new Date(d.daily.time[index]);
    document.getElementById("modal-titulo").innerText = fecha.toLocaleDateString("ca", { weekday: 'long', day: 'numeric', month: 'short' });
    document.getElementById("modal-lluvia").innerHTML = `<span>Previsió de pluja total</span><strong>${d.daily.precipitation_sum[index]} mm</strong>`;

    let htmlTemp = "";
    let htmlPrecip = "";
    const start = index * 24;

    for (let i = 0; i < 24; i++) {
        const idx = start + i;
        const temp = Math.round(d.hourly.temperature_2m[idx]);
        const prob = d.hourly.precipitation_probability[idx];
        htmlTemp += `<div class="bar-item"><span class="bar-val">${temp}°</span><div class="bar bar-temp" style="height:${Math.max(temp * 2.5, 4)}px"></div><span class="bar-time">${i}h</span></div>`;
        htmlPrecip += `<div class="bar-item"><span class="bar-val">${prob}%</span><div class="bar bar-precip" style="height:${Math.max(prob, 4)}px"></div><span class="bar-time">${i}h</span></div>`;
    }

    document.getElementById("chart-temp").innerHTML = htmlTemp;
    document.getElementById("chart-precip").innerHTML = htmlPrecip;
    modal.classList.add("active");
    overlay.classList.add("active");
}

function cerrarModal() {
    document.getElementById("modal-detalle").classList.remove("active");
    document.getElementById("modal-overlay").classList.remove("active");
}

function obtenerIcono(code) {
    if (code <= 1) return "☀️"; if (code <= 3) return "🌤️";
    if (code <= 48) return "🌫️"; if (code <= 67) return "🌧️";
    if (code <= 82) return "🌧️"; if (code <= 99) return "🌩️";
    return "🌡️";
}

// FUNCIÓN DE AVISOS CORREGIDA
async function obtenerAvisoDesdeGeoJSON(lat, lon) {
    try {
        const res = await fetch(urlGeoJSON);
        const data = await res.json();
        for (const feature of data.features) {
            if (puntoEnPoligono(lat, lon, feature.geometry.coordinates)) {
                const props = feature.properties;
                const temp = document.createElement("div");
                temp.innerHTML = props.popup_html;
                let descDetallada = "";
                const parrafos = temp.querySelectorAll("p");
                parrafos.forEach(p => {
                    if (p.innerText.includes("Descripción:")) descDetallada = p.innerText.split("Descripción:")[1].trim();
                });
                return {
                    titulo: temp.querySelector("h3") ? temp.querySelector("h3").innerText : "Avís Actiu",
                    desc: descDetallada || (temp.querySelector("p:nth-of-type(3)") ? temp.querySelector("p:nth-of-type(3)").innerText : "Consulta els detalls."),
                    color: props.fillColor || "#f3f702"
                };
            }
        }
    } catch (e) {} return null;
}

function puntoEnPoligono(lat, lon, coords) {
    let inside = false;
    let rings = Array.isArray(coords[0][0][0]) ? coords[0][0] : (Array.isArray(coords[0][0]) ? coords[0] : coords);
    for (let i = 0, j = rings.length - 1; i < rings.length; j = i++) {
        let xi = rings[i][0], yi = rings[i][1];
        let xj = rings[j][0], yj = rings[j][1];
        let intersect = ((yi > lat) != (yj > lat)) && (lon < (xj - xi) * (lat - yi) / (yj - yi) + xi);
        if (intersect) inside = !inside;
    }
    return inside;
}

document.addEventListener("DOMContentLoaded", () => {
    initTheme();
    const guardado = localStorage.getItem("ultimPobleBuscat") || "Valencia";
    buscarTiempo(guardado, "resultado-tiempo-home");
});