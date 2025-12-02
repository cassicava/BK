let editingMateriaId = null;
let lastSavedMateriaId = null;
let switchMateriasTab = () => {};
let tempMateriaData = {
    nome: '',
    sigla: '',
    cor: '#e2e8f0',
    emoji: '📚'
};

const pageMaterias = document.getElementById("page-materias");
const filtroMateriasInput = document.getElementById("filtroMaterias");
const filtroMateriasArquivadasInput = document.getElementById("filtroMateriasArquivadas");

const CATALOGO_MATERIAS = [
    { id: 'custom', label: '✨ Outra / Personalizada', nome: '', sigla: '', cor: '#cbd5e1', emoji: '📚' },
    { id: 'port', label: '✍️ Português', nome: 'Português', sigla: 'PORT', cor: '#fca5a5', emoji: '✍️' },
    { id: 'mat', label: '📐 Matemática', nome: 'Matemática', sigla: 'MATEM', cor: '#93c5fd', emoji: '📐' },
    { id: 'hist', label: '🏺 História', nome: 'História', sigla: 'HISTO', cor: '#d4d4d8', emoji: '🏺' },
    { id: 'geo', label: '🗺️ Geografia', nome: 'Geografia', sigla: 'GEOGR', cor: '#7dd3fc', emoji: '🗺️' },
    { id: 'cien', label: '🔬 Ciências', nome: 'Ciências', sigla: 'CIENC', cor: '#86efac', emoji: '🔬' },
    { id: 'bio', label: '🐝 Biologia', nome: 'Biologia', sigla: 'BIOLO', cor: '#4ade80', emoji: '🐝' },
    { id: 'fis', label: '⚛️ Física', nome: 'Física', sigla: 'FISIC', cor: '#5eead4', emoji: '⚛️' },
    { id: 'quim', label: '🧪 Química', nome: 'Química', sigla: 'QUIMI', cor: '#14b8a6', emoji: '🧪' },
    { id: 'ing', label: '🌐 Inglês', nome: 'Inglês', sigla: 'INGLE', cor: '#a5b4fc', emoji: '🌐' },
    { id: 'esp', label: '🌐 Espanhol', nome: 'Espanhol', sigla: 'ESPAN', cor: '#fdba74', emoji: '🇪🇸' },
    { id: 'art', label: '🎨 Artes', nome: 'Artes', sigla: 'ARTES', cor: '#f0abfc', emoji: '🎨' },
    { id: 'edfis', label: '🏀 Ed. Física', nome: 'Ed. Física', sigla: 'EDFIS', cor: '#bef264', emoji: '🏀' },
    { id: 'filo', label: '🤔 Filosofia', nome: 'Filosofia', sigla: 'FILOS', cor: '#c084fc', emoji: '🤔' },
    { id: 'socio', label: '💭 Sociologia', nome: 'Sociologia', sigla: 'SOCIO', cor: '#f472b6', emoji: '💭' },
    { id: 'redac', label: '📝 Redação', nome: 'Redação', sigla: 'REDAC', cor: '#fda4af', emoji: '📝' },
    { id: 'lit', label: '📖 Literatura', nome: 'Literatura', sigla: 'LITER', cor: '#fb923c', emoji: '📖' },
    { id: 'pvid', label: '🚀 Projeto de Vida', nome: 'Proj. de Vida', sigla: 'PVIDA', cor: '#facc15', emoji: '🚀' },
    { id: 'dir', label: '⚖️ Direito', nome: 'Direito', sigla: 'DIREI', cor: '#ef4444', emoji: '⚖️' },
    { id: 'med', label: '🩺 Medicina', nome: 'Medicina', sigla: 'MEDIC', cor: '#10b981', emoji: '🩺' },
    { id: 'enf', label: '🏥 Enfermagem', nome: 'Enfermagem', sigla: 'ENFER', cor: '#14b8a6', emoji: '🏥' },
    { id: 'psi', label: '🧠 Psicologia', nome: 'Psicologia', sigla: 'PSICO', cor: '#a855f7', emoji: '🧠' },
    { id: 'eng', label: '⚙️ Engenharia', nome: 'Engenharia', sigla: 'ENGEN', cor: '#64748b', emoji: '⚙️' },
    { id: 'arq', label: '🏛️ Arquitetura', nome: 'Arquitetura', sigla: 'ARQUI', cor: '#f97316', emoji: '🏛️' },
    { id: 'adm', label: '💼 Administração', nome: 'Administração', sigla: 'ADMIN', cor: '#3b82f6', emoji: '💼' },
    { id: 'cont', label: '💹 Contabilidade', nome: 'Contabilidade', sigla: 'CONTA', cor: '#0ea5e9', emoji: '💹' },
    { id: 'econ', label: '📉 Economia', nome: 'Economia', sigla: 'ECONO', cor: '#22c55e', emoji: '📉' },
    { id: 'mkt', label: '📢 Marketing', nome: 'Marketing', sigla: 'MARKT', cor: '#ec4899', emoji: '📢' },
    { id: 'ped', label: '🧸 Pedagogia', nome: 'Pedagogia', sigla: 'PEDAG', cor: '#f43f5e', emoji: '🧸' },
    { id: 'vet', label: '🐾 Veterinária', nome: 'Veterinária', sigla: 'VETER', cor: '#84cc16', emoji: '🐾' },
    { id: 'agro', label: '🌱 Agronomia', nome: 'Agronomia', sigla: 'AGRON', cor: '#16a34a', emoji: '🌱' },
    { id: 'nut', label: '🍎 Nutrição', nome: 'Nutrição', sigla: 'NUTRI', cor: '#84cc16', emoji: '🍎' },
    { id: 'farm', label: '💊 Farmácia', nome: 'Farmácia', sigla: 'FARMA', cor: '#fbbf24', emoji: '💊' },
    { id: 'odonto', label: '🦷 Odontologia', nome: 'Odontologia', sigla: 'ODONT', cor: '#e2e8f0', emoji: '🦷' },
    { id: 'jor', label: '📰 Jornalismo', nome: 'Jornalismo', sigla: 'JORNA', cor: '#6366f1', emoji: '📰' },
    { id: 'des', label: '✒️ Design', nome: 'Design', sigla: 'DESIG', cor: '#f472b6', emoji: '✒️' },
    { id: 'ti', label: '💾 T.I. / Computação', nome: 'Computação', sigla: 'COMPU', cor: '#0f172a', emoji: '💾' },
    { id: 'gast', label: '🍳 Gastronomia', nome: 'Gastronomia', sigla: 'GASTR', cor: '#f59e0b', emoji: '🍳' }
];

