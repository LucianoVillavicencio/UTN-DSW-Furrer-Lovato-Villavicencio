import type { Clase, TipoClase } from '../models/GymModels';

const MOCK_TIPOS_CLASE: TipoClase[] = [
  { id: 't1', nombre: 'CrossFit Intensity', descripcion: 'Entrenamiento funcional de alta intensidad.', caloriasAprox: 800 },
  { id: 't2', nombre: 'Spinning Pro', descripcion: 'Ciclismo indoor para mejorar resistencia cardiovascular.', caloriasAprox: 600 },
  { id: 't3', nombre: 'Power Yoga', descripcion: 'Mejora flexibilidad, fuerza de centro y reduce estrés.', caloriasAprox: 300 },
  { id: 't4', nombre: 'Musculación', descripcion: 'Entrenamiento clásico de sobrecarga.', caloriasAprox: 500 },
];

const MOCK_CLASES: Clase[] = [
  { id: 'c1', tipoClaseId: 't1', profesor: 'Juan Pérez', horario: '18:00', dia: 'Lunes', cupoMaximo: 20, cupoActual: 15 },
  { id: 'c2', tipoClaseId: 't2', profesor: 'Maria Gomez', horario: '19:00', dia: 'Lunes', cupoMaximo: 15, cupoActual: 15 },
  { id: 'c3', tipoClaseId: 't3', profesor: 'Ana Paula', horario: '08:00', dia: 'Martes', cupoMaximo: 25, cupoActual: 10 },
  { id: 'c4', tipoClaseId: 't1', profesor: 'Juan Pérez', horario: '20:00', dia: 'Miércoles', cupoMaximo: 20, cupoActual: 5 },
  { id: 'c5', tipoClaseId: 't4', profesor: 'Carlos Tevez', horario: '07:00', dia: 'Jueves', cupoMaximo: 30, cupoActual: 20 },
];

export const getTiposClase = (): Promise<TipoClase[]> => {
  return new Promise((resolve) => setTimeout(() => resolve(MOCK_TIPOS_CLASE), 500));
};

export const getClases = (): Promise<Clase[]> => {
  return new Promise((resolve) => setTimeout(() => resolve(MOCK_CLASES), 500));
};

export const reservarTurno = (claseId: string, clienteId: string): Promise<boolean> => {
    return new Promise((resolve, reject) => {
        setTimeout(() => {
            const clase = MOCK_CLASES.find(c => c.id === claseId);
            if(clase && clase.cupoActual < clase.cupoMaximo){
                // Solo simulando
                clase.cupoActual++;
                resolve(true);
            } else {
                reject(new Error('Cupo lleno o clase inexistente'));
            }
        }, 800);
    })
};
