let editingProfessorId = null;
let lastSavedProfessorId = null;
let switchProfessoresTab = () => {};

let profDisponibilidadeMatriz = {}; 
let selectedMateriasIds = new Set();

const pageProfessores = document.getElementById("page-professores");

function setProfessorFormDirty(isDirty) {
    dirtyForms.professores = isDirty;
}

function renderFormularioProfessor() {
    const container = document.getElementById("form-professor-container");
    if (container && container.innerHTML.trim() !== "") {
        updateProfessorFormOptions();
        return;
    }

    if (!container) return;

    container.innerHTML = `
        <div class="animated-field" style="margin-bottom: 24px;">
            <input id="profNome" type="text" placeholder=" " autocomplete="off" />
            <label for="profNome">Nome Completo</label>
        </div>

        <fieldset class="fieldset-wrapper">
            <legend>📚 O que ele leciona?</legend>
            <div id="profMateriasGrid" class="subjects-grid" style="padding: 16px;">
                <p class="muted">Carregando matérias...</p>
            </div>
        </fieldset>

        <fieldset class="fieldset-wrapper">
            <legend>🗓️ Quando ele pode dar aula?</legend>
            
            <div class="form-group" style="margin-bottom: 16px;">
                <label class="form-label">Baseado na Estrutura:</label>
                <select id="profEstruturaSelect" class="input-lg"></select>
            </div>

            <div id="profDisponibilidadeWrapper" style="display: none;">
                
                <div class="matrix-toolbar">
                    <div class="matrix-actions-group">
                        <button type="button" class="secondary-sm" id="btn-liberar-tudo">✅ Liberar Tudo</button>
                        <button type="button" class="secondary-sm" id="btn-bloquear-tudo">🚫 Bloquear Tudo</button>
                    </div>
                    
                    <span class="matrix-toolbar-separator">|</span>

                    <div class="matrix-legend-group">
                        <span class="legend-item"><span class="legend-dot dot-available"></span> Disponível</span>
                        <span class="legend-item"><span class="legend-dot dot-maybe"></span> Talvez</span>
                        <span class="legend-item"><span class="legend-dot dot-unavailable"></span> Indisponível</span>
                    </div>
                </div>

                <div class="matrix-instruction">
                    <span class="hand-icon">👆</span>
                    <span><strong>Dica:</strong> Clique nos horários repetidamente para alternar a disponibilidade.</span>
                </div>
                
                <div class="availability-container">
                    <table class="availability-matrix" id="profDisponibilidadeTable">
                        </table>
                </div>
            </div>
            
            <div id="profDisponibilidadePlaceholder" class="empty-state" style="padding: 20px; margin-top: 0;">
                <p class="muted">Selecione uma estrutura acima para configurar os horários.</p>
            </div>
        </fieldset>

        <div class="form-row form-row-center" style="margin-top: 32px;">
            <button id="btnSalvarProfessor" class="success">💾 Salvar Professor</button>
            <button id="btnCancelarProfessor" class="purple">🗑️ Cancelar</button>
        </div>
    `;

    document.getElementById("profNome").addEventListener("input", (e) => {
        if (e.target.value.length > 0) {
            e.target.value = e.target.value.charAt(0).toUpperCase() + e.target.value.slice(1);
        }
        validateInput(e.target);
        setProfessorFormDirty(true);
    });

    document.getElementById("profEstruturaSelect").addEventListener("change", handleEstruturaChange);
    
    document.getElementById("btn-liberar-tudo").addEventListener("click", () => setAllAvailability('available'));
    document.getElementById("btn-bloquear-tudo").addEventListener("click", () => setAllAvailability('unavailable'));

    document.getElementById("btnSalvarProfessor").addEventListener("click", saveProfessorFromForm);
    
    document.getElementById("btnCancelarProfessor").addEventListener("click", () => {
        cancelEditProfessor();
        switchProfessoresTab('gerenciar');
    });

    updateProfessorFormOptions();
}

function updateProfessorFormOptions() {
    renderProfessorMateriasGrid();
    renderEstruturaSelectOptions();
}

