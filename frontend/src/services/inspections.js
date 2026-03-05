import api from './api';

const MOCK_INSPECTIONS = {
    success: true,
    tiposValoracion: [
        {
            TipoValoracionID: 1,
            TipoValoracionValor: "EXTERIORES",
            Valoraciones: [
                { ValoracionID: 1, ValoracionDescripcion: "UNIDAD DE LUCES" },
                { ValoracionID: 2, ValoracionDescripcion: "1/4 LUCES" },
                { ValoracionID: 3, ValoracionDescripcion: "ANTENA" },
                { ValoracionID: 4, ValoracionDescripcion: "ESPEJO LATERAL" },
                { ValoracionID: 5, ValoracionDescripcion: "CRISTALES" }
            ]
        },
        {
            TipoValoracionID: 2,
            TipoValoracionValor: "INTERIORES",
            Valoraciones: [
                { ValoracionID: 6, ValoracionDescripcion: "INSTRUMENTOS DE TABLERO" },
                { ValoracionID: 7, ValoracionDescripcion: "CALEFACCION" },
                { ValoracionID: 8, ValoracionDescripcion: "RADIO" },
                { ValoracionID: 9, ValoracionDescripcion: "BOCINAS" },
                { ValoracionID: 10, ValoracionDescripcion: "ENCENDEDOR" }
            ]
        }
    ]
};

export const getInspectionChecklist = async () => {
    try {
        // Pointing directly to native .173 endpoint
        const response = await api.post('/valoraciones/listar', {});
        return response.data;
    } catch (error) {
        console.error("Error fetching inspection checklist:", error);
        throw error;
    }
};

export const saveInspections = async (inspections) => {
    try {
        // inspections: Array of { OrdenID, ValoracionID, InspeccionValor }
        // Pointing directly to port 3000 on .173
        const response = await api.post('http://172.16.71.173:8000/api/inspeccion/guardar', inspections);
        return response.data;
    } catch (error) {
        console.error("Error saving inspections:", error);
        throw error;
    }
};
