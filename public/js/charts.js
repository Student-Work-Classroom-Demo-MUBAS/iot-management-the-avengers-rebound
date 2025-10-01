// public/js/charts.js
document.addEventListener('DOMContentLoaded', function() {
    const socket = io();
    let energyChart, sensorChart;

    // Initialize charts
    initializeCharts();

    // Real-time event listeners
    initializeSocketListeners();

    // UI interactions
    initializeUIHandlers();

    // Initial data load
    loadInitialData();

    function initializeCharts() {
        // Energy Consumption Chart
        const energyCtx = document.getElementById('energyChart')?.getContext('2d');
        if (energyCtx) {
            energyChart = new Chart(energyCtx, {
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
                    maintainAspectRatio: false,
                    plugins: {
                        legend: { display: false },
                        tooltip: {
                            mode: 'index',
                            intersect: false,
                            backgroundColor: 'rgba(10, 35, 66, 0.9)'
                        }
                    },
                    scales: {
                        y: { 
                            beginAtZero: true,
                            grid: { drawBorder: false },
                            title: { display: true, text: 'Amperes (A)' }
                        },
                        x: { grid: { display: false } }
                    },
                    interaction: { intersect: false, mode: 'nearest' }
                }
            });
        }

        // Sensor Data Chart
        const sensorCtx = document.getElementById('sensorChart')?.getContext('2d');
        if (sensorCtx) {
            sensorChart = new Chart(sensorCtx, {
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
                    maintainAspectRatio: false,
                    cutout: '70%',
                    plugins: {
                        legend: {
                            position: 'bottom',
                            labels: {
                                padding: 20,
                                usePointStyle: true,
                                font: { size: 13, weight: '600' }
                            }
                        }
                    }
                }
            });
        }
    }

    function initializeSocketListeners() {
        // Sensor data updates
        socket.on('sensor-update', function(data) {
            console.log('Sensor update:', data);
            updateDashboardCard(data);
            
            // Update energy chart for energy data
            if (data.sensorType === 'energy') {
                updateEnergyChart();
            }
        });

        // Device status updates
        socket.on('device-update', function(device) {
            console.log('Device update:', device);
            updateDeviceUI(device);
        });

        // Connection status
        socket.on('connect', () => {
            showNotification('Connected to server', 'success');
        });

        socket.on('disconnect', () => {
            showNotification('Disconnected from server', 'error');
        });
    }

    function initializeUIHandlers() {
        // Chart time period buttons
        document.querySelectorAll('.chart-btn').forEach(button => {
            button.addEventListener('click', function() {
                document.querySelectorAll('.chart-btn').forEach(btn => 
                    btn.classList.remove('active')
                );
                this.classList.add('active');
                
                const period = this.dataset.period || '24h';
                updateEnergyChart(period);
            });
        });

        // Device control buttons
        document.addEventListener('click', function(e) {
            if (e.target.closest('.device-control')) {
                const button = e.target.closest('.device-control');
                handleDeviceControl(button);
            }
        });

        // Refresh data button
        const refreshBtn = document.getElementById('refresh-data');
        if (refreshBtn) {
            refreshBtn.addEventListener('click', loadInitialData);
        }
    }

    async function loadInitialData() {
        try {
            showLoadingState(true);
            
            const [currentValues, energyData] = await Promise.all([
                fetch('/api/current-values').then(res => res.json()),
                fetch('/api/energy-data?hours=24').then(res => res.json())
            ]);

            updateDashboardValues(currentValues);
            updateEnergyChartData(energyData);
            
        } catch (error) {
            console.error('Error loading initial data:', error);
            showNotification('Failed to load data', 'error');
        } finally {
            showLoadingState(false);
        }
    }

    function updateDashboardValues(data) {
        const updates = {
            'current-usage': { value: data.current, unit: 'A' },
            'temperature': { value: data.temperature, unit: '°C' },
            'light-level': { value: data.light, unit: 'lux' },
            'energy-today': { value: data.energy, unit: 'kWh' }
        };

        Object.entries(updates).forEach(([id, { value, unit }]) => {
            const element = document.getElementById(id);
            if (element && value !== undefined) {
                element.textContent = `${value} ${unit}`;
            }
        });
    }

    function updateDashboardCard(data) {
        const mapping = {
            'current': { id: 'current-usage', unit: 'A' },
            'temperature': { id: 'temperature', unit: '°C' },
            'light': { id: 'light-level', unit: 'lux' },
            'energy': { id: 'energy-today', unit: 'kWh' }
        };

        const config = mapping[data.sensorType];
        if (config) {
            const element = document.getElementById(config.id);
            if (element) {
                element.textContent = `${data.value} ${config.unit}`;
                element.classList.add('value-updated');
                setTimeout(() => element.classList.remove('value-updated'), 1000);
            }
        }
    }

    async function updateEnergyChart(period = '24h') {
        try {
            const response = await fetch(`/api/energy-data?hours=${period}`);
            const data = await response.json();
            updateEnergyChartData(data);
        } catch (error) {
            console.error('Error updating energy chart:', error);
        }
    }

    function updateEnergyChartData(data) {
        if (energyChart && data) {
            energyChart.data.labels = data.labels || [];
            energyChart.data.datasets[0].data = data.data || [];
            energyChart.update('none'); // 'none' for performance
        }
    }

    async function handleDeviceControl(button) {
        const deviceId = button.dataset.deviceId;
        const action = button.dataset.action;
        
        if (action === 'toggle') {
            const currentStatus = button.dataset.status;
            const newStatus = currentStatus === 'ON' ? 'OFF' : 'ON';
            
            try {
                button.disabled = true;
                button.classList.add('loading');
                
                const response = await fetch(`/api/devices/${deviceId}/status`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ status: newStatus })
                });

                if (!response.ok) throw new Error('Failed to update device');
                
                const data = await response.json();
                console.log('Device status updated:', data);
                
            } catch (error) {
                console.error('Error updating device:', error);
                showNotification('Failed to update device', 'error');
            } finally {
                button.disabled = false;
                button.classList.remove('loading');
            }
        }
    }

    function updateDeviceUI(device) {
        // Update device row in table
        const deviceRow = document.querySelector(`[data-device-id="${device.id}"]`);
        if (deviceRow) {
            const statusElement = deviceRow.querySelector('.status');
            const controlButton = deviceRow.querySelector('.device-control');
            
            if (statusElement) {
                statusElement.className = `status status-${device.status.toLowerCase()}`;
                statusElement.textContent = device.status;
            }
            
            if (controlButton) {
                controlButton.dataset.status = device.status;
                controlButton.innerHTML = device.status === 'ON' ? 
                    '<i class="fas fa-power-off"></i>' : 
                    '<i class="fas fa-power-off"></i>';
            }
        }
    }

    function showNotification(message, type = 'info') {
        // Simple notification implementation
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.textContent = message;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.remove();
        }, 3000);
    }

    function showLoadingState(show) {
        document.body.classList.toggle('loading', show);
    }

    // Auto-refresh every 30 seconds
    setInterval(loadInitialData, 30000);
});