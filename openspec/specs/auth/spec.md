# auth

## Purpose
Acceso con cuenta personal vía Supabase Auth (magic link) y aislamiento estricto de los datos de cada usuario mediante RLS.

## Requirements

### Requirement: Acceso con cuenta personal
El sistema SHALL permitir registrarse e iniciar sesión mediante Supabase Auth con magic link por email. Toda ruta de la aplicación salvo la pantalla de acceso SHALL requerir sesión activa.

#### Scenario: Login con magic link
- **WHEN** un usuario introduce su email y solicita acceso
- **THEN** recibe un magic link y, al abrirlo, entra en la aplicación con sesión iniciada

#### Scenario: Acceso a ruta protegida sin sesión
- **WHEN** un visitante sin sesión navega a cualquier ruta de la app
- **THEN** es redirigido a la pantalla de acceso

### Requirement: Aislamiento de datos por usuario
Todos los datos (cafés, paquetes, recetas, extracciones, fotos) SHALL estar asociados a un `user_id` y protegidos por políticas RLS de modo que un usuario solo pueda leer y escribir sus propios registros.

#### Scenario: Intento de leer datos ajenos
- **WHEN** una consulta intenta acceder a filas de otro `user_id`
- **THEN** la base de datos no devuelve ninguna fila

### Requirement: Cierre de sesión
El sistema SHALL ofrecer cerrar sesión desde el perfil, invalidando la sesión local.

#### Scenario: Logout
- **WHEN** el usuario pulsa «Cerrar sesión»
- **THEN** la sesión se elimina y se le redirige a la pantalla de acceso
