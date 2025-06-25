import { prisma } from "../config/prisma.js";
import { dateRangeSchema, validateUUID } from "../utils/validation.js";
import type { Prisma } from "../generated/prisma/index.js";

export class ReportController {
  async getDashboard(request: Request): Promise<Response> {
    try {
      // Get dashboard statistics in parallel
      const [
        totalStudents,
        totalTeachers,
        totalClasses,
        todayCheckins,
        pendingPayments,
        monthlyRevenue
      ] = await Promise.all([
        prisma.student.count({ where: { status: 'active' } }),
        prisma.teacher.count({ where: { status: 'active' } }),
        prisma.class.count({ where: { status: 'active' } }),
        prisma.checkin.count({
          where: {
            checkin_date: new Date().toISOString().split('T')[0]
          }
        }),
        prisma.payment.count({ where: { status: 'pending' } }),
        prisma.payment.aggregate({
          where: {
            status: 'paid',
            payment_date: {
              gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
              lte: new Date()
            }
          },
          _sum: {
            amount: true
          }
        })
      ]);

      return new Response(JSON.stringify({ 
        success: true, 
        data: { 
          totalStudents, 
          totalTeachers, 
          totalClasses, 
          todayCheckins,
          pendingPayments,
          monthlyRevenue: monthlyRevenue._sum.amount || 0
        }, 
        message: "Dashboard data retrieved successfully" 
      }), {
        status: 200,
        headers: { "Content-Type": "application/json" }
      });

    } catch (error) {
      console.error("Get dashboard error:", error);
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

  async getAttendance(request: Request): Promise<Response> {
    try {
      const url = new URL(request.url);
      const queryParams = Object.fromEntries(url.searchParams);
      
      const dateRange = dateRangeSchema.parse(queryParams);

      // Build where clause for checkins
      const checkinWhere: Prisma.CheckinWhereInput = {};
      if (dateRange.start_date || dateRange.end_date) {
        checkinWhere.checkin_date = {};
        if (dateRange.start_date) checkinWhere.checkin_date.gte = new Date(dateRange.start_date);
        if (dateRange.end_date) checkinWhere.checkin_date.lte = new Date(dateRange.end_date);
      }

      // Get attendance data
      const attendanceData = await prisma.checkin.findMany({
        where: checkinWhere,
        include: {
          student: {
            select: {
              id: true,
              full_name: true,
              belt: true,
              belt_degree: true
            }
          },
          class: {
            select: {
              id: true,
              name: true,
              teacher: {
                select: {
                  full_name: true
                }
              }
            }
          }
        },
        orderBy: {
          checkin_date: 'desc'
        }
      });

      // Get attendance summary
      const attendanceSummary = await prisma.checkin.groupBy({
        by: ['checkin_date'],
        where: checkinWhere,
        _count: {
          id: true
        },
        orderBy: {
          checkin_date: 'desc'
        }
      });

      return new Response(JSON.stringify({ 
        success: true, 
        data: {
          checkins: attendanceData,
          summary: attendanceSummary.map(item => ({
            date: item.checkin_date,
            count: item._count.id
          }))
        }, 
        message: "Attendance report retrieved successfully" 
      }), {
        status: 200,
        headers: { "Content-Type": "application/json" }
      });

    } catch (error) {
      console.error("Get attendance report error:", error);
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

  async getFinancial(request: Request): Promise<Response> {
    try {
      const url = new URL(request.url);
      const queryParams = Object.fromEntries(url.searchParams);
      
      const dateRange = dateRangeSchema.parse(queryParams);

      // Build where clause for payments
      const paymentWhere: Prisma.PaymentWhereInput = { status: 'paid' };
      if (dateRange.start_date || dateRange.end_date) {
        paymentWhere.payment_date = {};
        if (dateRange.start_date) paymentWhere.payment_date.gte = new Date(dateRange.start_date);
        if (dateRange.end_date) paymentWhere.payment_date.lte = new Date(dateRange.end_date);
      }

      // Get financial data in parallel
      const [
        totalRevenue,
        pendingAmount,
        overdueAmount,
        paymentsByMethod,
        monthlyRevenue
      ] = await Promise.all([
        prisma.payment.aggregate({
          where: paymentWhere,
          _sum: { amount: true }
        }),
        prisma.payment.aggregate({
          where: { status: 'pending' },
          _sum: { amount: true }
        }),
        prisma.payment.aggregate({
          where: { status: 'overdue' },
          _sum: { amount: true }
        }),
        prisma.payment.groupBy({
          by: ['payment_method'],
          where: paymentWhere,
          _sum: { amount: true },
          _count: { id: true }
        }),
        prisma.payment.groupBy({
          by: ['reference_month'],
          where: paymentWhere,
          _sum: { amount: true },
          orderBy: { reference_month: 'desc' }
        })
      ]);

      return new Response(JSON.stringify({ 
        success: true, 
        data: {
          summary: {
            total_revenue: totalRevenue._sum.amount || 0,
            pending_amount: pendingAmount._sum.amount || 0,
            overdue_amount: overdueAmount._sum.amount || 0
          },
          by_payment_method: paymentsByMethod.map(item => ({
            method: item.payment_method || 'not_specified',
            amount: item._sum.amount || 0,
            count: item._count.id
          })),
          monthly_revenue: monthlyRevenue.map(item => ({
            month: item.reference_month,
            amount: item._sum.amount || 0
          }))
        }, 
        message: "Financial report retrieved successfully" 
      }), {
        status: 200,
        headers: { "Content-Type": "application/json" }
      });

    } catch (error) {
      console.error("Get financial report error:", error);
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

  async getStudents(request: Request): Promise<Response> {
    try {
      const url = new URL(request.url);
      const queryParams = Object.fromEntries(url.searchParams);
      
      const dateRange = dateRangeSchema.parse(queryParams);

      // Build where clause for students
      const studentWhere: Prisma.StudentWhereInput = {};
      if (dateRange.start_date || dateRange.end_date) {
        studentWhere.created_at = {};
        if (dateRange.start_date) studentWhere.created_at.gte = new Date(dateRange.start_date);
        if (dateRange.end_date) studentWhere.created_at.lte = new Date(dateRange.end_date);
      }

      // Build where clause for checkins
      const checkinWhere: Prisma.CheckinWhereInput = {};
      if (dateRange.start_date || dateRange.end_date) {
        checkinWhere.checkin_date = {};
        if (dateRange.start_date) checkinWhere.checkin_date.gte = new Date(dateRange.start_date);
        if (dateRange.end_date) checkinWhere.checkin_date.lte = new Date(dateRange.end_date);
      }

      // Get student statistics
      const [
        studentsByStatus,
        studentsByBelt,
        newStudents,
        studentsWithRecentActivity
      ] = await Promise.all([
        prisma.student.groupBy({
          by: ['status'],
          _count: { id: true }
        }),
        prisma.student.groupBy({
          by: ['belt'],
          _count: { id: true },
          orderBy: { _count: { id: 'desc' } }
        }),
        prisma.student.findMany({
          where: studentWhere,
          select: {
            id: true,
            full_name: true,
            enrollment_date: true,
            belt: true,
            status: true
          },
          orderBy: { created_at: 'desc' }
        }),
        prisma.student.findMany({
          where: {
            checkins: {
              some: checkinWhere
            }
          },
          select: {
            id: true,
            full_name: true,
            _count: {
              select: {
                checkins: Object.keys(checkinWhere).length > 0 ? {
                  where: checkinWhere
                } : true
              }
            }
          },
          orderBy: {
            checkins: {
              _count: 'desc'
            }
          }
        })
      ]);

      return new Response(JSON.stringify({ 
        success: true, 
        data: {
          by_status: studentsByStatus.map(item => ({
            status: item.status,
            count: item._count.id
          })),
          by_belt: studentsByBelt.map(item => ({
            belt: item.belt || 'Sem faixa',
            count: item._count.id
          })),
          new_students: newStudents,
          active_students: studentsWithRecentActivity
        }, 
        message: "Students report retrieved successfully" 
      }), {
        status: 200,
        headers: { "Content-Type": "application/json" }
      });

    } catch (error) {
      console.error("Get students report error:", error);
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

  async getClasses(request: Request): Promise<Response> {
    try {
      const url = new URL(request.url);
      const queryParams = Object.fromEntries(url.searchParams);
      
      const dateRange = dateRangeSchema.parse(queryParams);

      // Build where clause for checkins
      const checkinWhere: Prisma.CheckinWhereInput = {};
      if (dateRange.start_date || dateRange.end_date) {
        checkinWhere.checkin_date = {};
        if (dateRange.start_date) checkinWhere.checkin_date.gte = new Date(dateRange.start_date);
        if (dateRange.end_date) checkinWhere.checkin_date.lte = new Date(dateRange.end_date);
      }

      // Get class statistics
      const [
        classesByStatus,
        classesByDayOfWeek,
        classesWithEnrollmentCount,
        classesWithAttendance
      ] = await Promise.all([
        prisma.class.groupBy({
          by: ['status'],
          _count: { id: true }
        }),
        prisma.class.groupBy({
          by: ['day_of_week'],
          _count: { id: true },
          orderBy: { day_of_week: 'asc' }
        }),
        prisma.class.findMany({
          include: {
            teacher: {
              select: {
                full_name: true
              }
            },
            _count: {
              select: {
                student_classes: {
                  where: { status: 'active' }
                }
              }
            }
          },
          orderBy: {
            student_classes: {
              _count: 'desc'
            }
          }
        }),
        prisma.class.findMany({
          include: {
            _count: {
              select: {
                checkins: Object.keys(checkinWhere).length > 0 ? {
                  where: checkinWhere
                } : true
              }
            }
          }
        })
      ]);

      const daysOfWeek = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];

      return new Response(JSON.stringify({ 
        success: true, 
        data: {
          by_status: classesByStatus.map(item => ({
            status: item.status,
            count: item._count.id
          })),
          by_day_of_week: classesByDayOfWeek.map(item => ({
            day: daysOfWeek[item.day_of_week || 0],
            day_number: item.day_of_week,
            count: item._count.id
          })),
          enrollment_stats: classesWithEnrollmentCount.map(cls => ({
            id: cls.id,
            name: cls.name,
            teacher: cls.teacher?.full_name || 'Sem professor',
            max_students: cls.max_students,
            enrolled_students: cls._count.student_classes,
            occupancy_rate: cls.max_students ? (cls._count.student_classes / cls.max_students * 100).toFixed(1) : 0
          })),
          attendance_stats: classesWithAttendance.map(cls => ({
            id: cls.id,
            name: cls.name,
            checkins_count: cls._count.checkins
          }))
        }, 
        message: "Classes report retrieved successfully" 
      }), {
        status: 200,
        headers: { "Content-Type": "application/json" }
      });

    } catch (error) {
      console.error("Get classes report error:", error);
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

  async getStudentReport(request: Request): Promise<Response> {
    try {
      const url = new URL(request.url);
      const queryParams = Object.fromEntries(url.searchParams);
      
      const dateRange = dateRangeSchema.parse(queryParams);

      // Build date filter
      const dateFilter: Prisma.DateTimeFilter = {};
      if (dateRange.start_date) dateFilter.gte = new Date(dateRange.start_date);
      if (dateRange.end_date) dateFilter.lte = new Date(dateRange.end_date);

      // Get student statistics
      const [
        totalStudents,
        activeStudents,
        inactiveStudents,
        suspendedStudents,
        newStudentsThisPeriod,
        studentsWithPayments,
        studentsWithCheckins
      ] = await Promise.all([
        prisma.student.count(),
        prisma.student.count({ where: { status: 'active' } }),
        prisma.student.count({ where: { status: 'inactive' } }),
        prisma.student.count({ where: { status: 'suspended' } }),
        prisma.student.count({
          where: Object.keys(dateFilter).length > 0 ? {
            created_at: dateFilter
          } : undefined
        }),
        prisma.student.count({
          where: {
            payments: {
              some: Object.keys(dateFilter).length > 0 ? {
                created_at: dateFilter
              } : {}
            }
          }
        }),
        prisma.student.count({
          where: {
            checkins: {
              some: Object.keys(dateFilter).length > 0 ? {
                checkin_date: dateFilter
              } : {}
            }
          }
        })
      ]);

      // Get students by belt
      const studentsByBelt = await prisma.student.groupBy({
        by: ['belt'],
        _count: {
          id: true
        },
        orderBy: {
          _count: {
            id: 'desc'
          }
        }
      });

      // Get age group distribution
      const studentsWithAges = await prisma.student.findMany({
        select: {
          birth_date: true
        },
        where: {
          birth_date: { not: null }
        }
      });

      const ageGroups = {
        'Infantil (0-12)': 0,
        'Juvenil (13-17)': 0,
        'Adulto (18-35)': 0,
        'Veterano (36+)': 0
      };

      const currentYear = new Date().getFullYear();
      studentsWithAges.forEach(student => {
        if (student.birth_date) {
          const age = currentYear - student.birth_date.getFullYear();
          if (age <= 12) ageGroups['Infantil (0-12)']++;
          else if (age <= 17) ageGroups['Juvenil (13-17)']++;
          else if (age <= 35) ageGroups['Adulto (18-35)']++;
          else ageGroups['Veterano (36+)']++;
        }
      });

      return new Response(
        JSON.stringify({
          success: true,
          data: {
            summary: {
              total_students: totalStudents,
              active_students: activeStudents,
              inactive_students: inactiveStudents,
              suspended_students: suspendedStudents,
              new_students_period: newStudentsThisPeriod,
              students_with_payments: studentsWithPayments,
              students_with_checkins: studentsWithCheckins
            },
            by_belt: studentsByBelt.map(item => ({
              belt: item.belt || 'Sem faixa',
              count: item._count.id
            })),
            by_age_group: Object.entries(ageGroups).map(([group, count]) => ({
              age_group: group,
              count
            }))
          }
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json" }
        }
      );

    } catch (error) {
      console.error("Get student report error:", error);
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

  async getFinancialReport(request: Request): Promise<Response> {
    try {
      const url = new URL(request.url);
      const queryParams = Object.fromEntries(url.searchParams);
      
      const dateRange = dateRangeSchema.parse(queryParams);

      // Build date filter
      const dateFilter: Prisma.DateTimeFilter = {};
      if (dateRange.start_date) dateFilter.gte = new Date(dateRange.start_date);
      if (dateRange.end_date) dateFilter.lte = new Date(dateRange.end_date);

      // Get payment statistics
      const [
        totalPayments,
        paidPayments,
        pendingPayments,
        overduePayments,
        cancelledPayments,
        totalRevenue,
        totalDiscounts,
        totalLateFees
      ] = await Promise.all([
        prisma.payment.count({
          where: {
            created_at: Object.keys(dateFilter).length > 0 ? dateFilter : undefined
          }
        }),
        prisma.payment.count({
          where: {
            status: 'paid',
            payment_date: Object.keys(dateFilter).length > 0 ? dateFilter : undefined
          }
        }),
        prisma.payment.count({
          where: {
            status: 'pending',
            created_at: Object.keys(dateFilter).length > 0 ? dateFilter : undefined
          }
        }),
        prisma.payment.count({
          where: {
            status: 'overdue',
            created_at: Object.keys(dateFilter).length > 0 ? dateFilter : undefined
          }
        }),
        prisma.payment.count({
          where: {
            status: 'cancelled',
            created_at: Object.keys(dateFilter).length > 0 ? dateFilter : undefined
          }
        }),
        prisma.payment.aggregate({
          _sum: {
            amount: true
          },
          where: {
            status: 'paid',
            payment_date: Object.keys(dateFilter).length > 0 ? dateFilter : undefined
          }
        }),
        prisma.payment.aggregate({
          _sum: {
            discount: true
          },
          where: {
            status: 'paid',
            payment_date: Object.keys(dateFilter).length > 0 ? dateFilter : undefined
          }
        }),
        prisma.payment.aggregate({
          _sum: {
            late_fee: true
          },
          where: {
            status: 'paid',
            payment_date: Object.keys(dateFilter).length > 0 ? dateFilter : undefined
          }
        })
      ]);

      // Get revenue by payment method
      const revenueByMethod = await prisma.payment.groupBy({
        by: ['payment_method'],
        _sum: {
          amount: true
        },
        where: {
          status: 'paid',
          payment_date: Object.keys(dateFilter).length > 0 ? dateFilter : undefined
        },
        orderBy: {
          _sum: {
            amount: 'desc'
          }
        }
      });

      // Get monthly revenue trend (last 12 months)
      const monthlyRevenue = await prisma.payment.findMany({
        select: {
          amount: true,
          payment_date: true
        },
        where: {
          status: 'paid',
          payment_date: {
            gte: new Date(new Date().setMonth(new Date().getMonth() - 12))
          }
        }
      });

      // Group by month
      const monthlyRevenueMap = new Map<string, number>();
      monthlyRevenue.forEach(payment => {
        if (payment.payment_date) {
          const monthKey = payment.payment_date.toISOString().slice(0, 7); // YYYY-MM
          const current = monthlyRevenueMap.get(monthKey) || 0;
          monthlyRevenueMap.set(monthKey, current + Number(payment.amount));
        }
      });

      const monthlyRevenueTrend = Array.from(monthlyRevenueMap.entries())
        .map(([month, revenue]) => ({ month, revenue }))
        .sort((a, b) => a.month.localeCompare(b.month));

      return new Response(
        JSON.stringify({
          success: true,
          data: {
            summary: {
              total_payments: totalPayments,
              paid_payments: paidPayments,
              pending_payments: pendingPayments,
              overdue_payments: overduePayments,
              cancelled_payments: cancelledPayments,
              total_revenue: Number(totalRevenue._sum.amount || 0),
              total_discounts: Number(totalDiscounts._sum.discount || 0),
              total_late_fees: Number(totalLateFees._sum.late_fee || 0)
            },
            revenue_by_method: revenueByMethod.map(item => ({
              payment_method: item.payment_method || 'Não informado',
              revenue: Number(item._sum.amount || 0)
            })),
            monthly_revenue_trend: monthlyRevenueTrend
          }
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json" }
        }
      );

    } catch (error) {
      console.error("Get financial report error:", error);
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

  async getClassReport(request: Request): Promise<Response> {
    try {
      const url = new URL(request.url);
      const queryParams = Object.fromEntries(url.searchParams);
      
      const dateRange = dateRangeSchema.parse(queryParams);

      // Build date filter for checkins
      const checkinDateFilter: Prisma.DateTimeFilter = {};
      if (dateRange.start_date) checkinDateFilter.gte = new Date(dateRange.start_date);
      if (dateRange.end_date) checkinDateFilter.lte = new Date(dateRange.end_date);

      // Get class statistics
      const [
        totalClasses,
        activeClasses,
        inactiveClasses,
        classesWithStudents,
        totalEnrollments
      ] = await Promise.all([
        prisma.class.count(),
        prisma.class.count({ where: { status: 'active' } }),
        prisma.class.count({ where: { status: 'inactive' } }),
        prisma.class.count({
          where: {
            student_classes: {
              some: {
                status: 'active'
              }
            }
          }
        }),
        prisma.studentClass.count({ where: { status: 'active' } })
      ]);

      // Get classes with enrollment counts
      const classesWithEnrollments = await prisma.class.findMany({
        select: {
          id: true,
          name: true,
          max_students: true,
          day_of_week: true,
          start_time: true,
          end_time: true,
          teacher: {
            select: {
              full_name: true
            }
          },
          _count: {
            select: {
              student_classes: {
                where: { status: 'active' }
              }
            }
          }
        },
        where: {
          status: 'active'
        },
        orderBy: {
          name: 'asc'
        }
      });

      // Get checkin statistics by class
      const checkinsByClass = await prisma.checkin.groupBy({
        by: ['class_id'],
        _count: {
          id: true
        },
        where: {
          checkin_date: Object.keys(checkinDateFilter).length > 0 ? checkinDateFilter : undefined
        },
        orderBy: {
          _count: {
            id: 'desc'
          }
        }
      });

      // Get class details for checkin stats
      const classIds = checkinsByClass
        .filter(item => item.class_id)
        .map(item => item.class_id!);

      const classDetails = await prisma.class.findMany({
        where: {
          id: { in: classIds }
        },
        select: {
          id: true,
          name: true,
          teacher: {
            select: {
              full_name: true
            }
          }
        }
      });

      const checkinStatsWithDetails = checkinsByClass.map(item => ({
        class_id: item.class_id,
        class_name: item.class_id 
          ? classDetails.find(c => c.id === item.class_id)?.name || 'Turma não encontrada'
          : 'Check-in livre',
        teacher_name: item.class_id 
          ? classDetails.find(c => c.id === item.class_id)?.teacher?.full_name || null
          : null,
        checkin_count: item._count.id
      }));

      // Calculate occupancy rates
      const occupancyRates = classesWithEnrollments.map(cls => ({
        class_id: cls.id,
        class_name: cls.name,
        teacher_name: cls.teacher?.full_name || 'Sem professor',
        day_of_week: cls.day_of_week,
        start_time: cls.start_time,
        end_time: cls.end_time,
        enrolled_students: cls._count.student_classes,
        max_students: cls.max_students || 0,
        occupancy_rate: cls.max_students ? (cls._count.student_classes / cls.max_students) * 100 : 0
      }));

      return new Response(
        JSON.stringify({
          success: true,
          data: {
            summary: {
              total_classes: totalClasses,
              active_classes: activeClasses,
              inactive_classes: inactiveClasses,
              classes_with_students: classesWithStudents,
              total_enrollments: totalEnrollments
            },
            occupancy_rates: occupancyRates,
            checkin_stats: checkinStatsWithDetails
          }
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json" }
        }
      );

    } catch (error) {
      console.error("Get class report error:", error);
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

  async getAttendanceReport(request: Request): Promise<Response> {
    try {
      const url = new URL(request.url);
      const queryParams = Object.fromEntries(url.searchParams);
      
      const dateRange = dateRangeSchema.parse(queryParams);

      // Build date filter
      const dateFilter: Prisma.DateTimeFilter = {};
      if (dateRange.start_date) dateFilter.gte = new Date(dateRange.start_date);
      if (dateRange.end_date) dateFilter.lte = new Date(dateRange.end_date);

      // Get attendance statistics
      const [
        totalCheckins,
        uniqueStudentsCheckedIn,
        checkinsByMethod,
        dailyCheckins
      ] = await Promise.all([
        prisma.checkin.count({
          where: {
            checkin_date: Object.keys(dateFilter).length > 0 ? dateFilter : undefined
          }
        }),
        prisma.checkin.findMany({
          select: { student_id: true },
          where: {
            checkin_date: Object.keys(dateFilter).length > 0 ? dateFilter : undefined
          },
          distinct: ['student_id']
        }).then(result => result.length),
        prisma.checkin.groupBy({
          by: ['method'],
          _count: {
            id: true
          },
          where: {
            checkin_date: Object.keys(dateFilter).length > 0 ? dateFilter : undefined
          },
          orderBy: {
            _count: {
              id: 'desc'
            }
          }
        }),
        prisma.checkin.groupBy({
          by: ['checkin_date'],
          _count: {
            id: true
          },
          where: {
            checkin_date: Object.keys(dateFilter).length > 0 ? dateFilter : undefined
          },
          orderBy: {
            checkin_date: 'asc'
          }
        })
      ]);

      // Get top students by attendance
      const topStudentsByAttendance = await prisma.checkin.groupBy({
        by: ['student_id'],
        _count: {
          id: true
        },
        where: {
          checkin_date: Object.keys(dateFilter).length > 0 ? dateFilter : undefined
        },
        orderBy: {
          _count: {
            id: 'desc'
          }
        },
        take: 10
      });

      // Get student details for top attendance
      const studentIds = topStudentsByAttendance.map(item => item.student_id);
      const studentDetails = await prisma.student.findMany({
        where: {
          id: { in: studentIds }
        },
        select: {
          id: true,
          full_name: true,
          belt: true,
          belt_degree: true
        }
      });

      const topStudentsWithDetails = topStudentsByAttendance.map(item => ({
        student_id: item.student_id,
        student_name: studentDetails.find(s => s.id === item.student_id)?.full_name || 'Nome não encontrado',
        belt: studentDetails.find(s => s.id === item.student_id)?.belt || null,
        belt_degree: studentDetails.find(s => s.id === item.student_id)?.belt_degree || null,
        checkin_count: item._count.id
      }));

      // Calculate average daily attendance
      const averageDailyAttendance = dailyCheckins.length > 0 
        ? totalCheckins / dailyCheckins.length 
        : 0;

      return new Response(
        JSON.stringify({
          success: true,
          data: {
            summary: {
              total_checkins: totalCheckins,
              unique_students: uniqueStudentsCheckedIn,
              average_daily_attendance: Math.round(averageDailyAttendance * 100) / 100,
              days_with_activity: dailyCheckins.length
            },
            by_method: checkinsByMethod.map(item => ({
              method: item.method,
              count: item._count.id
            })),
            daily_trend: dailyCheckins.map(item => ({
              date: item.checkin_date?.toISOString().split('T')[0],
              checkins: item._count.id
            })),
            top_students: topStudentsWithDetails
          }
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json" }
        }
      );

    } catch (error) {
      console.error("Get attendance report error:", error);
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

  async getDashboardStats(request: Request): Promise<Response> {
    try {
      const today = new Date();
      const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
      const startOfLastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);
      const endOfLastMonth = new Date(today.getFullYear(), today.getMonth(), 0);

      // Get current month stats
      const [
        totalStudents,
        activeStudents,
        totalClasses,
        activeClasses,
        todayCheckins,
        monthlyRevenue,
        lastMonthRevenue,
        pendingPayments,
        overduePayments
      ] = await Promise.all([
        prisma.student.count(),
        prisma.student.count({ where: { status: 'active' } }),
        prisma.class.count(),
        prisma.class.count({ where: { status: 'active' } }),
        prisma.checkin.count({
          where: {
            checkin_date: {
              gte: new Date(today.getFullYear(), today.getMonth(), today.getDate()),
              lt: new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1)
            }
          }
        }),
        prisma.payment.aggregate({
          _sum: { amount: true },
          where: {
            status: 'paid',
            payment_date: { gte: startOfMonth }
          }
        }),
        prisma.payment.aggregate({
          _sum: { amount: true },
          where: {
            status: 'paid',
            payment_date: { gte: startOfLastMonth, lte: endOfLastMonth }
          }
        }),
        prisma.payment.count({
          where: { status: 'pending' }
        }),
        prisma.payment.count({
          where: { status: 'overdue' }
        })
      ]);

      // Calculate revenue growth
      const currentRevenue = Number(monthlyRevenue._sum.amount || 0);
      const previousRevenue = Number(lastMonthRevenue._sum.amount || 0);
      const revenueGrowth = previousRevenue > 0 
        ? ((currentRevenue - previousRevenue) / previousRevenue) * 100 
        : 0;

      // Get recent activities (last 5 checkins)
      const recentCheckins = await prisma.checkin.findMany({
        take: 5,
        orderBy: { checkin_time: 'desc' },
        include: {
          student: {
            select: {
              full_name: true,
              belt: true
            }
          },
          class: {
            select: {
              name: true
            }
          }
        }
      });

      return new Response(
        JSON.stringify({
          success: true,
          data: {
            overview: {
              total_students: totalStudents,
              active_students: activeStudents,
              total_classes: totalClasses,
              active_classes: activeClasses,
              today_checkins: todayCheckins,
              monthly_revenue: currentRevenue,
              revenue_growth: Math.round(revenueGrowth * 100) / 100,
              pending_payments: pendingPayments,
              overdue_payments: overduePayments
            },
            recent_activities: recentCheckins.map(checkin => ({
              id: checkin.id,
              student_name: checkin.student.full_name,
              student_belt: checkin.student.belt,
              class_name: checkin.class?.name || 'Check-in livre',
              checkin_time: checkin.checkin_time,
              method: checkin.method
            }))
          }
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json" }
        }
      );

    } catch (error) {
      console.error("Get dashboard stats error:", error);
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
}