# quick-repeat

## ADDED Requirements

### Requirement: Repetir la última extracción con un toque
Preparar SHALL ofrecer una acción «Repetir último» que precarga café, paquete (si sigue activo), dosis, ratio, molienda y molinillo/ajuste de la última extracción registrada. La acción SOLO precarga: el usuario sigue pasando por cronómetro y registro con todo editable.

#### Scenario: Repetir el café de ayer
- **WHEN** el usuario pulsa «Repetir último» con un brew previo de 18 g de Colombia a 1:2
- **THEN** Preparar queda con ese café, paquete, 18 g y ratio 1:2 cargados, y se indica qué se precargó

#### Scenario: Sin extracciones previas
- **WHEN** el usuario no tiene ningún brew registrado
- **THEN** la acción no se muestra

### Requirement: Acceso directo PWA
La PWA SHALL incluir un shortcut «Repetir último» que abre Preparar con la precarga aplicada una sola vez (sin reaplicarse en remontajes ni navegaciones posteriores).

#### Scenario: Entrar por el shortcut
- **WHEN** el usuario abre la app desde el acceso directo «Repetir último»
- **THEN** Preparar carga ya precargado con la última extracción

### Requirement: Datos huérfanos
Si el café de la última extracción ya no existe o está archivado, el sistema SHALL avisarlo y no precargar; si solo falta el paquete (terminado), SHALL precargar el resto y omitir el paquete con aviso.

#### Scenario: Paquete terminado
- **WHEN** el paquete del último brew está marcado como terminado
- **THEN** se precarga todo menos el paquete y se indica «paquete ya terminado»