function renderProfessorMateriasGrid() {
    const container = document.getElementById("profMateriasGrid");
    if (!container) return;

    const { materias } = store.getState();
    container.innerHTML = '';

    const materiasAtivas = materias.filter(m => m.status === 'ativo').sort((a, b) => a.nome.localeCompare(b.nome));

    if (materiasAtivas.length === 0) {
        container.innerHTML = `<p class="muted">Nenhuma matéria cadastrada. <a href="#" onclick="go('materias')">Cadastre matérias primeiro</a>.</p>`;
        return;
    }

    materiasAtivas.forEach(m => {
        const isSelected = selectedMateriasIds.has(m.id);
        
        const card = document.createElement("div");
        card.className = "subject-card";
        card.dataset.id = m.id;
        
        card.style.position = "relative";
        card.style.borderLeft = `4px solid ${m.cor}`;
        card.style.transition = "all 0.2s ease";
        
        if (isSelected) {
            card.classList.add('selected');
            card.style.border = `2px solid var(--brand)`; 
            card.style.backgroundColor = `${m.cor}33`; 
            card.style.transform = "translateY(-2px)";
            card.style.boxShadow = "0 4px 12px rgba(37, 99, 235, 0.2)";
        } else {
            card.style.border = "1px solid var(--border)";
            card.style.borderLeft = `4px solid ${m.cor}`;
            card.style.backgroundColor = "var(--bg)";
        }

        const checkDisplay = isSelected ? 'flex' : 'none';

        // CORREÇÃO: Z-index aumentado para 10 para garantir visibilidade
        card.innerHTML = `
            <div class="check-badge" style="display: ${checkDisplay}; position: absolute; top: -8px; right: -8px; background: var(--brand); color: white; border-radius: 50%; width: 22px; height: 22px; align-items: center; justify-content: center; font-size: 12px; font-weight: bold; box-shadow: 0 2px 4px rgba(0,0,0,0.2); z-index: 10;">✓</div>
            <span class="sub-emoji">${m.emoji || '📚'}</span>
            <span class="sub-name">${m.nome}</span>
        `;
        
        card.onclick = () => toggleMateria(m.id, m.cor, card);
        container.appendChild(card);
    });
    parseEmojisInElement(container);
}

function toggleMateria(id, color, cardElement) {
    const badge = cardElement.querySelector('.check-badge');
    
    if (selectedMateriasIds.has(id)) {
        selectedMateriasIds.delete(id);
        cardElement.classList.remove('selected');
        
        cardElement.style.border = '1px solid var(--border)';
        cardElement.style.borderLeft = `4px solid ${color}`;
        cardElement.style.backgroundColor = 'var(--bg)';
        cardElement.style.transform = "none";
        cardElement.style.boxShadow = "none";
        
        if (badge) badge.style.display = 'none';

    } else {
        selectedMateriasIds.add(id);
        cardElement.classList.add('selected');
        
        cardElement.style.border = '2px solid var(--brand)';
        cardElement.style.backgroundColor = `${color}33`; 
        cardElement.style.transform = "translateY(-2px)";
        cardElement.style.boxShadow = "0 4px 12px rgba(37, 99, 235, 0.2)";
        
        if (badge) {
            badge.style.display = 'flex';
            badge.style.animation = 'pop-in 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275)';
        }
    }
    setProfessorFormDirty(true);
}

function renderEstruturaSelectOptions() {
    const select = document.getElementById("profEstruturaSelect");
    if (!select) return;
    
    const currentValue = select.value;
    const { estruturas } = store.getState();
    const estruturasAtivas = estruturas.filter(e => e.status === 'ativo');
    
    select.innerHTML = '<option value="">Selecione...</option>';
    estruturasAtivas.forEach(e => {
        const opt = document.createElement('option');
        opt.value = e.id;
        
        const hasData = profDisponibilidadeMatriz[e.id] && Object.keys(profDisponibilidadeMatriz[e.id]).length > 0;
        const mark = hasData ? '✅ ' : '';
        
        opt.textContent = `${mark}${e.nome}`;
        select.appendChild(opt);
    });

    if (currentValue) select.value = currentValue;
}

