export class TurnoClase {
    constructor(
        idTurno,
        fecha,
        horario,
        fechaLimiteCancelacion,
        cupoMax,
        cupoDisponible,
        estado,
        idClase
    ) {
        this.idTurno = idTurno;
        this.fecha = fecha;
        this.horario = horario;
        this.fechaLimiteCancelacion = fechaLimiteCancelacion;
        this.cupoMax = cupoMax;
        this.cupoDisponible = cupoDisponible;
        this.estado = estado;
        this.idClase = idClase;
    }
}