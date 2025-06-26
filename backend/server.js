import express from 'express';
import cors from 'cors';
import { processCSVRoute } from './routes/csvRoutes.js';
import { debugRoutes } from './routes/debugRoutes.js';
import { config } from './config/config.js';

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.static('.'));

app.use('/api', processCSVRoute);
app.use('/api', debugRoutes);

app.listen(config.PORT, () => {
  console.log(`Server running on port ${config.PORT}`);
});

export default app;