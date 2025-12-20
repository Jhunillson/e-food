// ========================================
// VARIÁVEIS GLOBAIS
// ========================================
let currentDelivery = null;
let isOnline = false;
let availableOrders = [];
let activeOrder = null;
let map = null;
let deliveryMarker = null;
let restaurantMarker = null;
let clientMarker = null;
let routeLine = null;
let lastOrderCount = 0;
let sound = null;
let soundUnlocked = false;

// ========================================
// CONSTANTES
// ========================================
const VEHICLE_NAMES = {
    motorcycle: '🏍️ Moto',
    bicycle: '🚴 Bicicleta',
    car: '🚗 Carro'
};

const STATUS_MAP = {
    accepted: { 
        text: 'Aceito - Vá ao restaurante', 
        next: 'picked_up', 
        btnText: '✅ Pedido Coletado' 
    },
    picked_up: { 
        text: 'Coletado - Indo ao cliente', 
        next: 'on_way', 
        btnText: '🚚 A Caminho' 
    },
    on_way: { 
        text: 'A caminho do cliente', 
        next: 'delivered', 
        btnText: '✅ Pedido Entregue' 
    }
};

const STATUS_MESSAGES = {
    picked_up: '✅ Pedido coletado! Dirija-se ao cliente.',
    on_way: '🚚 A caminho do cliente!',
    delivered: '🎉 Entrega concluída! +10 pontos.'
};

const NOTIFICATION_COLORS = {
    success: '#48c774',
    error: '#e74c3c',
    info: '#3498db'
};

const DEFAULT_LOCATION = [-8.8383, 13.2344]; // Luanda
const CHECK_INTERVAL = 5000; // 5 segundos

// ========================================
// INICIALIZAÇÃO
// ========================================
document.addEventListener('DOMContentLoaded', function() {
    console.log('🛵 Dashboard do entregador carregado!');
    initSound();
    setupGlobalEventListeners();
    loadDeliveryData();
    initStyles();
});

// ========================================
// SISTEMA DE SOM
// ========================================
function initSound() {
    sound = document.getElementById('newOrderSound');
    
    if (!sound) {
        console.warn('⚠️ Elemento de áudio não encontrado');
        return;
    }
    
    // Configurar evento de unlock manual
    const unlockBtn = document.getElementById('unlockSoundBtn');
    if (unlockBtn) {
        unlockBtn.onclick = unlockSoundManually;
    }
}

function unlockSoundManually() {
    if (!sound) return;
    
    sound.play().then(() => {
        sound.pause();
        sound.currentTime = 0;
        soundUnlocked = true;
        
        const overlay = document.getElementById('soundUnlockOverlay');
        if (overlay) overlay.remove();
        
        console.log('🔊 Som desbloqueado!');
        showNotification('🔊 Alertas sonoros ativados!', 'success');
    }).catch(error => {
        console.error('Erro ao desbloquear som:', error);
    });
}

function playDeliverySound() {
    if (!sound || !soundUnlocked) {
        console.log('🔇 Som não desbloqueado ainda');
        return;
    }

    sound.pause();
    sound.currentTime = 0;
    sound.volume = 1.0;

    sound.play().catch(error => {
        console.warn('🔇 Erro ao tocar som:', error);
    });
}

function stopDeliverySound() {
    if (!sound) return;
    
    sound.pause();
    sound.currentTime = 0;
}

// ========================================
// AUTENTICAÇÃO E DADOS DO USUÁRIO
// ========================================
async function loadDeliveryData() {
    const deliveryData = getStorageItem('deliveryUser');
    const token = getStorageItem('deliveryToken');
    
    if (!deliveryData || !token) {
        alert('Sessão expirada. Faça login novamente.');
        window.location.href = 'delivery-auth.html';
        return;
    }
    
    currentDelivery = JSON.parse(deliveryData);
    console.log('🛵 Entregador logado:', currentDelivery.name);
    
    updateDeliveryInfo();
    await loadStats();
    await loadAvailableOrders();
    await loadActiveOrders();
    
    startAutoRefresh();
}

function updateDeliveryInfo() {
    document.getElementById('deliveryName').textContent = currentDelivery.name;
    document.getElementById('deliveryVehicle').textContent = 
        VEHICLE_NAMES[currentDelivery.vehicle] || currentDelivery.vehicle;
}

function getStorageItem(key) {
    return sessionStorage.getItem(key) || localStorage.getItem(key);
}

function getToken() {
    return getStorageItem('deliveryToken');
}

