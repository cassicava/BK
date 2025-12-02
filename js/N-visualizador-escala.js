let currentHorario = null;

function calculateStructureCapacity(estrutura) {
    if (!estrutura || !estrutura.dias) return 0;
    
    let totalSlots = 0;
    Object.values(estrutura.dias).forEach(dia => {
        if (dia.blocos && Array.isArray(dia.blocos)) {
            totalSlots += dia.blocos.filter(b => b.type === 'aula').length;
        }
    });
    
    return totalSlots;
}

function countAllocatedClasses(horario, turmaId) {
    if (!horario || !horario.slots) return 0;
    return horario.slots.filter(s => s.turmaId === turmaId && s.materiaId !== null).length;
}

// --- NOVA FUNÇÃO PARA ATUALIZAR PROGRESSO EM TEMPO REAL ---
window.updateTurmaStats = function(turmaId) {
    // Encontra o container da turma no DOM
    // Como não temos ID direto no card, vamos procurar pelo atributo data na primeira célula da tabela dentro do card
    // Uma estratégia melhor é adicionar um ID ou data-attribute no wrapper da turma na renderização principal.
    // Vamos ajustar o renderHorarioTable abaixo para adicionar 'id="turma-card-${turmaId}"' no wrapper.
    
    const turmaWrapper = document.getElementById(`turma-card-${turmaId}`);
    if (!turmaWrapper) return;

    const { turmas, estruturas } = store.getState();
    // Se for snapshot, usa do snapshot, senão do store
    const isSnapshot = !!currentHorario.snapshot;
    const getTurma = (id) => isSnapshot ? currentHorario.snapshot.turmas[id] : turmas.find(t => t.id === id);
    const getEstrutura = (id) => isSnapshot ? currentHorario.snapshot.estruturas[id] : estruturas.find(e => e.id === id);

    const turma = getTurma(turmaId);
    if (!turma) return;
    const estrutura = getEstrutura(turma.estruturaId);
    if (!estrutura) return;

    const totalCapacity = calculateStructureCapacity(estrutura);
    const allocated = countAllocatedClasses(currentHorario, turmaId);
    const percentage = totalCapacity > 0 ? (allocated / totalCapacity) * 100 : 0;

    let progressColor = '#3b82f6'; // Azul
    if (allocated === totalCapacity) progressColor = '#22c55e'; // Verde
    if (allocated > totalCapacity) progressColor = '#ef4444'; // Vermelho

    // Atualiza a barra e o texto
    const barFill = turmaWrapper.querySelector('.capacity-bar-fill');
    const textSpan = turmaWrapper.querySelector('.capacity-text-value');
    
    if (barFill) {
        barFill.style.width = `${Math.min(percentage, 100)}%`;
        barFill.style.backgroundColor = progressColor;
    }
    if (textSpan) {
        textSpan.innerHTML = `<span style="color: ${progressColor}">${allocated}</span> / ${totalCapacity} Aulas`;
    }
};

