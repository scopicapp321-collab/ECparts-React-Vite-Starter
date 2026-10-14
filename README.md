# ECparts — MVP

Marketplace de piezas usadas para vehículos, enfocado inicialmente en Puerto Rico.

## Requisitos
- Node.js 20 o posterior recomendado
- npm

## Ejecutar localmente

```bash
npm install
npm run dev
```

Vite mostrará una URL local, normalmente `http://localhost:5173`.

## Validar la compilación

```bash
npm run build
npm run preview
```

## Estructura

```text
src/
  components/
    Header.jsx
    PartCard.jsx
  data/
    parts.js
  pages/
    Home.jsx
    Placeholder.jsx
  App.jsx
  main.jsx
  styles.css
```

## Rutas iniciales
- `/` — Home y búsqueda de demostración
- `/catalogo` — placeholder del catálogo completo
- `/vender` — entrada futura al registro de vendedores
- `/cuenta` — entrada futura a autenticación
- `/carrito` — entrada futura al carrito
- `/pieza/:id` — detalle de pieza

## Importante
Los productos, precios, vendedores e imágenes de esta versión son datos ilustrativos. No hay autenticación, inventario real, checkout ni procesamiento de pagos implementados todavía.

## Próximos pasos
1. Definir y conectar Firebase Authentication.
2. Crear perfiles de compradores, junkers y particulares con permisos distintos.
3. Implementar inventario Firestore y carga de fotos.
4. Crear carrito, cotizaciones y órdenes.
5. Integrar un proveedor de pagos compatible con Puerto Rico y verificar sus requisitos de marketplace.
6. Añadir reglas de seguridad, validación de vendedores y pruebas.