const PALETA_CORES = [
    '#fecaca', '#fca5a5', '#f87171', '#fbbf24', '#facc15', '#fde047', 
    '#bef264', '#a3e635', '#86efac', '#4ade80', '#14b8a6', '#22d3ee',
    '#7dd3fc', '#93c5fd', '#60a5fa', '#a5b4fc', '#818cf8', '#c084fc',
    '#e879f9', '#f0abfc', '#f472b6', '#fb7185', '#e2e8f0', '#94a3b8',
    '#64748b', '#0f172a', '#b91c1c', '#15803d', '#b45309', '#4338ca'
];

const EMOJI_LIST = [
    '📚', '✍️', '📐', '🔬', '🏺', '🗺️', '🌐', '🎨', '🏀', '💻', 
    '⚛️', '🧪', '🐝', '🤔', '💭', '🎵', '🎭', '✝️', '💰', '🤖', 
    '📝', '📖', '🚀', '⚖️', '🩺', '🏥', '🧠', '⚙️', '🏛️', '💼', 
    '💹', '📉', '📢', '🧸', '🐾', '🌱', '🍎', '💊', '🦷', '📰', 
    '✒️', '💾', '🍳', '🧬', '🔭', '📡', '🔌', '🧱', '🎬', '📸', 
    '🎤', '🎹', '🎻', '⚽', '🏐', '🏊', '🥋', '🧘', '🗣️', '🔢', 
    '🦠', '⚒️', '✈️'
];

function setMateriaFormDirty(isDirty) {
    dirtyForms.materias = isDirty;
}

