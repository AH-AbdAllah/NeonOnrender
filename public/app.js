// TaskFlow Client Side Dashboard logic

const API_BASE = '/api';

// Core State Management
let token = localStorage.getItem('taskflow_token') || null;
let currentUser = null;
try {
  const storedUser = localStorage.getItem('taskflow_user');
  if (storedUser) currentUser = JSON.parse(storedUser);
} catch (e) {
  console.error('Error parsing stored user data:', e);
}

let projects = [];
let activeProjectId = null;
let usersList = []; // loaded dynamically for assignment selector

// DOM Elements
const authGateway = document.getElementById('auth-gateway');
const dashboardLayout = document.getElementById('dashboard-layout');

// Auth Form elements
const loginForm = document.getElementById('login-form');
const registerForm = document.getElementById('register-form');
const loginEmailInput = document.getElementById('login-email');
const loginPasswordInput = document.getElementById('login-password');
const regNameInput = document.getElementById('reg-name');
const regEmailInput = document.getElementById('reg-email');
const regPasswordInput = document.getElementById('reg-password');
const regRoleSelect = document.getElementById('reg-role');

// Toggles
const goToRegisterBtn = document.getElementById('go-to-register');
const goToLoginBtn = document.getElementById('go-to-login');
const logoutBtn = document.getElementById('btn-logout');

// Dashboard UI components
const userFullnameSpan = document.getElementById('user-fullname');
const userRoleBadge = document.getElementById('user-role-badge');
const userAvatar = document.getElementById('user-avatar');
const projectsListUl = document.getElementById('projects-list-ul');
const activeProjectName = document.getElementById('active-project-name');
const activeProjectDesc = document.getElementById('active-project-desc');
const boardWorkspace = document.getElementById('board-workspace');
const boardPlaceholder = document.getElementById('board-workspace-placeholder');
const reportsSection = document.getElementById('reports-section');
const addTaskHeaderBtn = document.getElementById('btn-open-task-modal');

// Statistics Cards
const statTotal = document.getElementById('stat-total');
const statPending = document.getElementById('stat-pending');
const statInprogress = document.getElementById('stat-inprogress');
const statCompleted = document.getElementById('stat-completed');

// Kanban lists containers
const tasksPendingContainer = document.getElementById('tasks-pending-container');
const tasksInprogressContainer = document.getElementById('tasks-inprogress-container');
const tasksDoneContainer = document.getElementById('tasks-done-container');
const countPending = document.getElementById('count-pending');
const countInprogress = document.getElementById('count-inprogress');
const countDone = document.getElementById('count-done');

// Modals
const modalProject = document.getElementById('modal-project');
const modalTask = document.getElementById('modal-task');
const openProjectModalBtn = document.getElementById('btn-open-project-modal');
const closeProjectModalBtn = document.getElementById('btn-close-project-modal');
const closeTaskModalBtn = document.getElementById('btn-close-task-modal');
const cancelProjectBtn = document.getElementById('btn-cancel-project');
const cancelTaskBtn = document.getElementById('btn-cancel-task');

// Forms submission inside modal
const projectCreateForm = document.getElementById('project-create-form');
const projectOwnerGroup = document.getElementById('project-owner-group');
const projectOwnerSelect = document.getElementById('project-owner');
const taskCreateForm = document.getElementById('task-create-form');
const taskAssigneeSelect = document.getElementById('task-assignee');

// Toast notification helper
function showToast(message, type = 'success') {
  const toast = document.getElementById('toast');
  toast.innerText = message;
  toast.className = `toast ${type}`;
  toast.classList.remove('hidden');
  
  setTimeout(() => {
    toast.classList.add('hidden');
  }, 4000);
}