function renderHorarioTable(horario) {
    currentHorario = horario;
    
    const titleContainer = document.querySelector('.escala-view-header');
    if (titleContainer) {
        titleContainer.style.display = 'flex';
        titleContainer.style.alignItems = 'center';
        titleContainer.style.justifyContent = 'space-between';
        titleContainer.style.gap = '16px';
        titleContainer.style.padding = '16px 24px';
    }

    const titleTextEl = document.getElementById(horario.owner === 'gerador' ? 'gerador-escalaViewTitle' : 'escalaSalvaViewTitle');
    const titleInputEl = document.getElementById('gerador-escalaViewTitleInput');
    
    if (titleTextEl) titleTextEl.textContent = horario.nome;
    if (titleInputEl) titleInputEl.value = horario.nome;

    const container = document.getElementById(horario.owner === 'gerador' ? 'gerador-escalaTabelaWrap' : 'escalaSalvaTabelaWrap');
    if (!container) return;

    container.innerHTML = '';
    container.style.padding = '24px'; 
    container.style.boxSizing = 'border-box';

    const storeState = store.getState();
    const isSnapshot = !!horario.snapshot;
    
    const getTurma = (id) => isSnapshot ? horario.snapshot.turmas[id] : storeState.turmas.find(t => t.id === id);
    const getMateria = (id) => isSnapshot ? horario.snapshot.materias[id] : storeState.materias.find(m => m.id === id);
    const getProfessor = (id) => isSnapshot ? horario.snapshot.professores[id] : storeState.professores.find(p => p.id === id);
    const getEstrutura = (id) => isSnapshot ? horario.snapshot.estruturas[id] : storeState.estruturas.find(e => e.id === id);

    const turmasIds = [...new Set(horario.slots.map(s => s.turmaId))];

    if (turmasIds.length === 0) {
        container.innerHTML = '<p class="muted" style="padding: 20px; text-align: center;">Esta grade não possui aulas alocadas.</p>';
        return;
    }

    turmasIds.sort((a, b) => {
        const tA = getTurma(a);
        const tB = getTurma(b);
        if(!tA || !tB) return 0;
        return tA.nome.localeCompare(tB.nome);
    });

    turmasIds.forEach(turmaId => {
        const turma = getTurma(turmaId);
        if (!turma) return;

        const estrutura = getEstrutura(turma.estruturaId);
        if (!estrutura) return;

        const turmaWrapper = document.createElement('div');
        turmaWrapper.className = 'card';
        turmaWrapper.id = `turma-card-${turmaId}`; // ID adicionado para atualização em tempo real
        turmaWrapper.style.marginBottom = '32px'; 
        turmaWrapper.style.padding = '24px';
        turmaWrapper.style.border = '1px solid var(--border)';
        turmaWrapper.style.borderRadius = '24px'; 
        
        // --- Header da Turma com Progresso ---
        const header = document.createElement('h3');
        header.style.marginTop = '0';
        header.style.marginBottom = '20px';
        header.style.color = 'var(--fg)';
        header.style.display = 'flex';
        header.style.alignItems = 'center';
        header.style.gap = '16px';
        header.style.flexWrap = 'wrap';

        let displayIcons = '';
        let displayText = estrutura.nome;

        if (turma.turnos && turma.turnos.length > 0) {
            const order = { 'Manhã': 1, 'Tarde': 2, 'Noite': 3 };
            const iconMap = { 'Manhã': '☀️', 'Tarde': '🌤️', 'Noite': '🌙' };
            const sortedTurnos = [...turma.turnos].sort((a, b) => (order[a] || 4) - (order[b] || 4));
            
            displayIcons = sortedTurnos.map(turno => iconMap[turno]).join(' ');
            displayText = sortedTurnos.join(' / ');
        } else {
            const h = parseInt(estrutura.inicio.split(':')[0]);
            if (h < 12) displayIcons = '☀️';
            else if (h < 18) displayIcons = '🌤️';
            else displayIcons = '🌙';
        }

        const anoHtml = turma.anoLetivo ? `<span style="font-size:0.8rem; background:#eff6ff; color:var(--brand); padding:4px 8px; border-radius:6px; border:1px solid #bfdbfe;">${turma.anoLetivo}</span>` : '';
        
        // --- Cálculo de Progresso ---
        const totalCapacity = calculateStructureCapacity(estrutura);
        const allocated = countAllocatedClasses(horario, turmaId);
        const percentage = totalCapacity > 0 ? (allocated / totalCapacity) * 100 : 0;
        
        let progressColor = '#3b82f6';
        if (allocated === totalCapacity) progressColor = '#22c55e';
        if (allocated > totalCapacity) progressColor = '#ef4444';

        header.innerHTML = `
            <div style="display:flex; align-items:center; gap: 12px; min-width: 280px;">
                <span style="font-size: 1.4rem;">🎓</span>
                <div>
                    <div style="display:flex; align-items:center; gap: 8px;">
                        <span>${turma.nome}</span>
                        ${anoHtml}
                    </div>
                    <div style="font-size: 0.85rem; color: var(--muted); font-weight: normal; margin-top: 2px;">
                        ${displayIcons} ${displayText} <span style="margin: 0 4px;">•</span> ${estrutura.inicio} - ${estrutura.fim}
                    </div>
                </div>
            </div>

            <div style="width: 1px; height: 32px; background: var(--border); margin: 0 8px;"></div>

            <div style="display: flex; align-items: center; gap: 12px; flex-grow: 1; max-width: 400px;">
                <div style="flex-grow: 1; height: 8px; background-color: #f1f5f9; border-radius: 99px; overflow: hidden; border: 1px solid var(--border);">
                    <div class="capacity-bar-fill" style="height: 100%; width: ${Math.min(percentage, 100)}%; background-color: ${progressColor}; border-radius: 99px; transition: width 0.3s ease, background-color 0.3s ease;"></div>
                </div>
                <div class="capacity-text-value" style="font-size: 0.85rem; font-weight: 600; color: var(--muted); white-space: nowrap;">
                    <span style="color: ${progressColor}">${allocated}</span> / ${totalCapacity} Aulas
                </div>
            </div>
        `;
        turmaWrapper.appendChild(header);

        const table = document.createElement('table');
        table.className = 'escala-final-table'; 
        table.style.width = '100%';
        table.style.borderSpacing = '0'; 
        
        const thead = document.createElement('thead');
        
        const diasAtivos = DIAS_SEMANA.filter(dia => {
            const diaConfig = estrutura.dias[dia.id];
            return diaConfig && diaConfig.blocos && diaConfig.blocos.length > 0;
        });

        const orderedDays = ['seg', 'ter', 'qua', 'qui', 'sex', 'sab', 'dom'];
        diasAtivos.sort((a, b) => orderedDays.indexOf(a.id) - orderedDays.indexOf(b.id));
        
        let headHTML = `<tr><th style="width: 90px; background: var(--bg); text-align:center; padding: 12px;">Horário</th>`;
        diasAtivos.forEach(dia => {
            headHTML += `<th style="padding: 12px;">${dia.nome}</th>`;
        });
        headHTML += `</tr>`;
        thead.innerHTML = headHTML;
        table.appendChild(thead);

        const tbody = document.createElement('tbody');
        
        const diaRef = estrutura.dias['seg'] ? 'seg' : Object.keys(estrutura.dias)[0];
        const blocosRef = estrutura.dias[diaRef].blocos || [];

        if (blocosRef.length === 0) {
            tbody.innerHTML = `<tr><td colspan="${diasAtivos.length + 1}" class="muted center" style="padding: 20px;">Estrutura de horários não definida.</td></tr>`;
        } else {
            blocosRef.forEach((blocoRef, index) => {
                const tr = document.createElement('tr');
                
                const tdHorario = document.createElement('td');
                tdHorario.className = 'celula-horario';
                tdHorario.innerHTML = `
                    <div style="display:flex; flex-direction:column; align-items:center; justify-content:center; height:100%;">
                        <span style="font-size:0.85rem; font-weight:bold; color:var(--fg);">${blocoRef.start}</span>
                        <span style="font-size:0.75rem; color:var(--muted);">${blocoRef.end}</span>
                    </div>
                `;
                tr.appendChild(tdHorario);

                diasAtivos.forEach(dia => {
                    const td = document.createElement('td');
                    td.style.padding = '4px'; 
                    td.style.height = '100%';
                    td.style.verticalAlign = 'top'; 
                    
                    const blocoDia = estrutura.dias[dia.id] && estrutura.dias[dia.id].blocos[index];
                    
                    if (!blocoDia) {
                        td.style.backgroundColor = '#f8fafc';
                        td.style.backgroundImage = 'repeating-linear-gradient(135deg, transparent, transparent 10px, rgba(0,0,0,0.03) 10px, rgba(0,0,0,0.03) 20px)';
                        td.innerHTML = '';
                        tr.appendChild(td);
                        return;
                    }

                    if (blocoDia.type === 'aula') {
                        const slot = horario.slots.find(s => 
                            s.turmaId === turmaId && 
                            s.diaId === dia.id && 
                            s.blocoIndex === index 
                        );

                        td.className = 'editable-cell'; 
                        td.dataset.turmaId = turmaId;
                        td.dataset.diaId = dia.id;
                        td.dataset.blocoIndex = index;
                        if(slot) td.dataset.slotId = slot.id;

                        if (slot && slot.materiaId && slot.professorId) {
                            const materia = getMateria(slot.materiaId);
                            const prof = getProfessor(slot.professorId);
                            const cor = materia ? materia.cor : '#ffffff';
                            const textColor = getContrastingTextColor(cor);

                            td.innerHTML = `
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
                                        ${materia ? materia.sigla : '???'}
                                    </div>
                                    <div style="font-size: 0.75rem; font-weight: 600; opacity: 0.9; z-index: 1; text-align: center; margin-top: 2px;">
                                        ${prof ? prof.nome.split(' ')[0] : '???'}
                                    </div>
                                </div>
                            `;
                            td.title = `${materia?.nome} com ${prof?.nome}`;

                        } else {
                            td.classList.add('empty-slot');
                            td.innerHTML = `
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
                        }

                    } else {
                        let label = blocoDia.label || 'Intervalo';
                        let bgStyle = '';
                        let textColor = '#64748b';
                        let borderColor = '#e2e8f0';

                        if (blocoDia.type === 'intervalo') {
                            bgStyle = 'repeating-linear-gradient(45deg, #ecfdf5, #ecfdf5 10px, #d1fae5 10px, #d1fae5 20px)';
                            textColor = '#047857';
                            borderColor = '#10b981';
                        } else if (blocoDia.type === 'espaco') {
                            bgStyle = 'repeating-linear-gradient(45deg, #fce7f3, #fce7f3 10px, #fbcfe8 10px, #fbcfe8 20px)';
                            textColor = '#be185d';
                            borderColor = '#ec4899';
                        } else if (blocoDia.type === 'almoco') {
                            bgStyle = 'repeating-linear-gradient(45deg, #ffedd5, #ffedd5 10px, #fed7aa 10px, #fed7aa 20px)';
                            textColor = '#c2410c';
                            borderColor = '#f97316';
                        } else {
                            bgStyle = 'repeating-linear-gradient(45deg, #f3f4f6, #f3f4f6 10px, #e5e7eb 10px, #e5e7eb 20px)';
                        }
                        
                        td.innerHTML = `
                            <div style="
                                background: ${bgStyle};
                                border: 1px solid ${borderColor};
                                border-radius: 6px;
                                height: 100%;
                                min-height: 54px;
                                display:flex; 
                                align-items:center; 
                                justify-content:center; 
                                color:${textColor}; 
                                font-weight:700; 
                                font-size:0.75rem; 
                                text-transform:uppercase; 
                                letter-spacing:1px; 
                                cursor: not-allowed;
                                opacity: 0.9;
                            ">
                                <span style="background: rgba(255,255,255,0.8); padding: 2px 6px; border-radius: 4px; backdrop-filter: blur(2px);">${label}</span>
                            </div>
                        `;
                    }

                    tr.appendChild(td);
                });

                tbody.appendChild(tr);
            });
        }

        table.appendChild(tbody);
        turmaWrapper.appendChild(table);
        container.appendChild(turmaWrapper);
    });

    parseEmojisInElement(container);
}

function parseTimeToMinutes(t) {
    if (!t) return 0;
    const [h, m] = t.split(':').map(Number);
    return h * 60 + m;
}

function minutesToHHMM(min) {
    const h = String(Math.floor(min / 60)).padStart(2, '0');
    const m = String(min % 60).padStart(2, '0');
    return `${h}:${m}`;
}