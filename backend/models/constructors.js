//constructores 

export class TipoClase {
    constructor(idTipoClase, nombre, descripcion) {
        this.idTipoClase = idTipoClase;
        this.nombre = nombre;
        this.descripcion = descripcion;
    }
}

export class Profesor {
    constructor(idProfe, nombre, especialidad, email) {
        this.idProfe = idProfe;
        this.nombre = nombre;
        this.especialidad = especialidad;
        this.email = email;
    }
}

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

        // Relación 1 con Clase.
        this.idClase = idClase;
    }
}

export class Usuario {
    constructor(
        idUsuario,
        nombre,
        email,
        telefono,
        rol
    ) {
        this.idUsuario = idUsuario;
        this.nombre = nombre;
        this.email = email;
        this.telefono = telefono;
        this.rol = rol;
    }
}


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

        // Relación 1 con TurnoClase.
        this.idTurno = idTurno;

        // Relación 1 con Usuario.
        this.idUsuario = idUsuario;
    }
}

export class Plan {
    constructor(
        idPlan,
        nombre,
        precio,
        cantDias
    ) {
        this.idPlan = idPlan;
        this.nombre = nombre;
        this.precio = precio;
        this.cantDias = cantDias;
    }
}

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

        // Relación 1 con Suscripcion.
        this.idSuscripcion = idSuscripcion;
    }
}


