// ========================================
// VARIÁVEIS GLOBAIS
// ========================================
let lastOrderCount = 0;
let sound = null;
let soundUnlocked = false;

// FUNÇÃO PARA PEGAR A URL DO SERVIDOR (RAILWAY OU LOCAL)
function getServerURL() {
    const isLocal = window.location.hostname === "localhost" || 
                   window.location.hostname === "127.0.0.1";
    
    // Retorna a URL do Railway se não estiver em localhost
    return isLocal ? "http://localhost:3000" : "https://e-food-production.up.railway.app";
}

const socketURL = getServerURL();
// Adicionamos { transports: ['websocket'] } para evitar erros de CORS e Proxy no Vercel
const socket = io(socketURL, {
    transports: ['websocket']
});

console.log("🔌 Socket tentando conectar a:", socketURL);


// Dados do restaurante atual
let currentRestaurant = null;
let restaurantMenu = [];
let restaurantOrders = [];
let currentOrderFilter = 'all';

// ========================================
// FORMATAR MOEDA ANGOLANA
// ========================================
function formatCurrency(value) {
    const numValue = parseFloat(value) || 0;
    if (isNaN(numValue)) {
        console.warn('Valor inválido para formatCurrency:', value);
        return '0,00';
    }
    return numValue.toFixed(2).replace('.', ',').replace(/\B(?=(\d{3})+(?!\d))/g, '.');
}

// ========================================
// FORMATAR DATA
// ========================================
function formatDate(dateString) {
    if (!dateString) return 'Data não disponível';
    try {
        const date = new Date(dateString);
        if (isNaN(date.getTime())) {
            console.error('Data inválida:', dateString);
            return 'Data inválida';
        }
        return date.toLocaleString('pt-AO', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    } catch (error) {
        console.error('Erro ao formatar data:', error);
        return 'Erro na data';
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

// Preview da imagem do restaurante
function previewRestaurantImage(event) {
    const file = event.target.files[0];
    const preview = document.getElementById('restaurantImagePreview');
    
    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            preview.innerHTML = `
                <div style="position: relative; display: inline-block;">
                    <img src="${e.target.result}" style="max-width: 200px; max-height: 200px; border-radius: 8px; object-fit: cover; border: 2px solid #ddd;">
                    <button type="button" onclick="clearRestaurantImage()" style="position: absolute; top: 5px; right: 5px; background: #e74c3c; color: white; border: none; border-radius: 50%; width: 30px; height: 30px; cursor: pointer; font-size: 18px; line-height: 1;">×</button>
                </div>
            `;
        };
        reader.readAsDataURL(file);
    }
}

// Preview da imagem do prato
function previewDishImage(event) {
    const file = event.target.files[0];
    const preview = document.getElementById('dishImagePreview');
    
    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            preview.innerHTML = `
                <div style="position: relative; display: inline-block;">
                    <img src="${e.target.result}" style="max-width: 200px; max-height: 200px; border-radius: 8px; object-fit: cover; border: 2px solid #ddd;">
                    <button type="button" onclick="clearDishImage()" style="position: absolute; top: 5px; right: 5px; background: #e74c3c; color: white; border: none; border-radius: 50%; width: 30px; height: 30px; cursor: pointer; font-size: 18px; line-height: 1;">×</button>
                </div>
            `;
        };
        reader.readAsDataURL(file);
    }
}

// Limpar preview do restaurante
function clearRestaurantImage() {
    document.getElementById('settingsImage').value = '';
    document.getElementById('restaurantImagePreview').innerHTML = '';
}

// Limpar preview do prato
function clearDishImage() {
    document.getElementById('dishImage').value = '';
    document.getElementById('dishImagePreview').innerHTML = '';
}

// ========================================
// SISTEMA DE SOM - CORREÇÃO COMPLETA
// ========================================

function initSound() {
    sound = document.getElementById('newOrderSound');
    
    if (!sound) {
        console.warn('⚠️ Elemento de áudio não encontrado');
        createSoundElement();
    }
    
    console.log('🔊 Sistema de som inicializado');
    
    // Criar overlay se não existir
    createOrUpdateOverlay();
    
    // Múltiplos event listeners para garantir funcionamento
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

    overlay.style = `
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
        <h2>🔊 Ativar Alertas Sonoros</h2>
        <p>Toque no botão para permitir alertas de novos pedidos</p>
        <button id="unlockSoundBtn"
            style="
            background:#27ae60;
            color:white;
            border:none;
            padding:15px 30px;
            margin-top:20px;
            font-size:18px;
            border-radius:10px;
            cursor:pointer;">
            🔓 ATIVAR SOM
        </button>
    `;

    document.getElementById('unlockSoundBtn').onclick = unlockSoundManually;
}


function setupSoundUnlockListeners() {
    const overlay = document.getElementById('soundUnlockOverlay');
    const btn = document.getElementById('unlockSoundBtn');

    if (!overlay || !btn) {
        console.error('❌ Overlay ou botão não encontrados');
        return;
    }

    // Garante que não tenha click antigo "preso"
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

    console.log('✅ Event listeners configurados para o botão de som');
}


function unlockSoundManually() {
    console.log('🔓 [INÍCIO] Desbloqueando som...');
    
    if (!sound) {
        console.error('❌ Elemento de áudio não encontrado');
        alert('Erro: Áudio não carregado. Recarregue a página.');
        return;
    }
    
    // Mostrar feedback visual imediato
    const overlay = document.getElementById('soundUnlockOverlay');
    const btn = document.getElementById('unlockSoundBtn');
    
    if (btn) {
        btn.innerHTML = '⏳ Ativando...';
        btn.style.background = '#f39c12';
    }
    
    // Configurar e tentar reproduzir
    sound.volume = 0.1; // Volume baixo para teste
    sound.currentTime = 0;
    
    const playPromise = sound.play();
    
    if (playPromise !== undefined) {
        playPromise
            .then(() => {
                console.log('✅ [SUCESSO] Som reproduzido!');
                
                // Parar imediatamente
                setTimeout(() => {
                    sound.pause();
                    sound.currentTime = 0;
                    sound.volume = 1.0;
                }, 100);
                
                soundUnlocked = true;
                
                // Remover overlay
                if (overlay) {
                    overlay.style.opacity = '0';
                    overlay.style.transition = 'opacity 0.3s';
                    
                    setTimeout(() => {
                        overlay.remove();
                        console.log('✅ Overlay removido');
                    }, 300);
                }
                
                showNotification('🔊 Alertas sonoros ativados com sucesso!', 'success');
            })
            .catch(error => {
                console.error('❌ [ERRO] Falha ao reproduzir:', error);
                
                if (btn) {
                    btn.innerHTML = '❌ ERRO - Toque Novamente';
                    btn.style.background = '#e74c3c';
                    
                    setTimeout(() => {
                        btn.innerHTML = '🔓 ATIVAR SOM';
                        btn.style.background = '#27ae60';
                    }, 2000);
                }
                
                alert('Erro ao ativar som. Por favor, toque novamente no botão.');
            });
    } else {
        console.error('❌ Play() não retornou Promise');
        alert('Erro: Navegador não suporta áudio. Use outro navegador.');
    }
}

