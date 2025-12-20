// Dados dos restaurantes serão carregados do localStorage

let restaurants = [];

// Função para carregar restaurantes DA API (APENAS ATIVOS)
async function loadRestaurants() {
    try {
        const response = await RestaurantAPI.getAll();
        
        if (response.success) {
            console.log('📡 Restaurantes recebidos da API:', response.data);

            // 🔥 MOSTRAR SÓ OS APROVADOS
            restaurants = response.data.filter(r => r.isActive === true || r.isActive === 1);

            console.log('✅ Restaurantes ATIVOS que vão aparecer no marketplace:', restaurants);
            renderRestaurants(restaurants);
        } else {
            console.error('❌ Erro ao carregar restaurantes:', response.message);
            
            // Fallback: usar restaurantes padrão
            restaurants = getDefaultRestaurants();
            renderRestaurants(restaurants);
        }
    } catch (error) {
        console.error('❌ Erro de conexão com API:', error);
        
        // Fallback: usar restaurantes padrão
        restaurants = getDefaultRestaurants();
        renderRestaurants(restaurants);
    }
}



// Restaurantes padrão (fallback)
function getDefaultRestaurants() {
    return [
        {id: 1, name: "Pizza Palace", icon: "🍕", rating: 4.5, minTime: 30, maxTime: 40, cuisine: "Italiana, Pizza, Massas", category: "pizza"},
        {id: 2, name: "Burger House", icon: "🍔", rating: 4.7, minTime: 20, maxTime: 30, cuisine: "Americana, Burgers, Fast Food", category: "hamburger"},
        {id: 3, name: "Sushi Bar", icon: "🍜", rating: 4.8, minTime: 35, maxTime: 45, cuisine: "Japonesa, Sushi, Asiática", category: "asiatica"},
        {id: 4, name: "Taco Fiesta", icon: "🌮", rating: 4.6, minTime: 25, maxTime: 35, cuisine: "Mexicana, Tacos, Burritos", category: "mexicana"},
        {id: 5, name: "Green Garden", icon: "🥗", rating: 4.4, minTime: 15, maxTime: 25, cuisine: "Saudável, Saladas, Vegano", category: "saudavel"},
        {id: 6, name: "Sweet Dreams", icon: "🍰", rating: 4.9, minTime: 20, maxTime: 30, cuisine: "Padaria, Bolos, Sobremesas", category: "sobremesas"}
    ];
}

// Função para renderizar restaurantes - ATUALIZADA COM IMAGENS
function renderRestaurants(restaurants) {
    const restaurantGrid = document.querySelector('.restaurant-grid');
    
    if (!restaurantGrid) {
        console.error('❌ Elemento .restaurant-grid não encontrado no DOM!');
        return;
    }
    
    if (restaurants.length === 0) {
        restaurantGrid.innerHTML = '<p style="text-align: center; grid-column: 1/-1;">Nenhum restaurante encontrado.</p>';
        return;
    }
    
    restaurantGrid.innerHTML = '';
    
    restaurants.forEach(restaurant => {
        const card = document.createElement('div');
        card.className = 'restaurant-card';
        card.onclick = () => window.location.href = `restaurant.html?id=${restaurant.id}`;
        
        // Formatar rating
        let ratingDisplay = '';
        if (restaurant.rating > 0) {
            ratingDisplay = `⭐ ${restaurant.rating}`;
            if (restaurant.totalRatings) {
                ratingDisplay += ` (${restaurant.totalRatings})`;
            }
        } else {
            ratingDisplay = '⭐ Sem avaliações';
        }
        
        // PRIORIZAR IMAGEM SOBRE EMOJI
        let imageDisplay = '';
        if (restaurant.image_url) {
            imageDisplay = `<img src="${restaurant.image_url}" alt="${restaurant.name}" style="width: 100%; height: 100%; object-fit: cover; border-radius: 12px;">`;
        } else if (restaurant.icon) {
            imageDisplay = restaurant.icon;
        } else {
            imageDisplay = '🍽️'; // Fallback padrão
        }
        
        card.innerHTML = `
            <div class="restaurant-image">${imageDisplay}</div>
            <div class="restaurant-info">
                <div class="restaurant-name">${restaurant.name}</div>
                <div class="restaurant-details">
                    <span class="rating">${ratingDisplay}</span>
                    <span>${restaurant.minTime || 30}-${restaurant.maxTime || 40} min</span>
                </div>
                <div class="restaurant-cuisine">${restaurant.cuisine}</div>
            </div>
        `;
        
        restaurantGrid.appendChild(card);
    });
    
    console.log('✅ Restaurantes renderizados com sucesso!');
}

