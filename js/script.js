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

async function buscarTiempo(poble, targetId) {
    const container = document.getElementById(targetId);
    if (!container) return;
    try {
        const geo = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(poble)}&count=1&language=ca`);
        const geoData = await geo.json();
        if (!geoData.results) return;
        const m = geoData.results[0];
        const res = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${m.latitude}&longitude=${m.longitude}&current=temperature_2m,weather_code,apparent_temperature,wind_speed_10m&hourly=temperature_2m,weather_code&daily=weather_code,temperature_2m_max,temperature_2m_min&timezone=auto`);
        const d = await res.json();
        renderizar(d, m.name, targetId);
    } catch (e) { console.error("Error:", e); }
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

    // BLOQUE PRINCIPAL (ESTILO IPHONE)
    let html = `
        <div style="padding: 3rem 1rem; text-align: center;">
            <h1 style="margin:0; font-weight:400; font-size:2.2rem;">${nombre}</h1>
            <div style="font-size:6rem; margin: 10px 0;">${obtenerIcono(current.weather_code)}</div>
            <div style="font-size:5rem; font-weight:200; margin-left: 15px;">${Math.round(current.temperature_2m)}°</div>
            <p style="font-size:1.2rem; opacity:0.9; margin:0;">Sensació: ${Math.round(current.apparent_temperature)}°</p>
            <p style="font-weight:500;">Máx: ${Math.round(daily.temperature_2m_max[0])}°  Mín: ${Math.round(daily.temperature_2m_min[0])}°</p>
        </div>`;

    // SLIDER HORAS
    html += `
        <div class="column">
            <h2>Pròximes 24 hores</h2>
            <div id="proximas-horas-container">`;
    for (let i = horaActual; i < horaActual + 24; i++) {
        html += `
            <div class="hora-item">
                <div style="font-size:0.8rem; opacity:0.8;">${i % 24}h</div>
                <div style="font-size:1.8rem; margin:8px 0;">${obtenerIcono(hourly.weather_code[i])}</div>
                <div style="font-weight:bold;">${Math.round(hourly.temperature_2m[i])}°</div>
            </div>`;
    }
    html += `</div></div>`;

    // LISTA 7 DÍAS
    if (targetId === "resultado-tiempo") {
        html += `<div class="column"><h2>Previsió 7 dies</h2><div class="previsio-grid">`;
        for (let i = 0; i < 7; i++) {
            const dia = new Date(daily.time[i]).toLocaleDateString("ca",{weekday:'long'});
            html += `
                <div class="dia-caja">
                    <span style="flex:1; text-transform:capitalize;">${i === 0 ? 'Hui' : dia}</span>
                    <span style="flex:1; text-align:center; font-size:1.5rem;">${obtenerIcono(daily.weather_code[i])}</span>
                    <span style="flex:1; text-align:right; font-weight:500;">
                        ${Math.round(daily.temperature_2m_max[i])}° <span style="opacity:0.5; font-weight:300;">${Math.round(daily.temperature_2m_min[i])}°</span>
                    </span>
                </div>`;
        }
        html += `</div></div>`;
    }
    container.innerHTML = html;
}

document.addEventListener("DOMContentLoaded", () => {
    initTheme();
    const homeBox = document.getElementById("resultado-tiempo-home");
    if (homeBox) {
        const p = localStorage.getItem("ultimPobleBuscat");
        if (p) buscarTiempo(p, "resultado-tiempo-home");
        else homeBox.innerHTML = "<div style='padding:40px; text-align:center; opacity:0.7;'>📍 Benvingut. <br> Cerca el teu poble per començar.</div>";
    }
});