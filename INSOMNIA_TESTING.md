# Okami Gym API - Insomnia Testing Guide

This guide explains how to use the provided Insomnia collections to test the Okami Gym Management API.

## Available Collections

1. **`insomnia-collection.json`** - Basic collection with authentication and students endpoints
2. **`okami-insomnia-collection.json`** - Complete collection with all endpoints organized by sections

## How to Import the Collection

1. Open Insomnia
2. Click on "Create" → "Import From" → "File"
3. Select the `okami-insomnia-collection.json` file
4. The collection will be imported with all endpoints organized in folders

## Collection Structure

### 🏥 Health Check
- **Health Check** - Check API and database status

### 🔐 Authentication
- **Login** - Authenticate and get access token
- **Get Profile** - Get current user information
- **Refresh Token** - Refresh expired access token
- **Logout** - Invalidate current token

### 👥 Students
- **List Students** - Get all students
- **Create Student** - Add new student (admin/receptionist only)
- **Get Student by ID** - Get specific student details
- **Update Student** - Modify student information (admin/receptionist only)
- **Delete Student** - Remove student (admin only)
- **Get Student Classes** - List classes student is enrolled in
- **Enroll in Class** - Enroll student in a class (admin/receptionist only)
- **Unenroll from Class** - Remove student from class (admin/receptionist only)

### 👨‍🏫 Teachers
- **List Teachers** - Get all teachers
- **Create Teacher** - Add new teacher (admin only)
- **Get Teacher by ID** - Get specific teacher details
- **Update Teacher** - Modify teacher information (admin only)
- **Delete Teacher** - Remove teacher (admin only)
- **Get Teacher Classes** - List classes taught by teacher

### 🏃‍♂️ Classes
- **List Classes** - Get all classes
- **Create Class** - Add new class (admin/teacher only)
- **Get Class by ID** - Get specific class details
- **Update Class** - Modify class information (admin/teacher only)
- **Delete Class** - Remove class (admin only)
- **Get Schedule** - Get class schedule
- **Get Class Students** - List students enrolled in class

### ✅ Check-ins
- **List Check-ins** - Get all check-ins
- **Create Check-in** - Record new check-in
- **Today's Check-ins** - Get today's check-ins
- **Check-ins by Student** - Get check-ins for specific student
- **Check-ins by Class** - Get check-ins for specific class
- **Delete Check-in** - Remove check-in record (admin/receptionist only)

### 💰 Payments
- **List Payments** - Get all payments
- **Create Payment** - Add new payment record (admin/receptionist only)
- **Get Payment by ID** - Get specific payment details
- **Update Payment** - Modify payment information (admin/receptionist only)
- **Delete Payment** - Remove payment record (admin only)
- **Mark as Paid** - Mark payment as completed (admin/receptionist only)
- **Overdue Payments** - Get overdue payments
- **Generate Monthly** - Generate monthly payments (admin only)
- **Payments by Student** - Get payments for specific student

### 📊 Reports
- **Dashboard** - Get dashboard statistics (admin only)
- **Attendance Report** - Get attendance statistics (admin only)
- **Financial Report** - Get financial statistics (admin only)
- **Students Report** - Get student statistics (admin only)
- **Classes Report** - Get class statistics (admin only)

## Environment Variables

The collection uses environment variables for flexibility:

