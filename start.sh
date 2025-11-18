#!/bin/bash
echo "🚀 Iniciando CAM App Backend..."

# Instalar dependencias
echo "📦 Instalando dependencias..."
npm install

# Inicializar base de datos
echo "🗄️ Inicializando base de datos..."
node scripts/initDB.js

# Iniciar aplicación
echo "🔊 Iniciando servidor..."
node app.js