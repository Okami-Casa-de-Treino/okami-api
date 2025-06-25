import { dbManager } from "./config/database.js";
import { apiRouter } from "./routes/index.js";
import { SwaggerHandler } from "./utils/swagger-handler.js";

// Load environment variables
if (process.env.NODE_ENV !== 'production') {
  console.log("🔧 Loading environment variables from .env file");
}

const PORT = process.env.PORT || 3000;

// CORS headers
const corsHeaders = {
  "Access-Control-Allow-Origin": process.env.CORS_ORIGIN || "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
  "Access-Control-Max-Age": "86400",
};

// Helper function to add CORS headers to response
function addCORSHeaders(response: Response): Response {
  Object.entries(corsHeaders).forEach(([key, value]) => {
    response.headers.set(key, value);
  });
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
        return new Response(null, { 
          status: 204, 
          headers: corsHeaders 
        });
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

      // Try to handle with API router
      const routerResponse = await apiRouter.handle(request);
      if (routerResponse) {
        return addCORSHeaders(routerResponse);
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
      ));

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
      ));
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