const welcomeOverlay = document.getElementById("welcome-overlay");
const nomeInput = document.getElementById("welcome-nome-input");
const personalizacaoNextBtn = document.getElementById("welcome-personalizacao-next");
const finishBtn = document.getElementById("welcome-finish-btn");
const termsCard = document.getElementById("welcome-terms-card");
const privacyCard = document.getElementById("welcome-privacy-card");

let onboardingState = {
    currentStep: 1,
    nome: '',
};
let termsAcceptedState = {
    terms: false,
    privacy: false,
};

let featureCarouselInterval = null;

function validateWelcomeStep2() {
    const nomeValido = nomeInput.value.trim() !== '';
    personalizacaoNextBtn.disabled = !nomeValido;
}

function checkAllTermsAccepted() {
    const allAccepted = termsAcceptedState.terms && termsAcceptedState.privacy;
    finishBtn.disabled = !allAccepted;
}

function saveOnboardingProgress() {
    localStorage.setItem('ap_onboarding_progress', JSON.stringify(onboardingState));
}

function loadOnboardingProgress() {
    const savedState = loadJSON('ap_onboarding_progress', onboardingState);
    if (savedState) {
        onboardingState = savedState;
        nomeInput.value = onboardingState.nome;
    }
}

function stopFeatureCarousel() {
    if (featureCarouselInterval) {
        clearInterval(featureCarouselInterval);
        featureCarouselInterval = null;
    }
}

function startFeatureCarousel() {
    stopFeatureCarousel();

    const carousel = document.getElementById("welcome-feature-carousel");
    if (!carousel) return;

    const items = carousel.querySelectorAll(".carousel-item");
    if (items.length === 0) return;

    let currentIndex = 0;
    
    items.forEach(item => item.classList.remove('active'));
    items[0].classList.add('active');

    featureCarouselInterval = setInterval(() => {
        items[currentIndex].classList.remove('active');
        currentIndex = (currentIndex + 1) % items.length;
        items[currentIndex].classList.add('active');
    }, 2500); 
}

function showStep(stepNumber, direction = 'forward') {
    const progressDots = document.querySelectorAll(".progress-dot");
    const currentStepEl = document.querySelector(`.welcome-step.active`);
    const nextStepEl = document.getElementById(`welcome-step-${stepNumber}`);
    const animOutClass = direction === 'forward' ? 'anim-slide-out-left' : 'anim-slide-out-right';
    const animInClass = direction === 'forward' ? 'anim-slide-in-right' : 'anim-slide-in-left';

    if (currentStepEl) {
        currentStepEl.classList.add(animOutClass);
        setTimeout(() => {
            currentStepEl.classList.remove('active', animOutClass);
        }, 200);
    }

    if (nextStepEl) {
        nextStepEl.classList.remove('anim-slide-in-right', 'anim-slide-in-left');
        nextStepEl.classList.add('active', animInClass);
        parseEmojisInElement(nextStepEl); 
    }

    progressDots.forEach(dot => {
        dot.classList.toggle('active', dot.dataset.step == stepNumber);
    });

    onboardingState.currentStep = stepNumber;
    saveOnboardingProgress();

    if (stepNumber === 3) {
        startFeatureCarousel();
    } else {
        stopFeatureCarousel();
    }

    setTimeout(() => {
        const firstInput = nextStepEl.querySelector('input:not([type=checkbox]), button.welcome-btn-primary');
        if(firstInput && firstInput.id !== 'welcome-nome-input') {
            firstInput.focus();
        }
    }, 200);
}

