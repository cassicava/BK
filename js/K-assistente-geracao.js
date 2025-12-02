let horarioState = {
    turmasIds: [],
    professoresIds: [],
    matrizCurricular: {},
    preferencias: {
        geminarAulas: true,
        evitarJanelas: true,
        maxAulasDiarias: 2
    }
};

let wizardManager = null;

function setGeradorFormDirty(isDirty) {
    dirtyForms['gerar-horario'] = isDirty;
}

function resetGeradorWizard() {
    horarioState = {
        turmasIds: [],
        professoresIds: [],
        matrizCurricular: {}, 
        preferencias: {
            geminarAulas: true,
            evitarJanelas: true,
            maxAulasDiarias: 2
        }
    };
    
    const wizardContainer = document.getElementById("gerador-wizard-container");
    if (wizardContainer) wizardContainer.classList.remove('hidden');
    
    const escalaView = document.getElementById("gerador-escalaView");
    if (escalaView) escalaView.classList.add('hidden');

    document.getElementById("gerador-step1-container").innerHTML = '';
    document.getElementById("gerador-step2-container").innerHTML = '';
    document.getElementById("gerador-step3-container").innerHTML = '';

    const toolbox = document.getElementById("editor-toolbox");
    if (toolbox) toolbox.classList.add("hidden");

    if (wizardManager) {
        wizardManager.goToStep(1);
        wizardManager.updateButtonState(); 
    }
    
    const nextBtn = document.getElementById("btn-gerador-next");
    if (nextBtn) nextBtn.classList.remove('pulsing-button');

    setGeradorFormDirty(false);
}

function initGeradorPage(options = {}) {
    if (options.isEditing && options.horarioParaEditar) {
        const wizardContainer = document.getElementById("gerador-wizard-container");
        if(wizardContainer) wizardContainer.classList.add('hidden');
        
        const escalaView = document.getElementById("gerador-escalaView");
        if(escalaView) escalaView.classList.remove('hidden');

        currentHorario = options.horarioParaEditar;
        currentHorario.owner = 'gerador';

        renderHorarioTable(currentHorario);
    } else {
        resetGeradorWizard();
    }
}

function createWizardManager() {
    const container = document.getElementById("gerador-wizard-container");
    if (!container) return { goToStep: () => {}, updateButtonState: () => {} };

    const tabs = Array.from(container.querySelectorAll("#gerador-wizard-tabs .painel-tab-btn"));
    const contents = Array.from(container.querySelectorAll("#gerador-wizard-content .painel-tab-content"));
    const nextBtn = container.querySelector("#btn-gerador-next");
    let currentStep = 1;

    if (tabs[2]) tabs[2].innerHTML = '3. Preferências';

    function updateButtonState() {
        if (!nextBtn) return;
        let isDisabled = true;

        const turmasLen = (horarioState.turmasIds || []).length;
        const profsLen = (horarioState.professoresIds || []).length;

        if (currentStep === 1) {
            isDisabled = turmasLen === 0 || profsLen === 0;
        } else if (currentStep === 2) {
            let totalAulas = 0;
            if (horarioState.matrizCurricular) {
                Object.values(horarioState.matrizCurricular).forEach(turmaData => {
                    Object.values(turmaData).forEach(matData => totalAulas += matData.qtd);
                });
            }
            isDisabled = totalAulas === 0; 
        } else {
            // CORREÇÃO: Passo 3 (Preferências) não tem validação bloqueante, libera o botão
            isDisabled = false;
        }

        nextBtn.disabled = isDisabled;
        nextBtn.classList.toggle('pulsing-button', !isDisabled);
        
        if (currentStep === 3) {
            nextBtn.innerHTML = '✨ Gerar Horário';
            parseEmojisInElement(nextBtn);
        } else {
            nextBtn.innerHTML = 'Próximo Passo &gt;';
        }
    }

    function goToStep(stepNumber) {
        if (stepNumber > currentStep) {
            if (currentStep === 1) saveStep1Data();
            // Passo 2 salva em tempo real
        }

        currentStep = stepNumber;
        
        tabs.forEach(tab => {
            const step = parseInt(tab.dataset.step, 10);
            tab.classList.remove('active', 'completed');
            
            if (step === currentStep) {
                tab.classList.add('active');
                tab.disabled = false;
            } else if (step < currentStep) {
                tab.classList.add('completed');
                tab.disabled = false;
            } else {
                tab.disabled = true;
            }
        });

        contents.forEach(content => {
            content.classList.toggle('active', content.dataset.tabContent == currentStep);
        });

        if (currentStep === 1) renderStep1();
        if (currentStep === 2) renderStep2();
        if (currentStep === 3) renderStep3();

        updateButtonState();
    }

    if (nextBtn) {
        nextBtn.onclick = (event) => {
            if (currentStep === 3) {
                handleStartGeneration();
            } else {
                goToStep(currentStep + 1);
            }
        };
    }
    
    tabs.forEach(tab => {
        tab.onclick = () => {
            if (!tab.disabled) {
                goToStep(parseInt(tab.dataset.step, 10));
            }
        };
    });
    
    goToStep(1);

    return { goToStep, updateButtonState };
}

