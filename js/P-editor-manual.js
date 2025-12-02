let editorState = {
    activeTool: 'brush', 
    activeBrush: null, 
    selectedProfId: '' 
};

function injectEditorStyles() {
    if (document.getElementById('editor-dynamic-styles')) return;
    const style = document.createElement('style');
    style.id = 'editor-dynamic-styles';
    style.innerHTML = `
        /* HIERARQUIA VISUAL */
        .editable-cell.preview-maybe {
            background-image: repeating-linear-gradient(45deg, #fff7ed, #fff7ed 10px, #ffedd5 10px, #ffedd5 20px) !important;
            box-shadow: inset 0 0 0 3px rgba(249, 115, 22, 0.4) !important;
            opacity: 0.95;
        }

        .editable-cell.preview-busy {
            background-image: repeating-linear-gradient(45deg, #f3e8ff, #f3e8ff 10px, #e9d5ff 10px, #e9d5ff 20px) !important;
            box-shadow: inset 0 0 0 3px rgba(147, 51, 234, 0.5) !important;
            cursor: not-allowed !important;
            opacity: 0.95;
        }

        .editable-cell.preview-unavailable {
            background-image: repeating-linear-gradient(45deg, #fef2f2, #fef2f2 10px, #fee2e2 10px, #fee2e2 20px) !important;
            box-shadow: inset 0 0 0 3px rgba(239, 68, 68, 0.5) !important;
            opacity: 0.95;
        }
        
        .editable-cell.preview-unavailable:hover::after { content: '🚫 Indisponível'; }
        .editable-cell.preview-busy:hover::after { content: '🟣 Ocupado (Choque)'; }
        .editable-cell.preview-maybe:hover::after { content: '⚠️ Preferência: Talvez'; }

        .editable-cell.preview-unavailable:hover::after,
        .editable-cell.preview-busy:hover::after,
        .editable-cell.preview-maybe:hover::after {
            position: absolute; bottom: 100%; left: 50%; transform: translateX(-50%);
            background: #1e293b; color: white; padding: 4px 8px; 
            border-radius: 4px; font-size: 0.75rem; pointer-events: none; 
            white-space: nowrap; z-index: 100; box-shadow: 0 4px 6px rgba(0,0,0,0.1);
        }

        /* --- ESTILO DA LEGENDA (Refinado) --- */
        .editor-legend-card {
            display: flex; 
            flex-wrap: wrap; 
            align-items: center; 
            justify-content: center; 
            gap: 20px; /* Mais espaço entre itens */
            padding: 20px 32px; /* Mais gordinho verticalmente */
            background: #fff; 
            border: 1px solid var(--border); 
            border-radius: 24px; /* Cantos arredondados padrão sistema */
            margin: 24px 0; /* Espaçamento igual em cima e embaixo */
            font-size: 0.95rem; /* Fonte um pouco maior */
            color: var(--muted);
            box-shadow: var(--shadow);
        }
        .legend-item { display: flex; align-items: center; gap: 8px; font-weight: 500; }
        
        /* Quadrados maiores */
        .legend-box { width: 20px; height: 20px; border-radius: 6px; border: 1px solid rgba(0,0,0,0.1); }
        
        .box-unavailable { background: repeating-linear-gradient(45deg, #fef2f2, #fef2f2 2px, #fee2e2 2px, #fee2e2 4px); border-color: #ef4444; }
        .box-busy { background: repeating-linear-gradient(45deg, #f3e8ff, #f3e8ff 2px, #e9d5ff 2px, #e9d5ff 4px); border-color: #9333ea; }
        .box-maybe { background: repeating-linear-gradient(45deg, #fff7ed, #fff7ed 2px, #ffedd5 2px, #ffedd5 4px); border-color: #f97316; }
        
        .box-intervalo { background: repeating-linear-gradient(45deg, #ecfdf5, #ecfdf5 2px, #d1fae5 2px, #d1fae5 4px); border-color: #10b981; }
        .box-espaco { background: repeating-linear-gradient(45deg, #fce7f3, #fce7f3 2px, #fbcfe8 2px, #fbcfe8 4px); border-color: #ec4899; }
        .box-void { background: repeating-linear-gradient(135deg, transparent, transparent 2px, rgba(0,0,0,0.05) 2px, rgba(0,0,0,0.05) 4px); background-color: #f8fafc; border-color: #cbd5e1; }

        .legend-separator { width: 2px; height: 24px; background: var(--border); margin: 0 12px; }
    `;
    document.head.appendChild(style);
}

