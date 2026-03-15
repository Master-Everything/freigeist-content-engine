const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const wpUsername = Deno.env.get('WP_USERNAME');
    const wpPassword = Deno.env.get('WP_APP_PASSWORD');

    if (!wpUsername || !wpPassword) {
      return new Response(JSON.stringify({ 
        error: 'WordPress credentials not configured. Set WP_USERNAME and WP_APP_PASSWORD in secrets.' 
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { imageBase64, filename, testConnection } = await req.json();

    // Test connection mode
    if (testConnection) {
      const testRes = await fetch('https://freigeistkongress.com/wp-json/wp/v2/media?per_page=1', {
        headers: {
          'Authorization': 'Basic ' + btoa(`${wpUsername}:${wpPassword}`),
        },
      });
      const ok = testRes.ok;
      const text = await testRes.text();
      return new Response(JSON.stringify({ 
        success: ok, 
        status: testRes.status,
        message: ok ? 'Connection successful' : `Error: ${text}` 
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (!imageBase64 || !filename) {
      return new Response(JSON.stringify({ error: 'imageBase64 and filename are required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Decode base64 to binary
    const binaryString = atob(imageBase64);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }

    // Upload to WordPress
    const uploadRes = await fetch('https://freigeistkongress.com/wp-json/wp/v2/media', {
      method: 'POST',
      headers: {
        'Authorization': 'Basic ' + btoa(`${wpUsername}:${wpPassword}`),
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Type': 'image/webp',
      },
      body: bytes,
    });

    if (!uploadRes.ok) {
      const errorText = await uploadRes.text();
      return new Response(JSON.stringify({ 
        error: `WordPress upload failed (${uploadRes.status}): ${errorText}` 
      }), {
        status: 502,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const wpData = await uploadRes.json();
    const publicUrl = wpData.source_url || 
      `https://freigeistkongress.com/wp-content/uploads/screenshots/${filename}`;

    return new Response(JSON.stringify({ 
      success: true, 
      url: publicUrl,
      wpId: wpData.id 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
