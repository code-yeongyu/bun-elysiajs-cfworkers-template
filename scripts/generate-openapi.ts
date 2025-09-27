#!/usr/bin/env bun
import { existsSync, mkdirSync, writeFileSync } from 'fs';
import { join } from 'path';

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const isPortInUse = async (port: number): Promise<boolean> => {
  try {
    await fetch(`http://localhost:${port}`);
    return true;
  } catch {
    return false;
  }
};

const findAvailablePort = async (startPort: number): Promise<number> => {
  let port = startPort;
  const maxAttempts = 100;

  for (let i = 0; i < maxAttempts; i++) {
    if (!await isPortInUse(port)) {
      console.log(`✅ Found available port: ${port}`);
      return port;
    }
    console.log(`⚠️  Port ${port} is in use, trying ${port + 1}...`);
    port++;
  }

  throw new Error(`Could not find available port after ${maxAttempts} attempts starting from ${startPort}`);
};

const waitForHealthy = async (url: string, timeout = 10000): Promise<void> => {
  const startTime = Date.now();
  const checkInterval = 10;

  console.log(`🩺 Waiting for server to become healthy at ${url}...`);

  while (Date.now() - startTime < timeout) {
    try {
      const response = await fetch(url);
      if (response.ok) {
        console.log(`✨ Server is healthy after ${Date.now() - startTime}ms`);
        return;
      }
    } catch {
      // Server not ready yet
    }

    await sleep(checkInterval);
  }

  throw new Error(`Server did not become healthy within ${timeout}ms`);
};

const generateOpenAPISpec = async () => {
  console.log('🔧 Generating OpenAPI specification...');

  try {
    // Find available port with retry mechanism
    const startPort = 9999;
    const port = await findAvailablePort(startPort);

    // Start the separate OpenAPI server process
    console.log(`🚀 Starting OpenAPI generation server on port ${port}...`);
    const serverProcess = Bun.spawn([
      'bun',
      'run',
      './scripts/openapi-server.ts'
    ], {
      env: { ...process.env, PORT: port.toString() },
      stdout: 'pipe',
      stderr: 'pipe'
    });

    // Give the server a moment to start
    await sleep(2000);

    // Wait for server to be healthy
    const healthUrl = `http://localhost:${port}/health`;
    await waitForHealthy(healthUrl);

    let spec: any = null;

    try {
      // Fetch the OpenAPI spec from the running server
      console.log('📥 Fetching OpenAPI spec from server...');
      const response = await fetch(`http://localhost:${port}/swagger/json`);

      if (response.ok) {
        spec = await response.json();
        console.log('✨ Successfully fetched OpenAPI spec from server!');
      } else {
        console.error('❌ Failed to fetch OpenAPI spec:', response.status, response.statusText);
      }
    } finally {
      // Stop the server process
      serverProcess.kill();
      console.log('🛑 OpenAPI server stopped');
    }

    if (!spec) {
      console.error('❌ Failed to fetch OpenAPI spec from swagger endpoint');
      process.exit(1);
    }

    console.log('📊 Found paths:', Object.keys(spec.paths || {}));

    // Filter out swagger and docs routes
    const filteredPaths: any = {};
    if (spec.paths) {
      for (const [path, methods] of Object.entries(spec.paths)) {
        if (!path.startsWith('/swagger') && !path.startsWith('/docs')) {
          filteredPaths[path] = methods;
        }
      }
    }

    // Use the spec as-is from the server (it already has all config from getOpenAPIConfig)
    const finalSpec = {
      ...spec,
      paths: filteredPaths
    };

    // Ensure directory exists
    const outputPath = join(process.cwd(), 'public/docs');
    if (!existsSync(outputPath)) {
      mkdirSync(outputPath, { recursive: true });
    }

    // Write OpenAPI spec
    const specPath = join(outputPath, 'openapi.json');
    writeFileSync(specPath, JSON.stringify(finalSpec, null, 2));

    // Write timestamp for freshness check
    const metaPath = join(outputPath, 'meta.json');
    const metadata = {
      generatedAt: new Date().toISOString(),
      version: finalSpec.info?.version || '1.0.0'
    };
    writeFileSync(metaPath, JSON.stringify(metadata, null, 2));

    // Generate HTML documentation pages
    const scalarHtml = `<!DOCTYPE html>
<html>
<head>
  <title>${finalSpec.info?.title || 'API Documentation'} - Scalar</title>
  <meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1">
</head>
<body>
  <script id="api-reference" data-url="/docs/openapi.json"></script>
  <script src="https://cdn.jsdelivr.net/npm/@scalar/api-reference"></script>
</body>
</html>`;

    const redocHtml = `<!DOCTYPE html>
<html>
<head>
  <title>${finalSpec.info?.title || 'API Documentation'} - ReDoc</title>
  <meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <style>
    body {
      margin: 0;
      padding: 0;
    }
  </style>
</head>
<body>
  <redoc spec-url="/docs/openapi.json"></redoc>
  <script src="https://cdn.redoc.ly/redoc/latest/bundles/redoc.standalone.js"></script>
</body>
</html>`;

    const swaggerHtml = `<!DOCTYPE html>
<html>
<head>
  <title>${finalSpec.info?.title || 'API Documentation'} - Swagger UI</title>
  <meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <link rel="stylesheet" type="text/css" href="https://unpkg.com/swagger-ui-dist@5/swagger-ui.css">
  <style>
    body {
      margin: 0;
      padding: 0;
    }
  </style>
</head>
<body>
  <div id="swagger-ui"></div>
  <script src="https://unpkg.com/swagger-ui-dist@5/swagger-ui-bundle.js"></script>
  <script src="https://unpkg.com/swagger-ui-dist@5/swagger-ui-standalone-preset.js"></script>
  <script>
    window.onload = () => {
      window.ui = SwaggerUIBundle({
        url: '/docs/openapi.json',
        dom_id: '#swagger-ui',
        presets: [
          SwaggerUIBundle.presets.apis,
          SwaggerUIStandalonePreset
        ],
        layout: "StandaloneLayout"
      });
    };
  </script>
</body>
</html>`;

    writeFileSync(join(outputPath, 'scalar.html'), scalarHtml);
    writeFileSync(join(outputPath, 'redoc.html'), redocHtml);
    writeFileSync(join(outputPath, 'swagger.html'), swaggerHtml);

    console.log('✅ OpenAPI specification generated successfully!');
    console.log(`📁 Output: ${specPath}`);
    console.log(`📄 Generated HTML files: scalar.html, redoc.html, swagger.html`);

    return finalSpec;
  } catch (error) {
    console.error('❌ Failed to generate OpenAPI specification:', error);
    process.exit(1);
  }
};

// Run if executed directly
if (import.meta.main) {
  generateOpenAPISpec();
}

export { generateOpenAPISpec };