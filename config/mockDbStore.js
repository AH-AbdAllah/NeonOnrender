// In-memory MySQL database simulator for TaskFlow
// Allows running E2E tests and running the API immediately without database dependencies

const users = [
  { id: 1, name: 'Admin User', email: 'admin@taskflow.com', password_hash: '$2b$10$HPRyPpKeAyxz9Y18AHrNWOAvxtUZAU.Dx6jOspF9qxDe38pQUoLoG', role: 'Admin', created_at: new Date() },
  { id: 2, name: 'John Doe', email: 'john@taskflow.com', password_hash: '$2b$10$HPRyPpKeAyxz9Y18AHrNWOAvxtUZAU.Dx6jOspF9qxDe38pQUoLoG', role: 'User', created_at: new Date() }
];

const projects = [];
const tasks = [];

let userAutoIncrement = 3;
let projectAutoIncrement = 1;
let taskAutoIncrement = 1;

class MockDbStore {
  static async execute(sql, params = []) {
    const cleanSql = sql.replace(/\s+/g, ' ').trim();

    // 1. INSERT INTO users
    if (cleanSql.startsWith('INSERT INTO users')) {
      const [name, email, passwordHash, role] = params;
      // Check unique constraint
      if (users.some(u => u.email === email)) {
        const err = new Error(`Duplicate entry '${email}' for key 'users.email'`);
        err.code = 'ER_DUP_ENTRY';
        throw err;
      }
      const newUser = {
        id: userAutoIncrement++,
        name,
        email,
        password_hash: passwordHash,
        role: role || 'User',
        created_at: new Date()
      };
      users.push(newUser);
      return [{ insertId: newUser.id }];
    }

    // 2. SELECT * FROM users WHERE email = ?
    if (cleanSql.startsWith('SELECT * FROM users WHERE email = ?')) {
      const [email] = params;
      const match = users.find(u => u.email === email);
      return [match ? [match] : []];
    }

    // 3. SELECT id, name, email, role, created_at FROM users WHERE id = ?
    if (cleanSql.startsWith('SELECT id, name, email, role, created_at FROM users WHERE id = ?')) {
      const [id] = params;
      const match = users.find(u => u.id === parseInt(id, 10));
      return [match ? [match] : []];
    }

    // 4. SELECT id, name, email, role, created_at FROM users
    if (cleanSql.startsWith('SELECT id, name, email, role, created_at FROM users')) {
      return [users.map(u => ({ id: u.id, name: u.name, email: u.email, role: u.role, created_at: u.created_at }))];
    }

    // 5. INSERT INTO projects
    if (cleanSql.startsWith('INSERT INTO projects')) {
      const [name, description, ownerId] = params;
      const newProject = {
        id: projectAutoIncrement++,
        name,
        description,
        owner_id: parseInt(ownerId, 10),
        created_at: new Date()
      };
      projects.push(newProject);
      return [{ insertId: newProject.id }];
    }

    // 6. SELECT p.id, p.name, p.description, p.owner_id, u.name as owner_name FROM projects p JOIN users u ON p.owner_id = u.id ORDER BY p.created_at DESC
    // OR SELECT p.id, p.name, p.description, p.owner_id, u.name as owner_name FROM projects p JOIN users u ON p.owner_id = u.id WHERE p.owner_id = ? ORDER BY p.created_at DESC
    if (cleanSql.includes('FROM projects p JOIN users u ON p.owner_id = u.id')) {
      let resultList = projects.map(p => {
        const owner = users.find(u => u.id === p.owner_id) || { name: 'Unknown' };
        return {
          id: p.id,
          name: p.name,
          description: p.description,
          owner_id: p.owner_id,
          owner_name: owner.name,
          created_at: p.created_at
        };
      });

      if (cleanSql.includes('p.owner_id = ? OR t.assigned_to = ?')) {
        const [ownerId, assignedToId] = params;
        const uid = parseInt(ownerId || assignedToId, 10);
        const assignedProjectIds = tasks.filter(t => t.assigned_to === uid).map(t => t.project_id);
        resultList = resultList.filter(p => p.owner_id === uid || assignedProjectIds.includes(p.id));
      } else if (cleanSql.includes('WHERE p.owner_id = ?')) {
        const [ownerId] = params;
        resultList = resultList.filter(p => p.owner_id === parseInt(ownerId, 10));
      }
      
      if (cleanSql.includes('WHERE p.id = ?')) {
        const [id] = params;
        const match = resultList.find(p => p.id === parseInt(id, 10));
        return [match ? [match] : []];
      }

      // Sort DESC by created_at (which matches index order in mock)
      resultList.sort((a, b) => b.created_at - a.created_at);
      return [resultList];
    }

    // 7. INSERT INTO tasks (title, description, status, project_id, assigned_to) VALUES (?, ?, 'Pending', ?, ?)
    if (cleanSql.startsWith('INSERT INTO tasks')) {
      const [title, description, projectId, assignedTo] = params;
      const newTask = {
        id: taskAutoIncrement++,
        title,
        description,
        status: 'Pending',
        project_id: parseInt(projectId, 10),
        assigned_to: assignedTo ? parseInt(assignedTo, 10) : null,
        created_at: new Date()
      };
      tasks.push(newTask);
      return [{ insertId: newTask.id }];
    }

    // 8. SELECT t.id ... FROM tasks t JOIN projects p ON t.project_id = p.id LEFT JOIN users u ON t.assigned_to = u.id WHERE t.id = ?
    if (cleanSql.includes('FROM tasks t JOIN projects p ON t.project_id = p.id')) {
      const [id] = params;
      const t = tasks.find(item => item.id === parseInt(id, 10));
      if (!t) return [[]];
      
      const p = projects.find(item => item.id === t.project_id) || {};
      const u = users.find(item => item.id === t.assigned_to) || {};

      return [[{
        id: t.id,
        title: t.title,
        description: t.description,
        status: t.status,
        project_id: t.project_id,
        assigned_to: t.assigned_to,
        assignee_name: u.name || null,
        assignee_email: u.email || null,
        project_name: p.name || null,
        project_owner_id: p.owner_id || null,
        created_at: t.created_at
      }]];
    }

    // 9. SELECT t.id ... FROM tasks t LEFT JOIN users u ON t.assigned_to = u.id WHERE t.project_id = ? ORDER BY t.created_at ASC
    if (cleanSql.includes('FROM tasks t LEFT JOIN users u ON t.assigned_to = u.id WHERE t.project_id = ?')) {
      const [projectId] = params;
      const list = tasks
        .filter(t => t.project_id === parseInt(projectId, 10))
        .map(t => {
          const u = users.find(item => item.id === t.assigned_to) || {};
          return {
            id: t.id,
            title: t.title,
            description: t.description,
            status: t.status,
            project_id: t.project_id,
            assigned_to: t.assigned_to,
            assignee_name: u.name || null,
            created_at: t.created_at
          };
        });
      list.sort((a, b) => a.created_at - b.created_at);
      return [list];
    }

    // 10. UPDATE tasks SET status = ? WHERE id = ?
    if (cleanSql.startsWith('UPDATE tasks SET status = ? WHERE id = ?')) {
      const [status, id] = params;
      const idx = tasks.findIndex(t => t.id === parseInt(id, 10));
      if (idx !== -1) {
        tasks[idx].status = status;
        return [{ affectedRows: 1 }];
      }
      return [{ affectedRows: 0 }];
    }

    // 11. UPDATE tasks SET assigned_to = ? WHERE id = ?
    if (cleanSql.startsWith('UPDATE tasks SET assigned_to = ? WHERE id = ?')) {
      const [assignedTo, id] = params;
      const idx = tasks.findIndex(t => t.id === parseInt(id, 10));
      if (idx !== -1) {
        tasks[idx].assigned_to = assignedTo;
        return [{ affectedRows: 1 }];
      }
      return [{ affectedRows: 0 }];
    }

    // 12. SELECT COUNT(*) as total_tasks, SUM(...) FROM tasks WHERE assigned_to = ?
    if (cleanSql.includes('SUM(CASE WHEN status = \'Pending\' THEN 1 ELSE 0 END)') && cleanSql.includes('WHERE assigned_to = ?')) {
      const [assignedTo] = params;
      const userTasks = tasks.filter(t => t.assigned_to === parseInt(assignedTo, 10));
      
      const total = userTasks.length;
      const pending = userTasks.filter(t => t.status === 'Pending').length;
      const inProgress = userTasks.filter(t => t.status === 'InProgress').length;
      const completed = userTasks.filter(t => t.status === 'Done').length;

      return [[{
        total_tasks: total,
        pending_tasks: pending,
        in_progress_tasks: inProgress,
        completed_tasks: completed
      }]];
    }

    // 13. SELECT u.id as user_id ... FROM users u LEFT JOIN tasks t ... GROUP BY u.id
    if (cleanSql.includes('FROM users u LEFT JOIN tasks t ON u.id = t.assigned_to GROUP BY u.id')) {
      const resultList = users.map(u => {
        const userTasks = tasks.filter(t => t.assigned_to === u.id);
        const total = userTasks.length;
        const pending = userTasks.filter(t => t.status === 'Pending').length;
        const inProgress = userTasks.filter(t => t.status === 'InProgress').length;
        const completed = userTasks.filter(t => t.status === 'Done').length;

        return {
          user_id: u.id,
          user_name: u.name,
          user_email: u.email,
          total_tasks: total,
          pending_tasks: pending,
          in_progress_tasks: inProgress,
          completed_tasks: completed
        };
      });
      return [resultList];
    }

    // 14. DELETE FROM tasks WHERE id = ?
    if (cleanSql.startsWith('DELETE FROM tasks WHERE id = ?') || cleanSql.startsWith('DELETE FROM tasks')) {
      // Allow both specific deletion and table truncation (used in cleanups)
      if (cleanSql.includes('WHERE id = ?')) {
        const [id] = params;
        const idx = tasks.findIndex(t => t.id === parseInt(id, 10));
        if (idx !== -1) {
          tasks.splice(idx, 1);
          return [{ affectedRows: 1 }];
        }
        return [{ affectedRows: 0 }];
      } else {
        tasks.length = 0;
        return [{ affectedRows: 1 }];
      }
    }

    throw new Error(`Mock SQL execution handler not implemented for: "${cleanSql}"`);
  }
}

module.exports = MockDbStore;
