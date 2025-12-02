const dirtyForms = {
    estruturas: false,
    materias: false,
    professores: false,
    turmas: false,
    'gerar-horario': false,
};

let isNavigating = false;

const PROGRESS_STEPS = [
    { 
        level: 1, 
        title: 'Defina o Tempo', 
        description: 'O primeiro passo é configurar as Estruturas de Horário (ex: Manhã, Tarde).',
        unlockText: '🔓 Desbloqueia: Matérias',
        percent: 0 
    },
    { 
        level: 2, 
        title: 'O que será ensinado?', 
        description: 'Agora cadastre as Matérias (Disciplinas) que a escola oferece.',
        unlockText: '🔓 Desbloqueia: Professores',
        percent: 25 
    },
    { 
        level: 3, 
        title: 'Quem vai ensinar?', 
        description: 'Cadastre os Professores, suas matérias e disponibilidade.',
        unlockText: '🔓 Desbloqueia: Turmas',
        percent: 50 
    },
    { 
        level: 4, 
        title: 'Para quem?', 
        description: 'Crie as Turmas e vincule-as à estrutura de horário correta.',
        unlockText: '🔓 Desbloqueia: Gerar Horário',
        percent: 75 
    },
    { 
        level: 5, 
        title: 'Tudo Pronto! 🚀', 
        description: 'Você completou os cadastros essenciais. Agora você pode gerar suas grades.',
        unlockText: '',
        percent: 100 
    }
];

const PAGE_ACCESS_LEVEL = {
    'home': 1,
    'configuracoes': 1,
    'estruturas': 1,
    'materias': 2,
    'professores': 3,
    'turmas': 4,
    'gerar-horario': 5,
    'horarios-salvos': 5
};

function getCurrentDataLevel() {
    const { estruturas, materias, turmas, professores } = store.getState();
    
    const hasEstruturas = estruturas.some(e => e.status === 'ativo');
    const hasMaterias = materias.some(m => m.status === 'ativo');
    const hasProfessores = professores.some(p => p.status === 'ativo');
    const hasTurmas = turmas.length > 0;

    // Lógica Sequencial Estrita
    if (hasEstruturas && hasMaterias && hasProfessores && hasTurmas) return 5;
    if (hasEstruturas && hasMaterias && hasProfessores) return 4;
    if (hasEstruturas && hasMaterias) return 3;
    if (hasEstruturas) return 2;
    
    return 1;
}

function getEffectiveLevel() {
    const dataLevel = getCurrentDataLevel();
    const savedLevel = parseInt(localStorage.getItem('ap_unlock_level') || '1', 10);
    const finalLevel = Math.max(dataLevel, savedLevel);
    
    if (finalLevel > savedLevel) {
        localStorage.setItem('ap_unlock_level', finalLevel.toString());
        if(finalLevel <= 5) {
            setTimeout(() => {
                showToast(`🎉 Passo concluído! Próxima etapa desbloqueada.`, 'success');
            }, 500);
        }
    }
    
    return finalLevel;
}

function dismissTutorial() {
    localStorage.setItem('ap_tutorial_dismissed', 'true');
    const panel = document.getElementById("home-progress-section");
    if(panel) {
        panel.style.opacity = '0';
        setTimeout(() => panel.style.display = 'none', 300);
    }
}

function updateUnlockUI() {
    const currentLevel = getEffectiveLevel();
    const stepInfo = PROGRESS_STEPS.find(s => s.level === currentLevel) || PROGRESS_STEPS[PROGRESS_STEPS.length - 1];
    const isDismissed = localStorage.getItem('ap_tutorial_dismissed') === 'true';

    const progressSection = document.getElementById("home-progress-section");
    
    if (progressSection) {
        if (isDismissed) {
            progressSection.style.display = 'none';
        } else {
            progressSection.style.display = 'flex';
            
            // Se já completou tudo (Nível 5), mostra mensagem de sucesso final
            const isCompleted = currentLevel === 5;
            
            const contentHTML = `
                <div class="home-progress-info">
                    <div class="home-progress-header">
                        <div class="home-progress-title">
                            ${isCompleted ? '🌟' : '📍'} ${stepInfo.title}
                        </div>
                        <div class="home-progress-subtitle">
                            ${stepInfo.description}
                        </div>
                        ${stepInfo.unlockText ? `<div class="home-progress-unlock-badge">${stepInfo.unlockText}</div>` : ''}
                    </div>
                </div>
                <div class="home-progress-visual">
                    ${!isCompleted ? `
                    <div class="home-progress-bar-container">
                        <div id="home-progress-bar" class="home-progress-bar-fill" style="width: ${stepInfo.percent}%"></div>
                        <span id="home-progress-percent" class="home-progress-text">${stepInfo.percent}%</span>
                    </div>` : `
                    <button class="tutorial-close-btn" onclick="dismissTutorial()">👋 Fechar Tutorial</button>
                    `}
                </div>
            `;
            
            progressSection.innerHTML = contentHTML;
            
            if(isCompleted) {
                progressSection.classList.add('completed');
            } else {
                progressSection.classList.remove('completed');
            }
            parseEmojisInElement(progressSection);
        }
    }

    document.querySelectorAll(".tab-btn").forEach(btn => {
        const page = btn.dataset.page;
        const requiredLevel = PAGE_ACCESS_LEVEL[page] || 1;
        const isLocked = currentLevel < requiredLevel;

        if (isLocked) {
            btn.classList.add('locked');
            btn.title = "Complete a etapa anterior para desbloquear.";
        } else {
            btn.classList.remove('locked');
            btn.title = "";
        }
        void btn.offsetWidth; 
    });

    document.querySelectorAll(".home-card-wrapper").forEach(wrapper => {
        const link = wrapper.querySelector('.home-card');
        if (link) {
            const page = link.dataset.goto;
            const requiredLevel = PAGE_ACCESS_LEVEL[page] || 1;
            const isLocked = currentLevel < requiredLevel;
            
            if (isLocked) {
                wrapper.classList.add('locked');
            } else {
                wrapper.classList.remove('locked');
            }
            void wrapper.offsetWidth;
        }
    });
}

