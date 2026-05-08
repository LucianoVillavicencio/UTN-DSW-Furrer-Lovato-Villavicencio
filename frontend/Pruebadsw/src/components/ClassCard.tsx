import { MapPin, Clock, User } from 'lucide-react';
import type { Clase } from '../models/GymModels';
import './ClassCard.css';

interface ClassCardProps {
  clase: Clase;
  tipoNombre: string;
  onReserve: (claseId: string) => void;
}

const ClassCard = ({ clase, tipoNombre, onReserve }: ClassCardProps) => {
  const isFull = clase.cupoActual >= clase.cupoMaximo;

  return (
    <div className="card class-card d-flex flex-column justify-between container-gap">
      <div>
        <div className="class-card-header d-flex justify-between align-center">
          <h3 className="m-0 text-gradient">{tipoNombre}</h3>
          <span className="class-badge text-primary">{clase.dia}</span>
        </div>
        
        <div className="class-details mt-2 d-flex flex-column gap-1 text-secondary">
          <div className="d-flex align-center gap-1">
            <Clock size={16} /> <span>{clase.horario}</span>
          </div>
          <div className="d-flex align-center gap-1">
            <User size={16} /> <span>{clase.profesor}</span>
          </div>
          <div className="d-flex align-center gap-1">
            <MapPin size={16} /> <span>Sala Principal</span>
          </div>
        </div>
      </div>

      <div className="mt-3 d-flex justify-between align-center class-card-footer">
        <div className="cupo-info">
          <span style={{ color: isFull ? 'var(--error)' : 'var(--success)', fontWeight: 600 }}>
            {clase.cupoActual} / {clase.cupoMaximo}
          </span>
          <span className="text-secondary ml-1" style={{marginLeft: 4, fontSize: '0.85rem'}}>inscriptos</span>
        </div>
        
        <button 
          className="btn btn-primary" 
          disabled={isFull}
          onClick={() => onReserve(clase.id)}
        >
          {isFull ? 'Agotado' : 'Reservar'}
        </button>
      </div>
    </div>
  );
};

export default ClassCard;