function handleEstruturaChange(e) {
    const estruturaId = e.target.value;
    const wrapper = document.getElementById("profDisponibilidadeWrapper");
    const placeholder = document.getElementById("profDisponibilidadePlaceholder");
    
    if (!estruturaId) {
        wrapper.style.display = 'none';
        placeholder.style.display = 'block';
        return;
    }
    
    wrapper.style.display = 'block';
    placeholder.style.display = 'none';
    
    renderAvailabilityTable(estruturaId);
}

function renderAvailabilityTable(estruturaId) {
    const table = document.getElementById("profDisponibilidadeTable");
    const { estruturas } = store.getState();
    const estrutura = estruturas.find(e => e.id === estruturaId);
    
    if (!estrutura || !table) return;

    if (!profDisponibilidadeMatriz[estruturaId]) {
        profDisponibilidadeMatriz[estruturaId] = {};
    }

    const dias = ['seg', 'ter', 'qua', 'qui', 'sex'];
    if (estrutura.dias.sab && estrutura.dias.sab.blocos.length > 0) dias.push('sab');
    if (estrutura.dias.dom && estrutura.dias.dom.blocos.length > 0) dias.push('dom');

    let maxBlocos = 0;
    dias.forEach(d => {
        if (estrutura.dias[d] && estrutura.dias[d].blocos) {
            maxBlocos = Math.max(maxBlocos, estrutura.dias[d].blocos.length);
        }
    });

    if (maxBlocos === 0) {
        table.innerHTML = '<tr><td colspan="8" class="muted">Estrutura sem blocos definidos.</td></tr>';
        return;
    }

    let theadHTML = `<thead><tr><th style="width: 70px;">Horário</th>`;
    dias.forEach(dId => {
        const diaNome = DIAS_SEMANA.find(ds => ds.id === dId).abrev;
        theadHTML += `<th onclick="toggleDayColumn('${estruturaId}', '${dId}')" title="Clique para alternar o dia todo">${diaNome}</th>`;
    });
    theadHTML += `</tr></thead>`;

    let tbodyHTML = `<tbody>`;
    
    for (let index = 0; index < maxBlocos; index++) {
        tbodyHTML += `<tr>`;
        
        let refBlock = null;
        for (const d of dias) {
            if (estrutura.dias[d].blocos[index]) {
                refBlock = estrutura.dias[d].blocos[index];
                break;
            }
        }

        if (refBlock) {
            tbodyHTML += `<td class="matrix-time">
                <span class="time-start">${refBlock.start}</span>
                <span class="time-end">${refBlock.end}</span>
            </td>`;
        } else {
            tbodyHTML += `<td class="matrix-time">-</td>`;
        }
        
        dias.forEach(dId => {
            const block = estrutura.dias[dId].blocos[index];

            if (!block) {
                tbodyHTML += `<td class="matrix-cell-void"></td>`;
            } else if (block.type === 'aula') {
                const state = profDisponibilidadeMatriz[estruturaId][dId]?.[index] || 'available'; 
                let icon = '✔️';
                let className = 'disp-available';
                
                if (state === 'maybe') { icon = '⚠️'; className = 'disp-maybe'; }
                if (state === 'unavailable') { icon = '🚫'; className = 'disp-unavailable'; }

                tbodyHTML += `
                    <td class="matrix-cell ${className}" 
                        onclick="cycleCellState('${estruturaId}', '${dId}', ${index}, this)">
                        ${icon}
                    </td>
                `;
            } else {
                let lockedClass = 'locked-generic';
                let label = block.label;
                
                if (block.type === 'intervalo') lockedClass = 'locked-interval';
                if (block.type === 'espaco') lockedClass = 'locked-space';
                if (block.type === 'almoco') lockedClass = 'locked-lunch';

                tbodyHTML += `
                    <td class="matrix-cell-locked ${lockedClass}">
                        <span class="locked-content">${label}</span>
                    </td>
                `;
            }
        });

        tbodyHTML += `</tr>`;
    }
    
    tbodyHTML += `</tbody>`;
    table.innerHTML = theadHTML + tbodyHTML;
}

