// api/analyze.js
// Función serverless (Vercel) que recibe una imagen en base64 y la envía
// a la API de Anthropic usando la API key guardada en el servidor.
// La API key NUNCA se expone al navegador.

export default async function handler(req, res) {
  // Solo aceptar POST
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Método no permitido" });
  }

  try {
    const { imageBase64, mediaType } = req.body || {};

    if (!imageBase64 || !mediaType) {
      return res.status(400).json({ error: "Falta imageBase64 o mediaType" });
    }

    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: "ANTHROPIC_API_KEY no configurada en el servidor" });
    }

    const anthropicResponse = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-6",
        max_tokens: 1000,
        messages: [
          {
            role: "user",
            content: [
              { type: "image", source: { type: "base64", media_type: mediaType, data: imageBase64 } },
              {
                type: "text",
                text:
                  "Eres un nutricionista experto. Analiza el alimento de la imagen y responde UNICAMENTE con JSON valido, sin texto adicional ni markdown, con este formato exacto: " +
                  '{"alimento": string, "porcion_g": number, "calorias": number, "grasas_buenas_g": number, "grasas_malas_g": number, "azucares_g": number, "proteina_g": number, "carbohidratos_g": number, "nivel_azucar": "bajo|medio|alto", "comentario": string}. ' +
                  "grasas_buenas_g son grasas insaturadas (mono y poliinsaturadas). grasas_malas_g son grasas saturadas y trans. Todos los valores en gramos para la porcion estimada. El comentario debe ser breve, en español, y práctico.",
              },
            ],
          },
        ],
      }),
    });

    if (!anthropicResponse.ok) {
      const errText = await anthropicResponse.text();
      return res.status(anthropicResponse.status).json({ error: "Error de la API de Anthropic", detail: errText });
    }

    const data = await anthropicResponse.json();
    const textBlock = (data.content || []).find((b) => b.type === "text");

    if (!textBlock) {
      return res.status(502).json({ error: "Respuesta sin texto de análisis" });
    }

    const cleaned = textBlock.text.replace(/```json|```/g, "").trim();
    const parsed = JSON.parse(cleaned);

    return res.status(200).json(parsed);
  } catch (err) {
    return res.status(500).json({ error: "Error interno", detail: String(err) });
  }
}