function initEditor() {
    injectEditorStyles();
    
    const tableWrap = document.getElementById(currentHorario.owner === 'gerador' ? 'gerador-escalaTabelaWrap' : 'escalaSalvaTabelaWrap');
    
    const tableCard = tableWrap ? tableWrap.closest('.card') : null;
    const viewContainer = tableCard ? tableCard.parentElement : null;
    
    const toolbox = document.getElementById('editor-toolbox');
    const fab = document.getElementById('editor-toolbox-fab');

    if (!tableWrap || !toolbox || !viewContainer) return;

    renderLegend(viewContainer, tableCard);

    toolbox.classList.remove('hidden');
    if (fab) fab.classList.remove('hidden');

    tableWrap.removeEventListener('click', handleGridClick);
    tableWrap.addEventListener('click', handleGridClick);
    
    renderToolbox();
}

function renderLegend(parentContainer, insertBeforeElement) {
    const oldLegend = parentContainer.querySelector('.editor-legend-card');
    if (oldLegend) oldLegend.remove();

    const legend = document.createElement('div');
    legend.className = 'editor-legend-card';
    legend.innerHTML = `
        <div class="legend-item"><span class="legend-box box-unavailable"></span> Indisponível</div>
        <div class="legend-item"><span class="legend-box box-busy"></span> Choque (Ocupado)</div>
        <div class="legend-item"><span class="legend-box box-maybe"></span> Talvez</div>
        
        <div class="legend-separator"></div>
        
        <div class="legend-item"><span class="legend-box box-intervalo"></span> Intervalo</div>
        <div class="legend-item"><span class="legend-box box-espaco"></span> Espaço</div>
        <div class="legend-item"><span class="legend-box box-void"></span> Sem Aula</div>
    `;

    parentContainer.insertBefore(legend, insertBeforeElement);
}

