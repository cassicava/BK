/**************************************************************
 * 🛠️ Editor Manual de Horários (Modo Pintura)
 **************************************************************/

let editorState = {
    activeTool: 'cursor', // 'cursor', 'eraser', 'brush'
    activeBrush: null,    // { profId, materiaId, cor }
    selectedTurmaId: null, // Foco atual para filtrar a toolbox
    isDragging: false
};

function initEditor() {
    const tableWrap = document.getElementById(currentHorario.owner === 'gerador' ? 'gerador-escalaTabelaWrap' : 'escalaSalvaTabelaWrap');
    const toolbox = document.getElementById('editor-toolbox');
    const fab = document.getElementById('editor-toolbox-fab');

    if (!tableWrap || !toolbox) return;

    // Mostra a Toolbox
    toolbox.classList.remove('hidden');
    if (fab) fab.classList.remove('hidden');

    // Remove listeners antigos
    tableWrap.removeEventListener('click', handleGridClick);
    
    // Adiciona novos listeners
    tableWrap.addEventListener('click', handleGridClick);
    
    // Inicializa a Toolbox vazia ou com instrução
    renderToolbox();

    // Listener para focar na turma ao clicar no cabeçalho dela
    tableWrap.querySelectorAll('.card h3').forEach(header => {
        header.style.cursor = 'pointer';
        header.title = "Clique para carregar os pincéis desta turma";
        header.addEventListener('click', (e) => {
            // Acha o ID da turma baseado nas células da tabela seguinte
            const table = header.nextElementSibling;
            const firstCell = table.querySelector('.editable-cell');
            if (firstCell) {
                selectTurmaContext(firstCell.dataset.turmaId);
                // Highlight visual no header
                document.querySelectorAll('.card h3').forEach(h => h.style.color = 'var(--brand)');
                header.style.color = '#ef4444'; // Destaque
            }
        });
    });

    // Tenta selecionar a primeira turma automaticamente
    const firstTurmaCell = tableWrap.querySelector('.editable-cell');
    if (firstTurmaCell) {
        selectTurmaContext(firstTurmaCell.dataset.turmaId);
    }
}

function selectTurmaContext(turmaId) {
    editorState.selectedTurmaId = turmaId;
    renderToolbox();
    showToast(`Ferramentas carregadas para a turma selecionada.`, 'info');
}

