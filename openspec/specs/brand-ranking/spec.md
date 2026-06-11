# brand-ranking

## Purpose
Ranking personal de cafés por puntuación media de las extracciones, con ordenación alternativa por relación precio/calidad calculada al vuelo.

## Requirements

### Requirement: Ranking personal de cafés
El sistema SHALL mostrar un ranking de los cafés del usuario ordenado por puntuación media de sus extracciones, indicando también el número de extracciones y el tostador/marca de cada uno. Los cafés sin ninguna extracción valorada NO SHALL listarse individualmente: se agregan en un recuento («N cafés sin valorar aún») para que el podio siga siendo útil con catálogos grandes.

#### Scenario: Podio de cafés
- **WHEN** el usuario abre el ranking con varios cafés valorados
- **THEN** ve solo los cafés con nota, ordenados por media, con su tostador y el número de extracciones

#### Scenario: Catálogo grande mayormente sin valorar
- **WHEN** el usuario tiene 96 cafés y solo 3 valorados
- **THEN** el podio lista esos 3 y muestra «93 cafés sin valorar aún» como una sola línea

#### Scenario: Café sin valoraciones
- **WHEN** un café no tiene ninguna extracción valorada
- **THEN** cuenta en el recuento agregado de «sin valorar» y no ocupa una fila propia

### Requirement: Relación precio/calidad
El ranking SHALL poder ordenarse alternativamente por relación precio/calidad, derivada del precio por kg del café y su puntuación media; el valor SHALL calcularse siempre al vuelo, nunca almacenarse.

#### Scenario: Ordenar por precio/calidad
- **WHEN** el usuario cambia el orden a «precio/calidad»
- **THEN** los cafés con mejor nota por euro suben en la lista

#### Scenario: Café sin precio
- **WHEN** un café no tiene precio por kg informado
- **THEN** se excluye de la ordenación por precio/calidad con una indicación visual

### Requirement: Desambiguación por tostador en selectores
Los selectores de café de la aplicación (registro de extracción, calculadora, filtros del diario) SHALL agrupar las opciones por tostador/marca, de modo que cafés con nombres iguales o similares de marcas distintas sean distinguibles.

#### Scenario: Dos cafés con el mismo nombre de marcas distintas
- **WHEN** existen «Colombia» de dos tostadores diferentes
- **THEN** cada uno aparece bajo el grupo de su tostador en el selector

#### Scenario: Café sin tostador informado
- **WHEN** un café no tiene tostador
- **THEN** aparece bajo un grupo genérico («Otros»)
