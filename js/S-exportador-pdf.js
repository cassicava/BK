let currentHorarioToExport = null;

function showExportModal(horario) {
    currentHorarioToExport = horario;
    const backdrop = document.getElementById('exportModalBackdrop');
    const modal = document.getElementById('exportModal');
    if (!backdrop || !modal) return;

    backdrop.classList.remove('hidden', 'modal-hiding');
    void modal.offsetWidth;
    modal.classList.add('modal-showing');
}

function hideExportModal() {
    const backdrop = document.getElementById('exportModalBackdrop');
    const modal = document.getElementById('exportModal');
    if (!backdrop || !modal) return;

    backdrop.classList.add('modal-hiding');
    modal.classList.remove('modal-showing');

    backdrop.addEventListener('transitionend', () => {
        backdrop.classList.add('hidden');
        backdrop.classList.remove('modal-hiding');
    }, { once: true });
    
    currentHorarioToExport = null;
}

// Gera um PDF com a grade de TODAS as turmas (uma por página)
function generateGradeCompletaPDF(horario) {
    // Garante snapshot para consistência
    if (!horario.snapshot) {
        // Se não tiver snapshot, cria um rápido com os dados atuais (fallback)
        const { turmas, materias, professores, estruturas } = store.getState();
        horario.snapshot = { turmas: {}, materias: {}, professores: {}, estruturas: {} };
        // (Lógica simplificada de snapshot para exportação direta)
        turmas.forEach(t => horario.snapshot.turmas[t.id] = t);
        materias.forEach(m => horario.snapshot.materias[m.id] = m);
        professores.forEach(p => horario.snapshot.professores[p.id] = p);
        estruturas.forEach(e => horario.snapshot.estruturas[e.id] = e);
    }

    const { jsPDF } = window.jspdf;
    const doc = new jsPDF({ orientation: 'landscape', unit: 'pt', format: 'a4' });

    const turmasIds = [...new Set(horario.slots.map(s => s.turmaId))];
    
    // Recupera dados do snapshot
    const getTurma = (id) => horario.snapshot.turmas[id] || { nome: 'Turma Removida' };
    const getMateria = (id) => horario.snapshot.materias[id] || { nome: '---', sigla: '---', cor: '#eee' };
    const getProf = (id) => horario.snapshot.professores[id] || { nome: '---' };
    const getEstrutura = (id) => horario.snapshot.estruturas[id] || { nome: '', inicio: '07:00', fim: '12:00' };

    turmasIds.forEach((turmaId, index) => {
        if (index > 0) doc.addPage();

        const turma = getTurma(turmaId);
        const estrutura = getEstrutura(turma.estruturaId);

        // Cabeçalho da Página
        doc.setFontSize(18);
        doc.setTextColor(40);
        doc.text(turma.nome, 40, 40);
        
        doc.setFontSize(10);
        doc.setTextColor(100);
        doc.text(horario.nome, doc.internal.pageSize.getWidth() - 40, 40, { align: 'right' });
        doc.text(`Estrutura: ${estrutura.nome}`, 40, 55);

        // Configuração da Tabela
        const diasUteis = DIAS_SEMANA.filter(d => d.id !== 'dom' && d.id !== 'sab');
        const head = [['Horário', ...diasUteis.map(d => d.nome)]];

        // Calcula linhas (blocos de horário)
        const inicioMin = parseTimeToMinutes(estrutura.inicio);
        const fimMin = parseTimeToMinutes(estrutura.fim);
        const duracaoAula = 50;
        const totalBlocos = Math.floor((fimMin - inicioMin) / duracaoAula);

        const body = [];

        for (let b = 0; b < totalBlocos; b++) {
            const horaInicio = minutesToHHMM(inicioMin + (b * duracaoAula));
            const horaFim = minutesToHHMM(inicioMin + ((b + 1) * duracaoAula));
            const horarioLabel = `${horaInicio} - ${horaFim}`;

            const row = [horarioLabel];

            diasUteis.forEach(dia => {
                const slot = horario.slots.find(s => 
                    s.turmaId === turmaId && 
                    s.diaId === dia.id && 
                    s.blocoIndex === b
                );

                if (slot && slot.materiaId && slot.professorId) {
                    const mat = getMateria(slot.materiaId);
                    const prof = getProf(slot.professorId);
                    // Objeto especial para o autoTable customizar a célula
                    row.push({
                        content: `${mat.nome}\n(${prof.nome})`,
                        styles: { 
                            fillColor: mat.cor || '#fff',
                            textColor: getContrastingTextColor(mat.cor) === '#FFFFFF' ? 255 : 0
                        }
                    });
                } else {
                    row.push('---');
                }
            });
            body.push(row);
        }

        doc.autoTable({
            head: head,
            body: body,
            startY: 70,
            theme: 'grid',
            styles: {
                fontSize: 10,
                valign: 'middle',
                halign: 'center',
                cellPadding: 10,
                lineColor: [200, 200, 200],
                lineWidth: 0.5,
            },
            headStyles: {
                fillColor: [63, 81, 181],
                textColor: 255,
                fontStyle: 'bold'
            },
            columnStyles: {
                0: { fontStyle: 'bold', cellWidth: 80, fillColor: [245, 245, 245] }
            }
        });
    });

    return doc;
}

// Funções auxiliares de tempo (duplicadas para isolamento no PDF)
function parseTimeToMinutes(t) {
    if (!t) return 0;
    const [h, m] = t.split(':').map(Number);
    return h * 60 + m;
}

function minutesToHHMM(min) {
    const h = String(Math.floor(min / 60)).padStart(2, '0');
    const m = String(min % 60).padStart(2, '0');
    return `${h}:${m}`;
}

async function handleExport(exportFn) {
    if (!currentHorarioToExport) return;

    let horarioParaProcessar = JSON.parse(JSON.stringify(currentHorarioToExport));
    const isDirty = (currentHorario && currentHorario.id === horarioParaProcessar.id) && dirtyForms['gerar-horario'];

    if (isDirty) {
        const { confirmed } = await showConfirm({
            title: "Salvar Alterações?",
            message: "Existem alterações não salvas. Deseja salvar antes de gerar o PDF?",
            confirmText: "Salvar e Exportar",
            cancelText: "Exportar Sem Salvar"
        });

        if (confirmed) {
            await salvarHorarioAtual(); // Esta função está em L-controlador-geracao.js
            setGeradorFormDirty(false);
            // Recarrega do store para garantir dados atualizados
            const { horarios } = store.getState();
            horarioParaProcessar = horarios.find(h => h.id === horarioParaProcessar.id);
        }
    }

    hideExportModal();

    showLoader("Gerando PDF...");
    await new Promise(res => setTimeout(res, 100));

    try {
        const doc = exportFn(horarioParaProcessar);
        const nomeArquivo = `Grade_${horarioParaProcessar.nome.replace(/\s/g, '_')}.pdf`;
        doc.save(nomeArquivo);
        
        hideLoader();
        showDownloadToast(true);
    } catch (e) {
        console.error(e);
        hideLoader();
        showDownloadToast(false, "Erro ao gerar PDF.");
    }
}

function initPdfExport() {
    const btnCancel = document.getElementById('btnExportCancelar');
    if(btnCancel) btnCancel.addEventListener('click', hideExportModal);

    const btnGeral = document.getElementById('btnExportVisaoGeral');
    if(btnGeral) {
        btnGeral.addEventListener('click', () => {
            handleExport(generateGradeCompletaPDF);
        });
    }
}

document.addEventListener('DOMContentLoaded', initPdfExport);