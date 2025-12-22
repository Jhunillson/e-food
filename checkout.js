// Recuperar carrinho do sessionStorage
let userAddresses = [];

let cart = [];
let currentStep = 1;
let orderData = {
    address: {},
    payment: {},
    restaurant: {}
};
let addressSelect = null;
let addressText = null;

// Calcular taxa de entrega baseada no horário
function calculateDeliveryFee() {
    const now = new Date();
    const hour = now.getHours();
    
    // Após 21h (21:00), a taxa é Kz 1000, antes disso é Kz 500
    if (hour >= 21 || hour < 6) {
        return 1000.00;
    } else {
        return 500.00;
    }
}

// Atualizar visualização do endereço selecionado
function updateAddressDisplay(address) {
    const addressSection = document.querySelector('.address-selector');
    if (!addressSection) return;

    // Remover display antigo se existir
    const oldDisplay = addressSection.querySelector('.current-address-display');
    if (oldDisplay) {
        oldDisplay.remove();
    }

    // Criar novo display
    const display = document.createElement('div');
    display.className = 'current-address-display';
    display.innerHTML = `
        <div style="margin-top: 15px; padding: 15px; background: #f0f9ff; border-left: 4px solid #ff6b35; border-radius: 8px;">
            <h4 style="margin: 0 0 10px 0; color: #333; font-size: 0.95rem;">📍 Endereço de Entrega:</h4>
            <p style="margin: 5px 0; color: #555; font-size: 0.9rem;">
                <strong>${address.label || 'Endereço'}</strong><br>
                ${address.street}, ${address.number}${address.complement ? ', ' + address.complement : ''}<br>
                ${address.neighborhood} - ${address.municipality}<br>
                ${address.province}
            </p>
            ${address.reference ? `<p style="margin: 5px 0; color: #777; font-size: 0.85rem; font-style: italic;">Ref: ${address.reference}</p>` : ''}
        </div>
    `;
    
    addressSection.appendChild(display);
}

// Mudar endereço selecionado (MANTIDO o uso de índice)
function changeCheckoutAddress() {
    const select = document.getElementById('addressSelect');
    const selectedIndex = parseInt(select.value);

    if (isNaN(selectedIndex) || selectedIndex < 0) {
        console.warn('⚠️ Nenhum endereço selecionado');
        return;
    }

    const selectedAddress = userAddresses[selectedIndex];

    if (selectedAddress) {
        orderData.address = selectedAddress;
        console.log('✅ Endereço selecionado para checkout:', selectedAddress);
        
        // Atualizar visualização
        updateAddressDisplay(selectedAddress);
        
        // Mostrar notificação
        showAddressChangeNotification(selectedAddress);
    }
}

