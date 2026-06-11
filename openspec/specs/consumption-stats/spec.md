# consumption-stats

## Purpose
Estadísticas de consumo derivadas al vuelo: cafeína diaria estimada por extracción y gasto mensual por marca, implementadas como funciones puras testeadas.

## Requirements

### Requirement: Cafeína diaria estimada
El sistema SHALL estimar la cafeína consumida cada día a partir de las extracciones registradas (mg por gramo de café según método) y mostrar el total del día y un histórico reciente. El valor SHALL presentarse explícitamente como estimación.

#### Scenario: Total del día
- **WHEN** el usuario registra dos espressos de 18 g en el día
- **THEN** la pantalla de estadísticas muestra la cafeína estimada acumulada del día

#### Scenario: Histórico semanal
- **WHEN** el usuario abre las estadísticas
- **THEN** ve la cafeína estimada por día de los últimos 7 días

### Requirement: Gasto mensual derivado
El sistema SHALL calcular el gasto en café por mes y por marca a partir de los paquetes registrados (precio por kg × peso), siempre derivado al vuelo y nunca almacenado como agregado.

#### Scenario: Gasto del mes
- **WHEN** el usuario registró este mes dos paquetes de 250 g a 18 €/kg
- **THEN** las estadísticas muestran 9 € de gasto en el mes, desglosado por marca

#### Scenario: Paquete sin precio
- **WHEN** un paquete pertenece a un café sin precio por kg
- **THEN** se excluye del gasto y se indica cuántos paquetes quedaron fuera del cálculo

### Requirement: Lógica de agregación pura
Los cálculos de cafeína y gasto SHALL implementarse como funciones puras testeadas que reciben los datos ya cargados, sin acceso a red.

#### Scenario: Test unitario de agregación
- **WHEN** se ejecutan los tests de la lógica de estadísticas
- **THEN** cubren los cálculos de cafeína y gasto con datos de ejemplo, sin mocks de red