async function handleWelcomeImport() {
    stopFeatureCarousel();

    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = '.json,application/json';

    fileInput.onchange = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = async (event) => {
            showLoader("Importando seus dados...");
            await new Promise(res => setTimeout(res, 50)); 

            try {
                const importedData = JSON.parse(event.target.result);
                
                if (!importedData || typeof importedData !== 'object') {
                    throw new Error("Arquivo de backup inválido ou corrompido.");
                }

                for (const key in KEYS) {
                    if (importedData.hasOwnProperty(key)) {
                        saveJSON(KEYS[key], importedData[key]);
                    }
                }

                store.dispatch('LOAD_STATE');

                localStorage.setItem('ap_onboarding_complete', 'true');
                localStorage.removeItem('ap_onboarding_progress');
                
                hideLoader();
                showToast("Dados importados com sucesso! Bem-vindo(a) de volta.", 'success');
                
                welcomeOverlay.classList.remove('visible');
                
                welcomeOverlay.addEventListener('transitionend', () => {
                    welcomeOverlay.style.display = 'none';
                    setupAppListeners();
                    renderRouter('LOAD_STATE');
                    document.body.classList.add('app-ready');
                    go("home", { force: true });
                }, { once: true });


            } catch (error) {
                console.error("Erro ao importar dados na tela de boas-vindas:", error);
                hideLoader();
                showToast(error.message || "Ocorreu um erro ao ler o arquivo de backup.", 'error');
            }
        };
        reader.readAsText(file);
    };

    fileInput.click();
}


function finishOnboarding() {
    if (personalizacaoNextBtn.disabled) {
        showToast("Por favor, preencha seu nome para continuar.");
        showStep(2, 'backward');
        return;
    }
    if (finishBtn.disabled) {
        showToast("Por favor, aceite ambos os termos para continuar.");
        return;
    }

    stopFeatureCarousel();

    onboardingState.nome = nomeInput.value.trim();
    const initialConfig = { nome: onboardingState.nome };
    store.dispatch('SAVE_CONFIG', initialConfig);

    localStorage.setItem('ap_onboarding_complete', 'true');
    localStorage.removeItem('ap_onboarding_progress');
    
    welcomeOverlay.classList.remove('visible');

    welcomeOverlay.addEventListener('transitionend', () => {
        welcomeOverlay.style.display = 'none'; 
        setupAppListeners();
        renderRouter('LOAD_STATE');
        document.body.classList.add('app-ready');
        go("home", { force: true });
    }, { once: true });
}

function initWelcomeScreen() {
    loadOnboardingProgress();
    welcomeOverlay.classList.add('visible');
    parseEmojisInElement(welcomeOverlay);
    
    showStep(onboardingState.currentStep || 1);
    
    if (onboardingState.currentStep === 3) {
        startFeatureCarousel();
    }

    document.getElementById("welcome-start-fresh").onclick = () => showStep(2, 'forward');
    document.getElementById("welcome-import-backup").onclick = handleWelcomeImport;
    personalizacaoNextBtn.onclick = () => showStep(3, 'forward');
    document.getElementById("welcome-proposta-next").onclick = () => showStep(4, 'forward');
    finishBtn.onclick = finishOnboarding;
    
    document.querySelectorAll('.welcome-btn-back').forEach(btn => {
        btn.onclick = () => showStep(parseInt(btn.dataset.toStep), 'backward');
    });

    termsCard.onclick = async () => {
        const accepted = await exibirTermosDeUso(true);
        if (accepted) {
            termsAcceptedState.terms = true;
            termsCard.classList.add('accepted');
            checkAllTermsAccepted();
        }
    };

    privacyCard.onclick = async () => {
        const accepted = await exibirPoliticaDePrivacidade(true);
        if (accepted) {
            termsAcceptedState.privacy = true;
            privacyCard.classList.add('accepted');
            checkAllTermsAccepted();
        }
    };

    nomeInput.oninput = () => {
        if (nomeInput.value.length > 0) {
            nomeInput.value = nomeInput.value.charAt(0).toUpperCase() + nomeInput.value.slice(1);
        }
        onboardingState.nome = nomeInput.value;
        validateWelcomeStep2();
        saveOnboardingProgress();
    };

    checkAllTermsAccepted();
    validateWelcomeStep2();
}