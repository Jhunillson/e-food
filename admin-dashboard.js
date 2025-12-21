// ========================================
// VARIÁVEIS GLOBAIS
// ========================================
let currentAdmin = null;
let allRestaurants = [];
let allDeliveries = [];
let allOrders = [];
let revenueChart = null;
let platformRevenueChart = null;
let allPendingOrders = []; 
let sound = null;
let soundUnlocked = false;
let lastPendingCount = 0;

//const API_URL = 'http://localhost:3000/api';

const API_URL = window.location.hostname === "localhost" || 
                window.location.hostname === "127.0.0.1"
                ? "http://localhost:3000/api"
                : "https://e-food-production.up.railway.app/api";

console.log("🔗 Admin API conectada em:", API_URL);

// ========================================
// INICIALIZAÇÃO
// ========================================
document.addEventListener('DOMContentLoaded', function() {
    console.log('📊 Admin Dashboard carregado');
    
    // Verificar autenticação
    const adminToken = sessionStorage.getItem('adminToken') || localStorage.getItem('adminToken');
    const adminData = sessionStorage.getItem('adminData') || localStorage.getItem('adminData');
    
    if (!adminToken || !adminData) {
        window.location.href = 'admin-login.html';
        return;
    }
    
    currentAdmin = JSON.parse(adminData);
    document.getElementById('adminName').textContent = currentAdmin.name;
    
    // 🆕 Inicializar sistema de som
    initSound();
    
    // Atualizar data
    updateCurrentDate();
    
    // Carregar dados
    loadDashboard();
    
    // 🆕 Auto-refresh a cada 60 segundos + verificar pedidos pendentes a cada 5 segundos
    setInterval(() => {
        loadDashboard();
    }, 60000);
    
    // 🆕 Verificar novos pedidos pendentes com som
    setInterval(() => {
        checkNewPendingOrdersWithSound();
    }, 5000);
});

// ========================================
// DASHBOARD
// ========================================
async function loadDashboard() {
    await loadStats();
    await loadRevenueChart();
    await loadPendingOrdersCount();
}