// Global API Fetch Interceptor
async function apiCall(endpoint, options = {}) {
  const url = `${API_BASE}${endpoint}`;
  const headers = {
    'Content-Type': 'application/json',
    ...(token && { 'Authorization': `Bearer ${token}` }),
    ...options.headers
  };

  try {
    const response = await fetch(url, {
      method: options.method || 'GET',
      headers,
      ...(options.body && { body: JSON.stringify(options.body) })
    });

    const data = await response.json();

    if (!response.ok) {
      if (response.status === 401) {
        // Handle expired token or session issues
        if (token) {
          showToast(data.message || 'Session expired. Please log in again.', 'error');
          logout();
        }
      }
      throw new Error(data.message || data.errors?.join(', ') || 'API Request failed');
    }

    return data;
  } catch (error) {
    console.error(`API Call failed on ${endpoint}:`, error.message);
    throw error;
  }
}

// Session Helpers
function saveSession(newToken, userDetails) {
  token = newToken;
  currentUser = userDetails;
  localStorage.setItem('taskflow_token', token);
  localStorage.setItem('taskflow_user', JSON.stringify(currentUser));
  initView();
}

function logout() {
  token = null;
  currentUser = null;
  localStorage.removeItem('taskflow_token');
  localStorage.removeItem('taskflow_user');
  activeProjectId = null;
  initView();
}

// Render screens depending on auth state
function initView() {
  if (token && currentUser) {
    authGateway.classList.add('hidden');
    dashboardLayout.classList.remove('hidden');
    
    // Set Profile variables
    userFullnameSpan.innerText = currentUser.name;
    userRoleBadge.innerText = currentUser.role;
    userAvatar.innerText = currentUser.name.charAt(0).toUpperCase();

    if (currentUser.role === 'Admin') {
      userRoleBadge.className = 'role-badge admin-badge';
      userRoleBadge.style.color = '#ef4444';
      userRoleBadge.style.background = 'rgba(239, 68, 68, 0.1)';
    } else {
      userRoleBadge.className = 'role-badge user-badge';
      userRoleBadge.style.color = 'var(--primary)';
      userRoleBadge.style.background = 'var(--primary-glow)';
    }
    
    loadProjects();
    loadUsers();
  } else {
    dashboardLayout.classList.add('hidden');
    authGateway.classList.remove('hidden');
  }
}

// Auth Actions
goToRegisterBtn.addEventListener('click', (e) => {
  e.preventDefault();
  loginForm.classList.add('hidden');
  registerForm.classList.remove('hidden');
});

goToLoginBtn.addEventListener('click', (e) => {
  e.preventDefault();
  registerForm.classList.add('hidden');
  loginForm.classList.remove('hidden');
});

loginForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  try {
    const email = loginEmailInput.value;
    const password = loginPasswordInput.value;

    const res = await apiCall('/auth/login', {
      method: 'POST',
      body: { email, password }
    });

    showToast('Welcome to TaskFlow Dashboard!');
    saveSession(res.data.token, res.data.user);
    
    // Clear inputs
    loginEmailInput.value = '';
    loginPasswordInput.value = '';
  } catch (error) {
    showToast(error.message, 'error');
  }
});

registerForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  try {
    const name = regNameInput.value;
    const email = regEmailInput.value;
    const password = regPasswordInput.value;
    const role = regRoleSelect.value;

    await apiCall('/auth/register', {
      method: 'POST',
      body: { name, email, password, role }
    });

    showToast('Registration successful! Please log in.');
    registerForm.classList.add('hidden');
    loginForm.classList.remove('hidden');

    // Clear inputs
    regNameInput.value = '';
    regEmailInput.value = '';
    regPasswordInput.value = '';
  } catch (error) {
    showToast(error.message, 'error');
  }
});

logoutBtn.addEventListener('click', logout);

// Project management Actions
async function loadProjects() {
  try {
    const res = await apiCall('/projects');
    projects = res.data;
    renderProjectsList();
  } catch (error) {
    showToast('Failed to load projects.', 'error');
  }
}