function renderFormularioMateria() {
    const container = document.getElementById("form-materia-container");
    if (!container || container.innerHTML.trim() !== "") return;

    const optionsHTML = CATALOGO_MATERIAS.map(m => `<option value="${m.id}">${m.label}</option>`).join('');

    container.innerHTML = `
        <div class="grid-3-col" style="align-items: end; margin-bottom: 24px;">
            <div class="form-group">
                <label class="form-label">Catálogo Rápido</label>
                <select id="materiaCatalogoSelect" class="input-lg">
                    ${optionsHTML}
                </select>
            </div>
            <div class="animated-field">
                <input id="materiaNome" type="text" placeholder=" " autocomplete="off" />
                <label for="materiaNome">Nome da Matéria</label>
            </div>
            <div class="animated-field">
                <input id="materiaSigla" type="text" placeholder=" " maxlength="5" autocomplete="off" />
                <label for="materiaSigla">Sigla (máx 5)</label>
            </div>
        </div>

        <fieldset class="fieldset-wrapper">
            <legend>🎨 Cor da Matéria</legend>
            <div id="materiaCorContainer" style="display: flex; align-items: center; gap: 12px; flex-wrap: wrap;">
                <div id="materiaCorPalette" class="color-palette"></div>
                <input type="hidden" id="materiaCorHidden" value="#e2e8f0">
            </div>
        </fieldset>

        <fieldset class="fieldset-wrapper">
            <legend>🤩 Ícone (Emoji)</legend>
            <div id="materiaEmojiContainer" class="emoji-palette"></div>
        </fieldset>

        <div class="materia-preview-section">
            <h4 style="margin: 0 0 12px 0; color: var(--muted); font-size: 0.9rem; text-align: center;">Visualização na Grade</h4>
            <div id="materiaPreviewCard" class="materia-preview-card">
                <span class="preview-emoji">📚</span>
                <span class="preview-sigla">SIGLA</span>
            </div>
        </div>

        <div class="form-row form-row-center" style="margin-top: 32px;">
            <button id="btnSalvarMateria" class="success">💾 Salvar Matéria</button>
            <button id="btnCancelarMateria" class="purple">🗑️ Cancelar</button>
        </div>
    `;

    renderCorPalette();
    renderEmojiPalette();
    
    document.getElementById("materiaCatalogoSelect").addEventListener("change", handleCatalogoChange);

    document.getElementById("materiaNome").addEventListener("input", (e) => {
        tempMateriaData.nome = e.target.value;
        validateInput(e.target);
        updatePreview();
        setMateriaFormDirty(true);
    });

    document.getElementById("materiaSigla").addEventListener("input", (e) => {
        e.target.value = e.target.value.toUpperCase();
        tempMateriaData.sigla = e.target.value;
        validateInput(e.target);
        updatePreview();
        setMateriaFormDirty(true);
    });

    document.getElementById("btnSalvarMateria").addEventListener("click", saveMateriaFromForm);
    
    document.getElementById("btnCancelarMateria").addEventListener("click", () => {
        cancelEditMateria();
        switchMateriasTab('gerenciar');
    });

    updatePreview();
}

function handleCatalogoChange(e) {
    const selectedId = e.target.value;
    const item = CATALOGO_MATERIAS.find(m => m.id === selectedId);
    
    if (item) {
        if (selectedId !== 'custom') {
            document.getElementById("materiaNome").value = item.nome;
            document.getElementById("materiaSigla").value = item.sigla;
            selectCor(item.cor);
            selectEmoji(item.emoji);
            
            tempMateriaData.nome = item.nome;
            tempMateriaData.sigla = item.sigla;
            tempMateriaData.cor = item.cor;
            tempMateriaData.emoji = item.emoji;
        } else {
            document.getElementById("materiaNome").value = "";
            document.getElementById("materiaSigla").value = "";
            selectCor('#e2e8f0');
            selectEmoji('📚');
            tempMateriaData = { nome: '', sigla: '', cor: '#e2e8f0', emoji: '📚' };
        }
        
        validateInput(document.getElementById("materiaNome"));
        validateInput(document.getElementById("materiaSigla"));
        updatePreview();
        setMateriaFormDirty(true);
    }
}

