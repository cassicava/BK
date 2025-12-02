const helpContentData = {
    home: {
        title: "Ajuda: Tela Inicial",
        content: `
            <div class="help-card">
                <h4>🏠 Bem-vindo ao Aula Pro!</h4>
                <p>Esta é a sua central de controle. A partir daqui, você acessa todas as funcionalidades para criar e gerenciar grades horárias escolares.</p>
                <p>O fluxo recomendado para começar é seguir os passos na ordem dos cards de <strong>Cadastros Essenciais</strong>.</p>
            </div>
            <div class="help-card">
                <h4>📝 Cadastros Essenciais (Passos 1-4)</h4>
                <p><strong>Passo 1: 🕒 Estruturas:</strong> Defina os períodos de aula (Manhã, Tarde, Integral). Configure o horário de início e fim das aulas para cada período.</p>
                <p><strong>Passo 2: 📚 Matérias:</strong> Cadastre as disciplinas oferecidas pela escola (ex: Matemática, Português, História). Defina uma sigla e cor para cada uma.</p>
                <p><strong>Passo 3: 👨‍🏫 Professores:</strong> Cadastre seu corpo docente. O mais importante aqui é indicar <strong>quais matérias</strong> cada professor leciona e sua <strong>disponibilidade</strong> na semana.</p>
                <p><strong>Passo 4: 🎓 Turmas:</strong> Crie as classes (ex: 6º Ano A, 9º Ano B) e defina qual Estrutura de Horário elas seguem.</p>
            </div>
            <div class="help-card">
                <h4>⚙️ Geração e Gerenciamento</h4>
                <p>Com os dados cadastrados, você pode:</p>
                <p><strong>✨ Gerar Horário:</strong> Use o assistente inteligente para definir a Matriz Curricular (quantas aulas de cada matéria por turma) e deixe o sistema montar a grade automaticamente.</p>
                <p><strong>🗂️ Horários Salvos:</strong> Acesse, edite ou exporte grades criadas anteriormente.</p>
                <p><strong>📈 Relatórios:</strong> Visualize a distribuição de carga horária dos professores e estatísticas da grade.</p>
            </div>
        `
    },
    estruturas: {
        title: "Ajuda: Estruturas de Horário",
        content: `
            <div class="help-card">
                <h4>🕒 O que é uma Estrutura?</h4>
                <p>Uma Estrutura define o "esqueleto" de tempo que uma turma segue. Por exemplo, uma estrutura "Manhã" pode ter aulas das 07:00 às 12:20.</p>
            </div>
            <div class="help-card">
                <h4>📝 Criando uma Estrutura</h4>
                <p>Defina um nome (ex: "Ensino Médio - Manhã") e o horário global de início e fim.</p>
                <p>O sistema usará esses limites para calcular os blocos de aula. Posteriormente, ao visualizar a grade, as aulas serão distribuídas dentro desse intervalo.</p>
            </div>
        `
    },
    materias: {
        title: "Ajuda: Cadastro de Matérias",
        content: `
            <div class="help-card">
                <h4>📚 Disciplinas Escolares</h4>
                <p>Aqui você cadastra todas as matérias que compõem o currículo da escola.</p>
                <p><strong>Sigla:</strong> Defina uma sigla curta (3-4 letras) para facilitar a visualização na grade horária compacta.</p>
                <p><strong>Cor:</strong> A cor escolhida será usada para "pintar" as aulas dessa matéria na grade, ajudando a identificar visualmente a distribuição das disciplinas.</p>
            </div>
        `
    },
    professores: {
        title: "Ajuda: Cadastro de Professores",
        content: `
            <div class="help-card">
                <h4>👨‍🏫 Perfil do Docente</h4>
                <p>Cadastre o nome e contato do professor. As informações cruciais para a geração do horário são:</p>
            </div>
            <div class="help-card">
                <h4>📘 Matérias Habilitadas</h4>
                <p>Selecione todas as disciplinas que este professor está apto a lecionar. O gerador só alocará aulas destas matérias para ele.</p>
            </div>
             <div class="help-card">
                <h4>🗓️ Disponibilidade</h4>
                <p>Indique quando o professor pode dar aula:</p>
                <p><strong>Ative a Estrutura:</strong> Se ele dá aula de manhã, ative a estrutura "Manhã".</p>
                <p><strong>Defina os Dias:</strong> Clique nos dias da semana para alternar:</p>
                <p>• <strong>Indisponível (cinza):</strong> O professor não pode dar aula neste dia/período.</p>
                <p>• <strong>Disponível (azul):</strong> O professor pode ser alocado.</p>
                <p>• <strong>Preferencial (listrado):</strong> O sistema tentará priorizar estes dias.</p>
            </div>
        `
    },
    turmas: {
        title: "Ajuda: Cadastro de Turmas",
        content: `
            <div class="help-card">
                <h4>🎓 Classes</h4>
                <p>Uma turma representa um grupo de alunos que assiste às aulas juntos (ex: "1º Ano A").</p>
            </div>
            <div class="help-card">
                <h4>🔗 Vínculo com Estrutura</h4>
                <p>Toda turma deve estar ligada a uma <strong>Estrutura de Horário</strong>. Isso diz ao sistema que a "Turma A" estuda de manhã e a "Turma B" estuda à tarde, por exemplo.</p>
                <p>O gerador usará essa informação para saber em quais horários deve alocar as aulas.</p>
            </div>
        `
    },
    'gerar-horario': {
        title: "Ajuda: Geração de Horário",
        content: `
            <div class="help-card">
                <h4>✨ O Assistente</h4>
                <p>O processo de criação da grade é dividido em 3 etapas:</p>
                <p><strong>1. Escopo:</strong> Selecione quais Turmas e quais Professores participarão desta grade.</p>
                <p><strong>2. Matriz Curricular:</strong> Este é o passo mais importante. Para cada Turma selecionada, informe quantas aulas semanais de cada Matéria são necessárias (ex: 5 de Matemática, 2 de História).</p>
                <p><strong>3. Geração:</strong> O sistema cruzará a demanda (Matriz) com a oferta (Disponibilidade dos Professores) para preencher a grade, tentando evitar conflitos (choques de horário) e janelas.</p>
            </div>
            <div class="help-card">
                <h4>🎨 Edição Manual</h4>
                <p>Após gerar, você verá a grade. Se restarem "buracos" (aulas vagas), você pode clicar na célula vazia.</p>
                <p>O <strong>Assistente de Alocação</strong> abrirá e mostrará apenas os professores que:</p>
                <ul>
                    <li>Lecionam a matéria que falta.</li>
                    <li>Têm disponibilidade naquele dia/horário.</li>
                    <li>Não estão dando aula em outra turma no mesmo momento.</li>
                </ul>
            </div>
        `
    },
    'horarios-salvos': {
        title: "Ajuda: Horários Salvos",
        content: `
            <div class="help-card">
                <h4>📂 Seu Histórico</h4>
                <p>Aqui ficam guardadas todas as grades que você gerou e salvou. Você pode filtrar por ano de criação.</p>
            </div>
            <div class="help-card">
                <h4>⚙️ Ações</h4>
                <p>Ao abrir uma grade salva, você pode:</p>
                <p><strong>✏️ Editar:</strong> Reabre o editor manual para fazer ajustes finos.</p>
                <p><strong>🖨️ Exportar PDF:</strong> Gera um arquivo pronto para impressão. Você pode escolher entre a grade completa (todas as turmas) ou relatórios específicos.</p>
                <p><strong>🔥 Excluir:</strong> Remove a grade permanentemente.</p>
            </div>
        `
    },
    relatorios: {
        title: "Ajuda: Relatórios",
        content: `
            <div class="help-card">
                <h4>📊 Análise da Grade</h4>
                <p>Visualize estatísticas sobre a grade horária gerada.</p>
                <p><strong>Visão Geral:</strong> Mostra o total de aulas alocadas, distribuição por matéria e ranking de carga horária dos professores.</p>
                <p><strong>Análise Individual:</strong> Selecione um professor para ver sua grade específica, total de aulas e em quais turmas ele está lecionando.</p>
            </div>
        `
    },
    configuracoes: {
        title: "Ajuda: Configurações",
        content: `
            <div class="help-card">
                <h4>⚙️ Geral</h4>
                <p>Defina seu nome de usuário para a tela de boas-vindas.</p>
            </div>
            <div class="help-card">
                <h4>💾 Backup e Dados</h4>
                <p><strong>Importante:</strong> O Aula Pro salva tudo no seu navegador. Use a opção <strong>📤 Exportar</strong> frequentemente para salvar um arquivo de backup (<code>.json</code>) no seu computador.</p>
                <p>Se trocar de computador ou limpar o navegador, use <strong>📥 Importar</strong> para recuperar seus dados.</p>
            </div>
            <div class="help-card">
                <h4>⚠️ Zona de Perigo</h4>
                <p>A opção "Apagar Todos os Dados" reseta o sistema para o estado inicial (como se acabasse de instalar). Use com cuidado!</p>
            </div>
        `
    }
};