async function checkNewOrdersWithSound() {
    if (!soundUnlocked) {
        console.log('🔇 Som ainda não desbloqueado');
        return;
    }
    
    try {
        const token = sessionStorage.getItem('restaurantToken') || localStorage.getItem('restaurantToken');
        if (!token) return;

        const response = await OrderAPI.getRestaurantOrders(token);

        if (response.success) {
            const orders = response.data;
            const newOrders = orders.filter(o => o.status === 'pending');

            // Primeira verificação: só guarda
            if (lastOrderCount === 0) {
                lastOrderCount = newOrders.length;
                console.log(`📊 Contador inicial: ${lastOrderCount} pedidos pendentes`);
                return;
            }

            // Novo pedido chegou!
            if (newOrders.length > lastOrderCount) {
                const qtd = newOrders.length - lastOrderCount;
                console.log(`🔔 ${qtd} NOVO(S) PEDIDO(S) DETECTADO(S)!`);
                
                playNewOrderSound();
                showOrderNotification(qtd);
                
                // Recarregar pedidos
                await loadRestaurantOrders();
                await updateStats();
            }

            lastOrderCount = newOrders.length;
        }

    } catch (error) {
        console.error('❌ Erro ao verificar novos pedidos:', error);
    }
}

function playNewOrderSound() {
    if (!sound || !soundUnlocked) {
        console.log('🔇 Som não desbloqueado ainda');
        return;
    }

    try {
        sound.pause();
        sound.currentTime = 0;
        sound.volume = 1.0;
        
        sound.play().catch(error => {
            console.warn('🔇 Erro ao tocar som:', error);
        });
        
        console.log('🔔 Som de novo pedido tocando');
    } catch (err) {
        console.error('❌ Erro ao tocar som:', err);
    }
}

function stopNewOrderSound() {
    if (!sound) return;

    sound.pause();
    sound.currentTime = 0;
    sound.load();
    console.log('🔕 Som interrompido');
}

function showOrderNotification(qtd) {
    const note = document.createElement('div');
    note.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: #27ae60;
        color: white;
        padding: 15px 20px;
        border-radius: 10px;
        box-shadow: 0 5px 15px rgba(0,0,0,0.3);
        z-index: 9999;
        font-weight: bold;
        animation: slideInRight 0.3s;
    `;

    note.innerHTML = `🔔 ${qtd} novo(s) pedido(s) recebido(s)!`;
    document.body.appendChild(note);

    setTimeout(() => {
        note.style.animation = 'slideOutRight 0.3s';
        setTimeout(() => note.remove(), 300);
    }, 4000);
}

// ========================================
// CARREGAR DADOS DO RESTAURANTE
// ========================================
async function loadRestaurantData() {
    const restaurantData = sessionStorage.getItem('currentRestaurant') || localStorage.getItem('currentRestaurant');
    
    if (!restaurantData) {
        sessionStorage.setItem('redirectAfterLogin', 'restaurant-dashboard.html');
        window.location.href = 'restaurant-login.html';
        return;
    }
    
    currentRestaurant = JSON.parse(restaurantData);
    const token = sessionStorage.getItem('restaurantToken') || localStorage.getItem('restaurantToken');
    
    console.log('🍽️ Restaurante logado:', currentRestaurant.name);
    
    // Atualizar avatar com imagem ou emoji
    const restaurantAvatarEl = document.getElementById('restaurantAvatar');
    if (restaurantAvatarEl) {
        if (currentRestaurant.image_url) {
            restaurantAvatarEl.innerHTML = `<img src="${currentRestaurant.image_url}" style="width: 100%; height: 100%; object-fit: cover; border-radius: 50%;">`;
        } else {
            restaurantAvatarEl.textContent = currentRestaurant.icon;
        }
    } else {
        console.warn('⚠️ Elemento #restaurantAvatar não encontrado');
    }
    
    const restaurantNameEl = document.getElementById('restaurantName');
    if (restaurantNameEl) {
        restaurantNameEl.textContent = currentRestaurant.name;
    } else {
        console.warn('⚠️ Elemento #restaurantName não encontrado');
    }
    
    const restaurantCategoryEl = document.getElementById('restaurantCategory');
    if (restaurantCategoryEl) {
        restaurantCategoryEl.textContent = currentRestaurant.category;
    } else {
        console.warn('⚠️ Elemento #restaurantCategory não encontrado');
    }
    
    // Preencher formulário de configurações
    const settingsElements = {
        settingsName: currentRestaurant.name,
        settingsIcon: currentRestaurant.icon || '🍽️',
        settingsCategory: currentRestaurant.category,
        settingsCuisine: currentRestaurant.cuisine,
        settingsMinTime: currentRestaurant.minTime || 30,
        settingsMaxTime: currentRestaurant.maxTime || 40,
        settingsAddress: currentRestaurant.address || '',
        settingsPhone: currentRestaurant.phone || ''
    };
    
    Object.keys(settingsElements).forEach(id => {
        const element = document.getElementById(id);
        if (element) {
            element.value = settingsElements[id];
        } else {
            console.warn(`⚠️ Elemento #${id} não encontrado`);
        }
    });
    
    // Mostrar preview da imagem se existir
    if (currentRestaurant.image_url) {
        document.getElementById('restaurantImagePreview').innerHTML = `
            <div style="position: relative; display: inline-block;">
                <img src="${currentRestaurant.image_url}" style="max-width: 200px; max-height: 200px; border-radius: 8px; object-fit: cover; border: 2px solid #ddd;">
                <button type="button" onclick="clearRestaurantImage()" style="position: absolute; top: 5px; right: 5px; background: #e74c3c; color: white; border: none; border-radius: 50%; width: 30px; height: 30px; cursor: pointer; font-size: 18px; line-height: 1;">×</button>
            </div>
        `;
    }
    
    // Carregar dados da API
    await loadRestaurantMenu();
    await loadRestaurantOrders();
    await updateStats();
    await loadRatingsAndFeedbacks(); 

    socket.emit('joinRestaurant', currentRestaurant.id);
    document.body.classList.remove('overlay-active');
   

}

// ========================================
// CARREGAR AVALIAÇÕES E FEEDBACKS
// ========================================
async function loadRatingsAndFeedbacks() {
    try {
        console.log('📊 Carregando avaliações...');
        
        const ratedOrders = restaurantOrders.filter(order => order.rating && order.rating > 0);
        
        if (ratedOrders.length > 0) {
            const totalRating = ratedOrders.reduce((sum, order) => sum + order.rating, 0);
            const averageRating = totalRating / ratedOrders.length;
            
            currentRestaurant.rating = averageRating;
            currentRestaurant.totalRatings = ratedOrders.length;
            
            console.log('✅ Avaliações calculadas:', {
                média: averageRating.toFixed(1),
                total: ratedOrders.length
            });
        } else {
            currentRestaurant.rating = 0;
            currentRestaurant.totalRatings = 0;
            console.log('⚠️ Nenhuma avaliação encontrada');
        }
        
        updateRatingSummary();
        renderFeedbacks(restaurantOrders);
        
    } catch (error) {
        console.error('❌ Erro ao carregar avaliações:', error);
    }
}

// ========================================
// ATUALIZAR RESUMO DE AVALIAÇÃO
// ========================================
function updateRatingSummary() {
    const rating = parseFloat(currentRestaurant.rating) || 0;
    const totalRatings = currentRestaurant.totalRatings || 0;
    
    const ratingNumberEl = document.getElementById('restaurantRatingNumber');
    if (ratingNumberEl) {
        ratingNumberEl.textContent = rating.toFixed(1);
    }
    
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;
    const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);
    
    let starsHtml = '★'.repeat(fullStars);
    if (hasHalfStar) starsHtml += '⯨';
    starsHtml += '☆'.repeat(emptyStars);
    
    const ratingStarsEl = document.getElementById('restaurantRatingStars');
    if (ratingStarsEl) {
        ratingStarsEl.textContent = starsHtml;
    }
    
    const countText = totalRatings === 0 ? 'Nenhuma avaliação' : 
                     totalRatings === 1 ? '1 avaliação' : 
                     `${totalRatings} avaliações`;
    
    const ratingCountEl = document.getElementById('restaurantRatingCount');
    if (ratingCountEl) {
        ratingCountEl.textContent = countText;
    }
}