function renderToolbox() {
    const toolbox = document.getElementById('editor-toolbox');
    const { professores, materias } = store.getState();
    const profsAtivos = professores.filter(p => p.status === 'ativo').sort((a, b) => a.nome.localeCompare(b.nome));

    let centerContent = '';

    if (editorState.activeTool === 'eraser') {
        clearAvailabilityPreview();
        
        centerContent = `
            <div style="display: flex; align-items: center; justify-content: flex-start; height: 100%; color: var(--muted); font-weight: 500; padding-left: 12px;">
                <span>🧼 Modo Limpeza: Clique nas aulas para removê-las.</span>
            </div>
        `;
    } else {
        const profOptions = profsAtivos.map(p => `<option value="${p.id}" ${editorState.selectedProfId === p.id ? 'selected' : ''}>👤 ${p.nome.split(' ')[0]}</option>`).join('');
        
        let pillsHTML = '';
        if (editorState.selectedProfId) {
            const prof = profsAtivos.find(p => p.id === editorState.selectedProfId);
            if (prof && prof.materiasIds) {
                pillsHTML = `<div style="display: flex; gap: 12px; overflow-x: auto; align-items: center; padding: 10px 12px; max-width: 100%; scrollbar-width: none;">`;
                
                prof.materiasIds.forEach(matId => {
                    const mat = materias.find(m => m.id === matId);
                    if (mat) {
                        const isActive = editorState.activeBrush && editorState.activeBrush.materiaId === mat.id;
                        const textColor = getContrastingTextColor(mat.cor);
                        
                        const borderStyle = isActive ? `2px solid var(--fg)` : `1px solid rgba(0,0,0,0.1)`;
                        const shadowStyle = isActive ? `0 4px 12px rgba(0,0,0,0.3)` : `0 2px 4px rgba(0,0,0,0.1)`;
                        const transformStyle = isActive ? `scale(1.05)` : `scale(1)`;

                        pillsHTML += `
                            <button onclick="setBrush('${mat.id}', '${prof.id}', '${mat.cor}', '${mat.nome}', '${mat.sigla}')"
                                style="
                                    background-color: ${mat.cor}; 
                                    color: ${textColor}; 
                                    border: ${borderStyle}; 
                                    border-radius: 99px; 
                                    padding: 8px 16px; 
                                    font-size: 0.9rem; 
                                    font-weight: 600; 
                                    cursor: pointer; 
                                    white-space: nowrap; 
                                    display: flex; 
                                    align-items: center; 
                                    gap: 8px;
                                    box-shadow: ${shadowStyle};
                                    transform: ${transformStyle};
                                    transition: all 0.2s cubic-bezier(0.25, 0.8, 0.25, 1);
                                    flex-shrink: 0;
                                    min-height: 40px;
                                ">
                                <span style="
                                    background: rgba(255,255,255,0.9); 
                                    color: #000; 
                                    border-radius: 50%; 
                                    width: 24px; 
                                    height: 24px; 
                                    display: flex; 
                                    justify-content: center; 
                                    align-items: center; 
                                    font-size: 1rem;
                                    box-shadow: 0 1px 2px rgba(0,0,0,0.1);
                                ">${mat.emoji || '📚'}</span>
                                <span>${mat.nome}</span>
                            </button>
                        `;
                    }
                });
                pillsHTML += `</div>`;
            } else {
                pillsHTML = `<span class="muted" style="font-size: 0.8rem; white-space: nowrap;">Sem matérias.</span>`;
            }
        }

        centerContent = `
            <div style="display: flex; flex-direction: row; align-items: center; gap: 12px; width: 100%; height: 100%; overflow: hidden;">
                <select id="toolbox-prof-select" onchange="selectProfessor(this.value)" 
                    style="padding: 8px; border-radius: 12px; border: 1px solid var(--border); font-size: 0.9rem; width: 150px; flex-shrink: 0; background-color: var(--bg); cursor: pointer;">
                    <option value="">👤 Professor...</option>
                    ${profOptions}
                </select>
                <div style="flex-grow: 1; overflow: hidden; display: flex; align-items: center; height: 100%;">
                    ${pillsHTML}
                </div>
            </div>
        `;
    }

    toolbox.innerHTML = `
        <div class="toolbox-layout-wrapper" style="display: flex; gap: 12px; align-items: center; height: 100%;">
            <div class="toolbox-group-left" style="display: flex; gap: 8px; align-items: center; background: rgba(0,0,0,0.03); padding: 6px; border-radius: 16px; height: fit-content;">
                <button class="toolbox-tool-btn ${editorState.activeTool === 'brush' ? 'active' : ''}" onclick="setTool('brush')" title="Pintar (Coruja)" style="font-size: 1.5rem; width: 44px; height: 44px; border-radius: 12px; background: ${editorState.activeTool === 'brush' ? 'var(--card)' : 'transparent'}; box-shadow: ${editorState.activeTool === 'brush' ? '0 2px 5px rgba(0,0,0,0.1)' : 'none'};">
                    🦉
                </button>
                <button class="toolbox-tool-btn ${editorState.activeTool === 'eraser' ? 'active' : ''}" onclick="setTool('eraser')" title="Apagar" style="font-size: 1.5rem; width: 44px; height: 44px; border-radius: 12px; background: ${editorState.activeTool === 'eraser' ? 'var(--card)' : 'transparent'}; box-shadow: ${editorState.activeTool === 'eraser' ? '0 2px 5px rgba(0,0,0,0.1)' : 'none'};">
                    🧼
                </button>
            </div>
            
            <div class="toolbox-content-wrapper" style="flex-grow: 1; overflow: hidden; display: flex; align-items: center; height: 100%;">
                ${centerContent}
            </div>
        </div>
    `;
    
    if (editorState.activeTool === 'brush' && editorState.selectedProfId) {
        visualizeProfessorAvailability(editorState.selectedProfId);
    }
}

