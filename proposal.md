# Propuesta TP DSW
## Grupo
### Integrantes
* 47853 - Furrer, Francisco
* 52200 - Lovato, Gabriel
* 52118 - Villavicencio, Luciano
### Repositorios
*front
*back
## Tema
### Descripcion
Plataforma de gestión integral para un gimnasio ("FLG gym"). El sistema permite a los administradores gestionar la oferta de actividades, membresías y horarios, mientras que los socios pueden visualizar clases disponibles, reservar turnos, realizar el seguimiento de su plan de entrenamiento y abonar su cuota.

## Alcance Funcional
### Alcance Mínimo
Regularidad:
| Req| Detalle |
| :--- | :--- |
| CRUD simple | 1. CRUD Cliente <br> 2. CRUD Profesor <br> 3. CRUD Clase <br> 4. CRUD Plan |
| CRUD dependiente | 1. CRUD TurnoClase {depende de} CRUD Clase|
| Listado + detalle | 1. Listado de médicos filtrado por especialidad, muestra cantidad de médicos segun descripción de su especialidad <br> 2. Listado de agenda filtrado por turnos disponibles, muestra fecha y horario del turno |
| CUU/Epic | 1. Registrar cliente <br> 2. Iniciar sesión como cliente |

Adicionales para Aprobación
| Req| Detalle |
| :--- | :--- |
| CRUD | 1. CRUD Cliente <br> 2. CRUD Profesor <br> 3. CRUD Clase <br> 4. CRUD Plan <br> 5. CRUD Suscripcion|
| CUU/Epic | 1. Registrar cliente <br> 2. Iniciar sesión como cliente <br> 3. Suscribirse a plan <br> 4. Sacar turno clase|

## Alcance Adicional Voluntario
| Req| Detalle |
| :--- | :--- |
|Listados | 1. Listado de clientes por clase <br> 2. Listado de profesores por dia|
| CUU/Epic | 1. Cancelar turno clase <br> 2. Dar de baja plan|
| Otros | 1. Envío de notificación de turno clase por email|