// ========================================
// ESTATÍSTICAS
// ========================================
async function loadStats() {
    try {
        const response = await DeliveryAPI.getStats(getToken());
        
        if (response.success) {
            document.getElementById('deliveryScore').textContent = response.data.score;
            document.getElementById('totalDeliveries').textContent = response.data.totalDeliveries;
            document.getElementById('todayDeliveries').textContent = response.data.completedToday || 0;
            
            isOnline = response.data.isOnline;
            updateOnlineUI();
        }
    } catch (error) {
        console.error('❌ Erro ao carregar estatísticas:', error);
    }
}

// ========================================
// STATUS ONLINE/OFFLINE
// ========================================
async function toggleOnlineStatus() {
    isOnline = !isOnline;
    
    try {
        const currentLocation = await getCurrentLocation();
        
        const response = await DeliveryAPI.updateOnlineStatus({
            isOnline,
            currentLocation
        }, getToken());
        
        if (response.success) {
            updateOnlineUI();
            
            if (isOnline) {
                showNotification('✅ Você está online! Pronto para receber pedidos.', 'success');
                
                // Carregar pedidos e definir contador inicial
                const ordersResponse = await DeliveryAPI.getAvailableOrders(getToken());
                if (ordersResponse.success) {
                    lastOrderCount = ordersResponse.data.length;
                    availableOrders = ordersResponse.data;
                    renderAvailableOrders();
                    updateNotificationBadge();
                    console.log(`✅ Contador inicial definido: ${lastOrderCount} pedidos`);
                }
            } else {
                showNotification('⚠️ Você está offline. Não receberá novos pedidos.', 'info');
                // NÃO resetar o contador aqui!
            }
        }
    } catch (error) {
        console.error('❌ Erro ao atualizar status:', error);
        isOnline = !isOnline;
        updateOnlineUI();
    }
}

function updateOnlineUI() {
    const toggleSwitch = document.getElementById('toggleSwitch');
    const statusText = document.getElementById('statusText');
    
    if (isOnline) {
        toggleSwitch.classList.add('active');
        statusText.textContent = 'Online';
    } else {
        toggleSwitch.classList.remove('active');
        statusText.textContent = 'Offline';
    }
}

async function getCurrentLocation() {
    if (!navigator.geolocation) {
        return null;
    }
    
    return new Promise((resolve) => {
        navigator.geolocation.getCurrentPosition(
            (position) => {
                resolve({
                    lat: position.coords.latitude,
                    lng: position.coords.longitude
                });
            },
            () => {
                resolve({ lat: DEFAULT_LOCATION[0], lng: DEFAULT_LOCATION[1] });
            }
        );
    });
}

// ========================================
// VERIFICAÇÃO DE NOVOS PEDIDOS (COM SOM)
// ========================================
async function checkNewDeliveryOrders() {
    if (!isOnline) return;

    try {
        const response = await DeliveryAPI.getAvailableOrders(getToken());

        if (response.success) {
            const currentCount = response.data.length;
            
            console.log(`📊 Pedidos disponíveis: ${currentCount} (anterior: ${lastOrderCount})`);

            // NOVO PEDIDO DETECTADO! 🔊
            if (currentCount > lastOrderCount) {
                const novos = currentCount - lastOrderCount;
                console.log(`🔔 ${novos} NOVO(S) PEDIDO(S) DETECTADO(S)!`);
                
                playDeliverySound();
                showNotification(`🔔 ${novos} novo(s) pedido(s) disponível(is)!`, 'success');
            }

            // Atualizar dados
            lastOrderCount = currentCount;
            availableOrders = response.data;
            renderAvailableOrders();
            updateNotificationBadge();
        }

    } catch (error) {
        console.error('❌ Erro ao verificar novos pedidos:', error);
    }
}

// ========================================
// PEDIDOS DISPONÍVEIS
// ========================================
async function loadAvailableOrders() {
    if (!isOnline) return;
    
    try {
        const response = await DeliveryAPI.getAvailableOrders(getToken());
        
        if (response.success) {
            availableOrders = response.data;
            lastOrderCount = availableOrders.length; // Atualizar contador
            renderAvailableOrders();
            updateNotificationBadge();
        }
    } catch (error) {
        console.error('❌ Erro ao carregar pedidos:', error);
    }
}

function renderAvailableOrders() {
    const container = document.getElementById('availableOrdersList');
    
    if (availableOrders.length === 0) {
        container.innerHTML = '<p class="empty-message">Nenhum pedido disponível no momento.</p>';
        return;
    }
    
    container.innerHTML = availableOrders.map(order => createOrderCard(order)).join('');
}

