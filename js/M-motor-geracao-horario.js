importScripts('E-constantes.js', 'D-utilitarios-compartilhados.js');

self.onmessage = function(e) {
    if (e.data.type === 'cancel') {
        self.close();
        return;
    }

    const { horarioState, turmas, professores, materias, estruturas } = e.data;
    const { preferencias } = horarioState;

    try {
        postMessage({ type: 'progress', message: 'Iniciando motor de alocação...' });

        // 1. Prepara os dados auxiliares
        const turmasMap = new Map(turmas.map(t => [t.id, t]));
        const estruturasMap = new Map(estruturas.map(e => [e.id, e]));
        const professoresMap = new Map(professores.map(p => [p.id, p]));
        
        // 2. Constrói o "Esqueleto" da Grade
        postMessage({ type: 'progress', message: 'Construindo estrutura temporal...' });
        
        const grade = {
            id: uid(), // Usa a função do D-utilitarios-compartilhados.js
            nome: `Grade Gerada ${new Date().toLocaleDateString()}`,
            slots: [], 
            aulasNaoAlocadas: []
        };

        const ocupacaoProfessores = new Set();
        const diasUteis = ['seg', 'ter', 'qua', 'qui', 'sex'];

        // Cria slots para cada turma
        horarioState.turmasIds.forEach(turmaId => {
            const turma = turmasMap.get(turmaId);
            const estrutura = estruturasMap.get(turma.estruturaId);
            
            if (!estrutura) return;

            let numBlocos = 0;
            
            // Tenta usar a definição exata de blocos da estrutura
            const diaRef = estrutura.dias && estrutura.dias['seg'] ? 'seg' : Object.keys(estrutura.dias)[0];
            if (estrutura.dias && estrutura.dias[diaRef] && estrutura.dias[diaRef].blocos) {
                numBlocos = estrutura.dias[diaRef].blocos.filter(b => b.type === 'aula').length;
            } else {
                // Fallback
                const startMinutes = parseTimeToMinutes(estrutura.inicio);
                const endMinutes = parseTimeToMinutes(estrutura.fim);
                numBlocos = Math.floor((endMinutes - startMinutes) / 50);
            }

            diasUteis.forEach(diaId => {
                for (let b = 0; b < numBlocos; b++) {
                    grade.slots.push({
                        id: uid(),
                        turmaId: turma.id,
                        diaId: diaId,
                        blocoIndex: b,
                        materiaId: null,
                        professorId: null,
                        fixo: false
                    });
                }
            });
        });

        // 3. Cria as "Cartas" de Aulas
        postMessage({ type: 'progress', message: 'Processando matriz curricular...' });
        
        let filaDeAulas = [];

        Object.entries(horarioState.matrizCurricular).forEach(([turmaId, materiasData]) => {
            Object.entries(materiasData).forEach(([materiaId, dados]) => {
                const qtd = dados.qtd || 0;
                const profPreferencial = dados.profId; 

                for (let i = 0; i < qtd; i++) {
                    filaDeAulas.push({
                        uid: uid(),
                        turmaId,
                        materiaId,
                        profPreferencial,
                        tentativas: 0
                    });
                }
            });
        });

        // 4. Ordenação Estratégica
        filaDeAulas.sort((a, b) => {
            const aFixo = a.profPreferencial !== 'auto' ? 1 : 0;
            const bFixo = b.profPreferencial !== 'auto' ? 1 : 0;
            return bFixo - aFixo;
        });

        // 5. Loop de Alocação
        const totalAulas = filaDeAulas.length;
        let aulasAlocadas = 0;

        for (const aula of filaDeAulas) {
            if (aulasAlocadas % Math.ceil(totalAulas / 10) === 0) {
                const pct = Math.floor((aulasAlocadas / totalAulas) * 100);
                postMessage({ type: 'progress', message: `Alocando aulas... ${pct}%` });
            }

            const turma = turmasMap.get(aula.turmaId);
            const estruturaId = turma.estruturaId;

            // Define candidatos
            let candidatos = [];
            if (aula.profPreferencial !== 'auto') {
                const p = professoresMap.get(aula.profPreferencial);
                if (p) candidatos = [p];
            } else {
                candidatos = professores.filter(p => 
                    p.status === 'ativo' && p.materiasIds.includes(aula.materiaId)
                );
                candidatos = shuffleArray(candidatos);
            }

            if (candidatos.length === 0) {
                grade.aulasNaoAlocadas.push({ ...aula, motivo: 'Sem professor habilitado' });
                continue;
            }

            let alocado = false;

            for (const professor of candidatos) {
                if (alocado) break;

                const slotsDisponiveis = grade.slots.filter(slot => 
                    slot.turmaId === aula.turmaId && 
                    slot.professorId === null && 
                    !ocupacaoProfessores.has(`${professor.id}_${slot.diaId}_${slot.blocoIndex}`)
                );

                const slotsValidos = slotsDisponiveis.filter(slot => {
                    const disp = professor.disponibilidade && professor.disponibilidade[estruturaId];
                    if (!disp) return false; 
                    
                    const statusDia = disp[slot.diaId];
                    if (!statusDia) return false;

                    const statusBloco = statusDia[slot.blocoIndex];
                    return statusBloco === 'available' || statusBloco === 'preferential'; 
                });

                // Heurísticas de Preferência
                if (preferencias.geminarAulas) {
                    slotsValidos.sort((a, b) => {
                        const aTemVizinho = temVizinhoMesmaMateria(grade, a, aula.materiaId);
                        const bTemVizinho = temVizinhoMesmaMateria(grade, b, aula.materiaId);
                        return bTemVizinho - aTemVizinho; 
                    });
                } else if (preferencias.distribuicaoUniforme) {
                    slotsValidos.sort((a, b) => {
                        const aTemNoDia = temAulaNoDia(grade, a, aula.materiaId);
                        const bTemNoDia = temAulaNoDia(grade, b, aula.materiaId);
                        return aTemNoDia - bTemNoDia;
                    });
                }

                if (slotsValidos.length > 0) {
                    const slotEscolhido = slotsValidos[0];
                    
                    slotEscolhido.materiaId = aula.materiaId;
                    slotEscolhido.professorId = professor.id;
                    
                    ocupacaoProfessores.add(`${professor.id}_${slotEscolhido.diaId}_${slotEscolhido.blocoIndex}`);
                    
                    alocado = true;
                    aulasAlocadas++;
                }
            }

            if (!alocado) {
                grade.aulasNaoAlocadas.push({ 
                    ...aula, 
                    motivo: candidatos.length === 1 ? 'Conflito de horário (Prof. Fixo)' : 'Nenhum horário comum disponível' 
                });
            }
        }

        postMessage({ type: 'progress', message: 'Finalizando...' });
        postMessage({ type: 'done', horario: grade });

    } catch (error) {
        console.error("CRITICAL WORKER ERROR:", error);
        postMessage({ type: 'error', message: error.toString() });
    }
};

// --- Funções Auxiliares Específicas do Algoritmo ---
// (As funções genéricas 'uid', 'shuffleArray', etc. já vêm do importScripts)

function temVizinhoMesmaMateria(grade, slot, materiaId) {
    const anterior = grade.slots.find(s => 
        s.turmaId === slot.turmaId && 
        s.diaId === slot.diaId && 
        s.blocoIndex === slot.blocoIndex - 1 &&
        s.materiaId === materiaId
    );
    const posterior = grade.slots.find(s => 
        s.turmaId === slot.turmaId && 
        s.diaId === slot.diaId && 
        s.blocoIndex === slot.blocoIndex + 1 &&
        s.materiaId === materiaId
    );
    return !!(anterior || posterior);
}

function temAulaNoDia(grade, slot, materiaId) {
    return grade.slots.some(s => 
        s.turmaId === slot.turmaId && 
        s.diaId === slot.diaId && 
        s.materiaId === materiaId
    );
}