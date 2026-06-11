# recipe-sharing

## ADDED Requirements

### Requirement: Tarjeta de receta compartible
El sistema SHALL generar a partir de una receta una tarjeta-imagen con: nombre del café, método, ratio, dosis, molienda, temperatura y tiempo, con la estética del sistema de diseño de la app.

#### Scenario: Generar tarjeta
- **WHEN** el usuario pulsa «Compartir» en una receta
- **THEN** se genera una imagen de tarjeta con todos los parámetros de la receta

### Requirement: Compartir nativo con fallback
La tarjeta SHALL compartirse mediante la Web Share API cuando esté disponible y, en su defecto, descargarse como imagen.

#### Scenario: Compartir por una app de mensajería
- **WHEN** el navegador soporta Web Share API con ficheros
- **THEN** se abre el panel nativo de compartir con la imagen adjunta

#### Scenario: Navegador sin Web Share
- **WHEN** el navegador no soporta compartir ficheros
- **THEN** la imagen se descarga al dispositivo

### Requirement: Sin exposición pública
Compartir una receta NO SHALL crear URLs públicas ni exponer datos del usuario más allá del contenido visible en la tarjeta.

#### Scenario: Contenido de la tarjeta
- **WHEN** se genera la tarjeta
- **THEN** contiene únicamente los parámetros de la receta y el nombre del café, sin identificadores de cuenta
