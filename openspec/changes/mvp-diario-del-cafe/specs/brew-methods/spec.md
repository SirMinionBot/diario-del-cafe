# brew-methods

## ADDED Requirements

### Requirement: Catálogo de métodos con valores por defecto
El sistema SHALL incluir un catálogo estático de métodos de preparación — espresso, V60, prensa francesa, AeroPress, moka y cold brew — cada uno con ratio por defecto, temperatura de agua, tiempo objetivo y, si aplica, fases de vertido. El espresso SHALL tener por defecto ratio 1:2 y tiempo objetivo 25–30 s.

#### Scenario: Consultar defaults de espresso
- **WHEN** el usuario selecciona el método espresso sin receta propia
- **THEN** la app muestra ratio 1:2 y tiempo objetivo 25–30 s como valores de partida

#### Scenario: Método de filtro con fases
- **WHEN** el usuario selecciona V60
- **THEN** los defaults incluyen fases de preparación (bloom y vertidos) con tiempos orientativos

### Requirement: Defaults disponibles offline
El catálogo de métodos SHALL residir en el código de la aplicación y estar disponible sin conexión.

#### Scenario: Selección de método sin red
- **WHEN** el dispositivo está offline y el usuario abre el selector de métodos
- **THEN** todos los métodos y sus defaults se muestran con normalidad
