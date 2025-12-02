let editingTurmaId = null;
let lastSavedTurmaId = null;
let switchTurmasTab = () => {};

const pageTurmas = document.getElementById("page-turmas");
const filtroTurmasInput = document.getElementById("filtroTurmas");

function setTurmaFormDirty(isDirty) {
    dirtyForms.turmas = isDirty;
}

function renderFormularioTurma() {
    const container = document.getElementById("form-turma-container");
    if (!container) return;

    const isEditing = !!editingTurmaId;
    const currentYear = new Date().getFullYear();

    let htmlContent = `
        <div class="grid-3-col" style="margin-bottom: 16px; align-items: center; gap: 16px;">
            <input id="turmaAnoLetivo" type="number" class="input-lg" placeholder="Ano Letivo" value="${currentYear}" min="2000" max="2100" style="height: 48px;" />

            <div class="animated-field">
                <input id="turmaNome" type="text" placeholder=" " autocomplete="off" />
                <label for="turmaNome">Nome da Turma</label>
            </div>
            
            <div class="check-container" style="justify-content: flex-start; gap: 12px; margin: 0; height: 48px; align-items: center;">
                <label class="check-inline" style="margin: 0;"><input type="checkbox" class="shift-check" value="Manhã"> Manhã</label>
                <label class="check-inline" style="margin: 0;"><input type="checkbox" class="shift-check" value="Tarde"> Tarde</label>
                <label class="check-inline" style="margin: 0;"><input type="checkbox" class="shift-check" value="Noite"> Noite</label>
            </div>
        </div>
    `;

    if (!isEditing) {
        htmlContent += `
            <div class="form-group" style="margin-bottom: 24px;">
                <label class="form-label">Gerar em Lote (Sufixos)</label>
                <div class="check-container">
                    <label class="check-inline"><input type="checkbox" class="batch-suffix" value="A"> A</label>
                    <label class="check-inline"><input type="checkbox" class="batch-suffix" value="B"> B</label>
                    <label class="check-inline"><input type="checkbox" class="batch-suffix" value="C"> C</label>
                    <label class="check-inline"><input type="checkbox" class="batch-suffix" value="D"> D</label>
                    <label class="check-inline"><input type="checkbox" class="batch-suffix" value="E"> E</label>
                    <label class="check-inline"><input type="checkbox" class="batch-suffix" value="F"> F</label>
                </div>
            </div>
        `;
    }

    htmlContent += `
        <div class="form-group">
            <label class="form-label">Estrutura de Horário Padrão</label>
            <select id="turmaEstruturaSelect"></select>
        </div>

        <div class="form-row form-row-center" style="margin-top: 32px;">
            <button id="btnSalvarTurma" class="success">💾 Salvar</button>
            <button id="btnCancelarTurma" class="purple">🗑️ Cancelar</button>
        </div>
    `;

    container.innerHTML = htmlContent;

    const nomeInput = document.getElementById("turmaNome");
    const anoInput = document.getElementById("turmaAnoLetivo");

    if (nomeInput) {
        nomeInput.addEventListener("input", (e) => {
            validateInput(e.target);
            setTurmaFormDirty(true);
        });
    }
    
    if (anoInput) {
        anoInput.addEventListener("input", (e) => {
            validateInput(e.target);
            setTurmaFormDirty(true);
        });
    }

    document.getElementById("turmaEstruturaSelect").addEventListener("change", (e) => {
        validateInput(e.target);
        setTurmaFormDirty(true);
    });

    document.getElementById("btnSalvarTurma").addEventListener("click", saveTurmaFromForm);
    
    document.getElementById("btnCancelarTurma").addEventListener("click", () => {
        cancelEditTurma();
        switchTurmasTab('gerenciar');
    });

    renderTurmaEstruturaSelect();
}

