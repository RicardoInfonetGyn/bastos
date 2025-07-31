const express = require('express');
const crypto = require('crypto');
const router = express.Router();
const { pool } = require('../config/database');
const { validateRegister } = require('../middleware/validation');
const { authenticateToken } = require('../middleware/auth');
const { getTranslationsForUser } = require('../services/i18nService');

// Função para normalizar telefone
const normalizarTelefone = (telefone) => {
  const digitos = telefone.replace(/\D/g, '');
  let ddd = digitos.slice(0, 2);
  let numero = digitos.slice(2);
  if (numero.length === 8) numero = '9' + numero;
  return `55${ddd}${numero}`;
};

// Listar usuários com filtros e paginação
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { empresa, unidade, login, page = 1, limit = 10 } = req.query;
    const offset = (page - 1) * limit;

    let query = `
      SELECT DISTINCT
        u.login,
        u.usrname,
        u.email,
        u.celular,
        u.picture as foto,
        u.usrperfil,
        u.nivel,
        sb.id as unidade_id,
        sb.description as unidade,
        u.cidade,
        u.cargo,
        u.usractive,
        GROUP_CONCAT(DISTINCT g.description) as grupos,
        GROUP_CONCAT(DISTINCT c.description) as empresas
      FROM sec_users u
      LEFT JOIN sec_users_groups ug ON u.login = ug.login
      LEFT JOIN sec_groups g ON ug.group_id = g.group_id
      LEFT JOIN sec_users_companies uc ON u.login = uc.login
      LEFT JOIN sec_companies c ON uc.company_id = c.id
      LEFT JOIN sec_branchs sb ON u.unidade = sb.id
      WHERE u.usractive = 'Y'
    `;

    const params = [];

    if (empresa) {
      query += ` AND uc.company_id = ?`;
      params.push(empresa);
    }
    if (unidade) {
      query += ` AND u.unidade = ?`;
      params.push(unidade);
    }
    if (login) {
      query += ` AND u.login LIKE ?`;
      params.push(`%${login}%`);
    }

    query += `
      GROUP BY u.login, u.usrname, u.email, u.celular, u.picture, u.usrperfil,
               u.nivel, sb.id, sb.description, u.cidade, u.cargo, u.usractive
      ORDER BY u.usrname
      LIMIT ? OFFSET ?
    `;
    params.push(parseInt(limit), parseInt(offset));

    const [usuarios] = await pool.query(query, params);

    // Contar total
    let countQuery = `
      SELECT COUNT(DISTINCT u.login) as total
      FROM sec_users u
      LEFT JOIN sec_users_companies uc ON u.login = uc.login
      WHERE u.usractive = 'Y'
    `;
    const countParams = [];

    if (empresa) {
      countQuery += ` AND uc.company_id = ?`;
      countParams.push(empresa);
    }
    if (unidade) {
      countQuery += ` AND u.unidade = ?`;
      countParams.push(unidade);
    }
    if (login) {
      countQuery += ` AND u.login LIKE ?`;
      countParams.push(`%${login}%`);
    }

    const [countResult] = await pool.query(countQuery, countParams);
    const total = countResult[0].total;
    const hasMore = parseInt(page) < Math.ceil(total / limit);

    // 🔠 Busca rótulos traduzidos
    const traducoes = await getTranslationsForUser(req.user.login);

    res.json({
      usuarios,
      labels: {
        login: traducoes['label.login'] || 'Login',
        nome: traducoes['label.nome'] || 'Nome',
        email: traducoes['label.email'] || 'Email',
        celular: traducoes['label.celular'] || 'Celular',
        unidade: traducoes['label.unidade'] || 'Unidade',
        empresa: traducoes['label.empresa'] || 'Empresa',
        cidade: traducoes['label.cidade'] || 'Cidade',
        cargo: traducoes['label.cargo'] || 'Cargo',
        grupos: traducoes['label.grupos'] || 'Grupos',
        nivel: traducoes['label.nivel'] || 'Nível',
        status: traducoes['label.status'] || 'Status',
        foto: traducoes['label.foto'] || 'Foto'
      },
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / limit),
        hasMore
      }
    });

  } catch (error) {
    console.error('Erro ao buscar usuários:', error);
    res.status(500).json({ erro: 'Erro ao buscar usuários' });
  }
});

