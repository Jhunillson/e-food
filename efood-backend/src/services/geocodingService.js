const axios = require('axios');

class GeocodingService {
  
  // Converter endereço em coordenadas
  static async geocodeAddress(address) {
    try {
      let query = '';
      
      if (typeof address === 'string') {
        query = `${address}, Angola`;
      } else {
        const parts = [];
        if (address.street) parts.push(address.street);
        if (address.number) parts.push(address.number);
        if (address.neighborhood) parts.push(address.neighborhood);
        if (address.municipality) parts.push(address.municipality);
        if (address.province) parts.push(address.province);
        parts.push('Angola');
        query = parts.filter(p => p).join(', '); // Remove vazios
      }

      console.log(`🔍 Geocodificando: ${query}`);

      const response = await axios.get('https://nominatim.openstreetmap.org/search', {
        params: {
          q: query,
          format: 'json',
          limit: 1,
          countrycodes: 'ao'
        },
        headers: {
          'User-Agent': 'Ombbia-App/1.0'
        },
        timeout: 10000
      });

      if (response.data && response.data.length > 0) {
        const result = {
          latitude: parseFloat(response.data[0].lat),
          longitude: parseFloat(response.data[0].lon),
          displayName: response.data[0].display_name
        };
        
        console.log(`✅ Coordenadas encontradas: ${result.latitude}, ${result.longitude}`);
        return result;
      }

      // NOVO: Fallback inteligente baseado na província
      console.warn(`⚠️ Endereço não encontrado no OpenStreetMap`);
      
      const provinceLower = (address.province || address.municipality || '').toLowerCase();
      
      // Coordenadas aproximadas das capitais provinciais
      const fallbacks = {
        'huambo': { latitude: -12.7764, longitude: 15.7389, name: 'Huambo' },
        'luanda': { latitude: -8.8383, longitude: 13.2344, name: 'Luanda' },
        'benguela': { latitude: -12.5763, longitude: 13.4055, name: 'Benguela' },
        'lubango': { latitude: -14.9177, longitude: 13.4925, name: 'Lubango' },
        'huíla': { latitude: -14.9177, longitude: 13.4925, name: 'Lubango' },
        'cabinda': { latitude: -5.5500, longitude: 12.2000, name: 'Cabinda' },
        'namibe': { latitude: -15.1958, longitude: 12.1522, name: 'Namibe' }
      };

      for (const [key, coords] of Object.entries(fallbacks)) {
        if (provinceLower.includes(key)) {
          console.log(`📍 Usando coordenadas aproximadas de ${coords.name}`);
          return {
            latitude: coords.latitude,
            longitude: coords.longitude,
            displayName: `${coords.name}, Angola (aproximado)`
          };
        }
      }

      // Fallback final: centro de Angola
      console.warn(`⚠️ Província não identificada, usando centro de Angola`);
      return {
        latitude: -11.2027, // Centro geográfico de Angola
        longitude: 17.8739,
        displayName: 'Angola (centro geográfico)'
      };

    } catch (error) {
      console.error('❌ Erro no geocoding:', error.message);
      
      return {
        latitude: -11.2027,
        longitude: 17.8739,
        displayName: 'Angola (erro)'
      };
    }
  }

  // Calcular distância
  static async calculateDistance(sequelize, location1, location2) {
    try {
      const lat1 = location1.latitude;
      const lon1 = location1.longitude;
      const lat2 = location2.latitude;
      const lon2 = location2.longitude;
  
      const R = 6371; // Raio da Terra em km
      const dLat = (lat2 - lat1) * Math.PI / 180;
      const dLon = (lon2 - lon1) * Math.PI / 180;
      
      const a = 
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
      
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      const distance = R * c;
  
      console.log(`📏 Distância real calculada: ${distance.toFixed(2)} km`);
      return distance;
  
    } catch (error) {
      console.error('Erro ao calcular distância no Node:', error);
      return 1; // Retorne um valor menor como fallback para não prejudicar tanto o cliente
    }
  }

  // Calcular preço de entrega (200 Kz por km)
  static calculateDeliveryPrice(distanceKm) {
    const pricePerKm = 200;
    const minPrice = 500;
    
    const price = Math.ceil(distanceKm) * pricePerKm;
    
    return Math.max(price, minPrice);
  }
}

module.exports = GeocodingService;