const DIAS_SEMANA = [
    { id: 'dom', nome: 'Domingo', abrev: 'Dom' }, 
    { id: 'seg', nome: 'Segunda', abrev: 'Seg' },
    { id: 'ter', nome: 'Terça', abrev: 'Ter' }, 
    { id: 'qua', nome: 'Quarta', abrev: 'Qua' },
    { id: 'qui', nome: 'Quinta', abrev: 'Qui' },
    { id: 'sex', nome: 'Sexta', abrev: 'Sex' },
    { id: 'sab', nome: 'Sábado', abrev: 'Sab' }
];

const AUSENCIA_FOLGA_ID = 'ausencia_folga_system_id';
const AUSENCIA_FERIAS_ID = 'ausencia_ferias_system_id';
const AUSENCIA_AFASTAMENTO_ID = 'ausencia_afastamento_system_id';

const AUSENCIAS_SISTEMA = {
    [AUSENCIA_FOLGA_ID]: {
        id: AUSENCIA_FOLGA_ID,
        nome: "Folga/Janela",
        sigla: "FG",
        cor: "#d1fae5",
        isSystem: true,
    },
    [AUSENCIA_FERIAS_ID]: {
        id: AUSENCIA_FERIAS_ID,
        nome: "Férias",
        sigla: "FÉ",
        cor: "#cffafe",
        isSystem: true,
    },
    [AUSENCIA_AFASTAMENTO_ID]: {
        id: AUSENCIA_AFASTAMENTO_ID,
        nome: "Atestado/Licença",
        sigla: "LIC",
        cor: "#ffedd5",
        isSystem: true,
    },
};