function renderCorPalette() {
    const container = document.getElementById("materiaCorPalette");
    if (!container) return;
    
    container.innerHTML = '';
    PALETA_CORES.forEach(cor => {
        const swatch = document.createElement('div');
        swatch.className = 'color-swatch';
        swatch.style.backgroundColor = cor;
        swatch.dataset.cor = cor;
        swatch.onclick = () => { selectCor(cor); setMateriaFormDirty(true); };
        container.appendChild(swatch);
    });

    const pickerTrigger = document.createElement('div');
    pickerTrigger.className = 'color-swatch color-picker-trigger';
    pickerTrigger.title = 'Cor Personalizada';
    pickerTrigger.innerHTML = `<span>🎨</span><input type="color" id="materiaCorPicker" value="#ffffff">`;
    container.appendChild(pickerTrigger);

    document.getElementById("materiaCorPicker").addEventListener('input', (e) => {
        selectCor(e.target.value);
        setMateriaFormDirty(true);
    });
}

function renderEmojiPalette() {
    const container = document.getElementById("materiaEmojiContainer");
    if (!container) return;

    container.innerHTML = '';
    EMOJI_LIST.forEach(emoji => {
        const btn = document.createElement('button');
        btn.className = 'emoji-btn';
        btn.textContent = emoji;
        btn.onclick = () => { selectEmoji(emoji); setMateriaFormDirty(true); };
        container.appendChild(btn);
    });
    
    parseEmojisInElement(container);
}

function selectCor(cor) {
    tempMateriaData.cor = cor;
    const input = document.getElementById("materiaCorHidden");
    if (input) input.value = cor;

    const swatches = document.querySelectorAll('#materiaCorPalette .color-swatch');
    swatches.forEach(sw => sw.classList.remove('selected'));

    const isCustomColor = !PALETA_CORES.includes(cor);
    const pickerTrigger = document.querySelector('.color-picker-trigger');

    if (isCustomColor && pickerTrigger) {
        pickerTrigger.classList.add('selected');
        pickerTrigger.style.backgroundColor = cor;
    } else {
        const swatch = document.querySelector(`#materiaCorPalette .color-swatch[data-cor="${cor}"]`);
        if (swatch) swatch.classList.add('selected');
        if (pickerTrigger) pickerTrigger.style.backgroundColor = '';
    }
    updatePreview();
}

function selectEmoji(emoji) {
    tempMateriaData.emoji = emoji;
    const btns = document.querySelectorAll('.emoji-btn');
    btns.forEach(b => {
        b.classList.toggle('selected', b.textContent === emoji || (b.querySelector('img') && b.querySelector('img').alt === emoji));
    });
    updatePreview();
}

function updatePreview() {
    const card = document.getElementById("materiaPreviewCard");
    if (!card) return;

    const { cor, sigla, emoji } = tempMateriaData;
    const textColor = getContrastingTextColor(cor);

    card.style.backgroundColor = cor;
    card.style.color = textColor;
    
    const emojiSpan = card.querySelector('.preview-emoji');
    const siglaSpan = card.querySelector('.preview-sigla');
    
    if(emojiSpan) {
        emojiSpan.textContent = emoji;
        parseEmojisInElement(emojiSpan);
    }
    if(siglaSpan) siglaSpan.textContent = sigla || 'SIGLA';
}

function getLeastUsedColor() {
    const { materias } = store.getState();
    const colorCounts = PALETA_CORES.reduce((acc, color) => ({ ...acc, [color]: 0 }), {});

    materias.filter(m => m.status === 'ativo').forEach(m => {
        if (colorCounts.hasOwnProperty(m.cor)) {
            colorCounts[m.cor]++;
        }
    });

    if (PALETA_CORES.length === 0) return '#e2e8f0';
    return Object.entries(colorCounts).sort((a, b) => a[1] - b[1])[0][0];
}

