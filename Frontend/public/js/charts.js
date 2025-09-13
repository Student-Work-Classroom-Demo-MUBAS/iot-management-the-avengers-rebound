// Initialize charts
document.addEventListener('DOMContentLoaded', function() {
    // Energy Consumption Chart
    const energyCtx = document.getElementById('energyChart').getContext('2d');
    const energyChart = new Chart(energyCtx, {
        type: 'line',
        data: {
            labels: ['00:00', '04:00', '08:00', '12:00', '16:00', '20:00'],
            datasets: [{
                label: 'Current (A)',
                data: [2.1, 1.8, 3.2, 4.5, 5.2, 4.8],
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
                
                // Update charts with new data
                const newData = energyChart.data.datasets[0].data.map(() => Math.random() * 3 + 2);
                energyChart.data.datasets[0].data = newData;
                energyChart.update('none');
            })
            .catch(error => console.error('Error fetching data:', error));
    }

    // Simulate real-time data updates every 5 seconds
    setInterval(updateDashboardValues, 5000);

    // Add interaction to chart buttons
    document.querySelectorAll('.chart-btn').forEach(button => {
        button.addEventListener('click', function() {
            document.querySelectorAll('.chart-btn').forEach(btn => btn.classList.remove('active'));
            this.classList.add('active');
        });
    });
});