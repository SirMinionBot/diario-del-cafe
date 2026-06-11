# brew-log

## ADDED Requirements

### Requirement: Registro de extracciones
El sistema SHALL permitir registrar una extracción con: café (y opcionalmente paquete), método, dosis, agua/rendimiento, ratio resultante, ajuste de molienda, temperatura, tiempo, valoración (1–5) y notas libres. Café, método y dosis SHALL ser los únicos campos obligatorios.

#### Scenario: Registro mínimo
- **WHEN** el usuario registra un espresso del café X con 18 g de dosis
- **THEN** la extracción queda guardada con fecha y aparece en su diario

#### Scenario: Registro completo desde una receta
- **WHEN** el usuario registra una extracción partiendo de una receta guardada
- **THEN** el formulario se precarga con los parámetros de la receta y el usuario solo ajusta lo que difiera

### Requirement: Foto opcional por extracción
El usuario SHALL poder adjuntar una foto a la extracción. La imagen SHALL comprimirse en el cliente antes de subirse a un bucket privado del usuario.

#### Scenario: Adjuntar foto
- **WHEN** el usuario añade una foto de 4 MB al registro
- **THEN** la imagen se redimensiona y comprime en el dispositivo y se guarda asociada a la extracción

### Requirement: Diario consultable y filtrable
El diario SHALL listar las extracciones en orden cronológico inverso y permitir filtrar por café y por método.

#### Scenario: Filtrar por café
- **WHEN** el usuario filtra el diario por el café X
- **THEN** solo se muestran las extracciones de ese café

#### Scenario: Lectura offline de registros recientes
- **WHEN** el dispositivo está offline
- **THEN** las últimas extracciones cargadas previamente siguen siendo consultables
