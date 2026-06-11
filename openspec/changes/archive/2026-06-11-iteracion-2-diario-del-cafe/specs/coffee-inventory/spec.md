# coffee-inventory (delta)

## ADDED Requirements

### Requirement: Descuento de dosis por extracción
El inventario SHALL derivar los gramos restantes de cada paquete restando del peso inicial las dosis de las extracciones asociadas a él; el valor nunca se almacena.

#### Scenario: Restante tras varios brews
- **WHEN** un paquete de 250 g acumula extracciones por 72 g
- **THEN** el inventario muestra 178 g restantes

### Requirement: Dosis restantes y predicción de fin
Para el paquete activo, el sistema SHALL mostrar las dosis restantes aproximadas (según la dosis típica de su café/método) y, con consumo suficiente en los últimos 14 días, la fecha estimada de fin etiquetada «al ritmo actual».

#### Scenario: Predicción con ritmo estable
- **WHEN** un paquete pierde ~36 g/día y le quedan 108 g
- **THEN** se muestra «se acaba en ~3 días, al ritmo actual»

#### Scenario: Sin datos suficientes
- **WHEN** el paquete no tiene consumo en los últimos 14 días
- **THEN** se muestran solo los gramos restantes, sin predicción

### Requirement: Preselección del paquete activo al registrar
El formulario de extracción SHALL preseleccionar automáticamente el paquete abierto más fresco en ventana óptima del café elegido, dejándolo modificable.

#### Scenario: Café con paquete en ventana
- **WHEN** el usuario elige un café con un paquete abierto en ventana óptima
- **THEN** ese paquete queda preseleccionado en el registro

#### Scenario: Café sin paquetes activos
- **WHEN** el café elegido no tiene paquetes sin terminar
- **THEN** el campo paquete queda vacío y opcional como hasta ahora
