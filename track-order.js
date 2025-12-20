let currentOrder = null;

// Pegar ID do pedido da URL
function getOrderIdFromURL() {
    const params = new URLSearchParams(window.location.search);
    return params.get('id');
}

// Carregar informações do pedido
async function loadOrderTracking() {
    const orderId = getOrderIdFromURL();
    
    if (!orderId) {
        alert('ID do pedido não encontrado!');
        window.location.href = 'orders.html';
        return;
    }
    
    document.getElementById('orderNumber').textContent = `Pedido #${orderId}`;
    
    try {
        const token = sessionStorage.getItem('token') || localStorage.getItem('token');
        const response = await OrderAPI.getById(orderId, token);
        
        if (response.success && response.data) {
            currentOrder = response.data;
            renderOrderStatus();
            
            // Se tiver entregador, mostrar informações
            if (currentOrder.delivery) {
                showDeliveryInfo();
            }
        } else {
            alert('Pedido não encontrado!');
            window.location.href = 'orders.html';
        }
    } catch (error) {
        console.error('❌ Erro ao carregar pedido:', error);
        alert('Erro ao carregar informações do pedido');
    }
}

// Renderizar status do pedido
function renderOrderStatus() {
    const timeline = document.getElementById('statusTimeline');
    
    const statuses = [
        { 
            key: 'pending', 
            title: '🕐 Pedido Recebido', 
            desc: 'Aguardando confirmação do restaurante',
            time: currentOrder.createdAt
        },
        { 
            key: 'preparing', 
            title: '👨‍🍳 Preparando', 
            desc: 'Seu pedido está sendo preparado',
            time: currentOrder.status === 'preparing' || currentOrder.status === 'delivering' || currentOrder.status === 'completed' ? currentOrder.updatedAt : null
        },
        { 
            key: 'delivering', 
            title: '🚚 Saiu para Entrega', 
            desc: 'Pedido a caminho',
            time: currentOrder.deliveryAcceptedAt
        },
        { 
            key: 'completed', 
            title: '✅ Entregue', 
            desc: 'Pedido entregue com sucesso',
            time: currentOrder.deliveryCompletedAt
        }
    ];
    
    timeline.innerHTML = '';
    
    statuses.forEach((status, index) => {
        const stepDiv = document.createElement('div');
        stepDiv.className = 'status-step';
        
        // Determinar classe (completed, active, pending)
        if (currentOrder.status === 'completed' || 
            (status.key === 'delivering' && currentOrder.deliveryStatus === 'delivered')) {
            if (index < statuses.length) {
                stepDiv.classList.add('completed');
            }
        } else if (
            (status.key === 'pending' && currentOrder.status === 'pending') ||
            (status.key === 'preparing' && currentOrder.status === 'preparing') ||
            (status.key === 'delivering' && currentOrder.status === 'delivering') ||
            (status.key === 'completed' && currentOrder.status === 'completed')
        ) {
            stepDiv.classList.add('active');
        } else if (
            (status.key === 'preparing' && currentOrder.status === 'pending') ||
            (status.key === 'delivering' && (currentOrder.status === 'pending' || currentOrder.status === 'preparing')) ||
            (status.key === 'completed' && currentOrder.status !== 'completed')
        ) {
            // Pendente
        } else {
            stepDiv.classList.add('completed');
        }
        
        const timeText = status.time ? formatDate(status.time) : '';
        
        stepDiv.innerHTML = `
            <div class="status-title">${status.title}</div>
            <div class="status-desc" style="color: #666; margin-bottom: 0.3rem;">${status.desc}</div>
            ${timeText ? `<div class="status-time">${timeText}</div>` : ''}
        `;
        
        timeline.appendChild(stepDiv);
    });
}

// Mostrar informações do entregador
function showDeliveryInfo() {
    const deliveryInfoSection = document.getElementById('deliveryInfo');
    deliveryInfoSection.style.display = 'block';
    
    document.getElementById('deliveryName').textContent = currentOrder.delivery.name;
    document.getElementById('deliveryPhone').textContent = currentOrder.delivery.phone;
    
    if (currentOrder.delivery.vehiclePlate) {
        document.getElementById('vehiclePlateRow').style.display = 'flex';
        document.getElementById('vehiclePlate').textContent = currentOrder.delivery.vehiclePlate;
    }
}

// Formatar data
function formatDate(dateString) {
    if (!dateString) return '';
    
    try {
        const date = new Date(dateString);
        if (isNaN(date.getTime())) return '';
        
        return date.toLocaleString('pt-AO', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    } catch (error) {
        return '';
    }
}

// Auto-refresh a cada 10 segundos
setInterval(() => {
    loadOrderTracking();
}, 10000);

// Inicialização
document.addEventListener('DOMContentLoaded', function() {
    console.log('Página de rastreamento carregada! 🚚');
    loadOrderTracking();
});