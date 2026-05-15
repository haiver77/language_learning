[INPUTS]
INPUTAPP: APIGEE
PALABRAS_POR_FRASE: 7

[INSTRUCCIONES]
Sigue un proceso estricto de dos pasos para generar el resultado.

PASO 1:
Se requiere generar en inglés una explicación extensa, detallada e integral sobre INPUTAPP que abarque tanto los aspectos conceptuales como técnicos necesarios para comprender, implementar y operar esta aplicación, plataforma o componente en distintos entornos.
La información debe incluir, de forma mandatoria como mínimo, los siguientes puntos:
- Definición técnica: describe claramente qué es, de forma profesional y precisa.
- Analogía sencilla: análogía a forma de explicación extremadamente fácil de entender para cualquier perfil.
- Propósito: qué problema resuelve y dónde se usa.
- Características y beneficios: capacidades principales y ventajas diferenciales.
- Casos de uso: escenarios, industrias y ejemplos prácticos.
- Arquitectura y componentes: estructura, módulos y patrones arquitectónicos.
- Modelo de datos o lógica interna (si aplica).
- Despliegue: infraestructura, opciones de instalación y escalabilidad.
- Operación y mantenimiento: monitoreo, respaldo, recuperación y actualizaciones.
- Ecosistema e integración: APIs, protocolos e integraciones.
- Limitaciones y trade-offs.
- Buenas prácticas y anti-patterns.

Estilo de redacción:
- Redacción natural, fluida y profesional.
- Usa pronombres, conectores y referencias implícitas cuando sea posible.
- Mantén coherencia narrativa y transiciones naturales.
- Prioriza claridad, fluidez y tono de experto humano.

PASO 2: 
Después de generar la explicación amplia y completamente detallada:
- Divide TODO el contenido en frases cortas.
- Cada frase debe tener menos de [PALABRAS_POR_FRASE] palabras.

Genera un CSV final con EXACTAMENTE 2 columnas:
- Separador: ;
- Sin encabezados.
- Sin numeración.
- Sin comillas simples ni dobles.
- Sin líneas vacías.
- Sin markdown.
- Sin texto adicional fuera del CSV.

Formato por fila:
Columna 1: traducción al español, haciendolo lo más literal sin producir errores gramaticales.
Columna 2: frase original en inglés.

Validaciones obligatorias:
- Cada frase en inglés debe tener menos de [PALABRAS_POR_FRASE] palabras.
- Ambas columnas deben conservar exactamente el mismo significado.
- El resultado final debe ser únicamente el CSV.