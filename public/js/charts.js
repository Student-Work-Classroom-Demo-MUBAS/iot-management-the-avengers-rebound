// Initialize charts and real-time updates
document.addEventListener('DOMContentLoaded', function() {
    // Connect to Socket.io
    const socket = io();

    // Energy Consumption Chart
    const energyCtx = document.getElementById('energyChart').getContext('2d');
    const energyChart = new Chart(energyCtx, {
        type: 'line',
        data: {
            labels: [],
            datasets: [{
                label: 'Current (A)',
                data: [],
                borderColor: '#0a2342',
                backgroundColor: 'rgba(10, 35, 66, 0.1)',
                tension: 0.4,
                fill: true,
                borderWidth: 3,
                pointBackgroundColor: '#0a2342',
                pointRadius: 5,
                pointHoverRadius: 8
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    mode: 'index',
                    intersect: false,
                    backgroundColor: 'rgba(10, 35, 66, 0.9)',
                    titleFont: {
                        size: 14,
                        weight: 'bold'
                    },
                    bodyFont: {
                        size: 14
                    },
                    padding: 12,
                    boxPadding: 6
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    grid: {
                        drawBorder: false
                    },
                    title: {
                        display: true,
                        text: 'Amperes (A)',
                        font: {
                            weight: 'bold'
                        }
                    }
                },
                x: {
                    grid: {
                        display: false
                    }
                }
            },
            interaction: {
                intersect: false,
                mode: 'nearest'
            }
        }
    });

    // Sensor Data Chart
    const sensorCtx = document.getElementById('sensorChart').getContext('2d');
    const sensorChart = new Chart(sensorCtx, {
        type: 'doughnut',
        data: {
            labels: ['Current Sensor', 'Temp/Humidity', 'Photoresistor'],
            datasets: [{
                data: [40, 35, 25],
                backgroundColor: [
                    'rgba(10, 35, 66, 0.8)',
                    'rgba(138, 154, 91, 0.8)',
                    'rgba(212, 163, 115, 0.8)'
                ],
                borderWidth: 0,
                hoverOffset: 15
            }]
        },
        options: {
            responsive: true,
            cutout: '70%',
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        padding: 20,
                        usePointStyle: true,
                        pointStyle: 'circle',
                        font: {
                            size: 13,
                            weight: '600'
                        }
                    }
                }
            }
        }
    });

    // Function to update dashboard values
    function updateDashboardValues() {
        fetch('/api/current-values')
            .then(response => response.json())
            .then(data => {
                document.getElementById('current-usage').innerText = data.current;
                document.getElementById('temperature').innerText = data.temperature;
                document.getElementById('light-level').innerText = data.light;
                document.getElementById('energy-today').innerText = data.energy;
            })
            .catch(error => console.error('Error fetching data:', error));
    }

    // Function to update energy chart
    function updateEnergyChart() {
        fetch('/api/energy-data')
            .then(response => response.json())
            .then(data => {
                energyChart.data.labels = data.labels;
                energyChart.data.datasets[0].data = data.data;
                energyChart.update();
            })
            .catch(error => console.error('Error fetching energy data:', error));
    }

    // Listen for real-time sensor updates
    socket.on('sensor-update', function(data) {
        console.log('Sensor update received:', data);
        
        // Update the appropriate card based on sensor type
        switch(data.sensorType) {
            case 'current':
                document.getElementById('current-usage').innerText = `${data.value} ${data.unit}`;
                break;
            case 'temperature':
                document.getElementById('temperature').innerText = `${data.value}${data.unit}`;
                break;
            case 'light':
                document.getElementById('light-level').innerText = `${data.value} ${data.unit}`;
                break;
            case 'energy':
                document.getElementById('energy-today').innerText = `${data.value} ${data.unit}`;
                // Update the energy chart when new energy data arrives
                updateEnergyChart();
                break;
        }
    });

    // Listen for device status updates
    socket.on('device-update', function(device) {
        console.log('Device update received:', device);
        // In a real application, you would update the device table
        // For simplicity, we'll just refresh the page to show updated data
        location.reload();
    });

    // Initial data load
    updateDashboardValues();
    updateEnergyChart();

    // Add interaction to chart buttons
    document.querySelectorAll('.chart-btn').forEach(button => {
        button.addEventListener('click', function() {
            document.querySelectorAll('.chart-btn').forEach(btn => btn.classList.remove('active'));
            this.classList.add('active');
            
            // In a real application, you would fetch data for the selected time period
            // For now, we'll just update the current chart
            updateEnergyChart();
        });
    });

    // Add event listeners for device control buttons
    document.querySelectorAll('.device-control').forEach(button => {
        button.addEventListener('click', function() {
            const deviceId = this.dataset.deviceId;
            const action = this.dataset.action;
            
            if (action === 'toggle') {
                const currentStatus = this.dataset.status;
                const newStatus = currentStatus === 'ON' ? 'OFF' : 'ON';
                
                fetch(`/api/device/${deviceId}/status`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ status: newStatus })
                })
                .then(response => response.json())
                .then(data => {
                    console.log('Device status updated:', data);
                    // The socket.io event will trigger a page refresh
                })
                .catch(error => console.error('Error updating device status:', error));
            }
        });
    });
});