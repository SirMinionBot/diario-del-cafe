# tasting-notes

## Purpose
Cata sensorial opcional por extracción (cuatro ejes 1–5 y rueda de descriptores), validada en una puerta tipada y agregada en el perfil sensorial de cada café.

## Requirements

### Requirement: Cata sensorial por extracción
El usuario SHALL poder añadir a una extracción una cata con cuatro ejes en escala 1–5 (acidez, cuerpo, dulzor, amargor) y descriptores de sabor seleccionables de una rueda organizada por familias (frutal, floral, chocolate/nuez, caramelo, especiado, tostado…).

#### Scenario: Cata completa
- **WHEN** el usuario puntúa acidez 4, cuerpo 3, dulzor 4, amargor 2 y selecciona «cítrico» y «caramelo»
- **THEN** la cata queda guardada junto a la extracción y visible en su detalle

#### Scenario: Cata opcional
- **WHEN** el usuario registra una extracción sin abrir la sección de cata
- **THEN** el registro se guarda sin datos sensoriales

### Requirement: Validación del dato de cata
Los datos de cata SHALL validarse en una única puerta de lectura/escritura tipada antes de persistirse (ejes en rango 1–5, descriptores del vocabulario de la rueda).

#### Scenario: Valor fuera de rango
- **WHEN** llega un valor de eje fuera de 1–5
- **THEN** la validación lo rechaza y el dato no se persiste

### Requirement: Perfil sensorial del café
La ficha de un café SHALL mostrar el perfil medio de sus catas (media por eje y descriptores más frecuentes).

#### Scenario: Perfil agregado
- **WHEN** un café tiene tres catas registradas
- **THEN** su ficha muestra la media de cada eje y los descriptores más repetidos
