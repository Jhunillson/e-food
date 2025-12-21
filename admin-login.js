 // Verificar se já está logado
 const adminToken = sessionStorage.getItem('adminToken') || localStorage.getItem('adminToken');
 if (adminToken) {
     window.location.href = 'admin-dashboard.html';
 }

 async function handleLogin(event) {
    event.preventDefault();
    
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;

    try {
        // Use a variável global API_URL que o api.js já configurou corretamente
        const response = await fetch(`${API_URL}/admin/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email, password })
        });

        const data = await response.json();
         
         if (data.success) {
             // Salvar dados do admin
             sessionStorage.setItem('adminToken', data.data.token);
             sessionStorage.setItem('adminData', JSON.stringify(data.data));
             
             showAlert('Login realizado com sucesso!', 'success');
             
             setTimeout(() => {
                 window.location.href = 'admin-dashboard.html';
             }, 1000);
         } else {
             showAlert(data.message || 'Erro ao fazer login', 'error');
         }
     } catch (error) {
         console.error('Erro:', error);
         showAlert('Erro ao conectar com o servidor', 'error');
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