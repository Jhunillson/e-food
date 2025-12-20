// Alternar entre Login e Cadastro
function switchTab(tab) {
    const loginForm = document.getElementById('loginForm');
    const registerForm = document.getElementById('registerForm');
    const tabs = document.querySelectorAll('.auth-tab');
    
    tabs.forEach(t => t.classList.remove('active'));
    
    if (tab === 'login') {
        loginForm.classList.add('active');
        registerForm.classList.remove('active');
        tabs[0].classList.add('active');
    } else {
        loginForm.classList.remove('active');
        registerForm.classList.add('active');
        tabs[1].classList.add('active');
    }
}

// Processar Login
async function handleLogin(event) {
    event.preventDefault();
    
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;
    const rememberMe = document.getElementById('rememberMe').checked;
    
    if (!email || !password) {
        alert('Por favor, preencha todos os campos!');
        return;
    }
    
    try {
        console.log('🔄 Tentando fazer login...');
        const response = await DeliveryAPI.login({ email, password });
        
        console.log('📥 Resposta recebida:', response);
        
        if (response.success) {
            console.log('✅ Login bem-sucedido!');
            
            const deliveryData = {
                id: response.data.id,
                name: response.data.name,
                email: response.data.email,
                phone: response.data.phone,
                vehicle: response.data.vehicle,
                isOnline: response.data.isOnline,
                score: response.data.score,
                totalDeliveries: response.data.totalDeliveries
            };
            
            // Salvar token e dados
            if (rememberMe) {
                localStorage.setItem('deliveryUser', JSON.stringify(deliveryData));
                localStorage.setItem('deliveryToken', response.data.token);
            } else {
                sessionStorage.setItem('deliveryUser', JSON.stringify(deliveryData));
                sessionStorage.setItem('deliveryToken', response.data.token);
            }
            
            showNotification('✅ Login realizado com sucesso!', 'success');
            
            setTimeout(() => {
                window.location.href = 'delivery-dashboard.html';
            }, 1000);
        } else {
            showNotification('❌ ' + response.message, 'error');
        }
    } catch (error) {
        console.error('Erro ao fazer login:', error);
        showNotification('❌ Erro ao conectar com o servidor. Verifique se o servidor está rodando.', 'error');
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
    const vehicle = document.querySelector('input[name="vehicle"]:checked')?.value;
    const vehiclePlate = document.getElementById('vehiclePlate').value;
    const agreeTerms = document.getElementById('agreeTerms').checked;
    
    if (!name || !email || !phone || !password || !confirmPassword || !vehicle) {
        showNotification('❌ Por favor, preencha todos os campos obrigatórios!', 'error');
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
        console.log('🔄 Tentando cadastrar...');
        const response = await DeliveryAPI.register({
            name,
            email,
            phone,
            password,
            vehicle,
            vehiclePlate
        });
        
        console.log('📥 Resposta recebida:', response);
        
        if (response.success) {
            console.log('✅ Cadastro bem-sucedido!');
            
            // CORRIGIDO: Se não tem data, significa que está pendente de aprovação
            if (!response.data) {
                console.log('⏳ Cadastro pendente de aprovação');
                showNotification('✅ Cadastro realizado! Aguarde a aprovação do administrador.', 'success');
                
                setTimeout(() => {
                    // Limpar formulário
                    document.getElementById('registerForm').reset();
                    // Voltar para login
                    switchTab('login');
                }, 2000);
                return;
            }
            
            // Se tem data, salvar e redirecionar (caso o entregador seja aprovado automaticamente)
            const deliveryData = {
                id: response.data.id,
                name: response.data.name,
                email: response.data.email,
                phone: response.data.phone,
                vehicle: response.data.vehicle
            };
            
            sessionStorage.setItem('deliveryUser', JSON.stringify(deliveryData));
            sessionStorage.setItem('deliveryToken', response.data.token);
            
            showNotification('✅ Conta criada com sucesso!', 'success');
            
            setTimeout(() => {
                window.location.href = 'delivery-dashboard.html';
            }, 1000);
        } else {
            showNotification('❌ ' + response.message, 'error');
        }
    } catch (error) {
        console.error('Erro ao cadastrar:', error);
        showNotification('❌ Erro ao conectar com o servidor. Verifique se o servidor está rodando.', 'error');
    }
}

// Seleção visual de veículo
document.addEventListener('DOMContentLoaded', function() {
    const vehicleOptions = document.querySelectorAll('.vehicle-option');
    
    vehicleOptions.forEach(option => {
        option.addEventListener('click', function() {
            vehicleOptions.forEach(opt => opt.classList.remove('selected'));
            this.classList.add('selected');
            this.querySelector('input[type="radio"]').checked = true;
        });
    });
    
    setupPhoneFormatting();
});

// Formatação de telefone
function setupPhoneFormatting() {
    const phoneInput = document.getElementById('registerPhone');
    
    if (phoneInput) {
        phoneInput.addEventListener('input', function(e) {
            let value = e.target.value.replace(/\D/g, '');
            
            if (value.length > 9) {
                value = value.slice(0, 9);
            }
            
            if (value.length > 6) {
                value = `${value.slice(0, 3)} ${value.slice(3, 6)} ${value.slice(6)}`;
            } else if (value.length > 3) {
                value = `${value.slice(0, 3)} ${value.slice(3)}`;
            }
            
            e.target.value = value;
        });
    }
}

// Mostrar notificação
function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    
    const colors = {
        success: '#48c774',
        error: '#e74c3c',
        info: '#3498db'
    };
    
    notification.style.cssText = `
        position: fixed;
        top: 100px;
        right: 20px;
        background: ${colors[type]};
        color: white;
        padding: 1rem 1.5rem;
        border-radius: 10px;
        box-shadow: 0 5px 15px rgba(0,0,0,0.3);
        z-index: 10000;
        animation: slideInRight 0.3s;
        font-weight: 600;
        max-width: 400px;
    `;
    
    notification.textContent = message;
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.animation = 'slideOutRight 0.3s';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

// Animações CSS
const style = document.createElement('style');
style.textContent = `
    @keyframes slideInRight {
        from {
            transform: translateX(400px);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    
    @keyframes slideOutRight {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(400px);
            opacity: 0;
        }
    }
`;
document.head.appendChild(style);