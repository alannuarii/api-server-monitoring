import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import fetch from 'node-fetch';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        methods: ["GET", "POST"]
    }
});
const port = 3333;

io.on('connection', (socket) => {
    console.log('Client connected'); 
    setInterval(async () => {
        try {
            const nodeCpuScalingFrequencyHertz = fetch(`${process.env.ENDPOINT}/api/v1/query?query=node_cpu_scaling_frequency_hertz`)
                .then(response => response.json());
            const nodeCpuFrequencyMaxHertz = fetch(`${process.env.ENDPOINT}/api/v1/query?query=node_cpu_frequency_max_hertz`)
                .then(response => response.json());
            const nodeCpuFrequencyMinHertz = fetch(`${process.env.ENDPOINT}/api/v1/query?query=node_cpu_frequency_min_hertz`)
                .then(response => response.json());

            const nodeMemoryMemTotalBytes = fetch(`${process.env.ENDPOINT}/api/v1/query?query=node_memory_MemTotal_bytes`)
                .then(response => response.json());
            const nodeMemoryMemAvailableBytes = fetch(`${process.env.ENDPOINT}/api/v1/query?query=node_memory_MemAvailable_bytes`)
                .then(response => response.json());

            const nodeFilesystemAvailBytes = fetch(`${process.env.ENDPOINT}/api/v1/query?query=node_filesystem_avail_bytes`)
                .then(response => response.json());
            const nodeFilesystemSizeBytes = fetch(`${process.env.ENDPOINT}/api/v1/query?query=node_filesystem_size_bytes`)
                .then(response => response.json());


            const [cpuScalingFrequencyHertz, cpuFrequencyMaxHertz, cpuFrequencyMinHertz, memoryMemTotalBytes, memoryMemAvailableBytes, filesystemAvailBytes, filesystemSizeBytes] =
                await Promise.all([nodeCpuScalingFrequencyHertz, nodeCpuFrequencyMaxHertz, nodeCpuFrequencyMinHertz, nodeMemoryMemTotalBytes, nodeMemoryMemAvailableBytes, nodeFilesystemAvailBytes, nodeFilesystemSizeBytes]);

            socket.emit('cpu',
                [
                    { name: 'CPU Frequency Max (GHz)', value: (cpuFrequencyMaxHertz.data.result[0].value[1] / 1e9) },
                    { name: 'CPU Frequency Min (GHz)', value: (cpuFrequencyMinHertz.data.result[0].value[1] / 1e9) },
                    { name: 'CPU Scaling Frequency (GHz)', value: (cpuScalingFrequencyHertz.data.result[0].value[1] / 1e9) }
                ]
            )
            socket.emit('memory',
                [
                    { name: 'Memory Total (GB)', value: (memoryMemTotalBytes.data.result[0].value[1] / 1e9) },
                    { name: 'Memory Used (GB)', value: ((memoryMemTotalBytes.data.result[0].value[1] - memoryMemAvailableBytes.data.result[0].value[1]) / 1e9) },
                    { name: 'Memory Available (GB)', value: (memoryMemAvailableBytes.data.result[0].value[1] / 1e9) }
                ]
            )
            socket.emit('disk',
                [
                    { name: 'File System Size (GB)', value: (filesystemSizeBytes.data.result[0].value[1] / 1e9) },
                    { name: 'File System Used (GB)', value: ((filesystemSizeBytes.data.result[0].value[1] - filesystemAvailBytes.data.result[0].value[1]) / 1e9) },
                    { name: 'File System Available (GB)', value: (filesystemAvailBytes.data.result[0].value[1] / 1e9) }
                ]
            )
            // console.log(dataServer.data.result[0].metric)
        } catch (error) {
            console.error('Error fetching server metrics:', error);
        }
    }, 1000);

    socket.on("disconnect", () => {
        console.log("Client disconnected");
    });
});


server.listen(port, () => {
    console.log(`Example app listening on port localhost:${port}`);
});
