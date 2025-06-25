# Database Seeding Guide

This guide explains how to manage database seeding and user creation in the Okami Gym API.

## 🌱 Automatic Seeding

The system automatically creates default users when you start the application:

### Default Users Created
- **Admin User**
  - Username: `admin`
  - Password: `admin123`
  - Email: `admin@okami.gym`
  - Role: `admin` (full access)

- **Receptionist User**
  - Username: `receptionist`
  - Password: `recep123`
  - Email: `receptionist@okami.gym`
  - Role: `receptionist` (limited access)

## 🚀 Quick Start

### 1. Start with Docker (Recommended)
```bash
# Start the entire system (includes database initialization)
docker-compose up -d

# The admin user is automatically created during database initialization
```

### 2. Manual Database Setup
```bash
# Start only PostgreSQL
bun run db:setup

# Seed users manually
bun run db:seed:users

# Or seed everything (users + sample data)
bun run db:seed
```

## 📋 Available Scripts

### User Management
```bash
# Create default admin and receptionist users
bun run db:seed:users

# Create a custom admin user
bun run db:seed:admin myusername admin@example.com mypassword

# Create default admin with default credentials
bun run db:seed:admin
```

### Sample Data
```bash
# Create sample data for development/testing
bun run db:seed:sample

# Create users + sample data
bun run db:seed

# Reset database and re-seed (development only)
bun run db:reset
```

## 🔧 Manual Seeding Commands

You can also run the seeder directly:

```bash
# Show help
bun run src/config/seed.ts

# Create users only
bun run src/config/seed.ts users

# Create sample data
bun run src/config/seed.ts sample

# Create everything
bun run src/config/seed.ts all

# Create custom admin
bun run src/config/seed.ts admin myuser admin@gym.com mypass

# Reset database (DANGER - deletes all data!)
bun run src/config/seed.ts reset
```

## 📊 Sample Data Included

When you run sample data seeding, it creates:

### Sample Teacher
- **Name:** Carlos Silva
- **Email:** carlos@okami.gym
- **Phone:** 11999999999
- **Specialties:** Jiu-Jitsu, Muay Thai
- **Hourly Rate:** R$ 50.00

### Sample Students
- **João Santos**
  - Email: joao@email.com
  - Phone: 11888888888
  - CPF: 12345678901
  - Monthly Fee: R$ 150.00

- **Maria Oliveira**
  - Email: maria@email.com
  - Phone: 11777777777
  - CPF: 10987654321
  - Monthly Fee: R$ 150.00

### Sample Class
- **Name:** Jiu-Jitsu Iniciante
- **Description:** Aula de Jiu-Jitsu para iniciantes
- **Schedule:** Monday 19:00-20:30
- **Capacity:** 20 students
- **Teacher:** Carlos Silva

### Sample Data
- Students enrolled in the class
- Pending payments for next month
- All relationships properly established

## 🔐 Security Features

### Password Hashing
- Uses bcrypt with 12 salt rounds
- Passwords are never stored in plain text
- Secure random salt for each password

### User Validation
- Checks for existing users before creation
- Prevents duplicate usernames and emails
- Validates user roles and status

### Environment Awareness
- Sample data only created in development
- Production safety checks
- Database reset blocked in production

## 🛠️ Customization

### Creating Custom Users

You can modify the default users in `src/config/seed.ts`:

```typescript
private static readonly DEFAULT_USERS: SeedUser[] = [
  {
    username: "admin",
    email: "admin@okami.gym",
    password: "admin123",
    role: "admin"
  },
  // Add more users here
];
```

### Adding Sample Data

Extend the `seedSampleData()` method to include more sample records:

```typescript
// Add more teachers, students, classes, etc.
```

## 🔍 Troubleshooting

### Common Issues

1. **"User already exists"**
   - This is normal - the seeder skips existing users
   - Users are identified by username or email

2. **"Database connection failed"**
   - Ensure PostgreSQL is running
   - Check connection string in environment variables
   - Verify database credentials

3. **"Permission denied"**
   - Check database user permissions
   - Ensure the database user can create tables and insert data

4. **"Seeding failed"**
   - Check database logs for detailed errors
   - Verify all required tables exist
   - Ensure foreign key constraints are satisfied

### Checking Seeded Data

```bash
# Connect to database
docker exec -it okami-api-postgres-1 psql -U okami_user -d okami_gym

# Check users
SELECT username, email, role, status FROM users;

# Check sample data
SELECT COUNT(*) FROM students;
SELECT COUNT(*) FROM teachers;
SELECT COUNT(*) FROM classes;
```

## 🔄 Database Reset

**⚠️ WARNING: This will delete ALL data!**

```bash
# Reset database (development only)
bun run db:reset
```

This command:
1. Deletes all data in correct order (respecting foreign keys)
2. Re-runs all seeding operations
3. Creates fresh default users and sample data

## 🏗️ Integration with Application

### Automatic Seeding on Startup

The application automatically runs user seeding when it starts:

```typescript
// In src/index.ts
async function initialize() {
  await dbManager.seedDefaultUser(); // Calls DatabaseSeeder.seedUsers()
}
```

### Database Health Checks

The seeder includes health checks to ensure database connectivity before seeding.

### Error Handling

- Graceful error handling with detailed logging
- Fallback mechanisms for critical operations
- Safe failure modes that don't crash the application

## 📝 Best Practices

1. **Always backup production data** before any seeding operations
2. **Test seeding scripts** in development first
3. **Use environment variables** for sensitive configuration
4. **Monitor logs** during seeding operations
5. **Verify seeded data** after operations complete

## 🔗 Related Files

- `src/config/seed.ts` - Main seeding logic
- `src/config/database.ts` - Database connection and basic seeding
- `docker/init.sql` - Database schema and initial data
- `package.json` - Seeding scripts
- `INSOMNIA_TESTING.md` - API testing with seeded data

## 📞 Support

If you encounter issues with seeding:

1. Check the console output for detailed error messages
2. Verify database connectivity and permissions
3. Ensure all dependencies are installed
4. Review the seeding logs for specific failures
5. Try running individual seeding commands to isolate issues 