// Alternar entre Login e Cadastro
function switchTabRestaurant(tab) {
    const loginForm = document.getElementById('loginFormRestaurant');
    const registerForm = document.getElementById('registerFormRestaurant');
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

// ========================================
// FUNÇÕES DE PREVIEW DE IMAGEM
// ========================================

// Converter imagem para Base64
function convertImageToBase64(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}

// Preview da imagem no registro (CORRIGIDO - estava faltando esta função global)
function previewRegisterImage(event) {
    const file = event.target.files[0];
    const preview = document.getElementById('registerImagePreview');
    
    if (!file) {
        preview.innerHTML = '';
        return;
    }
    
    // Validar tamanho do arquivo (5MB)
    if (file.size > 5 * 1024 * 1024) {
        alert('❌ A imagem deve ter no máximo 5MB!');
        event.target.value = '';
        preview.innerHTML = '';
        return;
    }
    
    // Validar tipo de arquivo
    if (!file.type.startsWith('image/')) {
        alert('❌ Por favor, selecione apenas arquivos de imagem!');
        event.target.value = '';
        preview.innerHTML = '';
        return;
    }
    
    const reader = new FileReader();
    reader.onload = function(e) {
        preview.innerHTML = `
            <div style="position: relative; display: inline-block;">
                <img src="${e.target.result}" style="max-width: 200px; max-height: 200px; border-radius: 8px; object-fit: cover; border: 2px solid #ddd;">
                <button type="button" onclick="clearRegisterImage()" style="position: absolute; top: 5px; right: 5px; background: #e74c3c; color: white; border: none; border-radius: 50%; width: 30px; height: 30px; cursor: pointer; font-size: 18px; line-height: 1;">×</button>
            </div>
        `;
    };
    reader.onerror = function() {
        alert('❌ Erro ao carregar a imagem!');
        preview.innerHTML = '';
    };
    reader.readAsDataURL(file);
}

// Limpar preview do registro
function clearRegisterImage() {
    document.getElementById('registerRestImage').value = '';
    document.getElementById('registerImagePreview').innerHTML = '';
}

// ========================================
// AUTENTICAÇÃO
// ========================================

// Processar Login do Restaurante
async function handleRestaurantLogin(event) {
    event.preventDefault();
    
    const email = document.getElementById('loginEmailRest').value.trim();
    const password = document.getElementById('loginPasswordRest').value;
    const rememberMe = document.getElementById('rememberMeRest').checked;
    
    if (!email || !password) {
        alert('❌ Por favor, preencha todos os campos!');
        return;
    }
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        alert('❌ Por favor, insira um e-mail válido!');
        return;
    }
    
    try {
        const response = await AuthAPI.loginRestaurant({ email, password });
        
        if (!response.success && response.message && response.message.includes('pendente')) {
            alert('⏳ Seu restaurante está em análise.\n\nVocê só poderá acessar o painel após aprovação do administrador.');
            return;
        }
        
        if (response.success) {
        

            // ⛔ BLOQUEAR RESTAURANTE NÃO ATIVADO
            if (response.data.isActive === false || response.data.isActive === 0) {
                alert('⏳ Seu restaurante foi cadastrado e está em análise.\n\nAssim que o administrador aprovar, você poderá entrar no painel.');
                return;
            }

            const restaurantData = {
                ...response.data,
                loggedIn: true,
                loginDate: new Date().toISOString()
            };
            
            if (rememberMe) {
                localStorage.setItem('currentRestaurant', JSON.stringify(restaurantData));
                localStorage.setItem('restaurantToken', response.data.token);
            } else {
                sessionStorage.setItem('currentRestaurant', JSON.stringify(restaurantData));
                sessionStorage.setItem('restaurantToken', response.data.token);
            }
            
            showNotification('✅ Login realizado com sucesso!', 'success');
            
            setTimeout(() => {
                window.location.href = 'restaurant-dashboard.html';
            }, 500);
        } else {
            alert('❌ ' + (response.message || 'Erro ao fazer login'));
        }
    } catch (error) {
        console.error('Erro ao fazer login:', error);
        alert('❌ Erro ao conectar com o servidor. Verifique sua conexão e tente novamente.');
    }
}