function renderTurmaEstruturaSelect() {
    const select = document.getElementById("turmaEstruturaSelect");
    if (!select) return;

    const parent = select.closest('.form-group');
    if (parent) {
        const errorMsg = parent.querySelector('.muted-link');
        if (errorMsg) errorMsg.remove();
    }
    select.disabled = false;

    const currentValue = select.value;
    const { estruturas } = store.getState();
    const estruturasAtivas = estruturas.filter(e => e.status === 'ativo').sort((a, b) => a.nome.localeCompare(b.nome));

    select.innerHTML = "<option value=''>Selecione uma estrutura</option>";

    if (estruturasAtivas.length === 0) {
        select.disabled = true;
        if (parent) {
            const p = document.createElement('p');
            p.className = 'muted muted-link';
            p.innerHTML = `Nenhuma estrutura ativa. <a href="#" onclick="go('estruturas')">Cadastre uma primeiro</a>.`;
            parent.appendChild(p);
        }
        return;
    }

    estruturasAtivas.forEach(e => {
        const option = document.createElement("option");
        option.value = e.id;
        option.textContent = `${e.nome} (${e.inicio || '?'} - ${e.fim || '?'})`;
        select.appendChild(option);
    });

    if (currentValue && estruturasAtivas.some(e => e.id === currentValue)) {
        select.value = currentValue;
    }
}

function renderTurmas() {
    const tbody = document.querySelector("#tblTurmas tbody");
    if (!tbody) return;

    const { turmas, estruturas } = store.getState();
    const filtro = filtroTurmasInput.value.toLowerCase();
    const turmasFiltradas = turmas.filter(t => t.nome.toLowerCase().includes(filtro));

    tbody.innerHTML = "";

    if (turmasFiltradas.length === 0) {
        const html = turmas.length === 0 
            ? `<div class="empty-state"><div class="empty-state-icon">🎓</div><h3>Nenhuma Turma</h3><p>Cadastre as classes da escola.</p></div>`
            : `<p class="muted center">Nenhuma turma encontrada.</p>`;
        tbody.innerHTML = `<tr><td colspan="3">${html}</td></tr>`;
        return;
    }

    turmasFiltradas.sort((a, b) => {
        const anoA = parseInt(a.anoLetivo || 0);
        const anoB = parseInt(b.anoLetivo || 0);
        if (anoA !== anoB) return anoB - anoA; 
        return a.nome.localeCompare(b.nome);
    });

    turmasFiltradas.forEach(t => {
        const tr = document.createElement("tr");
        tr.dataset.id = t.id;
        if (lastSavedTurmaId === t.id) tr.classList.add('flash-update');

        const estrutura = estruturas.find(e => e.id === t.estruturaId);
        let infoHorario = '<span class="muted">Estrutura não encontrada</span>';

        if (estrutura) {
            let displayIcons = '';
            let displayText = estrutura.nome;
            // CORREÇÃO: Garante que o subText seja sempre o horário
            let subText = `${estrutura.inicio} - ${estrutura.fim}`;

            if (t.turnos && t.turnos.length > 0) {
                const order = { 'Manhã': 1, 'Tarde': 2, 'Noite': 3 };
                const iconMap = { 'Manhã': '☀️', 'Tarde': '🌤️', 'Noite': '🌙' };
                const sortedTurnos = [...t.turnos].sort((a, b) => (order[a] || 4) - (order[b] || 4));
                
                displayIcons = sortedTurnos.map(turno => iconMap[turno]).join(' ');
                displayText = sortedTurnos.join(' / ');
                // O subText continua sendo o horário (não sobrescreve com nome da estrutura)
            } else {
                const h = parseInt(estrutura.inicio.split(':')[0]);
                if (h < 12) displayIcons = '☀️';
                else if (h < 18) displayIcons = '🌤️';
                else displayIcons = '🌙';
            }
            
            infoHorario = `
                <div class="badge-explanation" style="border: 1px solid var(--border); background-color: var(--bg);">
                    <span style="font-size: 1.1rem; letter-spacing: 2px;">${displayIcons}</span>
                    <div style="display:flex; flex-direction:column; line-height:1.1; align-items: flex-start;">
                        <span style="font-weight:600; font-size:0.85rem; color: var(--fg);">${displayText}</span>
                        <span style="font-size:0.75rem; color:var(--muted);">${subText}</span>
                    </div>
                </div>
            `;
        }

        const anoBadge = t.anoLetivo 
            ? `<span style="font-size: 0.75rem; color: var(--brand); background: #eff6ff; padding: 2px 6px; border-radius: 4px; border: 1px solid #dbeafe; margin-top: 4px; font-weight: bold;">${t.anoLetivo}</span>` 
            : '';

        tr.innerHTML = `
            <td>
                <div style="display: flex; align-items: center; gap: 10px;">
                    <div style="width: 36px; height: 36px; background: var(--bg); border-radius: 50%; display: flex; align-items: center; justify-content: center; border: 1px solid var(--border); font-size: 1rem;">🎓</div>
                    <div style="display: flex; flex-direction: column; align-items: flex-start;">
                        <strong style="font-size: 1rem;">${t.nome}</strong>
                        ${anoBadge}
                    </div>
                </div>
            </td>
            <td>${infoHorario}</td>
            <td>
                <button class="secondary" data-action="edit" data-id="${t.id}">✏️ Editar</button>
                <button class="danger" data-action="delete" data-id="${t.id}">🔥 Excluir</button>
            </td>
        `;
        tbody.appendChild(tr);
    });

    if (lastSavedTurmaId) {
        setTimeout(() => {
            const row = tbody.querySelector(`tr[data-id="${lastSavedTurmaId}"]`);
            if (row) row.classList.remove('flash-update');
            lastSavedTurmaId = null;
        }, 1500);
    }
}