// ========================================
// RENDERIZAR FEEDBACKS
// ========================================
function renderFeedbacks(orders) {
    const container = document.getElementById('feedbacksList');
    
    if (!container) {
        console.warn('⚠️ Elemento #feedbacksList não encontrado');
        return;
    }
    
    const feedbacks = orders.filter(order => order.rating && order.rating > 0);
    
    if (feedbacks.length === 0) {
        container.innerHTML = `
            <div class="empty-feedbacks">
                <div class="empty-feedbacks-icon">💬</div>
                <p>Ainda não há avaliações</p>
                <p style="font-size: 0.9rem; color: #999;">Suas primeiras avaliações aparecerão aqui</p>
            </div>
        `;
        return;
    }
    
    feedbacks.sort((a, b) => new Date(b.ratedAt || b.createdAt) - new Date(a.ratedAt || a.createdAt));
    
    container.innerHTML = feedbacks.map(order => {
        const ratingStars = '★'.repeat(order.rating) + '☆'.repeat(5 - order.rating);
        const userName = order.clientName || order.user?.name || 'Cliente';
        const userInitial = userName.charAt(0).toUpperCase();
        const ratedDate = new Date(order.ratedAt || order.createdAt).toLocaleDateString('pt-AO', {
            day: '2-digit',
            month: 'short',
            year: 'numeric'
        });
        
        return `
            <div class="feedback-card">
                <div class="feedback-header">
                    <div class="feedback-user">
                        <div class="feedback-avatar">${userInitial}</div>
                        <div class="feedback-user-info">
                            <div class="feedback-user-name">${userName}</div>
                            <div class="feedback-date">${ratedDate}</div>
                        </div>
                    </div>
                    <div class="feedback-rating" style="color: #ffa500;">
                        ${ratingStars}
                    </div>
                </div>
                ${order.ratingComment ? `
                    <div class="feedback-comment">"${order.ratingComment}"</div>
                ` : ''}
                <div class="feedback-order">
                    Pedido #${order.id} - ${order.items.length} ${order.items.length === 1 ? 'item' : 'itens'}
                </div>
            </div>
        `;
    }).join('');
}

// ========================================
// NAVEGAÇÃO
// ========================================
function showSection(section) {
    document.querySelectorAll('.content-section').forEach(s => s.classList.remove('active'));
    document.querySelectorAll('.menu-item').forEach(item => item.classList.remove('active'));
    
    if (section === 'overview') {
        document.getElementById('overviewSection').classList.add('active');
        document.querySelector('.menu-item:nth-child(1)').classList.add('active');
    } else if (section === 'orders') {
        document.getElementById('ordersSection').classList.add('active');
        document.querySelector('.menu-item:nth-child(2)').classList.add('active');
    } else if (section === 'menu') {
        document.getElementById('menuSection').classList.add('active');
        document.querySelector('.menu-item:nth-child(3)').classList.add('active');
    } else if (section === 'settings') {
        document.getElementById('settingsSection').classList.add('active');
        document.querySelector('.menu-item:nth-child(4)').classList.add('active');
    }
}

// ========================================
// ESTATÍSTICAS
// ========================================
async function updateStats() {
    try {
        const token = sessionStorage.getItem('restaurantToken') || localStorage.getItem('restaurantToken');
        
        if (!token) {
            console.log('⚠️ Sem token para buscar estatísticas');
            return;
        }
        
        const response = await OrderAPI.getRestaurantStats(token);
        
        if (response.success && response.data) {
            const stats = response.data;
            
            document.getElementById('todayOrders').textContent = stats.todayOrders || 0;
            document.getElementById('todayRevenue').textContent = `Kz ${formatCurrency(stats.todayRevenue || 0)}`;
            const ratingValue = Number(currentRestaurant.rating);
            document.getElementById('rating').textContent = !isNaN(ratingValue) ? ratingValue.toFixed(1) : '0.0';
            document.getElementById('menuCount').textContent = restaurantMenu.length;
            
            console.log('✅ Estatísticas atualizadas');
        }
    } catch (error) {
        console.error('❌ Erro ao buscar estatísticas:', error);
    }
    
    renderRecentOrders();
}

// Renderizar pedidos recentes
function renderRecentOrders() {
    const recentOrdersList = document.getElementById('recentOrdersList');
    const recentOrders = restaurantOrders.slice(0, 5);
    
    if (recentOrders.length === 0) {
        recentOrdersList.innerHTML = '<p class="empty-message">Nenhum pedido recente</p>';
        return;
    }
    
    recentOrdersList.innerHTML = '';
    
    recentOrders.forEach(order => {
        const orderDiv = document.createElement('div');
        orderDiv.style.cssText = 'padding: 1rem; background: white; border-radius: 8px; margin-bottom: 0.8rem; border-left: 3px solid #ff6b35;';
        
        const orderDate = formatDate(order.createdAt);
        
        orderDiv.innerHTML = `
            <div style="display: flex; justify-content: space-between; margin-bottom: 0.5rem;">
                <strong>Pedido #${order.id}</strong>
                <span style="color: #ff6b35; font-weight: bold;">Kz ${formatCurrency(order.total)}</span>
            </div>
            <div style="color: #666; font-size: 0.9rem;">${orderDate}</div>
            <div style="color: #999; font-size: 0.85rem; margin-top: 0.3rem;">${order.items.length} itens - ${getStatusText(order.status)}</div>
        `;
        
        recentOrdersList.appendChild(orderDiv);
    });
}

// Obter texto do status
function getStatusText(status) {
    const texts = {
        pending: '🕐 Pendente',
        preparing: '👨‍🍳 Preparando',
        delivering: '🚚 Entregando',
        completed: '✅ Concluído',
        cancelled: '❌ Cancelado'
    };
    return texts[status] || status;
}

// ========================================
// CARDÁPIO
// ========================================
async function loadRestaurantMenu() {
    try {
        const response = await MenuAPI.getByRestaurant(currentRestaurant.id);
        
        if (response.success && response.data) {
            restaurantMenu = response.data;
            console.log('✅ Cardápio carregado da API:', restaurantMenu.length, 'itens');
            renderRestaurantMenu();
        } else {
            console.log('⚠️ Nenhum item no cardápio');
            restaurantMenu = [];
            renderRestaurantMenu();
        }
    } catch (error) {
        console.error('❌ Erro ao carregar cardápio:', error);
        restaurantMenu = [];
        renderRestaurantMenu();
    }
}

