-- Create extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create ENUM types
CREATE TYPE student_status AS ENUM ('active', 'inactive', 'suspended');
CREATE TYPE teacher_status AS ENUM ('active', 'inactive');
CREATE TYPE class_status AS ENUM ('active', 'inactive');
CREATE TYPE student_class_status AS ENUM ('active', 'inactive');
CREATE TYPE checkin_method AS ENUM ('manual', 'qr_code', 'app');
CREATE TYPE payment_method AS ENUM ('cash', 'card', 'pix', 'bank_transfer');
CREATE TYPE payment_status AS ENUM ('pending', 'paid', 'overdue', 'cancelled');
CREATE TYPE user_role AS ENUM ('admin', 'teacher', 'receptionist');
CREATE TYPE user_status AS ENUM ('active', 'inactive');

-- Students table
CREATE TABLE students (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    full_name VARCHAR(255) NOT NULL,
    birth_date DATE NOT NULL,
    cpf VARCHAR(14) UNIQUE,
    rg VARCHAR(20),
    belt VARCHAR(50),
    belt_degree INTEGER DEFAULT 1,
    address TEXT,
    phone VARCHAR(20),
    email VARCHAR(255),
    emergency_contact_name VARCHAR(255),
    emergency_contact_phone VARCHAR(20),
    emergency_contact_relationship VARCHAR(100),
    medical_observations TEXT,
    photo_url VARCHAR(500),
    enrollment_date DATE DEFAULT CURRENT_DATE,
    monthly_fee DECIMAL(10,2),
    status student_status DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Teachers table
CREATE TABLE teachers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    full_name VARCHAR(255) NOT NULL,
    birth_date DATE,
    cpf VARCHAR(14) UNIQUE,
    phone VARCHAR(20),
    email VARCHAR(255),
    belt VARCHAR(50),
    belt_degree INTEGER,
    specialties JSONB, -- JSON array of specialties
    hourly_rate DECIMAL(10,2),
    status teacher_status DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Classes table
CREATE TABLE classes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    teacher_id UUID REFERENCES teachers(id) ON DELETE SET NULL,
    day_of_week INTEGER CHECK (day_of_week >= 0 AND day_of_week <= 6),
    start_time TIME,
    end_time TIME,
    max_students INTEGER DEFAULT 30,
    belt_requirement VARCHAR(50),
    age_group VARCHAR(50),
    status class_status DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Student-Class relationship table
CREATE TABLE student_classes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    class_id UUID NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
    enrollment_date DATE DEFAULT CURRENT_DATE,
    status student_class_status DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(student_id, class_id)
);

-- Checkins table
CREATE TABLE checkins (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    class_id UUID REFERENCES classes(id) ON DELETE SET NULL,
    checkin_date DATE DEFAULT CURRENT_DATE,
    checkin_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    method checkin_method DEFAULT 'manual',
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Payments table
CREATE TABLE payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    amount DECIMAL(10,2) NOT NULL,
    due_date DATE NOT NULL,
    payment_date DATE,
    payment_method payment_method,
    status payment_status DEFAULT 'pending',
    reference_month DATE,
    discount DECIMAL(10,2) DEFAULT 0,
    late_fee DECIMAL(10,2) DEFAULT 0,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Users table
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    username VARCHAR(100) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    role user_role DEFAULT 'receptionist',
    teacher_id UUID REFERENCES teachers(id) ON DELETE SET NULL,
    status user_status DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better performance
CREATE INDEX idx_students_status ON students(status);
CREATE INDEX idx_students_cpf ON students(cpf);
CREATE INDEX idx_students_enrollment_date ON students(enrollment_date);

CREATE INDEX idx_teachers_status ON teachers(status);
CREATE INDEX idx_teachers_cpf ON teachers(cpf);

CREATE INDEX idx_classes_teacher_id ON classes(teacher_id);
CREATE INDEX idx_classes_day_of_week ON classes(day_of_week);
CREATE INDEX idx_classes_status ON classes(status);

CREATE INDEX idx_student_classes_student_id ON student_classes(student_id);
CREATE INDEX idx_student_classes_class_id ON student_classes(class_id);
CREATE INDEX idx_student_classes_status ON student_classes(status);

CREATE INDEX idx_checkins_student_id ON checkins(student_id);
CREATE INDEX idx_checkins_class_id ON checkins(class_id);
CREATE INDEX idx_checkins_date ON checkins(checkin_date);

CREATE INDEX idx_payments_student_id ON payments(student_id);
CREATE INDEX idx_payments_status ON payments(status);
CREATE INDEX idx_payments_due_date ON payments(due_date);
CREATE INDEX idx_payments_reference_month ON payments(reference_month);

CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_status ON users(status);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_students_updated_at BEFORE UPDATE ON students
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_teachers_updated_at BEFORE UPDATE ON teachers
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_classes_updated_at BEFORE UPDATE ON classes
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_payments_updated_at BEFORE UPDATE ON payments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert default admin user
-- Password: admin123 (hashed with bcrypt, salt rounds: 12)
INSERT INTO users (username, email, password_hash, role, status) 
VALUES (
    'admin', 
    'admin@okami.gym', 
    '$2b$12$hOCzXM.rC04V8AM84vNGleyoI0ERcpjeNILFamttAmbLTF2yA1yxW', 
    'admin', 
    'active'
) ON CONFLICT (username) DO NOTHING;

-- Insert default receptionist user  
-- Password: recep123 (hashed with bcrypt, salt rounds: 12)
INSERT INTO users (username, email, password_hash, role, status)
VALUES (
    'receptionist',
    'receptionist@okami.gym',
    '$2b$12$3z0YiHOdj/OX9GHmCcqfC.3A3amThGB1SlRQngKnHoJjtYQmcab/y',
    'receptionist',
    'active'
) ON CONFLICT (username) DO NOTHING; 