const axios = require('axios');

class GeocodingService {
  
  // Converter endereço em coordenadas usando Nominatim (OpenStreetMap)
  static async geocodeAddress(address) {
    try {
      const query = `${address.street}, ${address.municipality}, ${address.province}, Angola`;
      
      const response = await axios.get('https://nominatim.openstreetmap.org/search', {
        params: {
          q: query,
          format: 'json',
          limit: 1
        },
        headers: {
          'User-Agent': 'Ombbia-App/1.0'
        }
      });

      if (response.data && response.data.length > 0) {
        return {
          latitude: parseFloat(response.data[0].lat),
          longitude: parseFloat(response.data[0].lon)
        };
      }

      // Fallback: coordenadas do centro de Luanda
      console.warn('Endereço não geocodificado, usando centro de Luanda');
      return {
        latitude: -8.8383,
        longitude: 13.2344
      };

    } catch (error) {
      console.error('Erro no geocoding:', error.message);
      // Fallback para Luanda
      return {
        latitude: -8.8383,
        longitude: 13.2344
      };
    }
  }

  // Calcular distância entre dois pontos usando a função SQL
  static async calculateDistance(sequelize, location1, location2) {
    try {
      const query = `
        SELECT calculate_distance(
          :lat1, :lon1, :lat2, :lon2
        ) as distance_km
      `;

      const result = await sequelize.query(query, {
        replacements: {
          lat1: location1.latitude,
          lon1: location1.longitude,
          lat2: location2.latitude,
          lon2: location2.longitude
        },
        type: sequelize.QueryTypes.SELECT
      });

      return parseFloat(result[0].distance_km);

    } catch (error) {
      console.error('Erro ao calcular distância:', error);
      return 5; // Fallback: 5km
    }
  }

  // Calcular preço de entrega (200 Kz por km)
  static calculateDeliveryPrice(distanceKm) {
    const pricePerKm = 200; // Kz
    const minPrice = 500; // Preço mínimo (ex: 500 Kz)
    
    const price = Math.ceil(distanceKm) * pricePerKm;
    
    return Math.max(price, minPrice);
  }
}

module.exports = GeocodingService;