function validateTurmaForm() {
    let isValid = true;
    const estSelect = document.getElementById("turmaEstruturaSelect");
    const nomeBase = document.getElementById("turmaNome");
    const anoInput = document.getElementById("turmaAnoLetivo");

    if (!validateInput(estSelect)) isValid = false;
    if (!validateInput(nomeBase)) isValid = false;
    if (!validateInput(anoInput)) isValid = false;

    return isValid;
}

function checkStructureConsistency(estruturaId, shifts) {
    const { estruturas } = store.getState();
    const est = estruturas.find(e => e.id === estruturaId);
    if (!est || shifts.length === 0) return true;

    const estNameLower = est.nome.toLowerCase();
    const startHour = parseInt(est.inicio.split(':')[0]);

    if (shifts.includes('Tarde') && (estNameLower.includes('manhã') || startHour < 11)) return false;
    if (shifts.includes('Manhã') && (estNameLower.includes('tarde') || startHour >= 12)) return false;
    if (shifts.includes('Noite') && (estNameLower.includes('manhã') || estNameLower.includes('tarde') || startHour < 17)) return false;

    return true;
}

async function saveTurmaFromForm() {
    if (!validateTurmaForm()) {
        showToast("Preencha todos os campos obrigatórios.", "error");
        return;
    }

    const estruturaId = document.getElementById("turmaEstruturaSelect").value;
    const anoLetivo = document.getElementById("turmaAnoLetivo").value;
    const nomeBase = document.getElementById("turmaNome").value.trim();
    const shifts = Array.from(document.querySelectorAll('.shift-check:checked')).map(cb => cb.value);
    
    if (!checkStructureConsistency(estruturaId, shifts)) {
        const { confirmed } = await showConfirm({
            title: "Atenção: Turno Incomum",
            message: "O turno selecionado parece não corresponder à Estrutura de Horário escolhida. Deseja continuar?",
            confirmText: "Sim, continuar",
            cancelText: "Corrigir"
        });
        if (!confirmed) return;
    }

    const { turmas } = store.getState();
    let itemsToSave = [];

    let suffixes = [];
    const suffixCheckboxes = document.querySelectorAll('.batch-suffix:checked');
    if (suffixCheckboxes.length > 0) {
        suffixes = Array.from(suffixCheckboxes).map(cb => cb.value);
    }

    if (!editingTurmaId && (suffixes.length > 0)) {
        const letters = suffixes; 
        const duplicates = [];
        
        letters.forEach(letter => {
            let fullName = nomeBase;
            if (letter) fullName += ` ${letter}`;
            
            if (shifts.length > 0) {
                const shiftStr = shifts.join('/');
                if(!fullName.includes(shiftStr)) fullName += ` ${shiftStr}`;
            }
            
            fullName = fullName.trim().replace(/\s+/g, ' ');

            if (turmas.some(t => t.nome.toLowerCase() === fullName.toLowerCase() && t.anoLetivo === anoLetivo)) {
                duplicates.push(fullName);
            } else {
                itemsToSave.push({ 
                    id: uid(), 
                    nome: fullName, 
                    estruturaId,
                    anoLetivo, 
                    turnos: shifts 
                });
            }
        });

        if (duplicates.length > 0) {
            showToast(`Turmas duplicadas ignoradas neste ano: ${duplicates.join(', ')}`, "info");
        }

        if (itemsToSave.length === 0 && duplicates.length > 0) return;

    } else {
        let finalName = nomeBase;
        
        if (!editingTurmaId && shifts.length > 0) {
             const shiftStr = shifts.join('/');
             if (!finalName.includes(shiftStr)) {
                 finalName += ` ${shiftStr}`;
             }
        }
        finalName = finalName.trim().replace(/\s+/g, ' ');

        if (turmas.some(t => t.nome.toLowerCase() === finalName.toLowerCase() && t.id !== editingTurmaId && t.anoLetivo === anoLetivo)) {
            return showToast("Já existe uma turma com este nome neste ano.", "error");
        }

        itemsToSave.push({
            id: editingTurmaId || uid(),
            nome: finalName,
            estruturaId,
            anoLetivo,
            turnos: shifts
        });
    }

    itemsToSave.forEach(data => {
        store.dispatch('SAVE_TURMA', data);
        lastSavedTurmaId = data.id;
    });

    const msg = itemsToSave.length > 1 
        ? `${itemsToSave.length} turmas geradas com sucesso!` 
        : "Turma salva com sucesso!";
    
    showToast(msg, "success");
    
    setTurmaFormDirty(false);
    cancelEditTurma();
    switchTurmasTab('gerenciar');
    renderTurmas();
}

