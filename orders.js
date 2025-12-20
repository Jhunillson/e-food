// Dados do usuário e pedidos
let currentUser = null;
let allOrders = [];
let filteredOrders = [];
let currentFilter = 'all';

// Variáveis globais para avaliação
let currentRatingOrderId = null;
let currentRatingValue = 0;

// Formatar moeda angolana
function formatCurrency(value) {
    const numValue = parseFloat(value) || 0;
    return numValue.toFixed(2).replace('.', ',').replace(/\B(?=(\d{3})+(?!\d))/g, '.');
}

// Carregar dados do usuário
function loadUserData() {
    const userData = sessionStorage.getItem('currentUser') || localStorage.getItem('currentUser');
    
    if (!userData) {
        sessionStorage.setItem('redirectAfterLogin', 'orders.html');
        window.location.href = 'auth.html';
        return;
    }
    
    currentUser = JSON.parse(userData);
    document.getElementById('userNameBtn').textContent = currentUser.name.split(' ')[0];
    
    loadOrders();
}

// Carregar pedidos
async function loadOrders() {
    try {
        const token = sessionStorage.getItem('token') || localStorage.getItem('token');
        
        console.log('🔍 Buscando pedidos...');
        
        if (!token) {
            console.log('⚠️ Sem token, mostrando tela vazia');
            allOrders = [];
            filterOrders('all');
            return;
        }
        
        const response = await OrderAPI.getUserOrders(token);
        
        console.log('📨 Resposta da API:', response);
        
        if (response.success) {
            allOrders = response.data;
            console.log('✅ Pedidos carregados:', allOrders.length);
            
            allOrders.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
            
            filterOrders('all');
            
            // Verificar pedidos não avaliados
            checkUnratedOrders();
        } else {
            console.error('❌ Erro ao carregar pedidos:', response.message);
            allOrders = [];
            filterOrders('all');
        }
    } catch (error) {
        console.error('❌ Erro ao conectar com API:', error);
        allOrders = [];
        filterOrders('all');
    }
}

// Filtrar pedidos
function filterOrders(filter) {
    currentFilter = filter;
    
    document.querySelectorAll('.filter-btn').forEach(btn => btn.classList.remove('active'));
    
    const buttons = document.querySelectorAll('.filter-btn');
    buttons.forEach(btn => {
        if (btn.textContent.toLowerCase().includes(filter) || 
            (filter === 'all' && btn.textContent.includes('Todos'))) {
            btn.classList.add('active');
        }
    });
    
    renderOrders(filter);
}