async function loadUsers() {
  try {
    const res = await apiCall('/auth/users');
    usersList = res.data;
    
    // Populate Assignee Select in modal
    taskAssigneeSelect.innerHTML = '<option value="">Unassigned (None)</option>';
    usersList.forEach(u => {
      taskAssigneeSelect.innerHTML += `<option value="${u.id}">${u.name} (${u.role})</option>`;
    });
  } catch (error) {
    console.warn('Failed to load user directories directory:', error.message);
  }
}

function renderProjectsList() {
  if (projects.length === 0) {
    projectsListUl.innerHTML = '<li class="loading-placeholder">No projects available</li>';
    return;
  }

  projectsListUl.innerHTML = '';
  projects.forEach(p => {
    const li = document.createElement('li');
    li.dataset.id = p.id;
    li.innerHTML = `<i class="fa-solid fa-square-kanban"></i> ${p.name}`;
    if (activeProjectId === p.id) {
      li.classList.add('active');
    }

    li.addEventListener('click', () => selectProject(p.id));
    projectsListUl.appendChild(li);
  });
}

async function selectProject(projectId) {
  try {
    // Speed optimization: Fetch project details and tasks concurrently in parallel (saves 1 RTT)
    const [projectRes, tasksRes] = await Promise.all([
      apiCall(`/projects/${projectId}`),
      apiCall(`/tasks/project/${projectId}`)
    ]);

    const activeProject = projectRes.data;
    const tasks = tasksRes.data;

    activeProjectId = projectId;

    // Highlight active
    const items = projectsListUl.querySelectorAll('li');
    items.forEach(li => {
      if (parseInt(li.dataset.id, 10) === projectId) {
        li.classList.add('active');
      } else {
        li.classList.remove('active');
      }
    });

    activeProjectName.innerText = activeProject.name;
    activeProjectDesc.innerText = activeProject.description || 'No description provided.';

    // Show Workspace
    boardPlaceholder.classList.add('hidden');
    boardWorkspace.classList.remove('hidden');
    reportsSection.classList.remove('hidden');
    
    // Check create tasks permission boundary: Standard users can only create tasks in projects they own
    const isOwner = activeProject.owner_id === currentUser.id;
    const isAdmin = currentUser.role === 'Admin';
    if (isAdmin || isOwner) {
      addTaskHeaderBtn.classList.remove('hidden');
    } else {
      addTaskHeaderBtn.classList.add('hidden');
    }

    // Render Tasks Board
    renderTasksBoard(tasks);
  } catch (error) {
    showToast(error.message, 'error');
  }
}


function renderTasksBoard(tasks) {
  // Clear lists
  tasksPendingContainer.innerHTML = '';
  tasksInprogressContainer.innerHTML = '';
  tasksDoneContainer.innerHTML = '';

  let countP = 0, countI = 0, countD = 0;

  tasks.forEach(t => {
    const card = createTaskCard(t);
    
    if (t.status === 'Pending') {
      tasksPendingContainer.appendChild(card);
      countP++;
    } else if (t.status === 'InProgress') {
      tasksInprogressContainer.appendChild(card);
      countI++;
    } else if (t.status === 'Done') {
      tasksDoneContainer.appendChild(card);
      countD++;
    }
  });

  countPending.innerText = countP;
  countInprogress.innerText = countI;
  countDone.innerText = countD;

  // Dynamically update statistics panels based on current project tasks
  statTotal.innerText = tasks.length;
  statPending.innerText = countP;
  statInprogress.innerText = countI;
  statCompleted.innerText = countD;
}

