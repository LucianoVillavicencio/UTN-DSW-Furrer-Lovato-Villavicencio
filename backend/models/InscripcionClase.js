export class InscripcionClase {
    constructor(
        idInscripcion,
        estado,
        fecha,
        idTurno,
        idUsuario
    ) {
        this.idInscripcion = idInscripcion;
        this.estado = estado;
        this.fecha = fecha;

        // Relación 1 con TurnoClase aclaro por las dudas jeje
        this.idTurno = idTurno;

        // Relación 1 con Usuario lo mismo!!!
        this.idUsuario = idUsuario;
    }
}