function createOrderCard(order) {
    const restaurantAddress = order.restaurant.address || 'Endereço não disponível';
    const clientAddress = order.clientAddress || 
        `${order.address.street}, ${order.address.number}, ${order.address.neighborhood}`;
    
    return `
        <div class="order-notification">
            <div class="order-header">
                <div class="order-id">Pedido #${order.id}</div>
                <div class="order-value">Kz ${formatCurrency(order.total)}</div>
            </div>
            
            <div class="order-details">
                ${createDetailRow('🏪', 'Restaurante:', `
                    <strong>${order.restaurant.name}</strong><br>
                    📍 ${restaurantAddress}<br>
                    📱 ${order.restaurant.phone || 'Não informado'}
                `)}
                
                ${createDetailRow('👤', 'Cliente:', `
                    <strong>${order.clientName || 'Cliente'}</strong><br>
                    📱 ${order.clientPhone || 'Não informado'}<br>
                    📍 ${clientAddress}
                `)}
            </div>
            
            <div class="order-items">
                <strong style="display: block; margin-bottom: 0.5rem;">📦 Itens do Pedido:</strong>
                ${order.items.map(item => createItemLine(item)).join('')}
            </div>
            
            <div class="order-actions">
                <button class="btn-accept" data-order-id="${order.id}">
                    ✅ Aceitar Entrega
                </button>
                <button class="btn-ignore" data-order-id="${order.id}">
                    ❌ Ignorar
                </button>
            </div>
        </div>
    `;
}

function createDetailRow(icon, label, content) {
    return `
        <div class="detail-row">
            <div class="detail-icon">${icon}</div>
            <div class="detail-content">
                <div class="detail-label">${label}</div>
                <div class="detail-value">${content}</div>
            </div>
        </div>
    `;
}

function createItemLine(item) {
    const total = parseFloat(item.price) * item.quantity;
    return `
        <div class="order-item-line">
            <span>${item.quantity}x ${item.name}</span>
            <span>Kz ${formatCurrency(total)}</span>
        </div>
    `;
}

function updateNotificationBadge() {
    const badge = document.getElementById('notificationCount');
    
    if (availableOrders.length > 0) {
        badge.textContent = availableOrders.length;
        badge.style.display = 'flex';
    } else {
        badge.style.display = 'none';
    }
}

async function acceptOrder(orderId) {
    stopDeliverySound();

    try {
        const response = await DeliveryAPI.acceptOrder(orderId, getToken());
        
        if (response.success) {
            showNotification('✅ Pedido aceito! Dirija-se ao restaurante.', 'success');
            
            await Promise.all([
                loadAvailableOrders(),
                loadActiveOrders(),
                loadStats()
            ]);
            
            showSection('active');
        } else {
            showNotification('❌ ' + response.message, 'error');
            await loadAvailableOrders();
        }
    } catch (error) {
        console.error('❌ Erro ao aceitar pedido:', error);
        showNotification('❌ Erro ao aceitar pedido', 'error');
    }
}

async function ignoreOrder(orderId) {
    stopDeliverySound();

    if (!confirm('Ignorar este pedido? Você perderá 1 ponto de pontuação.')) return;
    
    try {
        await DeliveryAPI.ignoreOrder(getToken());
        
        await Promise.all([
            loadAvailableOrders(),
            loadStats()
        ]);
        
        showNotification('⚠️ Pedido ignorado. -1 ponto.', 'info');
    } catch (error) {
        console.error('❌ Erro ao ignorar pedido:', error);
    }
}

// ========================================
// ENTREGAS ATIVAS
// ========================================
async function loadActiveOrders() {
    try {
        const response = await DeliveryAPI.getMyOrders(getToken());
        
        if (response.success && response.data.length > 0) {
            activeOrder = response.data[0];
            renderActiveDelivery();
        } else {
            activeOrder = null;
            document.getElementById('activeDeliveryContent').innerHTML = 
                '<p class="empty-message">Você não tem entregas ativas.</p>';
        }
    } catch (error) {
        console.error('❌ Erro ao carregar entregas ativas:', error);
    }
}

function renderActiveDelivery() {
    if (!activeOrder) return;
    
    const container = document.getElementById('activeDeliveryContent');
    const currentStatus = STATUS_MAP[activeOrder.deliveryStatus];
    
    container.innerHTML = `
        <div id="map"></div>
        
        <div class="delivery-controls">
            <h3 style="margin-bottom: 1rem;">Pedido #${activeOrder.id}</h3>
            
            <div class="delivery-info-card">
                ${createInfoBox('Status:', currentStatus.text)}
                ${createInfoBox('Valor:', `Kz ${formatCurrency(activeOrder.total)}`)}
                ${createInfoBox('Restaurante:', activeOrder.restaurant.name)}
                ${createInfoBox('Cliente:', activeOrder.clientName)}
            </div>
            
            <button class="btn-update-status" data-next-status="${currentStatus.next}">
                ${currentStatus.btnText}
            </button>
        </div>
    `;
    
    initMap();
}

