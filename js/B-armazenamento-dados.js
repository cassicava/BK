const KEYS = {
    estruturas: "ap_estruturas",
    materias: "ap_materias",
    professores: "ap_professores",
    turmas: "ap_turmas",
    horarios: "ap_horarios",
    config: "ap_config"
};

const store = {
    state: {
        estruturas: [],
        materias: [],
        professores: [],
        turmas: [],
        horarios: [],
        config: { nome: '' },
        dataCorrupted: false,
    },

    listeners: [],

    getState() {
        return this.state;
    },

    dispatch(actionName, payload) {
        if (typeof this.mutations[actionName] === 'function') {
            this.mutations[actionName](this.state, payload);
            this.notify(actionName);
        } else {
            console.error(`Ação "${actionName}" não encontrada.`);
        }
    },

    mutations: {
        SET_DATA_CORRUPTION_FLAG(state, isCorrupted) {
            state.dataCorrupted = isCorrupted;
        },

        LOAD_STATE(state) {
            try {
                const DATA_VERSION = "1.0";
                const currentVersion = localStorage.getItem('ap_data_version');

                state.horarios = loadJSON(KEYS.horarios, []).map(h => ({ ...h, observacoes: h.observacoes || '' }));
                state.professores = loadJSON(KEYS.professores, []);
                state.materias = loadJSON(KEYS.materias, []);
                state.estruturas = loadJSON(KEYS.estruturas, []);
                state.turmas = loadJSON(KEYS.turmas, []);
                state.config = loadJSON(KEYS.config, { nome: '' });
                delete state.config.autobackup;

                if (currentVersion !== DATA_VERSION) {
                    state.professores = state.professores.map(p => ({ ...p, status: p.status || 'ativo' }));
                    state.materias = state.materias.map(m => ({ ...m, status: m.status || 'ativo' }));
                    state.estruturas = state.estruturas.map(e => ({ ...e, status: e.status || 'ativo' }));
                    
                    saveJSON(KEYS.professores, state.professores);
                    saveJSON(KEYS.materias, state.materias);
                    saveJSON(KEYS.estruturas, state.estruturas);
                    localStorage.setItem('ap_data_version', DATA_VERSION);
                }

            } catch (error) {
                console.error("ERRO CRÍTICO AO CARREGAR DADOS:", error);
                this.SET_DATA_CORRUPTION_FLAG(state, true);
            }
        },

        SAVE_ESTRUTURA(state, estrutura) {
            const index = state.estruturas.findIndex(e => e.id === estrutura.id);
            if (index > -1) {
                state.estruturas[index] = { ...state.estruturas[index], ...estrutura };
            } else {
                state.estruturas.push({ ...estrutura, status: 'ativo' });
            }
            saveJSON(KEYS.estruturas, state.estruturas);
        },
        DELETE_ESTRUTURA(state, estruturaId) {
            state.estruturas = state.estruturas.filter(e => e.id !== estruturaId);
            saveJSON(KEYS.estruturas, state.estruturas);
        },
        ARCHIVE_ESTRUTURA(state, estruturaId) {
            const index = state.estruturas.findIndex(e => e.id === estruturaId);
            if (index > -1) {
                state.estruturas[index].status = 'arquivado';
            }
            saveJSON(KEYS.estruturas, state.estruturas);
        },
        UNARCHIVE_ESTRUTURA(state, estruturaId) {
            const index = state.estruturas.findIndex(e => e.id === estruturaId);
            if (index > -1) {
                state.estruturas[index].status = 'ativo';
            }
            saveJSON(KEYS.estruturas, state.estruturas);
        },

        SAVE_MATERIA(state, materia) {
            const index = state.materias.findIndex(m => m.id === materia.id);
            if (index > -1) {
                state.materias[index] = { ...state.materias[index], ...materia };
            } else {
                state.materias.push({ ...materia, status: 'ativo' });
            }
            saveJSON(KEYS.materias, state.materias);
        },
        DELETE_MATERIA(state, materiaId) {
            state.materias = state.materias.filter(m => m.id !== materiaId);
            saveJSON(KEYS.materias, state.materias);
        },
        ARCHIVE_MATERIA(state, materiaId) {
            const index = state.materias.findIndex(m => m.id === materiaId);
            if (index > -1) {
                state.materias[index].status = 'arquivado';
            }
            saveJSON(KEYS.materias, state.materias);
        },
        UNARCHIVE_MATERIA(state, materiaId) {
            const index = state.materias.findIndex(m => m.id === materiaId);
            if (index > -1) {
                state.materias[index].status = 'ativo';
            }
            saveJSON(KEYS.materias, state.materias);
        },

        SAVE_PROFESSOR(state, professor) {
            const index = state.professores.findIndex(p => p.id === professor.id);
            if (index > -1) {
                state.professores[index] = { ...state.professores[index], ...professor };
            } else {
                state.professores.push({ ...professor, status: 'ativo' });
            }
            saveJSON(KEYS.professores, state.professores);
        },
        DELETE_PROFESSOR(state, professorId) {
            state.professores = state.professores.filter(p => p.id !== professorId);
            saveJSON(KEYS.professores, state.professores);
        },
        ARCHIVE_PROFESSOR(state, professorId) {
            const index = state.professores.findIndex(p => p.id === professorId);
            if (index > -1) {
                state.professores[index].status = 'arquivado';
            }
            saveJSON(KEYS.professores, state.professores);
        },
        UNARCHIVE_PROFESSOR(state, professorId) {
            const index = state.professores.findIndex(p => p.id === professorId);
            if (index > -1) {
                state.professores[index].status = 'ativo';
            }
            saveJSON(KEYS.professores, state.professores);
        },

        SAVE_TURMA(state, turma) {
            const index = state.turmas.findIndex(t => t.id === turma.id);
            if (index > -1) {
                state.turmas[index] = turma;
            } else {
                state.turmas.push(turma);
            }
            saveJSON(KEYS.turmas, state.turmas);
        },
        DELETE_TURMA(state, turmaId) {
            state.turmas = state.turmas.filter(t => t.id !== turmaId);
            saveJSON(KEYS.turmas, state.turmas);
        },

        SAVE_HORARIO(state, horario) {
            const index = state.horarios.findIndex(h => h.id === horario.id);
            if (index > -1) {
                state.horarios[index] = horario;
            } else {
                state.horarios.push(horario);
            }
            saveJSON(KEYS.horarios, state.horarios);
        },
        DELETE_HORARIO_SALVO(state, horarioId) {
            state.horarios = state.horarios.filter(h => h.id !== horarioId);
            saveJSON(KEYS.horarios, state.horarios);
        },

        SAVE_CONFIG(state, config) {
            delete config.autobackup;
            state.config = { ...state.config, ...config };
            saveJSON(KEYS.config, state.config);
        }
    },

    subscribe(listener) {
        this.listeners.push(listener);
    },

    notify(actionName) {
        this.listeners.forEach(listener => listener(actionName));
    }
};