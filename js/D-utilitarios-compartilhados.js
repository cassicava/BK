/**************************************
 * 🤝 Funções Utilitárias Compartilhadas
 * (Usado pelo main thread e pelo web worker)
 **************************************/

const uid = () => Math.random().toString(36).slice(2,10) + Date.now().toString(36).slice(-4);

function parseTimeToMinutes(t) {
    if (!t || typeof t !== 'string') return 0;
    const parts = t.split(":");
    const h = parseInt(parts[0], 10) || 0;
    const m = parseInt(parts[1], 10) || 0;
    return (h * 60) + m;
}

function minutesToHHMM(min) { 
    const h = String(Math.floor(min / 60)).padStart(2, "0"); 
    const m = String(min % 60).padStart(2, "0"); 
    return `${h}:${m}`; 
}

function dateRangeInclusive(startISO, endISO) { 
    const days = []; 
    let d = new Date(startISO + 'T12:00:00');
    const end = new Date(endISO + 'T12:00:00');
    
    while(d <= end) { 
        days.push(d.toISOString().slice(0, 10)); 
        d.setDate(d.getDate() + 1); 
    } 
    return days; 
}

function addDays(dateISO, n) {
    const d = new Date(dateISO + 'T12:00:00');
    d.setDate(d.getDate() + n);
    return d.toISOString().slice(0, 10);
}

function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

function getDayOfWeekId(dateISO) {
    const d = new Date(dateISO + 'T12:00:00');
    const days = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sab'];
    return days[d.getUTCDay()];
}