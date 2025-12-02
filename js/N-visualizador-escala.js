let currentHorario = null;

function renderHorarioTable(horario) {
    currentHorario = horario;
    
    // --- 1. Ajuste do Cabeçalho (Alinhamento e Espaçamento) ---
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
    // CORREÇÃO: Padding uniforme de 24px em todos os lados
    container.style.padding = '24px'; 
    container.style.boxSizing = 'border-box';

    // Recupera dados
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

    // Ordena turmas por nome
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

        // --- Card da Turma ---
        const turmaWrapper = document.createElement('div');
        turmaWrapper.className = 'card';
        turmaWrapper.style.marginBottom = '32px'; 
        turmaWrapper.style.padding = '24px';
        turmaWrapper.style.border = '1px solid var(--border)';
        turmaWrapper.style.borderRadius = '24px'; // Border radius aumentado
        
        // Cabeçalho do Card da Turma
        const header = document.createElement('h3');
        header.style.marginTop = '0';
        header.style.marginBottom = '20px';
        header.style.color = 'var(--fg)';
        header.style.display = 'flex';
        header.style.alignItems = 'center';
        header.style.gap = '12px';

        // Lógica de Turnos
        let displayIcons = '';
        let displayText = estrutura.nome;

        if (turma.turnos && turma.turnos.length > 0) {
            const order = { 'Manhã': 1, 'Tarde': 2, 'Noite': 3 };
            const iconMap = { 'Manhã': '☀️', 'Tarde': '🌤️', 'Noite': '🌙' };
            const sortedTurnos = [...turma.turnos].sort((a, b) => (order[a] || 4) - (order[b] || 4));
            
            displayIcons = sortedTurnos.map(turno => iconMap[turno]).join(' ');
            displayText = sortedTurnos.join(' / ');
        } else {
            // Fallback pelo horário
            const h = parseInt(estrutura.inicio.split(':')[0]);
            if (h < 12) displayIcons = '☀️';
            else if (h < 18) displayIcons = '🌤️';
            else displayIcons = '🌙';
        }

        const anoHtml = turma.anoLetivo ? `<span style="font-size:0.8rem; background:#eff6ff; color:var(--brand); padding:4px 8px; border-radius:6px; border:1px solid #bfdbfe;">${turma.anoLetivo}</span>` : '';
        
        header.innerHTML = `
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
        `;
        turmaWrapper.appendChild(header);

        // --- Tabela ---
        const table = document.createElement('table');
        table.className = 'escala-final-table'; 
        table.style.width = '100%';
        
        const thead = document.createElement('thead');
        
        // Filtra dias ativos na estrutura
        const diasAtivos = DIAS_SEMANA.filter(dia => {
            const diaConfig = estrutura.dias[dia.id];
            return diaConfig && diaConfig.blocos && diaConfig.blocos.length > 0;
        });
        
        let headHTML = `<tr><th style="width: 90px; background: var(--bg); text-align:center;">Horário</th>`;
        diasAtivos.forEach(dia => {
            headHTML += `<th>${dia.nome}</th>`;
        });
        headHTML += `</tr>`;
        thead.innerHTML = headHTML;
        table.appendChild(thead);

        const tbody = document.createElement('tbody');
        
        // Define blocos de referência (usando segunda-feira ou o primeiro dia disponível)
        const diaRef = estrutura.dias['seg'] ? 'seg' : Object.keys(estrutura.dias)[0];
        const blocosRef = estrutura.dias[diaRef].blocos || [];

        if (blocosRef.length === 0) {
            tbody.innerHTML = `<tr><td colspan="${diasAtivos.length + 1}" class="muted center" style="padding: 20px;">Estrutura de horários não definida.</td></tr>`;
        } else {
            blocosRef.forEach((blocoRef, index) => {
                const tr = document.createElement('tr');
                
                // Coluna de Horário
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
                    
                    const blocoDia = estrutura.dias[dia.id] && estrutura.dias[dia.id].blocos[index];
                    
                    if (!blocoDia) {
                        // Dia sem aula neste horário (ex: sábado tem menos aulas)
                        td.className = 'matrix-cell-void';
                        td.style.backgroundColor = '#f1f5f9';
                        tr.appendChild(td);
                        return;
                    }

                    // === LÓGICA DE EXIBIÇÃO ===
                    
                    if (blocoDia.type === 'aula') {
                        // Tenta achar slot alocado
                        const slot = horario.slots.find(s => 
                            s.turmaId === turmaId && 
                            s.diaId === dia.id && 
                            s.blocoIndex === index // Comparação numérica
                        );

                        td.className = 'editable-cell'; 
                        td.dataset.turmaId = turmaId;
                        td.dataset.diaId = dia.id;
                        td.dataset.blocoIndex = index;
                        if(slot) td.dataset.slotId = slot.id;

                        if (slot && slot.materiaId && slot.professorId) {
                            // [CENÁRIO 1] Aula Alocada (Sistema ou Manual)
                            const materia = getMateria(slot.materiaId);
                            const prof = getProfessor(slot.professorId);
                            const cor = materia ? materia.cor : '#e2e8f0';
                            const textColor = getContrastingTextColor(cor);

                            td.style.backgroundColor = cor;
                            td.style.color = textColor;
                            td.innerHTML = `
                                <div style="display:flex; flex-direction:column; justify-content:center; align-items:center; height:100%;">
                                    <div style="font-weight: 800; font-size: 0.95rem; text-transform: uppercase; margin-bottom:2px;">${materia ? materia.sigla : '???'}</div>
                                    <div style="font-size: 0.75rem; opacity: 0.9; font-weight:500;">${prof ? prof.nome.split(' ')[0] : '???'}</div>
                                </div>
                            `;
                            td.title = `${materia?.nome} com ${prof?.nome}`;

                        } else {
                            // [CENÁRIO 2] Horário Vago (Disponível para edição)
                            td.classList.add('empty-slot');
                            td.style.backgroundColor = '#ffffff';
                            td.style.cursor = 'pointer';
                            td.style.color = '#cbd5e1';
                            td.innerHTML = `<div style="display:flex; align-items:center; justify-content:center; height:100%;"><span style="font-size: 1.5rem; font-weight: 300;">+</span></div>`;
                        }

                    } else {
                        // [CENÁRIO 3] Intervalo / Almoço / Espaço
                        // CORREÇÃO: Fundo listrado + Texto visível
                        let label = blocoDia.label || 'Intervalo';
                        
                        // Estilo Listrado (Hachurado)
                        td.style.backgroundImage = 'repeating-linear-gradient(45deg, #f3f4f6, #f3f4f6 10px, #e5e7eb 10px, #e5e7eb 20px)';
                        td.style.backgroundColor = '#f9fafb';
                        td.style.cursor = 'not-allowed';
                        td.style.border = '1px solid var(--border)';
                        
                        td.innerHTML = `
                            <div style="display:flex; align-items:center; justify-content:center; height:100%; color:var(--muted); font-weight:600; font-size:0.75rem; text-transform:uppercase; letter-spacing:1px; opacity:0.8;">
                                ${label}
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

// Funções auxiliares
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