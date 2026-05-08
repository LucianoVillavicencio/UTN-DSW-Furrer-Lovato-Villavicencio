import { useState, useEffect } from 'react';
import type { Clase, TipoClase } from '../models/GymModels';
import { getClases, getTiposClase, reservarTurno } from '../services/apiService';
import ClassCard from '../components/ClassCard';
import { X, Flame } from 'lucide-react';
import './Classes.css';

const Classes = () => {
  const [clases, setClases] = useState<Clase[]>([]);
  const [tipos, setTipos] = useState<TipoClase[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterDia, setFilterDia] = useState<string>('Todos');
  const [selectedClase, setSelectedClase] = useState<Clase | null>(null);

  useEffect(() => {
    Promise.all([getClases(), getTiposClase()]).then(([clasesData, tiposData]) => {
      setClases(clasesData);
      setTipos(tiposData);
      setLoading(false);
    });
  }, []);

  const getTipo = (tipoId: string) => tipos.find(t => t.id === tipoId);
  const getTipoNombre = (tipoId: string) => getTipo(tipoId)?.nombre || 'Clase';

  const handleReserve = async (claseId: string) => {
    try {
      await reservarTurno(claseId, 'cliente_mock_123');
      alert('Reserva exitosa!');
      // Cerrar modal y actualizar estado
      setSelectedClase(null);
      const updated = await getClases();
      setClases(updated);
    } catch (error) {
      alert((error as Error).message);
    }
  };

  const filteredClases = filterDia === 'Todos' 
    ? clases 
    : clases.filter(c => c.dia.toLowerCase() === filterDia.toLowerCase());

  return (
    <div className="container mt-4 mb-5 animate-fade-in relative">
      <div className="d-flex flex-column flex-md-row justify-between align-center mb-4">
        <h1 className="section-title text-gradient">Nuestras Clases</h1>
        
        <div className="filter-container d-flex align-center gap-2 mt-2">
          <label htmlFor="filterDia" className="text-secondary">Filtrar por Día:</label>
          <select 
            id="filterDia" 
            className="modern-select"
            value={filterDia}
            onChange={(e) => setFilterDia(e.target.value)}
          >
            <option value="Todos">Todos</option>
            <option value="Lunes">Lunes</option>
            <option value="Martes">Martes</option>
            <option value="Miércoles">Miércoles</option>
            <option value="Jueves">Jueves</option>
            <option value="Viernes">Viernes</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div className="text-center mt-5 text-secondary">Cargando clases...</div>
      ) : (
        <div className="classes-list">
          {filteredClases.map(clase => (
            <ClassCard 
              key={clase.id} 
              clase={clase} 
              tipoNombre={getTipoNombre(clase.tipoClaseId)}
              onReserve={() => setSelectedClase(clase)}
            />
          ))}
          {filteredClases.length === 0 && (
            <div className="text-secondary col-span-full mt-3 text-center">
              No se encontraron clases programadas para este día.
            </div>
          )}
        </div>
      )}

      {/* Modal / Overlay Detalle */}
      {selectedClase && (
        <div className="modal-overlay" onClick={() => setSelectedClase(null)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setSelectedClase(null)}>
              <X size={24} />
            </button>
            <h2 className="text-gradient mb-1">{getTipoNombre(selectedClase.tipoClaseId)}</h2>
            <span className="class-badge mb-3 d-inline-block">{selectedClase.dia} - {selectedClase.horario}</span>
            
            <p className="mb-3 text-secondary">
              {getTipo(selectedClase.tipoClaseId)?.descripcion}
            </p>
            
            <div className="d-flex align-center gap-1 mb-4">
              <Flame color="var(--brand-primary)" size={20}/>
              <span>Quema aprox: <strong>{getTipo(selectedClase.tipoClaseId)?.caloriasAprox} kcal</strong></span>
            </div>

            <div className="d-flex justify-between align-center">
              <div className="text-secondary">
                Profesor: <strong className="text-primary">{selectedClase.profesor}</strong>
              </div>
              <button 
                className="btn btn-primary"
                onClick={() => handleReserve(selectedClase.id)}
              >
                Confirmar Reserva
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Classes;