function createInfoBox(label, value) {
    return `
        <div class="info-box">
            <div class="info-label">${label}</div>
            <div class="info-value">${value}</div>
        </div>
    `;
}

async function updateDeliveryStatus(newStatus) {
    try {
        const response = await DeliveryAPI.updateDeliveryStatus(
            activeOrder.id, 
            newStatus, 
            getToken()
        );
        
        if (response.success) {
            showNotification(STATUS_MESSAGES[newStatus], 'success');
            
            if (newStatus === 'delivered') {
                await handleDeliveryCompleted();
            } else {
                await loadActiveOrders();
            }
        }
    } catch (error) {
        console.error('❌ Erro ao atualizar status:', error);
        showNotification('❌ Erro ao atualizar status', 'error');
    }
}

async function handleDeliveryCompleted() {
    await loadStats();
    activeOrder = null;
    document.getElementById('activeDeliveryContent').innerHTML = 
        '<p class="empty-message">✅ Entrega concluída com sucesso!</p>';
    
    setTimeout(() => {
        showSection('available');
        loadAvailableOrders();
    }, 3000);
}

// ========================================
// HISTÓRICO DE ENTREGAS
// ========================================
async function loadDeliveryHistory() {
    try {
        const token = getToken();
        const API_URL = 'http://localhost:3000/api';
        
        const response = await fetch(`${API_URL}/delivery/my-orders?includeCompleted=true`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        const result = await response.json();
        
        if (result.success && result.data) {
            const completedOrders = result.data.filter(o => o.deliveryStatus === 'delivered');
            renderDeliveryHistory(completedOrders);
        }
    } catch (error) {
        console.error('❌ Erro ao carregar histórico:', error);
    }
}

function renderDeliveryHistory(orders) {
    const container = document.getElementById('historyList');
    
    if (orders.length === 0) {
        container.innerHTML = '<p class="empty-message">Nenhuma entrega no histórico.</p>';
        return;
    }
    
    container.innerHTML = orders.map(order => createHistoryCard(order)).join('');
}

function createHistoryCard(order) {
    const deliveryDate = formatDate(order.deliveryCompletedAt || order.updatedAt);
    
    return `
        <div class="order-notification" style="border-left: 5px solid #48c774;">
            <div class="order-header">
                <div class="order-id">Pedido #${order.id}</div>
                <div class="order-value">Kz ${formatCurrency(order.total)}</div>
            </div>
            
            <div style="margin-bottom: 1rem;">
                <div style="color: #48c774; font-weight: bold; margin-bottom: 0.5rem;">
                    ✅ Entregue em: ${deliveryDate}
                </div>
                <div style="color: #666;">
                    📍 ${order.restaurant.name} → ${order.clientName}
                </div>
            </div>
            
            <div class="order-items">
                <strong style="display: block; margin-bottom: 0.5rem;">📦 Itens:</strong>
                ${order.items.map(item => createItemLine(item)).join('')}
            </div>
        </div>
    `;
}

function formatDate(dateString) {
    if (!dateString) return 'Data não disponível';
    
    try {
        const date = new Date(dateString);
        if (isNaN(date.getTime())) return 'Data inválida';
        
        return date.toLocaleString('pt-AO', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    } catch (error) {
        return 'Data inválida';
    }
}

// ========================================
// MAPA
// ========================================
async function initMap() {
    setTimeout(async () => {
        if (map) {
            map.remove();
        }
        
        map = L.map('map').setView(DEFAULT_LOCATION, 13);
        
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© OpenStreetMap contributors',
            maxZoom: 19
        }).addTo(map);
        
        console.log('🗺️ Mapa inicializado');
        
        let restaurantLocation = { lat: DEFAULT_LOCATION[0], lng: DEFAULT_LOCATION[1] };
        let clientLocation = { 
            lat: DEFAULT_LOCATION[0] + 0.02, 
            lng: DEFAULT_LOCATION[1] + 0.02 
        };
        
        // Criar marcadores
        restaurantMarker = createMapMarker(
            [restaurantLocation.lat, restaurantLocation.lng],
            '🏪',
            '#ff6b35',
            `<div style="min-width: 200px;">
                <strong style="font-size: 1.1rem;">🏪 ${activeOrder.restaurant.name}</strong>
            </div>`
        );
        
        clientMarker = createMapMarker(
            [clientLocation.lat, clientLocation.lng],
            '📍',
            '#48c774',
            `<div style="min-width: 200px;">
                <strong style="font-size: 1.1rem;">📍 ${activeOrder.clientName}</strong>
            </div>`
        );
        
        addDeliveryMarker([restaurantLocation.lat, restaurantLocation.lng], [clientLocation.lat, clientLocation.lng]);
        
        const bounds = L.latLngBounds([
            [restaurantLocation.lat, restaurantLocation.lng],
            [clientLocation.lat, clientLocation.lng]
        ]);
        map.fitBounds(bounds, { padding: [50, 50] });
        
    }, 100);
}

