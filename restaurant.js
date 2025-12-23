// Formatar moeda angolana
function formatCurrency(value) {
    return value.toFixed(2).replace('.', ',').replace(/\B(?=(\d{3})+(?!\d))/g, '.');
}

// Carrinho de compras
let cart = [];
let currentRestaurant = null;

// Pegar ID do restaurante da URL
function getRestaurantIdFromURL() {
    const params = new URLSearchParams(window.location.search);
    return params.get('id') || '1';
}

// Carregar informações do restaurante DA API
async function loadRestaurantInfo() {
    const restaurantId = getRestaurantIdFromURL();
    console.log('🔍 Buscando restaurante ID:', restaurantId);
    
    try {
        // Buscar restaurante da API
        const response = await RestaurantAPI.getById(restaurantId);
        
        if (response.success && response.data) {
            currentRestaurant = response.data;
            
            // DEBUG: Verificar se image_url existe
            console.log('🔍 DEBUG - currentRestaurant completo:', currentRestaurant);
            console.log('🔍 DEBUG - image_url no currentRestaurant:', currentRestaurant.image_url);
            
            const time = `${currentRestaurant.minTime || 30}-${currentRestaurant.maxTime || 40} min`;
            
            document.getElementById('restaurantName').textContent = currentRestaurant.name;
            document.getElementById('restaurantRating').textContent = currentRestaurant.rating || 4.5;
            document.getElementById('restaurantTime').textContent = time;
            document.getElementById('restaurantCuisine').textContent = currentRestaurant.cuisine;
            
            // CORRIGIDO: Mostrar foto do restaurante em vez do emoji
            const restaurantIconElement = document.getElementById('restaurantIcon');
            if (currentRestaurant.image_url) {
                // Se tem foto, mostrar a foto
                restaurantIconElement.innerHTML = `
                    <img src="${currentRestaurant.image_url}" 
                         alt="${currentRestaurant.name}" 
                         style="width: 100%; height: 100%; object-fit: cover; border-radius: 50%;">
                `;
            } else {
                // Se não tem foto, mostrar emoji
                restaurantIconElement.textContent = currentRestaurant.icon || '🍽️';
            }
            
            console.log('✅ Restaurante carregado da API:', currentRestaurant.name);
            
            // Carregar cardápio
            await loadRestaurantMenu(restaurantId);
        } else {
            alert('Restaurante não encontrado!');
            window.location.href = 'index.html';
        }
    } catch (error) {
        console.error('❌ Erro ao carregar restaurante:', error);
        alert('Erro ao conectar com o servidor');
        window.location.href = 'index.html';
    }
}

// Carregar cardápio do restaurante DA API
async function loadRestaurantMenu(restaurantId) {
    console.log('🔍 Carregando cardápio do restaurante:', restaurantId);
    
    try {
        const response = await MenuAPI.getByRestaurant(restaurantId);
        console.log('📋 Resposta da API:', response);
        console.log('📋 response.data:', response.data);
        
        if (response.success && response.data && Array.isArray(response.data)) {
            const menuItems = response.data;
            console.log('📋 menuItems encontrados:', menuItems.length);
            
            if (menuItems.length === 0) {
                console.log('⚠️ Array vazio');
                document.getElementById('menuGrid').innerHTML = `
                    <div style="grid-column: 1/-1; text-align: center; padding: 3rem; color: #999;">
                        <p style="font-size: 1.2rem; margin-bottom: 1rem;">Este restaurante ainda não tem pratos cadastrados.</p>
                        <p>Aguarde enquanto eles adicionam o cardápio!</p>
                    </div>
                `;
                return;
            }
            
            window.currentMenu = menuItems;
            console.log('✅ window.currentMenu definido:', window.currentMenu);
            renderMenuItems(menuItems);
            console.log('✅ Cardápio carregado:', menuItems.length, 'itens');
        } else {
            console.log('❌ Condição falhou - sem dados válidos');
            document.getElementById('menuGrid').innerHTML = `
                <div style="grid-column: 1/-1; text-align: center; padding: 3rem; color: #999;">
                    <p>Nenhum prato disponível no momento.</p>
                </div>
            `;
        }
    } catch (error) {
        console.error('❌ Erro ao carregar cardápio:', error);
        document.getElementById('menuGrid').innerHTML = `
            <div style="grid-column: 1/-1; text-align: center; padding: 3rem; color: #999;">
                <p>Erro ao carregar cardápio.</p>
            </div>
        `;
    }
}

