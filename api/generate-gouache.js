const MAX_IMAGE_BYTES = 3.8 * 1024 * 1024;

function setCors(req, res) {
  const configuredOrigin = process.env.ALLOWED_ORIGIN;
  const requestOrigin = req.headers.origin;
  res.setHeader('Access-Control-Allow-Origin', configuredOrigin || requestOrigin || '*');
  res.setHeader('Vary', 'Origin');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
}

export default async function handler(req, res) {
  setCors(req, res);
  res.setHeader('Cache-Control', 'no-store');

  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST') return res.status(405).json({ error: '仅支持 POST 请求' });
  if (!process.env.OPENAI_API_KEY) return res.status(503).json({ error: '服务端尚未配置 OPENAI_API_KEY' });

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    const image = body?.image;
    const match = typeof image === 'string' && image.match(/^data:image\/(png|jpeg|webp);base64,(.+)$/s);
    if (!match) return res.status(400).json({ error: '请提交 PNG、JPEG 或 WEBP 格式的画布图像' });

    const [, extension, encoded] = match;
    const buffer = Buffer.from(encoded, 'base64');
    if (!buffer.length || buffer.length > MAX_IMAGE_BYTES) return res.status(413).json({ error: '画布图像过大，请精简笔触后重试' });

    const prompt = String(body?.prompt || '').trim().slice(0, 1800) || 'Refine this sketch into a polished soft gouache painting while preserving its composition.';
    const form = new FormData();
    form.append('model', 'gpt-image-2');
    form.append('image', new Blob([buffer], { type: `image/${extension}` }), `sketch.${extension === 'jpeg' ? 'jpg' : extension}`);
    form.append('prompt', prompt);
    form.append('size', '1536x1024');
    form.append('quality', 'medium');

    const openAiResponse = await fetch('https://api.openai.com/v1/images/edits', {
      method: 'POST',
      headers: { Authorization: `Bearer ${process.env.OPENAI_API_KEY}` },
      body: form
    });
    const result = await openAiResponse.json();
    if (!openAiResponse.ok) {
      const message = result?.error?.message || '图像模型暂时不可用';
      return res.status(openAiResponse.status).json({ error: message });
    }

    const generated = result?.data?.[0];
    const generatedImage = generated?.b64_json
      ? `data:image/png;base64,${generated.b64_json}`
      : generated?.url;
    if (!generatedImage) return res.status(502).json({ error: '图像模型未返回可用图片' });
    return res.status(200).json({ image: generatedImage, model: 'gpt-image-2' });
  } catch (error) {
    console.error('Gouache generation failed:', error);
    return res.status(500).json({ error: '水粉图像生成失败，请稍后重试' });
  }
}