// Função de busca
function setupSearch() {
    const searchInput = document.querySelector('.search-container input');
    const searchButton = document.querySelector('.search-container button');
    
    if (!searchInput || !searchButton) return;
    
    function performSearch() {
        const query = searchInput.value.toLowerCase().trim();
        
        if (query === '') {
            renderRestaurants(restaurants);
            return;
        }
        
        const filtered = restaurants.filter(restaurant => 
            restaurant.name.toLowerCase().includes(query) ||
            restaurant.cuisine.toLowerCase().includes(query) ||
            restaurant.category.toLowerCase().includes(query)
        );
        
        renderRestaurants(filtered);
    }
    
    searchButton.addEventListener('click', performSearch);
    searchInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            performSearch();
        }
    });
}

// Função para filtrar por categoria
function setupCategories() {
    const categoryCards = document.querySelectorAll('.category-card');
    
    categoryCards.forEach(card => {
        card.addEventListener('click', function() {
            const categoryName = this.querySelector('.category-name').textContent.toLowerCase();
            
            const categoryMap = {
                'pizza': 'Italiana',
                'hamburger': 'Americana',
                'asiática': 'Japonesa',
                'sobremesas': 'Padaria',
                'saudável': 'Saudável',
                'mexicana': 'Mexicana'
            };
            
            const category = categoryMap[categoryName];
            
            if (category) {
                const filtered = restaurants.filter(r => 
                    r.category && r.category.toLowerCase().includes(categoryName) ||
                    r.cuisine.toLowerCase().includes(categoryName) ||
                    r.category === category
                );
                renderRestaurants(filtered);
                
                // Scroll suave para a seção de restaurantes
                const restaurantsSection = document.querySelector('.restaurants');
                if (restaurantsSection) {
                    restaurantsSection.scrollIntoView({ behavior: 'smooth' });
                }
            }
        });
    });
}

// Função para abrir página do restaurante
function openRestaurant(id) {
    console.log('Abrindo restaurante com ID:', id);
    console.log('Tipo do ID:', typeof id);
    window.location.href = `restaurant.html?id=${id}`;
}

// Inicialização quando a página carregar
document.addEventListener('DOMContentLoaded', function() {
    console.log('eFood carregado com sucesso! 🍔');
    
    // Carregar e renderizar restaurantes
    loadRestaurants();
    
    // Configurar busca
    setupSearch();
    
    // Configurar categorias
    setupCategories();
});
// Carregar e mostrar endereço do usuário no header
// Carregar e mostrar endereço do usuário no header (CORRIGIDO)
async function loadUserAddressInHeader() {
    const headerAddress = document.getElementById('headerAddress');
    const headerAddressContent = document.getElementById('headerAddressContent');

    if (!headerAddress || !headerAddressContent) return;

    const currentUserData = sessionStorage.getItem('currentUser') || localStorage.getItem('currentUser');

    if (!currentUserData) {
        headerAddress.style.display = 'none';
        return;
    }

    const currentUser = JSON.parse(currentUserData);

    console.log('📍 Buscando endereço para o header:', currentUser);

    let address = null;

    // 1️⃣ PRIORIDADE: endereço dentro do currentUser
    if (currentUser.street && currentUser.province) {
        address = currentUser;
        console.log('✅ Usando endereço do currentUser');
    }

    // 2️⃣ FALLBACK: endereço padrão salvo
    if (!address) {
        const savedAddresses = localStorage.getItem(`addresses_${currentUser.id}`);
        if (savedAddresses) {
            const addresses = JSON.parse(savedAddresses);
            const defaultAddress = addresses.find(a => a.default);
            if (defaultAddress) {
                address = defaultAddress;
                console.log('✅ Usando endereço padrão salvo');
            }
        }
    }

    // 3️⃣ SE NÃO HOUVER ENDEREÇO
    if (!address) {
        headerAddressContent.textContent = 'Adicionar endereço';
        headerAddress.style.display = 'flex';
        headerAddress.style.background = 'rgba(255, 107, 53, 0.3)';
        return;
    }

    // 4️⃣ MOSTRAR ENDEREÇO
    const shortAddr = `${address.street}, ${address.number || ''} - ${address.neighborhood || ''}`;
    headerAddressContent.textContent = shortAddr;
    headerAddressContent.title = `${address.street}, ${address.number}, ${address.neighborhood}, ${address.municipality}, ${address.province}`;
    headerAddress.style.display = 'flex';
}


// Executar quando a página carregar
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', loadUserAddressInHeader);
} else {
    loadUserAddressInHeader();
}
// Ir para página de gestão de endereços
function goToAddressManager() {
    window.location.href = 'profile.html#addresses';
}
