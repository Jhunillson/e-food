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
        alert('✅ ' + message);
    } else if (type === 'error') {
        alert('❌ ' + message);
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

// 🆕 VARIÁVEIS GPS
let gpsLatitude = null;
let gpsLongitude = null;

// 🆕 FUNÇÃO PARA OBTER GPS
async function getGPSLocation() {
    const gpsButton = document.getElementById('getGPSButton');
    const gpsStatus = document.getElementById('gpsStatus');
    const gpsCoords = document.getElementById('gpsCoords');
    
    // Verificar se o navegador suporta geolocalização
    if (!navigator.geolocation) {
        showNotification('Seu navegador não suporta geolocalização', 'error');
        return;
    }
    
    // Mostrar loading
    gpsButton.disabled = true;
    gpsButton.innerHTML = '<span class="spinner"></span> Obtendo GPS...';
    gpsStatus.style.display = 'block';
    gpsStatus.className = 'gps-status loading';
    gpsStatus.textContent = '📍 Aguardando permissão de localização...';
    
    // Obter localização
    navigator.geolocation.getCurrentPosition(
        // Sucesso
        (position) => {
            gpsLatitude = position.coords.latitude;
            gpsLongitude = position.coords.longitude;
            
            console.log(`✅ GPS obtido: ${gpsLatitude}, ${gpsLongitude}`);
            
            // Atualizar UI
            gpsButton.disabled = false;
            gpsButton.innerHTML = '🔄 Atualizar Localização';
            gpsButton.style.backgroundColor = '#4CAF50';
            
            gpsStatus.className = 'gps-status success';
            gpsStatus.textContent = '✅ Localização GPS confirmada';
            
            gpsCoords.style.display = 'block';
            gpsCoords.innerHTML = `
                <strong>Coordenadas:</strong><br>
                Latitude: ${gpsLatitude.toFixed(6)}<br>
                Longitude: ${gpsLongitude.toFixed(6)}
            `;
            
            showNotification('GPS obtido com sucesso!', 'success');
        },
        // Erro
        (error) => {
            console.error('❌ Erro ao obter GPS:', error);
            
            gpsButton.disabled = false;
            gpsButton.innerHTML = '📍 Obter Minha Localização';
            
            let errorMessage = 'Erro ao obter localização';
            
            switch(error.code) {
                case error.PERMISSION_DENIED:
                    errorMessage = 'Permissão de localização negada. Por favor, permita o acesso à localização nas configurações do navegador.';
                    break;
                case error.POSITION_UNAVAILABLE:
                    errorMessage = 'Localização indisponível. Verifique se o GPS está ativado.';
                    break;
                case error.TIMEOUT:
                    errorMessage = 'Tempo esgotado ao obter localização. Tente novamente.';
                    break;
            }
            
            gpsStatus.className = 'gps-status error';
            gpsStatus.textContent = '❌ ' + errorMessage;
            gpsStatus.style.display = 'block';
            
            showNotification(errorMessage, 'error');
        },
        // Opções
        {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 0
        }
    );
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
            
            showNotification('Login realizado com sucesso!', 'success');
            
            setTimeout(() => {
                const redirectUrl = sessionStorage.getItem('redirectAfterLogin') || 'index.html';
                sessionStorage.removeItem('redirectAfterLogin');
                window.location.href = redirectUrl;
            }, 1000);
        } else {
            showNotification(response.message, 'error');
        }
    } catch (error) {
        console.error('Erro ao fazer login:', error);
        showNotification('Erro ao conectar com o servidor', 'error');
    }
}

// Processar Cadastro COM GPS
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
        showNotification('Por favor, preencha todos os campos!', 'error');
        return;
    }
    
    if (!province || !municipality || !street || !number || !neighborhood || !reference) {
        showNotification('Por favor, preencha todos os campos de endereço!', 'error');
        return;
    }
    
    // 🆕 VALIDAR GPS OBRIGATÓRIO
    if (!gpsLatitude || !gpsLongitude) {
        showNotification('Por favor, obtenha sua localização GPS antes de cadastrar!', 'error');
        // Scroll para o botão GPS
        document.getElementById('getGPSButton').scrollIntoView({ behavior: 'smooth', block: 'center' });
        return;
    }
    
    if (password !== confirmPassword) {
        showNotification('As senhas não coincidem!', 'error');
        return;
    }
    
    if (password.length < 6) {
        showNotification('A senha deve ter no mínimo 6 caracteres!', 'error');
        return;
    }
    
    if (!agreeTerms) {
        showNotification('Você precisa aceitar os termos de uso!', 'error');
        return;
    }
    
    try {
        console.log('📤 Enviando cadastro com GPS:', gpsLatitude, gpsLongitude);
        
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
            reference,
            latitude: gpsLatitude,   // 🆕 ENVIAR GPS
            longitude: gpsLongitude  // 🆕 ENVIAR GPS
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
            
            showNotification('Conta criada com sucesso!', 'success');
            
            setTimeout(() => {
                const redirectUrl = sessionStorage.getItem('redirectAfterLogin') || 'index.html';
                sessionStorage.removeItem('redirectAfterLogin');
                window.location.href = redirectUrl;
            }, 1000);
        } else {
            showNotification(response.message, 'error');
        }
    } catch (error) {
        console.error('Erro ao cadastrar:', error);
        showNotification('Erro ao conectar com o servidor', 'error');
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
    
    /* 🆕 Estilos GPS */
    .gps-container {
        margin: 15px 0;
        padding: 15px;
        border: 2px solid #ddd;
        border-radius: 8px;
        background-color: #f9f9f9;
    }
    
    .gps-container.has-gps {
        border-color: #4CAF50;
        background-color: #E8F5E9;
    }
    
    #getGPSButton {
        width: 100%;
        padding: 12px;
        background-color: #FF6B35;
        color: white;
        border: none;
        border-radius: 6px;
        font-size: 16px;
        font-weight: bold;
        cursor: pointer;
        transition: all 0.3s;
    }
    
    #getGPSButton:hover {
        background-color: #E55A2B;
        transform: translateY(-2px);
    }
    
    #getGPSButton:disabled {
        background-color: #ccc;
        cursor: not-allowed;
        transform: none;
    }
    
    .gps-status {
        margin-top: 10px;
        padding: 10px;
        border-radius: 6px;
        font-size: 14px;
        display: none;
    }
    
    .gps-status.success {
        background-color: #4CAF50;
        color: white;
    }
    
    .gps-status.error {
        background-color: #f44336;
        color: white;
    }
    
    .gps-status.loading {
        background-color: #2196F3;
        color: white;
    }
    
    .gps-coords {
        margin-top: 10px;
        padding: 10px;
        background-color: white;
        border-radius: 6px;
        font-size: 12px;
        font-family: monospace;
        display: none;
    }
    
    .spinner {
        display: inline-block;
        width: 16px;
        height: 16px;
        border: 2px solid #ffffff;
        border-top-color: transparent;
        border-radius: 50%;
        animation: spin 1s linear infinite;
    }
    
    @keyframes spin {
        to { transform: rotate(360deg); }
    }
`;
document.head.appendChild(style);

// Inicialização
document.addEventListener('DOMContentLoaded', function() {
    console.log('Página de autenticação carregada! 🔐');
    
    checkIfLoggedIn();
    
    // 🆕 Adicionar listener ao botão GPS se existir
    const gpsButton = document.getElementById('getGPSButton');
    if (gpsButton) {
        gpsButton.addEventListener('click', getGPSLocation);
        console.log('✅ Botão GPS configurado');
    }
});