# reference-recipes

## Purpose
Catálogo estático y de solo lectura de recetas de referencia reconocidas, utilizable para precargar la calculadora y el cronómetro o para hacer fork a una receta propia asociada a un café del usuario.

## Requirements

### Requirement: Catálogo estático de recetas de referencia
El sistema SHALL incluir un catálogo estático (en código, disponible offline) de recetas de referencia reconocidas, cada una con nombre, autor/fuente, método, ratio, dosis, temperatura y fases si aplican. El catálogo es de solo lectura.

#### Scenario: Explorar referencias
- **WHEN** el usuario abre «Recetas de referencia» desde Preparar
- **THEN** ve la lista de recetas famosas con sus parámetros, también sin conexión

### Requirement: Usar una referencia en Preparar
El usuario SHALL poder precargar la calculadora y el cronómetro con los parámetros de una receta de referencia sin crear nada en su catálogo.

#### Scenario: Precargar Hoffmann V60
- **WHEN** el usuario pulsa «Usar» en la receta V60 de referencia
- **THEN** Preparar queda con su método, ratio, dosis y fases activos

### Requirement: Fork a receta propia
El usuario SHALL poder guardar una receta de referencia como receta propia eligiendo a qué café se asocia; la copia es editable y la referencia original permanece intacta.

#### Scenario: Guardar para un café
- **WHEN** el usuario pulsa «Guardar para…» y elige su café X
- **THEN** se crea (o actualiza) la receta del café X con esos parámetros, editable como cualquier receta propia
