 // Verificar se já está logado
 const adminToken = sessionStorage.getItem('adminToken') || localStorage.getItem('adminToken');
 if (adminToken) {
     window.location.href = 'admin-dashboard.html';
 }

 async function handleLogin(event) {
    event.preventDefault();
    
    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value;

    // 1. Garantir que a URL da API está limpa (sem barra no final)
    const base = API_URL.replace(/\/$/, ""); 
    const finalUrl = `${base}/admin/login`;

    console.log('📡 Tentando login em:', finalUrl);

    try {
        const response = await fetch(finalUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify({ email, password })
        });

        // 2. Se der 404 aqui, o problema é o mapeamento no Backend
        if (response.status === 404) {
            showAlert('Erro 404: Rota de login não encontrada no servidor.', 'error');
            return;
        }

        const data = await response.json();
         
        if (data.success) {
            // Importante: verifique se o seu backend retorna data.data ou data.token direto
            const token = data.data?.token || data.token;
            const adminData = data.data || data.admin;

            sessionStorage.setItem('adminToken', token);
            sessionStorage.setItem('adminData', JSON.stringify(adminData));
            
            // Também salvar no localStorage para persistência se desejar
            localStorage.setItem('adminToken', token);
            
            showAlert('Login realizado com sucesso!', 'success');
            
            setTimeout(() => {
                window.location.href = 'admin-dashboard.html';
            }, 1000);
        } else {
            showAlert(data.message || 'Credenciais inválidas', 'error');
        }
    } catch (error) {
        console.error('Erro de conexão:', error);
        showAlert('Não foi possível contactar o servidor.', 'error');
    }
}

 function showAlert(message, type) {
     const alert = document.getElementById('alert');
     alert.textContent = message;
     alert.className = `alert ${type}`;
     alert.style.display = 'block';
     
     setTimeout(() => {
         alert.style.display = 'none';
     }, 5000);
 }