function renderMaterias() {
    const tbody = document.querySelector("#tblMaterias tbody");
    if (!tbody) return;

    const inputFiltro = document.getElementById("filtroMaterias");
    const filtro = inputFiltro ? inputFiltro.value.toLowerCase() : "";

    const { materias } = store.getState();
    const materiasAtivas = materias.filter(m => m.status === 'ativo');
    const materiasFiltradas = materiasAtivas.filter(m => m.nome.toLowerCase().includes(filtro));

    tbody.innerHTML = "";

    if (materiasFiltradas.length === 0) {
        const html = materiasAtivas.length === 0 
            ? `<div class="empty-state"><div class="empty-state-icon">📚</div><h3>Nenhuma Matéria</h3><p>Cadastre as disciplinas escolares.</p></div>`
            : `<p class="muted center">Nenhuma matéria encontrada.</p>`;
        tbody.innerHTML = `<tr><td colspan="4">${html}</td></tr>`;
        return;
    }

    materiasFiltradas.sort((a, b) => a.nome.localeCompare(b.nome)).forEach(m => {
        const tr = document.createElement("tr");
        tr.dataset.id = m.id;
        if (lastSavedMateriaId === m.id) tr.classList.add('flash-update');
        
        tr.innerHTML = `
            <td><div style="display: flex; gap: 8px; justify-content: center;"><span class="color-dot" style="background-color: ${m.cor || '#e2e8f0'}"></span> <span style="font-size: 1.2rem; line-height: 1;">${m.emoji || '📚'}</span></div></td>
            <td>${m.nome}</td>
            <td><strong>${m.sigla || '---'}</strong></td>
            <td>
                <button class="secondary" data-action="edit" data-id="${m.id}">✏️ Editar</button>
                <button class="danger" data-action="archive" data-id="${m.id}">🗃️ Arquivar</button>
            </td>
        `;
        tbody.appendChild(tr);
        parseEmojisInElement(tr);
    });

    if (lastSavedMateriaId) {
        setTimeout(() => {
            const row = tbody.querySelector(`tr[data-id="${lastSavedMateriaId}"]`);
            if (row) row.classList.remove('flash-update');
            lastSavedMateriaId = null;
        }, 1500);
    }
}

