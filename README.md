# invitacionboda

Invitación de Bryan y Lyndel en Next.js. Panel privado en `/panel.bwp.bl`, fotografías y configuración compartidas en Neon Postgres, y confirmaciones reales de asistencia.

## Instalación

Requiere Node.js 22 o superior y pnpm.

```sh
pnpm install --frozen-lockfile
```

Copia `.env.example` a `.env` y configura `DATABASE_URL`, `ADMIN_USERNAME`, `ADMIN_PASSWORD` y `SESSION_SECRET`. Genera un secreto aleatorio de al menos 32 bytes para `SESSION_SECRET`. Ninguna de estas variables debe tener prefijo `NEXT_PUBLIC_`. El archivo `.env` está excluido de Git.

```sh
pnpm db:migrate
pnpm dev
```

La migración crea las tablas necesarias. La invitación conserva sus datos iniciales y los guarda en Neon al abrirse por primera vez. No se crean invitados ni fotografías de ejemplo. Las fotografías pendientes muestran un espacio reservado hasta que se carguen desde el panel.

## Administración

Accede a `/panel.bwp.bl` con las credenciales configuradas en el servidor. La sesión dura ocho horas y se puede cerrar desde el panel. Las operaciones de edición y la lista de invitados requieren una sesión válida. Las fotos JPEG optimizadas se almacenan en Postgres y se sirven mediante una ruta pública; cada carga admite hasta 4 MB después de la optimización.

Los visitantes guardan su asistencia con «Guardar confirmación». Después pueden enviar el mensaje por WhatsApp. Cada respuesta incluye nombre, asistencia, cantidad total de personas y mensaje; el panel muestra los registros y el total confirmado. El mismo navegador puede actualizar su respuesta sin duplicarla. Las respuestas de distintos navegadores se consideran independientes.

## Verificación

```sh
pnpm lint
pnpm build
pnpm start
```

La prueba de integración requiere la aplicación servida en `http://localhost:3100` (o la variable `TEST_ORIGIN`) y Neon configurado en `.env`:

```sh
node tests/integration.mjs
```

Comprueba autenticación, cierre de sesión, controles de acceso y origen, validación, configuración, fotos y confirmaciones. Crea registros temporales y los elimina al terminar; restaura la foto y configuración previas. Ejecútala en una base de pruebas cuando haya usuarios activos.

## Publicación

Usa un alojamiento compatible con el servidor de Next.js. Configura las cuatro variables de `.env` en el gestor de secretos del alojamiento, ejecuta `pnpm db:migrate`, compila con `pnpm build` e inicia con `pnpm start`. No se admite exportación estática: el login y la base de datos necesitan servidor. Las credenciales no se suben al repositorio.

El proxy del alojamiento debe establecer `X-Forwarded-For` con la IP real del visitante para aplicar los límites de intentos. Usa HTTPS para las cookies seguras en producción.