// ================= PASSO 1: ESCOPO =================

function renderStep1() {
    const container = document.getElementById("gerador-step1-container");
    if (!container) return;

    const { turmas, professores, estruturas } = store.getState();
    const turmasAtivas = turmas; 
    const profsAtivos = professores.filter(p => p.status === 'ativo');

    turmasAtivas.sort((a, b) => {
        const anoA = a.anoLetivo || 0;
        const anoB = b.anoLetivo || 0;
        if (anoA !== anoB) return anoB - anoA; 
        return a.nome.localeCompare(b.nome);
    });

    profsAtivos.sort((a, b) => a.nome.localeCompare(b.nome));

    container.innerHTML = `
        <div class="grid-2-col" style="align-items: start; gap: 24px;">
            
            <div class="fieldset-wrapper" style="border: 1px solid var(--border); border-radius: 12px; padding: 16px; background: var(--bg);">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; padding-bottom: 8px; border-bottom: 1px solid var(--border);">
                    <legend style="margin: 0; font-weight: bold;">🏫 Turmas</legend>
                    <label class="check-inline" style="font-size: 0.85rem; padding: 4px 8px;">
                        <input type="checkbox" id="check-all-turmas"> Selecionar Todas
                    </label>
                </div>
                
                <div class="selection-grid" id="grid-turmas" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 12px; max-height: 400px; overflow-y: auto; padding: 12px;">
                    ${turmasAtivas.length ? turmasAtivas.map(t => createTurmaCard(t, estruturas)).join('') : '<p class="muted">Nenhuma turma encontrada.</p>'}
                </div>
            </div>

            <div class="fieldset-wrapper" style="border: 1px solid var(--border); border-radius: 12px; padding: 16px; background: var(--bg);">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; padding-bottom: 8px; border-bottom: 1px solid var(--border);">
                    <legend style="margin: 0; font-weight: bold;">👨‍🏫 Professores</legend>
                    <label class="check-inline" style="font-size: 0.85rem; padding: 4px 8px;">
                        <input type="checkbox" id="check-all-profs"> Selecionar Todos
                    </label>
                </div>

                <div class="selection-grid" id="grid-profs" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 12px; max-height: 400px; overflow-y: auto; padding: 12px;">
                    ${profsAtivos.length ? profsAtivos.map(p => createProfCard(p)).join('') : '<p class="muted">Nenhum professor ativo.</p>'}
                </div>
            </div>
        </div>
    `;

    attachSelectionListeners('grid-turmas', 'turma-card', horarioState.turmasIds);
    attachSelectionListeners('grid-profs', 'prof-card', horarioState.professoresIds);

    setupSelectAll('check-all-turmas', 'grid-turmas', horarioState.turmasIds);
    setupSelectAll('check-all-profs', 'grid-profs', horarioState.professoresIds);
    
    updateSelectAllState('check-all-turmas', 'grid-turmas');
    updateSelectAllState('check-all-profs', 'grid-profs');
}

