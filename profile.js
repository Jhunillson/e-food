// Dados do usuário atual
let currentUser = null;
let userAddresses = [];
let userPayments = [];

// ---------- Helper: atualizar objeto users salvo (se existir) ----------
function syncUsersListWithCurrentUser() {
    // Atualiza o array "users" no localStorage (se existir) para manter consistência com currentUser
    try {
        let users = JSON.parse(localStorage.getItem('users') || '[]');
        const idx = users.findIndex(u => u.id === currentUser.id);
        if (idx !== -1) {
            users[idx] = { ...users[idx], ...currentUser };
            localStorage.setItem('users', JSON.stringify(users));
            console.log('🔁 users[] sincronizado com currentUser');
        }
    } catch (err) {
        console.warn('⚠️ Erro ao sincronizar users list:', err);
    }
}

function updateProfileUI() {



    // Atualizar sidebar
    const userNameElement = document.getElementById('userName');
    const userEmailElement = document.getElementById('userEmail');
    const userNameBtn = document.getElementById('userNameBtn'); // No header

    if (userNameElement) userNameElement.textContent = currentUser.name || 'Usuário';
    if (userEmailElement) userEmailElement.textContent = currentUser.email || 'N/A';
    if (userNameBtn) userNameBtn.textContent = currentUser.name || 'Perfil';
    
    // Preencher formulário de edição (se o formulário tiver os IDs corretos)
    document.getElementById('editName').value = currentUser.name || '';
    document.getElementById('editEmail').value = currentUser.email || '';
    document.getElementById('editPhone').value = currentUser.phone || '';

    const fullName = currentUser.name || '';
    const firstName = fullName.split(' ')[0] || 'Usuário';

    if (userNameElement) userNameElement.textContent = firstName;
    if (userNameBtn) userNameBtn.textContent = firstName
}

// ---------- Carregar dados do usuário (CORRIGIDO) ----------
async function loadUserData() {
    const token = localStorage.getItem('token') || sessionStorage.getItem('token');
    
    if (!token) {
        sessionStorage.setItem('redirectAfterLogin', 'profile.html');
        window.location.href = 'auth.html';
        return;
    }
    
    try {
        // Fazer a chamada para a rota protegida que retorna o perfil
        const response = await fetch('http://192.168.0.162:3000/api/auth/profile', {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            }
        });

        const result = await response.json();

        if (result.success) {
            currentUser = result.data; // O objeto User
            
            // 1. Atualizar a interface do usuário com os dados do perfil
            updateProfileUI(); 

            // 2. CHAMA A FUNÇÃO LOCAL QUE CARREGA OS ENDEREÇOS DO LOCAL STORAGE E RENDERIZA
            loadAddresses(); // <-- CORREÇÃO PRINCIPAL
            
            console.log('✅ Perfil e Endereços carregados:', currentUser);
        } else {
            // Se falhar (ex: token inválido)
            showNotification(`Erro ao carregar perfil: ${result.message}`, 'error');
            window.location.href = 'auth.html';
        }

    } catch (error) {
        console.error('Erro de rede:', error);
        showNotification('Erro de conexão ao servidor.', 'error');
        
        // Fallback: tentar carregar o usuário e endereços do Local Storage se a API falhar
        const userJson = localStorage.getItem('currentUser') || sessionStorage.getItem('currentUser');
        if (userJson) {
            currentUser = JSON.parse(userJson);
            updateProfileUI();
            loadAddresses();
        }
    }
}

// OBSERVAÇÃO: A FUNÇÃO renderAddressSelector FOI REMOVIDA POIS loadAddresses CHAMA renderAddresses (função mais completa)

