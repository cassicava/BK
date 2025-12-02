importScripts('E-constantes.js', 'D-utilitarios-compartilhados.js');

self.onmessage = function(e) {
    if (e.data.type === 'cancel') {
        self.close();
        return;
    }

    const { horarioState, turmas, professores, materias, estruturas } = e.data;
    const { preferencias } = horarioState;

    try {
        postMessage({ type: 'progress', message: 'Analisando restrições e disponibilidades...' });

        // --- 1. Mapeamento de Dados para Acesso Rápido ---
        const turmasMap = new Map(turmas.map(t => [t.id, t]));
        const estruturasMap = new Map(estruturas.map(e => [e.id, e]));
        const professoresMap = new Map(professores.map(p => [p.id, p]));
        
        // --- 2. Construção do Esqueleto da Grade (Slots Vazios) ---
        postMessage({ type: 'progress', message: 'Criando estrutura temporal...' });
        
        const grade = {
            id: uid(), // Usa a função importada de D-utilitarios-compartilhados.js
            nome: `Grade Gerada ${new Date().toLocaleDateString()}`,
            slots: [], 
            aulasNaoAlocadas: [],
            log: []
        };

        // Cache para controle de choques: "professorId_diaId_blocoIndex"
        const ocupacaoProfessores = new Set();
        
        // Cache para controle de aulas por dia por turma: "turmaId_diaId_materiaId" -> contador
        const contagemAulasDia = {}; 

        // Gera os slots para cada turma baseada na sua estrutura
        horarioState.turmasIds.forEach(turmaId => {
            const turma = turmasMap.get(turmaId);
            const estrutura = estruturasMap.get(turma.estruturaId);
            
            if (!estrutura) {
                grade.log.push(`ERRO: Turma ${turma.nome} sem estrutura definida.`);
                return;
            }

            // Detecta quais dias a estrutura realmente usa
            const diasDaEstrutura = Object.keys(estrutura.dias).filter(d => 
                estrutura.dias[d].blocos && estrutura.dias[d].blocos.length > 0
            );

            diasDaEstrutura.forEach(diaId => {
                const blocos = estrutura.dias[diaId].blocos;
                
                blocos.forEach((bloco, index) => {
                    // Só cria slot se for do tipo 'aula'
                    if (bloco.type === 'aula') {
                        grade.slots.push({
                            id: uid(),
                            turmaId: turma.id,
                            diaId: diaId,
                            blocoIndex: index, // Índice real dentro do array de blocos do dia
                            materiaId: null,
                            professorId: null,
                            fixo: false
                        });
                    }
                });
            });
        });

        // --- 3. Preparação da Fila de Aulas (O que precisa ser alocado) ---
        postMessage({ type: 'progress', message: 'Processando matriz curricular...' });
        
        let filaDeAulas = [];

        Object.entries(horarioState.matrizCurricular).forEach(([turmaId, materiasData]) => {
            Object.entries(materiasData).forEach(([materiaId, dados]) => {
                const qtd = parseInt(dados.qtd) || 0;
                const profId = dados.profId; 

                // Identifica o professor real (se não for auto)
                let professorReal = null;
                if (profId !== 'auto') {
                    professorReal = professoresMap.get(profId);
                } else {
                    // Se for auto, tenta achar um professor habilitado
                    // Prioriza quem tem disponibilidade configurada na estrutura da turma
                    const turma = turmasMap.get(turmaId);
                    const estruturaId = turma ? turma.estruturaId : null;
                    
                    const candidatos = professores.filter(p => 
                        p.status === 'ativo' && 
                        p.materiasIds.includes(materiaId)
                    );
                    
                    // Ordena candidatos: quem tem disponibilidade configurada vem primeiro
                    candidatos.sort((a, b) => {
                        const aTem = (a.disponibilidade && a.disponibilidade[estruturaId]) ? 1 : 0;
                        const bTem = (b.disponibilidade && b.disponibilidade[estruturaId]) ? 1 : 0;
                        return bTem - aTem;
                    });

                    if (candidatos.length > 0) professorReal = candidatos[0];
                }

                for (let i = 0; i < qtd; i++) {
                    filaDeAulas.push({
                        uid: uid(),
                        turmaId,
                        materiaId,
                        professorId: professorReal ? professorReal.id : null,
                        professorNome: professorReal ? professorReal.nome : 'Sem Professor',
                        tentativas: 0
                    });
                }
            });
        });

        // Ordenação Estratégica: Alocar o que é mais difícil primeiro
        // Critérios: Professor definido > Quantidade de restrições do professor
        filaDeAulas.sort((a, b) => {
            if (a.professorId && !b.professorId) return -1;
            if (!a.professorId && b.professorId) return 1;
            return 0; 
        });

        // --- 4. Motor de Alocação ---
        const totalAulas = filaDeAulas.length;
        let processadas = 0;

        // Função Auxiliar: Verifica se o slot é válido para a aula
        const verificarSlot = (slot, aula) => {
            // 1. Slot já ocupado?
            if (slot.materiaId !== null) return { ok: false, motivo: 'Slot ocupado' };

            // 2. Professor existe?
            if (!aula.professorId) return { ok: false, motivo: 'Professor não definido' };

            const prof = professoresMap.get(aula.professorId);
            const turma = turmasMap.get(aula.turmaId);
            const estruturaId = turma.estruturaId;

            // 3. CHOQUE: Professor já está dando aula neste dia/horário em outra turma?
            const chaveOcupacao = `${prof.id}_${slot.diaId}_${slot.blocoIndex}`;
            if (ocupacaoProfessores.has(chaveOcupacao)) {
                return { ok: false, motivo: 'Choque de horário' };
            }

            // 4. DISPONIBILIDADE: O professor pode neste horário?
            // Regra Segura: Se não tem config, assume disponível (para não travar tudo), mas se tem, respeita RIGOROSAMENTE.
            if (prof.disponibilidade && prof.disponibilidade[estruturaId]) {
                const diasDisp = prof.disponibilidade[estruturaId];
                if (diasDisp[slot.diaId]) {
                    const statusBloco = diasDisp[slot.diaId][slot.blocoIndex];
                    if (statusBloco === 'unavailable') {
                        return { ok: false, motivo: 'Professor marcou indisponibilidade' };
                    }
                }
            }

            // 5. REGRAS PEDAGÓGICAS
            // Máximo de aulas desta matéria por dia nesta turma
            const chaveContagem = `${aula.turmaId}_${slot.diaId}_${aula.materiaId}`;
            const aulasNoDia = contagemAulasDia[chaveContagem] || 0;
            const maxPorDia = preferencias.maxAulasDiarias || 2;
            
            if (aulasNoDia >= maxPorDia) {
                return { ok: false, motivo: 'Max aulas diárias atingido' };
            }

            return { ok: true, score: 0 };
        };

        // Função de Pontuação: Escolhe o melhor slot entre os válidos
        const pontuarSlot = (slot, aula) => {
            let pontos = 100;
            
            const prof = professoresMap.get(aula.professorId);
            const turma = turmasMap.get(aula.turmaId);
            const estruturaId = turma.estruturaId;

            // Preferência do Professor
            if (prof.disponibilidade && prof.disponibilidade[estruturaId]) {
                const status = prof.disponibilidade[estruturaId][slot.diaId]?.[slot.blocoIndex];
                if (status === 'preferential') pontos += 50;
            }

            // Geminação (Aulas Duplas)
            if (preferencias.geminarAulas) {
                const anterior = grade.slots.find(s => 
                    s.turmaId === slot.turmaId && s.diaId === slot.diaId && s.blocoIndex === slot.blocoIndex - 1
                );
                const posterior = grade.slots.find(s => 
                    s.turmaId === slot.turmaId && s.diaId === slot.diaId && s.blocoIndex === slot.blocoIndex + 1
                );

                // Se a aula anterior ou posterior é da mesma matéria e mesmo professor, ganha pontos
                if (anterior && anterior.materiaId === aula.materiaId) pontos += 200; // Forte preferência por juntar
                if (posterior && posterior.materiaId === aula.materiaId) pontos += 200;
            }

            // Evitar Janelas (Buracos) para o Professor
            // Verificar se o professor tem aula no bloco anterior ou posterior EM QUALQUER TURMA
            const temAulaAntes = ocupacaoProfessores.has(`${prof.id}_${slot.diaId}_${slot.blocoIndex - 1}`);
            const temAulaDepois = ocupacaoProfessores.has(`${prof.id}_${slot.diaId}_${slot.blocoIndex + 1}`);
            
            if (temAulaAntes || temAulaDepois) pontos += 30; // Agrupar aulas do professor

            return pontos;
        };


        // --- Loop Principal de Alocação ---
        for (const aula of filaDeAulas) {
            processadas++;
            if (processadas % 10 === 0) {
                postMessage({ type: 'progress', message: `Alocando aula ${processadas}/${totalAulas}...` });
            }

            // Busca slots livres da turma
            const slotsTurma = grade.slots.filter(s => s.turmaId === aula.turmaId && s.materiaId === null);
            
            let melhoresSlots = [];

            // Avalia todos os slots possíveis
            for (const slot of slotsTurma) {
                const validacao = verificarSlot(slot, aula);
                if (validacao.ok) {
                    const score = pontuarSlot(slot, aula);
                    melhoresSlots.push({ slot, score });
                }
            }

            // Ordena pelos melhores scores (maior para menor)
            melhoresSlots.sort((a, b) => b.score - a.score);

            if (melhoresSlots.length > 0) {
                // Aloca no melhor slot
                const escolhido = melhoresSlots[0].slot;
                
                escolhido.materiaId = aula.materiaId;
                escolhido.professorId = aula.professorId;
                
                // Atualiza caches
                ocupacaoProfessores.add(`${aula.professorId}_${escolhido.diaId}_${escolhido.blocoIndex}`);
                
                const chaveContagem = `${aula.turmaId}_${escolhido.diaId}_${aula.materiaId}`;
                contagemAulasDia[chaveContagem] = (contagemAulasDia[chaveContagem] || 0) + 1;

            } else {
                // Falha ao alocar
                let motivo = "Sem horários disponíveis";
                if (!aula.professorId) motivo = "Sem professor definido";
                else {
                    // Tenta descobrir o porquê
                    const prof = professoresMap.get(aula.professorId);
                    const turma = turmasMap.get(aula.turmaId);
                    // Simples verificação se o prof tem alguma disponibilidade na estrutura
                    const disp = prof.disponibilidade ? prof.disponibilidade[turma.estruturaId] : null;
                    if (!disp) motivo = "Professor sem disponibilidade configurada";
                    else motivo = "Conflito de horários ou restrições";
                }

                grade.aulasNaoAlocadas.push({
                    turmaId: aula.turmaId,
                    materiaId: aula.materiaId,
                    motivo: motivo
                });
            }
        }

        // --- 5. Finalização ---
        postMessage({ type: 'progress', message: 'Finalizando grade...' });
        
        // Pequena estatística no log
        const sucesso = totalAulas - grade.aulasNaoAlocadas.length;
        grade.log.push(`Geração concluída. Alocadas: ${sucesso}/${totalAulas}. Não alocadas: ${grade.aulasNaoAlocadas.length}.`);

        postMessage({ type: 'done', horario: grade });

    } catch (error) {
        console.error("CRITICAL WORKER ERROR:", error);
        postMessage({ type: 'error', message: error.toString() + "\n" + (error.stack || '') });
    }
};