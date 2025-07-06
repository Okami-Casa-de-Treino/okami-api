import { AuthMiddleware } from "../middleware/auth.js";
import { StudentController } from "../controllers/studentController.js";
import { TeacherController } from "../controllers/teacherController.js";
import { ClassController } from "../controllers/classController.js";
import { CheckinController } from "../controllers/checkinController.js";
import { PaymentController } from "../controllers/paymentController.js";
import { AuthController } from "../controllers/authController.js";
import { ReportController } from "../controllers/reportController.js";
import { BeltController } from "../controllers/beltController.js";
import { VideoController } from "../controllers/videoController.js";
import { ModuleController } from "../controllers/moduleController.js";

// CORS headers
const corsHeaders = {
  "Access-Control-Allow-Origin": process.env.CORS_ORIGIN || "http://localhost:5173",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS, HEAD",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Requested-With",
  "Access-Control-Max-Age": "86400",
  "Access-Control-Allow-Credentials": "true",
};

// Helper function to add CORS headers to response
function addCORSHeaders(response: Response): Response {
  Object.entries(corsHeaders).forEach(([key, value]) => {
    response.headers.set(key, value);
  });
  return response;
}

// Authentication middleware
async function requireAuth(request: Request, roles?: string[]): Promise<{ user: any; error?: Response }> {
  const user = await AuthMiddleware.getUserFromRequest(request);
  
  if (!user) {
    return {
      user: null,
      error: new Response(
        JSON.stringify({ 
          success: false, 
          error: "Token de acesso requerido" 
        }),
        { 
          status: 401, 
          headers: { "Content-Type": "application/json" } 
        }
      )
    };
  }

  if (roles && 'role' in user && !roles.includes(user.role)) {
    return {
      user: null,
      error: new Response(
        JSON.stringify({ 
          success: false, 
          error: "Acesso negado: permissões insuficientes" 
        }),
        { 
          status: 403, 
          headers: { "Content-Type": "application/json" } 
        }
      )
    };
  }

  return { user };
}

// Initialize controllers
const studentController = new StudentController();
const teacherController = new TeacherController();
const classController = new ClassController();
const checkinController = new CheckinController();
const paymentController = new PaymentController();
const authController = new AuthController();
const reportController = new ReportController();
const beltController = new BeltController();
const videoController = new VideoController();
const moduleController = new ModuleController();

