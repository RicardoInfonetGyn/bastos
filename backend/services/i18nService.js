const { pool } = require('../config/database');

async function getTranslationsForUser(login) {
  const [[usuario]] = await pool.query(
    'SELECT idioma FROM sec_users WHERE login = ?',
    [login]
  );
  const idioma = usuario?.idioma || 'pt-BR';

  const [[idiomaRow]] = await pool.query(
    'SELECT id FROM idiomas WHERE codigo = ?',
    [idioma]
  );

  if (!idiomaRow) return {};

  const [rows] = await pool.query(
    'SELECT chave, valor FROM traducoes WHERE idioma_id = ?',
    [idiomaRow.id]
  );

  const traducoes = {};
  rows.forEach(({ chave, valor }) => {
    traducoes[chave] = valor;
  });

  return traducoes;
}

module.exports = { getTranslationsForUser };