// Renderizar pedidos
function renderOrders(filter) {
    const ordersList = document.getElementById('ordersList');
    
    let filteredOrders = filter === 'all' 
        ? allOrders 
        : allOrders.filter(o => o.status === filter);
    
    if (filteredOrders.length === 0) {
        ordersList.innerHTML = `
            <div class="empty-orders">
                <div class="empty-orders-icon">📦</div>
                <h3>${filter === 'all' ? 'Nenhum pedido ainda' : 'Nenhum pedido ' + getFilterName(filter)}</h3>
                <p>Que tal fazer seu primeiro pedido?</p>
                <button class="btn-browse" onclick="window.location.href='index.html'">
                    Explorar Restaurantes
                </button>
            </div>
        `;
        return;
    }
    
    ordersList.innerHTML = '';
    
    filteredOrders.forEach(order => {
        const card = document.createElement('div');
        card.className = 'order-card';
        
        const statusText = getStatusText(order.status);
        const statusClass = `status-${order.status}`;
        
        const orderDate = new Date(order.createdAt);
        const formattedDate = orderDate.toLocaleDateString('pt-AO', {
            day: '2-digit',
            month: 'long',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
        
        const restaurantName = order.restaurant?.name || 'Restaurante';
        const restaurantIcon = order.restaurant?.icon || '🍽️';
        
        const orderTotal = order.total || order.items.reduce((sum, item) => {
            const price = parseFloat(item.price) || 0;
            const quantity = parseInt(item.quantity) || 1;
            return sum + (price * quantity);
        }, 0);
        
        let itemsHTML = '';
        if (order.items && Array.isArray(order.items)) {
            const itemsToShow = order.items.slice(0, 3);
            itemsHTML = itemsToShow.map(item => {
                const itemPrice = parseFloat(item.price) || 0;
                const itemQuantity = parseInt(item.quantity) || 1;
                const itemTotal = itemPrice * itemQuantity;
                
                return `
                    <div class="order-item">
                        <span class="item-name">${item.name || 'Item'}</span>
                        <span class="item-quantity">${itemQuantity}x</span>
                        <span class="item-price">Kz ${formatCurrency(itemTotal)}</span>
                    </div>
                `;
            }).join('');
            
            if (order.items.length > 3) {
                itemsHTML += `<div class="order-item"><span class="item-name">+ ${order.items.length - 3} itens</span></div>`;
            }
        }
        
        card.innerHTML = `
            <div class="order-card-header">
                <div class="order-info">
                    <div class="order-id">Pedido #${order.id}</div>
                    <div class="order-restaurant">
                        <div class="restaurant-icon-small">${restaurantIcon}</div>
                        <div class="restaurant-details">
                            <h3>${restaurantName}</h3>
                            <div class="order-date">${formattedDate}</div>
                        </div>
                    </div>
                </div>
                <div class="order-status ${statusClass}">${statusText}</div>
            </div>
            
            <div class="order-items">
                ${itemsHTML}
            </div>
            
            <div class="order-card-footer">
                <div class="order-total">Total: Kz ${formatCurrency(orderTotal)}</div>
                <div class="order-actions">
                    ${order.status !== 'cancelled' ? `<button class="btn-action btn-track" data-order-id="${order.id}">📍 Rastrear</button>` : ''}
                    <button class="btn-action btn-details" data-order-id="${order.id}" data-action="details">Ver Detalhes</button>
                    ${order.status === 'completed' && !order.rating ? 
                        `<button class="btn-action btn-rate" data-order='${JSON.stringify(order).replace(/'/g, "&apos;")}' style="background: #ffa500;">
                            ⭐ Avaliar
                        </button>` 
                    : ''}
                    ${order.status === 'completed' && order.rating ? 
                        `<span style="color: #48c774; font-weight: 600;">
                            ✅ Avaliado (${order.rating} ⭐)
                        </span>` 
                    : ''}
                    ${order.status === 'completed' ? `<button class="btn-action btn-reorder" data-order-id="${order.id}" data-action="reorder">Pedir Novamente</button>` : ''}
                </div>
            </div>
        `;
        
        ordersList.appendChild(card);
    });
    
    // Adicionar event listeners após renderizar
    attachEventListeners();
}

// Adicionar event listeners aos botões
function attachEventListeners() {
    // Botão rastrear
    document.querySelectorAll('.btn-track').forEach(btn => {
        btn.addEventListener('click', function(e) {
            e.stopPropagation();
            const orderId = this.getAttribute('data-order-id');
            trackOrder(orderId);
        });
    });
    
    // Botão detalhes
    document.querySelectorAll('[data-action="details"]').forEach(btn => {
        btn.addEventListener('click', function(e) {
            e.stopPropagation();
            const orderId = parseInt(this.getAttribute('data-order-id'));
            const order = allOrders.find(o => o.id === orderId);
            if (order) showOrderDetails(order);
        });
    });
    
    // Botão avaliar
    document.querySelectorAll('.btn-rate').forEach(btn => {
        btn.addEventListener('click', function(e) {
            e.stopPropagation();
            const order = JSON.parse(this.getAttribute('data-order'));
            openRatingModal(order);
        });
    });
    
    // Botão reordenar
    document.querySelectorAll('[data-action="reorder"]').forEach(btn => {
        btn.addEventListener('click', function(e) {
            e.stopPropagation();
            const orderId = parseInt(this.getAttribute('data-order-id'));
            reorder(orderId);
        });
    });
}

