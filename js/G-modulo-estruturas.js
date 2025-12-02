let editingEstruturaId = null;
let lastSavedEstruturaId = null;
let switchEstruturasTab = () => {};
let tempStructureData = {};
let currentDayTab = 'seg';
let draggedBlockElement = null;
let includeWeekend = false;

const pageEstruturas = document.getElementById("page-estruturas");
const filtroEstruturasArquivadasInput = document.getElementById("filtroEstruturasArquivadas");

function setEstruturaFormDirty(isDirty) {
    dirtyForms.estruturas = isDirty;
}

function initTempStructure() {
    const days = ['seg', 'ter', 'qua', 'qui', 'sex', 'sab', 'dom'];
    tempStructureData = {
        nome: '',
        dias: {}
    };
    days.forEach(day => {
        tempStructureData.dias[day] = {
            inicio: '07:00',
            blocos: [] 
        };
    });
    includeWeekend = false;
}

function renderFormularioEstrutura() {
    const container = document.getElementById("form-estrutura-container");
    if (!container || container.innerHTML.trim() !== "") return;

    container.innerHTML = `
        <div class="animated-field" style="margin-bottom: 16px;">
            <input id="estruturaNome" type="text" placeholder=" " autocomplete="off" />
            <label for="estruturaNome">Nome da Estrutura (ex: Ensino Médio - Manhã)</label>
        </div>

        <div style="display: flex; justify-content: center; margin-bottom: 16px;">
            <label class="check-inline">
                <input type="checkbox" id="toggle-weekend">
                📅 Incluir Fim de Semana (Sáb/Dom)
            </label>
        </div>

        <div class="builder-tabs" id="builder-day-tabs"></div>

        <div class="structure-builder-container">
            <div class="builder-tools">
                <div class="quick-config-group">
                    <h5>🚀 Geração Rápida</h5>
                    <div class="form-group">
                        <label>Início do Dia</label>
                        <input type="time" id="tool-start-time" value="07:00" class="input-sm">
                    </div>
                    <div class="form-row" style="margin: 8px 0; gap: 8px;">
                        <div class="form-group" style="flex: 1;">
                            <label>Qtd. Aulas</label>
                            <input type="number" id="tool-aula-count" value="5" min="1" max="15" class="input-sm">
                        </div>
                        <div class="form-group" style="flex: 1;">
                            <label>Min/Aula</label>
                            <input type="number" id="tool-aula-duration" value="50" step="5" class="input-sm">
                        </div>
                    </div>
                    <button id="btn-generate-base" class="primary" style="width: 100%; font-size: 0.9rem;">Gerar Blocos</button>
                </div>

                <div class="quick-config-group">
                    <h5>➕ Adicionar Bloco</h5>
                    <div style="display: flex; flex-direction: column; gap: 8px;">
                        <button class="secondary" id="btn-add-aula">📘 Aula</button>
                        <button class="secondary" id="btn-add-intervalo">🍔 Intervalo</button>
                        <button class="secondary" id="btn-add-espaco">⏰ Espaço</button>
                    </div>
                </div>

                <button class="primary" id="btn-replicate-day" style="width: 100%; margin-top: 8px;" title="Copiar configuração deste dia para todos os outros">
                    ♻️ Reciclar p/ Todos
                </button>
            </div>

            <div class="builder-timeline-wrapper">
                <div class="builder-timeline" id="builder-timeline">
                    <p class="muted" style="text-align: center; margin-top: 40px;">Nenhum bloco de horário definido para este dia.</p>
                </div>
            </div>
        </div>

        <div class="form-row form-row-center" style="margin-top: 32px;">
            <button id="btnSalvarEstrutura" class="success">💾 Salvar Estrutura</button>
            <button id="btnCancelarEstrutura" class="purple">🗑️ Cancelar</button>
        </div>
    `;

    document.getElementById("estruturaNome").addEventListener("input", (e) => {
        tempStructureData.nome = e.target.value;
        setEstruturaFormDirty(true);
    });

    document.getElementById("toggle-weekend").addEventListener("change", (e) => {
        includeWeekend = e.target.checked;
        if (!includeWeekend) {
            tempStructureData.dias.sab.blocos = [];
            tempStructureData.dias.dom.blocos = [];
            tempStructureData.dias.sab.inicio = '07:00';
            tempStructureData.dias.dom.inicio = '07:00';
        }
        renderDayTabs();
    });

    document.getElementById("tool-start-time").addEventListener("change", (e) => {
        tempStructureData.dias[currentDayTab].inicio = e.target.value;
        recalculateTimes();
        renderTimeline();
        setEstruturaFormDirty(true);
    });

    document.getElementById("btn-generate-base").addEventListener("click", generateBaseBlocks);
    document.getElementById("btn-add-aula").addEventListener("click", () => addBlock('aula', 50));
    document.getElementById("btn-add-intervalo").addEventListener("click", () => addBlock('intervalo', 20));
    document.getElementById("btn-add-espaco").addEventListener("click", () => addBlock('espaco', 60));
    
    document.getElementById("btn-replicate-day").addEventListener("click", replicateDayConfig);

    document.getElementById("btnSalvarEstrutura").addEventListener("click", saveEstruturaFromForm);
    document.getElementById("btnCancelarEstrutura").addEventListener("click", () => {
        cancelEditEstrutura();
        switchEstruturasTab('gerenciar');
    });

    renderDayTabs();
}

