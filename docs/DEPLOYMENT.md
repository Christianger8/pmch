# Despliegue en producción

Arquitectura objetivo: **Vercel** (frontend Next.js) + **Supabase Cloud**
(base, auth, realtime, edge functions) + **tu dominio**.

---

## 1. Proyecto en Supabase

1. Crear un proyecto en <https://supabase.com/dashboard>.
2. Instalar la CLI y enlazar:
   ```bash
   npm i -g supabase
   supabase login
   supabase link --project-ref <PROJECT_REF>
   ```
3. Aplicar el esquema:
   ```bash
   supabase db push          # corre supabase/migrations/*
   ```
   > El `seed.sql` **no** se aplica en producción. Creá tu primer admin a mano
   > (paso 6).
4. Habilitar extensiones en **Database → Extensions**: `pg_cron`, `pg_net`
   (y `pgcrypto`, normalmente ya activa).

## 2. Autenticación por WhatsApp / SMS

El ingreso es por código OTP. La app deja al usuario elegir **WhatsApp** o **SMS**
en la pantalla de login; el canal por defecto lo define
`NEXT_PUBLIC_DEFAULT_OTP_CHANNEL` (`whatsapp` recomendado).

### 2.1 Base (SMS)

1. **Authentication → Providers → Phone**: activar.
2. Elegir proveedor y cargar credenciales:
   - **Twilio Verify** (recomendado — maneja plantillas, reintentos y varios
     canales), **Twilio** *Messaging Service*, **MessageBird**, **Vonage** o **Textlocal**.
   - Para Argentina, **Twilio Verify** funciona bien.
3. Ajustar `OTP expiry` (subilo a 600 s para gastar menos mensajes) y el rate limit.

### 2.2 Canal WhatsApp

> WhatsApp **solo** funciona con el proveedor **Twilio** o **Twilio Verify**.

1. En **Twilio → Messaging → Senders → WhatsApp senders**, dar de alta un
   remitente de WhatsApp. Requiere una **cuenta de Meta Business verificada** y un
   número que **no** esté usado en la app normal de WhatsApp. La aprobación de
   Meta suele tardar **algunos días**.
2. Con **Twilio Verify**: en el *Verify Service* habilitar el canal **WhatsApp**
   (la plantilla de "autenticación" la gestiona Twilio). Con **Twilio** a secas:
   crear y hacer aprobar una plantilla de categoría *authentication*.
3. En Supabase, el proveedor Phone debe ser el mismo Twilio/Twilio Verify.
4. La app ya envía `channel: "whatsapp"` cuando corresponde; no hay cambios de código.
5. **Mientras el remitente de WhatsApp no esté aprobado**, poné
   `NEXT_PUBLIC_DEFAULT_OTP_CHANNEL=sms` y lanzá con SMS; cambialo a `whatsapp`
   cuando esté listo (no requiere redeploy de la base, solo la env var + redeploy
   en Vercel).

### 2.3 URLs

**Authentication → URL Configuration**:
- `Site URL`: `https://TUDOMINIO`
- `Redirect URLs`: `https://TUDOMINIO`

> Costo: cada login consume un mensaje (WhatsApp o SMS), unos centavos de USD.
> Twilio Verify agrega una tarifa por verificación. Subí el `OTP expiry` para
> reducir reenvíos.

## 3. Variables de entorno

En **Vercel → Project → Settings → Environment Variables** (y en tu `.env.local`
para desarrollo):

| Variable | Valor |
|---|---|
| `NEXT_PUBLIC_APP_URL` | `https://TUDOMINIO` |
| `NEXT_PUBLIC_DEFAULT_OTP_CHANNEL` | `whatsapp` (o `sms` hasta aprobar el remitente) |
| `NEXT_PUBLIC_SUPABASE_URL` | `https://<ref>.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | *(Settings → API)* |
| `SUPABASE_SERVICE_ROLE_KEY` | *(Settings → API — secreto)* |

## 4. Deploy del frontend en Vercel

1. Importar el repositorio en Vercel. Framework: **Next.js** (autodetectado).
2. Build command: `npm run build` · Install: `npm install`.
3. Agregar el script de íconos al build si querés PNGs frescos:
   `Build Command → npm run icons && npm run build`.
4. Deploy.

### Dominio propio

1. **Vercel → Settings → Domains → Add** → `TUDOMINIO`.
2. En tu proveedor DNS:
   - `A  @  76.76.21.21`  **o**  `CNAME  @  cname.vercel-dns.com` (según el proveedor)
   - `CNAME  www  cname.vercel-dns.com`
3. Esperar la emisión del certificado (automática).
4. Volver a Supabase → **URL Configuration** y confirmar que `Site URL` y
   `Redirect URLs` usan el dominio final (sin barra final).
5. Actualizar `NEXT_PUBLIC_APP_URL` en Vercel al dominio final y **redeploy**
   (afecta los links de WhatsApp, los `.ics` y el `start_url` de la PWA).

#### Si el dominio está en DonWeb (hosting compartido)

El hosting compartido de DonWeb **no corre la app** (es para PHP/archivos, no
Node + PostgreSQL). Se usa solo para el dominio y, si querés, el correo. La app
vive en Vercel + Supabase. Apuntar el DNS a Vercel **no mueve el hosting**: la web
y el correo que ya tenés siguen igual; solo se agrega/edita un registro.

**Opción recomendada — un subdominio** (deja intacta la web actual del dominio raíz):

1. **Vercel → Settings → Domains → Add** → `app.TUDOMINIO` (el nombre que quieras:
   `app`, `padel`, `turnos`, `reservas`…). Vercel muestra el destino, del tipo
   `cname.vercel-dns.com`.
2. DonWeb → **Dominios → tu dominio → Zona DNS** → agregar:
   - Tipo **CNAME**, host `app`, valor `cname.vercel-dns.com` (el que dé Vercel).
3. `NEXT_PUBLIC_APP_URL = https://app.TUDOMINIO` en Vercel, y el mismo valor en
   Supabase → *Site URL* y *Redirect URLs*.