function renderMateriasArquivadas() {
    const tbody = document.querySelector("#tblMateriasArquivadas tbody");
    if (!tbody) return;

    const inputFiltro = document.getElementById("filtroMateriasArquivadas");
    const filtro = inputFiltro ? inputFiltro.value.toLowerCase() : "";

    const { materias } = store.getState();
    const materiasArquivadas = materias.filter(m => m.status === 'arquivado');
    const materiasFiltradas = materiasArquivadas.filter(m => m.nome.toLowerCase().includes(filtro));

    tbody.innerHTML = "";

    if (materiasFiltradas.length === 0) {
        const html = materiasArquivadas.length === 0 
            ? `<div class="empty-state" style="padding: 24px;"><div class="empty-state-icon">🗃️</div><h3>Vazio</h3></div>`
            : `<p class="muted center">Nenhuma encontrada.</p>`;
        tbody.innerHTML = `<tr><td colspan="3">${html}</td></tr>`;
        return;
    }

    materiasFiltradas.sort((a, b) => a.nome.localeCompare(b.nome)).forEach(m => {
        const tr = document.createElement("tr");
        tr.style.opacity = '0.7';
        tr.innerHTML = `
            <td>${m.nome}</td>
            <td>${m.sigla}</td>
            <td>
                <button class="secondary" data-action="unarchive" data-id="${m.id}">🔄 Reativar</button>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

function validateMateriaForm() {
    const nomeInput = document.getElementById("materiaNome");
    const siglaInput = document.getElementById("materiaSigla");
    let isValid = true;

    if (!validateInput(nomeInput)) isValid = false;
    if (!validateInput(siglaInput)) isValid = false;

    return isValid;
}

function saveMateriaFromForm() {
    if (!validateMateriaForm()) {
        showToast("Preencha os campos obrigatórios.", "error");
        return;
    }

    const nome = tempMateriaData.nome.trim();
    const sigla = tempMateriaData.sigla.trim();
    const cor = tempMateriaData.cor;
    const emoji = tempMateriaData.emoji;

    const { materias } = store.getState();
    if (materias.some(m => m.nome.toLowerCase() === nome.toLowerCase() && m.id !== editingMateriaId)) {
        return showToast("Já existe uma matéria com este nome.", "error");
    }

    const data = {
        id: editingMateriaId || uid(),
        nome,
        sigla,
        cor,
        emoji,
        status: 'ativo'
    };

    lastSavedMateriaId = data.id;
    store.dispatch('SAVE_MATERIA', data);
    
    setMateriaFormDirty(false); // Limpa flag
    
    showToast("Matéria salva com sucesso!", "success");
    cancelEditMateria();
    switchMateriasTab('gerenciar');
    renderMaterias(); // Força update
}

function editMateriaInForm(id) {
    const { materias } = store.getState();
    const materia = materias.find(m => m.id === id);
    if (!materia) return;

    editingMateriaId = id;
    tempMateriaData = { ...materia };
    
    document.getElementById("materiaCatalogoSelect").value = 'custom';
    document.getElementById("materiaNome").value = materia.nome;
    document.getElementById("materiaSigla").value = materia.sigla;
    selectCor(materia.cor || PALETA_CORES[0]);
    selectEmoji(materia.emoji || '📚');

    const btnSalvar = document.getElementById("btnSalvarMateria");
    btnSalvar.textContent = "💾 Salvar Alterações";
    
    const formTab = pageMaterias.querySelector('.painel-tab-btn[data-tab="formulario"]');
    if(formTab) formTab.innerHTML = `📝 Editando: ${materia.nome}`;

    switchMateriasTab('formulario');
}

function cancelEditMateria() {
    editingMateriaId = null;
    tempMateriaData = { nome: '', sigla: '', cor: '#e2e8f0', emoji: '📚' };
    
    document.getElementById("materiaCatalogoSelect").value = 'custom';
    document.getElementById("materiaNome").value = "";
    document.getElementById("materiaSigla").value = "";
    selectCor(getLeastUsedColor());
    selectEmoji('📚');

    const btnSalvar = document.getElementById("btnSalvarMateria");
    btnSalvar.textContent = "💾 Salvar Matéria";

    const formTab = pageMaterias.querySelector('.painel-tab-btn[data-tab="formulario"]');
    if(formTab) formTab.innerHTML = `📝 Nova Matéria`;

    setMateriaFormDirty(false);
}

async function archiveMateria(id) {
    const { professores } = store.getState();
    const emUso = professores.some(p => p.status === 'ativo' && (p.materiasIds || []).includes(id));

    if (emUso) {
        showInfoModal({
            title: "Ação Bloqueada",
            contentHTML: "<p>Esta matéria não pode ser arquivada pois está vinculada a um ou mais professores ativos.</p>"
        });
        return;
    }

    const { confirmed } = await showConfirm({
        title: "Arquivar Matéria?",
        message: "A matéria não aparecerá nas novas grades, mas o histórico será mantido.",
        confirmText: "Sim, Arquivar"
    });

    if (confirmed) {
        store.dispatch('ARCHIVE_MATERIA', id);
        renderMaterias();
        renderMateriasArquivadas();
    }
}

function initMateriasPage() {
    renderFormularioMateria();

    switchMateriasTab = setupTabbedPanel('#page-materias .painel-gerenciamento', 'materias', (tabId) => {
        if (tabId === 'gerenciar') {
            cancelEditMateria();
            renderMaterias();
        }
        if (tabId === 'arquivados') renderMateriasArquivadas();
    });

    const btnAdd = pageMaterias.querySelector('.btn-add-new');
    if (btnAdd) {
        btnAdd.addEventListener('click', () => {
            cancelEditMateria();
            switchMateriasTab('formulario');
        });
    }

    document.querySelector("#tblMaterias").addEventListener('click', (e) => {
        const btn = e.target.closest('button');
        if (!btn) return;
        const { action, id } = btn.dataset;
        if (action === 'edit') editMateriaInForm(id);
        if (action === 'archive') archiveMateria(id);
    });

    document.querySelector("#tblMateriasArquivadas").addEventListener('click', (e) => {
        const btn = e.target.closest('button');
        if (!btn) return;
        const { action, id } = btn.dataset;
        if (action === 'unarchive') {
            store.dispatch('UNARCHIVE_MATERIA', id);
            renderMaterias();
            renderMateriasArquivadas();
        }
    });

    const inputFiltro = document.getElementById("filtroMaterias");
    if(inputFiltro) inputFiltro.addEventListener("input", renderMaterias);
    
    const inputFiltroArq = document.getElementById("filtroMateriasArquivadas");
    if(inputFiltroArq) inputFiltroArq.addEventListener("input", renderMateriasArquivadas);

    renderMaterias();
}

document.addEventListener('DOMContentLoaded', initMateriasPage);