// Mostrar seção
function showSection(section) {
    document.querySelectorAll('.content-section').forEach(s => s.classList.remove('active'));
    document.querySelectorAll('.menu-item').forEach(item => item.classList.remove('active'));

    if (section === 'personal') {
        document.getElementById('personalSection').classList.add('active');
        document.querySelector('.menu-item:nth-child(1)').classList.add('active');
    } else if (section === 'addresses') {
        document.getElementById('addressesSection').classList.add('active');
        document.querySelector('.menu-item:nth-child(2)').classList.add('active');
        if (currentUser) loadAddresses(); // Recarrega endereços ao abrir a aba
    } else if (section === 'payments') {
        document.getElementById('paymentsSection').classList.add('active');
        document.querySelector('.menu-item:nth-child(3)').classList.add('active');
    } else if (section === 'security') {
        document.getElementById('securitySection').classList.add('active');
        document.querySelector('.menu-item:nth-child(4)').classList.add('active');
    }
}

// ==========================
// ➕ Adicionar novo endereço
// ==========================
function addNewAddress() {
    const label = prompt('Nome para este endereço (Ex: Casa, Trabalho):');
    if (!label) return;
    
    const province = prompt('Província:');
    const municipality = prompt('Município:');
    const street = prompt('Rua/Avenida:');
    const number = prompt('Número:');
    const neighborhood = prompt('Bairro:');
    const reference = prompt('Ponto de Referência:');
    const complement = prompt('Complemento (opcional):');
    
    if (!province || !municipality || !street || !number || !neighborhood || !reference) {
        alert('Por favor, preencha todos os campos obrigatórios!');
        return;
    }
    
    const isFirstAddress = userAddresses.length === 0;
    
    const newAddress = {
        id: Date.now(),
        label,
        province,
        municipality,
        street,
        number,
        neighborhood,
        reference,
        complement: complement || '',
        isDefault: isFirstAddress // MUDANÇA: Usar isDefault
    };
    
    // Garante que apenas o novo endereço é isDefault se for o primeiro
    if (isFirstAddress) {
        userAddresses = userAddresses.map(addr => ({ ...addr, isDefault: false }));
    }
    
    userAddresses.push(newAddress);
    localStorage.setItem(`addresses_${currentUser.id}`, JSON.stringify(userAddresses));
    console.log('➕ Novo endereço salvo em addresses_' + currentUser.id, newAddress);

    // Se for o primeiro endereço → salvar como padrão no currentUser
    if (isFirstAddress) {
        currentUser = {
            ...currentUser,
            province,
            municipality,
            street,
            number,
            complement: complement || '',
            neighborhood,
            reference
        };

        // Salvar currentUser tanto no localStorage quanto sessionStorage se existirem
        if (localStorage.getItem('currentUser')) localStorage.setItem('currentUser', JSON.stringify(currentUser));
        if (sessionStorage.getItem('currentUser')) sessionStorage.setItem('currentUser', JSON.stringify(currentUser));

        // Sincronizar users[]
        syncUsersListWithCurrentUser();

        console.log('🎯 Primeiro endereço definido como padrão e salvo no currentUser');
    }

    renderAddresses();
    showNotification('✅ Endereço adicionado com sucesso!', 'success');
}

// ==========================
// 🎯 Definir endereço padrão
// ==========================
function setDefaultAddress(index) {
    if (!userAddresses[index]) {
        console.warn('Endereço não encontrado para setDefaultAddress:', index);
        return;
    }

    // Desmarcar todos e marcar escolhido
    userAddresses = userAddresses.map((addr, i) => ({ ...addr, isDefault: i === index })); // MUDANÇA: Usar isDefault

    // Salvar lista atualizada
    localStorage.setItem(`addresses_${currentUser.id}`, JSON.stringify(userAddresses));
    console.log('🔁 addresses salvo com novo padrão');

    // Atualizar currentUser com o endereço padrão
    const defaultAddress = userAddresses[index];
    currentUser = {
        ...currentUser,
        province: defaultAddress.province,
        municipality: defaultAddress.municipality,
        street: defaultAddress.street,
        number: defaultAddress.number,
        complement: defaultAddress.complement || '',
        neighborhood: defaultAddress.neighborhood,
        reference: defaultAddress.reference
    };

    // Salvar currentUser em ambos storages, se existirem
    if (localStorage.getItem('currentUser')) {
        localStorage.setItem('currentUser', JSON.stringify(currentUser));
        console.log('💾 currentUser salvo no localStorage');
    }
    if (sessionStorage.getItem('currentUser')) {
        sessionStorage.setItem('currentUser', JSON.stringify(currentUser));
        console.log('💾 currentUser salvo no sessionStorage');
    }

    // Sincronizar entries em users[]
    syncUsersListWithCurrentUser();

    renderAddresses();
    showNotification('✅ Endereço padrão atualizado!', 'success');

    console.log('🔄 Endereço padrão definido com sucesso!');
}