// Obter nome do filtro
function getFilterName(filter) {
    const names = {
        pending: 'em andamento',
        completed: 'concluídos',
        cancelled: 'cancelados'
    };
    return names[filter] || '';
}

// Obter texto do status
function getStatusText(status) {
    const texts = {
        pending: '🕐 Preparando',
        preparing: '👨‍🍳 Preparando',
        delivering: '🚚 A caminho',
        completed: '✅ Concluído',
        cancelled: '❌ Cancelado'
    };
    return texts[status] || status;
}

// Mostrar detalhes do pedido
function showOrderDetails(order) {
    const modal = document.getElementById('orderModal');
    const modalBody = document.getElementById('modalBody');
    
    const orderDate = new Date(order.createdAt);
    const formattedDate = orderDate.toLocaleDateString('pt-AO', {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
    
    modalBody.innerHTML = `
        <div class="modal-section">
            <h3>📋 Informações do Pedido</h3>
            <div class="modal-info">
                <p><strong>Número:</strong> #${order.id}</p>
                <p><strong>Data:</strong> ${formattedDate}</p>
                <p><strong>Status:</strong> ${getStatusText(order.status)}</p>
                <p><strong>Restaurante:</strong> ${order.restaurant.icon} ${order.restaurant.name}</p>
            </div>
        </div>
        
        <div class="modal-section">
            <h3>📍 Endereço de Entrega</h3>
            <div class="modal-info">
                <p><strong>Endereço:</strong> ${order.address.street}, ${order.address.number}</p>
                ${order.address.complement ? `<p><strong>Complemento:</strong> ${order.address.complement}</p>` : ''}
                <p><strong>Bairro:</strong> ${order.address.neighborhood}</p>
                <p><strong>Município:</strong> ${order.address.municipality}</p>
                <p><strong>Província:</strong> ${order.address.province}</p>
                <p><strong>Referência:</strong> ${order.address.reference}</p>
            </div>
        </div>
        
        <div class="modal-section">
            <h3>💳 Pagamento</h3>
            <div class="modal-info">
                <p><strong>Método:</strong> ${order.payment.methodName}</p>
                ${order.payment.cardNumber ? `<p><strong>Cartão:</strong> **** **** **** ${order.payment.cardNumber}</p>` : ''}
                ${order.payment.changeFor ? `<p><strong>Troco para:</strong> ${order.payment.changeFor}</p>` : ''}
            </div>
        </div>
        
        <div class="modal-section">
            <h3>🍕 Itens do Pedido</h3>
            <div class="modal-items">
                ${order.items.map(item => `
                    <div class="modal-item">
                        <div>
                            <strong>${item.name}</strong><br>
                            <span style="color: #666;">${item.quantity}x Kz ${formatCurrency(item.price)}</span>
                        </div>
                        <strong>Kz ${formatCurrency(parseFloat(item.price) * item.quantity)}</strong>
                    </div>
                `).join('')}
            </div>
        </div>
        
        <div class="modal-section">
            <h3>💰 Resumo de Valores</h3>
            <div class="modal-totals">
                <div class="modal-total-row">
                    <span>Subtotal:</span>
                    <span>Kz ${formatCurrency(order.subtotal)}</span>
                </div>
                <div class="modal-total-row">
                    <span>Taxa de entrega:</span>
                    <span>Kz ${formatCurrency(order.deliveryFee)}</span>
                </div>
                <div class="modal-total-row final">
                    <span>Total:</span>
                    <span>Kz ${formatCurrency(order.total)}</span>
                </div>
            </div>
        </div>
    `;
    
    modal.classList.add('active');
}

// Fechar modal
function closeModal() {
    document.getElementById('orderModal').classList.remove('active');
}

// Rastrear pedido
function trackOrder(orderId) {
    const id = parseInt(orderId);
    
    if (isNaN(id)) {
        alert('ID do pedido inválido!');
        return;
    }
    
    console.log('🚚 Rastreando pedido:', id);
    window.location.href = `track-order.html?id=${id}`;
}

// Pedir novamente
function reorder(orderId) {
    const order = allOrders.find(o => o.id === orderId);
    if (!order) return;
    
    sessionStorage.setItem('cart', JSON.stringify(order.items));
    
    const restaurantInfo = {
        restaurantId: order.restaurantId,
        name: order.restaurant.name,
        icon: order.restaurant.icon,
        time: '30-40 min'
    };
    
    sessionStorage.setItem('restaurant', JSON.stringify(restaurantInfo));
    
    alert(`✅ Voltando ao Restaurante`);
    window.location.href = `restaurant.html?id=${order.restaurantId}`;
}

// ========================================
// SISTEMA DE AVALIAÇÃO
// ========================================

// Abrir modal de avaliação
function openRatingModal(order) {
    currentRatingOrderId = order.id;
    currentRatingValue = 0;
    
    // Atualizar informações do restaurante
    document.getElementById('ratingRestaurantIcon').textContent = order.restaurant.icon;
    document.getElementById('ratingRestaurantName').textContent = order.restaurant.name;
    
    // Resetar estrelas
    document.querySelectorAll('.star').forEach(star => {
        star.classList.remove('active');
    });
    
    // Resetar texto e comentário
    document.getElementById('ratingText').textContent = 'Selecione as estrelas';
    document.getElementById('ratingComment').value = '';
    
    // Mostrar modal
    document.getElementById('ratingModal').style.display = 'flex';
}

// Fechar modal de avaliação
function closeRatingModal() {
    document.getElementById('ratingModal').style.display = 'none';
    currentRatingOrderId = null;
    currentRatingValue = 0;
}

// Selecionar avaliação
function selectRating(rating) {
    currentRatingValue = rating;
    
    const stars = document.querySelectorAll('.star');
    const ratingTexts = [
        '',
        '⭐ Ruim',
        '⭐⭐ Regular',
        '⭐⭐⭐ Bom',
        '⭐⭐⭐⭐ Muito Bom',
        '⭐⭐⭐⭐⭐ Excelente!'
    ];
    
    // Atualizar estrelas
    stars.forEach((star, index) => {
        if (index < rating) {
            star.classList.add('active');
        } else {
            star.classList.remove('active');
        }
    });
    
    // Atualizar texto
    document.getElementById('ratingText').textContent = ratingTexts[rating];
}

// Enviar avaliação
async function submitRating() {
    if (currentRatingValue === 0) {
        alert('Por favor, selecione uma avaliação!');
        return;
    }
    
    const comment = document.getElementById('ratingComment').value.trim();
    const token = sessionStorage.getItem('token') || localStorage.getItem('token');
    
    try {
        const response = await OrderAPI.rateOrder(
            currentRatingOrderId, 
            currentRatingValue, 
            comment,
            token
        );
        
        if (response.success) {
            closeRatingModal();
            alert('✅ Avaliação enviada com sucesso! Obrigado pelo seu feedback.');
            
            // Recarregar pedidos
            await loadOrders();
        } else {
            alert('❌ ' + response.message);
        }
    } catch (error) {
        console.error('❌ Erro ao enviar avaliação:', error);
        alert('❌ Erro ao enviar avaliação');
    }
}

// Verificar pedidos concluídos não avaliados
function checkUnratedOrders() {
    const unratedOrders = allOrders.filter(order => 
        order.status === 'completed' && !order.rating
    );
    
    // Se tiver pedido não avaliado, mostrar automaticamente após 2 segundos
    if (unratedOrders.length > 0) {
        setTimeout(() => {
            openRatingModal(unratedOrders[0]);
        }, 2000);
    }
}

// ========================================
// EVENT LISTENERS
// ========================================

// Fechar modal ao clicar fora
document.addEventListener('click', function(event) {
    const modal = document.getElementById('orderModal');
    if (event.target === modal) {
        closeModal();
    }
    
    const ratingModal = document.getElementById('ratingModal');
    if (event.target === ratingModal) {
        closeRatingModal();
    }
});

// Inicialização
document.addEventListener('DOMContentLoaded', function() {
    console.log('Página de pedidos carregada! 📦');
    loadUserData();
});