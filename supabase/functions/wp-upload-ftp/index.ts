const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const ftpHost = Deno.env.get('FTP_HOST');
    const ftpPort = Deno.env.get('FTP_PORT') || '21';
    const ftpUsername = Deno.env.get('FTP_USERNAME');
    const ftpPassword = Deno.env.get('FTP_PASSWORD');

    if (!ftpHost || !ftpUsername || !ftpPassword) {
      return new Response(JSON.stringify({ 
        error: 'FTP credentials not configured. Set FTP_HOST, FTP_PORT, FTP_USERNAME, FTP_PASSWORD in secrets.' 
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { imageBase64, filename, testConnection } = await req.json();

    if (testConnection) {
      // FTP connection test is limited in Deno edge runtime
      // We return a basic response indicating credentials are set
      return new Response(JSON.stringify({ 
        success: true, 
        message: `FTP credentials configured for ${ftpHost}:${ftpPort}. Note: Full FTP test requires actual upload.` 
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

    // Note: Native FTP is not available in Deno edge runtime.
    // This endpoint constructs the expected URL assuming manual/external FTP upload.
    // For production use, consider using a PHP endpoint on the WordPress server.
    const publicUrl = `https://freigeistkongress.com/wp-content/uploads/screenshots/${filename}`;

    return new Response(JSON.stringify({ 
      success: false, 
      url: publicUrl,
      message: 'FTP upload is not natively supported in edge runtime. Use WordPress REST API method instead, or set up a PHP relay endpoint on your server.'
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