// Processar Cadastro do Restaurante

async function handleRestaurantRegister(event) {
    event.preventDefault();
    
    const name = document.getElementById('registerRestName').value.trim();
    const icon = document.getElementById('registerRestIcon').value.trim() || '🍽️';
    const category = document.getElementById('registerRestCategory').value;
    const cuisine = document.getElementById('registerRestCuisine').value.trim();
    const email = document.getElementById('registerRestEmail').value.trim();
    const phone = document.getElementById('registerRestPhone').value.replace(/\D/g, '');
    const address = document.getElementById('registerRestAddress').value.trim();
    const password = document.getElementById('registerRestPassword').value;
    const confirmPassword = document.getElementById('registerRestConfirmPassword').value;
    const agreeTerms = document.getElementById('agreeTermsRest').checked;
    const imageFile = document.getElementById('registerRestImage').files[0];
    
    // Validações (mantém como já tinhas)
    if (!name || !category || !cuisine || !email || !phone || !address || !password || !confirmPassword) {
        alert('❌ Por favor, preencha todos os campos obrigatórios!');
        return;
    }
    if (!imageFile) {
        alert('❌ Por favor, selecione uma imagem para o restaurante!');
        return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        alert('❌ Por favor, insira um e-mail válido!');
        return;
    }
    if (phone.length !== 9) {
        alert('❌ O telefone deve ter 9 dígitos!');
        return;
    }
    if (password !== confirmPassword) {
        alert('❌ As senhas não coincidem!');
        return;
    }
    if (password.length < 6) {
        alert('❌ A senha deve ter no mínimo 6 caracteres!');
        return;
    }
    if (!agreeTerms) {
        alert('❌ Você precisa aceitar os termos de uso!');
        return;
    }
    if (imageFile.size > 5 * 1024 * 1024) {
        alert('❌ A imagem deve ter no máximo 5MB!');
        return;
    }
    
    try {
        const image_url = await convertImageToBase64(imageFile);
        
        const response = await AuthAPI.registerRestaurant({
            name,
            icon,
            image_url,
            category,
            cuisine,
            email,
            phone,
            address,
            password,
            isActive: false   // 👈 NOVO: sempre começa inativo
        });
        
        if (response.success) {
            alert('✅ Restaurante cadastrado com sucesso!\n\nUm administrador irá analisar e aprovar o seu cadastro.');
            
            // 👉 NÃO faz login automático, volta para aba de login
            switchTabRestaurant('login');
        } else {
            alert('❌ ' + (response.message || 'Erro ao cadastrar restaurante'));
        }
    } catch (error) {
        console.error('Erro ao cadastrar:', error);
        alert('❌ Erro ao cadastrar. Tente novamente mais tarde.');
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
    `;
    
    notification.textContent = message;
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.animation = 'slideOutRight 0.3s';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

// Formatação de telefone angolano
function setupPhoneFormatting() {
    const phoneInput = document.getElementById('registerRestPhone');
    
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

// Verificar se já está logado
function checkIfLoggedIn() {
    const currentRestaurant = sessionStorage.getItem('currentRestaurant') || localStorage.getItem('currentRestaurant');
    
    if (currentRestaurant) {
        const redirectUrl = sessionStorage.getItem('redirectAfterLogin') || 'restaurant-dashboard.html';
        sessionStorage.removeItem('redirectAfterLogin');
        window.location.href = redirectUrl;
    }
}

// Adicionar animações CSS
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

// Inicialização
document.addEventListener('DOMContentLoaded', function() {
    console.log('Página de login do restaurante carregada! 🍽️');
    
    checkIfLoggedIn();
    setupPhoneFormatting();
});