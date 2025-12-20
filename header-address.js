// Carregar e mostrar endereço do usuário no header
async function loadUserAddressInHeader() {
    console.log('🔍 Iniciando loadUserAddressInHeader...');
    
    const headerAddress = document.getElementById('headerAddress');
    const headerAddressContent = document.getElementById('headerAddressContent');
    
    if (!headerAddress || !headerAddressContent) {
        console.error('❌ Elementos do header não encontrados!');
        return;
    }
    
    const token = sessionStorage.getItem('token') || localStorage.getItem('token');
    const currentUserData = sessionStorage.getItem('currentUser') || localStorage.getItem('currentUser');
    
    console.log('🔍 Token:', token ? 'Existe' : 'Não existe');
    console.log('🔍 CurrentUser:', currentUserData ? 'Existe' : 'Não existe');
    
    if (!token || !currentUserData) {
        console.log('⚠️ Usuário não logado');
        headerAddress.style.display = 'none';
        return;
    }
    
    const currentUser = JSON.parse(currentUserData);
    console.log('👤 Usuário logado:', currentUser.name);
    console.log('📍 Endereço no currentUser:', currentUser);
    
    // Buscar endereços salvos
    const savedAddresses = localStorage.getItem(`addresses_${currentUser.id}`);
    console.log('🗂️ Endereços salvos:', savedAddresses);
    
    if (savedAddresses) {
        const addresses = JSON.parse(savedAddresses);
        console.log('📋 Lista de endereços:', addresses);
        
        const defaultAddress = addresses.find(a => a.default);
        console.log('⭐ Endereço padrão:', defaultAddress);
        
        if (defaultAddress) {
            displayAddress(defaultAddress);
            return;
        }
    }
    
    // Se não tem endereços salvos, tentar do currentUser
    if (currentUser.street && currentUser.neighborhood) {
        console.log('✅ Usando endereço do currentUser');
        displayAddress(currentUser);
        return;
    }
    
    // Tentar buscar da API
    try {
        console.log('📡 Tentando buscar da API...');
        const response = await AuthAPI.getProfile(token);
        
        if (response.success && response.data) {
            const addr = response.data;
            console.log('✅ Dados da API:', addr);
            
            if (addr.street && addr.neighborhood) {
                displayAddress(addr);
                return;
            }
        }
    } catch (error) {
        console.error('❌ Erro ao buscar da API:', error);
    }
    
    // Se chegou aqui, não tem endereço
    showAddAddressPrompt();
    
    function displayAddress(addr) {
        const shortAddr = `${addr.street}, ${addr.number} - ${addr.neighborhood}`;
        headerAddressContent.textContent = shortAddr;
        headerAddressContent.title = `${addr.street}, ${addr.number} - ${addr.neighborhood}, ${addr.municipality}, ${addr.province}`;
        headerAddress.style.display = 'flex';
        headerAddress.style.background = 'rgba(255, 255, 255, 0.1)';
        headerAddress.onclick = () => {
            window.location.href = 'profile.html';
        };
        console.log('✅ Endereço exibido:', shortAddr);
    }
    
    function showAddAddressPrompt() {
        headerAddressContent.textContent = 'Adicionar endereço';
        headerAddress.style.display = 'flex';
        headerAddress.style.background = 'rgba(255, 107, 53, 0.3)';
        headerAddress.onclick = () => {
            alert('Por favor, adicione um endereço no seu perfil!');
            window.location.href = 'profile.html';
        };
        console.log('⚠️ Mostrando prompt para adicionar endereço');
    }
}

// Executar quando a página carregar
console.log('📄 header-address.js carregado!');

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', loadUserAddressInHeader);
} else {
    loadUserAddressInHeader();
}