function clearAvailabilityPreview() {
    document.querySelectorAll('.editable-cell').forEach(cell => {
        cell.classList.remove('preview-unavailable', 'preview-busy', 'preview-maybe');
    });
}

function visualizeProfessorAvailability(profId) {
    clearAvailabilityPreview();
    if (!profId) return;

    const { professores, turmas } = store.getState();
    const prof = professores.find(p => p.id === profId);
    if (!prof) return;

    const cells = document.querySelectorAll('.editable-cell');
    
    cells.forEach(cell => {
        const turmaId = cell.dataset.turmaId;
        const diaId = cell.dataset.diaId;
        const blocoIndex = parseInt(cell.dataset.blocoIndex);
        const turma = turmas.find(t => t.id === turmaId);
        
        if (!turma) return;

        let statusToApply = null;

        const estId = turma.estruturaId;
        if (prof.disponibilidade && prof.disponibilidade[estId]) {
            const statusDia = prof.disponibilidade[estId][diaId];
            if (statusDia) {
                const statusBloco = statusDia[blocoIndex];
                if (statusBloco === 'unavailable') {
                    statusToApply = 'preview-unavailable';
                } else if (statusBloco === 'maybe') {
                    statusToApply = 'preview-maybe';
                }
            }
        }

        const isBusy = currentHorario.slots.some(s => 
            s.professorId === profId && 
            s.diaId === diaId && 
            s.blocoIndex === blocoIndex &&
            s.turmaId !== turmaId 
        );

        if (isBusy) {
            if (statusToApply !== 'preview-unavailable') {
                statusToApply = 'preview-busy';
            }
        }

        if (statusToApply) {
            cell.classList.add(statusToApply);
        }
    });
}

window.setTool = function(tool) {
    editorState.activeTool = tool;
    if (tool === 'eraser') {
        editorState.activeBrush = null;
        editorState.selectedProfId = null; 
        clearAvailabilityPreview(); 
    }
    renderToolbox();
};

window.selectProfessor = function(profId) {
    editorState.selectedProfId = profId;
    editorState.activeBrush = null; 
    renderToolbox(); 
};

window.setBrush = function(materiaId, profId, cor, matNome, matSigla) {
    editorState.activeBrush = { materiaId, profId, cor, matNome, matSigla };
    renderToolbox();
};

 function handleGridClick(event) {
    const cell = event.target.closest('.editable-cell');
    if (!cell) return;

    if (cell.classList.contains('matrix-cell-void') || cell.style.cursor === 'not-allowed') return;

    const { slotId, turmaId } = cell.dataset; // Captura turmaId
    const slot = currentHorario.slots.find(s => s.id === slotId);
    
    if (!slot) return;

    // Modo Borracha
    if (editorState.activeTool === 'eraser') {
        if (slot.materiaId) {
            slot.materiaId = null;
            slot.professorId = null;
            slot.fixo = false;
            updateCellVisual(cell, null);
            setGeradorFormDirty(true);
            
            // ATUALIZA O PROGRESSO
            if (window.updateTurmaStats) window.updateTurmaStats(turmaId);
        }
        return;
    }

    // Modo Pincel
    if (editorState.activeTool === 'brush' && editorState.activeBrush) {
        
        if (cell.classList.contains('preview-busy')) {
            showToast('Professor ocupado neste horário!', 'error');
            return;
        }
        if (cell.classList.contains('preview-unavailable')) {
            showToast('Professor indisponível neste horário!', 'error');
            return;
        }

        slot.materiaId = editorState.activeBrush.materiaId;
        slot.professorId = editorState.activeBrush.profId;
        slot.fixo = true;

        updateCellVisual(cell, editorState.activeBrush);
        setGeradorFormDirty(true);
        
        visualizeProfessorAvailability(editorState.activeBrush.profId);
        
        // ATUALIZA O PROGRESSO
        if (window.updateTurmaStats) window.updateTurmaStats(turmaId);
    }
}

