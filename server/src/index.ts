import express from 'express';
import cors from 'cors';
import { config } from './config.js';
import scanRoutes from './routes/scan.js';
import repairRoutes from './routes/repair.js';
import undoRoutes from './routes/undo.js';
import validateRoutes from './routes/validate.js';
import authRoutes from './routes/auth.js';

const app = express();

app.use(cors());
app.use(express.json());

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use('/api/auth', authRoutes);
app.use('/api/scan', scanRoutes);
app.use('/api/repair', repairRoutes);
app.use('/api/undo', undoRoutes);
app.use('/api/validate', validateRoutes);

app.listen(config.port, () => {
  console.log(`PatchProof AI backend server is running on port ${config.port}`);
});
