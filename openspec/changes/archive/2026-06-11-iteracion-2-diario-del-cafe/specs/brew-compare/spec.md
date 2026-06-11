# brew-compare

## ADDED Requirements

### Requirement: Selección de dos extracciones
Desde el Diario, el usuario SHALL poder entrar en modo comparar y seleccionar exactamente dos extracciones.

#### Scenario: Activar comparación
- **WHEN** el usuario activa «Comparar» y marca dos extracciones
- **THEN** se abre la vista de comparación con ambas

### Requirement: Comparación lado a lado con diferencias resaltadas
La vista SHALL mostrar los parámetros de ambas extracciones en columnas (café, método, dosis, agua, ratio, tiempo, molienda, valoración, sabor) resaltando los campos que difieren.

#### Scenario: Parámetros distintos resaltados
- **WHEN** las dos extracciones difieren en temperatura y tiempo
- **THEN** esos campos aparecen visualmente destacados frente a los coincidentes

### Requirement: Radar sensorial superpuesto
Cuando ambas extracciones tienen cata, la vista SHALL superponer sus perfiles (acidez, cuerpo, dulzor, amargor) en un radar de 4 ejes con un color por extracción.

#### Scenario: Dos catas superpuestas
- **WHEN** ambas extracciones tienen cata registrada
- **THEN** el radar muestra los dos polígonos superpuestos con leyenda

#### Scenario: Cata ausente en una de ellas
- **WHEN** solo una extracción tiene cata
- **THEN** el radar muestra un único polígono e indica que la otra no tiene cata