function createTurmaCard(t, estruturas) {
    const isSelected = horarioState.turmasIds.includes(t.id);
    const estrutura = estruturas.find(e => e.id === t.estruturaId);
    
    let displayIcons = '☀️';
    let displayText = estrutura ? estrutura.nome : 'Sem Estrutura';

    if (t.turnos && t.turnos.length > 0) {
        const order = { 'Manhã': 1, 'Tarde': 2, 'Noite': 3 };
        const iconMap = { 'Manhã': '☀️', 'Tarde': '🌤️', 'Noite': '🌙' };
        
        const sortedTurnos = [...t.turnos].sort((a, b) => (order[a] || 4) - (order[b] || 4));
        
        displayIcons = sortedTurnos.map(turno => iconMap[turno]).join(' ');
        displayText = sortedTurnos.join(' / ');
    } else if (estrutura) {
        const h = parseInt(estrutura.inicio.split(':')[0]);
        if (h < 12) displayIcons = '☀️';
        else if (h < 18) displayIcons = '🌤️';
        else displayIcons = '🌙';
    }

    const badgeAno = t.anoLetivo ? `<span style="font-size:0.75rem; background:#e0f2fe; color:#0284c7; padding:2px 6px; border-radius:4px; border:1px solid #bae6fd;">${t.anoLetivo}</span>` : '';

    return `
        <div class="selection-card turma-card ${isSelected ? 'selected' : ''}" data-id="${t.id}" 
             style="border: 1px solid var(--border); border-radius: 8px; padding: 10px; background: white; cursor: pointer; transition: all 0.2s; position: relative; ${isSelected ? 'border-color: var(--brand); box-shadow: 0 0 0 1px var(--brand); background-color: #eff6ff;' : ''}">
            
            <div class="check-badge" style="display: ${isSelected ? 'flex' : 'none'}; position: absolute; top: -6px; right: -6px; background: var(--brand); color: white; border-radius: 50%; width: 20px; height: 20px; align-items: center; justify-content: center; font-size: 10px; font-weight: bold; box-shadow: 0 2px 4px rgba(0,0,0,0.15); z-index: 20;">✓</div>
            
            <div style="display: flex; justify-content: space-between; align-items: center; width: 100%;">
                
                <div style="display: flex; flex-direction: column; align-items: flex-start; gap: 4px;">
                    <div style="font-weight: 700; color: var(--fg); font-size: 0.95rem;">${t.nome}</div>
                    ${badgeAno}
                </div>

                <div style="display: flex; flex-direction: column; align-items: flex-end; gap: 2px;">
                    <span style="font-size: 1.2rem; letter-spacing: 2px;">${displayIcons}</span>
                    <span style="font-size: 0.75rem; color: var(--muted); text-align: right;">${displayText}</span>
                </div>

            </div>
        </div>
    `;
}

function createProfCard(p) {
    const isSelected = horarioState.professoresIds.includes(p.id);
    const materiasCount = p.materiasIds ? p.materiasIds.length : 0;

    return `
        <div class="selection-card prof-card ${isSelected ? 'selected' : ''}" data-id="${p.id}"
             style="border: 1px solid var(--border); border-radius: 8px; padding: 10px; background: white; cursor: pointer; transition: all 0.2s; position: relative; ${isSelected ? 'border-color: var(--brand); box-shadow: 0 0 0 1px var(--brand); background-color: #eff6ff;' : ''}">
            
            <div class="check-badge" style="display: ${isSelected ? 'flex' : 'none'}; position: absolute; top: -6px; right: -6px; background: var(--brand); color: white; border-radius: 50%; width: 20px; height: 20px; align-items: center; justify-content: center; font-size: 10px; font-weight: bold; box-shadow: 0 2px 4px rgba(0,0,0,0.15); z-index: 20;">✓</div>

            <div style="font-weight: 600; color: var(--fg); font-size: 0.9rem;">${p.nome}</div>
            <div style="font-size: 0.8rem; color: var(--muted); margin-top: 4px;">📚 ${materiasCount} matérias</div>
        </div>
    `;
}

