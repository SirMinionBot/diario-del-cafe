# label-scanner

## ADDED Requirements

### Requirement: Escaneo de etiqueta con OCR en cliente
Desde el alta de café o de paquete, el usuario SHALL poder fotografiar la etiqueta y obtener texto vía OCR ejecutado íntegramente en el dispositivo (tesseract.js cargado bajo demanda).

#### Scenario: Escanear una etiqueta
- **WHEN** el usuario pulsa «Escanear etiqueta» y aporta una foto
- **THEN** el OCR se ejecuta en el dispositivo y produce texto sin enviar la imagen a servicios externos

### Requirement: Extracción estructurada y prerelleno editable
Un parser puro SHALL extraer del texto OCR candidatos a marca/tostador, origen y fecha de tueste, y prerellenar el formulario correspondiente. El usuario SHALL poder corregir cualquier campo antes de guardar; el OCR nunca guarda directamente.

#### Scenario: Etiqueta con fecha de tueste
- **WHEN** el OCR detecta «Tostado el 02/06/2026»
- **THEN** el campo fecha de tueste del paquete se prerellena con 2026-06-02 y queda editable

#### Scenario: OCR sin resultados útiles
- **WHEN** el parser no extrae ningún campo con confianza
- **THEN** el formulario queda vacío y editable, con un aviso de que no se reconoció la etiqueta

### Requirement: Matching contra el catálogo propio
El parser SHALL comparar los candidatos a tostador con los tostadores ya existentes en el catálogo del usuario y proponer el match cuando la similitud sea alta.

#### Scenario: Tostador ya conocido
- **WHEN** el OCR lee un nombre muy similar a un tostador ya registrado
- **THEN** se propone el tostador existente en lugar de crear una variante duplicada
