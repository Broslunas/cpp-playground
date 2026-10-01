# Ideas Futuras para Broslunas Playground

Este documento recopila las propuestas no implementadas en esta fase para revisarlas y priorizarlas más adelante.

---

### 1. Página de Proyectos General
- Vista integral con filtrado por estado: borradores, compartidos, públicos y archivados.
- Búsqueda en texto y código, filtrado por lenguaje, etiquetas y fecha de modificación.
- Acciones masivas: cambiar visibilidad, duplicar, descargar como zip, eliminar.

### 2. Capa Social Mínima
- Sistema de seguimiento entre usuarios (`follow/unfollow`).
- Acciones de valoración (`like`, `bookmark/star`).
- Comentarios y notas de revisión en proyectos públicos compartidos.
- Feed de novedades con proyectos de usuarios seguidos.

### 3. Colaboradores y Permisos por Proyecto
- Invitación a colaboradores mediante `@username` o email.
- Niveles de acceso granulares:
  - `Ver`: lectura y ejecución de código en sandbox privado.
  - `Editar`: guardado de cambios en el proyecto común.
  - `Administrar`: invitar a otros, cambiar visibilidad o transferir propiedad.

### 4. Plantillas Personales (Custom Presets)
- Guardar cualquier proyecto existente como plantilla base personal o pública.
- Selector rápido al crear proyecto nuevo desde la barra lateral o selector de entornos.
- Parámetros predefinidos de compilador, flags (`-O3`, sanitizers) y datos de entrada (`stdin`).

### 5. Dominio y URLs Limpias
- Soporte para alias de dominio personalizado (`usuario.dev` o `codigo.usuario.com`).
- Rutas cortas personalizables para proyectos destacados (`/u/pablo/raytracer`).
- Certificados TLS automáticos mediante Cloudflare for Platforms.

### 6. Showcase Visual
- Portadas personalizadas, capturas automáticas del render Canvas/HTML o GIFs animados.
- Proyectos anclados (pinned) con badge destacado en la cabecera del perfil público.
- Descripción extendida en formato Markdown / README por proyecto.

### 7. Modo Creador y Estadísticas Privadas
- Panel privado de métricas para el autor:
  - Ejecuciones totales del código.
  - Visitas al perfil público y proyectos.
  - Clones / forks realizados por otros usuarios.
  - Tiempos promedio de ejecución y lenguajes más utilizados.

### 8. Portfolio Exportable / Modo CV
- Vista pública limpia sin menús ni controles de edición del playground.
- Encabezado imprimible o exportable en PDF con proyectos seleccionados, enlaces y bio.
- Modo presentación para portfolios de desarrollador.

### 9. Changelog y Versionado por Proyecto
- Historial de revisiones de código guardadas con marca temporal y mensaje descriptivo.
- Posibilidad de comparar diferencias (diff visual) y revertir a una versión previa.
- Publicación de versiones etiquetadas (`v1.0`, `v1.1`).

### 10. Cuentas de Equipo / Organizaciones
- Workspaces compartidos para universidades, institutos, bootcamps o empresas.
- Facturación y límites compartidos (si aplica en el futuro).
- Proyectos propiedad de la organización con gestión de miembros y roles.

### 11. Centro de Integraciones
- Mover las conexiones de almacenamiento e infraestructura a una subsección avanzada de configuración.
- Conectores adicionales: GitHub Repos (sincronizar commits directos a un repo), Webhooks de ejecución, export a Gist.

### 12. Preferencias Avanzadas de Editor
- Configuración persistente de CodeMirror: tamaño de tabulación (2/4 espacios), modo Vim/Emacs, autocompletado inteligente, minimapa y formateador al guardar.