const contextHelpBtn = document.getElementById('context-help-btn');
const helpPanel = document.getElementById('help-panel');
const helpPanelBackdrop = document.getElementById('help-panel-backdrop');
const helpPanelTitle = document.getElementById('help-panel-title');
const helpPanelContent = document.getElementById('help-panel-content');
const helpPanelCloseBtn = document.getElementById('help-panel-close-btn');
const body = document.body;

function toggleHelpPanel(show) {
    if (show) {
        body.classList.remove('help-panel-hiding');
        body.classList.add('help-panel-active');
        if(helpPanelContent) helpPanelContent.scrollTop = 0;
    } else {
        body.classList.add('help-panel-hiding');
        setTimeout(() => {
            body.classList.remove('help-panel-active');
            body.classList.remove('help-panel-hiding');
        }, 400); 
    }
}

function loadHelpContent(pageId) {
    const helpData = helpContentData[pageId];

    if (helpData) {
        helpPanelTitle.textContent = helpData.title;
        helpPanelContent.innerHTML = helpData.content;
        parseEmojisInElement(helpPanelContent); 
        return true; 
    } else {
        helpPanelTitle.textContent = 'Ajuda';
        helpPanelContent.innerHTML = '<p class="muted">Não há ajuda disponível para esta seção.</p>';
        return false; 
    }
}

if (contextHelpBtn) {
    contextHelpBtn.addEventListener('click', () => toggleHelpPanel(true));
}

if (helpPanelCloseBtn) {
    helpPanelCloseBtn.addEventListener('click', () => toggleHelpPanel(false));
}

if (helpPanelBackdrop) {
    helpPanelBackdrop.addEventListener('click', () => toggleHelpPanel(false));
}

document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && body.classList.contains('help-panel-active')) {
        toggleHelpPanel(false);
    }
});