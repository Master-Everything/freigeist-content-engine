import "https://deno.land/x/xhr@0.1.0/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const apiKey = Deno.env.get('SCREENSHOTONE_API_KEY');
    if (!apiKey) {
      return new Response(JSON.stringify({ error: 'SCREENSHOTONE_API_KEY not configured' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { url, fullPage } = await req.json();

    if (!url) {
      return new Response(JSON.stringify({ error: 'URL is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // If fullPage mode, capture full page screenshot for preview
    if (fullPage) {
      const params = new URLSearchParams({
        access_key: apiKey,
        url: url,
        full_page: 'true',
        viewport_width: '1280',
        format: 'png',
        block_ads: 'true',
        block_cookie_banners: 'true',
        delay: '3',
      });

      const screenshotUrl = `https://api.screenshotone.com/take?${params.toString()}`;
      const response = await fetch(screenshotUrl);

      if (!response.ok) {
        const errorText = await response.text();
        return new Response(JSON.stringify({ error: `ScreenshotOne error: ${errorText}` }), {
          status: 502,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const imageBuffer = await response.arrayBuffer();
      const base64 = btoa(String.fromCharCode(...new Uint8Array(imageBuffer)));

      return new Response(JSON.stringify({ image: base64, format: 'png' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Crop mode: capture specific region
    const { crop } = await req.json().catch(() => ({ crop: null }));
    // Re-parse since we already consumed the body
    // Actually we need to handle this differently - let's accept all params upfront

    return new Response(JSON.stringify({ error: 'Use fullPage mode first, then crop on client' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
