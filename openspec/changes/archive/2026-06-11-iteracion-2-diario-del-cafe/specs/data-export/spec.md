# data-export

## ADDED Requirements

### Requirement: Export JSON completo
El sistema SHALL exportar un backup JSON versionado con todos los datos del usuario (cafés, paquetes, recetas, molinillos y extracciones con su cata); las fotos se incluyen solo como referencia de ruta.

#### Scenario: Descargar backup
- **WHEN** el usuario pulsa «Exportar datos» en Perfil
- **THEN** se descarga un JSON con versión, fecha y todas sus entidades

### Requirement: Export CSV de extracciones
El sistema SHALL exportar las extracciones como CSV tabular (fecha, café, método, dosis, agua, ratio, tiempo, molienda, nota, sabor) para análisis externo.

#### Scenario: Descargar CSV
- **WHEN** el usuario pulsa «Exportar brews (CSV)»
- **THEN** se descarga un CSV con una fila por extracción

### Requirement: Import del backup propio con remapeo de ids
El sistema SHALL importar únicamente backups JSON del formato propio, validando estructura y versión, regenerando todos los ids y remapeando las referencias internas para evitar colisiones.

#### Scenario: Importar backup válido
- **WHEN** el usuario importa un JSON de versión soportada
- **THEN** las entidades se crean en su cuenta con ids nuevos y las relaciones intactas, y se informa del recuento importado

#### Scenario: Fichero inválido
- **WHEN** el JSON no pasa la validación estructural (versión, tipos o catas inválidas)
- **THEN** no se escribe nada en la base de datos y se explica el motivo

### Requirement: Import con reemplazo opcional
El usuario SHALL poder elegir entre añadir el backup a sus datos existentes (comportamiento por defecto) o reemplazarlos. En modo reemplazo, el sistema SHALL pedir confirmación explícita y, solo tras confirmarla y validar el fichero, borrar todos los datos del usuario (cafés y, en cascada, sus paquetes, recetas y extracciones; molinillos; y fotos del bucket) antes de insertar el backup.

#### Scenario: Reemplazo confirmado
- **WHEN** el usuario importa con la opción «reemplazar» activada y confirma el aviso
- **THEN** sus datos anteriores se borran y al terminar solo existen las entidades del backup

#### Scenario: Reemplazo cancelado
- **WHEN** el usuario activa «reemplazar» pero cancela la confirmación
- **THEN** no se borra ni se importa nada

#### Scenario: Fichero inválido en modo reemplazo
- **WHEN** el fichero no pasa la validación con «reemplazar» activado
- **THEN** no se borra nada: la validación ocurre antes que cualquier borrado