function editTurmaInForm(id) {
    const { turmas } = store.getState();
    const turma = turmas.find(t => t.id === id);
    if (!turma) return;

    editingTurmaId = id;
    
    renderFormularioTurma(); 
    renderTurmaEstruturaSelect(); 

    document.getElementById("turmaNome").value = turma.nome;
    document.getElementById("turmaEstruturaSelect").value = turma.estruturaId;
    
    if (turma.anoLetivo) {
        document.getElementById("turmaAnoLetivo").value = turma.anoLetivo;
    }
    
    if (turma.turnos) {
        document.querySelectorAll('.shift-check').forEach(cb => {
            cb.checked = turma.turnos.includes(cb.value);
        });
    }

    const btnSalvar = document.getElementById("btnSalvarTurma");
    btnSalvar.textContent = "💾 Salvar Alterações";
    
    const formTab = pageTurmas.querySelector('.painel-tab-btn[data-tab="formulario"]');
    if(formTab) formTab.innerHTML = `📝 Editando: ${turma.nome}`;

    switchTurmasTab('formulario');
}

function cancelEditTurma() {
    editingTurmaId = null;
    
    renderFormularioTurma();

    const formTab = pageTurmas.querySelector('.painel-tab-btn[data-tab="formulario"]');
    if(formTab) formTab.innerHTML = `📝 Nova Turma`;

    setTurmaFormDirty(false);
}

function deleteTurma(id) {
    handleDeleteItem({
        id: id,
        itemName: 'Turma',
        dispatchAction: 'DELETE_TURMA'
    });
}

function initTurmasPage() {
    renderFormularioTurma();

    switchTurmasTab = setupTabbedPanel('#page-turmas .painel-gerenciamento', 'turmas', (tabId) => {
        if (tabId === 'gerenciar') {
            cancelEditTurma();
            renderTurmas();
        }
        if (tabId === 'formulario') {
            renderTurmaEstruturaSelect();
        }
    });

    const btnAdd = pageTurmas.querySelector('.btn-add-new');
    if (btnAdd) {
        btnAdd.addEventListener('click', () => {
            cancelEditTurma();
            switchTurmasTab('formulario');
        });
    }

    document.querySelector("#tblTurmas").addEventListener('click', (e) => {
        const btn = e.target.closest('button');
        if (!btn) return;
        const { action, id } = btn.dataset;
        if (action === 'edit') editTurmaInForm(id);
        if (action === 'delete') deleteTurma(id);
    });

    if (filtroTurmasInput) filtroTurmasInput.addEventListener("input", renderTurmas);

    renderTurmas();
}

document.addEventListener('DOMContentLoaded', initTurmasPage);