function renderDayTabs() {
    const container = document.getElementById("builder-day-tabs");
    if (!tempStructureData || !tempStructureData.dias) return;

    let days = ['seg', 'ter', 'qua', 'qui', 'sex'];
    if (includeWeekend) {
        days.push('sab', 'dom');
    } else {
        if (currentDayTab === 'sab' || currentDayTab === 'dom') {
            currentDayTab = 'seg';
            updateToolsFromState();
            renderTimeline();
        }
    }
    
    container.innerHTML = days.map(dayId => {
        const dayName = DIAS_SEMANA.find(d => d.id === dayId).nome;
        const activeClass = dayId === currentDayTab ? 'active' : '';
        const dayData = tempStructureData.dias[dayId];
        
        let badgeHtml = '';
        if (dayData && dayData.blocos && dayData.blocos.length > 0) {
            const totalMin = dayData.blocos.reduce((acc, b) => acc + b.duration, 0);
            const h = Math.floor(totalMin / 60);
            const m = totalMin % 60;
            const timeStr = m > 0 ? `${h}h ${m}m` : `${h}h`;
            badgeHtml = `<span class="tab-time-badge">${timeStr}</span>`;
        }

        return `<button class="builder-tab-btn ${activeClass}" data-day="${dayId}">${dayName} ${badgeHtml}</button>`;
    }).join('');

    container.querySelectorAll('.builder-tab-btn').forEach(btn => {
        btn.onclick = () => {
            currentDayTab = btn.dataset.day;
            renderDayTabs();
            updateToolsFromState();
            renderTimeline();
        };
    });
}

function updateToolsFromState() {
    if (!tempStructureData.dias[currentDayTab]) return;
    const dayData = tempStructureData.dias[currentDayTab];
    document.getElementById("tool-start-time").value = dayData.inicio;
}

async function generateBaseBlocks() {
    const currentBlocks = tempStructureData.dias[currentDayTab].blocos;
    
    if (currentBlocks.length > 0) {
        const { confirmed } = await showConfirm({
            title: "Substituir Blocos?",
            message: "Já existem blocos configurados para este dia. Gerar novos blocos irá apagar os atuais. Deseja continuar?",
            confirmText: "Sim, Substituir"
        });
        if (!confirmed) return;
    }

    const count = parseInt(document.getElementById("tool-aula-count").value) || 5;
    const duration = parseInt(document.getElementById("tool-aula-duration").value) || 50;
    
    const newBlocks = [];
    for(let i=0; i<count; i++) {
        newBlocks.push({ type: 'aula', duration: duration, id: uid() });
    }
    
    tempStructureData.dias[currentDayTab].blocos = newBlocks;
    
    const isValidTime = recalculateTimes();
    if (!isValidTime) {
        tempStructureData.dias[currentDayTab].blocos = []; 
        showToast("A configuração excede o limite do dia (23:59).", "error");
    }
    
    renderTimeline();
    renderDayTabs(); 
    setEstruturaFormDirty(true);
}