async function handleDataCorruptionError() {
    const splashScreen = document.getElementById("splash-screen");
    if (splashScreen) {
        splashScreen.style.display = 'none';
    }

    const action = await showActionModal({
        title: "🚨 Erro ao Carregar Dados",
        message: "Não foi possível carregar suas informações. O arquivo de dados pode estar corrompido. O que você gostaria de fazer?",
        columnLayout: true,
        actions: [
            { id: 'import', text: '📥 Importar um Backup', class: 'primary' },
            { id: 'reset', text: '🔥 Apagar Dados e Recomeçar', class: 'danger' },
        ]
    });

    if (action === 'import') {
        importAllData();
    } else if (action === 'reset') {
        const { confirmed } = await showConfirm({
            title: "Tem Certeza?",
            message: "Isso apagará todos os dados corrompidos e iniciará o aplicativo do zero. Esta ação não pode ser desfeita.",
            confirmText: "Sim, Apagar Tudo"
        });
        if (confirmed) {
            await performHardReset();
        }
    }
}

function updateWelcomeMessage() {
    // Título "Início" é gerido pelo go()
}

function updateHomeScreenDashboard() {
    try {
        const { estruturas, materias, professores, turmas } = store.getState();
        const metricEstruturas = document.getElementById("metric-estruturas");
        const metricMaterias = document.getElementById("metric-materias");
        const metricProfessores = document.getElementById("metric-professores");
        const metricTurmas = document.getElementById("metric-turmas");

        if (metricEstruturas) metricEstruturas.textContent = `🏗️ Estruturas: ${estruturas.filter(e => e.status === 'ativo').length}`;
        if (metricMaterias) metricMaterias.textContent = `📚 Matérias: ${materias.filter(m => m.status === 'ativo').length}`;
        if (metricProfessores) metricProfessores.textContent = `👨‍🏫 Professores: ${professores.filter(p => p.status === 'ativo').length}`;
        if (metricTurmas) metricTurmas.textContent = `🎓 Turmas: ${turmas.length}`;

        const metricsPanel = document.querySelector(".quick-metrics-panel");
        if (metricsPanel) {
            metricsPanel.style.justifyContent = "center"; 
            parseEmojisInElement(metricsPanel);
        }
    } catch (e) {
        console.error(e);
    }
}