async function loadStats() {
    try {
        const token = sessionStorage.getItem('adminToken') || localStorage.getItem('adminToken');
        
        const response = await fetch(`${API_URL}/admin/stats`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        const result = await response.json();
        
        if (result.success) {
            const stats = result.data;
            
            // Atualizar cards
            document.getElementById('totalUsers').textContent = stats.users.total;
            document.getElementById('totalRestaurants').textContent = stats.restaurants.total;
            document.getElementById('activeRestaurants').textContent = stats.restaurants.active;
            document.getElementById('totalDeliveries').textContent = stats.deliveries.total;
            document.getElementById('activeDeliveries').textContent = stats.deliveries.active;
            document.getElementById('todayOrders').textContent = stats.orders.today;
            document.getElementById('completedOrders').textContent = stats.orders.completed;
            
            // Receita
            document.getElementById('totalRevenue').textContent = `Kz ${formatCurrency(stats.revenue.total)}`;
            document.getElementById('platformRevenue').textContent = `Kz ${formatCurrency(stats.revenue.platformTotal)}`;
            document.getElementById('todayRevenue').textContent = `Kz ${formatCurrency(stats.revenue.today)}`;
            document.getElementById('platformRevenueToday').textContent = `Kz ${formatCurrency(stats.revenue.platformToday)}`;
            
            console.log('✅ Estatísticas carregadas');
        }
    } catch (error) {
        console.error('❌ Erro ao carregar estatísticas:', error);
    }
}

async function loadRevenueChart() {
    try {
        const token = sessionStorage.getItem('adminToken') || localStorage.getItem('adminToken');
        
        const response = await fetch(`${API_URL}/admin/revenue-chart`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        const result = await response.json();
        
        if (result.success) {
            renderRevenueChart(result.data);
        }
    } catch (error) {
        console.error('❌ Erro ao carregar gráfico:', error);
    }
}

function renderRevenueChart(data) {
    const ctx = document.getElementById('revenueChart');
    
    if (revenueChart) {
        revenueChart.destroy();
    }
    
    const labels = data.map(d => {
        const date = new Date(d.date);
        return date.toLocaleDateString('pt-AO', { day: '2-digit', month: 'short' });
    });
    
    const revenues = data.map(d => d.revenue);
    const platformRevenues = data.map(d => d.platformRevenue);
    
    revenueChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [
                {
                    label: 'Receita Total',
                    data: revenues,
                    borderColor: '#667eea',
                    backgroundColor: 'rgba(102, 126, 234, 0.1)',
                    tension: 0.4,
                    fill: true,
                    borderWidth: 3,
                    pointRadius: 5,
                    pointHoverRadius: 7,
                    pointBackgroundColor: '#667eea'
                },
                {
                    label: 'Lucro da Plataforma (20%)',
                    data: platformRevenues,
                    borderColor: '#48c774',
                    backgroundColor: 'rgba(72, 199, 116, 0.1)',
                    tension: 0.4,
                    fill: true,
                    borderWidth: 3,
                    pointRadius: 5,
                    pointHoverRadius: 7,
                    pointBackgroundColor: '#48c774'
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            aspectRatio: 2.5,
            plugins: {
                legend: {
                    display: true,
                    position: 'top',
                    labels: {
                        padding: 15,
                        font: {
                            size: 12,
                            weight: 'bold'
                        },
                        usePointStyle: true
                    }
                },
                tooltip: {
                    backgroundColor: 'rgba(0,0,0,0.8)',
                    padding: 12,
                    titleFont: {
                        size: 14,
                        weight: 'bold'
                    },
                    bodyFont: {
                        size: 13
                    },
                    callbacks: {
                        label: function(context) {
                            return context.dataset.label + ': Kz ' + formatCurrency(context.parsed.y);
                        }
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        callback: function(value) {
                            return 'Kz ' + formatCurrency(value);
                        },
                        padding: 10,
                        font: {
                            size: 11
                        }
                    },
                    grid: {
                        color: 'rgba(0,0,0,0.05)',
                        drawBorder: false
                    }
                },
                x: {
                    grid: {
                        display: false,
                        drawBorder: false
                    },
                    ticks: {
                        padding: 10,
                        font: {
                            size: 11
                        }
                    }
                }
            }
        }
    });
}

// ========================================
// RESTAURANTES
// ========================================
async function loadRestaurants() {
    try {
        const token = sessionStorage.getItem('adminToken') || localStorage.getItem('adminToken');
        
        const response = await fetch(`${API_URL}/admin/restaurants`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        const result = await response.json();
        
        if (result.success) {
            allRestaurants = result.data;
            renderRestaurants(allRestaurants);
        }
    } catch (error) {
        console.error('❌ Erro ao carregar restaurantes:', error);
    }
}

function renderRestaurants(restaurants) {
    const container = document.getElementById('restaurantsList');
    
    if (restaurants.length === 0) {
        container.innerHTML = '<p class="empty-message">Nenhum restaurante cadastrado.</p>';
        return;
    }
    
    container.innerHTML = restaurants.map(restaurant => `
        <div class="list-item">
            <div class="list-item-info">
                <div class="list-item-name">${restaurant.icon} ${restaurant.name}</div>
                <div class="list-item-details">
                    📧 ${restaurant.email} | 📱 ${restaurant.phone || 'N/A'} | 🍽️ ${restaurant.cuisine}
                </div>
            </div>
            <div style="display: flex; align-items: center;">
                <span class="status-badge ${restaurant.isActive ? 'active' : 'inactive'}">
                    ${restaurant.isActive ? '✅ Ativo' : '❌ Inativo'}
                </span>
                <button class="btn-toggle ${restaurant.isActive ? 'deactivate' : 'activate'}" 
                        onclick="toggleRestaurant(${restaurant.id}, ${!restaurant.isActive})">
                    ${restaurant.isActive ? 'Desativar' : 'Ativar'}
                </button>
            </div>
        </div>
    `).join('');
}

function filterRestaurants(filter) {
    // Atualizar botões
    document.querySelectorAll('#restaurantsSection .filter-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    event.target.classList.add('active');
    
    let filtered = allRestaurants;
    
    if (filter === 'active') {
        filtered = allRestaurants.filter(r => r.isActive);
    } else if (filter === 'inactive') {
        filtered = allRestaurants.filter(r => !r.isActive);
    }
    
    renderRestaurants(filtered);
}

async function toggleRestaurant(id, isActive) {
    if (!confirm(`Tem certeza que deseja ${isActive ? 'ativar' : 'desativar'} este restaurante?`)) {
        return;
    }
    
    try {
        const token = sessionStorage.getItem('adminToken') || localStorage.getItem('adminToken');
        
        const response = await fetch(`${API_URL}/admin/restaurants/${id}/toggle`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ isActive })
        });
        
        const result = await response.json();
        
        if (result.success) {
            showNotification(`Restaurante ${isActive ? 'ativado' : 'desativado'} com sucesso!`, 'success');
            await loadRestaurants();
            await loadStats();
        } else {
            showNotification(result.message, 'error');
        }
    } catch (error) {
        console.error('❌ Erro:', error);
        showNotification('Erro ao atualizar restaurante', 'error');
    }
}

