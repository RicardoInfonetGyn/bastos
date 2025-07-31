const AuthService = require('../services/authService');
const { pool } = require('../config/database');

class AuthController {
  static async login(req, res) {
    try {
      const { login, password, idioma = 'pt-BR' } = req.body;

      // Autentica o usuário com idioma
      const result = await AuthService.authenticateUser(login, password, idioma);

      // Atualiza o idioma no banco (se desejar manter histórico)
      await pool.execute('UPDATE sec_users SET idioma = ? WHERE login = ?', [idioma, login]);

      res.json({
        success: true,
        message: 'Login realizado com sucesso',
        data: {
          ...result,
          idioma
        }
      });

    } catch (error) {
      console.error('❌ Erro no login:', error.message);
      res.status(401).json({
        success: false,
        message: error.message || 'Erro ao autenticar'
      });
    }
  }

  static async selectCompanyUnit(req, res) {
    try {
      const { companyId, unitId } = req.body;
      const { login } = req.user;

      const result = await AuthService.selectCompanyAndUnit(login, companyId, unitId);

      res.json({
        success: true,
        message: 'Empresa e unidade selecionadas com sucesso',
        data: result
      });

    } catch (error) {
      console.error('❌ Erro ao selecionar empresa/unidade:', error.message);
      res.status(400).json({
        success: false,
        message: error.message
      });
    }
  }

  static async logout(req, res) {
    try {
      const token = req.headers['authorization']?.split(' ')[1];
      const { login } = req.user;

      await AuthService.logout(login, token);

      res.json({
        success: true,
        message: 'Logout realizado com sucesso'
      });

    } catch (error) {
      console.error('❌ Erro no logout:', error.message);
      res.status(500).json({
        success: false,
        message: 'Erro ao realizar logout'
      });
    }
  }

  static async validateToken(req, res) {
    res.json({
      success: true,
      message: 'Token válido',
      user: req.user
    });
  }
}

module.exports = AuthController;
