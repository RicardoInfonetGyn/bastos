// middleware/auth.js
const jwt = require('jsonwebtoken');
const { pool } = require('../config/database');

const authenticateToken = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Token de acesso requerido' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Verificar se o token ainda é válido no banco
    /*
    const [rows] = await pool.execute(
      'SELECT * FROM chave_acesso WHERE login = ? AND chave = ?',
      [decoded.login, token]
    );

    if (rows.length === 0) {
      return res.status(403).json({ error: 'Token inválido' });
    }
*/
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(403).json({ error: 'Token inválido' });
  }
};

module.exports = { authenticateToken };