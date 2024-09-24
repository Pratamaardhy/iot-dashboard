import React, { useEffect, useState } from 'react';
import { AppBar, Toolbar, Typography, Container, Grid, Card, CardContent } from '@mui/material';
import { Line, Doughnut } from 'react-chartjs-2';
import { Chart as ChartJS, LineElement, CategoryScale, LinearScale, PointElement, ArcElement } from 'chart.js';
import axios from 'axios';

// Daftarkan chart.js untuk komponen Doughnut dan Line
ChartJS.register(LineElement, CategoryScale, LinearScale, PointElement, ArcElement);

const App = () => {
  const [chartData, setChartData] = useState({
    datasets: [{
      borderColor: 'rgba(255, 99, 132, 1)', // Warna merah
      borderWidth: 1,
      radius: 0,
      data: [],
    }]
  });

  const [doughnutData] = useState({
    labels: ['Online', 'Offline 1 Jam', 'Offline 7 Jam', 'Offline 24 Jam'],
    datasets: [
      {
        label: 'Status',
        data: [20, 10, 5, 3], // Contoh data untuk doughnut chart
        backgroundColor: [
          'rgba(75, 192, 192, 0.6)', // Warna untuk Online
          'rgba(255, 159, 64, 0.6)', // Warna untuk Offline 1 Jam
          'rgba(255, 99, 132, 0.6)', // Warna untuk Offline 7 Jam
          'rgba(54, 162, 235, 0.6)'  // Warna untuk Offline 24 Jam
        ],
      }
    ]
  });

  // Fungsi untuk mengambil data dari API ThingSpeak
  const fetchData = async () => {
    try {
      const response = await axios.get(`https://api.thingspeak.com/channels/2635960/feeds.json?api_key=DJOGXUUY0XUDPJ70`);
      const feeds = response.data.feeds;

      let previousY = 0;
      const newData = feeds.map((feed, index) => {
        const y = feed.field1 ? parseFloat(feed.field1) : previousY - 1; // Turun jika tidak ada data
        previousY = y;
        return { x: index, y }; // Format untuk chart.js
      });

      // Mengubah state chartData dengan data baru
      setChartData({
        datasets: [{
          borderColor: 'rgba(255, 99, 132, 1)', // Warna merah
          borderWidth: 1,
          radius: 0,
          data: newData,
        }]
      });
    } catch (error) {
      console.error("Error fetching data: ", error);
    }
  };

  // UseEffect untuk mengambil data API saat pertama kali komponen dimuat
  useEffect(() => {
    fetchData();
  }, []);

  const options = {
    animation: {
      x: {
        type: 'number',
        easing: 'linear',
        duration: 1000,
      },
      y: {
        type: 'number',
        easing: 'linear',
        duration: 1000,
      }
    },
    interaction: {
      intersect: false
    },
    plugins: {
      legend: {
        display: false // Tidak menampilkan legenda
      }
    },
    scales: {
      x: {
        type: 'linear'
      }
    }
  };

  return (
    <div>
      <AppBar position="static">
        <Toolbar sx={{ padding: '0 16px' }}>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            Admin Dashboard
          </Typography>
        </Toolbar>
      </AppBar>
      <Container maxWidth="lg" sx={{ marginTop: 4 }}>
        <Grid container spacing={2}>
          {/* Line Chart dalam Card (Activity Overview) */}
        <Grid item xs={12}>
          <Card style={{ height: '400px', display: 'flex', flexDirection: 'column' }}>
            <CardContent style={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
              <Typography variant="h6" gutterBottom>
                Activity Overview
              </Typography>
              <div style={{ flexGrow: 1 }}>
                <Line 
                  data={chartData} 
                  options={options}
                  style={{
                    width: '1120px',
                    height: '60%',
                  }}
                />
              </div>
            </CardContent>
          </Card>
        </Grid>
          {/* Status Online, Offline dalam 2 kolom sejajar dengan Doughnut Chart */}
          <Grid item xs={12} md={6}>
            <Grid container spacing={3}>
              {/* Card untuk Online dan Offline 1 Jam */}
              <Grid item xs={12} sm={6}>
                <Card>
                  <CardContent sx={{ textAlign: 'center' }}>
                    <Typography variant="h5">Online</Typography>
                    <Typography variant="h3" sx={{ margin: '20px 0' }}>20</Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Card>
                  <CardContent sx={{ textAlign: 'center' }}>
                    <Typography variant="h5">Offline 1 Jam</Typography>
                    <Typography variant="h3" sx={{ margin: '20px 0' }}>10</Typography>
                  </CardContent>
                </Card>
              </Grid>

              {/* Card untuk Offline 7 Jam dan Offline 24 Jam */}
              <Grid item xs={12} sm={6}>
                <Card>
                  <CardContent sx={{ textAlign: 'center' }}>
                    <Typography variant="h5">Offline 7 Jam</Typography>
                    <Typography variant="h3" sx={{ margin: '20px 0' }}>5</Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Card>
                  <CardContent sx={{ textAlign: 'center' }}>
                    <Typography variant="h5">Offline 24 Jam</Typography>
                    <Typography variant="h3" sx={{ margin: '20px 0' }}>3</Typography>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </Grid>

          {/* Doughnut Chart dalam Card (Status Overview) */}
          <Grid item xs={12} md={6}>
            <Card style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
              <CardContent style={{ flexGrow: 1 }}>
                <Typography variant="h6" gutterBottom align="center">
                  Status Overview
                </Typography>
                <div style={{ width: '80%', height: '288px', margin: '0 auto', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                  <Doughnut 
                    data={doughnutData} 
                    style={{
                      width: '100%',
                      height: '100%',
                    }}
                  />
                </div>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Container>
    </div>
  );
};

export default App;