function attachSelectionListeners(gridId, cardClass, stateArray) {
    document.getElementById(gridId).querySelectorAll(`.${cardClass}`).forEach(card => {
        card.addEventListener('click', () => {
            const id = card.dataset.id;
            const idx = stateArray.indexOf(id);
            const badge = card.querySelector('.check-badge');

            if (idx > -1) {
                stateArray.splice(idx, 1);
                card.classList.remove('selected');
                card.style.borderColor = 'var(--border)';
                card.style.backgroundColor = 'white';
                card.style.boxShadow = 'none';
                if(badge) badge.style.display = 'none';
            } else {
                stateArray.push(id);
                card.classList.add('selected');
                card.style.borderColor = 'var(--brand)';
                card.style.backgroundColor = '#eff6ff';
                card.style.boxShadow = '0 0 0 1px var(--brand)';
                if(badge) {
                    badge.style.display = 'flex';
                    badge.style.animation = 'pop-in 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275)';
                }
            }
            
            const checkId = gridId === 'grid-turmas' ? 'check-all-turmas' : 'check-all-profs';
            updateSelectAllState(checkId, gridId);
            
            wizardManager.updateButtonState();
        });
    });
}

function setupSelectAll(checkId, gridId, stateArray) {
    const checkbox = document.getElementById(checkId);
    checkbox.addEventListener('change', (e) => {
        const isChecked = e.target.checked;
        const cards = document.getElementById(gridId).querySelectorAll('.selection-card');
        
        stateArray.length = 0;

        cards.forEach(card => {
            const badge = card.querySelector('.check-badge');
            if (isChecked) {
                stateArray.push(card.dataset.id);
                card.classList.add('selected');
                card.style.borderColor = 'var(--brand)';
                card.style.backgroundColor = '#eff6ff';
                card.style.boxShadow = '0 0 0 1px var(--brand)';
                if(badge) badge.style.display = 'flex';
            } else {
                card.classList.remove('selected');
                card.style.borderColor = 'var(--border)';
                card.style.backgroundColor = 'white';
                card.style.boxShadow = 'none';
                if(badge) badge.style.display = 'none';
            }
        });
        wizardManager.updateButtonState();
    });
}

function updateSelectAllState(checkId, gridId) {
    const checkbox = document.getElementById(checkId);
    const cards = document.getElementById(gridId).querySelectorAll('.selection-card');
    const selected = document.getElementById(gridId).querySelectorAll('.selection-card.selected');
    
    if (checkbox) {
        checkbox.checked = cards.length > 0 && cards.length === selected.length;
        checkbox.indeterminate = selected.length > 0 && selected.length < cards.length;
    }
}

function saveStep1Data() {
}

// ================= PASSO 2: MATRIZ CURRICULAR =================

