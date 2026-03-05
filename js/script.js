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

// 2. BUSCAR TIEMPO
async function buscarTiempo(poble, targetId) {
    const container = document.getElementById(targetId);
    if (!container) return;
    try {
        const geo = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(poble)}&count=1&language=ca`);
        const geoData = await geo.json();
        if (!geoData.results) return;
        const m = geoData.results[0];
        
        // PETICIÓN CON MÁS DATOS: Humedad, UV, Prob. Lluvia, Viento
        const res = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${m.latitude}&longitude=${m.longitude}&current=temperature_2m,relative_humidity_2m,weather_code,apparent_temperature,wind_speed_10m&hourly=temperature_2m,weather_code,precipitation_probability&daily=weather_code,temperature_2m_max,temperature_2m_min,uv_index_max&timezone=auto`);
        const d = await res.json();
        renderizar(d, m.name, targetId);
    } catch (e) { console.error(e); }
}

function obtenerIcono(code) {
    if (code <= 1) return "☀️"; if (code <= 3) return "🌤️";
    if (code <= 48) return "🌫️"; if (code <= 82) return "🌧️";
    return "🌩️";
}

function renderizar(data, nombre, targetId) {
    const container = document.getElementById(targetId);
    const { current, daily, hourly } = data;
    const horaActual = new Date().getHours();

    let html = `
        <div style="padding: 2rem 1rem; text-align: center;">
            <h1 style="margin:0; font-weight:300; font-size:2rem;">${nombre}</h1>
            <div style="font-size:5rem; margin:10px 0;">${obtenerIcono(current.weather_code)}</div>
            <div style="font-size:4.5rem; font-weight:200;">${Math.round(current.temperature_2m)}°</div>
            <p>Máx: ${Math.round(daily.temperature_2m_max[0])}° Mín: ${Math.round(daily.temperature_2m_min[0])}°</p>
        </div>

        <div class="column">
            <h2>Pròximes 24 hores</h2>
            <div id="proximas-horas-container">`;
    
    for (let i = horaActual; i < horaActual + 24; i++) {
        html += `
            <div class="hora-item">
                <div style="font-size:0.7rem; opacity:0.7;">${i % 24}h</div>
                <div style="font-size:1.5rem; margin:5px 0;">${obtenerIcono(hourly.weather_code[i])}</div>
                <div style="font-weight:bold;">${Math.round(hourly.temperature_2m[i])}°</div>
            </div>`;
    }
    
    html += `</div></div><div class="column"><h2>Previsió 7 dies</h2>`;
    
    for (let i = 0; i < 7; i++) {
        const dia = new Date(daily.time[i]).toLocaleDateString("ca",{weekday:'long'});
        html += `
            <div class="dia-caja">
                <span style="flex:1; text-transform:capitalize;">${i===0?'Hui':dia}</span>
                <span style="flex:1; text-align:center; font-size:1.4rem;">${obtenerIcono(daily.weather_code[i])}</span>
                <span style="flex:1; text-align:right;">${Math.round(daily.temperature_2m_max[i])}° / ${Math.round(daily.temperature_2m_min[i])}°</span>
            </div>`;
    }
    html += `</div>`;

    // --- NUEVA SECCIÓN DE DETALLES (ESTILO IPHONE) ---
    html += `
        <div class="detalles-grid">
            <div class="detalle-card">
                <h3>💨 VENT</h3>
                <div class="detalle-valor">${Math.round(current.wind_speed_10m)} <small>km/h</small></div>
                <div class="detalle-sub">Velocitat actual</div>
            </div>
            <div class="detalle-card">
                <h3>💧 HUMITAT</h3>
                <div class="detalle-valor">${current.relative_humidity_2m}%</div>
                <div class="detalle-sub">Punt de rosada</div>
            </div>
            <div class="detalle-card">
                <h3>☀️ ÍNDEX UV</h3>
                <div class="detalle-valor">${Math.round(daily.uv_index_max[0])}</div>
                <div class="detalle-sub">${daily.uv_index_max[0] > 5 ? 'Elevat' : 'Baix'}</div>
            </div>
            <div class="detalle-card">
                <h3>☔ PLUJA</h3>
                <div class="detalle-valor">${hourly.precipitation_probability[horaActual]}%</div>
                <div class="detalle-sub">Probabilitat hui</div>
            </div>
        </div>
    `;

    container.innerHTML = html;
}

// INICIALIZACIÓN
document.addEventListener("DOMContentLoaded", async () => {
    initTheme();
    const input = document.getElementById("buscador-input");
    const dl = document.getElementById("municipios");
    if(input) {
        try {
            const res = await fetch("municipis.json");
            const data = await res.json();
            data.municipis.forEach(m => {
                const o = document.createElement("option"); o.value = m; dl.appendChild(o);
            });
        } catch(e){}
        input.addEventListener("change", () => {
            const p = input.value.trim();
            if(p) {
                localStorage.setItem("ultimPobleBuscat", p);
                buscarTiempo(p, "resultado-tiempo-home");
                input.blur();
            }
        });
    }
    const p = localStorage.getItem("ultimPobleBuscat");
    if(p) buscarTiempo(p, "resultado-tiempo-home");
});