// Carregar endereços
function loadAddresses() {
    if (!currentUser || !currentUser.id) return; // Proteção

    const savedAddresses = localStorage.getItem(`addresses_${currentUser.id}`);
    userAddresses = savedAddresses ? JSON.parse(savedAddresses) : [];
    
    // CORRIGIR INCONSISTÊNCIA DE DADOS: O checkout espera 'isDefault'
    userAddresses = userAddresses.map(addr => ({ 
        ...addr, 
        isDefault: addr.default || addr.isDefault || false 
    }));

    renderAddresses();
}

// Renderizar endereços
function renderAddresses() {
    const grid = document.getElementById('addressesGrid');
    
    if (!grid) return;
    
    if (userAddresses.length === 0) {
        grid.innerHTML = `
            <div class="empty-state">
                <p>Nenhum endereço cadastrado ainda</p>
                <button class="btn-secondary" onclick="addNewAddress()">Adicionar primeiro endereço</button>
            </div>
        `;
        return;
    }
    
    grid.innerHTML = '';
    
    userAddresses.forEach((address, index) => {
        // MUDANÇA: Usar address.isDefault para renderizar o badge (em vez de address.default)
        const isDefault = address.isDefault || false; 

        const card = document.createElement('div');
        card.className = `address-card ${isDefault ? 'default' : ''}`;
        
        card.innerHTML = `
            ${isDefault ? '<span class="default-badge">Padrão</span>' : ''}
            <div class="address-title">${address.label || 'Endereço ' + (index + 1)}</div>
            <div class="address-info">
                <p>${address.street}, ${address.number}</p>
                ${address.complement ? `<p>${address.complement}</p>` : ''}
                <p>${address.neighborhood}</p>
                <p>${address.municipality} - ${address.province}</p>
                <p><strong>Ref:</strong> ${address.reference}</p>
            </div>
            <div class="card-actions">
                ${!isDefault ? `<button class="btn-small btn-set-default" onclick="setDefaultAddress(${index})">Tornar Padrão</button>` : ''}
                <button class="btn-small btn-edit" onclick="editAddress(${index})">Editar</button>
                <button class="btn-small btn-delete" onclick="deleteAddress(${index})">Excluir</button>
            </div>
        `;
        
        grid.appendChild(card);
    });
}

// Editar endereço
function editAddress(index) {
    const address = userAddresses[index];
    if (!address) return;

    const label = prompt('Nome:', address.label) || address.label;
    const province = prompt('Província:', address.province) || address.province;
    const municipality = prompt('Município:', address.municipality) || address.municipality;
    const street = prompt('Rua:', address.street) || address.street;
    const number = prompt('Número:', address.number) || address.number;
    const neighborhood = prompt('Bairro:', address.neighborhood) || address.neighborhood;
    const reference = prompt('Referência:', address.reference) || address.reference;
    const complement = prompt('Complemento:', address.complement) || address.complement;
    
    userAddresses[index] = { ...address, label, province, municipality, street, number, neighborhood, reference, complement };
    
    localStorage.setItem(`addresses_${currentUser.id}`, JSON.stringify(userAddresses));

    // Se estava marcado como padrão, também atualiza currentUser
    // MUDANÇA: Usar isDefault
    if (userAddresses[index].isDefault || userAddresses[index].default) { 
        currentUser = {
            ...currentUser,
            province,
            municipality,
            street,
            number,
            complement: complement || '',
            neighborhood,
            reference
        };
        if (localStorage.getItem('currentUser')) localStorage.setItem('currentUser', JSON.stringify(currentUser));
        if (sessionStorage.getItem('currentUser')) sessionStorage.setItem('currentUser', JSON.stringify(currentUser));
        syncUsersListWithCurrentUser();
    }

    renderAddresses();
    showNotification('✅ Endereço atualizado!', 'success');
}

