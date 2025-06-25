# Okami API Testing Suite

This directory contains comprehensive tests for the Okami Gym Management API, including unit tests, integration tests, and end-to-end API tests.

## Test Structure

```
tests/
├── unit/           # Unit tests for individual functions and utilities
│   ├── auth.test.ts        # Authentication middleware tests
│   └── validation.test.ts  # Validation schema tests
├── integration/    # Integration tests for controllers and services
├── api/           # End-to-end API tests
│   ├── auth.test.ts        # Authentication endpoints
│   └── students.test.ts    # Student management endpoints
├── utils/         # Test utilities and helpers
│   └── test-helpers.ts     # Common test utilities
└── README.md      # This file
```

## Running Tests

### All Tests
```bash
bun test
```

### Specific Test Categories
```bash
# Unit tests only
bun run test:unit

# Integration tests only
bun run test:integration

# API tests only
bun run test:api

# Watch mode for development
bun run test:watch

# Coverage report
bun run test:coverage
```

### Running Specific Test Files
```bash
# Run auth tests
bun test tests/unit/auth.test.ts

# Run student API tests
bun test tests/api/students.test.ts
```

## Test Categories

### Unit Tests
- **Authentication Middleware**: Token generation, verification, user extraction
- **Validation Schemas**: Input validation, error handling, data transformation
- **Utility Functions**: CPF validation, phone formatting, UUID validation

### Integration Tests
- **Controller Logic**: Business logic validation with mocked dependencies
- **Database Operations**: CRUD operations with test database
- **Service Layer**: Complex business workflows

### API Tests
- **Authentication Endpoints**: Login, logout, profile, token refresh
- **Student Management**: CRUD operations, permissions, validation
- **Teacher Management**: CRUD operations, class assignments
- **Class Management**: Scheduling, enrollment, capacity limits
- **Check-in System**: Manual and automated check-ins
- **Payment System**: Payment creation, tracking, overdue handling
- **Reports**: Dashboard data, financial reports, attendance reports

## Test Environment

### Prerequisites
1. **PostgreSQL Database**: Running on localhost:5432
2. **Environment Variables**: Configured in `.env` file
3. **Server**: API server running on localhost:3000

### Database Setup
The tests use a separate test database or clean up data after each test suite to avoid conflicts with development data.

```bash
# Start database
bun run db:setup

# Seed test data
bun run db:seed
```

### Test Data
Tests use generated test data that doesn't conflict with real data:
- Unique emails with timestamps
- Random CPF numbers
- Test-specific usernames and IDs

## Test Utilities

### TestHelpers Class
Located in `tests/utils/test-helpers.ts`, provides:

#### Database Management
- `setupTestDatabase()`: Initialize test database
- `cleanupTestDatabase()`: Clean up test data

#### Authentication
- `getAdminToken()`: Generate admin JWT token
- `getTeacherToken()`: Generate teacher JWT token
- `getReceptionistToken()`: Generate receptionist JWT token

#### HTTP Requests
- `makeRequest()`: Make HTTP request to API
- `makeAuthenticatedRequest()`: Make authenticated request with token

#### Test Data Generation
- `generateStudentData()`: Create test student data
- `generateTeacherData()`: Create test teacher data
- `generateClassData()`: Create test class data
- `generatePaymentData()`: Create test payment data

## Writing New Tests

### Unit Test Example
```typescript
import { describe, it, expect } from "bun:test";
import { MyFunction } from "../../src/utils/my-function.js";

describe("Unit: MyFunction", () => {
  it("should handle valid input", () => {
    const result = MyFunction("valid input");
    expect(result).toBe("expected output");
  });

  it("should handle invalid input", () => {
    expect(() => MyFunction("invalid")).toThrow();
  });
});
```

### API Test Example
```typescript
import { describe, it, expect, beforeAll, afterAll } from "bun:test";
import { TestHelpers } from "../utils/test-helpers.js";

describe("API: MyEndpoint", () => {
  beforeAll(async () => {
    await TestHelpers.setupTestDatabase();
    await TestHelpers.waitForServer();
  });

  afterAll(async () => {
    await TestHelpers.cleanupTestDatabase();
  });

  it("should handle authenticated request", async () => {
    const response = await TestHelpers.makeAuthenticatedRequest("/api/my-endpoint");
    
    expect(response.status).toBe(200);
    const data = await response.json() as any;
    expect(data.success).toBe(true);
  });
});
```

## Test Coverage

The test suite aims for high coverage across:
- **Authentication & Authorization**: 100%
- **Input Validation**: 100%
- **API Endpoints**: 90%+
- **Business Logic**: 85%+
- **Error Handling**: 90%+

## Best Practices

### Test Organization
- Group related tests using `describe` blocks
- Use descriptive test names that explain the scenario
- Test both success and failure cases
- Test edge cases and boundary conditions

### Test Data
- Use generated test data to avoid conflicts
- Clean up test data after each test suite
- Don't rely on external data or services

### Assertions
- Use specific assertions (`toBe`, `toEqual`, `toContain`)
- Test response structure and data types
- Verify error messages and status codes

### Async Testing
- Always await async operations
- Use proper error handling in tests
- Test timeout scenarios where applicable

## Debugging Tests

### Common Issues
1. **Server not running**: Ensure API server is started
2. **Database connection**: Check PostgreSQL is running
3. **Environment variables**: Verify `.env` file is configured
4. **Port conflicts**: Ensure test ports are available

### Debug Mode
```bash
# Run tests with debug output
DEBUG=1 bun test

# Run specific test with logs
bun test tests/api/auth.test.ts --verbose
```

## Continuous Integration

Tests are designed to run in CI/CD environments:
- No external dependencies
- Configurable database connection
- Proper cleanup and teardown
- Deterministic test data

### CI Configuration Example
```yaml
test:
  script:
    - bun install
    - bun run db:setup
    - bun run test:coverage
  coverage: '/Coverage: \d+\.\d+%/'
``` 