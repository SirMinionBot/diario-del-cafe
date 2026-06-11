# brew-timer

## ADDED Requirements

### Requirement: Cronómetro simple con tiempo objetivo
El sistema SHALL ofrecer un cronómetro de arranque/parada con indicación del tiempo objetivo del método activo. Para espresso SHALL señalar visualmente cuándo el tiempo entra y sale del rango objetivo (25–30 s por defecto).

#### Scenario: Shot dentro de rango
- **WHEN** el cronómetro de espresso pasa de 25 s
- **THEN** la interfaz indica que está dentro del rango objetivo

#### Scenario: Shot fuera de rango
- **WHEN** el cronómetro supera los 30 s sin detenerse
- **THEN** la interfaz indica que se ha salido del rango objetivo

### Requirement: Cronómetro por fases para métodos de filtro
Para métodos con fases (bloom, vertidos) el cronómetro SHALL guiar cada fase con su duración y peso de agua acumulado, avisando del cambio de fase mediante señal visual y vibración cuando esté disponible.

#### Scenario: Guía de V60 por fases
- **WHEN** el usuario inicia el cronómetro de una receta V60 con bloom de 30 s y dos vertidos
- **THEN** la app muestra la fase actual y el agua acumulada objetivo, y avisa al cambiar de fase

### Requirement: Precisión tras bloqueo de pantalla
El tiempo transcurrido SHALL derivarse de timestamps, de modo que al volver de un bloqueo de pantalla o cambio de app el cronómetro muestre el tiempo real correcto.

#### Scenario: Pantalla bloqueada durante la extracción
- **WHEN** el usuario bloquea la pantalla 20 s con el cronómetro en marcha y la desbloquea
- **THEN** el cronómetro muestra el tiempo real transcurrido, incluyendo esos 20 s

### Requirement: Volcado al registro
Al detener el cronómetro, el usuario SHALL poder llevar el tiempo medido directamente al formulario de registro de la extracción.

#### Scenario: Registrar desde el cronómetro
- **WHEN** el usuario detiene el cronómetro y elige «Registrar extracción»
- **THEN** el formulario de brew se abre con el tiempo precargado
