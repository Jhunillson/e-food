// Lista de páginas que NÃO precisam de autenticação
const publicPages = ['index.html', 'auth.html', 'login.html', 'register.html', '', 'restaurant.html'];

// Verificar se a página atual é pública
function isPublicPage() {
    const currentPage = window.location.pathname.split('/').pop();
    return publicPages.includes(currentPage) || currentPage === '' || window.location.pathname === '/';
}

// Verificar autenticação e atualizar UI
function checkAuthAndUpdateUI() {
    const token = sessionStorage.getItem('token') || localStorage.getItem('token');
    const currentUser = JSON.parse(sessionStorage.getItem('currentUser') || localStorage.getItem('currentUser') || 'null');
    
    const loginBtn = document.getElementById('loginBtn');
    const userMenu = document.getElementById('userMenu');
    const userName = document.getElementById('userName');
    
    if (token && currentUser) {
        // Usuário logado - mostrar menu do usuário
        if (loginBtn) loginBtn.style.display = 'none';
        if (userMenu) userMenu.style.display = 'block';
        if (userName) {
            // Pegar primeiro nome
            const firstName = currentUser.name.split(' ')[0];
            userName.textContent = firstName;
        }
        
        console.log('✅ Usuário logado:', currentUser.name);
    } else {
        // Usuário não logado - mostrar botão entrar
        if (loginBtn) loginBtn.style.display = 'inline-block';
        if (userMenu) userMenu.style.display = 'none';
    }
}

// Função de logout
function logout() {
    // Confirmar logout
    if (confirm('Tem certeza que deseja sair?')) {
        // Limpar TODOS os dados de autenticação
        sessionStorage.removeItem('token');
        sessionStorage.removeItem('user');
        sessionStorage.removeItem('currentUser');
        sessionStorage.removeItem('cart');
        sessionStorage.removeItem('restaurant');
        
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        localStorage.removeItem('currentUser');
        
        console.log('👋 Logout realizado');
        
        // Redirecionar para página de login
        window.location.href = 'auth.html';
    }
}

// Executar ao carregar a página
document.addEventListener('DOMContentLoaded', checkAuthAndUpdateUI);