function createTaskCard(task) {
  const card = document.createElement('div');
  card.className = 'task-card';
  card.dataset.id = task.id;

  const assigneeInit = task.assignee_name ? task.assignee_name.charAt(0).toUpperCase() : '?';
  const assigneeName = task.assignee_name || 'Unassigned';

  // Check actions permission boundaries
  // Admins can update/assign everything. Project owners can assign and status. Assignee can only update status.
  const isProjectOwner = projects.find(p => p.id === task.project_id)?.owner_id === currentUser.id;
  const isAssignee = task.assigned_to === currentUser.id;
  const isAdmin = currentUser.role === 'Admin';

  const canUpdateStatus = isAdmin || isProjectOwner || isAssignee;
  const canAssign = isAdmin || isProjectOwner;

  let actionButtonsHtml = '';

  // Assign user select dropdown (only if authorized)
  let assignmentHtml = '';
  if (canAssign) {
    assignmentHtml = `
      <button class="btn-action-icon btn-assign" title="Assign User" onclick="promptTaskAssignment(${task.id}, ${task.assigned_to})">
        <i class="fa-solid fa-user-pen"></i>
      </button>
    `;
  }

  // Task deletion (only if authorized)
  const canDelete = isAdmin || isProjectOwner;
  let deleteHtml = '';
  if (canDelete) {
    deleteHtml = `
      <button class="btn-action-icon btn-delete" title="Delete Task" onclick="deleteTask(${task.id})">
        <i class="fa-solid fa-trash"></i>
      </button>
    `;
  }

  // Next status progression helper button
  if (canUpdateStatus) {
    if (task.status === 'Pending') {
      actionButtonsHtml += `
        <button class="btn-action-icon btn-next" title="Move to In Progress" onclick="progressTaskStatus(${task.id}, 'InProgress')">
          <i class="fa-solid fa-arrow-right"></i>
        </button>
      `;
    } else if (task.status === 'InProgress') {
      actionButtonsHtml += `
        <button class="btn-action-icon btn-next" title="Complete Task" onclick="progressTaskStatus(${task.id}, 'Done')">
          <i class="fa-solid fa-circle-check"></i>
        </button>
      `;
    }
  }

  card.innerHTML = `
    <div class="task-card-title">${escapeHTML(task.title)}</div>
    ${task.description ? `<div class="task-card-desc">${escapeHTML(task.description)}</div>` : ''}
    <div class="task-card-footer">
      <div class="task-assignee-info" title="Assignee: ${assigneeName}">
        <div class="task-assignee-avatar">${assigneeInit}</div>
        <span>${assigneeName}</span>
      </div>
      <div class="task-actions-row">
        ${assignmentHtml}
        ${actionButtonsHtml}
        ${deleteHtml}
      </div>
    </div>
  `;

  return card;
}

// Global scope click progress functions
window.progressTaskStatus = async function(taskId, nextStatus) {
  try {
    await apiCall(`/tasks/${taskId}/status`, {
      method: 'PATCH',
      body: { status: nextStatus }
    });
    
    showToast(`Task status updated to ${nextStatus}!`);
    loadProjectTasks(activeProjectId);
  } catch (error) {
    showToast(error.message, 'error');
  }
};

window.promptTaskAssignment = async function(taskId, currentAssigneeId) {
  // Generate assignment overlay modal list
  const activeTask = document.querySelector(`.task-card[data-id="${taskId}"]`);
  const modalHTML = `
    <div id="modal-assignee-temp" class="modal-overlay">
      <div class="modal-card">
        <div class="modal-header">
          <h2>Assign Developer</h2>
          <button class="modal-close-btn" onclick="document.getElementById('modal-assignee-temp').remove()">&times;</button>
        </div>
        <div class="input-group">
          <label for="temp-assignee-select">Choose Team Member</label>
          <select id="temp-assignee-select">
            <option value="">Unassign User</option>
            ${usersList.map(u => `<option value="${u.id}" ${u.id === currentAssigneeId ? 'selected' : ''}>${u.name} (${u.role})</option>`).join('')}
          </select>
        </div>
        <div class="modal-actions">
          <button type="button" class="btn btn-secondary" onclick="document.getElementById('modal-assignee-temp').remove()">Cancel</button>
          <button type="button" class="btn btn-primary" onclick="confirmTaskAssignment(${taskId})">Assign</button>
        </div>
      </div>
    </div>
  `;
  document.body.insertAdjacentHTML('beforeend', modalHTML);
};