function addBlock(type, defaultDuration) {
    const dayData = tempStructureData.dias[currentDayTab];
    const currentTotalMinutes = parseTimeToMinutes(dayData.inicio) + dayData.blocos.reduce((acc, b) => acc + b.duration, 0);
    
    if (currentTotalMinutes + defaultDuration > 1439) {
        showToast("Não é possível adicionar: ultrapassa o limite do dia (23:59).", "error");
        return;
    }

    dayData.blocos.push({
        type: type,
        duration: defaultDuration,
        id: uid()
    });
    recalculateTimes();
    renderTimeline();
    renderDayTabs();
    setEstruturaFormDirty(true);
}

async function removeBlock(index) {
    const { confirmed } = await showConfirm({
        title: "Remover Bloco?",
        message: "Tem certeza que deseja remover este bloco de horário?",
        confirmText: "Sim, Remover"
    });

    if (confirmed) {
        tempStructureData.dias[currentDayTab].blocos.splice(index, 1);
        recalculateTimes();
        renderTimeline();
        renderDayTabs();
        setEstruturaFormDirty(true);
    }
}

async function replicateDayConfig() {
    const currentBlocks = tempStructureData.dias[currentDayTab].blocos;
    if (currentBlocks.length === 0) {
        showToast("Configure o dia atual antes de replicar.", "error");
        return;
    }

    const { confirmed } = await showConfirm({
        title: "Replicar Configuração?",
        message: `Isto irá copiar a estrutura de <strong>${DIAS_SEMANA.find(d => d.id === currentDayTab).nome}</strong> para TODOS os outros dias, substituindo o que já existe.`,
        confirmText: "Sim, Replicar"
    });

    if (!confirmed) return;

    const sourceConfig = JSON.parse(JSON.stringify(tempStructureData.dias[currentDayTab]));
    let days = ['seg', 'ter', 'qua', 'qui', 'sex'];
    if (includeWeekend) days.push('sab', 'dom');
    
    days.forEach(day => {
        if (day !== currentDayTab) {
            tempStructureData.dias[day] = JSON.parse(JSON.stringify(sourceConfig));
        }
    });
    
    showToast(`Configuração aplicada a todos os dias!`, 'success');
    renderDayTabs();
    setEstruturaFormDirty(true);
}

function recalculateTimes() {
    if (!tempStructureData.dias[currentDayTab]) return true;
    
    const dayData = tempStructureData.dias[currentDayTab];
    let currentMin = parseTimeToMinutes(dayData.inicio);
    let aulaCounter = 1;
    let isValid = true;
    
    dayData.blocos.forEach(block => {
        if (currentMin + block.duration > 1439) {
            isValid = false; 
        }
        
        block.start = minutesToHHMM(currentMin);
        currentMin += block.duration;
        block.end = minutesToHHMM(currentMin);
        
        if (block.type === 'aula') {
            block.label = `${aulaCounter}ª Aula`;
            aulaCounter++;
        } else if (block.type === 'intervalo') {
            block.label = 'Intervalo';
        } else if (block.type === 'almoco') {
            block.label = 'Almoço'; 
        } else {
            block.label = 'Espaço';
        }
    });

    return isValid;
}

function renderTimeline() {
    const container = document.getElementById("builder-timeline");
    if (!tempStructureData.dias[currentDayTab]) return;
    
    const blocks = tempStructureData.dias[currentDayTab].blocos;
    
    if (blocks.length === 0) {
        container.innerHTML = `<p class="muted" style="text-align: center; margin-top: 40px;">Nenhum bloco definido. Use as ferramentas ao lado para começar.</p>`;
        return;
    }
    
    let html = '';
    blocks.forEach((block, index) => {
        let icon = '📘';
        if(block.type === 'intervalo') icon = '🍔';
        if(block.type === 'almoco') icon = '🟧';
        if(block.type === 'espaco') icon = '⏰';
        
        html += `
            <div class="time-block ${block.type}" draggable="true" data-index="${index}" data-block-id="${block.id}">
                <div class="block-icon">${icon}</div>
                <div class="block-info">
                    <span class="block-details">
                        ${block.label} 
                        <span class="separator">|</span> 
                        <span class="muted-time">${block.duration} min</span>
                    </span>
                </div>
                <div class="block-time">${block.start} - ${block.end}</div>
                <div class="block-actions">
                    <button type="button" onclick="changeDuration(${index}, -5)" title="-5 min">➖</button>
                    <button type="button" onclick="changeDuration(${index}, 5)" title="+5 min">➕</button>
                    <span class="action-separator">|</span>
                    <button type="button" class="btn-delete" onclick="removeBlock(${index})" title="Remover">🗑️</button>
                </div>
            </div>
        `;
    });
    
    container.innerHTML = html;
    
    const domBlocks = container.querySelectorAll('.time-block');
    domBlocks.forEach(el => {
        el.addEventListener('dragstart', handleDragStart);
        el.addEventListener('dragover', handleDragOver);
        el.addEventListener('drop', handleDrop);
        el.addEventListener('dragend', handleDragEnd);
    });
    
    parseEmojisInElement(container);
}

