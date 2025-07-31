const express = require('express');
const router = express.Router();
const { pool } = require('../config/database');
const { authenticateToken } = require('../middleware/auth');

// 🔤 GET /api/i18n/idiomas – lista de idiomas disponíveis
router.get('/idiomas', async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT codigo, nome 
      FROM idiomas 
      ORDER BY nome
    `);
    res.json(rows);
  } catch (error) {
    console.error('❌ Erro ao buscar idiomas:', error);
    res.status(500).json({ erro: 'Erro ao buscar idiomas' });
  }
});

// 🌐 GET /api/i18n/traducoes – retorna traduções com base no idioma do usuário autenticado
router.get('/traducoes', authenticateToken, async (req, res) => {
  try {
    const login = req.user?.login;

    if (!login) {
      return res.status(401).json({ erro: 'Usuário não autenticado' });
    }

    // Buscar idioma do usuário
    const [[usuario]] = await pool.query(
      'SELECT idioma FROM sec_users WHERE login = ?',
      [login]
    );

    const idioma = usuario?.idioma || 'pt-BR';

    // Buscar ID do idioma (sem filtrar por "ativo")
    const [[idiomaRow]] = await pool.query(
      'SELECT id FROM idiomas WHERE codigo = ?',
      [idioma]
    );

    if (!idiomaRow) {
      return res.status(404).json({ erro: `Idioma '${idioma}' não encontrado` });
    }

    // Buscar traduções
    const [rows] = await pool.query(
      'SELECT chave, valor FROM traducoes WHERE idioma_id = ?',
      [idiomaRow.id]
    );

    const traducoes = {};
    for (const { chave, valor } of rows) {
      traducoes[chave] = valor;
    }

    res.json(traducoes);
  } catch (error) {
    console.error('❌ Erro ao buscar traduções:', error);
    res.status(500).json({ erro: 'Erro ao buscar traduções' });
  }
});

module.exports = router;