// Router class
export class APIRouter {
  async handle(request: Request): Promise<Response | null> {
    const url = new URL(request.url);
    const path = url.pathname;
    const method = request.method;

    // Handle CORS preflight
    if (method === "OPTIONS") {
      return new Response(null, { 
        status: 204, 
        headers: corsHeaders 
      });
    }

    try {
      // Health check
      if (path === "/health" && method === "GET") {
        return await this.handleHealthCheck();
      }

      // Auth routes (public)
      if (path === "/api/auth/login" && method === "POST") {
        return await authController.login(request);
      }

      if (path === "/api/auth/refresh" && method === "POST") {
        return await authController.refresh(request);
      }

      // All other routes require authentication
      const { user, error } = await requireAuth(request);
      if (error) return error;

      // Auth routes (protected)
      if (path === "/api/auth/profile" && method === "GET") {
        return await authController.getProfile(request, user);
      }

      if (path === "/api/auth/logout" && method === "POST") {
        return await authController.logout(request);
      }

      // Student authentication routes
      const studentAuthRoutes = await this.handleStudentAuthRoutes(request, path, method, user);
      if (studentAuthRoutes) return studentAuthRoutes;

      // Student routes
      const studentRoutes = await this.handleStudentRoutes(request, path, method, user);
      if (studentRoutes) return studentRoutes;

      // Teacher routes
      const teacherRoutes = await this.handleTeacherRoutes(request, path, method, user);
      if (teacherRoutes) return teacherRoutes;

      // Class routes
      const classRoutes = await this.handleClassRoutes(request, path, method, user);
      if (classRoutes) return classRoutes;

      // Checkin routes
      const checkinRoutes = await this.handleCheckinRoutes(request, path, method, user);
      if (checkinRoutes) return checkinRoutes;

      // Payment routes
      const paymentRoutes = await this.handlePaymentRoutes(request, path, method, user);
      if (paymentRoutes) return paymentRoutes;

      // Report routes
      const reportRoutes = await this.handleReportRoutes(request, path, method, user);
      if (reportRoutes) return reportRoutes;

      // Belt routes
      const beltRoutes = await this.handleBeltRoutes(request, path, method, user);
      if (beltRoutes) return beltRoutes;

      // Video routes
      const videoRoutes = await this.handleVideoRoutes(request, path, method, user);
      if (videoRoutes) return videoRoutes;

      // Module routes
      const moduleRoutes = await this.handleModuleRoutes(request, path, method, user);
      if (moduleRoutes) return moduleRoutes;

      return null; // No route matched

    } catch (error) {
      console.error(`Error handling ${method} ${path}:`, error);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: "Erro interno do servidor" 
        }),
        { 
          status: 500, 
          headers: { "Content-Type": "application/json" } 
        }
      );
    }
  }

  private async handleHealthCheck(): Promise<Response> {
    const { dbManager } = await import("../config/database.js");
    const isHealthy = await dbManager.healthCheck();
    return new Response(
      JSON.stringify({ 
        success: true, 
        status: isHealthy ? "healthy" : "unhealthy",
        timestamp: new Date().toISOString()
      }),
      { 
        status: isHealthy ? 200 : 503, 
        headers: { "Content-Type": "application/json" } 
      }
    );
  }

  private async handleStudentAuthRoutes(request: Request, path: string, method: string, user: any): Promise<Response | null> {
    // Student profile - only accessible by the student themselves
    if (path === "/api/student/profile" && method === "GET") {
      const { error } = await requireAuth(request, ["student"]);
      if (error) return error;
      return await authController.getStudentProfile(request, user);
    }

    // Student password change
    if (path === "/api/student/change-password" && method === "POST") {
      const { error } = await requireAuth(request, ["student"]);
      if (error) return error;
      return await authController.changeStudentPassword(request, user);
    }

    return null;
  }

  private async handleStudentRoutes(request: Request, path: string, method: string, user: any): Promise<Response | null> {
    // Students collection
    if (path === "/api/students") {
      switch (method) {
        case "GET":
          return await studentController.getAll(request);
        case "POST":
          const { error } = await requireAuth(request, ["admin", "receptionist"]);
          if (error) return error;
          return await studentController.create(request);
      }
    }

    // Student by ID
    const studentMatch = path.match(/^\/api\/students\/([a-f0-9-]+)$/);
    if (studentMatch && studentMatch[1]) {
      const studentId = studentMatch[1];
      switch (method) {
        case "GET":
          return await studentController.getById(request, studentId);
        case "PUT":
          const { error: updateError } = await requireAuth(request, ["admin", "receptionist"]);
          if (updateError) return updateError;
          return await studentController.update(request, studentId);
        case "DELETE":
          const { error: deleteError } = await requireAuth(request, ["admin"]);
          if (deleteError) return deleteError;
          return await studentController.delete(request, studentId);
      }
    }

    // Student checkins
    const studentCheckinsMatch = path.match(/^\/api\/students\/([a-f0-9-]+)\/checkins$/);
    if (studentCheckinsMatch && studentCheckinsMatch[1] && method === "GET") {
      const studentId = studentCheckinsMatch[1];
      return await checkinController.getStudentCheckins(request, studentId);
    }

    // Student payments
    const studentPaymentsMatch = path.match(/^\/api\/students\/([a-f0-9-]+)\/payments$/);
    if (studentPaymentsMatch && studentPaymentsMatch[1] && method === "GET") {
      const studentId = studentPaymentsMatch[1];
      return await paymentController.getByStudent(request, studentId);
    }

    // Student classes
    const studentClassesMatch = path.match(/^\/api\/students\/([a-f0-9-]+)\/classes$/);
    if (studentClassesMatch && studentClassesMatch[1]) {
      const studentId = studentClassesMatch[1];
      switch (method) {
        case "GET":
          return await studentController.getStudentClasses(request, studentId);
        case "POST":
          const { error } = await requireAuth(request, ["admin", "receptionist"]);
          if (error) return error;
          return await studentController.enrollInClass(request, studentId);
      }
    }

    // Student unenroll from class
    const studentUnenrollMatch = path.match(/^\/api\/students\/([a-f0-9-]+)\/classes\/([a-f0-9-]+)$/);
    if (studentUnenrollMatch && studentUnenrollMatch[1] && studentUnenrollMatch[2] && method === "DELETE") {
      const { error } = await requireAuth(request, ["admin", "receptionist"]);
      if (error) return error;
      const studentId = studentUnenrollMatch[1];
      const classId = studentUnenrollMatch[2];
      return await studentController.unenrollFromClass(request, studentId, classId);
    }

    return null;
  }

  private async handleTeacherRoutes(request: Request, path: string, method: string, user: any): Promise<Response | null> {
    // Teachers collection
    if (path === "/api/teachers") {
      switch (method) {
        case "GET":
          return await teacherController.getAll(request);
        case "POST":
          const { error } = await requireAuth(request, ["admin"]);
          if (error) return error;
          return await teacherController.create(request);
      }
    }

    // Teacher by ID
    const teacherMatch = path.match(/^\/api\/teachers\/([a-f0-9-]+)$/);
    if (teacherMatch && teacherMatch[1]) {
      const teacherId = teacherMatch[1];
      switch (method) {
        case "GET":
          return await teacherController.getById(request, teacherId);
        case "PUT":
          const { error: updateError } = await requireAuth(request, ["admin"]);
          if (updateError) return updateError;
          return await teacherController.update(request, teacherId);
        case "DELETE":
          const { error: deleteError } = await requireAuth(request, ["admin"]);
          if (deleteError) return deleteError;
          return await teacherController.delete(request, teacherId);
      }
    }

    // Teacher classes
    const teacherClassesMatch = path.match(/^\/api\/teachers\/([a-f0-9-]+)\/classes$/);
    if (teacherClassesMatch && teacherClassesMatch[1] && method === "GET") {
      const teacherId = teacherClassesMatch[1];
      return await teacherController.getTeacherClasses(request, teacherId);
    }

    return null;
  }

  private async handleClassRoutes(request: Request, path: string, method: string, user: any): Promise<Response | null> {
    // Classes collection
    if (path === "/api/classes") {
      switch (method) {
        case "GET":
          return await classController.getAll(request);
        case "POST":
          const { error } = await requireAuth(request, ["admin", "teacher"]);
          if (error) return error;
          return await classController.create(request);
      }
    }

    // Class schedule
    if (path === "/api/classes/schedule" && method === "GET") {
      return await classController.getSchedule(request);
    }

    // Class by ID
    const classMatch = path.match(/^\/api\/classes\/([a-f0-9-]+)$/);
    if (classMatch && classMatch[1]) {
      const classId = classMatch[1];
      switch (method) {
        case "GET":
          return await classController.getById(request, classId);
        case "PUT":
          const { error: updateError } = await requireAuth(request, ["admin", "teacher"]);
          if (updateError) return updateError;
          return await classController.update(request, classId);
        case "DELETE":
          const { error: deleteError } = await requireAuth(request, ["admin"]);
          if (deleteError) return deleteError;
          return await classController.delete(request, classId);
      }
    }

    // Class students
    const classStudentsMatch = path.match(/^\/api\/classes\/([a-f0-9-]+)\/students$/);
    if (classStudentsMatch && classStudentsMatch[1] && method === "GET") {
      const classId = classStudentsMatch[1];
      return await classController.getClassStudents(request, classId);
    }

    // Class checkins
    const classCheckinsMatch = path.match(/^\/api\/classes\/([a-f0-9-]+)\/checkins$/);
    if (classCheckinsMatch && classCheckinsMatch[1] && method === "GET") {
      const classId = classCheckinsMatch[1];
      return await checkinController.getClassCheckins(request, classId);
    }

    return null;
  }

  private async handleCheckinRoutes(request: Request, path: string, method: string, user: any): Promise<Response | null> {
    // Checkins collection
    if (path === "/api/checkins") {
      switch (method) {
        case "GET":
          return await checkinController.getAll(request);
        case "POST":
          return await checkinController.create(request);
      }
    }

    // Today's checkins
    if (path === "/api/checkins/today" && method === "GET") {
      return await checkinController.getTodayCheckins(request);
    }

    // Checkin by student
    const checkinStudentMatch = path.match(/^\/api\/checkins\/student\/([a-f0-9-]+)$/);
    if (checkinStudentMatch && checkinStudentMatch[1] && method === "GET") {
      const studentId = checkinStudentMatch[1];
      return await checkinController.getStudentCheckins(request, studentId);
    }

    // Checkin by class
    const checkinClassMatch = path.match(/^\/api\/checkins\/class\/([a-f0-9-]+)$/);
    if (checkinClassMatch && checkinClassMatch[1] && method === "GET") {
      const classId = checkinClassMatch[1];
      return await checkinController.getClassCheckins(request, classId);
    }

    // Delete checkin
    const checkinMatch = path.match(/^\/api\/checkins\/([a-f0-9-]+)$/);
    if (checkinMatch && checkinMatch[1] && method === "DELETE") {
      const { error } = await requireAuth(request, ["admin", "receptionist"]);
      if (error) return error;
      const checkinId = checkinMatch[1];
      return await checkinController.delete(request, checkinId);
    }

    return null;
  }

  private async handlePaymentRoutes(request: Request, path: string, method: string, user: any): Promise<Response | null> {
    // Payments collection
    if (path === "/api/payments") {
      switch (method) {
        case "GET":
          return await paymentController.getAll(request);
        case "POST":
          const { error } = await requireAuth(request, ["admin", "receptionist"]);
          if (error) return error;
          return await paymentController.create(request);
      }
    }

    // Overdue payments
    if (path === "/api/payments/overdue" && method === "GET") {
      return await paymentController.getOverdue(request);
    }

    // Generate monthly payments
    if (path === "/api/payments/generate-monthly" && method === "POST") {
      const { error } = await requireAuth(request, ["admin"]);
      if (error) return error;
      return await paymentController.generateMonthly(request);
    }

    // Payment by student
    const paymentStudentMatch = path.match(/^\/api\/payments\/student\/([a-f0-9-]+)$/);
    if (paymentStudentMatch && paymentStudentMatch[1] && method === "GET") {
      const studentId = paymentStudentMatch[1];
      return await paymentController.getByStudent(request, studentId);
    }

    // Payment by ID
    const paymentMatch = path.match(/^\/api\/payments\/([a-f0-9-]+)$/);
    if (paymentMatch && paymentMatch[1]) {
      const paymentId = paymentMatch[1];
      switch (method) {
        case "GET":
          return await paymentController.getById(request, paymentId);
        case "PUT":
          const { error: updateError } = await requireAuth(request, ["admin", "receptionist"]);
          if (updateError) return updateError;
          return await paymentController.update(request, paymentId);
        case "DELETE":
          const { error: deleteError } = await requireAuth(request, ["admin"]);
          if (deleteError) return deleteError;
          return await paymentController.delete(request, paymentId);
      }
    }

    // Mark payment as paid
    const paymentPayMatch = path.match(/^\/api\/payments\/([a-f0-9-]+)\/pay$/);
    if (paymentPayMatch && paymentPayMatch[1] && method === "POST") {
      const { error } = await requireAuth(request, ["admin", "receptionist"]);
      if (error) return error;
      const paymentId = paymentPayMatch[1];
      return await paymentController.markAsPaid(request, paymentId);
    }

    return null;
  }

  private async handleReportRoutes(request: Request, path: string, method: string, user: any): Promise<Response | null> {
    // All report routes require admin access
    const { error } = await requireAuth(request, ["admin"]);
    if (error) return error;

    if (method !== "GET") return null;

    switch (path) {
      case "/api/reports/dashboard":
        return await reportController.getDashboard(request);
      case "/api/reports/attendance":
        return await reportController.getAttendance(request);
      case "/api/reports/financial":
        return await reportController.getFinancial(request);
      case "/api/reports/students":
        return await reportController.getStudents(request);
      case "/api/reports/classes":
        return await reportController.getClasses(request);
    }

    return null;
  }

  private async handleBeltRoutes(request: Request, path: string, method: string, user: any): Promise<Response | null> {
    // Belt promotions collection
    if (path === "/api/belts/promotions") {
      switch (method) {
        case "GET":
          return await beltController.getAll(request);
      }
    }

    // Promote student
    if (path === "/api/belts/promote" && method === "POST") {
      const { error } = await requireAuth(request, ["admin", "teacher"]);
      if (error) return error;
      return await beltController.promoteStudent(request, user.id);
    }

    // Belt overview
    if (path === "/api/belts/overview" && method === "GET") {
      return await beltController.getBeltOverview(request);
    }

    // Belt promotion by ID
    const promotionMatch = path.match(/^\/api\/belts\/promotions\/([a-f0-9-]+)$/);
    if (promotionMatch && promotionMatch[1] && method === "GET") {
      const promotionId = promotionMatch[1];
      return await beltController.getById(request, promotionId);
    }

    // Student belt progress (already handled in student routes, but we can add it here too)
    const studentProgressMatch = path.match(/^\/api\/students\/([a-f0-9-]+)\/belt-progress$/);
    if (studentProgressMatch && studentProgressMatch[1] && method === "GET") {
      const studentId = studentProgressMatch[1];
      return await beltController.getStudentBeltProgress(request, studentId);
    }

    return null;
  }

  private async handleVideoRoutes(request: Request, path: string, method: string, user: any): Promise<Response | null> {
    // Videos collection
    if (path === "/api/videos") {
      switch (method) {
        case "GET":
          return await videoController.getAll(request);
        case "POST":
          const { error } = await requireAuth(request, ["admin", "teacher"]);
          if (error) return error;
          return await videoController.create(request);
      }
    }

    // Videos by module
    const videoModuleMatch = path.match(/^\/api\/videos\/module\/([a-f0-9-]+)$/);
    if (videoModuleMatch && videoModuleMatch[1] && method === "GET") {
      const moduleId = videoModuleMatch[1];
      return await videoController.getByModule(request, moduleId);
    }

    // Videos by class
    const videoClassMatch = path.match(/^\/api\/videos\/class\/([a-f0-9-]+)$/);
    if (videoClassMatch && videoClassMatch[1] && method === "GET") {
      const classId = videoClassMatch[1];
      return await videoController.getByClass(request, classId);
    }

    // Free videos (not assigned to any class)
    if (path === "/api/videos/free" && method === "GET") {
      return await videoController.getFreeVideos(request);
    }

    // File upload
    if (path === "/api/videos/upload" && method === "POST") {
      const { error } = await requireAuth(request, ["admin", "teacher"]);
      if (error) return error;
      return await videoController.uploadFile(request);
    }

    // Video by ID
    const videoMatch = path.match(/^\/api\/videos\/([a-f0-9-]+)$/);
    if (videoMatch && videoMatch[1]) {
      const videoId = videoMatch[1];
      switch (method) {
        case "GET":
          return await videoController.getById(request, videoId);
        case "PUT":
          const { error: updateError } = await requireAuth(request, ["admin", "teacher"]);
          if (updateError) return updateError;
          return await videoController.update(request, videoId);
        case "DELETE":
          const { error: deleteError } = await requireAuth(request, ["admin", "teacher"]);
          if (deleteError) return deleteError;
          return await videoController.delete(request, videoId);
      }
    }

    return null;
  }

  private async handleModuleRoutes(request: Request, path: string, method: string, user: any): Promise<Response | null> {
    // Modules collection
    if (path === "/api/modules") {
      switch (method) {
        case "GET":
          return await moduleController.getAll(request);
        case "POST":
          const { error } = await requireAuth(request, ["admin"]);
          if (error) return error;
          return await moduleController.create(request);
      }
    }

    // Module by ID
    const moduleMatch = path.match(/^\/api\/modules\/([a-f0-9-]+)$/);
    if (moduleMatch && moduleMatch[1]) {
      const moduleId = moduleMatch[1];
      switch (method) {
        case "GET":
          return await moduleController.getById(request, moduleId);
        case "PUT":
          const { error: updateError } = await requireAuth(request, ["admin"]);
          if (updateError) return updateError;
          return await moduleController.update(request, moduleId);
        case "DELETE":
          const { error: deleteError } = await requireAuth(request, ["admin"]);
          if (deleteError) return deleteError;
          return await moduleController.delete(request, moduleId);
      }
    }

    return null;
  }
}

// Create and export router instance
export const apiRouter = new APIRouter(); 