// ========================================
// ENTREGADORES
// ========================================
async function loadDeliveries() {
    try {
        const token = sessionStorage.getItem('adminToken') || localStorage.getItem('adminToken');
        
        const response = await fetch(`${API_URL}/admin/deliveries`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        const result = await response.json();
        
        if (result.success) {
            allDeliveries = result.data;
            renderDeliveries(allDeliveries);
        }
    } catch (error) {
        console.error('❌ Erro ao carregar entregadores:', error);
    }
}

function renderDeliveries(deliveries) {
    const container = document.getElementById('deliveriesList');
    
    if (deliveries.length === 0) {
        container.innerHTML = '<p class="empty-message">Nenhum entregador cadastrado.</p>';
        return;
    }
    
    const vehicleIcons = {
        motorcycle: '🏍️',
        bicycle: '🚴',
        car: '🚗'
    };
    
    container.innerHTML = deliveries.map(delivery => `
        <div class="list-item">
            <div class="list-item-info">
                <div class="list-item-name">${vehicleIcons[delivery.vehicle]} ${delivery.name}</div>
                <div class="list-item-details">
                    📧 ${delivery.email} | 📱 ${delivery.phone} | 
                    ⭐ ${delivery.score} pontos | 
                    📦 ${delivery.totalDeliveries} entregas
                </div>
            </div>
            <div style="display: flex; align-items: center;">
                <span class="status-badge ${delivery.isActive ? 'active' : 'inactive'}">
                    ${delivery.isActive ? '✅ Ativo' : '❌ Inativo'}
                </span>
                <button class="btn-toggle ${delivery.isActive ? 'deactivate' : 'activate'}" 
                        onclick="toggleDelivery(${delivery.id}, ${!delivery.isActive})">
                    ${delivery.isActive ? 'Desativar' : 'Ativar'}
                </button>
            </div>
        </div>
    `).join('');
}

function filterDeliveries(filter) {
    // Atualizar botões
    document.querySelectorAll('#deliveriesSection .filter-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    event.target.classList.add('active');
    
    let filtered = allDeliveries;
    
    if (filter === 'active') {
        filtered = allDeliveries.filter(d => d.isActive);
    } else if (filter === 'inactive') {
        filtered = allDeliveries.filter(d => !d.isActive);
    }
    
    renderDeliveries(filtered);
}

async function toggleDelivery(id, isActive) {
    if (!confirm(`Tem certeza que deseja ${isActive ? 'ativar' : 'desativar'} este entregador?`)) {
        return;
    }
    
    try {
        const token = sessionStorage.getItem('adminToken') || localStorage.getItem('adminToken');
        
        const response = await fetch(`${API_URL}/admin/deliveries/${id}/toggle`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ isActive })
        });
        
        const result = await response.json();
        
        if (result.success) {
            showNotification(`Entregador ${isActive ? 'ativado' : 'desativado'} com sucesso!`, 'success');
            await loadDeliveries();
            await loadStats();
        } else {
            showNotification(result.message, 'error');
        }
    } catch (error) {
        console.error('❌ Erro:', error);
        showNotification('Erro ao atualizar entregador', 'error');
    }
}

// ========================================
// PEDIDOS
// ========================================
async function loadOrders() {
    try {
        const token = sessionStorage.getItem('adminToken') || localStorage.getItem('adminToken');
        
        const response = await fetch(`${API_URL}/admin/orders`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        const result = await response.json();
        
        if (result.success) {
            allOrders = result.data;
            renderOrders(allOrders);
        }
    } catch (error) {
        console.error('❌ Erro ao carregar pedidos:', error);
    }
}

function renderOrders(orders) {
    const container = document.getElementById('ordersList');
    
    if (orders.length === 0) {
        container.innerHTML = '<p class="empty-message">Nenhum pedido encontrado.</p>';
        return;
    }
    
    const statusColors = {
        pending: '#ffa500',
        preparing: '#3498db',
        delivering: '#667eea',
        completed: '#48c774',
        cancelled: '#e74c3c'
    };
    
    const statusLabels = {
        pending: '🕐 Pendente',
        preparing: '👨‍🍳 Preparando',
        delivering: '🚚 Entregando',
        completed: '✅ Concluído',
        cancelled: '❌ Cancelado'
    };
    
    container.innerHTML = orders.map(order => {
        const date = new Date(order.createdAt).toLocaleString('pt-AO');
        
        return `
            <div class="list-item">
                <div class="list-item-info">
                    <div class="list-item-name">
                        Pedido #${order.id} - ${order.restaurant?.name || 'Restaurante'}
                    </div>
                    <div class="list-item-details">
                        👤 ${order.user?.name || 'Cliente'} | 
                        📅 ${date} | 
                        💰 Kz ${formatCurrency(order.total)} |
                        ${order.delivery ? `🛵 ${order.delivery.name}` : '⏳ Aguardando entregador'}
                    </div>
                </div>
                <span class="status-badge" style="background: ${statusColors[order.status]}20; color: ${statusColors[order.status]};">
                    ${statusLabels[order.status]}
                </span>
            </div>
        `;
    }).join('');
}

function filterOrders(filter) {
    // Atualizar botões
    document.querySelectorAll('#ordersSection .filter-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    event.target.classList.add('active');
    
    let filtered = allOrders;
    
    if (filter !== 'all') {
        filtered = allOrders.filter(o => o.status === filter);
    }
    
    renderOrders(filtered);
}

// ========================================
// RECEITA
// ========================================
async function loadRevenueSection() {
    try {
        const token = sessionStorage.getItem('adminToken') || localStorage.getItem('adminToken');
        
        const [statsResponse, chartResponse] = await Promise.all([
            fetch(`${API_URL}/admin/stats`, {
                headers: { 'Authorization': `Bearer ${token}` }
            }),
            fetch(`${API_URL}/admin/revenue-chart`, {
                headers: { 'Authorization': `Bearer ${token}` }
            })
        ]);
        
        const stats = await statsResponse.json();
        const chart = await chartResponse.json();
        
        if (stats.success) {
            renderRevenueBreakdown(stats.data.revenue);
        }
        
        if (chart.success) {
            renderPlatformRevenueChart(chart.data);
        }
    } catch (error) {
        console.error('❌ Erro:', error);
    }
}

function renderRevenueBreakdown(revenue) {
    const tbody = document.getElementById('revenueBreakdown');
    
    tbody.innerHTML = `
        <tr>
            <td><strong>Receita Total de Pedidos</strong></td>
            <td>Kz ${formatCurrency(revenue.total)}</td>
            <td style="color: #48c774; font-weight: bold;">Kz ${formatCurrency(revenue.platformTotal)}</td>
        </tr>
        <tr>
            <td><strong>Receita de Hoje</strong></td>
            <td>Kz ${formatCurrency(revenue.today)}</td>
            <td style="color: #48c774; font-weight: bold;">Kz ${formatCurrency(revenue.platformToday)}</td>
        </tr>
        <tr style="background: #f8f9fa; font-weight: bold;">
            <td><strong>📊 LUCRO TOTAL DA PLATAFORMA</strong></td>
            <td>-</td>
            <td style="color: #667eea; font-size: 1.2rem;">Kz ${formatCurrency(revenue.platformTotal)}</td>
        </tr>
    `;
}

function renderPlatformRevenueChart(data) {
    const ctx = document.getElementById('platformRevenueChart');
    
    if (platformRevenueChart) {
        platformRevenueChart.destroy();
    }
    
    const labels = data.map(d => {
        const date = new Date(d.date);
        return date.toLocaleDateString('pt-AO', { day: '2-digit', month: 'short' });
    });
    
    const platformRevenues = data.map(d => d.platformRevenue);
    
    platformRevenueChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: 'Lucro da Plataforma (20%)',
                data: platformRevenues,
                backgroundColor: 'rgba(102, 126, 234, 0.8)',
                borderColor: '#667eea',
                borderWidth: 2,
                borderRadius: 8,
                barThickness: 40
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            aspectRatio: 2.5,
            plugins: {
                legend: {
                    display: true,
                    labels: {
                        padding: 15,
                        font: {
                            size: 12,
                            weight: 'bold'
                        },
                        usePointStyle: true
                    }
                },
                tooltip: {
                    backgroundColor: 'rgba(0,0,0,0.8)',
                    padding: 12,
                    titleFont: {
                        size: 14,
                        weight: 'bold'
                    },
                    bodyFont: {
                        size: 13
                    },
                    callbacks: {
                        label: function(context) {
                            return 'Lucro: Kz ' + formatCurrency(context.parsed.y);
                        }
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        callback: function(value) {
                            return 'Kz ' + formatCurrency(value);
                        },
                        padding: 10,
                        font: {
                            size: 11
                        }
                    },
                    grid: {
                        color: 'rgba(0,0,0,0.05)',
                        drawBorder: false
                    }
                },
                x: {
                    grid: {
                        display: false,
                        drawBorder: false
                    },
                    ticks: {
                        padding: 10,
                        font: {
                            size: 11
                        }
                    }
                }
            }
        }
    });
}