// Excluir endereço
function deleteAddress(index) {
    if (!confirm('Tem certeza que deseja excluir este endereço?')) return;
    
    const removed = userAddresses.splice(index, 1)[0];
    
    // Se excluiu o padrão e ainda há endereços, tornar o primeiro padrão
    // MUDANÇA: Usar isDefault
    if (userAddresses.length > 0 && !userAddresses.some(a => a.isDefault || a.default)) { 
        userAddresses[0].isDefault = true; // Define o primeiro como isDefault
        
        // Atualizar currentUser para o novo padrão
        const d = userAddresses[0];
        currentUser = {
            ...currentUser,
            province: d.province,
            municipality: d.municipality,
            street: d.street,
            number: d.number,
            complement: d.complement || '',
            neighborhood: d.neighborhood,
            reference: d.reference
        };

        if (localStorage.getItem('currentUser')) localStorage.setItem('currentUser', JSON.stringify(currentUser));
        if (sessionStorage.getItem('currentUser')) sessionStorage.setItem('currentUser', JSON.stringify(currentUser));
        syncUsersListWithCurrentUser();
    } else {
        // Se não há endereços restantes, remover campos do currentUser
        if (userAddresses.length === 0) {
            delete currentUser.province;
            delete currentUser.municipality;
            delete currentUser.street;
            delete currentUser.number;
            delete currentUser.complement;
            delete currentUser.neighborhood;
            delete currentUser.reference;
            if (localStorage.getItem('currentUser')) localStorage.setItem('currentUser', JSON.stringify(currentUser));
            if (sessionStorage.getItem('currentUser')) sessionStorage.setItem('currentUser', JSON.stringify(currentUser));
            syncUsersListWithCurrentUser();
        }
    }
    
    localStorage.setItem(`addresses_${currentUser.id}`, JSON.stringify(userAddresses));
    renderAddresses();
    showNotification('✅ Endereço excluído!', 'success');

    console.log('🗑️ Endereço removido:', removed);
}

// Métodos de pagamento (sem alterações)
function loadPayments() {
    const savedPayments = localStorage.getItem(`payments_${currentUser.id}`);
    userPayments = savedPayments ? JSON.parse(savedPayments) : [];
    renderPayments();
}

function renderPayments() {
    const grid = document.getElementById('paymentsGrid');
    
    if (userPayments.length === 0) {
        grid.innerHTML = `
            <div class="empty-state">
                <p>Nenhum cartão cadastrado ainda</p>
                <button class="btn-secondary" onclick="addNewPayment()">Adicionar primeiro cartão</button>
            </div>
        `;
        return;
    }
    
    grid.innerHTML = '';
    
    userPayments.forEach((payment, index) => {
        const card = document.createElement('div');
        card.className = `payment-card ${payment.default ? 'default' : ''}`;
        
        card.innerHTML = `
            ${payment.default ? '<span class="default-badge">Padrão</span>' : ''}
            <div class="payment-title">💳 ${payment.label}</div>
            <div class="payment-info">
                <p><strong>Cartão:</strong> **** **** **** ${payment.lastDigits}</p>
                <p><strong>Validade:</strong> ${payment.expiry}</p>
                <p><strong>Titular:</strong> ${payment.holder}</p>
            </div>
            <div class="card-actions">
                ${!payment.default ? `<button class="btn-small btn-set-default" onclick="setDefaultPayment(${index})">Tornar Padrão</button>` : ''}
                <button class="btn-small btn-delete" onclick="deletePayment(${index})">Excluir</button>
            </div>
        `;
        
        grid.appendChild(card);
    });
}

