# dial-in-assistant

## ADDED Requirements

### Requirement: Sugerencia de ajuste a partir del shot
Tras registrar una extracción con tiempo y etiqueta de sabor (ácido/agrio, equilibrado, amargo/astringente), el sistema SHALL generar una sugerencia de ajuste determinista de una sola variable (molienda más fina/gruesa, o dosis) acompañada de una explicación breve.

#### Scenario: Shot rápido y ácido
- **WHEN** el usuario registra un espresso de 18 s marcado como «ácido/agrio»
- **THEN** la app sugiere moler más fino, explicando que el shot está subextraído

#### Scenario: Shot lento y amargo
- **WHEN** el usuario registra un espresso de 38 s marcado como «amargo/astringente»
- **THEN** la app sugiere moler más grueso, explicando que el shot está sobreextraído

#### Scenario: Shot equilibrado
- **WHEN** el usuario registra un shot dentro del rango objetivo marcado como «equilibrado»
- **THEN** la app confirma que no hay ajuste necesario y ofrece guardar los parámetros como receta del café

### Requirement: Motor de reglas puro y testeado
La lógica del dial-in SHALL ser una función pura (sin red ni estado) con las reglas clásicas de extracción, cubierta por tests unitarios caso a caso.

#### Scenario: Misma entrada, misma salida
- **WHEN** se invoca el motor dos veces con los mismos parámetros
- **THEN** devuelve exactamente la misma sugerencia

### Requirement: Tono orientativo
Las sugerencias SHALL presentarse como orientación (no como instrucción infalible) y SHALL proponer un solo cambio por iteración.

#### Scenario: Una variable por sugerencia
- **WHEN** un shot está fuera de rango en tiempo y rendimiento a la vez
- **THEN** la sugerencia prioriza una única variable de ajuste y lo explica
