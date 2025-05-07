3# Done! - Gerenciador de Tarefas


**Done!** é uma aplicação web moderna para gerenciamento de tarefas, construída com JavaScript puro e Firebase. Organize suas tarefas de forma simples e eficiente, com suporte para funcionamento offline e sincronização em tempo real.

##  Características

-  Autenticação completa de usuários (login/registro)
-  Criação, edição e exclusão de tarefas
-  Sincronização em tempo real com o Firestore
-  Ordenação de tarefas por data, prioridade ou status
-  Barra de progresso visual
-  Design responsivo para todos os dispositivos
-  Funcionalidade offline através do Firebase

##  Tecnologias Utilizadas

- **Frontend:** HTML5, CSS3, JavaScript Vanilla
- **Backend:** Firebase (Authentication, Firestore)
- **Ícones:** Lucide Icons
- **Fontes:** Google Fonts (Inter)

##  Instalação e Execução

1. Clone este repositório:
   ```bash
   git clone https://github.com/seu-usuario/done-app.git
   cd done-app
   ```

2. Configure o Firebase:
   - Crie um projeto no [Firebase Console](https://console.firebase.google.com/)
   - Ative o Authentication com e-mail/senha
   - Configure o Firestore Database
   - Copie as credenciais do seu projeto para o arquivo `firebase-config.js`

3. Execute o index.html com VsCode de preferencia com Live Server

##  Estrutura do Projeto

```
done-app/
├── index.html          # Estrutura HTML principal
├── style.css           # Estilos CSS
├── app.js              # Lógica principal da aplicação
├── firebase-config.js  # Configuração do Firebase
└── README.md           # Este arquivo
```

##  Configuração do Firebase

Substitua o conteúdo do arquivo `firebase-config.js` com suas próprias credenciais do Firebase:

```javascript
try {
    const firebaseConfig = {
        apiKey: "SUA_API_KEY",
        authDomain: "seu-projeto.firebaseapp.com",
        projectId: "seu-projeto",
        storageBucket: "seu-projeto.appspot.com",
        messagingSenderId: "SEU_MESSAGING_ID",
        appId: "SEU_APP_ID",
        measurementId: "SEU_MEASUREMENT_ID"
    };
}
```


##  Desenvolvimento

### Modelo de Dados

As tarefas são armazenadas no Firestore com a seguinte estrutura:

```javascript
{
  userId: "ID do usuário autenticado",
  title: "Título da tarefa",
  description: "Descrição da tarefa",
  completed: false,
  createdAt: 1620000000000, // Timestamp
  priority: "low" // "low", "medium" ou "high"
}
```

##  Contribuição

Contribuições são bem-vindas! Para contribuir:

1. Faça um fork do projeto
2. Crie uma branch para sua feature (`git checkout -b feature/nova-feature`)
3. Faça commit das suas alterações (`git commit -m 'Adiciona nova feature'`)
4. Faça push para a branch (`git push origin feature/nova-feature`)
5. Abra um Pull Request

##  Licença

Desenvolvido para ajudar você a se manter organizado!