function changeDuration(index, delta) {
    const dayData = tempStructureData.dias[currentDayTab];
    const block = dayData.blocos[index];
    const newDuration = block.duration + delta;
    
    if (newDuration < 5) return;

    const currentTotalMinutes = parseTimeToMinutes(dayData.inicio) + dayData.blocos.reduce((acc, b) => acc + b.duration, 0);
    
    if (delta > 0 && currentTotalMinutes + delta > 1439) {
        showToast("Limite do dia (23:59) atingido.", "error");
        return;
    }

    block.duration = newDuration;
    recalculateTimes();
    renderTimeline();
    setEstruturaFormDirty(true);
}

function handleDragStart(e) {
    draggedBlockElement = this; 
    this.classList.add('dragging');
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', this.dataset.index);
}

function handleDragOver(e) {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';

    const targetElement = e.target.closest('.time-block');

    if (targetElement && targetElement !== draggedBlockElement) {
        const bounding = targetElement.getBoundingClientRect();
        const offset = bounding.y + (bounding.height / 2);
        
        if (e.clientY - offset > 0) {
            targetElement.after(draggedBlockElement);
        } else {
            targetElement.before(draggedBlockElement);
        }
    }
}

function handleDrop(e) {
    e.stopPropagation();
    e.preventDefault();
    
    if (!draggedBlockElement) return false;

    const container = document.getElementById("builder-timeline");
    if (!container.contains(draggedBlockElement)) return false;

    const newBlockOrder = [];
    const currentBlocksMap = new Map(tempStructureData.dias[currentDayTab].blocos.map(b => [b.id, b]));

    const domElements = container.querySelectorAll('.time-block');
    
    if (domElements.length !== tempStructureData.dias[currentDayTab].blocos.length) {
        renderTimeline(); 
        return false;
    }

    domElements.forEach(el => {
        const blockId = el.dataset.blockId;
        if (currentBlocksMap.has(blockId)) {
            newBlockOrder.push(currentBlocksMap.get(blockId));
        }
    });

    tempStructureData.dias[currentDayTab].blocos = newBlockOrder;
    
    recalculateTimes();
    renderTimeline();
    setEstruturaFormDirty(true);
    
    return false;
}

function handleDragEnd(e) {
    this.classList.remove('dragging');
    draggedBlockElement = null;
}

