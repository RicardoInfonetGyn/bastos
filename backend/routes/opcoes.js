const express = require('express');
const router = express.Router();
const { pool } = require('../config/database');
const jwt = require('jsonwebtoken');

// Middleware para extrair informações do usuário do token
const getUserFromToken = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ erro: 'Token não fornecido' });
    }

    // Decodificar o token JWT
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'sua_chave_secreta');
    
    // Se o token contém o login diretamente
    if (decoded.login) {
      req.user = { login: decoded.login };
      return next();
    }
    
    // Se o token contém o ID do usuário, buscar o login
    if (decoded.id || decoded.userId) {
      const userId = decoded.id || decoded.userId;
      const [userRows] = await pool.query('SELECT login FROM sec_users WHERE id = ?', [userId]);
      
      if (userRows.length === 0) {
        return res.status(401).json({ erro: 'Usuário não encontrado' });
      }
      
      req.user = { login: userRows[0].login };
      return next();
    }
    
    return res.status(401).json({ erro: 'Token inválido - falta informação do usuário' });
    
  } catch (error) {
    console.error('Erro ao validar token:', error);
    return res.status(401).json({ erro: 'Token inválido' });
  }
};

// Lista de grupos
router.get('/grupos', getUserFromToken, async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT group_id, description FROM sec_groups');
    res.json(rows);
  } catch (error) {
    console.error('Erro ao buscar grupos:', error);
    res.status(500).json({ erro: 'Erro ao buscar grupos' });
  }
});

// Lista de unidades da empresa
router.get('/unidades', getUserFromToken, async (req, res) => {
  try {
    const { empresa } = req.query;

    if (!empresa) {
      return res.status(400).json({ erro: 'Empresa não informada' });
    }

    const [rows] = await pool.query(`
SELECT DISTINCT u.id, u.description 
      FROM sec_branchs u
      INNER JOIN sec_users_companies uc ON u.company_id = uc.company_id
      WHERE uc.company_id = ? and u.ativo = 1
      ORDER BY u.description
    `, [empresa]);

    res.json(rows);
  } catch (error) {
    console.error('Erro ao buscar unidades:', error);
    res.status(500).json({ erro: 'Erro ao buscar unidades' });
  }
});

module.exports = router;


// Lista de empresas do usuário logado
router.get('/empresas', getUserFromToken, async (req, res) => {
  try {
    const userLogin = req.user.login;
    
    console.log('Buscando empresas para o usuário:', userLogin);
    
    const [rows] = await pool.query(`
      SELECT DISTINCT 
        c.id, 
        c.description 
      FROM sec_companies c
      INNER JOIN sec_users_companies uc ON c.id = uc.company_id
      WHERE uc.login = ?
      ORDER BY c.description
    `, [userLogin]);
    
    console.log(`Encontradas ${rows.length} empresas para o usuário ${userLogin}`);
    res.json(rows);
  } catch (error) {
    console.error('Erro ao buscar empresas:', error);
    res.status(500).json({ erro: 'Erro ao buscar empresas' });
  }
});

module.exports = router;