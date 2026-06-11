# brew-log (delta)

## ADDED Requirements

### Requirement: Coste visible en el diario
Cada entrada del diario SHALL mostrar el coste estimado de la extracción cuando su café tiene precio por kg, derivado al vuelo (spec consumption-stats).

#### Scenario: Entrada con coste
- **WHEN** una extracción usó 18 g de un café a 21 €/kg
- **THEN** su entrada del diario muestra «0,38 €» junto a los parámetros

#### Scenario: Entrada sin precio
- **WHEN** el café de la extracción no tiene precio
- **THEN** la entrada se muestra sin coste, sin hueco ni marcador de error

### Requirement: Compartir desde el diario
Cada entrada del diario SHALL ofrecer la acción de compartir su tarjeta de extracción (delta recipe-sharing).

#### Scenario: Compartir desde la lista
- **WHEN** el usuario pulsa el botón de compartir de una entrada
- **THEN** se genera y comparte la tarjeta de esa extracción