function renderStep2() {
    const container = document.getElementById("gerador-step2-container");
    const { turmas, materias, estruturas, professores } = store.getState();
    const turmasSelecionadas = turmas.filter(t => horarioState.turmasIds.includes(t.id));
    const materiasAtivas = materias.filter(m => m.status === 'ativo').sort((a,b) => a.nome.localeCompare(b.nome));
    
    const profsDisponiveis = professores.filter(p => horarioState.professoresIds.includes(p.id));

    if (turmasSelecionadas.length === 0) {
        container.innerHTML = '<p class="muted">Nenhuma turma selecionada.</p>';
        return;
    }

    let html = `<div style="display: flex; flex-direction: column; gap: 32px;">`;

    turmasSelecionadas.forEach(turma => {
        const estrutura = estruturas.find(e => e.id === turma.estruturaId);
        
        if (!horarioState.matrizCurricular[turma.id]) {
            horarioState.matrizCurricular[turma.id] = {};
        }

        html += `
            <fieldset class="fieldset-wrapper fieldset-matriz" data-turma-id="${turma.id}" style="border: 2px solid var(--border);">
                <legend style="font-size: 1.1rem; color: var(--fg);">
                    ${turma.nome} 
                    <span class="muted" style="font-weight: normal; font-size: 0.9rem;">(Estrutura: ${estrutura ? estrutura.nome : 'N/D'})</span>
                </legend>
                
                <div class="matriz-grid" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 16px;">
                    ${materiasAtivas.map(m => {
                        const dadosAtuais = horarioState.matrizCurricular[turma.id][m.id] || { qtd: 0, profId: 'auto' };
                        const qtd = dadosAtuais.qtd;
                        const profId = dadosAtuais.profId;

                        const profsDaMateria = profsDisponiveis.filter(p => p.materiasIds.includes(m.id));
                        
                        const isSelectLocked = profsDaMateria.length < 2;
                        
                        let optionsHtml = `<option value="auto">🎲 Automático</option>`;
                        profsDaMateria.forEach(p => {
                            optionsHtml += `<option value="${p.id}" ${profId === p.id ? 'selected' : ''}>👤 ${p.nome.split(' ')[0]}</option>`;
                        });

                        return `
                        <div class="materia-card-control" data-materia-id="${m.id}" style="background: white; border: 1px solid var(--border); border-radius: 12px; padding: 12px; display: flex; flex-direction: column; gap: 8px; border-left: 4px solid ${m.cor}; transition: all 0.2s;">
                            
                            <div style="display: flex; align-items: center; justify-content: space-between;">
                                <strong style="font-size: 0.9rem;">${m.nome}</strong>
                                <span style="font-size: 1.2rem;">${m.emoji}</span>
                            </div>

                            <div class="stepper-wrapper" style="display: flex; align-items: center; justify-content: space-between; background: var(--bg); border-radius: 8px; padding: 4px;">
                                <button type="button" class="btn-stepper minus" style="width: 32px; height: 32px; border: none; background: transparent; cursor: pointer; font-size: 1.1rem; color: var(--danger);">➖</button>
                                <span class="stepper-value" style="font-weight: bold; font-size: 1.1rem; min-width: 24px; text-align: center;">${qtd}</span>
                                <button type="button" class="btn-stepper plus" style="width: 32px; height: 32px; border: none; background: transparent; cursor: pointer; font-size: 1.1rem; color: var(--brand);">➕</button>
                            </div>

                            <select class="prof-select" ${isSelectLocked ? 'disabled' : ''} style="font-size: 0.85rem; padding: 6px; border-radius: 6px; background-color: ${isSelectLocked ? '#e2e8f0' : '#f8fafc'}; border: 1px solid var(--border); cursor: ${isSelectLocked ? 'not-allowed' : 'pointer'}; opacity: ${isSelectLocked ? '0.7' : '1'};">
                                ${optionsHtml}
                            </select>

                        </div>
                        `;
                    }).join('')}
                </div>
                <div class="total-aulas-counter" style="margin-top: 16px; text-align: right; font-weight: bold; color: var(--muted); border-top: 1px solid var(--border); padding-top: 8px;">
                    Total: <span class="contador">0</span> aulas
                </div>
            </fieldset>
        `;
    });

    html += `</div>`;
    container.innerHTML = html;

    container.querySelectorAll('.fieldset-matriz').forEach(fieldset => {
        const turmaId = fieldset.dataset.turmaId;
        const cards = fieldset.querySelectorAll('.materia-card-control');
        const counterSpan = fieldset.querySelector('.contador');

        const updateStateAndTotal = () => {
            let total = 0;
            
            cards.forEach(card => {
                const materiaId = card.dataset.materiaId;
                const valueSpan = card.querySelector('.stepper-value');
                const val = parseInt(valueSpan.textContent);
                const profSelect = card.querySelector('.prof-select');
                
                total += val;
                
                if (!horarioState.matrizCurricular[turmaId]) horarioState.matrizCurricular[turmaId] = {};
                
                if (val > 0) {
                    horarioState.matrizCurricular[turmaId][materiaId] = { 
                        qtd: val, 
                        profId: profSelect.value 
                    };
                    card.style.opacity = '1';
                    card.style.filter = 'none';
                } else {
                    delete horarioState.matrizCurricular[turmaId][materiaId];
                    card.style.opacity = '0.6';
                    card.style.filter = 'grayscale(1)';
                }
            });
            
            counterSpan.textContent = total;
            wizardManager.updateButtonState();
        };

        cards.forEach(card => {
            const minusBtn = card.querySelector('.minus');
            const plusBtn = card.querySelector('.plus');
            const valueSpan = card.querySelector('.stepper-value');
            const profSelect = card.querySelector('.prof-select');
            
            minusBtn.onclick = () => {
                let v = parseInt(valueSpan.textContent);
                if (v > 0) {
                    valueSpan.textContent = v - 1;
                    updateStateAndTotal();
                }
            };
            
            plusBtn.onclick = () => {
                let v = parseInt(valueSpan.textContent);
                if (v < 15) {
                    valueSpan.textContent = v + 1;
                    updateStateAndTotal();
                }
            };

            profSelect.onchange = () => {
                updateStateAndTotal();
            };
        });

        updateStateAndTotal();
    });
}