window.cycleCellState = function(estId, dayId, blockIndex, cell) {
    if (!profDisponibilidadeMatriz[estId][dayId]) profDisponibilidadeMatriz[estId][dayId] = {};
    
    const currentState = profDisponibilidadeMatriz[estId][dayId][blockIndex] || 'available';
    let newState = 'available';
    
    if (currentState === 'available') newState = 'maybe';
    else if (currentState === 'maybe') newState = 'unavailable';
    else newState = 'available';
    
    profDisponibilidadeMatriz[estId][dayId][blockIndex] = newState;
    
    cell.className = `matrix-cell disp-${newState}`;
    cell.innerHTML = newState === 'available' ? '✔️' : (newState === 'maybe' ? '⚠️' : '🚫');
    
    setProfessorFormDirty(true);
    renderEstruturaSelectOptions();
};

window.toggleDayColumn = function(estId, dayId) {
    if (!profDisponibilidadeMatriz[estId][dayId]) profDisponibilidadeMatriz[estId][dayId] = {};
    
    const { estruturas } = store.getState();
    const est = estruturas.find(e => e.id === estId);
    
    const blocosAulaIndices = [];
    if (est.dias[dayId]) {
        est.dias[dayId].blocos.forEach((b, i) => { 
            if(b.type === 'aula') blocosAulaIndices.push(i); 
        });
    }
    
    if (blocosAulaIndices.length === 0) return;

    const firstState = profDisponibilidadeMatriz[estId][dayId][blocosAulaIndices[0]] || 'available';
    const targetState = firstState === 'unavailable' ? 'available' : 'unavailable';

    blocosAulaIndices.forEach(idx => {
        profDisponibilidadeMatriz[estId][dayId][idx] = targetState;
    });

    renderAvailabilityTable(estId);
    setProfessorFormDirty(true);
    renderEstruturaSelectOptions();
};

function setAllAvailability(state) {
    const estId = document.getElementById("profEstruturaSelect").value;
    if (!estId) return;

    const { estruturas } = store.getState();
    const est = estruturas.find(e => e.id === estId);
    if (!est) return;

    const dias = ['seg', 'ter', 'qua', 'qui', 'sex', 'sab', 'dom'];
    
    dias.forEach(dayId => {
        if (!profDisponibilidadeMatriz[estId][dayId]) profDisponibilidadeMatriz[estId][dayId] = {};
        if (est.dias[dayId]) {
            est.dias[dayId].blocos.forEach((b, idx) => {
                if (b.type === 'aula') {
                    profDisponibilidadeMatriz[estId][dayId][idx] = state;
                }
            });
        }
    });
    
    renderAvailabilityTable(estId);
    setProfessorFormDirty(true);
    renderEstruturaSelectOptions();
}

function renderProfessores() {
    const tbody = document.querySelector("#tblProfessores tbody");
    if (!tbody) return;

    const inputFiltro = document.getElementById("filtroProfessores");
    const filtro = inputFiltro ? inputFiltro.value.toLowerCase() : "";

    const { professores, materias } = store.getState();
    const profsAtivos = professores.filter(p => p.status === 'ativo');
    const profsFiltrados = profsAtivos.filter(p => p.nome.toLowerCase().includes(filtro));

    const materiasMap = new Map(materias.map(m => [m.id, m]));

    tbody.innerHTML = "";

    if (profsFiltrados.length === 0) {
        const html = profsAtivos.length === 0 
            ? `<div class="empty-state"><div class="empty-state-icon">👨‍🏫</div><h3>Nenhum Professor</h3><p>Cadastre os docentes da escola.</p></div>`
            : `<p class="muted center">Nenhum professor encontrado.</p>`;
        tbody.innerHTML = `<tr><td colspan="4">${html}</td></tr>`;
        return;
    }

    profsFiltrados.sort((a, b) => a.nome.localeCompare(b.nome)).forEach(p => {
        const tr = document.createElement("tr");
        tr.dataset.id = p.id;
        if (lastSavedProfessorId === p.id) tr.classList.add('flash-update');

        const materiasBadges = (p.materiasIds || []).map(id => {
            const m = materiasMap.get(id);
            if (!m) return '';
            const textColor = getContrastingTextColor(m.cor);
            return `<span class="badge" style="background-color:${m.cor}; color:${textColor}; font-size:0.8rem; border:1px solid rgba(0,0,0,0.1); display:inline-flex; align-items:center; gap:4px;">${m.emoji || ''} ${m.sigla}</span>`;
        }).join(' ');

        const estruturasCount = p.disponibilidade ? Object.keys(p.disponibilidade).length : 0;
        const dispText = estruturasCount > 0 ? '✅ Configurada' : '<span class="muted">Pendente</span>';

        tr.innerHTML = `
            <td style="text-align: left; padding-left: 16px;"><strong>${p.nome}</strong></td>
            <td>${materiasBadges || '<span class="muted">Nenhuma</span>'}</td>
            <td>${dispText}</td>
            <td>
                <button class="secondary" data-action="edit" data-id="${p.id}">✏️ Editar</button>
                <button class="danger" data-action="archive" data-id="${p.id}">🗃️ Arquivar</button>
            </td>
        `;
        tbody.appendChild(tr);
        parseEmojisInElement(tr);
    });

    if (lastSavedProfessorId) {
        setTimeout(() => {
            const row = tbody.querySelector(`tr[data-id="${lastSavedProfessorId}"]`);
            if (row) row.classList.remove('flash-update');
            lastSavedProfessorId = null;
        }, 1500);
    }
}

