const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { pool } = require('../config/database');
const { logActivity } = require('../utils/logger');

class AuthService {
  static async authenticateUser(login, password) {
    try {
      const hashedPassword = crypto.createHash('md5').update(password).digest('hex');

      const [userRows] = await pool.execute(`
        SELECT 
          u.priv_admin,
          u.usractive, 
          u.usrname, 
          u.email,
          u.unidade,
          u.permissao,
          g.group_id,
          g.description,
          u.picture,
          u.login
        FROM sec_users u 
        INNER JOIN sec_users_groups ug ON u.login = ug.login 
        INNER JOIN sec_groups g ON g.group_id = ug.group_id
        WHERE u.login = ? AND u.pswd = ?
      `, [login, hashedPassword]);

      if (userRows.length === 0) {
        await logActivity('login_fail', `Login failed for user: ${login}`);
        throw new Error('Credenciais inválidas');
      }

      const user = userRows[0];

      if (user.usractive !== 'Y') {
        throw new Error('Usuário inativo');
      }

      const userCompanies = await AuthService.getUserCompanies(login);
      if (userCompanies.length === 0) {
        throw new Error('Usuário não possui acesso a nenhuma empresa');
      }

      const companiesWithUnits = await AuthService.getCompaniesWithUnits(userCompanies);
      const userData = await AuthService.getUserAdditionalData(user, login);

      const jwtToken = jwt.sign(
        { login: user.login, group_id: user.group_id },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN }
      );

      const permissions = await AuthService.getUserPermissions(user.login);

      await logActivity('login_success', `Login successful for user: ${login}`, login);

      return {
        user: userData,
        token: jwtToken,
        permissions,
        companies: companiesWithUnits
      };

    } catch (error) {
      console.error('❌ Erro no login:', error);
      throw error;
    }
  }

  static async getUserAdditionalData(user, login) {
    const userData = {
      login: user.login,
      priv_admin: user.priv_admin === 'Y',
      name: user.usrname,
      email: user.email,
      permissao: user.permissao,
      group_id: user.group_id,
      group_desc: user.description,
      picture: user.picture
    };

    if (user.group_id === 2) {
      const [doctorRows] = await pool.execute(
        "SELECT iddoctor FROM doctors WHERE login = ?",
        [login]
      );
      userData.doctor_id = doctorRows[0]?.iddoctor || null;
    }

    const [studentRows] = await pool.execute(
      "SELECT student_id FROM students WHERE user_login = ?",
      [login]
    );
    userData.student_id = studentRows[0]?.student_id || '';

    return userData;
  }

  static async getUserCompanies(login) {
    const [companyRows] = await pool.execute(`
      SELECT b.id, b.description 
      FROM sec_users_companies a 
      INNER JOIN sec_companies b ON a.company_id = b.id 
      WHERE a.login = ? AND b.ativo = '1'
    `, [login]);

    return companyRows.map(row => ({
      id: row.id,
      name: row.description
    }));
  }

  static async getCompaniesWithUnits(companies) {
    const companiesWithUnits = [];

    for (const company of companies) {
      const [unitRows] = await pool.execute(`
        SELECT id, description 
        FROM sec_branchs 
        WHERE ativo = '1' AND company_id = ?
      `, [company.id]);

      companiesWithUnits.push({
        id: company.id,
        name: company.name,
        units: unitRows.map(unit => ({
          id: unit.id,
          name: unit.description
        }))
      });
    }

    return companiesWithUnits;
  }

  static async selectCompanyAndUnit(login, companyId, unitId) {
    const [companyAccess] = await pool.execute(`
      SELECT 1 
      FROM sec_users_companies a 
      INNER JOIN sec_companies b ON a.company_id = b.id 
      WHERE a.login = ? AND b.id = ? AND b.ativo = '1'
    `, [login, companyId]);

    if (companyAccess.length === 0) {
      throw new Error('Usuário não tem acesso a esta empresa');
    }

    const [unitAccess] = await pool.execute(`
      SELECT id, description 
      FROM sec_branchs 
      WHERE id = ? AND company_id = ? AND ativo = '1'
    `, [unitId, companyId]);

    if (unitAccess.length === 0) {
      throw new Error('Unidade não encontrada ou não pertence à empresa selecionada');
    }

    const [companyData] = await pool.execute(`
      SELECT id, description 
      FROM sec_companies 
      WHERE id = ? AND ativo = '1'
    `, [companyId]);

    const [userData] = await pool.execute(`
      SELECT group_id 
      FROM sec_users_groups 
      WHERE login = ?
    `, [login]);

    if (userData.length === 0) {
      throw new Error('Usuário não encontrado');
    }

    const jwtToken = jwt.sign(
      { login, group_id: userData[0].group_id, empresa: companyId, unidade: unitId },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN }
    );

    await AuthService.manageAccessKey(login, unitId, companyId, userData[0].group_id, jwtToken);
    await logActivity('company_unit_selected', `User ${login} selected company ${companyId} and unit ${unitId}`, login);

    return {
      token: jwtToken,
      selectedCompany: {
        id: companyData[0].id,
        name: companyData[0].description
      },
      selectedUnit: {
        id: unitAccess[0].id,
        name: unitAccess[0].description
      }
    };
  }

  static async manageAccessKey(login, unidade, empresa, groupId, token) {
    const [existingKey] = await pool.execute(
      "SELECT chave FROM chave_acesso WHERE login = ? AND unidade = ?",
      [login, unidade]
    );

    const now = new Date().toISOString().slice(0, 19).replace('T', ' ');

    if (existingKey.length === 0) {
      await pool.execute(
        "INSERT INTO chave_acesso (chave, login, empresa, unidade, grupo, data) VALUES (?, ?, ?, ?, ?, ?)",
        [token, login, empresa, unidade, groupId, now]
      );
    } else {
      await pool.execute(
        "UPDATE chave_acesso SET chave = ?, data = ? WHERE login = ? AND unidade = ?",
        [token, now, login, unidade]
      );
    }
  }

  static async getUserPermissions(login) {
    const [permissionRows] = await pool.execute(`
      SELECT 
        app_name,
        priv_access,
        priv_insert,
        priv_delete,
        priv_update,
        priv_export,
        priv_print
      FROM sec_groups_apps
      WHERE group_id IN (
        SELECT group_id
        FROM sec_users_groups 
        WHERE login = ?
      )
    `, [login]);

    const permissions = {};
    const defaultPerms = {
      access: false,
      insert: false,
      delete: false,
      update: false,
      export: false,
      print: false
    };

    permissionRows.forEach(row => {
      const app = row.app_name;
      if (!permissions[app]) permissions[app] = { ...defaultPerms };

      permissions[app].access = permissions[app].access || row.priv_access === 'Y';
      permissions[app].insert = permissions[app].insert || row.priv_insert === 'Y';
      permissions[app].delete = permissions[app].delete || row.priv_delete === 'Y';
      permissions[app].update = permissions[app].update || row.priv_update === 'Y';
      permissions[app].export = permissions[app].export || row.priv_export === 'Y';
      permissions[app].print = permissions[app].print || row.priv_print === 'Y';
    });

    return permissions;
  }

  static async logout(login, token) {
    await pool.execute(
      "DELETE FROM chave_acesso WHERE login = ? AND chave = ?",
      [login, token]
    );
    await logActivity('logout', `User logged out: ${login}`, login);
    return true;
  }
}

module.exports = AuthService;
