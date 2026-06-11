# coffee-inventory

## ADDED Requirements

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
