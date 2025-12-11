# 🚀 Setup del CRM WhatsApp

## Pasos para ejecutar el proyecto

### 1. Instalar dependencias

```bash
npm install
```

### 2. Configurar variables de entorno

Copia el archivo `.env.example` y renómbralo a `.env.local`:

```bash
cp .env.example .env.local
```

Edita `.env.local` y agrega tu anon key de Supabase:

```env
NEXT_PUBLIC_SUPABASE_URL=https://lwnqbtlsiyyijxzywnzg.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu_anon_key_aqui
```

### 3. Obtener tu Supabase Anon Key

1. Ve a tu dashboard de Supabase: https://supabase.com/dashboard
2. Selecciona tu proyecto
3. Ve a **Settings** → **API**
4. Copia el **anon/public key**
5. Pégalo en `.env.local`

### 4. Verificar que las migraciones se aplicaron correctamente

Las migraciones ya fueron aplicadas a tu base de datos de Supabase. Puedes verificarlo en:

- Dashboard de Supabase → Table Editor
- Deberías ver las tablas `leads` y `actividades`

### 5. Iniciar el servidor de desarrollo

```bash
npm run dev
```

El servidor buscará automáticamente un puerto disponible entre 3000-3006.

### 6. Abrir la aplicación

Abre tu navegador en la URL que muestre la consola (ejemplo: `http://localhost:3000`)

---

## 📱 Estructura de la Aplicación

### Vistas Principales

1. **Pipeline** (`/pipeline`)
   - Vista Kanban con drag & drop
   - 8 etapas del proceso de prospección
   - Filtros por nombre y estado calificado
   - Click en tarjeta para ver detalle

2. **HOY** (`/hoy`)
   - Leads sin primer mensaje
   - Seguimientos pendientes para hoy
   - Reuniones próximas (48h)
   - Loom sin respuesta (+3 días)

3. **Dashboard** (`/dashboard`)
   - KPIs semanales
   - Gráfico de embudo
   - Métricas de conversión

### Flujo de Uso

1. **Crear un lead**
   - Click en "Nuevo Lead" en el Pipeline
   - Llenar nombre, WhatsApp y etapa inicial

2. **Gestionar el lead**
   - Click en una tarjeta para abrir el panel lateral
   - Ver/editar información
   - Cambiar flags del proceso
   - Agregar observaciones
   - Registrar actividades

3. **Mover en el pipeline**
   - Arrastrar tarjetas entre columnas (drag & drop)
   - O cambiar etapa desde el panel de detalle

4. **Abrir WhatsApp**
   - Click en el botón verde de WhatsApp
   - Se abre el chat web en una nueva pestaña

---

## 🗄️ Modelo de Datos

### Tabla: `leads`

- **Información básica**: nombre_negocio, whatsapp, etapa
- **Flags del proceso**: es_calificado, respondio, acepto_loom, loom_enviado, pdf_armado, tuvo_reunion
- **Fechas**: fecha_creacion, fecha_ultimo_contacto, proxima_fecha_seguimiento, fecha_reunion
- **Observaciones**: observacion_general, observacion_post_reunion

### Tabla: `actividades`

- **Relación**: lead_id (foreign key)
- **Datos**: fecha_hora, tipo, resultado, nota
- **Tipos**: primer_mensaje, follow_up, audio_enviado, loom_enviado, reunion, nota_interna, etc.

---

## 🛠️ Comandos Disponibles

```bash
# Desarrollo
npm run dev          # Servidor de desarrollo (auto-port 3000-3006)
npm run build        # Build para producción
npm run start        # Servidor de producción

# Quality Assurance
npm run lint         # ESLint
npm run lint:fix     # Fix automático de linting
npm run typecheck    # Verificación de tipos TypeScript
npm run test         # Tests con Jest
```

---

## ⚠️ Troubleshooting

### Puerto ocupado

El script automáticamente busca un puerto disponible entre 3000-3006. Si todos están ocupados:

```bash
# Ver qué proceso está usando un puerto
lsof -i :3000

# Matar proceso específico
kill -9 <PID>
```

### Error de conexión a Supabase

- Verifica que la URL y anon key en `.env.local` sean correctas
- Verifica que las tablas existan en tu proyecto de Supabase
- Verifica que RLS esté habilitado con las políticas correctas

### TypeScript Errors

```bash
npm run typecheck    # Ver errores
rm -rf .next         # Limpiar cache
npm install          # Reinstalar deps
```

---

## 📚 Tecnologías Utilizadas

- **Next.js 16** - Framework React
- **TypeScript** - Tipado estático
- **Supabase** - Base de datos PostgreSQL
- **TanStack Query** - State management y caché
- **@dnd-kit** - Drag and drop
- **Tailwind CSS** - Styling
- **Zod** - Validación de schemas
- **date-fns** - Manipulación de fechas
- **lucide-react** - Iconos

---

¡Listo! La aplicación está completamente funcional y lista para usar. 🎉