// ========================================
// NAVEGAÇÃO
// ========================================
function showSection(section) {
    // Remover active de todas as seções
    document.querySelectorAll('.content-section').forEach(s => s.classList.remove('active'));
    document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
    
    // Ativar seção
    if (section === 'dashboard') {
        document.getElementById('dashboardSection').classList.add('active');
        document.querySelector('.nav-item:nth-child(1)').classList.add('active');
        document.getElementById('pageTitle').textContent = 'Dashboard';
        loadDashboard();
    } else if (section === 'restaurants') {
        document.getElementById('restaurantsSection').classList.add('active');
        document.querySelector('.nav-item:nth-child(2)').classList.add('active');
        document.getElementById('pageTitle').textContent = 'Gerenciar Restaurantes';
        loadRestaurants();
    } else if (section === 'deliveries') {
        document.getElementById('deliveriesSection').classList.add('active');
        document.querySelector('.nav-item:nth-child(3)').classList.add('active');
        document.getElementById('pageTitle').textContent = 'Gerenciar Entregadores';
        loadDeliveries();
    } else if (section === 'orders') {
        document.getElementById('ordersSection').classList.add('active');
        document.querySelector('.nav-item:nth-child(4)').classList.add('active');
        document.getElementById('pageTitle').textContent = 'Todos os Pedidos';
        loadOrders();
    } else if (section === 'pending-approvals') {
        document.getElementById('pendingApprovalsSection').classList.add('active');
        document.querySelector('.nav-item:nth-child(5)').classList.add('active');
        document.getElementById('pageTitle').textContent = 'Aprovar Pedidos';
        loadPendingOrders();
    } else if (section === 'revenue') {
        document.getElementById('revenueSection').classList.add('active');
        document.querySelector('.nav-item:nth-child(6)').classList.add('active');
        document.getElementById('pageTitle').textContent = 'Análise de Receita';
        loadRevenueSection();
    }
}
// ========================================
// UTILIDADES
// ========================================
function formatCurrency(value) {
    const num = parseFloat(value) || 0;
    return num.toFixed(2).replace('.', ',').replace(/\B(?=(\d{3})+(?!\d))/g, '.');
}

