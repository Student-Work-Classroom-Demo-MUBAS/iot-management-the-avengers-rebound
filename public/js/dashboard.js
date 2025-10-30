async function fetchSensorData() {
  const response = await fetch('/api/sensordata/latest');
  const data = await response.json();
  console.log('Sensor data:', data);
}

setInterval(fetchSensorData, 5000);
fetchSensorData();
