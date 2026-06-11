# grinder-profiles

## Purpose
Gestión de los molinillos del usuario (nombre, rango de ajuste y paso), referencia opcional desde recetas y extracciones, y traducción aproximada de ajustes entre molinillos por proporción lineal de rangos.

## Requirements

### Requirement: CRUD de molinillos
El usuario SHALL poder registrar sus molinillos con nombre/modelo, rango de ajuste (mínimo, máximo) y paso, y editarlos o eliminarlos. Los datos son personales (RLS por usuario).

#### Scenario: Alta de molinillo
- **WHEN** el usuario crea «Comandante C40» con rango 0–40 y paso 1
- **THEN** el molinillo queda disponible para asociarlo a recetas y extracciones

### Requirement: Referencia desde recetas y extracciones
Las recetas y las extracciones SHALL poder referenciar opcionalmente un molinillo junto al ajuste numérico, conviviendo con el campo de molienda libre existente.

#### Scenario: Receta con molinillo
- **WHEN** el usuario guarda una receta con molinillo «C40» y ajuste 14
- **THEN** la receta almacena la referencia y el ajuste, sin perder el texto libre previo

#### Scenario: Molinillo eliminado
- **WHEN** se elimina un molinillo referenciado por recetas o brews
- **THEN** esas filas conservan el resto de datos con la referencia a null

### Requirement: Traducción aproximada de ajustes
El sistema SHALL traducir un ajuste entre dos molinillos por proporción lineal de sus rangos, redondeando al paso del destino y presentando SIEMPRE el resultado como aproximación orientativa.

#### Scenario: Traducir entre molinillos
- **WHEN** el usuario pide traducir el ajuste 14 de un molinillo de rango 0–40 a otro de rango 0–80 con paso 2
- **THEN** la app propone «≈ 28» etiquetado como aproximado

#### Scenario: Molinillo sin rango definido
- **WHEN** alguno de los molinillos no tiene rango completo
- **THEN** la traducción no se ofrece y se explica qué falta
