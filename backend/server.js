import express from 'express';
import cors from 'cors';
import { processCSVRoute } from './routes/csvRoutes.js';
import { debugRoutes } from './routes/debugRoutes.js';
import { chartRoutes } from './routes/chartRoutes.js';
import { config } from './config/config.js';
import { hotspotRoutes } from './routes/hotspotRoutes.js';
import { emergingHotspotsRoutes } from './routes/emergingHotspotRoutes.js';

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('.'));

// Routes
app.use('/api', processCSVRoute);
app.use('/api', debugRoutes);
app.use('/api/charts', chartRoutes);
app.use('/api/hotspot', hotspotRoutes);
app.use('/api/emerging-hotspots', emergingHotspotsRoutes);

// Start server
app.listen(config.PORT, () => {
  console.log(`Server running on port ${config.PORT}`);
  console.log(`Chart endpoints available at http://localhost:${config.PORT}/api/charts/`);
});

export default app;