const fs = require('fs-extra');
const path = require('path');
const sharp = require('sharp');
const { v4: uuidv4 } = require('uuid');

const salvarImagemBase64 = async (base64, pasta = 'uploads') => {
  try {
    const matches = base64.match(/^data:(.+);base64,(.+)$/);
    if (!matches) return null;

    const ext = matches[1].split('/')[1];
    const buffer = Buffer.from(matches[2], 'base64');
    const filename = `${uuidv4()}.${ext}`;
    const dir = path.join(__dirname, '..', 'public', pasta);

    await fs.ensureDir(dir);
    const filePath = path.join(dir, filename);

    await sharp(buffer)
      .resize(200)
      .jpeg({ quality: 70 })
      .toFile(filePath);

    return `/public/${pasta}/${filename}`;
  } catch (error) {
    console.error('Erro ao salvar imagem base64:', error);
    return null;
  }
};

module.exports = { salvarImagemBase64 };
