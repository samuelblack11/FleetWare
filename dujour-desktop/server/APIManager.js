const axios = require('axios');

class APIManager {
    constructor() {
        this.googleMapsApiKey = config.googleMapsApiKey;
        this.openWeatherMapApiKey = config.openWeatherMapApiKey;
        this.fuelPriceApiKey = config.fuelPriceApiKey;
        this.fuelPriceApiEndpoint = config.fuelPriceApiEndpoint;
    }

    async getFuelPrices(location) {
        try {
            const response = await axios.get(`${this.fuelPriceApiEndpoint}`, {
                params: {
                    api_key: this.fuelPriceApiKey,
                    location: location // This might change depending on the API's requirement
                }
            });
            return response.data;
        } catch (error) {
            console.error('Error fetching fuel prices:', error);
        }
    }

    async getTrafficData(origin, destination) {
        try {
            const response = await axios.get('https://maps.googleapis.com/maps/api/directions/json', {
                params: {
                    origin: origin,
                    destination: destination,
                    key: this.googleMapsApiKey,
                    // Additional parameters like departure_time can be added for more specific data
                }
            });
            return response.data;
        } catch (error) {
            console.error('Error fetching traffic data:', error);
        }
    }

    async getWeatherData(latitude, longitude) {
        try {
            const response = await axios.get('https://api.openweathermap.org/data/2.5/weather', {
                params: {
                    lat: latitude,
                    lon: longitude,
                    appid: this.openWeatherMapApiKey
                }
            });
            return response.data;
        } catch (error) {
            console.error('Error fetching weather data:', error);
        }
    }
}

module.exports = APIManager;
