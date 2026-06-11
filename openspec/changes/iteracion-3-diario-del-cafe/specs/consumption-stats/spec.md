# consumption-stats (delta)

## ADDED Requirements

### Requirement: Coste por taza derivado
El sistema SHALL calcular el coste de una extracción como `precio_por_kg × dosis / 1000`, redondeado a céntimos, siempre al vuelo y nunca almacenado. Las extracciones de cafés sin precio quedan sin coste.

#### Scenario: Coste de un espresso
- **WHEN** una extracción usa 18 g de un café a 21 €/kg
- **THEN** su coste estimado es 0,38 €

#### Scenario: Café sin precio
- **WHEN** el café no tiene precio por kg
- **THEN** la extracción no muestra coste

### Requirement: Comparativa de coste por café
Las estadísticas SHALL mostrar, por café con extracciones, el número de tazas, el coste medio por taza y el total acumulado, ordenable, con los cafés sin precio excluidos y contados.

#### Scenario: Comparar súper vs especialidad
- **WHEN** el usuario tiene tazas registradas de un café de 17 €/kg y otro de 114 €/kg
- **THEN** la comparativa muestra el coste medio por taza de cada uno

#### Scenario: Exclusión señalada
- **WHEN** hay cafés sin precio con extracciones
- **THEN** se indica cuántos quedaron fuera de la comparativa