function go(page, options = {}) {
    if (isNavigating) return;

    const currentLevel = getEffectiveLevel();
    const requiredLevel = PAGE_ACCESS_LEVEL[page] || 1;

    if (currentLevel < requiredLevel && !options.force) {
        // Encontra o passo anterior que precisa ser completado
        const prevStepInfo = PROGRESS_STEPS.find(s => s.level === requiredLevel - 1);
        const taskName = prevStepInfo ? prevStepInfo.title : 'etapa anterior';
        showToast(`🔒 Conclua a etapa "${taskName}" para desbloquear.`, 'error');
        return;
    }

    const currentPageEl = document.querySelector('.page.active');
    const currentPageId = currentPageEl ? currentPageEl.id.replace('page-', '') : null;

    if (currentPageId === page && !options.force) return;

    (async () => {
        if (currentPageId && dirtyForms[currentPageId]) {
            const { confirmed } = await showConfirm({
                title: "Descartar Alterações?",
                message: "Você tem alterações não salvas. Deseja sair e perdê-las?",
                confirmText: "Sim, Sair"
            });
            if (!confirmed) return;
        }

        isNavigating = true;

        const transitionLogic = () => {
            if (currentPageEl) {
                currentPageEl.classList.remove('active');
                currentPageEl.classList.remove('fading-out');

                switch (currentPageId) {
                    case 'estruturas': if(typeof cancelEditEstrutura === 'function') cancelEditEstrutura(); break;
                    case 'materias': if(typeof cancelEditMateria === 'function') cancelEditMateria(); break;
                    case 'professores': if(typeof cancelEditProfessor === 'function') cancelEditProfessor(); break;
                    case 'turmas': if(typeof cancelEditTurma === 'function') cancelEditTurma(); break;
                    case 'gerar-horario':
                        if(typeof resetGeradorWizard === 'function') resetGeradorWizard();
                        if (typeof currentHorario !== 'undefined') currentHorario = null;
                        if (typeof cleanupEditor === 'function') cleanupEditor();
                        break;
                }
            }

            const nextPageEl = document.getElementById(`page-${page}`);
            if (nextPageEl) {
                nextPageEl.classList.add('active');
            }

            toggleHelpPanel(false);
            const helpBtn = document.getElementById("context-help-btn");
            const hasHelpContent = loadHelpContent(page);
            if (helpBtn) {
                 helpBtn.style.display = hasHelpContent ? 'flex' : 'none';
            }

            document.querySelectorAll(".tab-btn").forEach(b => b.classList.remove("active"));
            const activeTab = document.querySelector(`.tab-btn[data-page="${page}"]`);
            if (activeTab) activeTab.classList.add('active');

            const pageTitleEl = document.getElementById("page-title");
            if (pageTitleEl) {
                if (page === 'home') {
                    pageTitleEl.textContent = `Início`;
                } else if (activeTab) {
                    const tabTextEl = activeTab.querySelector('.tab-text');
                    if (tabTextEl) pageTitleEl.textContent = tabTextEl.textContent;
                }
            }

            window.scrollTo(0, 0);

            updateUnlockUI();

            switch (page) {
                case 'home':
                    updateWelcomeMessage();
                    updateHomeScreenDashboard();
                    break;
                case 'estruturas':
                    if(typeof renderEstruturas === 'function') renderEstruturas();
                    break;
                case 'materias':
                    if(typeof renderMaterias === 'function') renderMaterias();
                    break;
                case 'professores':
                    if(typeof renderProfessores === 'function') renderProfessores();
                    break;
                case 'turmas':
                    if(typeof renderTurmas === 'function') renderTurmas();
                    break;
                case 'gerar-horario': 
                    if(typeof initGeradorPage === 'function') initGeradorPage(options); 
                    break;
                case 'horarios-salvos':
                    if(typeof renderFiltroHorariosAno === 'function') renderFiltroHorariosAno();
                    if(typeof renderHorariosList === 'function') renderHorariosList();
                    break;
                 case 'configuracoes':
                    if(typeof loadConfigForm === 'function') loadConfigForm();
                    break;
            }
            parseEmojisInElement(document.body);
            isNavigating = false;
        };

        if (currentPageEl) {
            currentPageEl.addEventListener('animationend', transitionLogic, { once: true });
            currentPageEl.classList.add('fading-out');
        } else {
            transitionLogic();
        }
    })();
}

