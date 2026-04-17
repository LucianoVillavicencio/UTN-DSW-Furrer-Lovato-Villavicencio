# Propuesta TP DSW
## Grupo
### Integrantes
* 47853 - Furrer, Francisco
* 52200 - Lovato, Gabriel
* 52118 - Villavicencio, Luciano
### Repositorios
* [frontend app](https://github.com/Luchov21/dsw-frontend)
* [backend app](https://github.com/Luchov21/dsw-backend)
## Tema
### Descripcion
Plataforma de gestión integral para un gimnasio ("FLG gym"). El sistema permite a los administradores gestionar la oferta de actividades, membresías y horarios, mientras que los socios pueden visualizar clases disponibles, reservar turnos, realizar el seguimiento de su plan de entrenamiento y abonar su cuota.

### Modelo 
<img width="722" height="908" alt="Modelo de dominio drawio" src="https://github.com/Luchov21/UTN-DSW-Furrer-Lovato-Villavicencio/blob/main/assets/MD.png?raw=true" />
https://drive.google.com/file/d/1EZ-wqlKdT2rGOhtkX18ta1ObDnXsWP4Q/view

## Alcance Funcional
### Alcance Mínimo
Regularidad:
| Req| Detalle |
| :--- | :--- |
| CRUD simple | 1. CRUD Cliente <br> 2. CRUD tipoClase <br> 3. CRUD Plan |
| CRUD dependiente | 1. CRUD TurnoClase {depende de} CRUD Clase <br> 2. CRUD Clase {depende de} CRUD tipoClase |
| Listado + detalle | 1. Filtrado por fecha o tipoClase. Al seleccionar uno, muestra los alumnos inscriptos y el cupo restante. <br> 2. Filtrado por nombre o email. Al seleccionar uno, muestra su historial de inscripciones y estado de suscripción. |
| CUU/Epic | 1. Registrar cliente |

Adicionales para Aprobación
| Req| Detalle |
| :--- | :--- |
| CRUD | 1. CRUD Cliente <br> 2. CRUD tipoClase <br> 3. CRUD Plan <br> 4. CRUD Profesor <br> 5. CRUD Suscripcion <br> 6. CRUD Pago <br> 7.CRUD TurnoClase <br> 8. CRUD InscripcionClase <br> 9. CRUD Clase  |
| CUU/Epic | 1. Iniciar sesión como cliente <br> 2. Gestión de Suscripción y Pago <br> 3. Reserva de Turno con Validación|

## Alcance Adicional Voluntario
| Req| Detalle |
| :--- | :--- |
|Listados | 1. Listado de clientes por clase <br> 2. Listado de profesores por dia|
| CUU/Epic | 1. Cancelar turno clase <br> 2. Dar de baja plan|
| Otros | 1. Envío de notificación de turno clase por email|