function renderToolbox() {
    const toolbox = document.getElementById('editor-toolbox');
    const { turmas, materias, professores } = store.getState();
    const turma = turmas.find(t => t.id === editorState.selectedTurmaId);

    if (!turma) {
        toolbox.innerHTML = `<div class="toolbox-info-text">👆 Clique no título de uma turma para carregar as ferramentas de edição.</div>`;
        return;
    }

    let brushOptions = [];

    if (currentHorario.owner === 'gerador' && horarioState.matrizCurricular && horarioState.matrizCurricular[turma.id]) {
        // Usa a matriz definida no Wizard
        const matriz = horarioState.matrizCurricular[turma.id];
        Object.entries(matriz).forEach(([matId, data]) => {
            const mat = materias.find(m => m.id === matId);
            const prof = professores.find(p => p.id === data.profId) || { nome: 'A Definir', id: 'auto' }; 
            
            // Se for "Auto", tentamos achar quem foi alocado na grade para criar o pincel
            let profReal = prof;
            if (prof.id === 'auto') {
                const slotExistente = currentHorario.slots.find(s => s.turmaId === turma.id && s.materiaId === matId && s.professorId);
                if (slotExistente) {
                    profReal = professores.find(p => p.id === slotExistente.professorId);
                }
            }

            brushOptions.push({
                matId: mat.id,
                matNome: mat.nome,
                cor: mat.cor,
                emoji: mat.emoji,
                profId: profReal ? profReal.id : 'auto',
                profNome: profReal ? profReal.nome : 'Automático'
            });
        });
    } else {
        // Modo "Horário Salvo" ou Fallback
        const slotsTurma = currentHorario.slots.filter(s => s.turmaId === turma.id && s.materiaId);
        const unicos = new Set();
        
        slotsTurma.forEach(s => {
            const key = `${s.materiaId}|${s.professorId}`;
            if (!unicos.has(key)) {
                unicos.add(key);
                const mat = materias.find(m => m.id === s.materiaId);
                const prof = professores.find(p => p.id === s.professorId);
                if (mat && prof) {
                    brushOptions.push({
                        matId: mat.id,
                        matNome: mat.nome,
                        cor: mat.cor,
                        emoji: mat.emoji,
                        profId: prof.id,
                        profNome: prof.nome
                    });
                }
            }
        });
    }

    // Ordena pincéis
    brushOptions.sort((a, b) => a.matNome.localeCompare(b.matNome));

    // Renderiza HTML
    let brushesHTML = brushOptions.map(brush => {
        const isActive = editorState.activeTool === 'brush' && 
                         editorState.activeBrush?.matId === brush.matId && 
                         editorState.activeBrush?.profId === brush.profId;
        
        const textColor = getContrastingTextColor(brush.cor);
        
        return `
            <button class="toolbox-mode-btn ${isActive ? 'active' : ''}" 
                    onclick="activateBrush('${brush.matId}', '${brush.profId}', '${brush.cor}', '${brush.matNome}')"
                    style="border-left: 4px solid ${brush.cor}; min-width: 140px;">
                <div style="text-align: left;">
                    <div style="font-weight: bold; font-size: 0.8rem;">${brush.matNome}</div>
                    <div style="font-size: 0.75rem; color: var(--muted);">${brush.profNome.split(' ')[0]}</div>
                </div>
                ${isActive ? '🖌️' : ''}
            </button>
        `;
    }).join('');

    toolbox.innerHTML = `
        <div class="toolbox-layout-wrapper">
            <div class="toolbox-group-left">
                <button class="toolbox-tool-btn ${editorState.activeTool === 'eraser' ? 'active' : ''}" onclick="activateEraser()" title="Borracha (Limpar)">
                    🧼
                </button>
                <button class="toolbox-tool-btn ${editorState.activeTool === 'cursor' ? 'active' : ''}" onclick="activateCursor()" title="Cursor (Selecionar)">
                    👆
                </button>
            </div>
            <div class="toolbox-content-wrapper" style="overflow-x: auto; justify-content: flex-start; gap: 8px; padding: 0 8px;">
                <div style="font-size: 0.8rem; color: var(--muted); writing-mode: vertical-rl; transform: rotate(180deg); text-align: center; border-left: 1px solid #ddd; padding-left: 4px;">${turma.nome}</div>
                ${brushesHTML}
            </div>
            <div class="toolbox-group-right">
               <div style="display: flex; flex-direction: column; justify-content: center; font-size: 0.7rem; color: var(--muted); text-align: right;">
                    <span>Edição</span>
                    <span>Livre</span>
               </div>
            </div>
        </div>
    `;
}

// --- Ações da Toolbox ---

window.activateBrush = function(matId, profId, cor, matNome) {
    editorState.activeTool = 'brush';
    editorState.activeBrush = { matId, profId, cor, matNome };
    renderToolbox(); 
    document.body.style.cursor = `url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewport="0 0 24 24" fill="${encodeURIComponent(cor)}"><text y="20" font-size="20">🖌️</text></svg>') 0 20, auto`;
};

window.activateEraser = function() {
    editorState.activeTool = 'eraser';
    editorState.activeBrush = null;
    renderToolbox();
    document.body.style.cursor = `url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24"><text y="20" font-size="20">🧼</text></svg>') 10 10, auto`;
};

window.activateCursor = function() {
    editorState.activeTool = 'cursor';
    editorState.activeBrush = null;
    renderToolbox();
    document.body.style.cursor = 'default';
};

// --- Manipulação da Grade ---

