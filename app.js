// Usar serviços do Firebase a partir do objeto window
let auth, db;

// Função para ocultar a tela de carregamento
function hideLoading() {
    const loading = document.getElementById('loading');
    if (loading) {
        loading.classList.add('hidden');
    }
}

// Função para exibir a tela de carregamento
function showLoading() {
    const loading = document.getElementById('loading');
    if (loading) {
        loading.classList.remove('hidden');
    }
}

// Aguardar a inicialização do Firebase
function initializeApp() {
    showLoading(); // Exibe a tela de carregamento ao iniciar a inicialização
    return new Promise((resolve, reject) => {
        const checkFirebase = setInterval(() => {
            if (window.auth && window.db) {
                auth = window.auth;
                db = window.db;
                clearInterval(checkFirebase);
                hideLoading(); // Oculta a tela de carregamento quando o Firebase estiver pronto
                resolve();
            }
        }, 100);

        // Define um tempo limite de 5 segundos
        setTimeout(() => {
            clearInterval(checkFirebase);
            hideLoading(); // Oculta a tela de carregamento mesmo se houver um erro
            reject(new Error('Tempo limite excedido ao inicializar o Firebase'));
        }, 5000);
    });
}

// Inicializa a aplicação
initializeApp()
    .then(() => {
        console.log('Firebase inicializado com sucesso');
        setupApp();
    })
    .catch(error => {
        console.error('Falha ao inicializar o Firebase:', error);
        alert('Erro ao inicializar o Firebase. Por favor, recarregue a página.');
    });

