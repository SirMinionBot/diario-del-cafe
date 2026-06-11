# ratio-calculator

## ADDED Requirements

### Requirement: Cálculo inverso café⇄agua
El sistema SHALL calcular, a partir del ratio activo (del método o de la receta seleccionada), la cantidad de agua dados los gramos de café, o la cantidad de café dados los gramos/ml de agua. El resultado SHALL actualizarse al instante al editar cualquiera de los dos campos.

#### Scenario: Café conocido, agua calculada
- **WHEN** el ratio activo es 1:16 y el usuario introduce 15 g de café
- **THEN** la app muestra 240 g de agua

#### Scenario: Agua conocida, café calculado
- **WHEN** el ratio activo es 1:2 (espresso) y el usuario introduce 36 g de bebida objetivo
- **THEN** la app muestra 18 g de café

### Requirement: Ratio ajustable sobre la marcha
El usuario SHALL poder modificar temporalmente el ratio en la calculadora sin alterar la receta ni los defaults del método.

#### Scenario: Ajuste puntual del ratio
- **WHEN** el usuario cambia el ratio de 1:16 a 1:15 en la calculadora
- **THEN** los cálculos usan 1:15 pero la receta y los defaults del método permanecen intactos

### Requirement: Funcionamiento offline
La calculadora SHALL ser lógica pura local y funcionar íntegramente sin conexión.

#### Scenario: Cálculo sin red
- **WHEN** el dispositivo está offline
- **THEN** la calculadora funciona con normalidad