function handleGridClick(event) {
    const cell = event.target.closest('.editable-cell');
    if (!cell) return;

    const { slotId } = cell.dataset;
    const slot = currentHorario.slots.find(s => s.id === slotId);
    
    if (!slot) return;

    // Modo Borracha
    if (editorState.activeTool === 'eraser') {
        if (slot.materiaId) {
            slot.materiaId = null;
            slot.professorId = null;
            slot.fixo = false;
            updateCellVisual(cell, null, null);
            checkAndRenderConflicts(cell, slot); 
            setGeradorFormDirty(true);
        }
        return;
    }

    // Modo Pincel
    if (editorState.activeTool === 'brush' && editorState.activeBrush) {
        // Aplica os dados
        slot.materiaId = editorState.activeBrush.matId;
        slot.professorId = editorState.activeBrush.profId;
        slot.fixo = true; // Marca como manual

        // Atualiza Visual
        updateCellVisual(cell, editorState.activeBrush, editorState.activeBrush.cor);
        
        // Verifica Conflitos
        checkAndRenderConflicts(cell, slot);
        
        setGeradorFormDirty(true);
        return;
    }

    // Modo Cursor 
    if (editorState.activeTool === 'cursor') {
        handleOpenAllocationModal(slot); 
    }
}

function updateCellVisual(cell, brushData, color) {
    if (!brushData) {
        cell.style.backgroundColor = '#f8fafc';
        cell.style.color = 'var(--muted)';
        cell.className = 'editable-cell empty-slot';
        cell.innerHTML = '<span class="muted" style="font-size: 0.8rem;">—</span>';
        cell.style.border = '1px solid var(--border)'; 
        return;
    }

    const textColor = getContrastingTextColor(color);
    cell.style.backgroundColor = color;
    cell.style.color = textColor;
    cell.className = 'editable-cell';
    
    const { professores } = store.getState();
    const prof = professores.find(p => p.id === brushData.profId);
    const profNome = prof ? prof.nome.split(' ')[0] : '???';

    cell.innerHTML = `
        <div style="font-weight: bold; font-size: 0.9rem;">${brushData.matNome.substring(0, 5).toUpperCase()}</div>
        <div style="font-size: 0.75rem; opacity: 0.9;">${profNome}</div>
    `;
}

function checkAndRenderConflicts(cell, slot) {
    cell.classList.remove('has-conflict');
    const oldTooltip = cell.querySelector('.conflict-marker-tooltip');
    const oldMarker = cell.querySelector('.conflict-marker');
    if (oldTooltip) oldTooltip.remove();
    if (oldMarker) oldMarker.remove();

    if (!slot.professorId || slot.professorId === 'auto') return;

    const { professores } = store.getState();
    const prof = professores.find(p => p.id === slot.professorId);
    if (!prof) return;

    let conflictMsg = null;

    // 1. Verifica Disponibilidade
    const turma = store.getState().turmas.find(t => t.id === slot.turmaId);
    if (turma) {
        const estId = turma.estruturaId;
        const disp = prof.disponibilidade && prof.disponibilidade[estId];
        
        if (disp && disp[slot.diaId] && disp[slot.diaId][slot.blocoIndex] === 'unavailable') {
            conflictMsg = "Professor marcou indisponibilidade.";
        }
    }

    // 2. Verifica Choque
    const choque = currentHorario.slots.find(s => 
        s.id !== slot.id && 
        s.professorId === slot.professorId &&
        s.diaId === slot.diaId &&
        s.blocoIndex === parseInt(slot.blocoIndex)
    );

    if (choque) {
        const outraTurma = store.getState().turmas.find(t => t.id === choque.turmaId);
        const nomeOutra = outraTurma ? outraTurma.nome : 'Outra Turma';
        conflictMsg = `Choque: Professor já alocado em ${nomeOutra}.`;
    }

    if (conflictMsg) {
        cell.classList.add('has-conflict'); 
        
        const marker = document.createElement('div');
        marker.className = 'conflict-marker';
        cell.appendChild(marker);

        const tooltip = document.createElement('div');
        tooltip.className = 'conflict-marker-tooltip';
        tooltip.innerText = `⚠️ ${conflictMsg}`;
        cell.appendChild(tooltip);
    }
}

async function handleOpenAllocationModal(slot) {
    // Mantido vazio ou com lógica antiga se necessário para o modo cursor
}

function cleanupEditor() {
    const tableWrap = document.getElementById('gerador-escalaTabelaWrap');
    if (tableWrap) {
        tableWrap.removeEventListener('click', handleGridClick);
    }
    const toolbox = document.getElementById('editor-toolbox');
    if(toolbox) toolbox.classList.add('hidden');
    document.body.style.cursor = 'default';
}