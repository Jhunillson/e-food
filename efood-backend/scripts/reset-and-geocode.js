// Criar script: scripts/reset-and-geocode.js
const { sequelize, Restaurant } = require('../src/models');
const GeocodingService = require('../src/services/geocodingService');

async function resetAndGeocode() {
  try {
    console.log('🔄 Limpando coordenadas incorretas...\n');

    // Limpar todas as coordenadas
    await Restaurant.update(
      { latitude: null, longitude: null },
      { where: {} }
    );

    console.log('✅ Coordenadas limpas!\n');
    console.log('🚀 Iniciando geocodificação correta...\n');

    const restaurants = await Restaurant.findAll();

    for (const restaurant of restaurants) {
      try {
        console.log(`\n🏪 ${restaurant.name}`);
        console.log(`   📍 ${restaurant.address}`);

        const addressLower = restaurant.address.toLowerCase();
        let province = 'Angola';
        let municipality = '';

        if (addressLower.includes('huambo')) {
          province = 'Huambo';
          municipality = 'Huambo';
        } else if (addressLower.includes('luanda')) {
          province = 'Luanda';
          municipality = 'Luanda';
        }

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

        console.log(`   ✅ ${coords.latitude}, ${coords.longitude}`);

        await new Promise(resolve => setTimeout(resolve, 1500));

      } catch (error) {
        console.error(`   ❌ ${error.message}`);
      }
    }

    console.log('\n\n✅ Concluído!');
    process.exit(0);

  } catch (error) {
    console.error('❌ Erro:', error);
    process.exit(1);
  }
}

resetAndGeocode();