// Renderizar itens do menu
function renderMenuItems(menuItems, category = 'all') {
    const menuGrid = document.getElementById('menuGrid');
    menuGrid.innerHTML = '';
    
    console.log('🔍 Filtrando por categoria:', category);
    console.log('📋 Total de itens:', menuItems.length);
    
    // Normalizar categoria para comparação (minúscula e sem espaços)
    const normalizedCategory = category.toLowerCase().trim();
    
    const filteredItems = category === 'all' 
        ? menuItems 
        : menuItems.filter(item => {
            // Normalizar a categoria do item também
            const itemCategory = (item.category || '').toLowerCase().trim();
            console.log(`Comparando: "${itemCategory}" === "${normalizedCategory}"`);
            return itemCategory === normalizedCategory;
        });
    
    console.log('✅ Itens filtrados:', filteredItems.length);
    
    if (filteredItems.length === 0) {
        menuGrid.innerHTML = `
            <div style="grid-column: 1/-1; text-align: center; padding: 3rem; color: #999;">
                <p>Nenhum prato encontrado nesta categoria.</p>
            </div>
        `;
        return;
    }
    
    filteredItems.forEach(item => {
        const itemCard = document.createElement('div');
        itemCard.className = 'menu-item';
        
        // Usar image_url em vez de icon para mostrar a foto do prato
        const itemImage = item.image_url 
            ? `<img src="${item.image_url}" alt="${item.name}" style="width: 100%; height: 100%; object-fit: cover;">`
            : `<div style="font-size: 4rem;">${item.icon || '🍽️'}</div>`;
        
        itemCard.innerHTML = `
            <div class="menu-item-image">${itemImage}</div>
            <div class="menu-item-info">
                <div class="menu-item-name">${item.name}</div>
                <div class="menu-item-description">${item.description}</div>
                <div class="menu-item-footer">
                    <div class="menu-item-price">Kz ${formatCurrency(parseFloat(item.price))}</div>
                    <button class="btn-add-to-cart" onclick="addToCart(${item.id})">
                        Adicionar
                    </button>
                </div>
            </div>
        `;
        
        menuGrid.appendChild(itemCard);
    });
    
    // Salvar referência global do menu
    window.currentMenu = menuItems;
}

// Configurar filtros de categoria
function setupCategoryFilters() {
    const categoryButtons = document.querySelectorAll('.category-btn');
    
    categoryButtons.forEach(btn => {
        btn.addEventListener('click', function() {
            categoryButtons.forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            
            const category = this.dataset.category;
            renderMenuItems(window.currentMenu || [], category);
        });
    });
}

// Adicionar item ao carrinho
function addToCart(itemId) {
    const item = window.currentMenu.find(i => i.id === itemId);
    
    if (!item) return;
    
    const existingItem = cart.find(i => i.id === itemId);
    
    if (existingItem) {
        existingItem.quantity++;
    } else {
        cart.push({
            ...item,
            quantity: 1
        });
    }
    
    updateCart();
    showNotification(`${item.name} adicionado ao carrinho! 🎉`);
}

// Remover item do carrinho
function removeFromCart(itemId) {
    cart = cart.filter(item => item.id !== itemId);
    updateCart();
}

// Atualizar quantidade
function updateQuantity(itemId, change) {
    const item = cart.find(i => i.id === itemId);
    
    if (!item) return;
    
    item.quantity += change;
    
    if (item.quantity <= 0) {
        removeFromCart(itemId);
    } else {
        updateCart();
    }
}

