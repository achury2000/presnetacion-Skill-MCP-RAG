# Skills · MCP · RAG — presentación interactiva 3D

Abrir en VS Code: carpeta → clic derecho en `index.html` → *Open with Live Server* (o doble clic: funciona también desde file://).

## Controles
- → / Espacio / clic en ❯: siguiente · ←: anterior
- N: notas del orador · O: vista general · F: pantalla completa
- Pastillas superiores: saltar de sección. Mueve el mouse para el parallax 3D.
- Interactivos: niveles de Skill, flujo MCP, demo RAG (4 preguntas), combo y quiz.

## Estructura
- `index.html` (18 diapositivas), `css/style.css`, `js/world.js` (mundo 3D three.js r149), `js/deck.js` (cámaras, transiciones, widgets), `assets/fonts/`.
- Editar texto: `index.html`. Cámara de cada slide: `POSES` en `js/deck.js`.
- Paleta: #030407, #1558C9, #D4FF24.

## Notas de contenido
- Spec Agent Skills: name ≤64 car., description ≤1024, carga progresiva.
- MCP: lanzado nov 2024, JSON-RPC 2.0, donado a la Agentic AI Foundation (Linux Foundation) el 9-dic-2025. Cifras de adopción (10.000+ servidores, 97M+ descargas/mes) son del anuncio de Anthropic.
- La demo RAG en 3D es una simplificación (búsqueda del vecino más cercano en 3D); el caso usa una empresa ficticia.