window.confirmTaskAssignment = async function(taskId) {
  const select = document.getElementById('temp-assignee-select');
  const assignedTo = select.value ? parseInt(select.value, 10) : null;

  try {
    await apiCall(`/tasks/${taskId}/assign`, {
      method: 'PATCH',
      body: { assignedTo }
    });

    showToast('Task assignee updated successfully.');
    document.getElementById('modal-assignee-temp').remove();
    loadProjectTasks(activeProjectId);
  } catch (error) {
    showToast(error.message, 'error');
  }
};

window.deleteTask = async function(taskId) {
  if (!confirm('Are you sure you want to delete this task?')) return;
  try {
    await apiCall(`/tasks/${taskId}`, {
      method: 'DELETE'
    });

    showToast('Task deleted successfully.');
    loadProjectTasks(activeProjectId);
  } catch (error) {
    showToast(error.message, 'error');
  }
};

function escapeHTML(str) {
  if (str === null || str === undefined) return '';
  return String(str).replace(/[&<>'"]/g, 
    tag => ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      "'": '&#39;',
      '"': '&quot;'
    }[tag] || tag)
  );
}

// Modal Toggle Handlers
openProjectModalBtn.addEventListener('click', () => {
  modalProject.classList.remove('hidden');
  if (currentUser && currentUser.role === 'Admin') {
    projectOwnerGroup.classList.remove('hidden');
    projectOwnerSelect.innerHTML = usersList.map(u => `<option value="${u.id}">${u.name} (${u.role})</option>`).join('');
  } else {
    projectOwnerGroup.classList.add('hidden');
    projectOwnerSelect.innerHTML = '';
  }
});
closeProjectModalBtn.addEventListener('click', () => modalProject.classList.add('hidden'));
cancelProjectBtn.addEventListener('click', () => modalProject.classList.add('hidden'));

addTaskHeaderBtn.addEventListener('click', () => modalTask.classList.remove('hidden'));
closeTaskModalBtn.addEventListener('click', () => modalTask.classList.add('hidden'));
cancelTaskBtn.addEventListener('click', () => modalTask.classList.add('hidden'));

// Forms submissions inside Modal
projectCreateForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const name = document.getElementById('project-name').value;
  const description = document.getElementById('project-desc').value;

  const body = { name, description };
  if (currentUser && currentUser.role === 'Admin' && projectOwnerSelect.value) {
    body.ownerId = parseInt(projectOwnerSelect.value, 10);
  }

  try {
    const res = await apiCall('/projects', {
      method: 'POST',
      body
    });

    showToast('Workspace created successfully.');
    modalProject.classList.add('hidden');
    document.getElementById('project-name').value = '';
    document.getElementById('project-desc').value = '';
    projectOwnerSelect.value = '';
    
    await loadProjects();
    selectProject(res.data.id);
  } catch (error) {
    showToast(error.message, 'error');
  }
});

taskCreateForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const title = document.getElementById('task-title').value;
  const description = document.getElementById('task-desc').value;
  const val = taskAssigneeSelect.value;
  const assignedTo = val ? parseInt(val, 10) : null;

  try {
    await apiCall('/tasks', {
      method: 'POST',
      body: { title, description, projectId: activeProjectId, assignedTo }
    });

    showToast('Task added successfully.');
    modalTask.classList.add('hidden');
    document.getElementById('task-title').value = '';
    document.getElementById('task-desc').value = '';
    taskAssigneeSelect.value = '';

    loadProjectTasks(activeProjectId);
  } catch (error) {
    showToast(error.message, 'error');
  }
});

// App Startup
initView();
