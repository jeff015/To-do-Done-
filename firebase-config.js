try {
    // Essas são as credenciais e configurações específicas do projeto Firebase
  // Chaves devem ser protegidas
    const firebaseConfig = {
        apiKey: "AIzaSyB7di8F6IpS43ATo9rgUR5_063Nezm9BKk",        // Chave da API para autenticação com os serviços Firebase
        authDomain: "done-4ee38.firebaseapp.com",                  // Domínio de autenticação para login de usuários
        projectId: "done-4ee38",                                   // ID único do projeto no Firebase
        storageBucket: "done-4ee38.firebasestorage.app",           // Bucket de armazenamento para arquivos e mídia
        messagingSenderId: "979722629186",                         // ID do remetente para funcionalidades de mensagem
        appId: "1:979722629186:web:851b652182c186c59bbddb",        // ID único da aplicação no Firebase
        measurementId: "G-CJ1XV63R5T"                              // ID para métricas e analytics
    };

    // Inicializa o Firebase apenas se ainda não estiver inicializado
    // Isso evita erros de inicialização múltipla quando o código é executado mais de uma vez
    if (!firebase.apps.length) {
        firebase.initializeApp(firebaseConfig);
        console.log("Firebase inicializado com sucesso");
    } else {
        console.log("Firebase já estava inicializado anteriormente");
    }

    // Obtém as instâncias dos serviços do Firebase que serão utilizados na aplicação
    const firebaseAuth = firebase.auth();       // Serviço de autenticação para gerenciar usuários
    const firebaseDb = firebase.firestore();    // Serviço de banco de dados Firestore para armazenar dados

    // Configuração avançada do Firestore
    // Define o tamanho do cache como ilimitado para melhorar a experiência offline
    firebaseDb.settings({
        cacheSizeBytes: firebase.firestore.CACHE_SIZE_UNLIMITED    // Remove a limitação padrão do tamanho de cache
    });

    // Habilita a persistência offline para o Firestore
    // Isso permite que a aplicação funcione mesmo sem conexão com a internet
    firebaseDb.enablePersistence()
        .catch((err) => {
            if (err.code == 'failed-precondition') {
                // Erro ocorre quando múltiplas abas estão usando o Firestore ao mesmo tempo
                console.log('Múltiplas abas abertas, persistência só pode ser habilitada em uma aba por vez.');
                console.log('Feche as outras abas ou use um modo de acesso diferente para resolver este problema.');
            } else if (err.code == 'unimplemented') {
                // Erro ocorre quando o navegador não suporta os recursos necessários
                console.log('O navegador atual não suporta persistência offline');
                console.log('Recursos como IndexedDB podem não estar disponíveis ou estão desabilitados.');
            } else {
                // Outros erros que possam ocorrer
                console.error('Erro desconhecido ao habilitar persistência:', err);
            }
        })
        .then(() => {
            console.log('Persistência offline habilitada com sucesso');
        });

    // Disponibiliza os serviços do Firebase globalmente através do objeto window
    // Isso permite que outras partes da aplicação acessem estes serviços facilmente
    window.auth = firebaseAuth;     // Torna o serviço de autenticação acessível globalmente
    window.db = firebaseDb;         // Torna o banco de dados Firestore acessível globalmente
    
    // Adiciona um listener para monitorar o estado de conexão com o Firestore
    const connectedRef = firebase.database().ref('.info/connected');
    connectedRef.on('value', (snap) => {
        if (snap.val() === true) {
            console.log('Conectado ao Firebase Realtime Database');
        } else {
            console.log('Desconectado do Firebase Realtime Database');
        }
    });
    
} catch (error) {
    // Captura e registra qualquer erro ocorrido durante a inicialização do Firebase
    console.error('Erro na inicialização do Firebase:', error);
    
    // Registra detalhes específicos que podem ajudar na depuração
    console.error('Detalhes do erro:', {
        mensagem: error.message,
        código: error.code,
        stack: error.stack
    });
    
    // Alerta o usuário sobre o problema
    alert('Ocorreu um erro ao inicializar os serviços Firebase. Por favor, recarregue a página ou tente novamente mais tarde.');
}
