# brand-ranking

## Purpose
Ranking personal de cafés por puntuación media de las extracciones, con ordenación alternativa por relación precio/calidad calculada al vuelo.

## Requirements

### Requirement: Ranking personal de cafés
El sistema SHALL mostrar un ranking de los cafés del usuario ordenado por puntuación media de sus extracciones, indicando también el número de extracciones de cada uno.

#### Scenario: Podio de cafés
- **WHEN** el usuario abre el ranking con varios cafés valorados
- **THEN** ve sus cafés ordenados por nota media con el número de extracciones de cada uno

#### Scenario: Café sin valoraciones
- **WHEN** un café no tiene ninguna extracción valorada
- **THEN** aparece al final del ranking marcado como «sin valorar»

### Requirement: Relación precio/calidad
El ranking SHALL poder ordenarse alternativamente por relación precio/calidad, derivada del precio por kg del café y su puntuación media; el valor SHALL calcularse siempre al vuelo, nunca almacenarse.

#### Scenario: Ordenar por precio/calidad
- **WHEN** el usuario cambia el orden a «precio/calidad»
- **THEN** los cafés con mejor nota por euro suben en la lista

#### Scenario: Café sin precio
- **WHEN** un café no tiene precio por kg informado
- **THEN** se excluye de la ordenación por precio/calidad con una indicación visual
