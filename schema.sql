-- TaskFlow PostgreSQL Schema Design
-- Target Database: PostgreSQL (Neon Cloud or Local)

-- 1. Users Table
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(100) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  role VARCHAR(50) NOT NULL DEFAULT 'User' CHECK (role IN ('Admin', 'User')),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- 2. Projects Table
CREATE TABLE IF NOT EXISTS projects (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  owner_id INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_projects_owner ON projects(owner_id);

-- 3. Tasks Table
CREATE TABLE IF NOT EXISTS tasks (
  id SERIAL PRIMARY KEY,
  title VARCHAR(100) NOT NULL,
  description TEXT,
  status VARCHAR(50) NOT NULL DEFAULT 'Pending' CHECK (status IN ('Pending', 'InProgress', 'Done')),
  project_id INT NOT NULL,
  assigned_to INT DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
  FOREIGN KEY (assigned_to) REFERENCES users(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_tasks_project ON tasks(project_id);
CREATE INDEX IF NOT EXISTS idx_tasks_assigned ON tasks(assigned_to);

-- Seed Data (Default password is 'password123')
-- Hash: $2b$10$HPRyPpKeAyxz9Y18AHrNWOAvxtUZAU.Dx6jOspF9qxDe38pQUoLoG
INSERT INTO users (name, email, password_hash, role)
VALUES 
  ('Admin User', 'admin@taskflow.com', '$2b$10$HPRyPpKeAyxz9Y18AHrNWOAvxtUZAU.Dx6jOspF9qxDe38pQUoLoG', 'Admin'),
  ('John Doe', 'john@taskflow.com', '$2b$10$HPRyPpKeAyxz9Y18AHrNWOAvxtUZAU.Dx6jOspF9qxDe38pQUoLoG', 'User')
ON CONFLICT (email) DO NOTHING;
