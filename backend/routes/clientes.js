const express = require('express');
const router = express.Router();
const { pool } = require('../config/database');
const { getTranslationsForUser } = require('../services/i18nService');

// Função para normalizar telefone
const normalizarTelefone = (telefone) => {
  const digitos = telefone.replace(/\D/g, '');
  let ddd = digitos.slice(0, 2);
  let numero = digitos.slice(2);
  if (numero.length === 8) {
    numero = '9' + numero;
  }
  return `55${ddd}${numero}`;
};

router.get('/dados-usuario/:login', async (req, res) => {
  const { login } = req.params;
  const [rows] = await pool.query(`
    SELECT
      u.picture,
      a.id,
      a.nome_completo,
      a.telefone_l
    FROM sec_users u
    LEFT JOIN acompanhamento a ON a.id = u.id_cliente
    WHERE u.login = ?
  `, [login]);

  if (rows.length === 0) return res.status(404).json({ erro: 'Usuário não encontrado' });

  const traducoes = await getTranslationsForUser(login);

  res.json({
    dados: rows[0],
    labels: {
      nome_completo: traducoes['label.nome_completo'] || 'Nome Completo',
      telefone: traducoes['label.telefone'] || 'Telefone',
      foto: traducoes['label.foto'] || 'Foto'
    }
  });
});

router.post('/cadastro', async (req, res) => {
  try {
    console.log('📥 Dados recebidos no body:', req.body);

    let {
      nome_completo,
      email_l,
      telefone_l,
      data_cadastro,
      empresa,
      login,
      foto
    } = req.body;

    const traducoes = await getTranslationsForUser(login);

    if (!telefone_l) {
      console.warn('⚠️ Telefone não informado.');
      return res.status(400).json({
        sucesso: false,
        mensagem: traducoes['mensagem.telefone_obrigatorio'] || 'Telefone é obrigatório'
      });
    }

    telefone_l = normalizarTelefone(telefone_l);
    console.log('📞 Telefone formatado para salvar:', telefone_l);

    console.log('🔎 Verificando se telefone já existe...');
    const [existente] = await pool.query(
      'SELECT id FROM acompanhamento WHERE telefone_l = ? AND empresa = ?',
      [telefone_l, empresa]
    );
    console.log('🔍 Resultado da verificação:', existente);

    let idCliente;

    if (existente.length > 0) {
      idCliente = existente[0].id;
      console.log(`✏️ Atualizando cliente existente (id: ${idCliente})`);

      let updateQuery = `
        UPDATE acompanhamento SET
          nome_l = ?, nome_completo = ?, email_l = ?, data_cadastro = ?
      `;
      const params = [nome_completo, nome_completo, email_l, data_cadastro];

      if (foto) {
        updateQuery += `, foto = ?`;
        params.push(foto);
      }

      updateQuery += ` WHERE id = ?`;
      params.push(idCliente);

      await pool.query(updateQuery, params);
    } else {
      console.log('🆕 Inserindo novo cliente...');
      const [result] = await pool.query(
        `INSERT INTO acompanhamento 
         (empresa, nome_l, nome_completo, email_l, telefone_l, data_cadastro, foto)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [empresa, nome_completo, nome_completo, email_l, telefone_l, data_cadastro, foto]
      );
      idCliente = result.insertId;
      console.log('✅ Cliente inserido com ID:', idCliente);
    }

    console.log(`🔗 Atualizando sec_users com id_cliente ${idCliente} para login "${login}"`);
    const userUpdateParams = [idCliente];
    let userUpdateQuery = `UPDATE sec_users SET id_cliente = ?`;

    if (foto) {
      userUpdateQuery += `, picture = ?`;
      userUpdateParams.push(foto);
    }

    userUpdateQuery += ` WHERE login = ?`;
    userUpdateParams.push(login);

    await pool.query(userUpdateQuery, userUpdateParams);

    console.log('✅ Cadastro finalizado com sucesso!');
    return res.status(200).json({
      sucesso: true,
      mensagem: traducoes['mensagem.cliente_salvo'] || 'Cliente salvo com sucesso',
      id_cliente: idCliente
    });

  } catch (error) {
    console.error('❌ Erro ao salvar cliente:', error);
    return res.status(500).json({
      sucesso: false,
      mensagem: 'Erro ao salvar cliente',
      erro: error.message
    });
  }
});

module.exports = router;