function renderRouter(actionName) {
    const currentPageEl = document.querySelector('.page.active');
    const currentPageId = currentPageEl ? currentPageEl.id.replace('page-', '') : null;

    updateUnlockUI();
    if (currentPageId === 'home') updateHomeScreenDashboard();

    switch(actionName) {
        case 'LOAD_STATE':
            if(typeof renderEstruturas === 'function') renderEstruturas();
            if(typeof renderMaterias === 'function') renderMaterias();
            if(typeof renderProfessores === 'function') renderProfessores();
            if(typeof renderTurmas === 'function') renderTurmas();
            if(typeof renderHorariosList === 'function') renderHorariosList();
            
            if(typeof loadConfigForm === 'function') loadConfigForm();
            updateUnlockUI(); 
            break;
        
        case 'SAVE_ESTRUTURA':
        case 'DELETE_ESTRUTURA':
            if (currentPageId === 'estruturas') renderEstruturas();
            if (currentPageId === 'turmas') if(typeof renderTurmaEstruturaSelect === 'function') renderTurmaEstruturaSelect();
            if (currentPageId === 'professores') if(typeof renderProfessorDisponibilidade === 'function') renderProfessorDisponibilidade();
            if (currentPageId === 'home') updateHomeScreenDashboard();
            break;

        case 'SAVE_MATERIA':
        case 'DELETE_MATERIA':
        case 'ARCHIVE_MATERIA':
        case 'UNARCHIVE_MATERIA':
            if (currentPageId === 'materias') {
                if(typeof renderMaterias === 'function') renderMaterias();
                if(typeof renderMateriasArquivadas === 'function') renderMateriasArquivadas();
            }
            if (currentPageId === 'professores') if(typeof renderProfessorMateriasSelect === 'function') renderProfessorMateriasSelect();
            if (currentPageId === 'home') updateHomeScreenDashboard();
            break;

        case 'SAVE_PROFESSOR':
        case 'DELETE_PROFESSOR':
        case 'ARCHIVE_PROFESSOR':
        case 'UNARCHIVE_PROFESSOR':
            if (currentPageId === 'professores') {
                 if(typeof renderProfessores === 'function') renderProfessores();
                 if(typeof renderArchivedProfessores === 'function') renderArchivedProfessores();
            }
            if (currentPageId === 'home') updateHomeScreenDashboard();
            break;

        case 'SAVE_TURMA':
        case 'DELETE_TURMA':
            if (currentPageId === 'turmas') renderTurmas();
            if (currentPageId === 'home') updateHomeScreenDashboard();
            break;

        case 'SAVE_HORARIO':
        case 'DELETE_HORARIO_SALVO':
             if (currentPageId === 'horarios-salvos') renderHorariosList();
            break;

        case 'SAVE_CONFIG':
            if(typeof loadConfigForm === 'function') loadConfigForm();
            updateWelcomeMessage();
            break;
    }

    setTimeout(() => {
        updateUnlockUI();
        if (currentPageId === 'home') updateHomeScreenDashboard();
    }, 50);
}

function setupAppListeners() {
    document.querySelectorAll(".tab-btn").forEach(b => b.addEventListener('click', () => go(b.dataset.page)));
    document.querySelectorAll(".home-card").forEach(c => c.addEventListener('click', (e) => {
        e.preventDefault();
        go(c.dataset.goto);
    }));
}

function setupGlobalAutocomplete() {
    const enforce = () => {
        document.querySelectorAll('input').forEach(input => {
            if (input.getAttribute('autocomplete') !== 'off') {
                input.setAttribute('autocomplete', 'off');
                if (input.name) {
                    input.setAttribute('autocomplete', 'off'); 
                }
            }
        });
    };

    enforce();

    const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
            if (mutation.addedNodes.length) {
                enforce();
            }
        });
    });

    observer.observe(document.body, { childList: true, subtree: true });
}

function initMainApp() {
    const splashScreen = document.getElementById("splash-screen");
    const splashUserName = document.getElementById("splash-user-name");
    const { config } = store.getState();
    const body = document.body;

    body.classList.add('app-loading');

    const nome = config.nome;
    if(splashUserName) splashUserName.textContent = (nome && nome.trim() !== '') ? nome : 'Diretor(a)';

    if(splashScreen) splashScreen.classList.add('animate');
    parseEmojisInElement(document.body);

    store.subscribe(renderRouter);
    renderRouter('LOAD_STATE');

    setTimeout(() => {
        if(splashScreen) {
            splashScreen.classList.add('closing');
            splashScreen.addEventListener('transitionend', () => {
                splashScreen.style.display = 'none';
                body.classList.remove('app-loading');
                document.body.classList.add('app-ready');

                go("home", { force: true });
                const pageTitleEl = document.getElementById("page-title");
                if (pageTitleEl) pageTitleEl.textContent = "Início";

            }, { once: true });
        }
    }, 4000);
}

function init() {
    setupGlobalAutocomplete();

    window.addEventListener('mousemove', e => {
        document.body.style.setProperty('--mouse-x', `${e.clientX}px`);
        document.body.style.setProperty('--mouse-y', `${e.clientY}px`);
    });

    const splashScreen = document.getElementById("splash-screen");

    if (typeof checkLicenseOnStartup === 'function') {
        const isLicensed = checkLicenseOnStartup();
        if (!isLicensed) {
            if (splashScreen) splashScreen.style.display = 'none';
            return; 
        }
    }

    store.dispatch('LOAD_STATE');

    if (store.getState().dataCorrupted) {
        handleDataCorruptionError();
        return;
    }

    const onboardingComplete = localStorage.getItem('ap_onboarding_complete') === 'true';

    if (!onboardingComplete) {
        if (splashScreen) {
            splashScreen.style.display = 'none';
        }
        initWelcomeScreen();
    } else {
        const welcomeOverlay = document.getElementById("welcome-overlay");
        if(welcomeOverlay) {
            welcomeOverlay.style.display = 'none';
        }

        setupAppListeners();
        initMainApp();
    }
}

document.addEventListener("DOMContentLoaded", init);