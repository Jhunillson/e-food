const { sequelize, Restaurant } = require('../src/models');
const GeocodingService = require('../src/services/geocodingService');

async function geocodeAllRestaurants() {
  try {
    console.log('🚀 Iniciando geocodificação de restaurantes...\n');

    const restaurants = await Restaurant.findAll({
      where: {
        latitude: null
      }
    });

    console.log(`📍 Encontrados ${restaurants.length} restaurantes sem coordenadas\n`);

    for (const restaurant of restaurants) {
      try {
        console.log(`\n🏪 Processando: ${restaurant.name}`);
        console.log(`   Endereço: ${restaurant.address}`);

        // NOVO: Detectar província do endereço
        const addressLower = restaurant.address.toLowerCase();
        let province = 'Angola'; // Padrão genérico
        let municipality = '';

        // Detectar se é Huambo ou Luanda
        if (addressLower.includes('huambo')) {
          province = 'Huambo';
          municipality = 'Huambo';
        } else if (addressLower.includes('luanda')) {
          province = 'Luanda';
          municipality = 'Luanda';
        } else if (addressLower.includes('benguela')) {
          province = 'Benguela';
          municipality = 'Benguela';
        } else if (addressLower.includes('lubango')) {
          province = 'Huíla';
          municipality = 'Lubango';
        }

        // Limpar endereço (remover "Huambo -" etc)
        let cleanAddress = restaurant.address
          .replace(/huambo\s*-?\s*/gi, '')
          .replace(/luanda\s*-?\s*/gi, '')
          .trim();

        const addressObj = {
          street: cleanAddress,
          municipality: municipality,
          province: province
        };

        const coords = await GeocodingService.geocodeAddress(addressObj);

        await restaurant.update({
          latitude: coords.latitude,
          longitude: coords.longitude
        });

        console.log(`   ✅ Coordenadas: ${coords.latitude}, ${coords.longitude}`);
        console.log(`   📍 Local: ${coords.displayName}`);

        // Delay para respeitar rate limit
        await new Promise(resolve => setTimeout(resolve, 1500));

      } catch (error) {
        console.error(`   ❌ Erro: ${error.message}`);
      }
    }

    console.log('\n\n✅ Geocodificação concluída!');
    console.log('\n📊 Resumo:');
    
    const updated = await Restaurant.count({
      where: {
        latitude: { [sequelize.Sequelize.Op.ne]: null }
      }
    });
    
    console.log(`   Total de restaurantes: ${await Restaurant.count()}`);
    console.log(`   Com coordenadas: ${updated}`);

    process.exit(0);

  } catch (error) {
    console.error('❌ Erro fatal:', error);
    process.exit(1);
  }
}

geocodeAllRestaurants();