function createMapMarker(location, emoji, color, popupText) {
    const marker = L.marker(location, {
        icon: L.divIcon({
            html: `<div style="background: ${color}; color: white; padding: 10px; border-radius: 50%; width: 40px; height: 40px; display: flex; align-items: center; justify-content: center; font-size: 20px; box-shadow: 0 2px 10px rgba(0,0,0,0.3); border: 3px solid white;">${emoji}</div>`,
            className: '',
            iconSize: [40, 40]
        })
    }).addTo(map).bindPopup(popupText);
    
    return marker;
}

function addDeliveryMarker(restaurantPos, clientPos) {
    deliveryMarker = createMapMarker(
        DEFAULT_LOCATION,
        '🛵',
        '#667eea',
        '<strong>🛵 Você está aqui</strong>'
    );
    
    L.polyline([DEFAULT_LOCATION, restaurantPos, clientPos], {
        color: '#667eea',
        weight: 4,
        opacity: 0.7,
        dashArray: '10, 10'
    }).addTo(map);
}

// ========================================
// NAVEGAÇÃO
// ========================================
function showSection(section) {
    document.querySelectorAll('.content-section').forEach(s => s.classList.remove('active'));
    document.querySelectorAll('.menu-item').forEach(item => item.classList.remove('active'));
    
    if (section === 'available') {
        document.getElementById('availableSection').classList.add('active');
        document.querySelector('.menu-item:nth-child(1)').classList.add('active');
        loadAvailableOrders();
    } else if (section === 'active') {
        document.getElementById('activeSection').classList.add('active');
        document.querySelector('.menu-item:nth-child(2)').classList.add('active');
        loadActiveOrders();
    } else if (section === 'history') {
        document.getElementById('historySection').classList.add('active');
        document.querySelector('.menu-item:nth-child(3)').classList.add('active');
        loadDeliveryHistory();
    }
}

// ========================================
// UTILIDADES
// ========================================
function formatCurrency(value) {
    const numValue = typeof value === 'string' ? parseFloat(value) : value;
    if (isNaN(numValue)) return '0,00';
    return numValue.toFixed(2).replace('.', ',').replace(/\B(?=(\d{3})+(?!\d))/g, '.');
}

function logout() {
    if (!confirm('Tem certeza que deseja sair?')) return;
    
    ['deliveryUser', 'deliveryToken'].forEach(key => {
        sessionStorage.removeItem(key);
        localStorage.removeItem(key);
    });
    
    window.location.href = 'delivery-auth.html';
}

function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    
    notification.style.cssText = `
        position: fixed;
        top: 100px;
        right: 20px;
        background: ${NOTIFICATION_COLORS[type]};
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

function startAutoRefresh() {
    // APENAS UM setInterval!
    setInterval(() => {
        checkNewDeliveryOrders(); // Verifica novos pedidos (com som)
        loadActiveOrders(); // Atualiza entregas ativas
    }, CHECK_INTERVAL);
}

// ========================================
// EVENT DELEGATION GLOBAL
// ========================================
function setupGlobalEventListeners() {
    document.addEventListener('click', function(e) {
        if (e.target.classList.contains('btn-accept')) {
            const orderId = parseInt(e.target.getAttribute('data-order-id'));
            acceptOrder(orderId);
        }
        
        if (e.target.classList.contains('btn-ignore')) {
            const orderId = parseInt(e.target.getAttribute('data-order-id'));
            ignoreOrder(orderId);
        }
        
        if (e.target.classList.contains('btn-update-status')) {
            const nextStatus = e.target.getAttribute('data-next-status');
            updateDeliveryStatus(nextStatus);
        }
    });
}

// ========================================
// ESTILOS
// ========================================
function initStyles() {
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
}