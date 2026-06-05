export class Pago {
    constructor(
        precio,
        medioPago,
        fecha,
        idSuscripcion
    ) {
        this.precio = precio;
        this.medioPago = medioPago;
        this.fecha = fecha;

        // Relación 1 con Suscripcion, lo mismo que antes, lo de bdd. :)
        this.idSuscripcion = idSuscripcion;
    }
}