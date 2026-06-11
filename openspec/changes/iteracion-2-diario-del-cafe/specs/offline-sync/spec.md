# offline-sync

## ADDED Requirements

### Requirement: Registro de extracciones sin conexión
Cuando el insert de una extracción falle por falta de red, el sistema SHALL encolarla en IndexedDB con un id UUID generado en cliente y confirmar al usuario que quedó pendiente de sincronizar.

#### Scenario: Guardar brew sin red
- **WHEN** el usuario guarda una extracción sin conexión
- **THEN** la extracción se encola localmente y la UI confirma «guardada, pendiente de sincronizar»

### Requirement: Sincronización automática e idempotente
El sistema SHALL reintentar los inserts pendientes al recuperar la conexión (evento `online`) y al arrancar la app, usando el id UUID original de cada entrada para que un reintento duplicado sea descartado por la clave primaria.

#### Scenario: Vuelve la conexión
- **WHEN** el dispositivo recupera la red con extracciones encoladas
- **THEN** se insertan en Supabase y desaparecen de la cola

#### Scenario: Reintento duplicado
- **WHEN** un insert encolado ya existe en el servidor (reintento tras éxito no confirmado)
- **THEN** el conflicto de clave primaria se trata como sincronizado y la entrada sale de la cola

### Requirement: Visibilidad de pendientes
El Diario SHALL mostrar las extracciones pendientes mezcladas cronológicamente con una marca visual «pendiente», y un indicador con el número de pendientes mientras exista cola.

#### Scenario: Diario con cola activa
- **WHEN** hay 2 extracciones sin sincronizar
- **THEN** ambas aparecen en el Diario marcadas como pendientes y se indica «2 pendientes»

### Requirement: Degradación sin IndexedDB
Si IndexedDB no está disponible, el sistema SHALL comportarse como antes (la escritura falla con aviso claro y el formulario conserva su estado).

#### Scenario: Navegador sin IndexedDB
- **WHEN** el almacenamiento local no está disponible y falla una escritura
- **THEN** se muestra el aviso de sin conexión y no se pierde lo tecleado