function updateCurrentDate() {
    const date = new Date();
    const options = { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
    };
    document.getElementById('currentDate').textContent = date.toLocaleDateString('pt-AO', options);
}

function logout() {
    if (!confirm('Tem certeza que deseja sair?')) return;
    
    sessionStorage.clear();
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminData');
    
    window.location.href = 'admin-login.html';
}

function showNotification(message, type) {
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
        font-weight: 600;
    `;
    
    notification.textContent = message;
    document.body.appendChild(notification);
    
    setTimeout(() => notification.remove(), 3000);
}
// Carregar contador de pedidos pendentes
async function loadPendingOrdersCount() {
    try {
        const token = sessionStorage.getItem('adminToken') || localStorage.getItem('adminToken');
        
        const response = await fetch(`${API_URL}/admin/pending-orders`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        const result = await response.json();
        
        if (result.success) {
            const count = result.data.length;
            const badge = document.getElementById('pendingBadge');
            
            if (count > 0) {
                badge.textContent = count;
                badge.style.display = 'inline-block';
            } else {
                badge.style.display = 'none';
            }
        }
    } catch (error) {
        console.error('❌ Erro ao carregar contador:', error);
    }
}

// Carregar pedidos pendentes
async function loadPendingOrders() {
    try {
        const token = sessionStorage.getItem('adminToken') || localStorage.getItem('adminToken');
        
        const response = await fetch(`${API_URL}/admin/pending-orders`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        const result = await response.json();
        
        if (result.success) {
            allPendingOrders = result.data;
            renderPendingOrders(allPendingOrders);
            
            // Atualizar badge
            const badge = document.getElementById('pendingBadge');
            if (allPendingOrders.length > 0) {
                badge.textContent = allPendingOrders.length;
                badge.style.display = 'inline-block';
            } else {
                badge.style.display = 'none';
            }
        }
    } catch (error) {
        console.error('❌ Erro ao carregar pedidos pendentes:', error);
    }
}

// Renderizar pedidos pendentes
function renderPendingOrders(orders) {
    const container = document.getElementById('pendingOrdersList');
    
    if (orders.length === 0) {
        container.innerHTML = `
            <div style="text-align: center; padding: 3rem; background: white; border-radius: 15px;">
                <div style="font-size: 4rem; margin-bottom: 1rem;">✅</div>
                <h3 style="color: #48c774; margin-bottom: 0.5rem;">Tudo em dia!</h3>
                <p style="color: #999;">Não há pedidos aguardando aprovação.</p>
            </div>
        `;
        return;
    }
    
    container.innerHTML = orders.map(order => {
        const date = new Date(order.createdAt).toLocaleString('pt-AO');
        const items = order.items || [];
        
        return `
            <div class="pending-order-card" style="background: white; padding: 2rem; border-radius: 15px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); margin-bottom: 1.5rem;">
                <!-- Header -->
                <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 1.5rem;">
                    <div>
                        <h3 style="color: #333; margin-bottom: 0.5rem;">
                            📦 Pedido #${order.id}
                            <span style="background: #ffa500; color: white; padding: 4px 12px; border-radius: 20px; font-size: 0.85rem; margin-left: 10px;">
                                ⏳ Aguardando
                            </span>
                        </h3>
                        <p style="color: #999; font-size: 0.9rem;">📅 ${date}</p>
                    </div>
                    <div style="text-align: right;">
                        <div style="font-size: 1.8rem; font-weight: bold; color: #667eea;">
                            Kz ${formatCurrency(order.total)}
                        </div>
                        <div style="color: #999; font-size: 0.85rem; margin-top: 0.3rem;">
                            💳 ${order.payment?.methodName || 'Pagamento na Entrega'}
                        </div>
                    </div>
                </div>

                <!-- Cliente -->
                <div style="background: #f8f9fa; padding: 1.5rem; border-radius: 10px; margin-bottom: 1.5rem;">
                    <h4 style="color: #333; margin-bottom: 1rem; display: flex; align-items: center; gap: 0.5rem;">
                        👤 Dados do Cliente
                    </h4>
                    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem;">
                        <div>
                            <strong style="color: #666;">Nome:</strong><br>
                            <span style="color: #333;">${order.user?.name || order.clientName || 'N/A'}</span>
                        </div>
                        <div>
                            <strong style="color: #666;">Telefone:</strong><br>
                            <span style="color: #333;">${order.user?.phone || order.clientPhone || 'N/A'}</span>
                        </div>
                        <div>
                            <strong style="color: #666;">Email:</strong><br>
                            <span style="color: #333;">${order.user?.email || 'N/A'}</span>
                        </div>
                    </div>
                </div>

                <!-- Endereço -->
                <div style="background: #e8f5e9; padding: 1.5rem; border-radius: 10px; margin-bottom: 1.5rem;">
                    <h4 style="color: #333; margin-bottom: 1rem; display: flex; align-items: center; gap: 0.5rem;">
                        📍 Endereço de Entrega
                    </h4>
                    <p style="color: #333; line-height: 1.6;">
                        ${order.address?.street || 'N/A'}, ${order.address?.number || ''}<br>
                        ${order.address?.neighborhood || ''} - ${order.address?.municipality || ''}<br>
                        ${order.address?.province || ''}<br>
                        ${order.address?.reference ? `<em style="color: #666;">Ref: ${order.address.reference}</em>` : ''}
                    </p>
                </div>

                <!-- Restaurante -->
                <div style="background: #fff3cd; padding: 1.5rem; border-radius: 10px; margin-bottom: 1.5rem;">
                    <h4 style="color: #333; margin-bottom: 1rem; display: flex; align-items: center; gap: 0.5rem;">
                        🍽️ Restaurante
                    </h4>
                    <div style="display: flex; align-items: center; gap: 1rem;">
                        ${order.restaurant?.image_url 
                            ? `<img src="${order.restaurant.image_url}" style="width: 60px; height: 60px; border-radius: 50%; object-fit: cover;" alt="${order.restaurant.name}">`
                            : `<div style="width: 60px; height: 60px; background: #667eea; color: white; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 1.5rem;">${order.restaurant?.icon || '🍽️'}</div>`
                        }
                        <div>
                            <strong style="color: #333; font-size: 1.1rem;">${order.restaurant?.name || 'Restaurante'}</strong><br>
                            <span style="color: #666; font-size: 0.9rem;">📞 ${order.restaurant?.phone || 'N/A'}</span>
                        </div>
                    </div>
                </div>

                <!-- Itens do Pedido -->
                <div style="background: #f0f9ff; padding: 1.5rem; border-radius: 10px; margin-bottom: 1.5rem;">
                    <h4 style="color: #333; margin-bottom: 1rem;">🛒 Itens do Pedido</h4>
                    ${items.map(item => `
                        <div style="display: flex; justify-content: space-between; padding: 0.75rem 0; border-bottom: 1px solid #e0e0e0;">
                            <div>
                                <strong style="color: #333;">${item.quantity}x ${item.name}</strong><br>
                                <span style="color: #999; font-size: 0.85rem;">Kz ${formatCurrency(item.price)} cada</span>
                            </div>
                            <div style="font-weight: bold; color: #667eea;">
                                Kz ${formatCurrency(parseFloat(item.price) * item.quantity)}
                            </div>
                        </div>
                    `).join('')}
                    
                    <div style="margin-top: 1rem; padding-top: 1rem; border-top: 2px solid #333;">
                        <div style="display: flex; justify-content: space-between; margin-bottom: 0.5rem;">
                            <span style="color: #666;">Subtotal:</span>
                            <span style="font-weight: bold;">Kz ${formatCurrency(order.subtotal)}</span>
                        </div>
                        <div style="display: flex; justify-content: space-between; margin-bottom: 0.5rem;">
                            <span style="color: #666;">Taxa de Entrega:</span>
                            <span style="font-weight: bold;">Kz ${formatCurrency(order.deliveryFee)}</span>
                        </div>
                        <div style="display: flex; justify-content: space-between; font-size: 1.2rem;">
                            <strong>TOTAL:</strong>
                            <strong style="color: #667eea;">Kz ${formatCurrency(order.total)}</strong>
                        </div>
                    </div>
                </div>

                <!-- Botões de Ação -->
                <div style="display: flex; gap: 1rem; justify-content: flex-end;">
                    <button onclick="rejectOrder(${order.id})" class="btn-reject" 
                            style="padding: 1rem 2rem; background: #e74c3c; color: white; border: none; border-radius: 10px; font-weight: 600; cursor: pointer; transition: all 0.3s;">
                        ❌ Rejeitar
                    </button>
                    <button onclick="approveOrder(${order.id})" class="btn-approve" 
                            style="padding: 1rem 2rem; background: #48c774; color: white; border: none; border-radius: 10px; font-weight: 600; cursor: pointer; transition: all 0.3s;">
                        ✅ Aprovar Pedido
                    </button>
                </div>
            </div>
        `;
    }).join('');
}

// Aprovar pedido
// Aprovar pedido
async function approveOrder(orderId) {
    if (!confirm('✅ Confirmar aprovação deste pedido?\n\nO pedido será enviado ao restaurante.')) {
        return;
    }
    
    // 🔕 PARAR SOM AO APROVAR
    stopAdminNotificationSound();
    
    try {
        const token = sessionStorage.getItem('adminToken') || localStorage.getItem('adminToken');
        
        const response = await fetch(`${API_URL}/admin/orders/${orderId}/approve`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
        
        const result = await response.json();
        
        if (result.success) {
            showNotification('✅ Pedido aprovado e enviado ao restaurante!', 'success');
            await loadPendingOrders();
            await loadStats();
        } else {
            showNotification(result.message, 'error');
        }
    } catch (error) {
        console.error('❌ Erro ao aprovar:', error);
        showNotification('Erro ao aprovar pedido', 'error');
    }
}

// Rejeitar pedido
// Rejeitar pedido
async function rejectOrder(orderId) {
    const reason = prompt('❌ Motivo da rejeição:\n\n(Obrigatório)');
    
    if (!reason || reason.trim() === '') {
        alert('⚠️ Motivo da rejeição é obrigatório!');
        return;
    }
    
    if (!confirm('❌ Confirmar rejeição deste pedido?')) {
        return;
    }
    
    // 🔕 PARAR SOM AO REJEITAR
    stopAdminNotificationSound();
    
    try {
        const token = sessionStorage.getItem('adminToken') || localStorage.getItem('adminToken');
        
        const response = await fetch(`${API_URL}/admin/orders/${orderId}/reject`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ reason: reason.trim() })
        });
        
        const result = await response.json();
        
        if (result.success) {
            showNotification('❌ Pedido rejeitado', 'error');
            await loadPendingOrders();
            await loadStats();
        } else {
            showNotification(result.message, 'error');
        }
    } catch (error) {
        console.error('❌ Erro ao rejeitar:', error);
        showNotification('Erro ao rejeitar pedido', 'error');
    }
}
// ========================================
// 🆕 SISTEMA DE SOM - NOTIFICAÇÕES ADMIN
// ========================================

function initSound() {
    sound = document.getElementById('newOrderSound');
    
    if (!sound) {
        console.warn('⚠️ Elemento de áudio não encontrado');
        createSoundElement();
    }
    
    console.log('🔊 Sistema de som do admin inicializado');
    
    createOrUpdateOverlay();
    setupSoundUnlockListeners();
}

function createSoundElement() {
    sound = document.createElement('audio');
    sound.id = 'newOrderSound';
    sound.preload = 'auto';
    sound.src = 'https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3';
    document.body.appendChild(sound);
    console.log('✅ Elemento de áudio criado');
}

function createOrUpdateOverlay() {
    let overlay = document.getElementById('soundUnlockOverlay');

    if (!overlay) {
        overlay = document.createElement('div');
        overlay.id = 'soundUnlockOverlay';
        document.body.appendChild(overlay);
    }

    overlay.style.cssText = `
        position: fixed;
        inset: 0;
        background: rgba(0,0,0,0.9);
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
        z-index: 999999;
        color: white;
        text-align: center;
    `;

    overlay.innerHTML = `
        <h2 style="font-size: 2rem; margin-bottom: 1rem;">🔔 Ativar Notificações Sonoras</h2>
        <p style="font-size: 1.1rem; margin-bottom: 2rem; opacity: 0.9;">Receba alertas quando novos pedidos precisarem de aprovação</p>
        <button id="unlockSoundBtn" style="
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            border: none;
            padding: 18px 40px;
            font-size: 1.2rem;
            border-radius: 12px;
            cursor: pointer;
            font-weight: bold;
            box-shadow: 0 5px 20px rgba(102, 126, 234, 0.4);
            transition: all 0.3s;
        ">
            🔓 ATIVAR ALERTAS SONOROS
        </button>
    `;

    const btn = document.getElementById('unlockSoundBtn');
    btn.onmouseover = () => btn.style.transform = 'scale(1.05)';
    btn.onmouseout = () => btn.style.transform = 'scale(1)';
}

function setupSoundUnlockListeners() {
    const btn = document.getElementById('unlockSoundBtn');

    if (!btn) {
        console.error('❌ Botão de desbloqueio não encontrado');
        return;
    }

    btn.onclick = null;

    const events = ['click', 'touchend'];

    events.forEach(eventType => {
        btn.addEventListener(
            eventType,
            function (e) {
                e.preventDefault();
                e.stopPropagation();
                unlockSoundManually();
            },
            { passive: false }
        );
    });

    console.log('✅ Event listeners configurados para som do admin');
}

function unlockSoundManually() {
    console.log('🔓 [ADMIN] Desbloqueando som...');
    
    if (!sound) {
        console.error('❌ Elemento de áudio não encontrado');
        alert('Erro: Áudio não carregado. Recarregue a página.');
        return;
    }
    
    const overlay = document.getElementById('soundUnlockOverlay');
    const btn = document.getElementById('unlockSoundBtn');
    
    if (btn) {
        btn.innerHTML = '⏳ Ativando...';
        btn.style.background = '#f39c12';
    }
    
    sound.volume = 0.1;
    sound.currentTime = 0;
    
    const playPromise = sound.play();
    
    if (playPromise !== undefined) {
        playPromise
            .then(() => {
                console.log('✅ [ADMIN] Som reproduzido com sucesso!');
                
                setTimeout(() => {
                    sound.pause();
                    sound.currentTime = 0;
                    sound.volume = 1.0;
                }, 100);
                
                soundUnlocked = true;
                
                if (overlay) {
                    overlay.style.opacity = '0';
                    overlay.style.transition = 'opacity 0.3s';
                    
                    setTimeout(() => {
                        overlay.remove();
                        console.log('✅ Overlay do admin removido');
                    }, 300);
                }
                
                showNotification('🔔 Alertas sonoros ativados! Você será notificado de novos pedidos.', 'success');
            })
            .catch(error => {
                console.error('❌ [ADMIN] Falha ao reproduzir:', error);
                
                if (btn) {
                    btn.innerHTML = '❌ ERRO - Toque Novamente';
                    btn.style.background = '#e74c3c';
                    
                    setTimeout(() => {
                        btn.innerHTML = '🔓 ATIVAR ALERTAS SONOROS';
                        btn.style.background = 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
                    }, 2000);
                }
                
                alert('Erro ao ativar som. Por favor, toque novamente no botão.');
            });
    }
}

function playAdminNotificationSound() {
    if (!sound || !soundUnlocked) {
        console.log('🔇 Som do admin não desbloqueado ainda');
        return;
    }

    try {
        sound.pause();
        sound.currentTime = 0;
        sound.volume = 1.0;
        
        sound.play().catch(error => {
            console.warn('🔇 Erro ao tocar som do admin:', error);
        });
        
        console.log('🔔 Som de novo pedido tocando (ADMIN)');
    } catch (err) {
        console.error('❌ Erro ao tocar som do admin:', err);
    }
}
function stopAdminNotificationSound() {
    if (!sound) {
        console.log('⚠️ Elemento de som não encontrado');
        return;
    }

    try {
        sound.pause();
        sound.currentTime = 0;
        sound.load();
        console.log('🔕 Som do admin interrompido');
    } catch (err) {
        console.error('❌ Erro ao parar som:', err);
    }
}

function showAdminOrderNotification(qtd) {
    const note = document.createElement('div');
    note.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: linear-gradient(135deg, #ff6b35, #f7b731);
        color: white;
        padding: 20px 25px;
        border-radius: 12px;
        box-shadow: 0 10px 30px rgba(255, 107, 53, 0.4);
        z-index: 10000;
        font-weight: bold;
        font-size: 1.1rem;
        animation: slideInRight 0.3s, pulse 2s infinite;
        border: 2px solid white;
    `;

    note.innerHTML = `
        <div style="display: flex; align-items: center; gap: 12px;">
            <span style="font-size: 2rem;">⏳</span>
            <div>
                <div style="font-size: 1.2rem; margin-bottom: 5px;">Novo Pedido!</div>
                <div style="font-size: 0.9rem; opacity: 0.95;">${qtd} pedido(s) aguardando aprovação</div>
            </div>
        </div>
    `;
    
    document.body.appendChild(note);

    setTimeout(() => {
        note.style.animation = 'slideOutRight 0.3s';
        setTimeout(() => note.remove(), 300);
    }, 5000);
}