// Atualizar carrinho
function updateCart() {
    const cartItemsContainer = document.getElementById('cartItems');
    const cartCount = document.querySelector('.cart-count');
    const cartSubtotal = document.getElementById('cartSubtotal');
    const cartTotal = document.getElementById('cartTotal');
    
    const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
    cartCount.textContent = totalItems;
    
    if (cart.length === 0) {
        cartItemsContainer.innerHTML = `
            <div class="empty-cart">
                <p>Seu carrinho está vazio</p>
                <p>Adicione itens do cardápio!</p>
            </div>
        `;
        cartSubtotal.textContent = 'Kz 0,00';
        cartTotal.textContent = 'Kz 500,00';
        return;
    }
    
    cartItemsContainer.innerHTML = '';
    
    cart.forEach(item => {
        const cartItem = document.createElement('div');
        cartItem.className = 'cart-item';
        
        cartItem.innerHTML = `
            <div class="cart-item-info">
                <div class="cart-item-name">${item.name}</div>
                <div class="cart-item-price">Kz ${formatCurrency(parseFloat(item.price))}</div>
                <div class="cart-item-controls">
                    <button class="quantity-btn" onclick="updateQuantity(${item.id}, -1)">-</button>
                    <span class="cart-item-quantity">${item.quantity}</span>
                    <button class="quantity-btn" onclick="updateQuantity(${item.id}, 1)">+</button>
                </div>
            </div>
        `;
        
        cartItemsContainer.appendChild(cartItem);
    });
    
    const subtotal = cart.reduce((sum, item) => sum + (parseFloat(item.price) * item.quantity), 0);
    const deliveryFee = 500.00;
    const total = subtotal + deliveryFee;
    
    cartSubtotal.textContent = `Kz ${formatCurrency(subtotal)}`;
    cartTotal.textContent = `Kz ${formatCurrency(total)}`;
}

// Toggle carrinho (mobile)
function toggleCart() {
    const cartSidebar = document.getElementById('cartSidebar');
    cartSidebar.classList.toggle('active');
}

// Finalizar pedido
function checkout() {
    if (cart.length === 0) {
        alert('Seu carrinho está vazio!');
        return;
    }
    
    sessionStorage.setItem('cart', JSON.stringify(cart));
    
    // DEBUG: Verificar o que está sendo salvo
    console.log('🔍 DEBUG - Salvando no sessionStorage:');
    console.log('currentRestaurant.id:', currentRestaurant.id);
    console.log('currentRestaurant.image_url:', currentRestaurant.image_url);
    
    const restaurantInfo = {
        restaurantId: currentRestaurant.id,
        name: currentRestaurant.name,
        icon: currentRestaurant.icon,
        image_url: currentRestaurant.image_url, // ← DEVE ter o valor aqui
        time: `${currentRestaurant.minTime || 30}-${currentRestaurant.maxTime || 40} min`
    };
    
    console.log('🔍 DEBUG - restaurantInfo que será salvo:', restaurantInfo);
    
    sessionStorage.setItem('restaurant', JSON.stringify(restaurantInfo));
    
    // Verificar o que foi realmente salvo
    console.log('🔍 DEBUG - Verificando o que foi salvo no sessionStorage:', 
        JSON.parse(sessionStorage.getItem('restaurant')));
    
    window.location.href = 'checkout.html';
}

// Notificação
function showNotification(message) {
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed;
        top: 100px;
        right: 20px;
        background: #48c774;
        color: white;
        padding: 1rem 1.5rem;
        border-radius: 10px;
        box-shadow: 0 5px 15px rgba(0,0,0,0.3);
        z-index: 10000;
        animation: slideInRight 0.3s;
    `;
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.animation = 'slideOutRight 0.3s';
        setTimeout(() => notification.remove(), 300);
    }, 2000);
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

// Inicialização
document.addEventListener('DOMContentLoaded', function() {
    console.log('Página do restaurante carregada! 🍕');
    
    loadRestaurantInfo();
    setupCategoryFilters();
    updateCart();
});