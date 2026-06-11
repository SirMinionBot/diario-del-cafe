# recipe-sharing (delta)

## ADDED Requirements

### Requirement: Tarjeta de extracción compartible
El sistema SHALL generar a partir de una extracción una tarjeta-imagen con sus parámetros (café, método, dosis, ratio, tiempo, valoración) y, si tiene cata, el radar sensorial de 4 ejes renderizado en la propia tarjeta. Se comparte con las mismas garantías que la tarjeta de receta: Web Share API con fallback a descarga y sin identificadores de cuenta ni URLs públicas.

#### Scenario: Compartir un shot con cata
- **WHEN** el usuario pulsa compartir en una extracción con cata registrada
- **THEN** la tarjeta incluye los parámetros y el radar sensorial dibujado

#### Scenario: Extracción sin cata
- **WHEN** la extracción no tiene cata
- **THEN** la tarjeta se genera solo con los parámetros, sin radar

#### Scenario: Radar consistente con el comparador
- **WHEN** se pinta el radar de la tarjeta
- **THEN** usa la misma geometría de ejes y escala 1–5 que el radar del comparador A/B
