export class Clase {
    constructor(
        idClase,
        nombre,
        descripcion,
        estado,
        idTipoClase,
        idProfe
    ) {
        this.idClase = idClase;
        this.nombre = nombre;
        this.descripcion = descripcion;
        this.estado = estado;

        // Relación 1 con TipoClase.
        // Cuando una relación es 1 a muchos, la clave foránea
        // se almacena del lado muchos, Gabi vos capaz lo viste en entornos
        //sino en bdd lo van a explicar
        this.idTipoClase = idTipoClase;

        // Relación 1 con Profesor, lo mismo de antes
        this.idProfe = idProfe;
    }
}