function renderRestaurantMenu() {
    const menuGrid = document.getElementById('restaurantMenuGrid');
    
    if (restaurantMenu.length === 0) {
        menuGrid.innerHTML = '<p class="empty-message">Nenhum prato cadastrado ainda</p>';
        return;
    }
    
    menuGrid.innerHTML = '';
    
    restaurantMenu.forEach((item, index) => {
        const card = document.createElement('div');
        card.className = 'menu-item-card';
        
        // Exibir imagem ou emoji
        const displayImage = item.image_url 
            ? `<img src="${item.image_url}" style="width: 100%; height: 100%; object-fit: cover; border-radius: 8px;">`
            : item.icon;
        
        card.innerHTML = `
            <div class="menu-item-image-dash">${displayImage}</div>
            <div class="menu-item-info-dash">
                <div class="menu-item-name-dash">${item.name}</div>
                <div class="menu-item-desc-dash">${item.description}</div>
                <div class="menu-item-footer-dash">
                    <div class="menu-item-price-dash">Kz ${formatCurrency(item.price)}</div>
                    <div class="menu-item-actions">
                        <button class="btn-small btn-edit" onclick="editMenuItem(${index})">Editar</button>
                        <button class="btn-small btn-delete" onclick="deleteMenuItem(${index})">Excluir</button>
                    </div>
                </div>
            </div>
        `;
        
        menuGrid.appendChild(card);
    });
}

function showAddMenuItemModal() {
    document.getElementById('addMenuModal').classList.add('active');
    document.getElementById('addMenuForm').reset();
    document.getElementById('dishImagePreview').innerHTML = '';
}

function closeAddMenuModal() {
    document.getElementById('addMenuModal').classList.remove('active');
}

async function addMenuItem(event) {
    event.preventDefault();
    
    const token = sessionStorage.getItem('restaurantToken') || localStorage.getItem('restaurantToken');
    
    if (!token) {
        alert('❌ Erro: Token não encontrado. Faça login novamente.');
        return;
    }
    
    // Validar imagem obrigatória
    const imageFile = document.getElementById('dishImage').files[0];
    if (!imageFile) {
        alert('❌ Por favor, selecione uma imagem para o prato!');
        return;
    }
    
    // Converter imagem para Base64
    const image_url = await convertImageToBase64(imageFile);
    
    const newItem = {
        name: document.getElementById('dishName').value,
        description: document.getElementById('dishDescription').value,
        price: parseFloat(document.getElementById('dishPrice').value),
        category: document.getElementById('dishCategory').value,
        icon: document.getElementById('dishIcon').value || '🍽️',
        image_url: image_url
    };
    
    console.log('📤 Adicionando prato:', newItem);
    
    try {
        const response = await MenuAPI.create(newItem, token);
        
        if (response.success) {
            console.log('✅ Prato adicionado na API');
            
            await loadRestaurantMenu();
            await updateStats();
            
            closeAddMenuModal();
            showNotification('✅ Prato adicionado com sucesso!', 'success');
        } else {
            alert('❌ Erro ao adicionar prato: ' + response.message);
        }
    } catch (error) {
        console.error('❌ Erro ao adicionar prato:', error);
        alert('❌ Erro ao conectar com o servidor');
    }
}

async function editMenuItem(index) {
    const item = restaurantMenu[index];
    const token = sessionStorage.getItem('restaurantToken') || localStorage.getItem('restaurantToken');
    
    if (!token) {
        alert('❌ Erro: Token não encontrado');
        return;
    }
    
    const name = prompt('Nome do prato:', item.name);
    if (!name) return;
    
    const description = prompt('Descrição:', item.description);
    if (!description) return;
    
    const price = prompt('Preço (Kz):', item.price);
    if (!price) return;
    
    const icon = prompt('Ícone (emoji):', item.icon);
    if (!icon) return;
    
    const updatedData = {
        name,
        description,
        price: parseFloat(price),
        icon
    };
    
    console.log('📤 Atualizando prato ID:', item.id);
    
    try {
        const response = await MenuAPI.update(item.id, updatedData, token);
        
        if (response.success) {
            console.log('✅ Prato atualizado na API');
            
            await loadRestaurantMenu();
            showNotification('✅ Prato atualizado!', 'success');
        } else {
            alert('❌ Erro ao atualizar prato: ' + response.message);
        }
    } catch (error) {
        console.error('❌ Erro ao atualizar prato:', error);
        alert('❌ Erro ao conectar com o servidor');
    }
}

async function deleteMenuItem(index) {
    if (!confirm('Tem certeza que deseja excluir este prato?')) return;
    
    const item = restaurantMenu[index];
    const token = sessionStorage.getItem('restaurantToken') || localStorage.getItem('restaurantToken');
    
    if (!token) {
        alert('❌ Erro: Token não encontrado');
        return;
    }
    
    console.log('📤 Deletando prato ID:', item.id);
    
    try {
        const response = await MenuAPI.delete(item.id, token);
        
        if (response.success) {
            console.log('✅ Prato deletado na API');
            
            await loadRestaurantMenu();
            await updateStats();
            showNotification('✅ Prato excluído!', 'success');
        } else {
            alert('❌ Erro ao deletar prato: ' + response.message);
        }
    } catch (error) {
        console.error('❌ Erro ao deletar prato:', error);
        alert('❌ Erro ao conectar com o servidor');
    }
}

// ========================================
// PEDIDOS
// ========================================
async function loadRestaurantOrders() {
    try {
        const token = sessionStorage.getItem('restaurantToken') || localStorage.getItem('restaurantToken');
        
        if (!token) {
            console.log('⚠️ Sem token de restaurante');
            restaurantOrders = [];
            filterRestaurantOrders('all');
            return;
        }
        
        const response = await OrderAPI.getRestaurantOrders(token);
        
        if (response.success && response.data) {
            restaurantOrders = response.data;
            console.log('✅ Pedidos carregados da API:', restaurantOrders.length);
            filterRestaurantOrders('all');
        } else {
            console.log('⚠️ Nenhum pedido encontrado');
            restaurantOrders = [];
            filterRestaurantOrders('all');
        }
    } catch (error) {
        console.error('❌ Erro ao carregar pedidos:', error);
        restaurantOrders = [];
        filterRestaurantOrders('all');
    }
}

function filterRestaurantOrders(filter) {
    currentOrderFilter = filter;
    
    document.querySelectorAll('.orders-filters .filter-btn').forEach(btn => {
        btn.classList.remove('active');
        if (btn.getAttribute('data-filter') === filter || 
            (filter === 'all' && btn.textContent.includes('Todos'))) {
            btn.classList.add('active');
        }
    });
    
    renderRestaurantOrders(filter);
}

