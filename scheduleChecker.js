/**
 * ⏰ SERVIÇO DE VERIFICAÇÃO AUTOMÁTICA DE HORÁRIOS
 * 
 * Este serviço verifica a cada minuto se os restaurantes com horário automático
 * devem estar abertos ou fechados baseado na hora atual.
 * 
 * Adicione no seu server.js:
 * const scheduleChecker = require('./services/scheduleChecker');
 * scheduleChecker.start();
 */

const { Restaurant } = require('../models');

class ScheduleChecker {
    constructor() {
        this.intervalId = null;
        this.isRunning = false;
    }

    /**
     * Iniciar verificação automática
     */
    start() {
        if (this.isRunning) {
            console.log('⚠️ Verificador de horários já está em execução');
            return;
        }

        console.log('⏰ Iniciando verificador automático de horários...');
        
        // Executar imediatamente ao iniciar
        this.checkAllRestaurants();

        // Verificar a cada 1 minuto
        this.intervalId = setInterval(() => {
            this.checkAllRestaurants();
        }, 60000); // 60 segundos

        this.isRunning = true;
        console.log('✅ Verificador de horários iniciado!');
    }

    /**
     * Parar verificação automática
     */
    stop() {
        if (this.intervalId) {
            clearInterval(this.intervalId);
            this.intervalId = null;
            this.isRunning = false;
            console.log('⏸️ Verificador de horários parado');
        }
    }

    /**
     * Verificar todos os restaurantes com horário automático
     */
    async checkAllRestaurants() {
        try {
            const now = new Date();
            const currentTime = now.toLocaleTimeString('pt-AO', { 
                hour: '2-digit', 
                minute: '2-digit' 
            });

            // Buscar apenas restaurantes com horário automático ativado
            const restaurants = await Restaurant.findAll({
                where: { 
                    autoSchedule: true,
                    isActive: true 
                }
            });

            if (restaurants.length === 0) {
                return;
            }

            console.log(`\n🔍 [${currentTime}] Verificando ${restaurants.length} restaurante(s) com horário automático...`);

            let updated = 0;

            for (const restaurant of restaurants) {
                const shouldBeOpen = restaurant.checkSchedule();
                
                // Se o status mudou, atualizar
                if (restaurant.isOpen !== shouldBeOpen) {
                    await restaurant.update({ isOpen: shouldBeOpen });
                    updated++;
                    
                    console.log(`🔄 ${restaurant.name}: ${restaurant.isOpen ? 'FECHADO' : 'ABERTO'} → ${shouldBeOpen ? 'ABERTO' : 'FECHADO'}`);
                    console.log(`   📍 Horário: ${restaurant.openingTime} - ${restaurant.closingTime}`);
                }
            }

            if (updated > 0) {
                console.log(`✅ ${updated} restaurante(s) atualizado(s)\n`);
            }

        } catch (error) {
            console.error('❌ Erro ao verificar horários:', error);
        }
    }

    /**
     * Obter status do serviço
     */
    getStatus() {
        return {
            isRunning: this.isRunning,
            intervalId: this.intervalId !== null
        };
    }
}

// Exportar instância única (Singleton)
module.exports = new ScheduleChecker();