// Cadastro
router.post('/cadastro', async (req, res) => {
  try {
    const {
      login, usrname, pswd, email, celular,
      grupos, empresas, usrperfil, nivel, unidade,
      cidade, cargo, mfa, tema, menu, id_chat,
      conta, inbox, foto
    } = req.body;

    if (!login || !pswd || !email || !grupos || !empresas || !celular) {
      return res.status(400).json({ sucesso: false, mensagem: 'Campos obrigatórios não preenchidos' });
    }

    const senhaHash = crypto.createHash('md5').update(pswd).digest('hex');
    const celularFormatado = normalizarTelefone(celular);

    const [existente] = await pool.query('SELECT login FROM sec_users WHERE login = ?', [login]);
    if (existente.length > 0) {
      return res.status(400).json({ sucesso: false, mensagem: 'Login já existente' });
    }

    await pool.query(`
      INSERT INTO sec_users 
      (login, pswd, usrname, email, celular, picture, usrperfil, nivel, unidade, cidade, cargo, mfa, tema, menu, id_chat, conta, inbox, usractive)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'Y')
    `, [
      login, senhaHash, usrname, email, celularFormatado, foto || null,
      usrperfil || null, nivel || null, unidade || null, cidade || null, cargo || null,
      mfa || null, tema || null, menu || null, id_chat || null, conta || null, inbox || null
    ]);

    for (const group_id of grupos) {
      await pool.query('INSERT INTO sec_users_groups (login, group_id) VALUES (?, ?)', [login, group_id]);
    }

    for (const company_id of empresas) {
      await pool.query('INSERT INTO sec_users_companies (login, company_id) VALUES (?, ?)', [login, company_id]);
    }

    res.status(201).json({ sucesso: true, mensagem: 'Usuário cadastrado com sucesso' });

  } catch (error) {
    console.error('Erro ao cadastrar usuário:', error);
    res.status(500).json({ sucesso: false, mensagem: 'Erro interno', erro: error.message });
  }
});