- `base_url` - API base URL (default: http://localhost:3000)
- `token` - JWT access token (set after login)
- `student_id` - Student ID for testing student-specific endpoints
- `teacher_id` - Teacher ID for testing teacher-specific endpoints
- `class_id` - Class ID for testing class-specific endpoints
- `payment_id` - Payment ID for testing payment-specific endpoints
- `checkin_id` - Check-in ID for testing check-in-specific endpoints

## Testing Workflow

### 1. Start the API Server
```bash
# Make sure Docker is running
docker-compose up -d

# Or start manually
bun run dev
```

### 2. Test Health Check
Run the "Health Check" request to ensure the API is running and database is connected.

### 3. Authenticate
1. Run the "Login" request with default credentials:
   ```json
   {
     "username": "admin",
     "password": "admin123"
   }
   ```
2. Copy the `access_token` from the response
3. Set it in the environment variable `token`

### 4. Test CRUD Operations

#### Create Resources
1. **Create Student** - Creates a new student and returns the ID
2. **Create Teacher** - Creates a new teacher and returns the ID
3. **Create Class** - Creates a new class (needs teacher_id)

#### Update Environment Variables
After creating resources, update the environment variables with the returned IDs:
- Set `student_id` with the created student ID
- Set `teacher_id` with the created teacher ID
- Set `class_id` with the created class ID

#### Test Other Operations
1. **Enroll Student in Class** - Enroll the student in the created class
2. **Create Check-in** - Record a check-in for the student
3. **Create Payment** - Add a payment for the student
4. **Test Reports** - Run various reports

## Permission Levels

The API has three permission levels:

- **Admin** - Full access to all endpoints
- **Receptionist** - Can manage students, classes, check-ins, and payments
- **Teacher** - Can manage classes and view student information

## Sample Data

### Student Creation
```json
{
  "name": "João Silva",
  "email": "joao@email.com",
  "phone": "11999999999",
  "cpf": "12345678901",
  "birth_date": "1990-01-15",
  "address": "Rua das Flores, 123",
  "emergency_contact": "Maria Silva - 11888888888",
  "medical_conditions": "Nenhuma"
}
```

### Teacher Creation
```json
{
  "name": "Carlos Instrutor",
  "email": "carlos@email.com",
  "phone": "11888888888",
  "specialization": "Musculação",
  "hire_date": "2024-01-01",
  "salary": 3000.00
}
```

### Class Creation
```json
{
  "name": "Musculação Manhã",
  "description": "Treino de musculação para iniciantes",
  "teacher_id": "{{ _.teacher_id }}",
  "schedule": "Segunda a Sexta - 08:00",
  "duration": 60,
  "capacity": 15,
  "price": 150.00
}
```

### Check-in Creation
```json
{
  "student_id": "{{ _.student_id }}",
  "class_id": "{{ _.class_id }}",
  "type": "manual"
}
```

### Payment Creation
```json
{
  "student_id": "{{ _.student_id }}",
  "amount": 150.00,
  "due_date": "2024-02-15",
  "description": "Mensalidade Janeiro 2024",
  "type": "monthly"
}
```

## Error Handling

The API returns consistent error responses:

```json
{
  "success": false,
  "error": "Error message description"
}
```

Common HTTP status codes:
- `200` - Success
- `201` - Created
- `400` - Bad Request (validation error)
- `401` - Unauthorized (missing or invalid token)
- `403` - Forbidden (insufficient permissions)
- `404` - Not Found
- `500` - Internal Server Error

## Tips for Testing

1. **Always authenticate first** - Most endpoints require authentication
2. **Use environment variables** - They make testing easier and more flexible
3. **Test permissions** - Try accessing admin-only endpoints with different user roles
4. **Check response formats** - Verify that responses match expected schemas
5. **Test error scenarios** - Try invalid data to test validation
6. **Use the reports** - They provide good overview of the system state

## Troubleshooting

### Common Issues

1. **"Token de acesso requerido"**
   - Make sure you're logged in and the token is set in environment variables

2. **"Acesso negado: permissões insuficientes"**
   - Check if your user role has permission for the endpoint

3. **Connection refused**
   - Ensure the API server is running on the correct port

4. **Database connection errors**
   - Make sure PostgreSQL is running via Docker Compose

### Default Credentials

- **Username:** `admin`
- **Password:** `admin123`
- **Role:** `admin` (full access)

## Support

If you encounter issues with the API or collection:

1. Check the server logs for detailed error messages
2. Verify that all required services are running
3. Ensure you're using the correct API endpoints and methods
4. Check that request bodies match the expected schemas 