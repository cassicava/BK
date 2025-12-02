/**************************************
 * 🔑 Sistema de Ativação e Licenciamento
 **************************************/

// AQUI ESTAVA O PROBLEMA: Agora está atualizado para a frase correta do Aula Pro
const SEGREDO_ATIVACAO = "SEMPRE_VOU_TE_AMAR_JANAINA_KEY_2025";

const activationState = {
    isActivated: false,
    licenseKey: null
};

function gerarAssinaturaInterna(textoBase) {
    let hash = 0;
    const stringMista = textoBase + SEGREDO_ATIVACAO;
    
    for (let i = 0; i < stringMista.length; i++) {
        const char = stringMista.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash |= 0; 
    }
    
    const hex = Math.abs(hash).toString(16).toUpperCase().padStart(4, '0');
    return hex.slice(-4); 
}

function validarSerialKey(serialCompleto) {
    if (!serialCompleto) return false;

    const chaveLimpa = serialCompleto.replace(/[^A-Z0-9]/ig, "").toUpperCase();

    if (chaveLimpa.length !== 16) return false;

    const corpo = chaveLimpa.slice(0, 12); 
    const assinaturaUsuario = chaveLimpa.slice(12, 16);

    const assinaturaReal = gerarAssinaturaInterna(corpo);

    return assinaturaUsuario === assinaturaReal;
}

function setupActivationUI() {
    const inputs = document.querySelectorAll('.digit-input');
    const btn = document.getElementById('btn-ativar-sistema');
    
    if (!inputs.length || !btn) return;

    inputs.forEach((input, index) => {
        input.addEventListener('keydown', (e) => handleInputNavigation(e, index, inputs));
        input.addEventListener('input', (e) => handleInputEntry(e, index, inputs, btn));
        input.addEventListener('paste', (e) => handlePaste(e, inputs, btn));
        input.addEventListener('focus', (e) => e.target.select());
    });

    btn.onclick = handleActivation;
}

function handleInputEntry(e, index, inputs, btn) {
    const val = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '');
    e.target.value = val;

    if (val.length === 1 && index < inputs.length - 1) {
        inputs[index + 1].focus();
    }

    checkCompletion(inputs, btn);
}

function handleInputNavigation(e, index, inputs) {
    if (e.key === 'Backspace' && !e.target.value && index > 0) {
        inputs[index - 1].focus();
    } 
    else if (e.key === 'ArrowLeft' && index > 0) {
        inputs[index - 1].focus();
    } else if (e.key === 'ArrowRight' && index < inputs.length - 1) {
        inputs[index + 1].focus();
    }
}

function handlePaste(e, inputs, btn) {
    e.preventDefault();
    const pasteData = (e.clipboardData || window.clipboardData).getData('text');
    const cleanData = pasteData.toUpperCase().replace(/[^A-Z0-9]/g, '');
    
    if (!cleanData) return;

    let dataIndex = 0;
    inputs.forEach((input, index) => {
        if (dataIndex < cleanData.length) {
            input.value = cleanData[dataIndex];
            dataIndex++;
        }
    });

    const nextFocusIndex = Math.min(dataIndex, inputs.length - 1);
    inputs[nextFocusIndex].focus();
    
    checkCompletion(inputs, btn);
}

function checkCompletion(inputs, btn) {
    const fullKey = Array.from(inputs).map(i => i.value).join('');
    if (fullKey.length === 16) {
        btn.disabled = false;
        btn.classList.add('ready');
    } else {
        btn.disabled = true;
        btn.classList.remove('ready');
    }
}

async function handleActivation() {
    const inputs = document.querySelectorAll('.digit-input');
    const btn = document.getElementById('btn-ativar-sistema');
    const statusText = document.getElementById('activation-status-text');
    const card = document.querySelector('.activation-card');
    
    if (!btn) return;

    const fullKey = Array.from(inputs).map(i => i.value).join('');

    inputs.forEach(i => i.disabled = true);
    btn.classList.add('loading');
    btn.innerHTML = '<div class="spinner"></div>';
    
    const messages = ["Verificando integridade...", "Validando hash...", "Liberando acesso..."];
    
    let msgIndex = 0;
    statusText.style.opacity = 1;
    statusText.innerText = messages[0];
    
    const msgInterval = setInterval(() => {
        msgIndex++;
        if (msgIndex < messages.length) {
            statusText.innerText = messages[msgIndex];
        }
    }, 900);

    await new Promise(resolve => setTimeout(resolve, 3000));
    
    clearInterval(msgInterval);

    const isValid = validarSerialKey(fullKey);

    if (isValid) {
        localStorage.setItem('ap_license_key', fullKey);
        activationState.isActivated = true;
        
        btn.classList.remove('loading');
        btn.classList.add('success');
        btn.innerHTML = '✅';
        statusText.innerText = "Ativação Concluída!";
        statusText.style.color = "#10b981";
        
        const catIcon = document.querySelector('.cat-lock-icon');
        if(catIcon) catIcon.textContent = '😺';

        if (typeof playConfettiAnimation === 'function') {
            playConfettiAnimation(btn);
        }

        setTimeout(() => {
            const screen = document.getElementById('activation-screen');
            if (screen) {
                screen.classList.add('fade-out'); 
                
                setTimeout(() => {
                    screen.style.display = 'none';
                    
                    const onboardingComplete = localStorage.getItem('ap_onboarding_complete') === 'true';
                    
                    const splash = document.getElementById('splash-screen');
                    if (splash) splash.style.display = 'none';

                    if (!onboardingComplete && typeof initWelcomeScreen === 'function') {
                        initWelcomeScreen();
                    } else if (typeof initMainApp === 'function') {
                        initMainApp(); 
                    } else {
                        go('home', { force: true });
                    }

                }, 1500);
            }
        }, 1500);

    } else {
        btn.classList.remove('loading');
        btn.innerHTML = 'Ativar';
        inputs.forEach(i => i.disabled = false);
        statusText.innerText = "Chave inválida. Verifique e tente novamente.";
        statusText.style.color = "#ef4444";
        
        card.classList.add('shake');
        setTimeout(() => card.classList.remove('shake'), 500);
        inputs[0].focus();
    }
}

function checkLicenseOnStartup() {
    const savedKey = localStorage.getItem('ap_license_key');
    
    if (savedKey && validarSerialKey(savedKey)) {
        activationState.isActivated = true;
        const screen = document.getElementById('activation-screen');
        if (screen) screen.style.display = 'none';
        return true; 
    } else {
        activationState.isActivated = false;
        const screen = document.getElementById('activation-screen');
        if (screen) {
            screen.style.display = 'flex';
            setupActivationUI(); 
        }
        return false; 
    }
}