function renderEstruturas() {
    const container = document.getElementById("lista-estruturas-container");
    if (!container) return;

    const { estruturas, turmas } = store.getState();
    const estruturasAtivas = estruturas.filter(e => e.status === 'ativo');

    if (estruturasAtivas.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon">🏗️</div>
                <h3>Nenhuma Estrutura Cadastrada</h3>
                <p>Crie os modelos de horário (Manhã, Tarde) para suas turmas.</p>
            </div>`;
        return;
    }

    let html = `
        <table class="table" id="tblEstruturas">
            <thead>
                <tr>
                    <th>Nome</th>
                    <th>Horário Padrão</th>
                    <th>Turmas</th>
                    <th>Ações</th>
                </tr>
            </thead>
            <tbody>
    `;

    estruturasAtivas.sort((a, b) => a.nome.localeCompare(b.nome)).forEach(e => {
        const turmasUsando = turmas.filter(t => t.estruturaId === e.id).length;
        
        const exInicio = e.dias?.seg?.inicio || '??';
        const lastBlock = e.dias?.seg?.blocos[e.dias.seg.blocos.length-1];
        const exFim = lastBlock ? lastBlock.end : '??';
        
        html += `
            <tr data-id="${e.id}" class="${lastSavedEstruturaId === e.id ? 'flash-update' : ''}">
                <td><strong>${e.nome}</strong></td>
                <td>${exInicio} - ${exFim} (Ref: Seg)</td>
                <td>${turmasUsando} turmas</td>
                <td>
                    <button class="secondary" data-action="edit" data-id="${e.id}">✏️ Editar</button>
                    <button class="danger" data-action="archive" data-id="${e.id}">🗃️ Arquivar</button>
                </td>
            </tr>
        `;
    });

    html += `</tbody></table>`;
    container.innerHTML = html;

    if (lastSavedEstruturaId) {
        setTimeout(() => {
            const row = container.querySelector(`tr[data-id="${lastSavedEstruturaId}"]`);
            if (row) row.classList.remove('flash-update');
            lastSavedEstruturaId = null;
        }, 1500);
    }

    container.addEventListener('click', handleEstruturasTableClick);
    parseEmojisInElement(container);
}

function renderEstruturasArquivadas() {
    const container = document.getElementById("lista-estruturas-arquivadas-container");
    if (!container) return;

    const inputFiltro = document.getElementById("filtroEstruturasArquivadas");
    const filtro = inputFiltro ? inputFiltro.value.toLowerCase() : "";

    const { estruturas } = store.getState();
    const estruturasArquivadas = estruturas.filter(e => e.status === 'arquivado');
    const estruturasFiltradas = estruturasArquivadas.filter(e => e.nome.toLowerCase().includes(filtro));

    if (estruturasFiltradas.length === 0) {
        const html = estruturasArquivadas.length === 0 
            ? `<div class="empty-state" style="padding: 24px;"><div class="empty-state-icon">🗃️</div><h3>Vazio</h3></div>`
            : `<p class="muted center">Nenhuma encontrada.</p>`;
        container.innerHTML = html;
        return;
    }

    let html = `
        <table class="table" id="tblEstruturasArquivadas">
            <thead>
                <tr>
                    <th>Nome</th>
                    <th>Ações</th>
                </tr>
            </thead>
            <tbody>
    `;

    estruturasFiltradas.sort((a, b) => a.nome.localeCompare(b.nome)).forEach(e => {
        html += `
            <tr style="opacity: 0.7;">
                <td>${e.nome}</td>
                <td>
                    <button class="secondary" data-action="unarchive" data-id="${e.id}">🔄 Reativar</button>
                </td>
            </tr>
        `;
    });

    html += `</tbody></table>`;
    container.innerHTML = html;
    
    container.addEventListener('click', (e) => {
        const btn = e.target.closest('button');
        if (!btn) return;
        const { action, id } = btn.dataset;
        if (action === 'unarchive') {
            store.dispatch('UNARCHIVE_ESTRUTURA', id);
            renderEstruturas();
            renderEstruturasArquivadas();
            showToast("Estrutura reativada com sucesso!", "success");
        }
    });
}

function handleEstruturasTableClick(event) {
    const btn = event.target.closest('button');
    if (!btn) return;
    
    const { action, id } = btn.dataset;
    if (action === 'edit') editEstruturaInForm(id);
    else if (action === 'archive') archiveEstrutura(id);
}

function saveEstruturaFromForm() {
    const nomeInput = document.getElementById("estruturaNome");
    if (!validateInput(nomeInput)) {
        showToast("Preencha o nome da estrutura.", "error");
        return;
    }
    
    let minInicio = '23:59';
    let maxFim = '00:00';
    
    const diasIds = Object.keys(tempStructureData.dias);
    let hasBlocks = false;
    let isValidTime = true;
    
    diasIds.forEach(day => {
        const dayData = tempStructureData.dias[day];
        if (dayData.blocos.length > 0) {
            hasBlocks = true;
            if (dayData.inicio < minInicio) minInicio = dayData.inicio;
            
            const lastBlock = dayData.blocos[dayData.blocos.length-1];
            if (lastBlock.end > maxFim) maxFim = lastBlock.end;
            
            const endMin = parseTimeToMinutes(lastBlock.end);
            if (endMin > 1439 || endMin < parseTimeToMinutes(dayData.inicio)) {
                isValidTime = false;
            }
        }
    });
    
    if (!hasBlocks) {
        showToast("Adicione pelo menos um bloco de aula em algum dia.", "error");
        return;
    }

    if (!isValidTime) {
        showToast("Erro nos horários: Verifique se as aulas não ultrapassam a meia-noite.", "error");
        return;
    }

    const data = {
        id: editingEstruturaId || uid(),
        nome: tempStructureData.nome,
        dias: tempStructureData.dias,
        inicio: minInicio, 
        fim: maxFim,       
        status: 'ativo'
    };

    lastSavedEstruturaId = data.id;
    store.dispatch('SAVE_ESTRUTURA', data);
    
    setEstruturaFormDirty(false);
    showToast("Estrutura salva com sucesso!", "success");
    cancelEditEstrutura();
    switchEstruturasTab('gerenciar');
    renderEstruturas();
}

function editEstruturaInForm(id) {
    const { estruturas } = store.getState();
    const estrutura = estruturas.find(e => e.id === id);
    if (!estrutura) return;

    editingEstruturaId = id;
    
    tempStructureData = JSON.parse(JSON.stringify(estrutura));
    
    if (!tempStructureData.dias) {
        initTempStructure();
        tempStructureData.nome = estrutura.nome;
    }

    document.getElementById("estruturaNome").value = tempStructureData.nome;
    
    const hasWeekend = (tempStructureData.dias.sab && tempStructureData.dias.sab.blocos.length > 0) || 
                       (tempStructureData.dias.dom && tempStructureData.dias.dom.blocos.length > 0);
    includeWeekend = hasWeekend;
    document.getElementById("toggle-weekend").checked = hasWeekend;

    currentDayTab = 'seg';
    updateToolsFromState();
    recalculateTimes(); 
    renderTimeline();
    renderDayTabs();

    document.getElementById("btnSalvarEstrutura").textContent = "💾 Salvar Alterações";
    const formTab = pageEstruturas.querySelector('.painel-tab-btn[data-tab="formulario"]');
    if(formTab) formTab.innerHTML = `📝 Editando: ${estrutura.nome}`;

    switchEstruturasTab('formulario');
}

function cancelEditEstrutura() {
    editingEstruturaId = null;
    document.getElementById("estruturaNome").value = "";
    initTempStructure();
    
    document.getElementById("toggle-weekend").checked = false;
    includeWeekend = false;

    currentDayTab = 'seg';
    document.getElementById("tool-start-time").value = "07:00";
    renderTimeline();
    renderDayTabs();
    
    document.getElementById("btnSalvarEstrutura").textContent = "💾 Salvar Estrutura";
    const formTab = pageEstruturas.querySelector('.painel-tab-btn[data-tab="formulario"]');
    if(formTab) formTab.innerHTML = `📝 Nova Estrutura`;

    setEstruturaFormDirty(false);
}

async function archiveEstrutura(id) {
    const { turmas } = store.getState();
    const emUso = turmas.some(t => t.estruturaId === id);

    if (emUso) {
        showInfoModal({
            title: "Ação Bloqueada",
            contentHTML: "<p>Esta estrutura está vinculada a uma ou mais turmas ativas. Você não pode arquivá-la enquanto estiver em uso.</p>"
        });
        return;
    }

    const { confirmed } = await showConfirm({
        title: "Arquivar Estrutura?",
        message: "A estrutura não aparecerá para novas turmas, mas o histórico será mantido.",
        confirmText: "Sim, Arquivar"
    });

    if (confirmed) {
        store.dispatch('ARCHIVE_ESTRUTURA', id);
        renderEstruturas();
        renderEstruturasArquivadas();
        showToast("Estrutura arquivada.", "success");
    }
}

function initEstruturasPage() {
    initTempStructure();
    renderFormularioEstrutura();

    switchEstruturasTab = setupTabbedPanel('#page-estruturas .painel-gerenciamento', 'estruturas', (tabId) => {
        if (tabId === 'gerenciar') {
            cancelEditEstrutura();
            renderEstruturas();
        }
        if (tabId === 'arquivados') renderEstruturasArquivadas();
    });

    const btnAdd = pageEstruturas.querySelector('.btn-add-new');
    if (btnAdd) {
        btnAdd.addEventListener('click', () => {
            cancelEditEstrutura();
            switchEstruturasTab('formulario');
        });
    }

    if (filtroEstruturasArquivadasInput) filtroEstruturasArquivadasInput.addEventListener("input", renderEstruturasArquivadas);

    renderEstruturas();
}

document.addEventListener('DOMContentLoaded', initEstruturasPage);