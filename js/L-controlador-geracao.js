/**************************************
 * 📅 Controlador da Geração de Horários
 * (Ponte entre UI e Web Worker)
 **************************************/

let geradorWorker = null;

async function gerarHorario() {
    if (geradorWorker) {
        geradorWorker.terminate();
    }

    // Inicializa o Worker (processamento em segundo plano)
    geradorWorker = new Worker('js/M-motor-geracao-horario.js');
    
    // Configura o botão de cancelar
    const cancelBtn = document.getElementById("loader-cancel-btn");
    if (cancelBtn) {
        cancelBtn.onclick = () => {
            if (geradorWorker) {
                geradorWorker.postMessage({ type: 'cancel' });
                geradorWorker.terminate();
                geradorWorker = null;
                hideLoader();
                showToast("Geração de horário cancelada.", "info");
            }
        };
    }

    showLoader("Inicializando motor de geração...");

    // Coleta os dados atuais do estado global
    const { turmas, professores, materias, estruturas } = store.getState();
    
    // Prepara o pacote de dados para o Worker
    // Clona o horarioState para evitar mutações acidentais durante o processo
    const dataForWorker = {
        horarioState: JSON.parse(JSON.stringify(horarioState)),
        turmas,
        professores,
        materias,
        estruturas
    };

    // Define os callbacks de resposta do Worker
    geradorWorker.onmessage = function(e) {
        const { type, message, horario } = e.data;

        if (type === 'progress') {
            // Atualiza a mensagem de carregamento na tela
            showLoader(message);
        } 
        else if (type === 'done') {
            // Sucesso! Recebe o objeto horario finalizado
            currentHorario = horario;
            currentHorario.owner = 'gerador';
            
            showLoader("Renderizando grade...");
            
            // Pequeno delay para a UI atualizar antes da renderização pesada
            setTimeout(() => {
                // 1. Troca a Tela (Esconde Wizard -> Mostra Grade)
                const wizardContainer = document.getElementById("gerador-wizard-container");
                const escalaView = document.getElementById("gerador-escalaView");

                if (wizardContainer) wizardContainer.classList.add('hidden');
                if (escalaView) escalaView.classList.remove('hidden');

                // 2. Renderiza a Tabela Visual
                if (typeof renderHorarioTable === 'function') {
                    renderHorarioTable(currentHorario);
                }
                
                // 3. Inicializa o Editor Manual (Toolbox)
                if (typeof initEditor === 'function') {
                    initEditor();
                }
                
                hideLoader();
                showToast("Horário gerado com sucesso!", "success");
            }, 50);

            // Limpa o worker pois o trabalho acabou
            geradorWorker.terminate();
            geradorWorker = null;

        } 
        else if (type === 'error') {
            // Erro fatal no algoritmo
            console.error("Erro no Worker:", message);
            showToast(`Erro na geração: ${message}`, 'error');
            hideLoader();
            geradorWorker.terminate();
            geradorWorker = null;
        }
    };

    // Tratamento de erros de script no Worker
    geradorWorker.onerror = function(error) {
        console.error("Erro fatal no Web Worker:", error);
        showToast("Ocorreu um erro técnico inesperado no processo.", 'error');
        hideLoader();
        if(geradorWorker) {
            geradorWorker.terminate();
            geradorWorker = null;
        }
    };

    // Envia o sinal para começar
    geradorWorker.postMessage(dataForWorker);
}

// Função auxiliar para salvar o horário gerado no histórico
async function salvarHorarioAtual() {
    if (currentHorario) {
        currentHorario.lastModified = new Date().toISOString();

        // Cria snapshots (cópias estáticas) dos dados usados
        const { professores, materias, turmas, estruturas } = store.getState();
        
        currentHorario.snapshot = {
            professores: {},
            materias: {},
            turmas: {},
            estruturas: {}
        };

        // Identifica IDs usados na grade para snapshot otimizado
        const profsIds = new Set();
        const turmasIds = new Set();
        const materiasIds = new Set();
        const estruturasIds = new Set();

        currentHorario.slots.forEach(slot => {
            if(slot.turmaId) turmasIds.add(slot.turmaId);
            if(slot.professorId) profsIds.add(slot.professorId);
            if(slot.materiaId) materiasIds.add(slot.materiaId);
        });

        // Adiciona dados ao snapshot
        turmasIds.forEach(id => {
            const t = turmas.find(x => x.id === id);
            if(t) {
                currentHorario.snapshot.turmas[id] = { nome: t.nome, estruturaId: t.estruturaId, anoLetivo: t.anoLetivo, turnos: t.turnos };
                estruturasIds.add(t.estruturaId);
            }
        });

        estruturasIds.forEach(id => {
            const e = estruturas.find(x => x.id === id);
            if(e) currentHorario.snapshot.estruturas[id] = { nome: e.nome, inicio: e.inicio, fim: e.fim };
        });

        profsIds.forEach(id => {
            const p = professores.find(x => x.id === id);
            if(p) currentHorario.snapshot.professores[id] = { nome: p.nome };
        });

        materiasIds.forEach(id => {
            const m = materias.find(x => x.id === id);
            if(m) currentHorario.snapshot.materias[id] = { nome: m.nome, sigla: m.sigla, cor: m.cor };
        });

        // Salva no store
        store.dispatch('SAVE_HORARIO', currentHorario);
        showToast("Grade horária salva com sucesso!", "success");
        
        // Redireciona para a lista
        go('horarios-salvos');
    }
}