// Mostrar notificação de mudança de endereço
function showAddressChangeNotification(address) {
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed;
        top: 100px;
        right: 20px;
        background: linear-gradient(135deg, #48c774, #3ab864);
        color: white;
        padding: 1rem 1.5rem;
        border-radius: 10px;
        box-shadow: 0 5px 15px rgba(0,0,0,0.3);
        z-index: 10000;
        max-width: 300px;
        font-weight: 500;
        animation: slideInRight 0.3s ease;
    `;
    
    notification.innerHTML = `
        <div style="display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.5rem;">
            <span style="font-size: 1.5rem;">✅</span>
            <strong>Endereço Atualizado</strong>
        </div>
        <div style="font-size: 0.85rem; opacity: 0.95;">
            ${address.label || 'Endereço'}<br>
            ${address.street}, ${address.number}
        </div>
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.animation = 'slideOutRight 0.3s ease';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

// Ir para gerenciador de endereços
function goToAddressManager() {
    // Salvar que veio do checkout para redirecionar de volta
    sessionStorage.setItem('returnToCheckout', 'true');
    window.location.href = 'profile.html#addresses';
}

// Carregar dados do carrinho
async function loadCart() {
    const cartData = sessionStorage.getItem('cart');
    const restaurantData = sessionStorage.getItem('restaurant');
    const token = sessionStorage.getItem('token') || localStorage.getItem('token');

    console.log('🔍 Cart Data:', cartData);
    console.log('🔍 Restaurant Data:', restaurantData);

    if (cartData) {
        cart = JSON.parse(cartData);
    }

    if (restaurantData) {
        orderData.restaurant = JSON.parse(restaurantData);
    }

    if (cart.length === 0) {
        alert('Seu carrinho está vazio!');
        window.location.href = 'index.html';
        return;
    }

    if (!token) {
        alert('Você precisa estar logado!');
        sessionStorage.setItem('redirectAfterLogin', 'checkout.html');
        window.location.href = 'auth.html';
        return;
    }

    // Verificar se voltou do gerenciador de endereços
    const returnedFromAddressManager = sessionStorage.getItem('returnToCheckout');
    if (returnedFromAddressManager) {
        sessionStorage.removeItem('returnToCheckout');
        showAddressUpdateSuccess();
    }

    // Aviso taxa noturna
    const hour = new Date().getHours();
    if (hour >= 21 || hour < 6) {
        showNightFeeNotification();
    }

    // Carregar endereços e resumo
    await loadAddresses();

    updateOrderSummary();
}

// Mostrar sucesso ao retornar do gerenciador
function showAddressUpdateSuccess() {
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed;
        top: 100px;
        right: 20px;
        background: linear-gradient(135deg, #48c774, #3ab864);
        color: white;
        padding: 1rem 1.5rem;
        border-radius: 10px;
        box-shadow: 0 5px 15px rgba(0,0,0,0.3);
        z-index: 10000;
        max-width: 300px;
        font-weight: 500;
    `;
    
    notification.innerHTML = `
        <div style="display: flex; align-items: center; gap: 0.5rem;">
            <span style="font-size: 1.5rem;">✅</span>
            <strong>Endereços atualizados!</strong>
        </div>
    `;
    
    document.body.appendChild(notification);
    setTimeout(() => notification.remove(), 3000);
}

// Mostrar notificação de taxa noturna
function showNightFeeNotification() {
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed;
        top: 100px;
        right: 20px;
        background: linear-gradient(135deg, #ff6b35, #f7b731);
        color: white;
        padding: 1rem 1.5rem;
        border-radius: 10px;
        box-shadow: 0 5px 15px rgba(0,0,0,0.3);
        z-index: 10000;
        max-width: 300px;
        font-weight: 600;
    `;
    
    notification.innerHTML = `
        <div style="display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.5rem;">
            <span style="font-size: 1.5rem;">⏰</span>
            <strong>Horário Noturno</strong>
        </div>
        <div style="font-size: 0.9rem; font-weight: normal;">
            Taxa de entrega: Kz 1.000,00<br>
            (Das 21h às 6h)
        </div>
    `;
    
    document.body.appendChild(notification);
    setTimeout(() => notification.remove(), 8000);
}

// Atualizar resumo do pedido
function updateOrderSummary() {
    console.log('🔄 Atualizando resumo do pedido...');
    
    const summaryRestaurant = document.getElementById('summaryRestaurant');
    
    if (!summaryRestaurant) {
        console.error('❌ Elemento summaryRestaurant não encontrado!');
        return;
    }
    
    // Mostrar foto do restaurante
    let restaurantImage = '';
    if (orderData.restaurant.image_url) {
        restaurantImage = `
            <div class="restaurant-icon" style="width: 60px; height: 60px; border-radius: 50%; overflow: hidden;">
                <img src="${orderData.restaurant.image_url}" 
                     alt="${orderData.restaurant.name}" 
                     style="width: 100%; height: 100%; object-fit: cover;">
            </div>
        `;
    } else {
        restaurantImage = `<div class="restaurant-icon">${orderData.restaurant.icon || '🍽️'}</div>`;
    }
    
    summaryRestaurant.innerHTML = `
        ${restaurantImage}
        <div>
            <div class="restaurant-name">${orderData.restaurant.name}</div>
            <div class="restaurant-time">${orderData.restaurant.time}</div>
        </div>
    `;
    
    // Atualizar itens
    const summaryItems = document.getElementById('summaryItems');
    summaryItems.innerHTML = '';
    
    cart.forEach(item => {
        const itemDiv = document.createElement('div');
        itemDiv.className = 'summary-item';
        const itemPrice = parseFloat(item.price);
        const itemTotal = itemPrice * item.quantity;
        
        itemDiv.innerHTML = `
            <div class="summary-item-info">
                <div class="summary-item-name">${item.name}</div>
                <div class="summary-item-quantity">${item.quantity}x Kz ${formatCurrency(itemPrice)}</div>
            </div>
            <div class="summary-item-price">Kz ${formatCurrency(itemTotal)}</div>
        `;
        summaryItems.appendChild(itemDiv);
    });
    
    // Calcular totais
    const subtotal = cart.reduce((sum, item) => sum + (parseFloat(item.price) * item.quantity), 0);
    const deliveryFee = calculateDeliveryFee();
    const total = subtotal + deliveryFee;
    
    const hour = new Date().getHours();
    let deliveryFeeText = `Kz ${formatCurrency(deliveryFee)}`;
    
    if (hour >= 21 || hour < 6) {
        deliveryFeeText += ' <span style="color: #ff6b35; font-size: 0.85rem;">(⏰ Horário noturno)</span>';
    }
    
    document.getElementById('summarySubtotal').textContent = `Kz ${formatCurrency(subtotal)}`;
    
    const deliveryFeeElement = document.getElementById('summaryDeliveryFee');
    if (deliveryFeeElement) {
        deliveryFeeElement.innerHTML = deliveryFeeText;
    }
    
    document.getElementById('summaryTotal').textContent = `Kz ${formatCurrency(total)}`;
    
    orderData.deliveryFee = deliveryFee;
}

// Formatar moeda angolana
function formatCurrency(value) {
    const numValue = typeof value === 'string' ? parseFloat(value) : value;
    if (isNaN(numValue)) return '0,00';
    return numValue.toFixed(2).replace('.', ',').replace(/\B(?=(\d{3})+(?!\d))/g, '.');
}

// Navegar entre etapas
function goToStep(step) {
    if (step > currentStep) {
        if (currentStep === 1 && !validatePayment()) {
            return;
        }
    }
    
    document.querySelectorAll('.checkout-step').forEach(s => s.classList.add('hidden'));
    document.getElementById(`step${step}`).classList.remove('hidden');
    
    document.querySelectorAll('.progress-step').forEach((s, index) => {
        s.classList.remove('active', 'completed');
        
        if (index + 1 < step) {
            s.classList.add('completed');
        } else if (index + 1 === step) {
            s.classList.add('active');
        }
    });
    
    currentStep = step;
    
    if (step === 2) {
        showConfirmation();
    }
    
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// Validar pagamento
function validatePayment() {
    const selectedPayment = document.querySelector('input[name="payment"]:checked');
    
    if (!selectedPayment) {
        alert('Por favor, selecione uma forma de pagamento!');
        return false;
    }
    
    const paymentMethod = selectedPayment.value;
    
    if (paymentMethod === 'card' && !validateCard()) {
        return false;
    }
    
    orderData.payment = {
        method: paymentMethod,
        methodName: getPaymentMethodName(paymentMethod)
    };
    
    if (paymentMethod === 'card') {
        orderData.payment.cardNumber = document.getElementById('cardNumber').value.slice(-4);
    }
    
    if (paymentMethod === 'cash') {
        orderData.payment.changeFor = document.getElementById('changeFor').value;
    }
    
    return true;
}

// Validar cartão
function validateCard() {
    const cardNumber = document.getElementById('cardNumber').value;
    const cardName = document.getElementById('cardName').value;
    const cardExpiry = document.getElementById('cardExpiry').value;
    const cardCVV = document.getElementById('cardCVV').value;
    
    if (!cardNumber || !cardName || !cardExpiry || !cardCVV) {
        alert('Por favor, preencha todos os dados do cartão!');
        return false;
    }
    
    return true;
}

// Obter nome do método de pagamento
function getPaymentMethodName(method) {
    const names = {
        multicaixa: 'Multicaixa Express',
        card: 'Cartão Visa/Mastercard',
        cash: 'Dinheiro (Kwanzas)',
        delivery: 'Pagamento na Entrega'
    };
    return names[method] || method;
}

// Selecionar forma de pagamento
function selectPayment(method) {
    document.getElementById(method).checked = true;
    
    document.querySelectorAll('.payment-option').forEach(option => {
        option.classList.remove('selected');
    });
    const savedAddressesJson = localStorage.getItem(`addresses_${userId}`);

    // NOTA: É necessário o 'event' global ou passar 'event' como argumento
    // Se estiver a usar o onclick diretamente no HTML, a linha abaixo funciona.
    if (event && event.currentTarget) {
        event.currentTarget.classList.add('selected');
    }
    
    const cardForm = document.getElementById('cardForm');
    const moneyForm = document.getElementById('moneyForm');
    
    cardForm.classList.add('hidden');
    moneyForm.classList.add('hidden');
    
    if (method === 'card') {
        cardForm.classList.remove('hidden');
    }
    
    if (method === 'cash') {
        moneyForm.classList.remove('hidden');
    }
}

// Mostrar confirmação
function showConfirmation() {
    const confirmAddress = document.getElementById('confirmAddress');
    
    if (orderData.address && orderData.address.province) {
        confirmAddress.innerHTML = `
            <p><strong>${orderData.address.label || 'Endereço'}:</strong></p>
            <p>${orderData.address.street}, ${orderData.address.number}</p>
            ${orderData.address.complement ? `<p>Complemento: ${orderData.address.complement}</p>` : ''}
            <p>${orderData.address.neighborhood} - ${orderData.address.municipality}</p>
            <p>${orderData.address.province}</p>
            ${orderData.address.reference ? `<p><em>Ref: ${orderData.address.reference}</em></p>` : ''}
        `;
    } else {
        confirmAddress.innerHTML = `
            <p style="color: #e74c3c;">❌ Endereço não encontrado. Por favor, selecione um endereço.</p>
        `;
    }
    
    // Pagamento
    const confirmPayment = document.getElementById('confirmPayment');
    let paymentText = `<p><strong>Método:</strong> ${orderData.payment.methodName}</p>`;
    
    if (orderData.payment.cardNumber) {
        paymentText += `<p><strong>Cartão:</strong> **** **** **** ${orderData.payment.cardNumber}</p>`;
    }
    
    if (orderData.payment.changeFor) {
        paymentText += `<p><strong>Troco para:</strong> ${orderData.payment.changeFor}</p>`;
    }
    
    confirmPayment.innerHTML = paymentText;
    
    // Itens
    const confirmItems = document.getElementById('confirmItems');
    confirmItems.innerHTML = '';
    
    cart.forEach(item => {
        const itemDiv = document.createElement('div');
        itemDiv.className = 'confirmation-item';
        const itemPrice = parseFloat(item.price);
        const itemTotal = itemPrice * item.quantity;
        
        itemDiv.innerHTML = `
            <span>${item.quantity}x ${item.name}</span>
            <span>Kz ${formatCurrency(itemTotal)}</span>
        `;
        confirmItems.appendChild(itemDiv);
    });
}


// NOTE: Assuming OrderAPI.create exists elsewhere, or this is a mock.
// Finalizar pedido
async function finishOrder() {
    const a = orderData.address;

    if (!a || !a.street || !a.municipality || !a.province) {
        alert('❌ Endereço incompleto!\n\nPor favor, escolha um endereço válido antes de finalizar o pedido.');
        goToStep(1);
        return;
    }

    // 🆕 VERIFICAR SE É PAGAMENTO NA ENTREGA
    const isDeliveryPayment = orderData.payment.method === 'delivery';
    
    let confirmMsg = `CONFIRMAR PEDIDO\n\n` +
        `📍 Endereço de Entrega:\n` +
        `${a.label || 'Endereço'}\n` +
        `${a.street}, ${a.number}\n` +
        `${a.neighborhood} - ${a.municipality}\n` +
        `${a.province}\n\n` +
        `💳 Pagamento: ${orderData.payment.methodName}\n\n`;
    
    // 🆕 AVISO SE FOR PAGAMENTO NA ENTREGA
    if (isDeliveryPayment) {
        confirmMsg += `⚠️ ATENÇÃO: Seu pedido será enviado para aprovação administrativa antes de ser processado.\n\n`;
    }
    
    confirmMsg += `Confirmar pedido?`;

    if (!confirm(confirmMsg)) return;

    const subtotal = cart.reduce((sum, item) => sum + (parseFloat(item.price) * item.quantity), 0);
    const deliveryFee = calculateDeliveryFee();
    const total = subtotal + deliveryFee;

    const restaurantInfo = JSON.parse(sessionStorage.getItem('restaurant') || '{}');

    const pedidoData = {
        restaurantId: restaurantInfo.restaurantId || 1,
        items: cart,
        address: orderData.address,
        payment: orderData.payment,
        subtotal,
        deliveryFee,
        total
    };

    try {
        if (typeof OrderAPI !== 'undefined' && typeof OrderAPI.create === 'function') {
            const response = await OrderAPI.create(pedidoData);

            if (response.success) {
                sessionStorage.removeItem('cart');
                sessionStorage.removeItem('restaurant');

                // 🆕 MENSAGEM DIFERENTE SE REQUER APROVAÇÃO
                if (response.requiresApproval) {
                    alert(`⏳ Pedido enviado para aprovação!\n\nTotal: Kz ${formatCurrency(total)}\nPedido Nº ${response.data.id}\n\n⚠️ Seu pedido será revisado pelo administrador antes de ser enviado ao restaurante.`);
                } else {
                    alert(`✅ Pedido confirmado!\n\nTotal: Kz ${formatCurrency(total)}\nPedido Nº ${response.data.id}`);
                }
                
                window.location.href = 'orders.html';
            } else {
                alert('Erro ao criar pedido: ' + response.message);
            }
        } else {
            console.error('OrderAPI.create não definida. Simulação de sucesso.');
            sessionStorage.removeItem('cart');
            sessionStorage.removeItem('restaurant');
            alert(`✅ Pedido simulado confirmado!\n\nTotal: Kz ${formatCurrency(total)}\n(Voltar para Home)`);
            window.location.href = 'index.html';
        }
       
    } catch (err) {
        console.error(err);
        alert('Erro de conexão com servidor ou erro desconhecido.');
    }
}

// Formatação de campos
function setupFieldFormatting() {
    const cardNumberInput = document.getElementById('cardNumber');
    if (cardNumberInput) {
        cardNumberInput.addEventListener('input', function(e) {
            let value = e.target.value.replace(/\D/g, '');
            value = value.replace(/(\d{4})(?=\d)/g, '$1 ');
            e.target.value = value.slice(0, 19);
        });
    }
    
    const cardExpiryInput = document.getElementById('cardExpiry');
    if (cardExpiryInput) {
        cardExpiryInput.addEventListener('input', function(e) {
            let value = e.target.value.replace(/\D/g, '');
            if (value.length > 2) {
                value = value.slice(0, 2) + '/' + value.slice(2, 4);
            }
            e.target.value = value;
        });
    }
    
    const changeForInput = document.getElementById('changeFor');
    if (changeForInput) {
        changeForInput.addEventListener('input', function(e) {
            let value = e.target.value.replace(/\D/g, '');
            if (value) {
                // Trata o valor como Kz (multiplica por 100 para ter centavos)
                const numValue = parseInt(value) / 100; 
                e.target.value = 'Kz ' + formatCurrency(numValue);
            } else {
                e.target.value = '';
            }
        });
    }
}

// Adicionar animações CSS
const style = document.createElement('style');
style.textContent = `
    @keyframes slideInRight {
        from { transform: translateX(400px); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
    }
    @keyframes slideOutRight {
        from { transform: translateX(0); opacity: 1; }
        to { transform: translateX(400px); opacity: 0; }
    }
    
    .address-warning {
        animation: shake 0.5s;
    }
    
    @keyframes shake {
        0%, 100% { transform: translateX(0); }
        25% { transform: translateX(-10px); }
        75% { transform: translateX(10px); }
    }
`;
document.head.appendChild(style);

// ------------------------------
// 🎯 CARREGAR ENDEREÇOS DO LOCAL STORAGE (CORRIGIDO PARA ENDEREÇO DE CADASTRO)
// ------------------------------
async function loadAddresses() {
    console.log('🔄 Iniciando loadAddresses...');
    
    const token = localStorage.getItem('token') || sessionStorage.getItem('token');

    if (!token) {
        console.warn("⚠️ Usuário não logado!");
        return;
    }

    // 1. Obter dados do usuário
    
    let currentUser = null;
    let userId = null;
    
    try {
        const response = await fetch(`${API_URL}/auth/profile`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}` // Usa o token já obtido
            }
        });
    
        const result = await response.json();
    
        if (result.success) {
            currentUser = result.data; // Dados completos, incluindo endereço
            userId = currentUser.id;
            
            // Atualizar o armazenamento local com o objeto completo
            if (localStorage.getItem('token')) localStorage.setItem('currentUser', JSON.stringify(currentUser));
            if (sessionStorage.getItem('token')) sessionStorage.setItem('currentUser', JSON.stringify(currentUser));
            
        } else {
            console.error("❌ Erro ao buscar perfil via API:", result.message);
            return;
        }
    } catch (error) {
        console.error('Erro de rede ao buscar perfil:', error);
        // Tenta carregar localmente como fallback (mas se falhou na API, a chance é alta de estar vazio)
        const currentUserJson = localStorage.getItem('currentUser') || sessionStorage.getItem('currentUser');
        if (currentUserJson) {
            currentUser = JSON.parse(currentUserJson);
            userId = currentUser.id;
        } else {
            return;
        }
    }
    
    // 2. Carregar endereços adicionais do perfil (endereços salvos)
    const savedAddressesJson = localStorage.getItem(`addresses_${userId}`);
    let savedAddresses = savedAddressesJson ? JSON.parse(savedAddressesJson) : [];
    
    // 3. Preparar lista final de endereços
    let finalAddresses = [];
    
    // 4. Verificar se existe endereço de cadastro no currentUser (Base de Dados)
    const hasRegistrationAddress = 
        currentUser.street && 
        currentUser.number && 
        currentUser.municipality && 
        currentUser.province;
        
    let hasDefaultInSaved = savedAddresses.some(a => a.isDefault || a.default);
    
    if (hasRegistrationAddress) {
        const registrationAddress = {
            // ID especial para o endereço de cadastro
            id: 'reg_address_' + userId, 
            label: 'Endereço de Cadastro', // Rótulo para identificação
            street: currentUser.street,
            number: currentUser.number,
            neighborhood: currentUser.neighborhood || '',
            municipality: currentUser.municipality,
            province: currentUser.province,
            complement: currentUser.complement || '',
            reference: currentUser.reference || '',
            // É padrão APENAS se não houver nenhum outro endereço padrão salvo
            isDefault: !hasDefaultInSaved && savedAddresses.length === 0 
        };
        finalAddresses.push(registrationAddress);
        console.log('✅ Endereço de Cadastro (currentUser) incluído.');
    }

    // 5. Adicionar endereços salvos no perfil
    savedAddresses = savedAddresses.map(addr => ({ 
        ...addr, 
        isDefault: addr.isDefault || addr.default || false 
    }));
    
    finalAddresses = finalAddresses.concat(savedAddresses);

    userAddresses = finalAddresses;
    
    console.log('✅ Endereços Finais Combinados:', userAddresses);
    console.log('📊 Total de endereços:', userAddresses.length);

    const select = document.getElementById("addressSelect");
    const currentText = document.getElementById("currentAddressText");

    if (!select || !currentText) {
        console.error("❌ Elementos addressSelect ou currentAddressText não encontrados!");
        return;
    }

    select.innerHTML = "";

    if (userAddresses.length === 0) {
        console.warn('⚠️ Nenhum endereço cadastrado');
        select.innerHTML = `<option value="">Nenhum endereço cadastrado</option>`;
        currentText.textContent = "Nenhum endereço cadastrado. Adicione um endereço no seu perfil.";
        
        // Adicionar botão para ir ao perfil (se não existir)
        let addButton = document.querySelector('.address-selector .btn-primary');
        if (!addButton) {
            const addressSection = document.querySelector('.address-selector');
            if (addressSection) {
                addButton = document.createElement('button');
                addButton.className = 'btn-primary';
                addButton.style.marginTop = '15px';
                addButton.textContent = '➕ Adicionar Endereço';
                addButton.onclick = goToAddressManager;
                addressSection.appendChild(addButton);
            }
        }
        return;
    }

    // 6. Popular o seletor (USANDO ÍNDICE DO ARRAY)
    userAddresses.forEach((addr, index) => {
        const option = document.createElement("option");
        option.value = index; // ← USAR ÍNDICE
        
        const isDefault = addr.isDefault || addr.default || false;
        
        const label = addr.label || (addr.id.toString().startsWith('reg_address_') ? 'Endereço de Cadastro' : 'Endereço ' + (index + 1));

        option.textContent = `${label} - ${addr.street}, ${addr.number} - ${addr.neighborhood}`;
        if (isDefault) {
            option.selected = true;
        }
        select.appendChild(option);
    });

    // 7. Mostrar endereço padrão ou primeiro
    const defaultAddress = userAddresses.find(a => a.isDefault || a.default) || userAddresses[0];

    if (defaultAddress) {
        // Obter o label correto
        const label = defaultAddress.label || (defaultAddress.id.toString().startsWith('reg_address_') ? 'Endereço de Cadastro' : 'Endereço');
        
        currentText.textContent =
            `${label} - ${defaultAddress.street}, ${defaultAddress.number}`;

        orderData.address = defaultAddress;
        console.log("✅ Endereço padrão aplicado no checkout:", orderData.address);
        
        // Atualizar display visual
        updateAddressDisplay(defaultAddress);
    }
}

// ------------------------------
// 2. CONFIRMAR ENDEREÇO SELECIONADO
// ------------------------------
function confirmAddress() {
    const selectedIndex = parseInt(addressSelect.value);
    
    if (isNaN(selectedIndex) || selectedIndex < 0 || selectedIndex >= userAddresses.length) {
        alert('Por favor, selecione um endereço válido.');
        return;
    }

    const selectedAddress = userAddresses[selectedIndex];

    // 1. Atualizar orderData com o objeto de endereço selecionado
    orderData.address = selectedAddress;

    // 2. Atualizar o texto de exibição
    addressText.textContent = 
        `${selectedAddress.label || 'Endereço'} - ${selectedAddress.street}, ${selectedAddress.number}`;

    // 3. Atualizar display visual
    updateAddressDisplay(selectedAddress);

    // 4. Fechar o modal
    closeAddressModal();
    
    console.log("✅ Endereço confirmado para o pedido:", orderData.address);
}

// ------------------------------
// 3. ABRIR MODAL
// ------------------------------
function openAddressModal() {
    console.log('🔓 Abrindo modal de endereços');
    const modal = document.getElementById('addressSelectorModal');
    if (modal) {
        modal.classList.add('active');
    } else {
        console.error('❌ Modal addressSelectorModal não encontrado!');
    }
}

// ------------------------------
// 4. FECHAR MODAL
// ------------------------------
function closeAddressModal() {
    console.log('🔒 Fechando modal de endereços');
    const modal = document.getElementById('addressSelectorModal');
    if (modal) {
        modal.classList.remove('active');
    }
}

// Inicialização
document.addEventListener('DOMContentLoaded', function() {
    console.log('✅ Página de checkout carregada! 🛒');

    addressSelect = document.getElementById('addressSelect');
    addressText = document.getElementById('currentAddressText');

    loadCart();
    setupFieldFormatting();
});