function updateCellVisual(cell, brushData) {
    // Remove qualquer classe de preview
    cell.classList.remove('preview-unavailable', 'preview-busy', 'preview-maybe');

    // Estado VAZIO
    if (!brushData) {
        cell.className = 'editable-cell empty-slot';
        cell.style.backgroundColor = '#ffffff'; // Fundo do TD limpo
        cell.style.color = '#cbd5e1';
        cell.style.border = 'none'; // Borda controlada pela tabela
        cell.style.backgroundImage = 'none';
        cell.title = '';
        cell.innerHTML = `
            <div style="
                background-color: #ffffff;
                border: 2px dashed #e2e8f0;
                border-radius: 8px;
                height: 100%;
                min-height: 54px;
                display: flex;
                align-items: center;
                justify-content: center;
                color: #cbd5e1;
                cursor: pointer;
                transition: all 0.2s;
            ">
                <span style="font-size: 1.5rem; font-weight: 300;">+</span>
            </div>
        `;
        return;
    }

    // Estado PREENCHIDO
    const { cor, matSigla, profId } = brushData;
    const textColor = getContrastingTextColor(cor);
    
    const { professores } = store.getState();
    const prof = professores.find(p => p.id === profId);
    const profNome = prof ? prof.nome.split(' ')[0] : '???';

    cell.className = 'editable-cell'; 
    cell.style.backgroundColor = 'transparent'; // CORREÇÃO: TD transparente
    cell.style.color = 'inherit';
    cell.style.backgroundImage = 'none';
    
    // O Div interno que recebe a cor e a sombra
    cell.innerHTML = `
        <div style="
            background-color: ${cor};
            color: ${textColor};
            border-radius: 8px;
            box-shadow: 0 2px 5px rgba(0,0,0,0.08);
            border: 1px solid rgba(0,0,0,0.1);
            height: 100%;
            min-height: 54px;
            width: 100%;
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
            padding: 4px;
            box-sizing: border-box;
            position: relative;
            overflow: hidden;
            transition: transform 0.1s ease, box-shadow 0.1s ease;
        ">
            <div style="font-weight: 800; font-size: 0.85rem; text-transform: uppercase; z-index: 1; text-align: center; line-height: 1.2;">
                ${matSigla}
            </div>
            <div style="font-size: 0.75rem; font-weight: 600; opacity: 0.9; z-index: 1; text-align: center; margin-top: 2px;">
                ${profNome}
            </div>
        </div>
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

    const turma = store.getState().turmas.find(t => t.id === slot.turmaId);
    if (turma) {
        const estId = turma.estruturaId;
        const disp = prof.disponibilidade && prof.disponibilidade[estId];
        
        if (disp && disp[slot.diaId] && disp[slot.diaId][slot.blocoIndex] === 'unavailable') {
            conflictMsg = "Professor marcou indisponibilidade.";
        }
    }

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

function cleanupEditor() {
    const tableWrap = document.getElementById('gerador-escalaTabelaWrap');
    if (tableWrap) {
        tableWrap.removeEventListener('click', handleGridClick);
    }
    const toolbox = document.getElementById('editor-toolbox');
    if(toolbox) toolbox.classList.add('hidden');
    clearAvailabilityPreview();
    
    const viewIds = ['gerador-escalaView', 'escalaSalvaView'];
    viewIds.forEach(id => {
        const container = document.getElementById(id);
        if(container) {
            const legend = container.querySelector('.editor-legend-card');
            if(legend) legend.remove();
        }
    });
}