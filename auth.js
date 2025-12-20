// Alternar entre Login e Cadastro
function switchTab(tab) {
    const loginForm = document.getElementById('loginForm');
    const registerForm = document.getElementById('registerForm');
    const tabs = document.querySelectorAll('.auth-tab');
    
    tabs.forEach(t => t.classList.remove('active'));
    
    if (tab === 'login') {
        loginForm.classList.remove('hidden');
        registerForm.classList.add('hidden');
        tabs[0].classList.add('active');
    } else {
        loginForm.classList.add('hidden');
        registerForm.classList.remove('hidden');
        tabs[1].classList.add('active');
    }
}

// Mostrar notificações simples
function showNotification(message, type) {
    // Para já usamos alert, depois pode-se substituir por toasts bonitos
    if (type === 'success') {
        alert(message);
    } else if (type === 'error') {
        alert(message);
    } else {
        console.log(message);
    }
}

// Checar se o usuário já está logado
function checkIfLoggedIn() {
    const token = sessionStorage.getItem('token') || localStorage.getItem('token');
    if (token) {
        console.log('Usuário já logado! Redirecionando...');
        window.location.href = 'index.html';
    }
}

// Processar Login
async function handleLogin(event) {
    event.preventDefault();
    
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;
    const rememberMe = document.getElementById('rememberMe').checked;
    
    if (!email || !password) {
        showNotification('Por favor, preencha todos os campos!', 'error');
        return;
    }
    
    try {
        const response = await AuthAPI.loginUser({ email, password });
        
        if (response.success) {
            console.log('✅ Login bem-sucedido!');
            console.log('Token recebido:', response.data.token);
            
            const userData = {
                id: response.data.id,
                name: response.data.name,
                email: response.data.email,
                phone: response.data.phone,
                loggedIn: true,
                loginDate: new Date().toISOString()
            };
            
            if (rememberMe) {
                localStorage.setItem('currentUser', JSON.stringify(userData));
                localStorage.setItem('token', response.data.token);
                console.log('💾 Token salvo no localStorage');
            } else {
                sessionStorage.setItem('currentUser', JSON.stringify(userData));
                sessionStorage.setItem('token', response.data.token);
                console.log('💾 Token salvo no sessionStorage');
            }
            
            showNotification('✅ Login realizado com sucesso!', 'success');
            
            setTimeout(() => {
                const redirectUrl = sessionStorage.getItem('redirectAfterLogin') || 'index.html';
                sessionStorage.removeItem('redirectAfterLogin');
                window.location.href = redirectUrl;
            }, 1000);
        } else {
            showNotification('❌ ' + response.message, 'error');
        }
    } catch (error) {
        console.error('Erro ao fazer login:', error);
        showNotification('❌ Erro ao conectar com o servidor', 'error');
    }
}

// Processar Cadastro
async function handleRegister(event) {
    event.preventDefault();
    
    const name = document.getElementById('registerName').value;
    const email = document.getElementById('registerEmail').value;
    const phone = document.getElementById('registerPhone').value;
    const password = document.getElementById('registerPassword').value;
    const confirmPassword = document.getElementById('registerConfirmPassword').value;
    const agreeTerms = document.getElementById('agreeTerms').checked;
    
    const province = document.getElementById('registerProvince').value;
    const municipality = document.getElementById('registerMunicipality').value;
    const street = document.getElementById('registerStreet').value;
    const number = document.getElementById('registerNumber').value;
    const complement = document.getElementById('registerComplement').value;
    const neighborhood = document.getElementById('registerNeighborhood').value;
    const reference = document.getElementById('registerReference').value;
    
    if (!name || !email || !phone || !password || !confirmPassword) {
        showNotification('❌ Por favor, preencha todos os campos!', 'error');
        return;
    }
    
    if (!province || !municipality || !street || !number || !neighborhood || !reference) {
        showNotification('❌ Por favor, preencha todos os campos de endereço!', 'error');
        return;
    }
    
    if (password !== confirmPassword) {
        showNotification('❌ As senhas não coincidem!', 'error');
        return;
    }
    
    if (password.length < 6) {
        showNotification('❌ A senha deve ter no mínimo 6 caracteres!', 'error');
        return;
    }
    
    if (!agreeTerms) {
        showNotification('❌ Você precisa aceitar os termos de uso!', 'error');
        return;
    }
    
    try {
        const response = await AuthAPI.registerUser({ 
            name, 
            email, 
            phone, 
            password,
            province,
            municipality,
            street,
            number,
            complement,
            neighborhood,
            reference
        });
        
        if (response.success) {
            console.log('✅ Cadastro bem-sucedido!');
            console.log('Token recebido:', response.data.token);
            
            const userData = {
                id: response.data.id,
                name: response.data.name,
                email: response.data.email,
                phone: response.data.phone,
                address: {
                    province: response.data.province,
                    municipality: response.data.municipality,
                    street: response.data.street,
                    number: response.data.number,
                    complement: response.data.complement,
                    neighborhood: response.data.neighborhood,
                    reference: response.data.reference
                },
                loggedIn: true,
                loginDate: new Date().toISOString()
            };
            
            sessionStorage.setItem('currentUser', JSON.stringify(userData));
            sessionStorage.setItem('token', response.data.token);
            console.log('💾 Token salvo no sessionStorage');
            
            showNotification('✅ Conta criada com sucesso!', 'success');
            
            setTimeout(() => {
                const redirectUrl = sessionStorage.getItem('redirectAfterLogin') || 'index.html';
                sessionStorage.removeItem('redirectAfterLogin');
                window.location.href = redirectUrl;
            }, 1000);
        } else {
            showNotification('❌ ' + response.message, 'error');
        }
    } catch (error) {
        console.error('Erro ao cadastrar:', error);
        showNotification('❌ Erro ao conectar com o servidor', 'error');
    }
}

// Adicionar animações CSS
const style = document.createElement('style');
style.textContent = `
    @keyframes slideInRight {
        from { transform: translateX(400px); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
    }
    @keyframes slideOutRight {
        from { transform: translateX(0); opacity: 1; }
        to { transform: translateX(400px); opacity: 0; }
    }
`;
document.head.appendChild(style);

// Inicialização
document.addEventListener('DOMContentLoaded', function() {
    console.log('Página de autenticação carregada! 🔐');
    
    checkIfLoggedIn();
});