// 🔔 Verificar novos pedidos pendentes

async function checkNewPendingOrdersWithSound() {
    console.log('🔍 [DEBUG] Verificando pedidos pendentes...', {
        soundUnlocked: soundUnlocked,
        lastPendingCount: lastPendingCount
    });
    
    if (!soundUnlocked) {
        console.log('🔇 Som do admin ainda não desbloqueado');
        return;
    }
    
    try {
        const token = sessionStorage.getItem('adminToken') || localStorage.getItem('adminToken');
        if (!token) {
            console.log('⚠️ Sem token de admin');
            return;
        }

        console.log('📡 Fazendo requisição para /admin/pending-orders...');

        const response = await fetch(`${API_URL}/admin/pending-orders`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        const result = await response.json();
        
        console.log('📥 Resposta da API:', result);

        if (result.success) {
            const pendingOrders = result.data;
            const currentCount = pendingOrders.length;

            console.log(`📊 Contadores:`, {
                currentCount: currentCount,
                lastPendingCount: lastPendingCount,
                diferença: currentCount - lastPendingCount
            });

            // 🆕 LÓGICA CORRIGIDA: Detectar se há novos pedidos
            const hasNewOrders = currentCount > lastPendingCount && lastPendingCount >= 0;

            if (hasNewOrders) {
                const qtd = currentCount - lastPendingCount;
                console.log(`🔔🔔🔔 [ADMIN] ${qtd} NOVO(S) PEDIDO(S) DETECTADO(S)!`);
                
                console.log('🔊 Tentando tocar som...');
                playAdminNotificationSound();
                
                console.log('📢 Mostrando notificação visual...');
                showAdminOrderNotification(qtd);
                
                // Atualizar badge
                const badge = document.getElementById('pendingBadge');
                if (badge && currentCount > 0) {
                    badge.textContent = currentCount;
                    badge.style.display = 'inline-block';
                    console.log('✅ Badge atualizado:', currentCount);
                }
                
                // Recarregar se estiver na seção de aprovações
                const pendingSection = document.getElementById('pendingApprovalsSection');
                if (pendingSection && pendingSection.classList.contains('active')) {
                    console.log('🔄 Recarregando lista de pedidos pendentes...');
                    await loadPendingOrders();
                }
            } else {
                console.log('ℹ️ Nenhum novo pedido detectado (currentCount:', currentCount, 'lastPendingCount:', lastPendingCount, ')');
            }

            // Atualizar contador (sempre no final)
            lastPendingCount = currentCount;
            console.log('📊 lastPendingCount atualizado para:', lastPendingCount);

        } else {
            console.error('❌ Erro na resposta da API:', result.message);
        }

    } catch (error) {
        console.error('❌ [ADMIN] Erro ao verificar pedidos pendentes:', error);
    }
}

// Adicionar animação de pulso
const adminSoundStyle = document.createElement('style');
adminSoundStyle.textContent = `
    @keyframes pulse {
        0%, 100% { transform: scale(1); }
        50% { transform: scale(1.05); }
    }
`;
document.head.appendChild(adminSoundStyle);