let horarioParaEditar = null; 
const horariosSalvosState = {
    ano: null,
};

function renderFiltroHorariosAno() {
    const { horarios } = store.getState();
    const container = document.getElementById("listaEscalasContainer"); 
    if (!container) return;

    let filtroContainer = container.querySelector('.filtros-container');
    if (!filtroContainer) {
        filtroContainer = document.createElement('div');
        filtroContainer.className = 'grid-2-col';
        filtroContainer.style.marginBottom = '24px';
        container.insertBefore(filtroContainer, document.getElementById("listaEscalas"));
    }

    filtroContainer.innerHTML = `
        <div class="form-group">
            <label class="form-label">Filtrar por Ano de Criação</label>
            <select id="filtroHorariosAno"></select>
        </div>
    `;

    const anoSelect = document.getElementById("filtroHorariosAno");
    
    // Extrai anos dos horários salvos
    const anosDisponiveis = [...new Set(horarios.map(h => {
        // Tenta pegar o ano da data de criação/modificação
        const dateStr = h.lastModified || h.id; 
        return new Date(dateStr).getFullYear() || new Date().getFullYear();
    }))].sort((a, b) => b - a);
    
    anoSelect.innerHTML = `<option value="">Todos os Anos</option>`;
    anosDisponiveis.forEach(ano => {
        const option = document.createElement('option');
        option.value = ano;
        option.textContent = ano;
        anoSelect.appendChild(option);
    });

    anoSelect.addEventListener('change', () => {
        horariosSalvosState.ano = anoSelect.value;
        renderHorariosList();
    });
}

function renderHorariosList() {
    const { horarios } = store.getState();
    const container = document.getElementById("listaEscalas");
    container.innerHTML = ""; 

    const { ano } = horariosSalvosState;

    const horariosFiltrados = horarios.filter(h => {
        if (!ano) return true;
        const hAno = new Date(h.lastModified || new Date()).getFullYear();
        return hAno.toString() === ano;
    });

    if (horariosFiltrados.length === 0) {
        const msg = horarios.length === 0 ? "Nenhuma grade horária salva ainda." : "Nenhuma grade encontrada para o filtro selecionado.";
        container.innerHTML = `<p class="muted" style="text-align: center; padding: 16px;">${msg}</p>`;
        return;
    }

    // Ordena por data de modificação (mais recente primeiro)
    horariosFiltrados.sort((a, b) => new Date(b.lastModified) - new Date(a.lastModified));

    const gridContainer = document.createElement('div');
    gridContainer.className = 'card-grid';
    container.appendChild(gridContainer);

    horariosFiltrados.forEach(horario => {
        const temAulasNaoAlocadas = horario.aulasNaoAlocadas && horario.aulasNaoAlocadas.length > 0;
        const statusIcon = temAulasNaoAlocadas ? '⚠️' : '✅';
        const statusClass = temAulasNaoAlocadas ? 'status-warning' : 'status-ok';
        const statusTitle = temAulasNaoAlocadas ? 'Grade com aulas não alocadas' : 'Grade completa';

        const card = document.createElement("div");
        card.className = "escala-card";
        card.dataset.viewId = horario.id;
        
        const dataCriacao = new Date(horario.lastModified).toLocaleDateString('pt-BR');
        const horaCriacao = new Date(horario.lastModified).toLocaleTimeString('pt-BR', {hour: '2-digit', minute:'2-digit'});

        // Contagem de turmas na grade
        const turmasCount = new Set(horario.slots.map(s => s.turmaId)).size;

        card.innerHTML = `
            <div class="escala-card-status ${statusClass}" title="${statusTitle}">${statusIcon}</div>
            <div class="escala-card-content">
                <h3>${horario.nome}</h3>
                <p class="muted">
                    <strong>${turmasCount}</strong> Turmas<br>
                    Atualizado em: ${dataCriacao} às ${horaCriacao}
                </p>
            </div>
        `;
        gridContainer.appendChild(card);
    });

    parseEmojisInElement(container);
}

function verHorarioSalvo(id) {
    const { horarios } = store.getState();
    const horario = horarios.find(h => h.id === id);
    if (horario) {
        horarioParaEditar = horario;
        currentHorario = horario; 
        horario.owner = 'salva';

        document.getElementById("escalaSalvaViewTitle").textContent = horario.nome || 'Visualização da Grade';
        
        // Renderiza a tabela no modo somente leitura (inicialmente)
        // O modo de edição é ativado via botão "Editar"
        renderHorarioTable(horario); 
        
        document.getElementById("btnExportarPDF").onclick = () => showExportModal(horario);

        document.getElementById('listaEscalasContainer').classList.add('hidden');
        document.getElementById('escalaSalvaView').classList.remove('hidden');
        parseEmojisInElement(document.getElementById('escalaSalvaView'));
    }
}

function editHorarioSalvo() {
    if (horarioParaEditar) {
        // Redireciona para o gerador no modo de edição
        go('gerar-horario', {
            horarioParaEditar: JSON.parse(JSON.stringify(horarioParaEditar)),
            isEditing: true
        });
    }
}

async function excluirHorarioSalvo(id) {
    const confirmado = await handleDeleteItem({
        id: id,
        itemName: 'Grade Horária',
        dispatchAction: 'DELETE_HORARIO_SALVO'
    });

    if (confirmado) {
        document.getElementById('escalaSalvaView').classList.add('hidden');
        document.getElementById('listaEscalasContainer').classList.remove('hidden');
        horarioParaEditar = null;
        currentHorario = null; 
        renderHorariosList();
    }
}

function handleHorariosSalvosContainerClick(event) {
    const card = event.target.closest('.escala-card[data-view-id]');
    if (card) {
        verHorarioSalvo(card.dataset.viewId);
    }
}

function initHorariosSalvosPage() {
    // Configura filtro inicial
    renderFiltroHorariosAno();

    const btnVoltar = document.getElementById("btnVoltarParaLista");
    if (btnVoltar) {
        btnVoltar.textContent = "< Voltar para a Lista"; 
        btnVoltar.style.width = 'fit-content'; 
        btnVoltar.onclick = () => {
            document.getElementById('escalaSalvaView').classList.add('hidden');
            document.getElementById('listaEscalasContainer').classList.remove('hidden');
            horarioParaEditar = null;
            currentHorario = null;
        };
    }

    document.getElementById("btnEditarEscalaSalva").onclick = editHorarioSalvo;

    document.getElementById("btnExcluirEscalaSalva").onclick = () => {
        if (horarioParaEditar) {
            excluirHorarioSalvo(horarioParaEditar.id);
        }
    };
    
    // O botão de exportar já tem listener atribuído em verHorarioSalvo, mas bom garantir o modal
    const exportBtn = document.getElementById("btnExportarPDF");
    if(exportBtn) {
        exportBtn.onclick = () => {
            if(horarioParaEditar) {
                showExportModal(horarioParaEditar);
            }
        };
    }

    const listaContainer = document.getElementById("listaEscalas");
    if(listaContainer) {
        listaContainer.addEventListener('click', handleHorariosSalvosContainerClick);
    }

    renderHorariosList();
}

document.addEventListener('DOMContentLoaded', initHorariosSalvosPage);