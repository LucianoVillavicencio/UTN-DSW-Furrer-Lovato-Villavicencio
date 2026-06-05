export class Suscripcion {
    constructor(
        idSuscripcion,
        fechaInicio,
        fechaFin,
        estado,
        idUsuario,
        idPlan
    ) {
        this.idSuscripcion = idSuscripcion;
        this.fechaInicio = fechaInicio;
        this.fechaFin = fechaFin;
        this.estado = estado;

        // Relación 0..1 con Usuario.
        this.idUsuario = idUsuario;

        // Relación 1 con Plan.
        this.idPlan = idPlan;
    }
}