function saveStep2Data() {
}

// ================= PASSO 3: PREFERÊNCIAS E CONFIRMAÇÃO =================

function renderStep3() {
    const container = document.getElementById("gerador-step3-container");
    const { turmas } = store.getState();
    
    let totalAulasGlobal = 0;
    let turmasCount = 0;
    
    Object.entries(horarioState.matrizCurricular).forEach(([tId, mats]) => {
        let tAulas = 0;
        Object.values(mats).forEach(d => tAulas += d.qtd);
        if (tAulas > 0) {
            turmasCount++;
            totalAulasGlobal += tAulas;
        }
    });

    let html = `
        <div style="max-width: 600px; margin: 0 auto;">
            <h3 style="text-align: center; margin-bottom: 24px;">Configurações de Geração</h3>
            
            <div class="card" style="background: white; border: 1px solid var(--border); padding: 24px; border-radius: 16px;">
                <h4 style="margin-top: 0; color: var(--brand);">🧠 Preferências do Algoritmo</h4>
                
                <div style="display: flex; flex-direction: column; gap: 16px; margin-top: 16px;">
                    
                    <div style="display: flex; justify-content: space-between; align-items: center;">
                        <div>
                            <strong style="display: block;">Aulas Geminadas</strong>
                            <span class="muted" style="font-size: 0.85rem;">Tentar juntar 2 ou mais aulas da mesma matéria no mesmo dia.</span>
                        </div>
                        <label class="toggle-switch">
                            <input type="checkbox" id="pref-geminar" checked>
                            <span class="slider round"></span>
                        </label>
                    </div>

                    <div style="height: 1px; background: var(--border);"></div>

                    <div style="display: flex; justify-content: space-between; align-items: center;">
                        <div>
                            <strong style="display: block;">Distribuição Uniforme</strong>
                            <span class="muted" style="font-size: 0.85rem;">Evitar aulas da mesma matéria em dias consecutivos.</span>
                        </div>
                        <label class="toggle-switch">
                            <input type="checkbox" id="pref-distribuir" checked>
                            <span class="slider round"></span>
                        </label>
                    </div>

                     <div style="height: 1px; background: var(--border);"></div>

                    <div style="display: flex; justify-content: space-between; align-items: center;">
                        <div>
                            <strong style="display: block;">Evitar Janelas</strong>
                            <span class="muted" style="font-size: 0.85rem;">Tentar não deixar horários vagos entre aulas.</span>
                        </div>
                        <label class="toggle-switch">
                            <input type="checkbox" id="pref-janelas" checked>
                            <span class="slider round"></span>
                        </label>
                    </div>

                </div>
            </div>

            <div style="margin-top: 32px; text-align: center;">
                <p style="font-size: 1.1rem;">
                    Pronto para gerar a grade para <strong>${turmasCount} turmas</strong> 
                    <br><span class="muted" style="font-size: 0.9rem;">(Total de ${totalAulasGlobal} aulas a alocar)</span>
                </p>
                <p class="muted" style="font-size: 0.85rem;">
                    O sistema utilizará <strong>${horarioState.professoresIds.length} professores</strong> selecionados.
                </p>
            </div>
        </div>
        
        <style>
            .toggle-switch { position: relative; display: inline-block; width: 50px; height: 26px; }
            .toggle-switch input { opacity: 0; width: 0; height: 0; }
            .slider { position: absolute; cursor: pointer; top: 0; left: 0; right: 0; bottom: 0; background-color: #ccc; transition: .4s; border-radius: 34px; }
            .slider:before { position: absolute; content: ""; height: 20px; width: 20px; left: 3px; bottom: 3px; background-color: white; transition: .4s; border-radius: 50%; }
            input:checked + .slider { background-color: var(--brand); }
            input:checked + .slider:before { transform: translateX(24px); }
        </style>
    `;

    container.innerHTML = html;

    const updatePrefs = () => {
        horarioState.preferencias = {
            geminarAulas: document.getElementById('pref-geminar').checked,
            distribuicaoUniforme: document.getElementById('pref-distribuir').checked,
            evitarJanelas: document.getElementById('pref-janelas').checked
        };
    };

    container.querySelectorAll('input').forEach(i => i.addEventListener('change', updatePrefs));
    updatePrefs();
}