function renderArchivedProfessores() {
    const container = document.querySelector("#tblProfessoresArquivados tbody");
    if (!container) return;

    const inputFiltro = document.getElementById("filtroProfessoresArquivadas");
    const filtro = inputFiltro ? inputFiltro.value.toLowerCase() : "";

    const { professores } = store.getState();
    const profsArquivados = professores.filter(p => p.status === 'arquivado');
    const profsFiltrados = profsArquivados.filter(p => p.nome.toLowerCase().includes(filtro));

    container.innerHTML = "";

    if (profsFiltrados.length === 0) {
        container.innerHTML = `<tr><td colspan="2"><p class="muted center">Nenhum encontrado.</p></td></tr>`;
        return;
    }

    profsFiltrados.forEach(p => {
        const tr = document.createElement("tr");
        tr.style.opacity = '0.7';
        tr.innerHTML = `
            <td>${p.nome}</td>
            <td>
                <button class="secondary" data-action="unarchive" data-id="${p.id}">🔄 Reativar</button>
            </td>
        `;
        container.appendChild(tr);
    });
}

function validateProfessorForm() {
    const nomeInput = document.getElementById("profNome");
    let isValid = true;

    if (!validateInput(nomeInput)) isValid = false;

    if (selectedMateriasIds.size === 0) {
        document.getElementById("profMateriasGrid").closest('fieldset').classList.add('invalid-fieldset');
        isValid = false;
    } else {
        document.getElementById("profMateriasGrid").closest('fieldset').classList.remove('invalid-fieldset');
    }

    return isValid;
}

function saveProfessorFromForm() {
    if (!validateProfessorForm()) {
        showToast("Preencha o nome e selecione ao menos uma matéria.", "error");
        return;
    }

    const nome = document.getElementById("profNome").value.trim();
    
    let disponibilidadeFinal = {};
    if (editingProfessorId) {
        const oldProf = store.getState().professores.find(p => p.id === editingProfessorId);
        if (oldProf && oldProf.disponibilidade) {
            disponibilidadeFinal = JSON.parse(JSON.stringify(oldProf.disponibilidade));
        }
    }
    
    for (const estId in profDisponibilidadeMatriz) {
        disponibilidadeFinal[estId] = profDisponibilidadeMatriz[estId];
    }

    const data = {
        id: editingProfessorId || uid(),
        nome,
        materiasIds: Array.from(selectedMateriasIds),
        disponibilidade: disponibilidadeFinal,
        status: 'ativo'
    };

    lastSavedProfessorId = data.id;
    store.dispatch('SAVE_PROFESSOR', data);
    
    setProfessorFormDirty(false); // Limpa flag
    showToast("Professor salvo com sucesso!", "success");
    cancelEditProfessor(); // Reseta formulário
    switchProfessoresTab('gerenciar'); // Troca aba
    renderProfessores(); // Força update da lista
}

