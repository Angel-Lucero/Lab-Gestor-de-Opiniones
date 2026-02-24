'use strict';

import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

export const dbConnection = async () => {
  try {
    console.log('MongoDB | Intentando conectar...');

    await mongoose.connect(process.env.MONGODB_URI);

    console.log('MongoDB | Conexión establecida exitosamente');
    console.log(`MongoDB | Base de datos: ${mongoose.connection.name}`);
  } catch (error) {
    console.error('MongoDB | Error al conectar:', error.message);
    process.exit(1);
  }
};

mongoose.connection.on('disconnected', () => {
  console.warn('MongoDB | Conexión perdida');
});

mongoose.connection.on('reconnected', () => {
  console.log('MongoDB | Reconectado exitosamente');
});

// Graceful shutdown
const gracefulShutdown = async (signal) => {
  console.log(`MongoDB | Señal ${signal} recibida. Cerrando conexión...`);
  try {
    await mongoose.connection.close();
    console.log('MongoDB | Conexión cerrada correctamente');
    process.exit(0);
  } catch (error) {
    console.error('MongoDB | Error al cerrar conexión:', error.message);
    process.exit(1);
  }
};

process.on('SIGINT', () => gracefulShutdown('SIGINT'));
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGUSR2', () => gracefulShutdown('SIGUSR2'));
