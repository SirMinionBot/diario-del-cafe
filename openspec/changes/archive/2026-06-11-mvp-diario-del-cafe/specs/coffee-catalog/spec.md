# coffee-catalog

## ADDED Requirements

### Requirement: CRUD de cafés del usuario
El sistema SHALL permitir crear, editar, listar y archivar cafés/marcas con: nombre, tostador/marca, origen, nivel de tueste, precio por kg y notas libres. Los cafés archivados SHALL dejar de aparecer en selectores pero conservar su historial.

#### Scenario: Alta de un café
- **WHEN** el usuario crea «Bonka Origins Colombia» con tueste medio y 18 €/kg
- **THEN** el café aparece en su catálogo y es seleccionable al registrar extracciones

#### Scenario: Archivar un café
- **WHEN** el usuario archiva un café
- **THEN** desaparece de los selectores pero sus extracciones pasadas siguen consultables

### Requirement: Recetas propias por café y método
El usuario SHALL poder guardar para cada café una receta por método (ratio, dosis, ajuste de molienda, temperatura, tiempo objetivo) que sobrescribe los valores por defecto del método.

#### Scenario: Receta personalizada sobrescribe defaults
- **WHEN** el usuario guarda para su café X una receta de espresso con ratio 1:2.5 y 19 g de dosis
- **THEN** al preparar espresso con el café X la calculadora y el cronómetro parten de 1:2.5 y 19 g en lugar de los defaults

#### Scenario: Café sin receta usa defaults
- **WHEN** el usuario prepara un método para el que ese café no tiene receta guardada
- **THEN** se usan los valores por defecto del método