function editProfessorInForm(id) {
    const { professores } = store.getState();
    const prof = professores.find(p => p.id === id);
    if (!prof) return;

    cancelEditProfessor();
    editingProfessorId = id;

    document.getElementById("profNome").value = prof.nome;
    
    selectedMateriasIds = new Set(prof.materiasIds || []);
    
    profDisponibilidadeMatriz = JSON.parse(JSON.stringify(prof.disponibilidade || {}));
    
    updateProfessorFormOptions();

    const estKeys = Object.keys(profDisponibilidadeMatriz);
    if (estKeys.length > 0) {
        const select = document.getElementById("profEstruturaSelect");
        if (select) {
            select.value = estKeys[0];
            select.dispatchEvent(new Event('change'));
        }
    }

    const btnSalvar = document.getElementById("btnSalvarProfessor");
    btnSalvar.textContent = "💾 Salvar Alterações";

    const formTab = pageProfessores.querySelector('.painel-tab-btn[data-tab="formulario"]');
    if(formTab) formTab.innerHTML = `📝 Editando: ${prof.nome}`;

    switchProfessoresTab('formulario');
}

function cancelEditProfessor() {
    editingProfessorId = null;
    document.getElementById("profNome").value = "";
    selectedMateriasIds.clear();
    profDisponibilidadeMatriz = {};
    
    document.getElementById("profEstruturaSelect").value = "";
    document.getElementById("profDisponibilidadeWrapper").style.display = 'none';
    document.getElementById("profDisponibilidadePlaceholder").style.display = 'block';

    updateProfessorFormOptions(); 
    
    document.querySelectorAll('.invalid, .invalid-fieldset').forEach(el => el.classList.remove('invalid', 'invalid-fieldset'));

    const btnSalvar = document.getElementById("btnSalvarProfessor");
    btnSalvar.textContent = "💾 Salvar Professor";

    const formTab = pageProfessores.querySelector('.painel-tab-btn[data-tab="formulario"]');
    if(formTab) formTab.innerHTML = `📝 Novo Professor`;

    setProfessorFormDirty(false);
}

async function archiveProfessor(id) {
    const { confirmed } = await showConfirm({
        title: "Arquivar Professor?",
        message: "O professor não aparecerá nas novas grades, mas o histórico será mantido.",
        confirmText: "Sim, Arquivar"
    });

    if (confirmed) {
        store.dispatch('ARCHIVE_PROFESSOR', id);
        renderProfessores();
        renderArchivedProfessores();
    }
}

function initProfessoresPage() {
    renderFormularioProfessor();

    switchProfessoresTab = setupTabbedPanel('#page-professores .painel-gerenciamento', 'professores', (tabId) => {
        if (tabId === 'gerenciar') {
            cancelEditProfessor();
            renderProfessores();
        }
        if (tabId === 'arquivados') renderArchivedProfessores();
        if (tabId === 'formulario') updateProfessorFormOptions(); 
        
        const addBtn = pageProfessores.querySelector('.btn-add-new');
        if (addBtn) addBtn.style.display = (tabId === 'gerenciar' || tabId === 'arquivados') ? 'inline-flex' : 'none';
    });

    const btnAdd = pageProfessores.querySelector('.btn-add-new');
    if (btnAdd) {
        btnAdd.addEventListener('click', () => {
            cancelEditProfessor();
            switchProfessoresTab('formulario');
        });
    }

    document.querySelector("#tblProfessores").addEventListener('click', (e) => {
        const btn = e.target.closest('button');
        if (!btn) return;
        const { action, id } = btn.dataset;
        if (action === 'edit') editProfessorInForm(id);
        if (action === 'archive') archiveProfessor(id);
    });

    document.querySelector("#tblProfessoresArquivados").addEventListener('click', (e) => {
        const btn = e.target.closest('button');
        if (!btn) return;
        const { action, id } = btn.dataset;
        if (action === 'unarchive') {
            store.dispatch('UNARCHIVE_PROFESSOR', id);
            renderProfessores();
            renderArchivedProfessores();
        }
    });

    const inputFiltro = document.getElementById("filtroProfessores");
    if (inputFiltro) inputFiltro.addEventListener("input", renderProfessores);
    
    const inputFiltroArq = document.getElementById("filtroProfessoresArquivadas");
    if (inputFiltroArq) inputFiltroArq.addEventListener("input", renderArchivedProfessores);

    renderProfessores();
}

document.addEventListener('DOMContentLoaded', initProfessoresPage);