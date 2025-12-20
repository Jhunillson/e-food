// Configuração da API
//const API_URL = 'http://localhost:3000/api';

function getBaseURL() {
    const isLocalhost = window.location.hostname === "localhost" || 
                        window.location.hostname === "127.0.0.1";

    if (isLocalhost) {
        console.log("🌐 Ambiente LOCAL detectado → usando localhost:3000");
        return "http://localhost:3000/api";
    }

    const isLocalNetwork = /^192\.168\./.test(window.location.hostname) ||
                           /^172\./.test(window.location.hostname) ||
                           /^10\./.test(window.location.hostname);

    if (isLocalNetwork) {
        console.log("📡 Rede local detectada → usando IP da rede:", window.location.hostname);
        return `http://${window.location.hostname}:3000/api`;
    }

    console.log("🌍 Domínio remoto detectado → usando URL de produção");
    return "https://SEU-DOMINIO-AQUI/api";
}

const API_URL = getBaseURL();
console.log("🔗 Usando API_URL =", API_URL);



// Helper para fazer requisições
const api = {
    // GET request
    async get(endpoint, token = null) {
        const headers = {
            'Content-Type': 'application/json'
        };
        
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }
        
        const response = await fetch(`${API_URL}${endpoint}`, {
            method: 'GET',
            headers
        });
        
        return await response.json();
    },
    
    // POST request
    async post(endpoint, data, token = null) {
        const headers = {
            'Content-Type': 'application/json'
        };
        
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }
        
        const response = await fetch(`${API_URL}${endpoint}`, {
            method: 'POST',
            headers,
            body: JSON.stringify(data)
        });
        
        return await response.json();
    },
    
    // PUT request
    async put(endpoint, data, token = null) {
        const headers = {
            'Content-Type': 'application/json'
        };
        
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }
        
        const response = await fetch(`${API_URL}${endpoint}`, {
            method: 'PUT',
            headers,
            body: JSON.stringify(data)
        });
        
        return await response.json();
    },
    
    // DELETE request
    async delete(endpoint, token = null) {
        const headers = {
            'Content-Type': 'application/json'
        };
        
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }
        
        const response = await fetch(`${API_URL}${endpoint}`, {
            method: 'DELETE',
            headers
        });
        
        return await response.json();
    }
};

// Funções específicas da API

// AUTH
const AuthAPI = {
    registerUser: (data) => api.post('/auth/register/user', data),
    loginUser: (data) => api.post('/auth/login/user', data),
    registerRestaurant: (data) => api.post('/auth/register/restaurant', data),
    loginRestaurant: (data) => api.post('/auth/login/restaurant', data),
    getProfile: (token) => api.get('/auth/profile', token),
    // NOVA FUNÇÃO PARA BUSCAR DADOS COMPLETOS DO USUÁRIO
    getUserData: (token) => api.get('/auth/user', token)
};

// RESTAURANTS
const RestaurantAPI = {
    getAll: () => api.get('/restaurants'),
    getById: (id) => api.get(`/restaurants/${id}`),
    getByCategory: (category) => api.get(`/restaurants/category/${category}`),
    update: (data, token) => api.put('/restaurants/update', data, token)
};

// MENU
const MenuAPI = {
    getByRestaurant: (restaurantId) => api.get(`/menu/restaurant/${restaurantId}`),
    create: (data, token) => api.post('/menu', data, token),
    update: (id, data, token) => api.put(`/menu/${id}`, data, token),
    delete: (id, token) => api.delete(`/menu/${id}`, token)
};

// ORDERS
const OrderAPI = {
    create: (data) => {
        const token = sessionStorage.getItem('token') || localStorage.getItem('token');
        console.log('📤 Criando pedido com token:', token ? 'Token presente ✅' : 'SEM TOKEN ❌');
        return api.post('/orders', data, token);
    },
    getUserOrders: (token) => {
        console.log('📥 Buscando pedidos do usuário com token:', token ? 'Presente ✅' : 'Ausente ❌');
        return api.get('/orders/user/orders', token);
    },
    getRestaurantOrders: (token) => api.get('/orders/restaurant/orders', token),
    getRestaurantStats: (token) => api.get('/orders/restaurant/stats', token),
    updateStatus: (id, status, token) => api.put(`/orders/restaurant/${id}/status`, { status }, token),
    getById: (id, token) => api.get(`/orders/${id}`, token),
    
    // Avaliar pedido
    rateOrder: (orderId, rating, comment, token) => {
        return api.post(`/orders/${orderId}/rate`, { rating, comment }, token);
    }
};

console.log('✅ API carregada com sucesso!');
console.log('OrderAPI disponível:', OrderAPI);

// DELIVERY (Entregadores)
const DeliveryAPI = {
    register: (data) => api.post('/delivery/register', data),
    login: (data) => api.post('/delivery/login', data),
    getStats: (token) => api.get('/delivery/stats', token),
    updateOnlineStatus: (data, token) => api.put('/delivery/online-status', data, token),
    getAvailableOrders: (token) => api.get('/delivery/available-orders', token),
    acceptOrder: (orderId, token) => api.post(`/delivery/accept-order/${orderId}`, {}, token),
    ignoreOrder: (token) => api.post('/delivery/ignore-order', {}, token),
    updateDeliveryStatus: (orderId, status, token) => api.put(`/delivery/update-status/${orderId}`, { deliveryStatus: status }, token),
    getMyOrders: (token) => api.get('/delivery/my-orders', token)
};

console.log('✅ API atualizada com DeliveryAPI');
// ADDRESS API
const AddressAPI = {
    getAll: (token) => api.get('/address', token),
    create: (data, token) => api.post('/address', data, token),
    update: (id, data, token) => api.put(`/address/${id}`, data, token),
    delete: (id, token) => api.delete(`/address/${id}`, token)
};