function setupApp() {
    // Verifica se os serviços do Firebase estão disponíveis
    if (!auth || !db) {
        console.error('Serviços do Firebase não disponíveis');
        alert('Erro: Serviços do Firebase não disponíveis');
        return;
    }

    // Configurar persistência de autenticação
    auth.setPersistence(firebase.auth.Auth.Persistence.LOCAL)
        .catch(error => {
            console.error('Erro ao configurar persistência:', error);
        });

    // Definição dos tipos de enumeração
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

    // Variáveis de estado da aplicação
    let todos = [];
    let currentTodoId = null;
    let currentUser = null;

    // Elementos do DOM
    const authContainer = document.getElementById('auth-container');
    const appContainer = document.getElementById('app-container');
    const authForm = document.getElementById('auth-form');
    const loginBtn = document.getElementById('login-btn');
    const registerBtn = document.getElementById('register-btn');
    const logoutBtn = document.getElementById('logout-btn');
    const userEmail = document.getElementById('user-email');
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

    // Inicializa os ícones da biblioteca Lucide
    lucide.createIcons();

    // Gerenciamento de autenticação - observa mudanças no estado do usuário
    auth.onAuthStateChanged((user) => {
        hideLoading(); // Esconde a tela de carregamento após verificar a autenticação
        currentUser = user;
        if (user) {
            console.log('Usuário autenticado:', user.email);
            authContainer.classList.add('hidden');
            appContainer.classList.remove('hidden');
            userEmail.textContent = user.email;
            loadTodos();
        } else {
            console.log('Usuário não autenticado');
            authContainer.classList.remove('hidden');
            appContainer.classList.add('hidden');
            todos = [];
            renderTodos();
        }
    });

    // Manipuladores de eventos de autenticação
    async function handleAuth(event) {
        event.preventDefault();
        try {
            const { email, password } = validateForm();
            const isLogin = event.target.id === 'login-btn' || event.submitter.id === 'login-btn';

            showLoading();
            if (isLogin) {
                await auth.signInWithEmailAndPassword(email, password);
                console.log('Login realizado com sucesso');
            } else {
                await auth.createUserWithEmailAndPassword(email, password);
                console.log('Registro realizado com sucesso');
            }
            document.getElementById('auth-form').reset();
        } catch (error) {
            handleAuthError(error);
        } finally {
            hideLoading();
        }
    }

    async function handleLogout() {
        try {
            await auth.signOut();
        } catch (error) {
            alert(error.message);
        }
    }

    // Funções utilitárias
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

    // Operações com o Firestore (banco de dados)
    async function loadTodos() {
        if (!currentUser) return;

        // Limpar listener anterior se existir
        if (window.unsubscribe) {
            window.unsubscribe();
        }

        // Criar listener em tempo real para atualização automática dos dados
        window.unsubscribe = db.collection('todos')
            .where('userId', '==', currentUser.uid)
            .orderBy('createdAt', 'desc')
            .onSnapshot((snapshot) => {
                todos = snapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                }));
                renderTodos();
            }, (error) => {
                console.error('Erro ao carregar tarefas:', error);
                // alert('Erro ao carregar tarefas: ' + error.message);
            });
    }

    async function addTodo(title, description, priority) {
        if (!currentUser) return;

        try {
            const todoRef = await db.collection('todos').add({
                userId: currentUser.uid,
                title,
                description,
                completed: false,
                createdAt: Date.now(),
                priority
            });

            // const todo = {
            //     id: todoRef.id,
            //     userId: currentUser.uid,
            //     title,
            //     description,
            //     completed: false,
            //     createdAt: Date.now(),
            //     priority
            // };

            // todos.unshift(todo);
            // renderTodos();
        } catch (error) {
            console.error('Erro ao adicionar tarefa:', error);
            alert('Erro ao adicionar tarefa');
        }
    }

    async function toggleTodo(id) {
        if (!currentUser) return;

        const todo = todos.find(t => t.id === id);
        if (!todo) return;

        try {
            await db.collection('todos').doc(id).update({
                completed: !todo.completed
            });

            todos = todos.map(todo =>
                todo.id === id ? { ...todo, completed: !todo.completed } : todo
            );
            renderTodos();
        } catch (error) {
            console.error('Erro ao alternar estado da tarefa:', error);
            alert('Erro ao atualizar tarefa');
        }
    }

    async function deleteTodo(id) {
        if (!currentUser) return;

        try {
            await db.collection('todos').doc(id).delete();
            todos = todos.filter(todo => todo.id !== id);
            renderTodos();
        } catch (error) {
            console.error('Erro ao excluir tarefa:', error);
            alert('Erro ao excluir tarefa');
        }
    }

    async function editTodo(id, title, description, priority) {
        if (!currentUser) return;

        try {
            await db.collection('todos').doc(id).update({
                title,
                description,
                priority
            });

            todos = todos.map(todo =>
                todo.id === id ? { ...todo, title, description, priority } : todo
            );
            renderTodos();
        } catch (error) {
            console.error('Erro ao editar tarefa:', error);
            alert('Erro ao editar tarefa');
        }
    }

    // Funções de renderização da interface
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

    // Manipulação de formulários
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

    // Funções do modal de exclusão
    function showDeleteModal(id) {
        currentTodoId = id;
        deleteModal.classList.remove('hidden');
    }

    function hideDeleteModal() {
        deleteModal.classList.add('hidden');
        currentTodoId = null;
    }

    // Registro de eventos (event listeners)
    authForm.addEventListener('submit', handleAuth);
    registerBtn.addEventListener('click', (e) => {
        e.preventDefault();
        try {
            const { email, password } = validateForm();
            auth.createUserWithEmailAndPassword(email, password)
                .then(() => {
                    console.log('Usuário criado com sucesso');
                    authForm.reset();
                })
                .catch(handleAuthError);
        } catch (error) {
            handleAuthError(error);
        }
    });
    logoutBtn.addEventListener('click', handleLogout);
    todoForm.addEventListener('submit', handleSubmit);
    sortSelect.addEventListener('change', renderTodos);
    cancelDelete.addEventListener('click', hideDeleteModal);
    confirmDelete.addEventListener('click', () => {
        if (currentTodoId) {
            deleteTodo(currentTodoId);
            hideDeleteModal();
        }
    });
}

// Função para validar os campos do formulário de autenticação
function validateForm() {
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    
    if (!email || !password) {
        throw new Error('Por favor, preencha todos os campos');
    }
    
    if (password.length < 6) {
        throw new Error('A senha deve ter pelo menos 6 caracteres');
    }
    
    return { email, password };
}

// Função para tratamento de erros de autenticação
function handleAuthError(error) {
    console.error('Erro de autenticação:', error);
    
    const errorMessages = {
        'auth/email-already-in-use': 'Este e-mail já está em uso',
        'auth/invalid-email': 'E-mail inválido',
        'auth/operation-not-allowed': 'Operação não permitida',
        'auth/weak-password': 'Senha muito fraca',
        'auth/user-disabled': 'Usuário desabilitado',
        'auth/user-not-found': 'Usuário não encontrado',
        'auth/wrong-password': 'Senha incorreta'
    };

    alert(errorMessages[error.code] || error.message);
}