function renderRestaurantOrders(filter) {
    const ordersList = document.getElementById('restaurantOrdersList');
    
    let filteredOrders = filter === 'all' 
        ? restaurantOrders 
        : restaurantOrders.filter(o => o.status === filter);
    
    if (filteredOrders.length === 0) {
        ordersList.innerHTML = '<p class="empty-message">Nenhum pedido encontrado</p>';
        return;
    }
    
    ordersList.innerHTML = '';
    
    filteredOrders.forEach(order => {
        const orderCard = document.createElement('div');
        orderCard.className = 'order-card-restaurant';
        
        const orderDate = formatDate(order.createdAt);
        
        // Calcular valores CORRETAMENTE
        const subtotal = parseFloat(order.subtotal);
        const deliveryFee = parseFloat(order.deliveryFee);
        const restaurantAmount = order.restaurantAmount || (subtotal * 0.95).toFixed(2);
        
        const clientInfo = order.clientName ? `
            <div class="order-customer" style="background: #f8f9fa; padding: 0.8rem; border-radius: 8px; margin-bottom: 1rem;">
                <strong>Cliente:</strong>
                <p style="margin: 0.3rem 0;">👤 ${order.clientName}</p>
                ${order.clientPhone ? `<p style="margin: 0.3rem 0;">📱 ${order.clientPhone}</p>` : ''}
            </div>
        ` : '';
        
        // Mostrar lucro apenas para pedidos concluídos
        const profitInfo = order.status === 'completed' ? `
            <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 15px; border-radius: 10px; margin: 15px 0;">
                <div style="display: flex; justify-content: space-between; align-items: center;">
                    <div>
                        <div style="font-size: 0.85rem; opacity: 0.9; margin-bottom: 5px;">🏪 SEU LUCRO NESTE PEDIDO</div>
                        <div style="font-size: 1.8rem; font-weight: bold;">Kz ${formatCurrency(restaurantAmount)}</div>
                        <div style="font-size: 0.75rem; opacity: 0.8; margin-top: 5px;">95% do valor dos itens (Kz ${formatCurrency(subtotal)})</div>
                    </div>
                    <div style="text-align: right; font-size: 0.75rem; opacity: 0.8;">
                        <div style="margin: 3px 0;">🛵 Entregador: Kz ${formatCurrency(deliveryFee)}</div>
                        <div style="margin: 3px 0;">💼 Plataforma: Kz ${formatCurrency(subtotal * 0.05)}</div>
                    </div>
                </div>
            </div>
        ` : '';
        
        orderCard.innerHTML = `
            <div class="order-header">
                <div class="order-id-date">
                    <div class="order-id-text">Pedido #${order.id}</div>
                    <div class="order-date-text">${orderDate}</div>
                </div>
                <div class="order-status-badge status-${order.status}">${getStatusText(order.status)}</div>
            </div>
            
            ${clientInfo}
            
            <div class="order-customer">
                <strong>Endereço de Entrega:</strong>
                ${order.clientAddress ? `
                    <p>${order.clientAddress}</p>
                ` : `
                    <p>${order.address.street}, ${order.address.number}${order.address.complement ? ', ' + order.address.complement : ''}</p>
                    <p>${order.address.neighborhood}, ${order.address.municipality}</p>
                    <p>${order.address.province}</p>
                    <p><strong>Ref:</strong> ${order.address.reference}</p>
                `}
            </div>
            
            <div class="order-items-summary">
                ${order.items.map(item => `
                    <div class="order-item-line">
                        <span>${item.quantity}x ${item.name}</span>
                        <span>Kz ${formatCurrency(parseFloat(item.price) * item.quantity)}</span>
                    </div>
                `).join('')}
            </div>
            
            ${profitInfo}
            
            <div class="order-footer">
                <div class="order-total-text">Total: Kz ${formatCurrency(order.total)}</div>
                <div class="order-actions">
                    ${order.status === 'completed' ? `
                        <button class="btn-status" style="background: #3498db;" onclick="showInvoiceModal(${order.id})">
                            🧾 Ver Fatura Completa
                        </button>
                    ` : ''}
                    ${order.status === 'pending' ? `<button class="btn-status btn-accept" onclick="updateOrderStatus(${order.id}, 'preparing')">Aceitar Pedido</button>` : ''}
                    ${order.status === 'preparing' ? `<button class="btn-status btn-ready" onclick="updateOrderStatus(${order.id}, 'delivering')">Pronto para Entrega</button>` : ''}
                    ${order.status === 'delivering' ? `<button class="btn-status btn-delivered" onclick="updateOrderStatus(${order.id}, 'completed')">Pedido Entregue</button>` : ''}
                    ${order.status === 'pending' ? `<button class="btn-status btn-cancel" onclick="updateOrderStatus(${order.id}, 'cancelled')" style="background: #e74c3c;">Cancelar</button>` : ''}
                </div>
            </div>
        `;
        
        ordersList.appendChild(orderCard);
    });
}

async function updateOrderStatus(orderId, newStatus) {
    const token = sessionStorage.getItem('restaurantToken') || localStorage.getItem('restaurantToken');
    
    if (!token) {
        alert('❌ Erro: Token não encontrado');
        return;
    }
    
    console.log('📤 Atualizando status do pedido', orderId, 'para', newStatus);
    
    try {
        const response = await OrderAPI.updateStatus(orderId, newStatus, token);
        
        if (response.success) {
            console.log('✅ Status atualizado na API');
            
            // 🔕 Parar som ao aceitar ou cancelar pedido
            if (newStatus === 'preparing' || newStatus === 'cancelled') {
                stopNewOrderSound();
            }
            
            await loadRestaurantOrders();
            await updateStats();
            await loadRatingsAndFeedbacks();
            showNotification('✅ Status do pedido atualizado!', 'success');
        } else {
            alert('❌ Erro ao atualizar status: ' + response.message);
        }
    } catch (error) {
        console.error('❌ Erro ao atualizar status:', error);
        alert('❌ Erro ao conectar com o servidor');
    }
}

// ========================================
// CONFIGURAÇÕES
// ========================================
async function saveSettings(event) {
    event.preventDefault();
    
    const token = sessionStorage.getItem('restaurantToken') || localStorage.getItem('restaurantToken');
    
    if (!token) {
        alert('❌ Erro: Token não encontrado');
        return;
    }
    
    // Capturar imagem se houver
    let image_url = currentRestaurant.image_url || null;
    const imageFile = document.getElementById('settingsImage').files[0];
    if (imageFile) {
        image_url = await convertImageToBase64(imageFile);
    }
    
    const updatedData = {
        name: document.getElementById('settingsName').value,
        icon: document.getElementById('settingsIcon').value,
        image_url: image_url,
        category: document.getElementById('settingsCategory').value,
        cuisine: document.getElementById('settingsCuisine').value,
        phone: document.getElementById('settingsPhone').value,
        address: document.getElementById('settingsAddress').value,
        minTime: parseInt(document.getElementById('settingsMinTime').value),
        maxTime: parseInt(document.getElementById('settingsMaxTime').value)
    };
    
    console.log('📤 Atualizando configurações do restaurante');
    
    try {
        const response = await RestaurantAPI.update(updatedData, token);
        
        if (response.success) {
            console.log('✅ Configurações atualizadas na API');
            
            currentRestaurant = { ...currentRestaurant, ...updatedData };
            
            if (localStorage.getItem('currentRestaurant')) {
                localStorage.setItem('currentRestaurant', JSON.stringify(currentRestaurant));
            } else {
                sessionStorage.setItem('currentRestaurant', JSON.stringify(currentRestaurant));
            }
            
            // Atualizar avatar com imagem ou emoji
            const avatarEl = document.getElementById('restaurantAvatar');
            if (image_url) {
                avatarEl.innerHTML = `<img src="${image_url}" style="width: 100%; height: 100%; object-fit: cover; border-radius: 50%;">`;
            } else {
                avatarEl.textContent = currentRestaurant.icon;
            }
            
            document.getElementById('restaurantName').textContent = currentRestaurant.name;
            document.getElementById('restaurantCategory').textContent = currentRestaurant.category;
            
            showNotification('✅ Configurações salvas com sucesso!', 'success');
        } else {
            alert('❌ Erro ao salvar configurações: ' + response.message);
        }
    } catch (error) {
        console.error('❌ Erro ao salvar configurações:', error);
        alert('❌ Erro ao conectar com o servidor');
    }
}

// ========================================
// UTILIDADES
// ========================================
function logout() {
    if (!confirm('Tem certeza que deseja sair?')) return;
    
    sessionStorage.removeItem('currentRestaurant');
    sessionStorage.removeItem('restaurantToken');
    localStorage.removeItem('currentRestaurant');
    localStorage.removeItem('restaurantToken');
    
    console.log('🚪 Saindo do sistema...');
    
    window.location.href = '%20restaurant-login.html';
}

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

// Fechar modal ao clicar fora
document.addEventListener('click', function(event) {
    const modal = document.getElementById('addMenuModal');
    if (event.target === modal) {
        closeAddMenuModal();
    }
});

