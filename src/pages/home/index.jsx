import React, { useEffect, useState } from "react";
import { Card, CardContent, Button } from "@mui/material"; // Import Button from MUI
import { Line, Doughnut } from "react-chartjs-2";
import { Chart as ChartJS, LineElement, CategoryScale, LinearScale, PointElement, ArcElement, TimeScale } from "chart.js";
import axios from "axios";
import { FaRegCircleUser } from "react-icons/fa6";
import 'chartjs-adapter-date-fns';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';

ChartJS.register(LineElement, CategoryScale, LinearScale, PointElement, ArcElement, TimeScale);

function HomePage() {
  const [deviceStatus, setDeviceStatus] = useState({
    online: 0,
    offline1Min: 0,
    offline10Min: 0,
    offline24Hr: 0,
  });

  const [chartData, setChartData] = useState({
    datasets: [
      {
        borderColor: "#21ab72", // Warna garis chart (hijau)
        borderWidth: 2,
        radius: 3,
        tension: 0.4, // Membuat garis lebih mulus
        data: [],
      },
    ],
  });

  // Fungsi untuk mendapatkan data dari ThingSpeak
  const fetchData = async () => {
    try {
      const response = await axios.get(`https://api.thingspeak.com/channels/2635960/feeds.json?api_key=DJOGXUUY0XUDPJ70`);
      const feeds = response.data.feeds;

      if (feeds.length > 0) {
        const latestFeed = feeds[feeds.length - 1]; // Dapatkan feed terbaru
        const latestTime = new Date(latestFeed.created_at).getTime();
        const currentTime = new Date().getTime();
        const timeDifference = (currentTime - latestTime) / 1000; // Selisih waktu dalam detik

        // Update status berdasarkan selisih waktu
        if (timeDifference < 60) {
          setDeviceStatus({
            online: 1,
            offline1Min: 0,
            offline10Min: 0,
            offline24Hr: 0,
          });
        } else if (timeDifference >= 60 && timeDifference < 600) {
          setDeviceStatus({
            online: 0,
            offline1Min: 1,
            offline10Min: 0,
            offline24Hr: 0,
          });
        } else if (timeDifference >= 600 && timeDifference < 900) {
          setDeviceStatus({
            online: 0,
            offline1Min: 0,
            offline10Min: 1,
            offline24Hr: 0,
          });
        } else {
          setDeviceStatus({
            online: 0,
            offline1Min: 0,
            offline10Min: 0,
            offline24Hr: 1,
          });
        }

        // Update chart data
        const newData = feeds.map((feed) => {
          return {
            x: new Date(feed.created_at).getTime(),
            y: feed.field1 ? parseFloat(feed.field1) : 0,
          };
        });

        setChartData({
          datasets: [
            {
              borderColor: "#21ab72",
              borderWidth: 2,
              radius: 3,
              tension: 0.4,
              data: newData,
            },
          ],
        });
      }
    } catch (error) {
      console.error("Error fetching data: ", error);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 5000); // Fetch data setiap 5 detik
    return () => clearInterval(interval); // Bersihkan interval saat component unmount
  }, []);

  // Line chart options
  const options = {
    maintainAspectRatio: false,
    interaction: {
      intersect: false,
      mode: 'nearest', // Menambahkan mode nearest agar tooltip muncul saat kursor dekat dengan titik
    },
    animation: {
      duration: 1000, // Animasi masuk selama 1 detik
    },
    plugins: {
      legend: {
        display: false, // Tidak menampilkan legenda
      },
      tooltip: {
        callbacks: {
          title: (tooltipItems) => {
            // Menampilkan tanggal dari titik data
            const index = tooltipItems[0].dataIndex;
            const date = new Date(chartData.datasets[0].data[index].x);
            return date.toLocaleString('en-US', { timeZone: 'Asia/Jakarta' });
          },
          label: (tooltipItem) => {
            const value = tooltipItem.raw.y;
            return `Field Label 1: ${value}`;
          }
        }
      }
    },
    scales: {
      x: {
        type: "time",
        time: {
          unit: "minute", // Set time unit to minute
          tooltipFormat: "PPpp", // Format tooltip for time
        },
        grid: {
          color: "#4B5563",
        },
        ticks: {
          color: "#F9FAFB",
        },
      },
      y: {
        min: 0,
        max: 100,
        ticks: {
          color: "#F9FAFB",
          stepSize: 20,
        },
        grid: {
          color: "#4B5563",
        },
      },
    },
  };

  const doughnutOptions = {
    cutout: "70%",
  };

  const doughnutData = {
    labels: ["Online", "Offline 1 menit", "Offline 10 menit", "Offline 24 Jam"],
    datasets: [
      {
        label: "Status",
        data: [deviceStatus.online, deviceStatus.offline1Min, deviceStatus.offline10Min, deviceStatus.offline24Hr],
        backgroundColor: ["#21ab72", "#f9c74f", "#3B82F6", "#ef476f"], // Hijau, Kuning, Biru, Merah
        borderRadius: 0,
        borderWidth: 0,
        spacing: 0,
      },
    ],
  };

  // Function to handle print report
  const handlePrint = async () => {
    try {
      // Fetch data from ThingSpeak API
      const response = await axios.get("https://api.thingspeak.com/channels/2635960/feeds.json");
      const feeds = response.data.feeds;

      // Create a new jsPDF document
      const doc = new jsPDF();

      // Set document title
      doc.setFontSize(16);
      doc.text("ThingSpeak Data Report", 14, 22);

      // Prepare table data
      const tableData = feeds.map(feed => [
        feed.created_at,
        feed.entry_id,
        feed.field1
      ]);

      // Add table with headers
      doc.autoTable({
        startY: 30,
        head: [['Created At', 'Entry ID', 'Status']],
        body: tableData,
        theme: 'striped',
        styles: { halign: 'center' }
      });

      // Save the PDF
      doc.save("report.pdf");
    } catch (error) {
      console.error("Error fetching data: ", error);
    }
  };

  return (
    <>
      <div className="bg-zinc-950 h-screen w-screen px-8">
        <div className="flex w-full border-b-2 border-zinc-800 py-6 mb-8">
          <p className="text-3xl text-zinc-200 rounded-lg w-fit flex-grow">Admin Dashboard</p>

          <div className="flex items-center justify-center px-8 rounded-lg mx-8 space-x-2">
            <FaRegCircleUser className="text-zinc-400" />
            <p className="text-zinc-200 w-fit">Hello, Admin!</p>
          </div>
          <p className="flex text-[#ef476f] rounded-lg w-fit ring-1 ring-[#ef476f] px-8 justify-center items-center cursor-pointer hover:ring-red-400 hover:text-red-400 duration-100">
            Logout
          </p>
        </div>

        {/* CONTAINER LINE CHART & PIE CHART */}
        <div className="flex space-x-8">
          {/* LINE CHART & 4 CARDS */}
          <div className="w-3/4">
            {/* Status Cards */}
            <div className="flex space-x-4 w-full mb-8">
              <Card sx={{ borderRadius: "16px" }} className="flex-grow w-28">
                <CardContent className="bg-zinc-900/95">
                  <p className="text-xl pb-4 text-zinc-200">Online</p>
                  <p className="text-5xl text-zinc-200">{deviceStatus.online}</p>
                </CardContent>
              </Card>

              <Card sx={{ borderRadius: "16px" }} className="flex-grow w-28">
                <CardContent className="bg-zinc-900/95">
                  <p className="text-xl pb-4 text-zinc-200">Offline 1 menit</p>
                  <p className="text-5xl text-zinc-200">{deviceStatus.offline1Min}</p>
                </CardContent>
              </Card>

              <Card sx={{ borderRadius: "16px" }} className="flex-grow w-28">
                <CardContent className="bg-zinc-900/95">
                  <p className="text-xl pb-4 text-zinc-200">Offline 10 menit</p>
                  <p className="text-5xl text-zinc-200">{deviceStatus.offline10Min}</p>
                </CardContent>
              </Card>

              <Card sx={{ borderRadius: "16px" }} className="flex-grow w-28">
                <CardContent className="bg-zinc-900/95">
                  <p className="text-xl pb-4 text-zinc-200">Offline</p>
                  <p className="text-5xl text-zinc-200">{deviceStatus.offline24Hr}</p>
                </CardContent>
              </Card>
            </div>

            {/* LINE CHART */}
            <div className="mt-4 items-center bg-zinc-950">
              <Card className="flex flex-col h-[300px]" sx={{ borderRadius: "16px" }}>
                <CardContent className="flex flex-col flex-grow h-full p-0 bg-zinc-900/95">
                  <div className="mb-4 flex justify-between">
                    <p className="text-xl text-zinc-200">Activity Overview</p>
                    <Button 
                      variant="contained" 
                      color="primary" 
                      onClick={handlePrint} 
                      sx={{ backgroundColor: "#3B82F6", color: "#fff" }}>
                      Print Report
                    </Button>
                  </div>
                  <div className="flex-grow h-full">
                    <Line data={chartData} options={options} className="h-full" />
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* PIE CHART */}
          <div className="w-1/4">
            <Card className="h-full bg-zinc-950/95" sx={{ borderRadius: "16px" }}>
              <CardContent className="flex-grow-1 bg-zinc-900/95 h-full">
                <p className="text-white text-xl">Status Overview</p>
                <div className="h-full p-8">
                  <Doughnut 
                    options={doughnutOptions} 
                    data={doughnutData} 
                    className="w-full h-full" 
                  />
                  <div className="flex flex-col items-start mt-4 space-y-2">
                    <div className="flex items-center">
                      <div className="w-4 h-4 bg-[#21ab72] mr-2"></div>
                      <p className="text-zinc-200">Online</p>
                    </div>
                    <div className="flex items-center">
                      <div className="w-4 h-4 bg-[#f9c74f] mr-2"></div>
                      <p className="text-zinc-200">Offline 1 menit</p>
                    </div>
                    <div className="flex items-center">
                      <div className="w-4 h-4 bg-[#3B82F6] mr-2"></div>
                      <p className="text-zinc-200">Offline 10 menit</p>
                    </div>
                    <div className="flex items-center">
                      <div className="w-4 h-4 bg-[#ef476f] mr-2"></div>
                      <p className="text-zinc-200">Offline</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </>
  );
}

export default HomePage;