function addNewPayment() {
    const label = prompt('Nome para este cartão (Ex: Cartão Principal, Cartão Trabalho):');
    if (!label) return;
    
    const cardNumber = prompt('Número do Cartão (últimos 4 dígitos):');
    const expiry = prompt('Validade (MM/AA):');
    const holder = prompt('Nome no Cartão:');
    
    if (!cardNumber || !expiry || !holder) {
        alert('Por favor, preencha todos os campos!');
        return;
    }
    
    const newPayment = {
        id: Date.now(),
        label,
        lastDigits: cardNumber.slice(-4),
        expiry,
        holder,
        default: userPayments.length === 0
    };
    
    userPayments.push(newPayment);
    localStorage.setItem(`payments_${currentUser.id}`, JSON.stringify(userPayments));
    
    renderPayments();
    showNotification('✅ Cartão adicionado com sucesso!', 'success');
}

function setDefaultPayment(index) {
    userPayments.forEach(pay => pay.default = false);
    userPayments[index].default = true;
    
    localStorage.setItem(`payments_${currentUser.id}`, JSON.stringify(userPayments));
    renderPayments();
    showNotification('✅ Cartão padrão atualizado!', 'success');
}

function deletePayment(index) {
    if (!confirm('Tem certeza que deseja excluir este cartão?')) return;
    
    userPayments.splice(index, 1);
    
    if (userPayments.length > 0 && !userPayments.some(p => p.default)) {
        userPayments[0].default = true;
    }
    
    localStorage.setItem(`payments_${currentUser.id}`, JSON.stringify(userPayments));
    renderPayments();
    showNotification('✅ Cartão excluído!', 'success');
}

function changePassword(event) {
    event.preventDefault();
    
    const currentPassword = document.getElementById('currentPassword').value;
    const newPassword = document.getElementById('newPassword').value;
    const confirmNewPassword = document.getElementById('confirmNewPassword').value;
    
    let users = JSON.parse(localStorage.getItem('users') || '[]');
    const user = users.find(u => u.id === currentUser.id);
    
    if (!user || user.password !== currentPassword) {
        showNotification('❌ Senha atual incorreta!', 'error');
        return;
    }
    
    if (newPassword !== confirmNewPassword) {
        showNotification('❌ As senhas não coincidem!', 'error');
        return;
    }
    
    if (newPassword.length < 6) {
        showNotification('❌ A senha deve ter no mínimo 6 caracteres!', 'error');
        return;
    }
    
    const userIndex = users.findIndex(u => u.id === currentUser.id);
    users[userIndex].password = newPassword;
    localStorage.setItem('users', JSON.stringify(users));
    
    document.getElementById('passwordForm').reset();
    
    showNotification('✅ Senha alterada com sucesso!', 'success');
}

function deleteAccount() {
    const confirmation = prompt('Digite "EXCLUIR" para confirmar a exclusão da sua conta:');
    
    if (confirmation !== 'EXCLUIR') {
        return;
    }
    
    let users = JSON.parse(localStorage.getItem('users') || '[]');
    users = users.filter(u => u.id !== currentUser.id);
    localStorage.setItem('users', JSON.stringify(users));
    
    localStorage.removeItem(`addresses_${currentUser.id}`);
    localStorage.removeItem(`payments_${currentUser.id}`);
    
    logout();
}

function logout() {
    if (!confirm('Tem certeza que deseja sair?')) return;
    
    sessionStorage.removeItem('currentUser');
    localStorage.removeItem('currentUser');
    
    window.location.href = 'index.html';
}

// Notificações
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

function setupPhoneFormatting() {
    const phoneInput = document.getElementById('editPhone');
    
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

// CSS Animations
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
    console.log('Página de perfil carregada! 👤');
    loadUserData();
    setupPhoneFormatting();
});