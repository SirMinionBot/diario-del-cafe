# coffee-inventory

## Purpose
Inventario de paquetes físicos de café con fecha de tueste y seguimiento del estado de frescura según la ventana óptima por método.

## Requirements

### Requirement: Paquetes con fecha de tueste
El usuario SHALL poder registrar paquetes físicos de un café con fecha de tueste, peso y fecha de apertura, y marcarlos como terminados.

#### Scenario: Alta de paquete
- **WHEN** el usuario añade un paquete de 250 g de su café X tostado el 1 de junio
- **THEN** el paquete aparece en el inventario asociado al café X con su fecha de tueste

#### Scenario: Terminar un paquete
- **WHEN** el usuario marca un paquete como terminado
- **THEN** deja de contar como inventario activo y alimenta la estadística de gasto

### Requirement: Estado de frescura y ventana óptima
El sistema SHALL calcular los días desde el tueste y mostrar el estado de frescura del paquete: en reposo, en ventana óptima, o pasado de la ventana, según umbrales por familia de método definidos en la lógica de dominio.

#### Scenario: Paquete en ventana óptima
- **WHEN** un paquete tiene 14 días desde el tueste
- **THEN** el inventario lo muestra «en ventana óptima» con los días transcurridos

#### Scenario: Paquete fuera de ventana
- **WHEN** un paquete supera el umbral superior de la ventana
- **THEN** se muestra un aviso visual de frescura pasada, sin bloquear su uso

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