**Opción — el dominio raíz** (si el dominio no tiene una web que quieras conservar):

1. En Vercel agregar `TUDOMINIO` y `www.TUDOMINIO`.
2. En la Zona DNS:
   - Registro **A**, host `@` (o vacío), valor `76.76.21.21`.
   - Registro **CNAME**, host `www`, valor `cname.vercel-dns.com`.
   - Si DonWeb no permite CNAME en la raíz, alcanza con el registro A para `@`.

En ambos casos:
- **No toques** los registros **MX** ni los `TXT` de correo: el mail sigue funcionando.
- El DNS tarda de minutos a unas horas en propagar.
- En Vercel el dominio pasa de "Invalid Configuration" a "Valid" al terminar la
  propagación; recién ahí se emite el certificado SSL.

## 5. Recordatorios (Edge Function + cron)

1. Deploy de la función:
   ```bash
   supabase functions deploy reminders
   ```
2. Secrets de la función:
   ```bash
   supabase secrets set \
     REMINDERS_CRON_SECRET="<string-largo-aleatorio>" \
     NOTIFY_PROVIDER=twilio \
     TWILIO_ACCOUNT_SID=... \
     TWILIO_AUTH_TOKEN=... \
     TWILIO_SMS_FROM="+1..." \
     TWILIO_WHATSAPP_FROM="whatsapp:+14155238886"
   ```
   > `SUPABASE_URL` y `SUPABASE_SERVICE_ROLE_KEY` ya están disponibles para la
   > función automáticamente.
3. Configurar los GUC que usa el cron (SQL Editor):
   ```sql
   alter database postgres set app.settings.reminders_function_url =
     'https://<PROJECT_REF>.functions.supabase.co/reminders';
   alter database postgres set app.settings.reminders_cron_secret =
     '<el mismo REMINDERS_CRON_SECRET>';
   ```
4. La migración `20260101000300_cron.sql` ya programó el job `padel-reminders`
   cada 15 min. Verificar:
   ```sql
   select * from cron.job;
   select * from cron.job_run_details order by start_time desc limit 10;
   ```

Sin proveedor configurado (`NOTIFY_PROVIDER=log`) los recordatorios se generan y
se marcan como enviados escribiendo en los logs de la función — útil para probar
el flujo sin gastar SMS.

## 6. Crear el primer administrador

1. Iniciá sesión en la app con tu celular (quedás como `player`).
2. En Supabase **SQL Editor**:
   ```sql
   update public.profiles set role = 'admin'
   where phone = '+549XXXXXXXXXX';
   ```
3. Recargá la app: aparece la pestaña **Admin**.
4. Para administradores por complejo (sin ser admin global):
   ```sql
   insert into public.complex_admins (complex_id, user_id)
   values ('<complex_id>', '<user_id>');
   ```

## 7. PWA

- El manifiesto se sirve en `/manifest.webmanifest` y el service worker en
  `/sw.js` (solo se registra en producción).
- Antes del deploy, generá los PNG: `npm run icons` (crea `icon-192`,
  `icon-512`, `maskable-512`, `apple-touch-icon`, `favicon.ico`).
- Verificá con Lighthouse → *Installable*.

## 8. Checklist post-deploy

- [ ] Login funciona en el dominio final por el canal elegido (WhatsApp y/o SMS)
- [ ] `NEXT_PUBLIC_APP_URL` = dominio final; link de WhatsApp abre el partido
- [ ] `.ics` se descarga y abre en Google/Apple Calendar
- [ ] Realtime: al anotarse en un dispositivo, el otro actualiza el contador
- [ ] `cron.job` tiene `padel-reminders` y `job_run_details` no muestra errores
- [ ] Lighthouse PWA installable en verde
- [ ] RLS: un usuario no-admin no puede entrar a `/admin` ni mutar catálogo
