# dark-mode

## ADDED Requirements

### Requirement: Tema oscuro por tokens
El sistema SHALL ofrecer una variante oscura completa del sistema de diseño definida exclusivamente como tokens en `src/index.css` (sin tocar componentes ni pantallas), con contraste legible en todas las vistas.

#### Scenario: Cambio de tema sin tocar pantallas
- **WHEN** se activa el tema oscuro
- **THEN** todas las pantallas se renderizan con la paleta nocturna sin cambios en sus componentes

### Requirement: Preferencia del sistema y toggle manual
El tema SHALL seguir `prefers-color-scheme` por defecto (modo auto) y ofrecer en Perfil un selector de tres estados (auto / claro / oscuro) cuya elección persiste localmente entre sesiones.

#### Scenario: Auto sigue al sistema
- **WHEN** el modo es auto y el sistema cambia a oscuro
- **THEN** la app cambia a oscuro sin recargar

#### Scenario: Elección manual persistente
- **WHEN** el usuario fija «oscuro» y reabre la app días después
- **THEN** la app abre en oscuro independientemente del sistema

### Requirement: Color de la interfaz del navegador
El `theme-color` del documento SHALL sincronizarse con el tema activo para que la barra del navegador/PWA acompañe a la paleta.

#### Scenario: Barra acorde al tema
- **WHEN** el tema activo pasa a oscuro
- **THEN** el `theme-color` pasa al papel oscuro
