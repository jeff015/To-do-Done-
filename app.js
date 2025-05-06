// Types
const Priority = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high'
};

const SortOption = {
  DATE: 'date',
  PRIORITY: 'priority',
  STATUS: 'status'
};

// State
let todos = JSON.parse(localStorage.getItem('todos')) || [];
let currentTodoId = null;

// DOM Elements
const todoForm = document.getElementById('todo-form');
const todosContainer = document.getElementById('todos-container');
const emptyState = document.getElementById('empty-state');
const progressContainer = document.getElementById('progress-container');
const progressText = document.getElementById('progress-text');
const progressPercentage = document.getElementById('progress-percentage');
const progressFill = document.getElementById('progress-fill');
const todosCount = document.getElementById('todos-count');
const sortSelect = document.getElementById('sort-select');
const deleteModal = document.getElementById('delete-modal');
const cancelDelete = document.getElementById('cancel-delete');
const confirmDelete = document.getElementById('confirm-delete');

// Initialize Lucide icons
lucide.createIcons();

// Utils
function saveToLocalStorage() {
  localStorage.setItem('todos', JSON.stringify(todos));
}

function formatDate(timestamp) {
  return new Date(timestamp).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  });
}

function updateProgress() {
  const totalTodos = todos.length;
  const completedTodos = todos.filter(todo => todo.completed).length;
  const percentage = totalTodos > 0 ? Math.round((completedTodos / totalTodos) * 100) : 0;

  progressContainer.classList.toggle('hidden', totalTodos === 0);
  progressText.textContent = `Progresso: ${completedTodos} de ${totalTodos} tarefas concluídas`;
  progressPercentage.textContent = `${percentage}%`;
  progressFill.style.width = `${percentage}%`;
}

function updateTodosCount() {
  const count = todos.length;
  todosCount.textContent = count === 0 
    ? 'Nenhuma tarefa'
    : `${count} ${count === 1 ? 'tarefa' : 'tarefas'}`;
}

function getPriorityConfig(priority) {
  return {
    low: {
      icon: 'clock',
      label: 'Baixa'
    },
    medium: {
      icon: 'clock',
      label: 'Média'
    },
    high: {
      icon: 'alert-circle',
      label: 'Alta'
    }
  }[priority];
}

// Todo Operations
function addTodo(title, description, priority) {
  const todo = {
    id: crypto.randomUUID(),
    title,
    description,
    completed: false,
    createdAt: Date.now(),
    priority
  };

  todos.unshift(todo);
  saveToLocalStorage();
  renderTodos();
}

function toggleTodo(id) {
  todos = todos.map(todo =>
    todo.id === id ? { ...todo, completed: !todo.completed } : todo
  );
  saveToLocalStorage();
  renderTodos();
}

function deleteTodo(id) {
  todos = todos.filter(todo => todo.id !== id);
  saveToLocalStorage();
  renderTodos();
}

function editTodo(id, title, description, priority) {
  todos = todos.map(todo =>
    todo.id === id ? { ...todo, title, description, priority } : todo
  );
  saveToLocalStorage();
  renderTodos();
}

// Rendering
function createTodoElement(todo) {
  const template = document.getElementById('todo-item-template');
  const todoElement = template.content.cloneNode(true).children[0];
  
  todoElement.dataset.id = todo.id;
  if (todo.completed) todoElement.classList.add('completed');

  const title = todoElement.querySelector('.todo-title');
  const description = todoElement.querySelector('.todo-description');
  const checkbox = todoElement.querySelector('.todo-checkbox');
  const priorityBadge = todoElement.querySelector('.todo-priority');
  const date = todoElement.querySelector('.todo-date');
  const editButton = todoElement.querySelector('.todo-edit');
  const deleteButton = todoElement.querySelector('.todo-delete');

  title.textContent = todo.title;
  description.textContent = todo.description;
  date.textContent = formatDate(todo.createdAt);

  const priorityConfig = getPriorityConfig(todo.priority);
  priorityBadge.innerHTML = `
    <i data-lucide="${priorityConfig.icon}"></i>
    ${priorityConfig.label}
  `;
  priorityBadge.classList.add(todo.priority);

  checkbox.addEventListener('click', () => toggleTodo(todo.id));
  editButton.addEventListener('click', () => startEditing(todo));
  deleteButton.addEventListener('click', () => showDeleteModal(todo.id));

  lucide.createIcons({
    icons: {
      'check': checkbox.querySelector('i'),
      [priorityConfig.icon]: priorityBadge.querySelector('i')
    }
  });

  return todoElement;
}

function renderTodos() {
  const sortedTodos = [...todos].sort((a, b) => {
    switch (sortSelect.value) {
      case SortOption.DATE:
        return b.createdAt - a.createdAt;
      case SortOption.PRIORITY:
        const priorityOrder = { high: 0, medium: 1, low: 2 };
        return priorityOrder[a.priority] - priorityOrder[b.priority];
      case SortOption.STATUS:
        return Number(a.completed) - Number(b.completed);
      default:
        return 0;
    }
  });

  todosContainer.innerHTML = '';
  emptyState.style.display = todos.length === 0 ? 'block' : 'none';

  if (todos.length > 0) {
    sortedTodos.forEach(todo => {
      todosContainer.appendChild(createTodoElement(todo));
    });
  }

  updateProgress();
  updateTodosCount();
  lucide.createIcons();
}

// Form Handling
function handleSubmit(event) {
  event.preventDefault();
  const title = event.target.title.value.trim();
  const description = event.target.description.value.trim();
  const priority = event.target.priority.value;

  if (!title) return;

  if (currentTodoId) {
    editTodo(currentTodoId, title, description, priority);
    currentTodoId = null;
    event.target.querySelector('button[type="submit"]').innerHTML = `
      <i data-lucide="plus-circle"></i>
      Adicionar Tarefa
    `;
  } else {
    addTodo(title, description, priority);
  }

  event.target.reset();
  lucide.createIcons();
}

function startEditing(todo) {
  currentTodoId = todo.id;
  const form = todoForm;
  
  form.title.value = todo.title;
  form.description.value = todo.description;
  form.priority.value = todo.priority;
  
  form.querySelector('button[type="submit"]').innerHTML = `
    <i data-lucide="check"></i>
    Atualizar Tarefa
  `;
  
  form.scrollIntoView({ behavior: 'smooth' });
  lucide.createIcons();
}

// Delete Modal
function showDeleteModal(id) {
  currentTodoId = id;
  deleteModal.classList.remove('hidden');
}

function hideDeleteModal() {
  deleteModal.classList.add('hidden');
  currentTodoId = null;
}

// Event Listeners
todoForm.addEventListener('submit', handleSubmit);
sortSelect.addEventListener('change', renderTodos);
cancelDelete.addEventListener('click', hideDeleteModal);
confirmDelete.addEventListener('click', () => {
  if (currentTodoId) {
    deleteTodo(currentTodoId);
    hideDeleteModal();
  }
});

// Initial render
renderTodos();