// Atualização
router.put('/:login', authenticateToken, async (req, res) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const { login: currentLogin } = req.params;
    const {
      login, usrname, pswd, email, celular, foto, grupos, empresas,
      usrperfil, nivel, unidade, cidade, cargo, mfa, tema, menu,
      id_chat, conta, inbox
    } = req.body;

    const [existingUser] = await connection.query('SELECT login FROM sec_users WHERE login = ?', [currentLogin]);
    if (existingUser.length === 0) {
      await connection.rollback();
      return res.status(404).json({ erro: 'Usuário não encontrado' });
    }

    if (login !== currentLogin) {
      const [loginExists] = await connection.query(
        'SELECT login FROM sec_users WHERE login = ? AND login != ?',
        [login, currentLogin]
      );
      if (loginExists.length > 0) {
        await connection.rollback();
        return res.status(400).json({ erro: 'Login já existe' });
      }
    }

    let updateQuery = `
      UPDATE sec_users 
      SET login = ?, usrname = ?, email = ?, usrperfil = ?, nivel = ?, unidade = ?, cidade = ?, cargo = ?, mfa = ?, tema = ?, menu = ?, id_chat = ?, conta = ?, inbox = ?
    `;
    const updateParams = [login, usrname, email, usrperfil, nivel, unidade, cidade, cargo, mfa, tema, menu, id_chat, conta, inbox];

    if (celular) {
      const celularFormatado = normalizarTelefone(celular);
      updateQuery += ', celular = ?';
      updateParams.push(celularFormatado);
    }

    if (pswd && pswd.trim() !== '') {
      const senhaHash = crypto.createHash('md5').update(pswd).digest('hex');
      updateQuery += ', pswd = ?';
      updateParams.push(senhaHash);
    }

    if (foto !== undefined) {
      updateQuery += ', picture = ?';
      updateParams.push(foto);
    }

    updateQuery += ' WHERE login = ?';
    updateParams.push(currentLogin);

    await connection.query(updateQuery, updateParams);

    if (grupos !== undefined) {
      await connection.query('DELETE FROM sec_users_groups WHERE login = ?', [currentLogin]);
      for (const groupId of grupos) {
        await connection.query('INSERT INTO sec_users_groups (login, group_id) VALUES (?, ?)', [login, groupId]);
      }
    }

    if (empresas !== undefined) {
      await connection.query('DELETE FROM sec_users_companies WHERE login = ?', [currentLogin]);
      for (const empresaId of empresas) {
        await connection.query('INSERT INTO sec_users_companies (login, company_id) VALUES (?, ?)', [login, empresaId]);
      }
    }

    if (login !== currentLogin) {
      await connection.query('UPDATE sec_users_groups SET login = ? WHERE login = ?', [login, currentLogin]);
      await connection.query('UPDATE sec_users_companies SET login = ? WHERE login = ?', [login, currentLogin]);
    }

    await connection.commit();
    res.json({ mensagem: 'Usuário atualizado com sucesso' });

  } catch (error) {
    await connection.rollback();
    console.error('Erro ao atualizar usuário:', error);
    res.status(500).json({ erro: 'Erro ao atualizar usuário' });
  } finally {
    connection.release();
  }
});

// Desativar usuário
router.delete('/:login', authenticateToken, async (req, res) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const { login } = req.params;

    const [existingUser] = await connection.query('SELECT login FROM sec_users WHERE login = ?', [login]);
    if (existingUser.length === 0) {
      await connection.rollback();
      return res.status(404).json({ erro: 'Usuário não encontrado' });
    }

    await connection.query('UPDATE sec_users SET usractive = ? WHERE login = ?', ['N', login]);

    await connection.commit();
    res.json({ mensagem: 'Usuário desativado com sucesso' });

  } catch (error) {
    await connection.rollback();
    console.error('Erro ao excluir usuário:', error);
    res.status(500).json({ erro: 'Erro ao excluir usuário' });
  } finally {
    connection.release();
  }
});

// Buscar usuário por login
router.get('/:login', authenticateToken, async (req, res) => {
  try {
    const { login } = req.params;

    const [usuarios] = await pool.query(`
      SELECT 
        u.login, u.usrname, u.email, u.celular, u.picture as foto,
        u.usrperfil, u.nivel, u.unidade, u.cidade, u.cargo,
        u.mfa, u.tema, u.menu, u.id_chat, u.conta, u.inbox, u.usractive
      FROM sec_users u
      WHERE u.login = ?
    `, [login]);

    if (usuarios.length === 0) {
      return res.status(404).json({ erro: 'Usuário não encontrado' });
    }

    const usuario = usuarios[0];

    const [grupos] = await pool.query(`
      SELECT g.group_id, g.description
      FROM sec_groups g
      INNER JOIN sec_users_groups ug ON g.group_id = ug.group_id
      WHERE ug.login = ?
    `, [login]);

    const [empresas] = await pool.query(`
      SELECT c.id, c.description
      FROM sec_companies c
      INNER JOIN sec_users_companies uc ON c.id = uc.company_id
      WHERE uc.login = ?
    `, [login]);

    usuario.grupos = grupos;
    usuario.empresas = empresas;

    res.json(usuario);

  } catch (error) {
    console.error('Erro ao buscar usuário:', error);
    res.status(500).json({ erro: 'Erro ao buscar usuário' });
  }
});


module.exports = router;