function handleStartGeneration() {
    gerarHorario();
}

function setupGeradorPage() {
    wizardManager = createWizardManager();
    
    const btnSalvar = document.getElementById("btnSalvarEscalaGerador");
    if (btnSalvar) {
        btnSalvar.addEventListener('click', async (event) => {
            await salvarHorarioAtual();
            playConfettiAnimation(event.target);
            setGeradorFormDirty(false);
        });
    }
    const btnDescartar = document.getElementById("btnExcluirEscalaGerador");
    if(btnDescartar){
        btnDescartar.addEventListener('click', async () => {
            const { confirmed } = await showConfirm({
                title: "Descartar Grade?",
                message: "Você tem certeza que deseja descartar esta grade gerada? Todo o progresso não salvo será perdido."
            });
            if (confirmed) {
                resetGeradorWizard();
                go('home');
            }
        });
    }
    
    const editBtn = document.getElementById('gerador-escala-edit-title-btn');
    const titleText = document.getElementById('gerador-escalaViewTitle');
    const titleInput = document.getElementById('gerador-escalaViewTitleInput');
    
    if (editBtn && titleText && titleInput) {
        editBtn.addEventListener('click', () => {
            const isEditing = document.getElementById('gerador-escala-title-container').classList.toggle('is-editing');
            if (isEditing) {
                titleInput.value = currentHorario.nome;
                titleInput.focus();
                editBtn.innerHTML = '✔️';
            } else {
                currentHorario.nome = titleInput.value;
                titleText.textContent = currentHorario.nome;
                editBtn.innerHTML = '✏️';
                setGeradorFormDirty(true);
            }
            parseEmojisInElement(editBtn);
        });
    }
}

document.addEventListener("DOMContentLoaded", setupGeradorPage);