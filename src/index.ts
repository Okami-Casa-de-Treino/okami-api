import { dbManager } from "./config/database.js";
import { apiRouter } from "./routes/index.js";
import { SwaggerHandler } from "./utils/swagger-handler.js";

// Load environment variables
if (process.env.NODE_ENV !== 'production') {
  console.log("🔧 Loading environment variables from .env file");
}

const PORT = process.env.PORT || 3000;

// Parse allowed origins from env
const allowedOrigins = (process.env.CORS_ORIGIN || "").split(",").map(o => o.trim());

function addCORSHeaders(response: Response, request?: Request): Response {
  const origin = request?.headers.get("Origin");
  if (origin && allowedOrigins.includes(origin)) {
    response.headers.set("Access-Control-Allow-Origin", origin);
  } else {
    response.headers.set("Access-Control-Allow-Origin", allowedOrigins[0] || "*");
  }
  response.headers.set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS, HEAD");
  response.headers.set("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Requested-With");
  response.headers.set("Access-Control-Max-Age", "86400");
  response.headers.set("Access-Control-Allow-Credentials", "true");
  return response;
}

// Start server
const server = Bun.serve({
  port: PORT,
  
  async fetch(request: Request): Promise<Response> {
    try {
      const url = new URL(request.url);
      const path = url.pathname;

      console.log(`${request.method} ${path}`);

      // Handle CORS preflight
      if (request.method === "OPTIONS") {
        return addCORSHeaders(new Response(null, { status: 204 }), request);
      }

      // Swagger Documentation Routes
      if (path === "/api-docs" || path === "/api-docs/") {
        return addCORSHeaders(SwaggerHandler.handleSwaggerUI());
      }

      if (path === "/api-docs/swagger.json") {
        return addCORSHeaders(SwaggerHandler.handleSwaggerJSON());
      }

      if (path === "/docs") {
        return SwaggerHandler.handleSwaggerRedirect();
      }

      // Serve static files (uploads)
      if (path.startsWith('/uploads/')) {
        const filePath = path.replace('/uploads/', '');
        const fullPath = `./uploads/${filePath}`;
        
        try {
          const file = Bun.file(fullPath);
          const exists = await file.exists();
          
          if (exists) {
            const response = new Response(file, {
              headers: {
                'Content-Type': file.type || 'application/octet-stream',
                'Cache-Control': 'public, max-age=31536000' // Cache for 1 year
              }
            });
            return addCORSHeaders(response);
          }
        } catch (error) {
          console.warn('Error serving static file:', error);
        }
      }

      // Try to handle with API router
      const routerResponse = await apiRouter.handle(request);
      if (routerResponse) {
        return addCORSHeaders(routerResponse, request);
      }

      // 404 for unmatched routes
      return addCORSHeaders(new Response(
        JSON.stringify({ 
          success: false, 
          error: "Rota não encontrada" 
        }),
        { 
          status: 404, 
          headers: { "Content-Type": "application/json" } 
        }
      ), request);

    } catch (error) {
      console.error("Server error:", error);
      return addCORSHeaders(new Response(
        JSON.stringify({ 
          success: false, 
          error: "Erro interno do servidor" 
        }),
        { 
          status: 500, 
          headers: { "Content-Type": "application/json" } 
        }
      ), request);
    }
  },
});

// Initialize database and seed default user
async function initialize() {
  try {
    console.log("🔄 Initializing database...");
    await dbManager.seedDefaultUser();
    console.log(`🚀 Server running on http://localhost:${PORT}`);
    console.log(`📚 API Documentation: http://localhost:${PORT}/api-docs`);
    console.log(`📊 Database admin panel: http://localhost:8080`);
    console.log(`🔑 Default admin user: admin/admin123`);
  } catch (error) {
    console.error("❌ Failed to initialize:", error);
    process.exit(1);
  }
}

initialize(); 