// ========================================
// SOCKET.IO - PEDIDOS EM TEMPO REAL
// ========================================
socket.on('newOrder', (order) => {
    console.log('🔔 Novo pedido recebido em tempo real:', order);

    if (soundUnlocked) {
        playNewOrderSound();
        showOrderNotification(1);
    }
    
    loadRestaurantOrders();
});

// ========================================
// SISTEMA DE FATURA
// ========================================

function showInvoiceModal(orderId) {
    const order = restaurantOrders.find(o => o.id === orderId);
    
    if (!order) {
        alert('Pedido não encontrado!');
        return;
    }
    
    const modal = document.createElement('div');
    modal.className = 'modal active';
    modal.innerHTML = `
        <div class="modal-content" style="max-width: 800px;">
            <div class="modal-header">
                <h2>🧾 Fatura do Pedido #${order.id}</h2>
                <button class="close-btn" onclick="this.closest('.modal').remove()">&times;</button>
            </div>
            <div class="modal-body">
                ${generateCleanInvoiceHTML(order)}
            </div>
            <div class="modal-footer" style="display: flex; gap: 10px; justify-content: flex-end; padding: 20px; border-top: 1px solid #ddd;">
                <button onclick="printInvoice(${order.id})" class="btn-primary" style="background: #3498db; color: white; padding: 10px 20px; border: none; border-radius: 8px; cursor: pointer; font-weight: 600;">
                    🖨️ Imprimir Fatura
                </button>
                <button onclick="this.closest('.modal').remove()" class="btn-secondary" style="background: #95a5a6; color: white; padding: 10px 20px; border: none; border-radius: 8px; cursor: pointer; font-weight: 600;">
                    Fechar
                </button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
}


function generateCleanInvoiceHTML(order) {
    const orderDate = new Date(order.createdAt).toLocaleDateString('pt-AO', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
    });
    
    const orderTime = new Date(order.createdAt).toLocaleTimeString('pt-AO', {
        hour: '2-digit',
        minute: '2-digit'
    });
    
    const deliveryName = order.delivery?.name || 'A designar';
    
    // Calcular valores
    const subtotal = parseFloat(order.subtotal);
    const deliveryFee = parseFloat(order.deliveryFee);
    const total = parseFloat(order.total);
    const restaurantAmount = order.restaurantAmount || (subtotal * 0.95).toFixed(2);
    
    return `
        <div id="invoiceContent" style="background: white; padding: 40px; font-family: 'Arial', sans-serif; max-width: 750px; margin: 0 auto;">
            
            <!-- Cabeçalho -->
            <div style="text-align: center; margin-bottom: 40px; padding-bottom: 20px; border-bottom: 3px solid #2c3e50;">
                <h1 style="color: #2c3e50; margin: 0 0 10px 0; font-size: 2.2rem; letter-spacing: 1px;">FATURA</h1>
                <p style="color: #7f8c8d; margin: 0; font-size: 1.1rem; font-weight: 500;">Ombbia Delivery</p>
            </div>
            
            <!-- Info do Pedido e Restaurante -->
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 30px; margin-bottom: 35px;">
                <div>
                    <h3 style="color: #2c3e50; margin: 0 0 12px 0; font-size: 1rem; text-transform: uppercase; letter-spacing: 0.5px;">Emitido por:</h3>
                    <p style="margin: 4px 0; font-size: 1.05rem; font-weight: bold; color: #2c3e50;">${currentRestaurant.name}</p>
                    <p style="margin: 4px 0; color: #555; font-size: 0.95rem;">📍 ${currentRestaurant.address || 'Huambo, Angola'}</p>
                    <p style="margin: 4px 0; color: #555; font-size: 0.95rem;">📱 ${currentRestaurant.phone || 'N/A'}</p>
                </div>
                
                <div style="text-align: right;">
                    <h3 style="color: #2c3e50; margin: 0 0 12px 0; font-size: 1rem; text-transform: uppercase; letter-spacing: 0.5px;">Detalhes:</h3>
                    <p style="margin: 4px 0; color: #555; font-size: 0.95rem;"><strong>Nº Pedido:</strong> #${order.id}</p>
                    <p style="margin: 4px 0; color: #555; font-size: 0.95rem;"><strong>Data:</strong> ${orderDate}</p>
                    <p style="margin: 4px 0; color: #555; font-size: 0.95rem;"><strong>Hora:</strong> ${orderTime}</p>
                </div>
            </div>
            
            <!-- Cliente e Entregador -->
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 30px; margin-bottom: 35px; padding: 20px; background: #f8f9fa; border-radius: 8px;">
                <div>
                    <h4 style="color: #2c3e50; margin: 0 0 10px 0; font-size: 0.9rem; text-transform: uppercase;">Cliente:</h4>
                    <p style="margin: 4px 0; font-weight: bold; color: #2c3e50;">${order.clientName || 'Cliente'}</p>
                    <p style="margin: 4px 0; color: #555; font-size: 0.9rem;">${order.clientPhone || 'N/A'}</p>
                </div>
                
                <div>
                    <h4 style="color: #2c3e50; margin: 0 0 10px 0; font-size: 0.9rem; text-transform: uppercase;">Entregador:</h4>
                    <p style="margin: 4px 0; font-weight: bold; color: #2c3e50;">${deliveryName}</p>
                    ${order.delivery?.phone ? `<p style="margin: 4px 0; color: #555; font-size: 0.9rem;">${order.delivery.phone}</p>` : ''}
                </div>
            </div>
            
            <!-- Tabela de Itens -->
            <table style="width: 100%; border-collapse: collapse; margin-bottom: 30px;">
                <thead>
                    <tr style="background: #34495e; color: white;">
                        <th style="padding: 12px; text-align: left; font-weight: 600;">DESCRIÇÃO</th>
                        <th style="padding: 12px; text-align: center; font-weight: 600; width: 80px;">QTD</th>
                        <th style="padding: 12px; text-align: right; font-weight: 600; width: 120px;">PREÇO</th>
                        <th style="padding: 12px; text-align: right; font-weight: 600; width: 120px;">TOTAL</th>
                    </tr>
                </thead>
                <tbody>
                    ${order.items.map((item, index) => `
                        <tr style="border-bottom: 1px solid #ddd; ${index % 2 === 0 ? 'background: #f8f9fa;' : ''}">
                            <td style="padding: 12px;">${item.name}</td>
                            <td style="padding: 12px; text-align: center;">${item.quantity}</td>
                            <td style="padding: 12px; text-align: right;">Kz ${formatCurrency(item.price)}</td>
                            <td style="padding: 12px; text-align: right; font-weight: 600;">Kz ${formatCurrency(parseFloat(item.price) * item.quantity)}</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
            
            <!-- Resumo de Valores -->
            <div style="margin-left: auto; width: 350px; margin-bottom: 35px;">
                <div style="display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #ddd;">
                    <span style="color: #555;">Subtotal:</span>
                    <strong style="color: #2c3e50;">Kz ${formatCurrency(subtotal)}</strong>
                </div>
                
                <div style="display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #ddd;">
                    <span style="color: #555;">Taxa de Entrega:</span>
                    <strong style="color: #2c3e50;">Kz ${formatCurrency(deliveryFee)}</strong>
                </div>
                
                <div style="display: flex; justify-content: space-between; padding: 15px 0; background: #ecf0f1; margin: 10px -15px 0 -15px; padding-left: 15px; padding-right: 15px; border-radius: 8px;">
                    <span style="font-size: 1.2rem; font-weight: bold; color: #2c3e50;">TOTAL:</span>
                    <strong style="font-size: 1.4rem; color: #27ae60;">Kz ${formatCurrency(total)}</strong>
                </div>
            </div>
            
            <!-- Observações -->
            <div style="padding: 15px; background: #fff3cd; border-left: 4px solid #ffc107; border-radius: 4px; margin-bottom: 30px;">
                <p style="margin: 0; color: #856404; font-size: 0.9rem;">
                    <strong>📌 Nota:</strong> O valor da taxa de entrega (Kz ${formatCurrency(deliveryFee)}) é destinado integralmente ao entregador.
                </p>
            </div>
            
            <!-- Rodapé -->
            <div style="text-align: center; padding-top: 25px; border-top: 2px solid #ddd; color: #7f8c8d; font-size: 0.85rem;">
                <p style="margin: 3px 0;">Ombbia - Plataforma de Delivery</p>
                <p style="margin: 3px 0;">📧 suporte@ombbia.ao | 📱 +244 928 528 266</p>
                <p style="margin: 15px 0 0 0; font-size: 0.75rem; color: #95a5a6;">
                    Documento gerado eletronicamente em ${new Date().toLocaleString('pt-AO')}
                </p>
            </div>
            
        </div>
    `;
}

function printInvoice(orderId) {
    const order = restaurantOrders.find(o => o.id === orderId);
    
    if (!order) {
        alert('Pedido não encontrado!');
        return;
    }
    
    const printWindow = window.open('', '_blank', 'width=800,height=900');
    
    printWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
            <title>Fatura #${order.id} - ${currentRestaurant.name}</title>
            <meta charset="UTF-8">
            <style>
                * {
                    margin: 0;
                    padding: 0;
                    box-sizing: border-box;
                }
                
                body { 
                    font-family: 'Arial', sans-serif;
                    line-height: 1.6;
                    color: #333;
                }
                
                @media print {
                    body { 
                        margin: 0;
                        padding: 20px;
                    }
                    
                    @page { 
                        margin: 1.5cm;
                        size: A4;
                    }
                    
                    table, .no-break {
                        page-break-inside: avoid;
                    }
                }
                
                @media screen {
                    body {
                        padding: 20px;
                        background: #f5f5f5;
                    }
                }
            </style>
        </head>
        <body>
            ${generateCleanInvoiceHTML(order)}
            <script>
                window.onload = function() {
                    setTimeout(function() {
                        window.print();
                    }, 500);
                };
                
                window.onafterprint = function() {
                    window.close();
                };
            </script>
        </body>
        </html>
    `);
    
    printWindow.document.close();
}

// ========================================
// INICIALIZAÇÃO
// ========================================
document.addEventListener('DOMContentLoaded', function() {
    console.log('Dashboard do restaurante carregado! 🍽️');
    
    // Inicializar som
    initSound();
    
    // Carregar dados do restaurante
    loadRestaurantData();

    // Verificar novos pedidos a cada 5 segundos
    setInterval(checkNewOrdersWithSound, 5000);
});
function toggleMenu(force) {
    const body = document.body;

    // Abre/fecha normalmente
    if (force === undefined) {
        body.classList.toggle("menu-open");
    } 
    // Fechar forçado
    else if (force === false) {
        body.classList.remove("menu-open");
    } 
    // Abrir forçado
    else {
        body.classList.add("menu-open");
    }
}
document.querySelectorAll('.menu-item').forEach(item => {
    item.addEventListener('click', () => {
        if (window.innerWidth <= 480) {
            toggleMenu(false); // fecha o menu
        }
    });
});
document.addEventListener('click', function (e) {
    const sidebar = document.querySelector('.sidebar');
    const burger = document.querySelector('.burger');

    // Se clicou fora da sidebar e fora do botão
    if (
        document.body.classList.contains('menu-open') &&
        !sidebar.contains(e.target) &&
        !burger.contains(e.target)
    ) {
        toggleMenu(false);
    }
});
window.addEventListener('resize', function () {
    if (window.innerWidth > 480) {
        toggleMenu(false);
    }
});
// ========================================
// RELATÓRIO DE LUCROS
// ========================================

function loadProfitReport() {
    const completedOrders = restaurantOrders.filter(o => o.status === 'completed');
    
    if (completedOrders.length === 0) {
        document.getElementById('profitReportContent').innerHTML = `
            <div class="empty-message" style="text-align: center; padding: 60px 20px;">
                <div style="font-size: 4rem; margin-bottom: 20px;">📊</div>
                <h3>Nenhum pedido concluído ainda</h3>
                <p style="color: #999; margin-top: 10px;">Seus lucros aparecerão aqui quando você concluir pedidos</p>
            </div>
        `;
        return;
    }
    
    // Calcular totais
    let totalRevenue = 0;
    let totalProfit = 0;
    let totalDeliveryFees = 0;
    let totalPlatformFees = 0;
    
    const ordersByDate = {};
    
    completedOrders.forEach(order => {
        const subtotal = parseFloat(order.subtotal);
        const deliveryFee = parseFloat(order.deliveryFee);
        const profit = subtotal * 0.95;
        const platformFee = subtotal * 0.05;
        
        totalRevenue += subtotal;
        totalProfit += profit;
        totalDeliveryFees += deliveryFee;
        totalPlatformFees += platformFee;
        
        // Agrupar por data
        const date = new Date(order.createdAt).toLocaleDateString('pt-AO');
        if (!ordersByDate[date]) {
            ordersByDate[date] = {
                orders: 0,
                revenue: 0,
                profit: 0
            };
        }
        ordersByDate[date].orders++;
        ordersByDate[date].revenue += subtotal;
        ordersByDate[date].profit += profit;
    });
    
    // Renderizar relatório
    document.getElementById('profitReportContent').innerHTML = `
        <!-- Cards de Resumo -->
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 20px; margin-bottom: 30px;">
            
            <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 25px; border-radius: 12px; box-shadow: 0 4px 15px rgba(0,0,0,0.1);">
                <div style="font-size: 0.9rem; opacity: 0.9; margin-bottom: 10px;">💰 SEU LUCRO TOTAL</div>
                <div style="font-size: 2.2rem; font-weight: bold; margin-bottom: 5px;">Kz ${formatCurrency(totalProfit)}</div>
                <div style="font-size: 0.8rem; opacity: 0.8;">95% do faturamento</div>
            </div>
            
            <div style="background: white; padding: 25px; border-radius: 12px; box-shadow: 0 4px 15px rgba(0,0,0,0.08); border-left: 4px solid #3498db;">
                <div style="font-size: 0.9rem; color: #666; margin-bottom: 10px;">📊 Faturamento Total</div>
                <div style="font-size: 2rem; font-weight: bold; color: #2c3e50; margin-bottom: 5px;">Kz ${formatCurrency(totalRevenue)}</div>
                <div style="font-size: 0.8rem; color: #999;">${completedOrders.length} pedidos</div>
            </div>
            
            <div style="background: white; padding: 25px; border-radius: 12px; box-shadow: 0 4px 15px rgba(0,0,0,0.08); border-left: 4px solid #27ae60;">
                <div style="font-size: 0.9rem; color: #666; margin-bottom: 10px;">🛵 Taxas de Entrega</div>
                <div style="font-size: 2rem; font-weight: bold; color: #2c3e50; margin-bottom: 5px;">Kz ${formatCurrency(totalDeliveryFees)}</div>
                <div style="font-size: 0.8rem; color: #999;">Para entregadores</div>
            </div>
            
            <div style="background: white; padding: 25px; border-radius: 12px; box-shadow: 0 4px 15px rgba(0,0,0,0.08); border-left: 4px solid #e74c3c;">
                <div style="font-size: 0.9rem; color: #666; margin-bottom: 10px;">💼 Taxa Plataforma</div>
                <div style="font-size: 2rem; font-weight: bold; color: #2c3e50; margin-bottom: 5px;">Kz ${formatCurrency(totalPlatformFees)}</div>
                <div style="font-size: 0.8rem; color: #999;">5% do faturamento</div>
            </div>
            
        </div>
        
        <!-- Gráfico de Distribuição -->
        <div style="background: white; padding: 25px; border-radius: 12px; box-shadow: 0 4px 15px rgba(0,0,0,0.08); margin-bottom: 30px;">
            <h3 style="margin: 0 0 20px 0; color: #2c3e50;">📈 Distribuição de Valores</h3>
            <div style="display: flex; flex-direction: column; gap: 15px;">
                
                <div>
                    <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
                        <span style="font-weight: 600; color: #667eea;">💰 Seu Lucro (95%)</span>
                        <span style="font-weight: bold; color: #667eea;">Kz ${formatCurrency(totalProfit)}</span>
                    </div>
                    <div style="background: #ecf0f1; height: 30px; border-radius: 8px; overflow: hidden;">
                        <div style="background: linear-gradient(90deg, #667eea, #764ba2); height: 100%; width: ${(totalProfit / (totalRevenue + totalDeliveryFees) * 100)}%; display: flex; align-items: center; justify-content: flex-end; padding-right: 10px; color: white; font-size: 0.85rem; font-weight: 600;">
                            ${((totalProfit / (totalRevenue + totalDeliveryFees)) * 100).toFixed(1)}%
                        </div>
                    </div>
                </div>
                
                <div>
                    <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
                        <span style="font-weight: 600; color: #27ae60;">🛵 Entregadores</span>
                        <span style="font-weight: bold; color: #27ae60;">Kz ${formatCurrency(totalDeliveryFees)}</span>
                    </div>
                    <div style="background: #ecf0f1; height: 30px; border-radius: 8px; overflow: hidden;">
                        <div style="background: #27ae60; height: 100%; width: ${(totalDeliveryFees / (totalRevenue + totalDeliveryFees) * 100)}%; display: flex; align-items: center; justify-content: flex-end; padding-right: 10px; color: white; font-size: 0.85rem; font-weight: 600;">
                            ${((totalDeliveryFees / (totalRevenue + totalDeliveryFees)) * 100).toFixed(1)}%
                        </div>
                    </div>
                </div>
                
                <div>
                    <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
                        <span style="font-weight: 600; color: #e74c3c;">💼 Plataforma (5%)</span>
                        <span style="font-weight: bold; color: #e74c3c;">Kz ${formatCurrency(totalPlatformFees)}</span>
                    </div>
                    <div style="background: #ecf0f1; height: 30px; border-radius: 8px; overflow: hidden;">
                        <div style="background: #e74c3c; height: 100%; width: ${(totalPlatformFees / (totalRevenue + totalDeliveryFees) * 100)}%; display: flex; align-items: center; justify-content: flex-end; padding-right: 10px; color: white; font-size: 0.85rem; font-weight: 600;">
                            ${((totalPlatformFees / (totalRevenue + totalDeliveryFees)) * 100).toFixed(1)}%
                        </div>
                    </div>
                </div>
                
            </div>
        </div>
        
        <!-- Lucros por Dia -->
        <div style="background: white; padding: 25px; border-radius: 12px; box-shadow: 0 4px 15px rgba(0,0,0,0.08);">
            <h3 style="margin: 0 0 20px 0; color: #2c3e50;">📅 Lucros por Dia</h3>
            <div style="overflow-x: auto;">
                <table style="width: 100%; border-collapse: collapse;">
                    <thead>
                        <tr style="background: #f8f9fa; border-bottom: 2px solid #dee2e6;">
                            <th style="padding: 12px; text-align: left; font-weight: 600; color: #495057;">Data</th>
                            <th style="padding: 12px; text-align: center; font-weight: 600; color: #495057;">Pedidos</th>
                            <th style="padding: 12px; text-align: right; font-weight: 600; color: #495057;">Faturamento</th>
                            <th style="padding: 12px; text-align: right; font-weight: 600; color: #495057;">Seu Lucro</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${Object.entries(ordersByDate)
                            .sort((a, b) => {
                                const dateA = a[0].split('/').reverse().join('');
                                const dateB = b[0].split('/').reverse().join('');
                                return dateB.localeCompare(dateA);
                            })
                            .map(([date, data], index) => `
                                <tr style="border-bottom: 1px solid #dee2e6; ${index % 2 === 0 ? 'background: #f8f9fa;' : ''}">
                                    <td style="padding: 12px; font-weight: 500;">${date}</td>
                                    <td style="padding: 12px; text-align: center;">${data.orders}</td>
                                    <td style="padding: 12px; text-align: right; color: #3498db; font-weight: 600;">Kz ${formatCurrency(data.revenue)}</td>
                                    <td style="padding: 12px; text-align: right; color: #27ae60; font-weight: bold;">Kz ${formatCurrency(data.profit)}</td>
                                </tr>
                            `).join('')}
                    </tbody>
                    <tfoot>
                        <tr style="background: #f1f3f5; font-weight: bold; border-top: 2px solid #dee2e6;">
                            <td style="padding: 15px;">TOTAL</td>
                            <td style="padding: 15px; text-align: center;">${completedOrders.length}</td>
                            <td style="padding: 15px; text-align: right; color: #3498db;">Kz ${formatCurrency(totalRevenue)}</td>
                            <td style="padding: 15px; text-align: right; color: #27ae60; font-size: 1.1rem;">Kz ${formatCurrency(totalProfit)}</td>
                        </tr>
                    </tfoot>
                </table>
            </div>
        </div>
        
        <!-- Nota Informativa -->
        <div style="background: #d1ecf1; border-left: 4px solid #0c5460; padding: 15px; border-radius: 8px; margin-top: 20px;">
            <p style="margin: 0; color: #0c5460; font-size: 0.9rem;">
                <strong>ℹ️ Como funciona:</strong> Você recebe 95% do valor dos itens vendidos. A plataforma retém 5% para custos operacionais. 
                As taxas de entrega vão integralmente para os entregadores.
            </p>
        </div>
    `;
}

// ========================================
// NAVEGAÇÃO
// ========================================
function showSection(section) {
    document.querySelectorAll('.content-section').forEach(s => s.classList.remove('active'));
    document.querySelectorAll('.menu-item').forEach(item => item.classList.remove('active'));
    
    if (section === 'overview') {
        document.getElementById('overviewSection').classList.add('active');
        document.querySelector('.menu-item:nth-child(1)').classList.add('active');
    } else if (section === 'orders') {
        document.getElementById('ordersSection').classList.add('active');
        document.querySelector('.menu-item:nth-child(2)').classList.add('active');
    } else if (section === 'menu') {
        document.getElementById('menuSection').classList.add('active');
        document.querySelector('.menu-item:nth-child(3)').classList.add('active');
    } else if (section === 'reports') {
        document.getElementById('reportsSection').classList.add('active');
        document.querySelector('.menu-item:nth-child(4)').classList.add('active');
        loadProfitReport();
    } else if (section === 'settings') {
        document.getElementById('settingsSection').classList.add('active');
        document.querySelector('.menu-item:nth-child(5)').classList.add('active');
    }
}



