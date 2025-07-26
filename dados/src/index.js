// ====================
// Nazuna Bot - Index principal
// Criado por: Hiudy
// Versão: 4.0.0
// Atualizado: 12/07/2025
// Donate: https://cognima.com.br/donate
// ====================


const { downloadContentFromMessage } = require('@cognima/walib');
const { exec, execSync } = require('child_process');
const axios = require('axios');
const pathz = require('path');
const fs = require('fs');
const os = require('os');
const https = require('https'); 
const Banner = require("@cognima/banners");
const cron = require('node-cron');


let SocketActions = null;


const { version: botVersion } = JSON.parse(fs.readFileSync(pathz.join(__dirname, '..', '..', 'package.json')));


const DATABASE_DIR = __dirname + '/../database';
const GRUPOS_DIR = DATABASE_DIR + '/grupos';
const USERS_DIR = DATABASE_DIR + '/users';
const DONO_DIR = DATABASE_DIR + '/dono';
const DIR_PROGRAM = pathz.join(DATABASE_DIR, 'prog_actions.json');
const PARCERIAS_DIR = pathz.join(DATABASE_DIR, 'parcerias');
const LEVELING_FILE = pathz.join(DATABASE_DIR, 'leveling.json');


function formatUptime(seconds, longFormat = false, showZero = false) {
  const d = Math.floor(seconds / (24 * 3600));
  const h = Math.floor((seconds % (24 * 3600)) / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  const formats = longFormat ? { d: (val) => `${val} ${val === 1 ? 'dia' : 'dias'}`, h: (val) => `${val} ${val === 1 ? 'hora' : 'horas'}`, m: (val) => `${val} ${val === 1 ? 'minuto' : 'minutos'}`, s: (val) => `${val} ${val === 1 ? 'segundo' : 'segundos'}` } : { d: (val) => `${val}d`, h: (val) => `${val}h`, m: (val) => `${val}m`, s: (val) => `${val}s` };
  const uptimeStr = [];
  if (d > 0 || showZero) uptimeStr.push(formats.d(d));
  if (h > 0 || showZero) uptimeStr.push(formats.h(h));
  if (m > 0 || showZero) uptimeStr.push(formats.m(m));
  if (s > 0 || showZero) uptimeStr.push(formats.s(s));
  return uptimeStr.length > 0 ? uptimeStr.join(longFormat ? ', ' : ' ') : (longFormat ? '0 segundos' : '0s');
};


const normalizar = (texto, keepCase = false) => {
  if (!texto || typeof texto !== 'string') return '';
  const normalizedText = texto.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  return keepCase ? normalizedText : normalizedText.toLowerCase();
};


function ensureDirectoryExists(dirPath) {
  try {
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
    };
    return true;
  } catch (error) {
    console.error(`❌ Erro ao criar diretório ${dirPath}:`, error);
    return false;
  };
};


function ensureJsonFileExists(filePath, defaultContent = {}) {
  try {
    if (!fs.existsSync(filePath)) {
      const dirPath = pathz.dirname(filePath);
      ensureDirectoryExists(dirPath);
      fs.writeFileSync(filePath, JSON.stringify(defaultContent, null, 2));
    };
    return true;
  } catch (error) {
    console.error(`❌ Erro ao criar arquivo JSON ${filePath}:`, error);
    return false;
  };
};


const loadJsonFile = (path, defaultValue = {}) => {
    try {
      return fs.existsSync(path) ? JSON.parse(fs.readFileSync(path, 'utf-8')) : defaultValue;
    } catch (error) {
      console.error(`Erro ao carregar arquivo ${path}:`, error);
      return defaultValue;
    }
};


ensureDirectoryExists(GRUPOS_DIR);
ensureDirectoryExists(USERS_DIR);
ensureDirectoryExists(DONO_DIR);
ensureDirectoryExists(PARCERIAS_DIR);


ensureJsonFileExists(DATABASE_DIR + '/antiflood.json');
ensureJsonFileExists(DATABASE_DIR + '/cmdlimit.json');
ensureJsonFileExists(DATABASE_DIR + '/antipv.json', { mode: 'off', message: '🚫 Este comando só funciona em grupos!' });
ensureJsonFileExists(DONO_DIR + '/premium.json');
ensureJsonFileExists(DONO_DIR + '/bangp.json');
ensureJsonFileExists(DATABASE_DIR + '/globalBlocks.json', { commands: {}, users: {} });
ensureJsonFileExists(DATABASE_DIR + '/botState.json', { status: 'on' });
ensureJsonFileExists(LEVELING_FILE, {
  users: {},
  patents: [
    { name: "Iniciante", minLevel: 1 },
    { name: "Aprendiz", minLevel: 2 },
    { name: "Explorador", minLevel: 5 },
    { name: "Aventureiro", minLevel: 10 },
    { name: "Veterano", minLevel: 15 },
    { name: "Mestre", minLevel: 20 },
    { name: "Lenda", minLevel: 25 },
    { name: "Herói", minLevel: 30 },
    { name: "Conquistador", minLevel: 35 },
    { name: "Imperador", minLevel: 40 },
    { name: "Deus", minLevel: 50 },
    { name: "Titã", minLevel: 60 },
    { name: "Soberano", minLevel: 70 },
    { name: "Celestial", minLevel: 80 },
    { name: "Imortal", minLevel: 90 },
    { name: "Divindade", minLevel: 100 },
    { name: "Cosmico", minLevel: 120 },
    { name: "Eterno", minLevel: 140 },
    { name: "Supremo", minLevel: 160 },
    { name: "Omnipotente", minLevel: 180 },
    { name: "Transcendente", minLevel: 200 },
    { name: "Absoluto", minLevel: 250 },
    { name: "Infinito", minLevel: 300 }
  ]
});


const SUBDONOS_FILE = pathz.join(DONO_DIR, 'subdonos.json');
ensureJsonFileExists(SUBDONOS_FILE, { subdonos: [] });


const loadSubdonos = () => {
  return loadJsonFile(SUBDONOS_FILE, { subdonos: [] }).subdonos || [];
};


const saveSubdonos = (subdonoList) => {
  try {
    ensureDirectoryExists(DONO_DIR); 
    fs.writeFileSync(SUBDONOS_FILE, JSON.stringify({ subdonos: subdonoList }, null, 2));
    return true;
  } catch (error) {
    console.error('❌ Erro ao salvar subdonos:', error);
    return false;
  };
};


const isSubdono = (userId) => {
  const currentSubdonos = loadSubdonos(); 
  return currentSubdonos.includes(userId);
};


const addSubdono = (userId, numerodono) => {
  if (!userId || typeof userId !== 'string' || !userId.includes('@s.whatsapp.net')) {
      return { success: false, message: 'ID de usuário inválido. Use o formato completo (ex: 1234567890@s.whatsapp.net) ou marque o usuário.' };
  };
  let currentSubdonos = loadSubdonos();
  if (currentSubdonos.includes(userId)) {
      return { success: false, message: '✨ Este usuário já é um subdono! Não precisa adicionar de novo. 😊' };
  };
  const nmrdn_check = numerodono.replace(/[^\d]/g, "") + '@s.whatsapp.net';
  if (userId === nmrdn_check) {
      return { success: false, message: '🤔 O Dono principal já tem todos os superpoderes! Não dá pra adicionar como subdono. 😉' };
  };
  currentSubdonos.push(userId);
  if (saveSubdonos(currentSubdonos)) {
    return { success: true, message: '🎉 Pronto! Novo subdono adicionado com sucesso! ✨' };
  } else {
    return { success: false, message: '😥 Oops! Tive um probleminha para salvar a lista de subdonos. Tente novamente, por favor!' };
  };
};


const removeSubdono = (userId) => {
  if (!userId || typeof userId !== 'string' || !userId.includes('@s.whatsapp.net')) {
      return { success: false, message: 'ID de usuário inválido. Use o formato completo (ex: 1234567890@s.whatsapp.net) ou marque o usuário.' };
  }
  let currentSubdonos = loadSubdonos();
  if (!currentSubdonos.includes(userId)) {
      return { success: false, message: '🤔 Este usuário não está na lista de subdonos.' };
  };
  const initialLength = currentSubdonos.length;
  currentSubdonos = currentSubdonos.filter(id => id !== userId);
  if (currentSubdonos.length === initialLength) {
      return { success: false, message: 'Usuário não encontrado na lista (erro inesperado). 🤷' };
  };
  if (saveSubdonos(currentSubdonos)) {
    return { success: true, message: '👋 Pronto! Subdono removido com sucesso! ✨' };
  } else {
    return { success: false, message: '😥 Oops! Tive um probleminha para salvar a lista após remover o subdono. Tente novamente!' };
  };
};


const getSubdonos = () => {
  return [...loadSubdonos()];
};


const ALUGUEIS_FILE = pathz.join(DONO_DIR, 'alugueis.json');
const CODIGOS_ALUGUEL_FILE = pathz.join(DONO_DIR, 'codigos_aluguel.json');


ensureJsonFileExists(ALUGUEIS_FILE, { globalMode: false, groups: {} });
ensureJsonFileExists(CODIGOS_ALUGUEL_FILE, { codes: {} });


const loadRentalData = () => {
  return loadJsonFile(ALUGUEIS_FILE, { globalMode: false, groups: {} });
};


const saveRentalData = (data) => {
  try {
    ensureDirectoryExists(DONO_DIR);
    fs.writeFileSync(ALUGUEIS_FILE, JSON.stringify(data, null, 2));
    return true;
  } catch (error) {
    console.error('❌ Erro ao salvar dados de aluguel:', error);
    return false;
  }
};


const isRentalModeActive = () => {
  const rentalData = loadRentalData();
  return rentalData.globalMode === true;
};


const setRentalMode = (isActive) => {
  let rentalData = loadRentalData();
  rentalData.globalMode = !!isActive;
  return saveRentalData(rentalData);
};


const getGroupRentalStatus = (groupId) => {
  const rentalData = loadRentalData();
  const groupInfo = rentalData.groups[groupId];
  if (!groupInfo) {
    return { active: false, expiresAt: null, permanent: false };
  }
  if (groupInfo.expiresAt === 'permanent') {
    return { active: true, expiresAt: 'permanent', permanent: true };
  }
  if (groupInfo.expiresAt) {
    const expirationDate = new Date(groupInfo.expiresAt);
    if (expirationDate > new Date()) {
      return { active: true, expiresAt: groupInfo.expiresAt, permanent: false };
    } else {
      return { active: false, expiresAt: groupInfo.expiresAt, permanent: false };
    }
  }
  return { active: false, expiresAt: null, permanent: false };
};


const setGroupRental = (groupId, durationDays) => {
  if (!groupId || typeof groupId !== 'string' || !groupId.endsWith('@g.us')) {
    return { success: false, message: '🤔 ID de grupo inválido! Verifique se o ID está correto (geralmente termina com @g.us).' };
  }
  let rentalData = loadRentalData();
  let expiresAt = null;
  let message = '';
  if (durationDays === 'permanent') {
    expiresAt = 'permanent';
    message = `✅ Aluguel permanente ativado!`;
  } else if (typeof durationDays === 'number' && durationDays > 0) {
    const expirationDate = new Date();
    expirationDate.setDate(expirationDate.getDate() + durationDays);
    expiresAt = expirationDate.toISOString();
    message = `✅ Aluguel ativado por ${durationDays} dias! Expira em: ${expirationDate.toLocaleDateString('pt-BR')}.`;
  } else {
    return { success: false, message: '🤔 Duração inválida! Use um número de dias (ex: 30) ou a palavra "permanente".' };
  }
  rentalData.groups[groupId] = { expiresAt };
  if (saveRentalData(rentalData)) {
    return { success: true, message: message };
  } else {
    return { success: false, message: '😥 Oops! Tive um problema ao salvar as informações de aluguel deste grupo.' };
  }
};


const loadActivationCodes = () => {
  return loadJsonFile(CODIGOS_ALUGUEL_FILE, { codes: {} });
};


const saveActivationCodes = (data) => {
  try {
    ensureDirectoryExists(DONO_DIR);
    fs.writeFileSync(CODIGOS_ALUGUEL_FILE, JSON.stringify(data, null, 2));
    return true;
  } catch (error) {
    console.error('❌ Erro ao salvar códigos de ativação:', error);
    return false;
  }
};


const generateActivationCode = (durationDays, targetGroupId = null) => {
  const crypto = require('crypto');
  let code = '';
  let codesData = loadActivationCodes();
  do {
    code = crypto.randomBytes(4).toString('hex').toUpperCase();
  } while (codesData.codes[code]);
  if (durationDays !== 'permanent' && (typeof durationDays !== 'number' || durationDays <= 0)) {
      return { success: false, message: '🤔 Duração inválida para o código! Use um número de dias (ex: 7) ou "permanente".' };
  }
  if (targetGroupId && (typeof targetGroupId !== 'string' || !targetGroupId.endsWith('@g.us'))) {
      targetGroupId = null;
  }
  codesData.codes[code] = {
    duration: durationDays,
    targetGroup: targetGroupId,
    used: false,
    usedBy: null,
    usedAt: null,
    createdAt: new Date().toISOString()
  };
  if (saveActivationCodes(codesData)) {
    let message = `🔑 Código de ativação gerado:\n\n*${code}*\n\n`;
    if (durationDays === 'permanent') {
        message += `Duração: Permanente ✨\n`;
    } else {
        message += `Duração: ${durationDays} dias ⏳\n`;
    }
    if (targetGroupId) {
        message += `Grupo Alvo: ${targetGroupId} 🎯\n`;
    }
    message += `\nEnvie este código no grupo para ativar o aluguel.`;
    return { success: true, message: message, code: code };
  } else {
    return { success: false, message: '😥 Oops! Não consegui salvar o novo código de ativação. Tente gerar novamente!' };
  }
};


const validateActivationCode = (code) => {
  const codesData = loadActivationCodes();
  const codeInfo = codesData.codes[code?.toUpperCase()];

  if (!codeInfo) {
    return { valid: false, message: '🤷 Código de ativação inválido ou não encontrado!' };
  }
  if (codeInfo.used) {
    return { valid: false, message: `😕 Este código já foi usado em ${new Date(codeInfo.usedAt).toLocaleDateString('pt-BR')} por ${codeInfo.usedBy?.split('@')[0] || 'alguém'}!` };
  }
  return { valid: true, ...codeInfo };
};


const useActivationCode = (code, groupId, userId) => {
  const validation = validateActivationCode(code);
  if (!validation.valid) {
    return { success: false, message: validation.message };
  }
  const codeInfo = validation;
  code = code.toUpperCase();
  if (codeInfo.targetGroup && codeInfo.targetGroup !== groupId) {
    return { success: false, message: '🔒 Este código de ativação é específico para outro grupo!' };
  };
  const rentalResult = setGroupRental(groupId, codeInfo.duration);
  if (!rentalResult.success) {
    return { success: false, message: `😥 Oops! Erro ao ativar o aluguel com este código: ${rentalResult.message}` };
  }
  let codesData = loadActivationCodes();
  codesData.codes[code].used = true;
  codesData.codes[code].usedBy = userId;
  codesData.codes[code].usedAt = new Date().toISOString();
  codesData.codes[code].activatedGroup = groupId;
  if (saveActivationCodes(codesData)) {
    return { success: true, message: `🎉 Código *${code}* ativado com sucesso! ${rentalResult.message}` };
  } else {
    console.error(`Falha CRÍTICA ao marcar código ${code} como usado após ativar aluguel para ${groupId}.`);
    return { success: false, message: '🚨 Erro Crítico! O aluguel foi ativado, mas não consegui marcar o código como usado. Por favor, contate o suporte informando o código!' };
  }
};


const isModoLiteActive = (groupData, modoLiteGlobalConfig) => {
  const isModoLiteGlobal = modoLiteGlobalConfig?.status || false;
  const isModoLiteGrupo = groupData?.modolite || false;
  const groupHasSetting = groupData && typeof groupData.modolite === 'boolean';
  if (groupHasSetting) {
      return groupData.modolite; 
  }
  return isModoLiteGlobal;
};

const loadParceriasData = (groupId) => {
  const filePath = pathz.join(PARCERIAS_DIR, `${groupId}.json`);
  return loadJsonFile(filePath, { active: false, partners: {} });
};

const saveParceriasData = (groupId, data) => {
  const filePath = pathz.join(PARCERIAS_DIR, `${groupId}.json`);
  try {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
    return true;
  } catch (error) {
    console.error(`Erro ao salvar dados de parcerias para ${groupId}:`, error);
    return false;
  }
};

function calculateNextLevelXp(level) {
  return Math.floor(100 * Math.pow(1.1, level - 1));
}

function getPatent(level, patents) {
  for (let i = patents.length - 1; i >= 0; i--) {
    if (level >= patents[i].minLevel) {
      return patents[i].name;
    }
  }
  return "Iniciante";
}

function checkLevelUp(userId, userData, levelingData, nazu, from) {
  const nextLevelXp = calculateNextLevelXp(userData.level);
  if (userData.xp >= nextLevelXp) {
    userData.level++;
    userData.xp -= nextLevelXp;
    userData.patent = getPatent(userData.level, levelingData.patents);
    fs.writeFileSync(LEVELING_FILE, JSON.stringify(levelingData, null, 2));
    nazu.sendMessage(from, {
      text: `🎉 @${userId.split('@')[0]} subiu para o nível ${userData.level}!\n🔹 XP atual: ${userData.xp}\n🎖️ Nova patente: ${userData.patent}`,
      mentions: [userId]
    });
  }
}

function checkLevelDown(userId, userData, levelingData) {
  while (userData.xp < 0 && userData.level > 1) {
    userData.level--;
    const prevLevelXp = calculateNextLevelXp(userData.level - 1);
    userData.xp += prevLevelXp;
  }
  if (userData.xp < 0) userData.xp = 0;
  userData.patent = getPatent(userData.level, levelingData.patents);
}

async function NazuninhaBotExec(nazu, info, store, groupCache, messagesCache) {
  SocketActions = nazu;
  
  var config = JSON.parse(fs.readFileSync(__dirname+'/config.json'));
  var { numerodono, nomedono, nomebot, prefixo, debug } = config;
  var { menu, menudown, menuadm, menubn, menuDono, menuMembros, menuFerramentas, menuSticker, menuIa, menuAlterador, menuLogos, menuTopCmd } = require(`${__dirname}/menus/index.js`);
  var prefix = prefixo;
  var numerodono = String(numerodono);
  
  const { youtube, tiktok, pinterest, igdl, sendSticker, FilmesDL, styleText, emojiMix, upload, mcPlugin, tictactoe, toolsJson, vabJson, apkMod, google, Lyrics, commandStats, ia, VerifyUpdate } = await require(__dirname+'/funcs/exports.js');
    
  const antipvData = loadJsonFile(DATABASE_DIR + '/antipv.json');
  const premiumListaZinha = loadJsonFile(DONO_DIR + '/premium.json');
  const banGpIds = loadJsonFile(DONO_DIR + '/bangp.json');
  const antifloodData = loadJsonFile(DATABASE_DIR + '/antiflood.json');
  const cmdLimitData = loadJsonFile(DATABASE_DIR + '/cmdlimit.json');
  const globalBlocks = loadJsonFile(DATABASE_DIR + '/globalBlocks.json', { commands: {}, users: {} });
  const botState = loadJsonFile(DATABASE_DIR + '/botState.json', { status: 'on' });
  
  const modoLiteFile = DATABASE_DIR + '/modolite.json';
  let modoLiteGlobal = loadJsonFile(modoLiteFile, { status: false });
  
  if (!fs.existsSync(modoLiteFile)) {
    fs.writeFileSync(modoLiteFile, JSON.stringify(modoLiteGlobal, null, 2));
  };

  global.autoStickerMode = global.autoStickerMode || 'default';

  try {
    const from = info.key.remoteJid;
    const isGroup = from?.endsWith('@g.us') || false;
    if(!info.key.participant && !info.key.remoteJid) return;  
    const sender = isGroup ? (info.key.participant?.includes(':') ? info.key.participant.split(':')[0] + '@s.whatsapp.net' : info.key.participant) : info.key.remoteJid;
    const pushname = info.pushName || '';
    const isStatus = from?.endsWith('@broadcast') || false;  
    const nmrdn = numerodono.replace(/[^\d]/g, "") + '@s.whatsapp.net';  
    const subDonoList = loadSubdonos();
    const isSubOwner = isSubdono(sender);
    const isOwner = (nmrdn === sender) || info.key.fromMe || isSubOwner;
    const isOwnerOrSub = isOwner || isSubOwner;
 
    const WaLib = require('@cognima/walib');
    const type = WaLib.getContentType(info.message);
 
    const isMedia = ["imageMessage", "videoMessage", "audioMessage"].includes(type);
    const isImage = type === 'imageMessage';
    const isVideo = type === 'videoMessage';
    const isVisuU2 = type === 'viewOnceMessageV2';
    const isVisuU = type === 'viewOnceMessage';
 
    const getMessageText = (message) => {
      if (!message) return '';
      return message.conversation || message.extendedTextMessage?.text || message.imageMessage?.caption || message.videoMessage?.caption || message.documentWithCaptionMessage?.message?.documentMessage?.caption || message.viewOnceMessage?.message?.imageMessage?.caption || message.viewOnceMessage?.message?.videoMessage?.caption || message.viewOnceMessageV2?.message?.imageMessage?.caption || message.viewOnceMessageV2?.message?.videoMessage?.caption || message.editedMessage?.message?.protocolMessage?.editedMessage?.extendedTextMessage?.text || message.editedMessage?.message?.protocolMessage?.editedMessage?.imageMessage?.caption || '';
    };

    const body = getMessageText(info.message) || info?.text || '';
    
    const args = body.trim().split(/ +/).slice(1);
    var q = args.join(' ');
    const budy2 = normalizar(body);
 
    const menc_prt = info.message?.extendedTextMessage?.contextInfo?.participant;
    const menc_jid = q.replace("@", "").split(' ')[0] + "@s.whatsapp.net";
    const menc_jid2 = info.message?.extendedTextMessage?.contextInfo?.mentionedJid;
    const menc_os2 = q.includes("@") ? menc_jid : menc_prt;
    const sender_ou_n = q.includes("@") ? menc_jid : (menc_prt || sender);
    
    const groupFile = pathz.join(__dirname, '..', 'database', 'grupos', `${from}.json`);
    let groupData = {};
    const groupMetadata = !isGroup ? {} : await nazu.groupMetadata(from).catch(() => ({}));
    const groupName = groupMetadata?.subject || '';
    
    if (isGroup) {
      if (!fs.existsSync(groupFile)) {
        fs.writeFileSync(groupFile, JSON.stringify({ 
          mark: {},
          createdAt: new Date().toISOString(),
          groupName: groupName
        }, null, 2));
      };
      
      try {
        groupData = JSON.parse(fs.readFileSync(groupFile));
      } catch (error) {
        console.error(`Erro ao carregar dados do grupo ${from}:`, error);
        groupData = { mark: {} };
      };
    
      groupData.moderators = groupData.moderators || [];
      groupData.allowedModCommands = groupData.allowedModCommands || [];
      groupData.mutedUsers = groupData.mutedUsers || {};
      groupData.levelingEnabled = groupData.levelingEnabled || false;
      
      if (groupName && groupData.groupName !== groupName) {
        groupData.groupName = groupName;
        fs.writeFileSync(groupFile, JSON.stringify(groupData, null, 2));
      };
    };
    
    let parceriasData = {};
    if (isGroup) {
      parceriasData = loadParceriasData(from);
    };
    
    const groupPrefix = groupData.customPrefix || prefixo;
    const isCmd = body.trim().startsWith(groupPrefix);
    var command = isCmd ? (normalizar(body.trim().slice(groupPrefix.length).split(/ +/).shift().trim())).replace(/\s+/g, '') : null;
 
    if (!isGroup) {
  if (antipvData.mode === 'antipv' && !isOwner) {
    return;
  };
  if (antipvData.mode === 'antipv2' && isCmd && !isOwner) {
    await reply(antipvData.message || '🚫 Este comando só funciona em grupos!');
    return;
  };
  if (antipvData.mode === 'antipv3' && isCmd && !isOwner) {
    await nazu.updateBlockStatus(sender, 'block');
    await reply('🚫 Você foi bloqueado por usar comandos no privado!');
    return;
  };
}

    const isPremium = premiumListaZinha[sender] || premiumListaZinha[from] || isOwner;
 
    if (isGroup && banGpIds[from] && !isOwner && !isPremium) {
      return;
    };
 
    const AllgroupMembers = !isGroup ? [] : groupMetadata.participants?.map(p => p.id) || [];
    const groupAdmins = !isGroup ? [] : groupMetadata.participants?.filter(p => p.admin).map(p => p.id) || [];
  
    const botNumber = nazu.user.id.split(':')[0] + '@s.whatsapp.net';
    const isBotAdmin = !isGroup ? false : groupAdmins.includes(botNumber);
  
    let isGroupAdmin = false;
    if (isGroup) {
      const isModeratorActionAllowed = groupData.moderators?.includes(sender) && groupData.allowedModCommands?.includes(command);
      isGroupAdmin = groupAdmins.includes(sender) || isOwner || isModeratorActionAllowed;
    };
  
    const isModoBn = groupData.modobrincadeira;
    const isOnlyAdmin = groupData.soadm;
    const isAntiPorn = groupData.antiporn;
    const isMuted = groupData.mutedUsers?.[sender];
    const isAntiLinkGp = groupData.antilinkgp;
    const isAntiDel = groupData.antidel;
    const isAutoRepo = groupData.autorepo;
    const isAssistente = groupData.assistente;
    const isModoLite = isGroup && isModoLiteActive(groupData, modoLiteGlobal);
  
    if (isGroup && isOnlyAdmin && !isGroupAdmin) {
      return;
    };
    
    if(isGroup && info.message.protocolMessage && info.message.protocolMessage.type === 0 && isAntiDel) {
      const msg = messagesCache.get(info.message.protocolMessage.key.id);
      if(!msg) return;
      const clone = JSON.parse(JSON.stringify(msg).replaceAll('conversation', 'text').replaceAll('Message', ''));
      for (const key in clone) {
        const media = clone[key];
        if (media && typeof media === 'object' && media.url) {
        clone[key] = { url: media.url };
          for (const subkey in media) {
            if (subkey !== 'url') {
            clone[subkey] = media[subkey];
            }
          }
        }
      }
      await nazu.sendMessage(from, clone);
    };

    if (isGroup && isCmd && !isGroupAdmin && 
      groupData.blockedCommands && groupData.blockedCommands[command]) {
      await reply('⛔ Este comando foi bloqueado pelos administradores do grupo.');
      return;
    };
  
    if (isGroup && groupData.afkUsers && groupData.afkUsers[sender]) {
      try {
        const afkReason = groupData.afkUsers[sender].reason;
        const afkSince = new Date(groupData.afkUsers[sender].since || Date.now()).toLocaleString('pt-BR');
        delete groupData.afkUsers[sender];
        fs.writeFileSync(groupFile, JSON.stringify(groupData, null, 2));
        await reply(`👋 *Bem-vindo(a) de volta!*\nSeu status AFK foi removido.\nVocê estava ausente desde: ${afkSince}`);
      } catch (error) {
        console.error("Erro ao processar remoção de AFK:", error);
      };
    };

    if (isGroup && isMuted) {
      try {
        await nazu.sendMessage(from, { text: `🤫 *Usuário mutado detectado*\n\n@${sender.split("@")[0]}, você está tentando falar enquanto está mutado neste grupo. Você será removido conforme as regras.`, mentions: [sender] }, {quoted: info});
        await nazu.sendMessage(from, { delete: { remoteJid: from, fromMe: false, id: info.key.id, participant: sender }});      
        if (isBotAdmin) {
          await nazu.groupParticipantsUpdate(from, [sender], 'remove');
        } else {
          await reply("⚠️ Não posso remover o usuário porque não sou administrador.");
        };
        delete groupData.mutedUsers[sender];
        fs.writeFileSync(groupFile, JSON.stringify(groupData, null, 2));
        return;
      } catch (error) {
        console.error("Erro ao processar usuário mutado:", error);
      };
    };
 
    const rentalModeOn = isRentalModeActive();
    let groupHasActiveRental = false;
    let rentalStatusChecked = false;

    if (isGroup && rentalModeOn) {
      const rentalStatus = getGroupRentalStatus(from);
      groupHasActiveRental = rentalStatus.active;
      rentalStatusChecked = true;
    
      const allowedCommandsBypass = ['modoaluguel', 'addaluguel', 'gerarcodigo', 'addsubdono', 'remsubdono', 'listasubdonos'];

      if (!groupHasActiveRental && isCmd && !isOwnerOrSub && !allowedCommandsBypass.includes(command)) {
        await reply("⏳ Oops! Parece que o aluguel deste grupo expirou ou não está ativo. Para usar os comandos, ative com um código ou peça para o dono renovar! 😊");
        return;
      };
    };

    if (isGroup && !isCmd && body && /\b[A-F0-9]{8}\b/.test(body.toUpperCase())) {
      const potentialCode = body.match(/\b[A-F0-9]{8}\b/)[0].toUpperCase();
      const validation = validateActivationCode(potentialCode);
      if (validation.valid) {
        try {
          const activationResult = useActivationCode(potentialCode, from, sender);
          await reply(activationResult.message);
          if (activationResult.success) {
            return;
          };
        } catch (e) {
          console.error(`Erro ao tentar usar código de ativação ${potentialCode} no grupo ${from}:`, e);
        };
      };
    };

    if (isGroup) {
      try {
        groupData.contador = groupData.contador || [];
     
        const userIndex = groupData.contador.findIndex(user => user.id === sender);
     
        if (userIndex !== -1) {
          const userData = groupData.contador[userIndex];       
          if (isCmd) {
            userData.cmd = (userData.cmd || 0) + 1;
          } else if (type === "stickerMessage") {
            userData.figu = (userData.figu || 0) + 1;
          } else {
            userData.msg = (userData.msg || 0) + 1;
          };       
          if (pushname && userData.pushname !== pushname) {
            userData.pushname = pushname;
          };
          userData.lastActivity = new Date().toISOString();
        } else {
          groupData.contador.push({ id: sender, msg: isCmd ? 0 : 1, cmd: isCmd ? 1 : 0, figu: type === "stickerMessage" ? 1 : 0, pushname: pushname || 'Usuário Desconhecido', firstSeen: new Date().toISOString(), lastActivity: new Date().toISOString()});
        };
        fs.writeFileSync(groupFile, JSON.stringify(groupData, null, 2));
      } catch (error) {
        console.error("Erro no sistema de contagem de mensagens:", error);
      };
    };
    
    if (isGroup && groupData.levelingEnabled) {
      const levelingData = loadJsonFile(LEVELING_FILE);
      levelingData.users[sender] = levelingData.users[sender] || { level: 1, xp: 0, patent: "Iniciante", messages: 0, commands: 0 };
      const userData = levelingData.users[sender];
      userData.messages++;
      if (isCmd) {
        userData.commands++;
        userData.xp += 10;
      } else {
        userData.xp += 5;
      }
      checkLevelUp(sender, userData, levelingData, nazu, from);
      fs.writeFileSync(LEVELING_FILE, JSON.stringify(levelingData, null, 2));
    };
 
    async function reply(text, options = {}) {
      try {
        const { 
          mentions = [], 
          noForward = false, 
          noQuote = false,
          buttons = null
        } = options;
     
        const messageContent = {
          text: text.trim(),
          mentions: mentions
        };
     
        if (buttons) {
          messageContent.buttons = buttons;
          messageContent.headerType = 1;
        }
     
        const sendOptions = {
          sendEphemeral: true
        };
     
        if (!noForward) {
          sendOptions.contextInfo = { 
            forwardingScore: 50, 
            isForwarded: true, 
            externalAdReply: { 
              showAdAttribution: true 
            }
          };
        }
     
        if (!noQuote) {
          sendOptions.quoted = info;
        }
     
        const result = await nazu.sendMessage(from, messageContent, sendOptions);
        return result;
      } catch (error) {
        console.error("Erro ao enviar mensagem:", error);
        return null;
      }
    }
    
    nazu.reply = reply;
 
    const reagir = async (emj, options = {}) => {
      try {
        const messageKey = options.key || info.key;
        const delay = options.delay || 500;
     
        if (!messageKey) {
          console.error("Chave de mensagem inválida para reação");
          return false;
        }
     
        if (typeof emj === 'string') {
          if (emj.length < 1 || emj.length > 5) {
            console.warn("Emoji inválido para reação:", emj);
            return false;
          }
       
          await nazu.sendMessage(from, { 
            react: { 
              text: emj, 
              key: messageKey 
            } 
          });
       
          return true;
        } else if (Array.isArray(emj) && emj.length > 0) {
          for (const emoji of emj) {
            if (typeof emoji !== 'string' || emoji.length < 1 || emoji.length > 5) {
              console.warn("Emoji inválido na sequência:", emoji);
              continue;
            }
         
            await nazu.sendMessage(from, { 
              react: { 
                text: emoji, 
                key: messageKey 
              } 
            });
         
            if (delay > 0 && emj.indexOf(emoji) < emj.length - 1) {
              await new Promise(resolve => setTimeout(resolve, delay));
            }
          }
       
          return true;
        }
     
        return false;
      } catch (error) {
        console.error("Erro ao reagir com emoji:", error);
        return false;
      }
    };
    
    nazu.react = reagir;
 
 
    const getFileBuffer = async (mediakey, mediaType, options = {}) => {
      try {
        if (!mediakey) {
          throw new Error('Chave de mídia inválida');
        }     
        const stream = await downloadContentFromMessage(mediakey, mediaType);     
        let buffer = Buffer.from([]);    
        const MAX_BUFFER_SIZE = 50 * 1024 * 1024;
        let totalSize = 0;
        for await (const chunk of stream) {
          buffer = Buffer.concat([buffer, chunk]);
          totalSize += chunk.length;       
          if (totalSize > MAX_BUFFER_SIZE) {
            throw new Error(`Tamanho máximo de buffer excedido (${MAX_BUFFER_SIZE / (1024 * 1024)}MB)`);
          }
        }
     
        if (options.saveToTemp) {
          try {
            const tempDir = pathz.join(__dirname, '..', 'database', 'tmp');
            ensureDirectoryExists(tempDir);
            const fileName = options.fileName || `${Date.now()}_${Math.floor(Math.random() * 10000)}`;
            const extensionMap = {
              image: '.jpg',
              video: '.mp4',
              audio: '.mp3',
              document: '.bin'
            };
      
            const extension = extensionMap[mediaType] || '.dat';
         
            const filePath = pathz.join(tempDir, fileName + extension);
         
            fs.writeFileSync(filePath, buffer);
         
            return filePath;
          } catch (fileError) {
            console.error('Erro ao salvar arquivo temporário:', fileError);
          }
        }
     
        return buffer;
      } catch (error) {
        console.error(`Erro ao obter buffer de ${mediaType}:`, error);
        throw error;
      }
    }


    const getMediaInfo = (message) => {
      if (!message) return null;
      if (message.imageMessage) return { media: message.imageMessage, type: 'image' };
      if (message.videoMessage) return { media: message.videoMessage, type: 'video' };
      if (message.viewOnceMessage?.message?.imageMessage) return { media: message.viewOnceMessage.message.imageMessage, type: 'image' };
      if (message.viewOnceMessage?.message?.videoMessage) return { media: message.viewOnceMessage.message.videoMessage, type: 'video' };
      if (message.viewOnceMessageV2?.message?.imageMessage) return { media: message.viewOnceMessageV2.message.imageMessage, type: 'image' };
      if (message.viewOnceMessageV2?.message?.videoMessage) return { media: message.viewOnceMessageV2.message.videoMessage, type: 'video' };
      return null;
    };


    if (isGroup && info.message?.extendedTextMessage?.contextInfo?.mentionedJid) {
      const mentioned = info.message.extendedTextMessage.contextInfo.mentionedJid;
      if (groupData.afkUsers) {
        for (const jid of mentioned) {
          if (groupData.afkUsers[jid]) {
            const afkData = groupData.afkUsers[jid];
            const afkSince = new Date(afkData.since).toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' });
            let afkMsg = `😴 @${jid.split('@')[0]} está AFK desde ${afkSince}.`;
            if (afkData.reason) {
              afkMsg += `\nMotivo: ${afkData.reason}`;
            }
            await reply(afkMsg, { mentions: [jid] });
          }
        }
      }
    }


    if (isGroup && isAntiPorn && !info.key.fromMe) {
      const mediaInfo = getMediaInfo(info.message);
      if (mediaInfo && mediaInfo.type === 'image') {
        try {
          const imageBuffer = await getFileBuffer(mediaInfo.media, 'image');
          const mediaURL = await upload(imageBuffer, true);
          if (mediaURL) {
            const apiResponse = await axios.get(`https://nsfw-demo.sashido.io/api/image/classify?url=${encodeURIComponent(mediaURL)}`);
            let scores = { Porn: 0, Hentai: 0 };
            if (Array.isArray(apiResponse.data)) {
              scores = apiResponse.data.reduce((acc, item) => {
                if (item && typeof item.className === 'string' && typeof item.probability === 'number') {
                  if (item.className === 'Porn' || item.className === 'Hentai') {
                    acc[item.className] = Math.max(acc[item.className] || 0, item.probability);
                  }
                }
                return acc;
              }, { Porn: 0, Hentai: 0 });
            } else {
              console.warn("Anti-porn API response format unexpected:", apiResponse.data);
            };
            const pornThreshold = 0.7;
            const hentaiThreshold = 0.7;
            const isPorn = scores.Porn >= pornThreshold;
            const isHentai = scores.Hentai >= hentaiThreshold;
            if (isPorn || isHentai) {
              const reason = isPorn ? 'Pornografia' : 'Hentai';
              await reply(`🚨 Conteúdo impróprio detectado! (${reason})`);
              if (isBotAdmin) {
                try {
                  await nazu.sendMessage(from, { delete: info.key });
                  await nazu.groupParticipantsUpdate(from, [sender], 'remove');
                  await reply(`🔞 Oops! @${sender.split('@')[0]}, conteúdo impróprio não é permitido e você foi removido(a).`,  { mentions: [sender] });
                } catch (adminError) {
                  console.error(`Erro ao remover usuário por anti-porn: ${adminError}`);
                  await reply(`⚠️ Não consegui remover @${sender.split('@')[0]} automaticamente após detectar conteúdo impróprio. Admins, por favor, verifiquem!`,  { mentions: [sender] });
                };
              } else {
                await reply(`@${sender.split('@')[0]} enviou conteúdo impróprio (${reason}), mas não posso removê-lo sem ser admin.`, { mentions: [sender] });
              }
            }
          } else {
             console.warn("Falha no upload da imagem para verificação anti-porn.");
          }
        } catch (error) {
          console.error("Erro na verificação anti-porn:", error);
        };
      };
    };


    if (isGroup && groupData.antiloc && !isGroupAdmin && type === 'locationMessage') {
      await nazu.sendMessage(from, { delete: { remoteJid: from, fromMe: false, id: info.key.id, participant: sender } });
      await nazu.groupParticipantsUpdate(from, [sender], 'remove');
      await reply(`🗺️ Ops! @${sender.split('@')[0]}, parece que localizações não são permitidas aqui e você foi removido(a).`,  { mentions: [sender] });
    };


    if (isGroup && antifloodData[from]?.enabled && isCmd && !isGroupAdmin) {
      antifloodData[from].users = antifloodData[from].users || {};
      const now = Date.now();
      const lastCmd = antifloodData[from].users[sender]?.lastCmd || 0;
      const interval = antifloodData[from].interval * 1000;
      if (now - lastCmd < interval) {
        return reply(`⏳ Calma aí, apressadinho(a)! 😊 Espere ${Math.ceil((interval - (now - lastCmd)) / 1000)} segundos para usar outro comando, por favor! ✨`);
      };
      antifloodData[from].users[sender] = { lastCmd: now };
      fs.writeFileSync(__dirname + '/../database/antiflood.json', JSON.stringify(antifloodData, null, 2));
    };


    if (isGroup && groupData.antidoc && !isGroupAdmin && (type === 'documentMessage' || type === 'documentWithCaptionMessage')) {
      await nazu.sendMessage(from, { delete: { remoteJid: from, fromMe: false, id: info.key.id, participant: sender } });
      await nazu.groupParticipantsUpdate(from, [sender], 'remove');
      await reply(`📄 Oops! @${sender.split('@')[0]}, parece que documentos não são permitidos aqui e você foi removido(a).`,  { mentions: [sender] });
    };


    if (isGroup && cmdLimitData[from]?.enabled && isCmd && !isGroupAdmin) {
      cmdLimitData[from].users = cmdLimitData[from].users || {};
      const today = new Date().toISOString().split('T')[0];
      cmdLimitData[from].users[sender] = cmdLimitData[from].users[sender] || { date: today, count: 0 };
      if (cmdLimitData[from].users[sender].date !== today) {
        cmdLimitData[from].users[sender] = { date: today, count: 0 };
      }
      if (cmdLimitData[from].users[sender].count >= cmdLimitData[from].limit) {
        return reply(`🚫 Oops! Você já usou seus ${cmdLimitData[from].limit} comandos de hoje. Tente novamente amanhã! 😊`);
      }
      cmdLimitData[from].users[sender].count++;
      fs.writeFileSync(__dirname + '/../database/cmdlimit.json', JSON.stringify(cmdLimitData, null, 2));
    };


    if (isGroup && groupData.autodl && budy2.includes('http') && !isCmd) {
      const urlMatch = body.match(/(https?:\/\/[^\s]+)/g);
      if (urlMatch) {
        for (const url of urlMatch) {
          try {
            if (url.includes('tiktok.com')) {
              const datinha = await tiktok.dl(url);
              if (datinha.ok) {
                await nazu.sendMessage(from, { [datinha.type]: { url: datinha.urls[0] }, caption: '🎵 Download automático do TikTok!' }, { quoted: info });
              }
            } else if (url.includes('instagram.com')) {
              const datinha = await igdl.dl(url);
              if (datinha.ok) {
                await nazu.sendMessage(from, { [datinha.data[0].type]: datinha.data[0].buff, caption: '📸 Download automático do Instagram!' }, { quoted: info });
              }
            } else if (url.includes('pinterest.com') || url.includes('pin.it') ) {
              const datinha = await pinterest.dl(url);
              if (datinha.ok) {
                await nazu.sendMessage(from, { [datinha.type]: { url: datinha.urls[0] }, caption: '📌 Download automático do Pinterest!' }, { quoted: info });
              }
            }
          } catch (e) {
            console.error('Erro no autodl:', e);
          }
        }
      }
    }


    if (isGroup && groupData.autoSticker && !info.key.fromMe) {
      try {
        const mediaImage = info.message?.imageMessage || info.message?.viewOnceMessageV2?.message?.imageMessage || info.message?.viewOnceMessage?.message?.imageMessage;                      
        const mediaVideo = info.message?.videoMessage || info.message?.viewOnceMessageV2?.message?.videoMessage || info.message?.viewOnceMessage?.message?.videoMessage;     
        if (mediaImage || mediaVideo) {
          const isVideo = !!mediaVideo;     
          if (isVideo && mediaVideo.seconds > 9.9) {
            return;
          }       
          const buffer = await getFileBuffer(
            isVideo ? mediaVideo : mediaImage, 
            isVideo ? 'video' : 'image'
          );
          const shouldForceSquare = global.autoStickerMode === 'square';
       
          await sendSticker(nazu, from, { sticker: buffer, author: `『${pushname}』\n『${nomebot}』\n『${nomedono}』\n『cognima.com.br』`, packname: '👤 Usuario(a)ᮀ۟❁’￫\n🤖 Botᮀ۟❁’￫\n👑 Donoᮀ۟❁’￫\n🌐 Siteᮀ۟❁’￫', type: isVideo ? 'video' : 'image', forceSquare: shouldForceSquare }, { quoted: info });
        }
      } catch (e) {
        console.error("Erro ao converter mídia em figurinha automática:", e);
      }
    };


    if (isGroup && groupData.antilinkhard && !isGroupAdmin && budy2.includes('http') && !isOwner) {
      try {
        await nazu.sendMessage(from, { delete: { remoteJid: from, fromMe: false, id: info.key.id, participant: sender }});
        if (isBotAdmin) {
          await nazu.groupParticipantsUpdate(from, [sender], 'remove');
          await reply(`🔗 Ops! @${sender.split('@')[0]}, links não são permitidos aqui e você foi removido(a).`,  { mentions: [sender] });
        } else {
          await reply(`🔗 Atenção, @${sender.split('@')[0]}! Links não são permitidos aqui. Não consigo remover você, mas por favor, evite enviar links. 😉`,  { mentions: [sender] });
        };     
        return;
      } catch (error) {
        console.error("Erro no sistema antilink hard:", error);
      };
    };


    let quotedMessageContent = null;
    if (type === 'extendedTextMessage' && info.message?.extendedTextMessage?.contextInfo?.quotedMessage) {
      quotedMessageContent = info.message.extendedTextMessage.contextInfo.quotedMessage;
    }
 
    const isQuotedMsg = !!quotedMessageContent?.conversation;
    const isQuotedMsg2 = !!quotedMessageContent?.extendedTextMessage?.text;
    const isQuotedImage = !!quotedMessageContent?.imageMessage;
    const isQuotedVisuU = !!quotedMessageContent?.viewOnceMessage;
    const isQuotedVisuU2 = !!quotedMessageContent?.viewOnceMessageV2;
    const isQuotedVideo = !!quotedMessageContent?.videoMessage;
    const isQuotedDocument = !!quotedMessageContent?.documentMessage;
    const isQuotedDocW = !!quotedMessageContent?.documentWithCaptionMessage;
    const isQuotedAudio = !!quotedMessageContent?.audioMessage;
    const isQuotedSticker = !!quotedMessageContent?.stickerMessage;
    const isQuotedContact = !!quotedMessageContent?.contactMessage;
    const isQuotedLocation = !!quotedMessageContent?.locationMessage;
    const isQuotedProduct = !!quotedMessageContent?.productMessage;
 
 
    if (body.startsWith('$')) {
      if (!isOwner) return;
      try {
        exec(q, (err, stdout) => {
          if (err) {
            return reply(`❌ *Erro na execução*\n\n${err}`);
          };
          if (stdout) {
            reply(`✅ *Resultado do comando*\n\n${stdout}`);
          };
      });
      } catch (error) {
        reply(`❌ *Erro ao executar comando*\n\n${error}`);
      };
    };
 

    if (body.startsWith('>>')) {
      if (!isOwner) return;
      try {
        (async () => {
          try {
            const codeLines = body.slice(2).trim().split('\n');
            if (codeLines.length > 1) {
              if (!codeLines[codeLines.length - 1].includes('return')) {
                codeLines[codeLines.length - 1] = 'return ' + codeLines[codeLines.length - 1];
              };
            } else {
              if (!codeLines[0].includes('return')) {
                codeLines[0] = 'return ' + codeLines[0];
              };
            };
            const result = await eval(`(async () => { ${codeLines.join('\n')} })()`);
            let output;
            if (typeof result === 'object' && result !== null) {
              output = JSON.stringify(result, null, 2);
            } else if (typeof result === 'function') {
              output = result.toString();
            } else {
              output = String(result);
            };
            return reply(`✅ *Resultado da execução*\n\n${output}`).catch(e => reply(String(e)));
          } catch (e) {
            return reply(`❌ *Erro na execução*\n\n${String(e)}`);
          }
        })();
      } catch (e) {
        reply(`❌ *Erro crítico*\n\n${String(e)}`);
      };
    };
 

    if (isGroup && isAntiLinkGp && !isGroupAdmin && budy2.includes('chat.whatsapp.com')) {
      try {
        if (isOwner) return;
        const link_dgp = await nazu.groupInviteCode(from);
        if (budy2.includes(link_dgp)) return;
        await nazu.sendMessage(from, { delete: { remoteJid: from, fromMe: false, id: info.key.id, participant: sender }});
        if (!AllgroupMembers.includes(sender)) return;
        if (isBotAdmin) {
          await nazu.groupParticipantsUpdate(from, [sender], 'remove');
          await reply(`🔗 Ops! @${sender.split('@')[0]}, links de outros grupos não são permitidos aqui e você foi removido(a).`,  { mentions: [sender] });
        } else {
          await reply(`🔗 Atenção, @${sender.split('@')[0]}! Links de outros grupos não são permitidos. Não consigo remover você, mas por favor, evite compartilhar esses links. 😉`,  { mentions: [sender] });
        }     
        return;
      } catch (error) {
        console.error("Erro no sistema antilink de grupos:", error);
      }
    };
 

    const botStateFile = __dirname + '/../database/botState.json';
    if (botState.status === 'off' && !isOwner) return;
    if (botState.viewMessages) nazu.readMessages([info.key]);

    try {
      if(budy2 && budy2.length > 1) {
      const timestamp = new Date().toLocaleTimeString('pt-BR', { hour12: false });
      const messageType = isCmd ? 'COMANDO' : 'MENSAGEM';
      const context = isGroup ? 'GRUPO' : 'PRIVADO';
      const messagePreview = isCmd ? `${prefix}${command}${q ? ` ${q.substring(0, 25)}${q.length > 25 ? '...' : ''}` : ''}` : budy2.substring(0, 35) + (budy2.length > 35 ? '...' : '');
      console.log('┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓');
      console.log(`┃ ${messageType} [${context}]${' '.repeat(36 - messageType.length - context.length)}`);
      console.log('┣━━━━━━━━━━━━━━━━━━━━━━━━━━━━┫');
      console.log(`┃ 📜 Conteúdo: ${messagePreview.padEnd(28)}`);
  
      if (isGroup) {
        console.log(`┃ 👥 Grupo: ${(groupName || 'Desconhecido').padEnd(28)}`);
        console.log(`┃ 👤 Usuário: ${(pushname || 'Sem Nome').padEnd(28)}`);
      } else {
        console.log(`┃ 👤 Usuário: ${(pushname || 'Sem Nome').padEnd(28)}`);
        console.log(`┃ 📱 Número: ${sender.split('@')[0].padEnd(28)}`);
      }
      console.log('┣━━━━━━━━━━━━━━━━━━━━━━━━━━━━┫');
      console.log(`┃ 🕒 Data/Hora: ${timestamp.padEnd(27)}`);
      console.log('┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛\n');
      };
   } catch (error) {
     console.error('┃ 🚨 Erro ao gerar logs:', error, '');
   };


    if (isGroup) {
      try {
        if (tictactoe.hasPendingInvitation(from) && budy2) {
          const normalizedResponse = budy2.toLowerCase().trim();
          const result = tictactoe.processInvitationResponse(from, sender, normalizedResponse);
          if (result.success) {
            await nazu.sendMessage(from, { text: result.message, mentions: result.mentions || [] });
          }
        };
        
        if (tictactoe.hasActiveGame(from) && budy2) {
          if (['tttend', 'rv', 'fimjogo'].includes(budy2)) {
            if (!isGroupAdmin) {
              await reply("✋ Somente os administradores do grupo podem encerrar um jogo da velha em andamento! 😊");
              return;
            };
            const result = tictactoe.endGame(from);
            await reply(result.message);
            return;
          };
          const position = parseInt(budy2.trim());
          if (!isNaN(position)) {
            const result = tictactoe.makeMove(from, sender, position);          
            if (result.success) {
              await nazu.sendMessage(from, { text: result.message, mentions: result.mentions || [sender] });
            } else if (result.message) {
              await reply(result.message);
            };
          };
          return;
        };
      } catch (error) {
        console.error("Erro no sistema de jogo da velha:", error);
      };
    };


    if (isGroup && groupData.blockedUsers && (groupData.blockedUsers[sender] || groupData.blockedUsers[sender.split('@')[0]]) && isCmd) {
      return reply(`🚫 Oops! Parece que você não pode usar comandos neste grupo.\nMotivo: ${groupData.blockedUsers[sender] ? groupData.blockedUsers[sender].reason : groupData.blockedUsers[sender.split('@')[0]].reason}`);
    };

    if (globalBlocks.users && (globalBlocks.users[sender.split('@')[0]] || globalBlocks.users[sender]) && isCmd) {
      return reply(`🚫 Parece que você está bloqueado de usar meus comandos globalmente.\nMotivo: ${globalBlocks.users[sender] ? globalBlocks.users[sender].reason : globalBlocks.users[sender.split('@')[0]].reason}`);
    };
    
    if (isCmd && globalBlocks.commands && globalBlocks.commands[command]) {
      return reply(`🚫 O comando *${command}* está temporariamente desativado globalmente.\nMotivo: ${globalBlocks.commands[command].reason}`);
    };


    if (isCmd && commandStats && commandStats.trackCommandUsage && command && command.length>0) {
      commandStats.trackCommandUsage(command, sender);
    };
 
 
    if(budy2.match(/^(\d+)d(\d+)$/))reply(+budy2.match(/^(\d+)d(\d+)$/)[1]>50||+budy2.match(/^(\d+)d(\d+)$/)[2]>100?"❌ Limite: max 50 dados e 100 lados":"🎲 Rolando "+budy2.match(/^(\d+)d(\d+)$/)[1]+"d"+budy2.match(/^(\d+)d(\d+)$/)[2]+"...\n🎯 Resultados: "+(r=[...Array(+budy2.match(/^(\d+)d(\d+)$/)[1])].map(_=>1+Math.floor(Math.random()*+budy2.match(/^(\d+)d(\d+)$/)[2]))).join(", ")+"\n📊 Total: "+r.reduce((a,b)=>a+b,0));

if ((!info.key.fromMe && isAssistente && !isCmd) && ((budy2.includes('@' + nazu.user.id.split(':')[0])) || (menc_os2 && menc_os2 == (nazu.user.id.split(':')[0]+'@s.whatsapp.net')))) {
  if (budy2.replaceAll('@' + nazu.user.id.split(':')[0], '').length > 2) {
    const jSoNzIn = {
      texto: budy2.replaceAll('@' + nazu.user.id.split(':')[0], '').trim(),
      id_enviou: sender,
      nome_enviou: pushname,
      id_grupo: isGroup ? from : false,
      nome_grupo: isGroup ? groupName: false,
      tem_midia: isMedia,
      marcou_mensagem: false,
      marcou_sua_mensagem: false,
      mensagem_marcada: false,
      id_enviou_marcada: false,
      tem_midia_marcada: false,
      id_mensagem: info.key.id,
      data_atual: new Date().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' }),
      data_mensagem: new Date(info.messageTimestamp*1000).toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })
    };
    let { participant, quotedMessage } = info.message?.extendedTextMessage?.contextInfo || {};
    let jsonO = { participant, quotedMessage, texto: quotedMessage?.conversation || quotedMessage?.extendedTextMessage?.text || quotedMessage?.imageMessage?.caption || quotedMessage?.videoMessage?.caption || quotedMessage?.documentMessage?.caption || "" };
    if (jsonO && jsonO.participant && jsonO.texto && jsonO.texto.length > 0) {
      jSoNzIn.marcou_mensagem = true;
      jSoNzIn.mensagem_marcada = jsonO.texto;
      jSoNzIn.id_enviou_marcada = jsonO.participant;
      jSoNzIn.marcou_sua_mensagem = (jsonO.participant == (nazu.user.id.split(':')[0]+'@s.whatsapp.net'));
    };
    const respAssist = await ia.makeAssistentRequest({mensagens: [jSoNzIn]}, pathz.join(__dirname, 'index.js'));
    if(respAssist.resp && respAssist.resp.length > 0) {
      for(msgza of respAssist.resp) {
        if(msgza.react) await nazu.react(msgza.react.replaceAll(' ', '').replaceAll('\n', ''));
        if(msgza.resp && msgza.resp.length > 0) await reply(msgza.resp);
        if(msgza.actions) {
          if(msgza.actions.comando) var command = msgza.actions.comando;
          if(msgza.actions.params) {
            if(Array.isArray(msgza.actions.params)) {
            var q = msgza.actions.params.join(' ');
            } else if(msgza.actions.params.length > 0) {
            var q = msgza.actions.params;
            };
          };
        };
      };
    };
  };
};
    
  
  //ANTI FLOOD DE MENSAGENS
   if (isGroup && groupData.messageLimit?.enabled && !isGroupAdmin && !isOwnerOrSub && !info.key.fromMe) {
  try {
    groupData.messageLimit.warnings = groupData.messageLimit.warnings || {};
    groupData.messageLimit.users = groupData.messageLimit.users || {};

    const now = Date.now();
    const userData = groupData.messageLimit.users[sender] || { count: 0, lastReset: now };

    if (now - userData.lastReset >= groupData.messageLimit.interval * 1000) {
      userData.count = 0;
      userData.lastReset = now;
    };

    userData.count++;
    groupData.messageLimit.users[sender] = userData;

    if (userData.count > groupData.messageLimit.limit) {
      if (groupData.messageLimit.action === 'ban' && isBotAdmin) {
        await nazu.groupParticipantsUpdate(from, [sender], 'remove');
        await reply(`🚨 @${sender.split('@')[0]} foi banido por exceder o limite de ${groupData.messageLimit.limit} mensagens em ${groupData.messageLimit.interval}s!`, { mentions: [sender] });
        delete groupData.messageLimit.users[sender];
      } else if (groupData.messageLimit.action === 'adv') {
        groupData.messageLimit.warnings[sender] = (groupData.messageLimit.warnings[sender] || 0) + 1;
        const warnings = groupData.messageLimit.warnings[sender];

        if (warnings >= 3 && isBotAdmin) {
          await nazu.groupParticipantsUpdate(from, [sender], 'remove');
          await reply(`🚨 @${sender.split('@')[0]} foi banido por exceder o limite de mensagens (${groupData.messageLimit.limit} em ${groupData.messageLimit.interval}s) 3 vezes!`, { mentions: [sender] });
          delete groupData.messageLimit.warnings[sender];
          delete groupData.messageLimit.users[sender];
        } else {
          await reply(`⚠️ @${sender.split('@')[0]}, você excedeu o limite de ${groupData.messageLimit.limit} mensagens em ${groupData.messageLimit.interval}s! Advertência ${warnings}/3.`, { mentions: [sender] });
        }
      }
    }

    fs.writeFileSync(groupFile, JSON.stringify(groupData, null, 2));
  } catch (e) {
    console.error("Erro no sistema de limite de mensagens:", e);
  }
}
  
  //SISTEMA DE PARCERIA
  if (isGroup && parceriasData.active && !isGroupAdmin && body.includes('chat.whatsapp.com') && !info.key.fromMe) {
  if (parceriasData.partners[sender]) {
    const partnerData = parceriasData.partners[sender];
    if (partnerData.count < partnerData.limit) {
      partnerData.count++;
      saveParceriasData(from, parceriasData);
    } else {
      await nazu.sendMessage(from, { delete: info.key });
      await reply(`@${sender.split('@')[0]}, você atingiu o limite de ${partnerData.limit} links de grupos.`, { mentions: [sender] });
    }
  } else {
    await nazu.sendMessage(from, { delete: info.key });
    await reply(`@${sender.split('@')[0]}, você não é um parceiro e não pode enviar links de grupos.`, { mentions: [sender] });
  };
};


//ANTI FIGURINHAS
if (isGroup && groupData.antifig && groupData.antifig.enabled && type === "stickerMessage" && !isGroupAdmin && !info.key.fromMe) {
  try {
    await nazu.sendMessage(from, { delete: { remoteJid: from, fromMe: false, id: info.key.id, participant: sender } });
    groupData.warnings = groupData.warnings || {};
    groupData.warnings[sender] = groupData.warnings[sender] || { count: 0, lastWarned: null };
    groupData.warnings[sender].count += 1;
    groupData.warnings[sender].lastWarned = new Date().toISOString();
    
    const warnCount = groupData.warnings[sender].count;
    const warnLimit = groupData.antifig.warnLimit || 3;
    
    let warnMessage = `🚫 @${sender.split('@')[0]}, figurinhas não são permitidas neste grupo! Advertência ${warnCount}/${warnLimit}.`;
    if (warnCount >= warnLimit && isBotAdmin) {
      warnMessage += `\n⚠️ Você atingiu o limite de advertências e será removido.`;
      await nazu.groupParticipantsUpdate(from, [sender], 'remove');
      delete groupData.warnings[sender];
    }
    
    await nazu.sendMessage(from, {text: warnMessage, mentions: [sender] });
    fs.writeFileSync(groupFile, JSON.stringify(groupData, null, 2));
  } catch (error) {
    console.error("Erro no sistema antifig:", error);
    await reply(`⚠️ Erro ao processar antifig para @${sender.split('@')[0]}. Admins, por favor, verifiquem!`, { mentions: [sender] });
  }
}

  switch(command) {
  
  
  
  
  //ALTERADORES
  
  case 'speedup':
  case 'boyvoice':
  case 'vozmenino':
  case 'womenvoice':
  case 'vozmulher':
  case 'manvoice':
  case 'vozhomem':
  case 'childvoice':
  case 'vozcrianca':
  case 'vozeco':
  case 'eco':
  case 'slowvoice':
  case 'vozlenta':
  case 'audiolento':
  case 'fastvoice':
  case 'vozrapida':
  case 'audiorapido':
  case 'cavevoice':
  case 'vozcaverna':
  case 'bass':
  case 'bass2':
  case 'bass3':
  case 'volumeboost':
  case 'aumentarvolume':
  case 'reverb':
  case 'drive':
  case 'equalizer':
  case 'equalizar':
  case 'reverse':
  case 'audioreverso':
  case 'pitch':
  case 'flanger':
  case 'grave':
  case 'vozgrave':
  case 'chorus':
  case 'phaser':
  case 'tremolo':
  case 'vibrato':
  case 'lowpass':
    try {
      if ((isMedia && !info.message.imageMessage && !info.message.videoMessage) || isQuotedAudio) {
        const audioEffects = { speedup: 'atempo=1.06,asetrate=44100*1.25', boyvoice: 'atempo=1.06,asetrate=44100*1.25', vozmenino: 'atempo=1.06,asetrate=44100*1.25', womenvoice: 'asetrate=44100*1.25,atempo=0.8', vozmulher: 'asetrate=44100*1.25,atempo=0.8', manvoice: 'asetrate=44100*0.8,atempo=1.2', vozhomem: 'asetrate=44100*0.8,atempo=1.2', childvoice: 'asetrate=44100*1.4,atempo=0.9', vozcrianca: 'asetrate=44100*1.4,atempo=0.9', vozeco: 'aecho=0.8:0.88:60:0.4', eco: 'aecho=0.8:0.88:60:0.4', slowvoice: 'atempo=0.6', vozlenta: 'atempo=0.6', audiolento: 'atempo=0.6', fastvoice: 'atempo=1.5', vozrapida: 'atempo=1.5', audiorapido: 'atempo=1.5', cavevoice: 'aecho=0.6:0.3:1000:0.5', vozcaverna: 'aecho=0.6:0.3:1000:0.5', bass: 'bass=g=5', bass2: 'bass=g=10', bass3: 'bass=g=15', volumeboost: 'volume=1.5', aumentarvolume: 'volume=1.5', reverb: 'aecho=0.8:0.88:60:0.4', drive: 'afftdn=nf=-25', equalizer: 'equalizer=f=100:width_type=h:width=200:g=3,equalizer=f=1000:width_type=h:width=200:g=-1,equalizer=f=10000:width_type=h:width=200:g=4', equalizar: 'equalizer=f=100:width_type=h:width=200:g=3,equalizer=f=1000:width_type=h:width=200:g=-1,equalizer=f=10000:width_type=h:width=200:g=4', reverse: 'areverse', audioreverso: 'areverse', pitch: 'asetrate=44100*0.8', flanger: 'flanger', grave: 'atempo=0.9,asetrate=44100', vozgrave: 'atempo=0.9,asetrate=44100', chorus: 'chorus=0.7:0.9:55:0.4:0.25:2', phaser: 'aphaser=type=t:decay=0.4', tremolo: 'tremolo=f=6:d=0.8', vibrato: 'vibrato=f=6', lowpass: 'lowpass=f=500' };
        const muk = isQuotedAudio ? info.message.extendedTextMessage.contextInfo.quotedMessage.audioMessage : info.message.audioMessage;
        await reply('Aguarde um momentinho... ☀️');
        const rane = __dirname+`/../database/tmp/${Math.random()}.mp3`;
        const buffimg = await getFileBuffer(muk, 'audio');
        fs.writeFileSync(rane, buffimg);
        const gem = rane;
        const ran = __dirname+`/../database/tmp/${Math.random()}.mp3`;

        const effect = audioEffects[command];
        exec(`ffmpeg -i ${gem} -filter:a "${effect}" ${ran}`, async (err, stderr, stdout) => {
          await fs.unlinkSync(gem);
          if (err) { console.error(`FFMPEG Error (Audio Effect ${command}):`, err); return reply(`🐝 Oops! Tive um probleminha ao aplicar o efeito *${command}* no seu áudio. Tente novamente, por favorzinho! 🥺`); }
          const hah = fs.readFileSync(ran);
          await nazu.sendMessage(from, { audio: hah, mimetype: 'audio/mpeg' }, { quoted: info });
          await fs.unlinkSync(ran);
        });
      } else {
        reply("🎶 Para usar este efeito, por favor, responda (marque) a mensagem de áudio que você quer modificar! 😊");
      }
    } catch (e) {
    console.error(e);
    await reply("🐝 Oh não! Aconteceu um errinho inesperado aqui. Tente de novo daqui a pouquinho, por favor! 🥺");
  };
  break

  case 'videorapido':
  case 'fastvid':
  case 'videoslow':
  case 'slowvid':
  case 'reversevid':
  case 'videolento':
  case 'videoreverso':
  case 'videoloop':
  case 'videomudo':
  case 'videobw':
  case 'pretoebranco':
  case 'tomp3':
  case 'sepia':
  case 'espelhar':
  case 'rotacionar':
  case 'mirror':
  case 'rotate':
    try {
      if ((isMedia && info.message.videoMessage) || isQuotedVideo) {
        const encmedia = isQuotedVideo ? info.message.extendedTextMessage.contextInfo.quotedMessage.videoMessage : info.message.videoMessage;
        await reply('Aguarde um momentinho... ☀️');
        const videoEffects = { videorapido: '[0:v]setpts=0.5*PTS[v];[0:a]atempo=2[a]', fastvid: '[0:v]setpts=0.5*PTS[v];[0:a]atempo=2[a]', videoslow: '[0:v]setpts=2*PTS[v];[0:a]atempo=0.5[a]', videolento: '[0:v]setpts=2*PTS[v];[0:a]atempo=0.5[a]', videoreverso: 'reverse,areverse', reversevid: 'reverse,areverse', videoloop: 'loop=2',videomudo: 'an', videobw: 'hue=s=0', pretoebranco: 'hue=s=0', tomp3: 'q:a=0 -map a', sepia: 'colorchannelmixer=.393:.769:.189:.349:.686:.168:.272:.534:.131', mirror: 'hflip', espelhar: 'hflip', rotacionar: 'rotate=90*PI/180', rotate: 'rotate=90*PI/180' };
        const rane = __dirname+`/../database/tmp/${Math.random()}.mp4`
        const buffimg = await getFileBuffer(encmedia, 'video');
        fs.writeFileSync(rane, buffimg);
        const media = rane;
        const outputExt = command === 'tomp3' ? '.mp3' : '.mp4';
        const ran = __dirname+`/../database/tmp/${Math.random()}${outputExt}`

        let ffmpegCmd;
        if (command === 'tomp3') {
          ffmpegCmd = `ffmpeg -i ${media} -q:a 0 -map a ${ran}`;
        } else if (command === 'videoloop') {
          ffmpegCmd = `ffmpeg -stream_loop 2 -i ${media} -c copy ${ran}`;
        } else if (command === 'videomudo') {
          ffmpegCmd = `ffmpeg -i ${media} -an ${ran}`;
        } else {
          const effect = videoEffects[command];
          if (['sepia', 'espelhar', 'rotacionar', 'zoom', 'glitch', 'videobw', 'pretoebranco'].includes(command)) {
            ffmpegCmd = `ffmpeg -i ${media} -vf "${effect}" ${ran}`;
          } else {
            ffmpegCmd = `ffmpeg -i ${media} -filter_complex "${effect}" -map "[v]" -map "[a]" ${ran}`;
          }
        }

        exec(ffmpegCmd, async (err) => {
          await fs.unlinkSync(media);
          if (err) { console.error(`FFMPEG Error (Video Effect ${command}):`, err); return reply(`🎬 Oops! Algo deu errado ao aplicar o efeito *${command}* no seu vídeo. Poderia tentar de novo? 🥺`); }
          const buffer453 = fs.readFileSync(ran);
          const messageType = command === 'tomp3' ? { audio: buffer453, mimetype: 'audio/mpeg' } : { video: buffer453, mimetype: 'video/mp4' };
          await nazu.sendMessage(from, messageType, { quoted: info });
          await fs.unlinkSync(ran);
        });
      } else {
        reply(command === 'tomp3' ? "🎬 Para converter para áudio, por favor, responda (marque) a mensagem de vídeo! 😊" : "🎬 Para usar este efeito, por favor, responda (marque) a mensagem de vídeo que você quer modificar! 😊");
      };
    } catch (e) {
      console.error(e);
      await reply("🐝 Oh não! Aconteceu um errinho inesperado aqui. Tente de novo daqui a pouquinho, por favor! 🥺");
  };
  break;
  
  
  
  
  //INTELIGENCIA ARTIFICIAL
  
  case 'nazu': case 'nazuna': case 'ai': 
    if (!q) return reply(`🤔 O que você gostaria de me perguntar ou pedir? É só digitar depois do comando ${prefix}${command}! 😊 Ex: ${prefix}${command} qual a previsão do tempo?`);
    try {
      const bahz = await ia.makeCognimaRequest('nazuninha', q, `nazuninha_${sender.split('@')[0]}`);
      await reply(`${bahz.reply}`);
    } catch (e) {
      console.error("Erro na API Nazuninha:", e);
      await reply("🌸 Awnn... Minha conexão mental falhou por um instante! 🧠⚡️ Poderia repetir sua pergunta, por favorzinho? 🥺");
    }
  break;
  
  case 'gpt': case 'gpt4': case 'chatgpt':
    if (!q) return reply(`🤔 Qual pergunta você quer fazer para o GPT? Digite depois do comando ${prefix}${command}! 😊 Ex: ${prefix}${command} me explique sobre buracos negros.`);
    try {      
      await reply('Aguarde um momentinho... ☀️');
      const bahz = await ia.makeCognimaRequest('gpt', q, `gpt_${sender.split('@')[0]}`);
      await reply(`${bahz.reply}`);
    } catch (e) {
      console.error("Erro na API GPT:", e);
      await reply("Puxa! 🥺 Parece que o GPT está tirando uma sonequinha... Tente novamente em instantes, tá? 💔");
    }
  break;
  
  case 'gemma': case 'gemma2': case 'gecko':
    if (!q) return reply(`🤔 Qual sua pergunta para o Gemma? Digite depois do comando ${prefix}${command}! 😊 Ex: ${prefix}${command} quem descobriu o Brasil?`);
    try {
      await reply('Aguarde um momentinho... ☀️');
      const bahz = await ia.makeCognimaRequest('gemma', q, `gemma_${sender.split('@')[0]}`);
      await reply(`${bahz.reply}`);
    } catch (e) {
      console.error("Erro na API Gemma:", e);
      await reply("Ah, que pena! 🥺 O Gemma parece estar brilhando em outro lugar agora... Tente chamá-lo de novo daqui a pouquinho, tá? 💔");
    }
  break;
  
  case 'resumir':
    if (!q) return reply(`📝 Quer que eu faça um resuminho? Me envie o texto logo após o comando ${prefix}resumir! 😊`);
    try {
      await reply('Aguarde um momentinho... ☀️');
      const prompt = `Resuma o seguinte texto em poucos parágrafos, de forma clara, mantendo as informações mais importantes:\n\n${q}`;
      const bahz = await ia.makeCognimaRequest('cognimai', prompt, `resumo_${sender.split('@')[0]}`);
      await reply(`${bahz.reply}`);
    } catch (e) {
      console.error("Erro ao resumir texto:", e);
      await reply("Puxa vida! 🥺 Tive um probleminha para fazer o resumo... Poderia tentar de novo? 💔");
    }
  break;
  
  case 'tradutor': case 'translator':
    if (!q) return reply(`🌍 Quer traduzir algo? Me diga o idioma e o texto assim: ${prefix}${command} idioma | texto
Exemplo: ${prefix}tradutor inglês | Bom dia! 😊`);
    try {
      await reply('Aguarde um momentinho... ☀️');
      const partes = q.split('|');
      if (partes.length < 2) {
        return reply(`Formato incorreto! 😅 Use: ${prefix}tradutor idioma | texto
Exemplo: ${prefix}tradutor espanhol | Olá mundo! ✨`);
      }
      const idioma = partes[0].trim();
      const texto = partes.slice(1).join('|').trim();
      const prompt = `Traduza o seguinte texto para ${idioma}:\n\n${texto}\n\nForneça apenas a tradução, sem explicações adicionais.`;
      const bahz = await ia.makeCognimaRequest('cognimai', prompt, `tradutor_${sender.split('@')[0]}`);
      await reply(`🌐✨ *Prontinho! Sua tradução para ${idioma.toUpperCase()} está aqui:*\n\n${bahz.reply}`);
    } catch (e) {
      console.error("Erro ao traduzir texto:", e);
      await reply("Awnn... 🥺 Não consegui fazer a tradução agora... Poderia tentar de novo, por favorzinho? 💔");
    }
  break;
  
   case 'qrcode':
    if (!q) return reply(`📲 Quer gerar um QR Code? Me envie o texto ou link depois do comando ${prefix}qrcode! 😊`);
    try {
      await reply('Aguarde um momentinho... ☀️');
      const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=500x500&data=${encodeURIComponent(q)}`;
      await nazu.sendMessage(from, { image: { url: qrUrl }, caption: `📱✨ *Seu QR Code super fofo está pronto!*\n\nConteúdo: ${q.substring(0, 100)}${q.length > 100 ? '...' : ''}`}, { quoted: info });
    } catch (e) {
      console.error("Erro ao gerar QR Code:", e);
      await reply("Oh céus! 🥺 Tive um probleminha para gerar seu QR Code... Poderia tentar de novo? 💔");
    }
    break;
  
  case 'wikipedia':
    if (!q) return reply(`📚 O que você quer pesquisar na Wikipédia? Me diga o termo após o comando ${prefix}wikipedia! 😊`);
    reply("📚 Consultando a Wikipédia... Só um instante! ⏳");
    try {
      let found = false;
      try {
        const respPT = await axios.get(`https://pt.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(q)}`);
        if (respPT.data && respPT.data.extract) {
          const { title, extract, content_urls, thumbnail } = respPT.data;
          const link = content_urls?.desktop?.page || '';
          const thumbUrl = thumbnail?.source || '';
          let mensagem = `📖✨ *Encontrei isso na Wikipédia (PT):*\n\n*${title || q}*\n\n${extract}\n\n`;
          if (link) mensagem += `🔗 *Saiba mais:* ${link}\n`;
          if (thumbUrl) {
            await nazu.sendMessage(from, { image: { url: thumbUrl }, caption: mensagem }, { quoted: info });
          } else {
            await reply(mensagem);
          }
          found = true;
        }
      } catch (err) {
        console.log("Busca PT falhou, tentando EN...");
      }

      if (!found) {
        try {
          const respEN = await axios.get(`https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(q)}`);
          if (respEN.data && respEN.data.extract) {
            const { title, extract, content_urls, thumbnail } = respEN.data;
            const link = content_urls?.desktop?.page || '';
            const thumbUrl = thumbnail?.source || '';
            let mensagem = `📖✨ *Encontrei isso na Wikipédia (EN):*\n\n*${title || q}*\n\n${extract}\n\n`;
            if (link) mensagem += `🔗 *Saiba mais:* ${link}\n`;
            if (thumbUrl) {
              await nazu.sendMessage(from, { image: { url: thumbUrl }, caption: mensagem }, { quoted: info });
            } else {
              await reply(mensagem);
            }
            found = true;
          }
        } catch (err) {
          console.log("Busca EN também falhou.");
        }
      }

      if (!found) {
        await reply("Awnn... 🥺 Não consegui encontrar nada sobre isso na Wikipédia... Tente uma palavra diferente, talvez? 💔");
      }

    } catch (e) {
      console.error("Erro ao buscar na Wikipédia:", e);
      await reply("📚 Oops! Tive um probleminha para acessar a Wikipédia agora... 😥 Tente de novo daqui a pouco, por favor! ✨");
    }
  break;
  
  case 'dicionario': case 'dictionary':
    if (!q) return reply(`📔 Qual palavra você quer procurar no dicionário? Me diga após o comando ${prefix}${command}! 😊`);
    reply("📔 Procurando no dicionário... Aguarde um pouquinho! ⏳");
    try {
      const palavra = q.trim().toLowerCase();
      let definicaoEncontrada = false;
      try {
        const resp = await axios.get(`https://significado.herokuapp.com/${encodeURIComponent(palavra)}`);
        if (resp.data && resp.data.length > 0 && resp.data[0].meanings) {
          const significados = resp.data[0];
          let mensagem = `📘✨ *Significado de "${palavra.toUpperCase()}":*\n\n`;
          if (significados.class) {
            mensagem += `*Classe:* ${significados.class}\n\n`;
          }
          if (significados.meanings && significados.meanings.length > 0) {
            mensagem += `*Significados:*\n`;
            significados.meanings.forEach((significado, index) => {
              mensagem += `${index + 1}. ${significado}\n`;
            });
            mensagem += '\n';
          }
          if (significados.etymology) {
            mensagem += `*Etimologia:* ${significados.etymology}\n\n`;
          }
          await reply(mensagem);
          definicaoEncontrada = true;
        }
      } catch (apiError) {
        console.log("API primária do dicionário falhou, tentando IA...");
      }
      if (!definicaoEncontrada) {
        const prompt = `Defina a palavra "${palavra}" em português de forma completa e fofa. Inclua a classe gramatical, os principais significados e um exemplo de uso em uma frase curta e bonitinha.`;
        const bahz = await ia.makeCognimaRequest('cognimai', prompt, `dicionario_${sender.split('@')[0]}`);
        await reply(`${bahz.reply}`);
        definicaoEncontrada = true;
      }

    } catch (e) {
      console.error("Erro geral ao buscar no dicionário:", e);
      await reply("Awnn... 🥺 Tive um probleminha para encontrar essa palavra... Poderia tentar de novo? 💔");
    }
    break;

  case 'updates': try {
    if (!isOwner || (isOwner && isSubOwner)) return reply("🚫 Apenas o Dono principal pode utilizar esse comando!");
    if (!fs.existsSync(pathz.join(__dirname, '..', 'database', 'updateSave.json'))) return reply('❌ Sua versão não tem suporte a esse sistema ainda.');
    const AtualCom = await axios.get('https://api.github.com/repos/hiudyy/nazuna/commits?per_page=1',{headers:{Accept:'application/vnd.github+json'}}).then(r=>r.headers.link?.match(/page=(\d+)>;\s*rel="last"/)?.[1]);
    const { total } = JSON.parse(fs.readFileSync(pathz.join(__dirname, '..', 'database', 'updateSave.json'), 'utf-8'));
    if(AtualCom > total) {
      const TextZin = await VerifyUpdate('hiudyy/nazuna', AtualCom - total);
      await reply(TextZin);
    } else {
      await reply('Você ja esta utilizando a versão mais recente da bot.');
    };
  } catch(e) {
    console.error(e);
  };
  break
  
  case 'addsubdono':
    if (!isOwner || (isOwner && isSubOwner)) return reply("🚫 Apenas o Dono principal pode adicionar subdonos!");
    try {
      const targetUserJid = menc_jid2 && menc_jid2.length > 0 ? menc_jid2[0] : (q.includes('@') ? q.split(' ')[0].replace('@', '') + '@s.whatsapp.net' : null);
      if (!targetUserJid) {
        return reply("🤔 Você precisa marcar o usuário ou fornecer o número completo (ex: 5511999998888) para adicionar como subdono.");
      }
      const normalizedJid = targetUserJid.includes('@') ? targetUserJid : targetUserJid.replace(/\D/g, '') + '@s.whatsapp.net';
      const result = addSubdono(normalizedJid, numerodono);
      await reply(result.message);
    } catch (e) {
      console.error("Erro ao adicionar subdono:", e);
      await reply("❌ Ocorreu um erro inesperado ao tentar adicionar o subdono.");
    }
    break;

  case 'remsubdono': case 'rmsubdono':
    if (!isOwner || (isOwner && isSubOwner)) return reply("🚫 Apenas o Dono principal pode remover subdonos!");
    try {
      const targetUserJid = menc_jid2 && menc_jid2.length > 0 ? menc_jid2[0] : (q.includes('@') ? q.split(' ')[0].replace('@', '') + '@s.whatsapp.net' : null);
      if (!targetUserJid) {
        return reply("🤔 Você precisa marcar o usuário ou fornecer o número completo (ex: 5511999998888) para remover como subdono.");
      }
      const normalizedJid = targetUserJid.includes('@') ? targetUserJid : targetUserJid.replace(/\D/g, '') + '@s.whatsapp.net';
      const result = removeSubdono(normalizedJid);
      await reply(result.message);
    } catch (e) {
      console.error("Erro ao remover subdono:", e);
      await reply("❌ Ocorreu um erro inesperado ao tentar remover o subdono.");
    }
    break;

  case 'listasubdonos': case 'listsubdonos':
    if (!isOwnerOrSub) return reply("🚫 Apenas o Dono e Subdonos podem ver a lista!");
    try {
      const subdonos = getSubdonos();
      if (subdonos.length === 0) {
        return reply("✨ Nenhum subdono cadastrado no momento.");
      }
      let listaMsg = "👑 *Lista de Subdonos Atuais:*\n\n";
      const mentions = [];
      let participantsInfo = {};
      if (isGroup && groupMetadata.participants) {
          groupMetadata.participants.forEach(p => {
              participantsInfo[p.id] = p.pushname || p.id.split('@')[0];
          });
      }
      subdonos.forEach((jid, index) => {
          const nameOrNumber = participantsInfo[jid] || jid.split('@')[0];
          listaMsg += `${index + 1}. @${jid.split('@')[0]} (${nameOrNumber})\n`;
          mentions.push(jid);
      });
      await reply(listaMsg.trim(), { mentions });
    } catch (e) {
      console.error("Erro ao listar subdonos:", e);
      await reply("❌ Ocorreu um erro inesperado ao tentar listar os subdonos.");
    }
    break;
  
  case 'viewmsg':
  try {
    if (!isOwner) return reply('🚫 Este comando é apenas para o dono do bot!');
    if (!q) return reply(`Por favor, use: ${prefix}viewmsg [on/off]`);
    const botStateFile = DATABASE_DIR + '/botState.json';
    let botState = loadJsonFile(botStateFile, { status: 'on', viewMessages: true });
    
    if (q.toLowerCase() === 'on') {
      botState.viewMessages = true;
      fs.writeFileSync(botStateFile, JSON.stringify(botState, null, 2));
      await reply('✅ Visualização de mensagens ativada!');
    } else if (q.toLowerCase() === 'off') {
      botState.viewMessages = false;
      fs.writeFileSync(botStateFile, JSON.stringify(botState, null, 2));
      await reply('✅ Visualização de mensagens desativada!');
    } else {
      return reply('🤔 Use "on" para ativar ou "off" para desativar.');
    }
  } catch (e) {
    console.error('Erro no comando viewmsg:', e);
    await reply('😥 Ocorreu um erro ao alterar a visualização de mensagens.');
  }
  break;

  case 'modoaluguel':
    if (!isOwner || (isOwner && isSubOwner)) return reply("🚫 Apenas o Dono principal pode gerenciar o modo de aluguel!");
    try {
      const action = q.toLowerCase().trim();
      if (action === 'on' || action === 'ativar') {
        if (setRentalMode(true)) {
          await reply("✅ Modo de aluguel global ATIVADO! O bot agora só responderá em grupos com aluguel ativo.");
        } else {
          await reply("❌ Erro ao ativar o modo de aluguel global.");
        }
      } else if (action === 'off' || action === 'desativar') {
        if (setRentalMode(false)) {
          await reply("✅ Modo de aluguel global DESATIVADO! O bot responderá em todos os grupos permitidos.");
        } else {
          await reply("❌ Erro ao desativar o modo de aluguel global.");
        }
      } else {
        const currentStatus = isRentalModeActive() ? 'ATIVADO' : 'DESATIVADO';
        await reply(`🤔 Uso: ${prefix}modoaluguel on|off\nStatus atual: ${currentStatus}`);
      }
    } catch (e) {
      console.error("Erro no comando modoaluguel:", e);
      await reply("❌ Ocorreu um erro inesperado.");
    }
    break;

  case 'listaralugueis':
case 'aluguelist':
case 'listaluguel':
case 'listaaluguel':
  try {
    if (!isOwner) return reply('🚫 Este comando é apenas para o dono do bot!');

    const rentalData = loadRentalData();
    const globalMode = rentalData.globalMode ? '🟢 Ativo' : '🔴 Desativado';
    const groupRentals = rentalData.groups || {};
    const groupCount = Object.keys(groupRentals).length;

    const filtro = args[0]?.toLowerCase();

    let message = `╭───「 *Lista de Aluguéis* 」───╮\n│ 🌍 *Modo Aluguel Global*: ${globalMode}\n│ 📊 *Total de Grupos*: ${groupCount}\n╰────────────────╯\n`;

    if (groupCount === 0) {
      message += '📪 Nenhum grupo com aluguel registrado.';
    } else {
      message += '📋 *Grupos com Aluguel*:\n\n';
      let index = 1;
      for (const [groupId, info] of Object.entries(groupRentals)) {
        const groupMetadata = await nazu.groupMetadata(groupId).catch(() => ({ subject: 'Desconhecido' }));
        const groupName = groupMetadata.subject || 'Sem Nome';

        let status = 'Expirado';
        if (info.expiresAt === 'permanent') {
          status = 'Permanente';
        } else if (new Date(info.expiresAt) > new Date()) {
          status = 'Ativo';
        }

        const shouldInclude =
          !filtro ||
          (filtro === 'ven' && status === 'Expirado') ||
          (filtro === 'atv' && status === 'Ativo') ||
          (filtro === 'perm' && status === 'Permanente');

        if (!shouldInclude) continue;

        const expires = info.expiresAt === 'permanent'
          ? '∞ Permanente'
          : info.expiresAt
            ? new Date(info.expiresAt).toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })
            : 'N/A';

        message += `🔹 *${index}. ${groupName}*\n`;
        message += `  - *Status*: ${status}\n`;
        message += `  - *Expira em*: ${expires}\n\n`;
        index++;
      }

      if (index === 1) message += '📪 Nenhum grupo encontrado com esse filtro.';
    }

    await reply(message);
  } catch (e) {
    console.error('Erro no comando listaluguel:', e);
    await reply("Ocorreu um erro ao listar os aluguéis 💔");
  }
  break;
  
  case 'leveling':
  if (!isGroup) return reply("Este comando só funciona em grupos.");
  if (!isGroupAdmin) return reply("Apenas administradores podem usar este comando.");
  groupData.levelingEnabled = !groupData.levelingEnabled;
  fs.writeFileSync(groupFile, JSON.stringify(groupData, null, 2));
  await reply(`🎚️ Sistema de leveling ${groupData.levelingEnabled ? 'ativado' : 'desativado'}!`);
  break;

case 'level':
  const levelingDataLevel = loadJsonFile(LEVELING_FILE);
  const userDataLevel = levelingDataLevel.users[sender] || { level: 1, xp: 0, patent: "Iniciante", messages: 0, commands: 0 };
  const nextLevelXp = calculateNextLevelXp(userDataLevel.level);
  const xpToNextLevel = nextLevelXp - userDataLevel.xp;
  await reply(`🎚️ *Seu Nível*\n\n` + `🏅 *Nível:* ${userDataLevel.level}\n` + `🔹 *XP:* ${userDataLevel.xp} / ${nextLevelXp}\n` + `🎖️ *Patente:* ${userDataLevel.patent}\n` + `📈 *Falta para o próximo nível:* ${xpToNextLevel} XP\n`);
  break;

case 'addxp':
  if (!isOwner) return reply("Apenas o dono pode usar este comando.");
  if (!menc_os2 || !q) return reply("Marque um usuário e especifique a quantidade de XP.");
  const xpToAdd = parseInt(q);
  if (isNaN(xpToAdd)) return reply("Quantidade de XP inválida.");
  const levelingDataAdd = loadJsonFile(LEVELING_FILE);
  const userDataAdd = levelingDataAdd.users[menc_os2] || { level: 1, xp: 0, patent: "Iniciante", messages: 0, commands: 0 };
  userDataAdd.xp += xpToAdd;
  checkLevelUp(menc_os2, userDataAdd, levelingDataAdd, nazu, from);
  fs.writeFileSync(LEVELING_FILE, JSON.stringify(levelingDataAdd, null, 2));
  await reply(`✅ Adicionado ${xpToAdd} XP para @${menc_os2.split('@')[0]}`, { mentions: [menc_os2] });
  break;

case 'delxp':
  if (!isOwner) return reply("Apenas o dono pode usar este comando.");
  if (!menc_os2 || !q) return reply("Marque um usuário e especifique a quantidade de XP.");
  const xpToRemove = parseInt(q);
  if (isNaN(xpToRemove)) return reply("Quantidade de XP inválida.");
  const levelingDataDel = loadJsonFile(LEVELING_FILE);
  const userDataDel = levelingDataDel.users[menc_os2] || { level: 1, xp: 0, patent: "Iniciante", messages: 0, commands: 0 };
  userDataDel.xp = Math.max(0, userDataDel.xp - xpToRemove);
  checkLevelDown(menc_os2, userDataDel, levelingDataDel);
  fs.writeFileSync(LEVELING_FILE, JSON.stringify(levelingDataDel, null, 2));
  await reply(`✅ Removido ${xpToRemove} XP de @${menc_os2.split('@')[0]}`, { mentions: [menc_os2] });
  break;

case 'ranklevel':
  const levelingDataRank = loadJsonFile(LEVELING_FILE);
  const sortedUsers = Object.entries(levelingDataRank.users)
    .sort((a, b) => b[1].level - a[1].level || b[1].xp - a[1].xp)
    .slice(0, 10);
  let rankMessage = '🏆 *Ranking Global de Níveis*\n\n';
  sortedUsers.forEach(([userId, data], index) => {
    rankMessage += `${index + 1}. @${userId.split('@')[0]} - Nível ${data.level} (XP: ${data.xp})\n`;
  });
  await reply(rankMessage, { mentions: sortedUsers.map(([userId]) => userId) });
  break;
  
  case 'addaluguel':
    if (!isOwner) return reply("🚫 Apenas o Dono principal pode adicionar aluguel!");
    if (!isGroup) return reply("Este comando só pode ser usado em grupos.");
    try {
      const parts = q.toLowerCase().trim().split(' ');
      const durationArg = parts[0];
      let durationDays = null;

      if (durationArg === 'permanente') {
        durationDays = 'permanent';
      } else if (!isNaN(parseInt(durationArg)) && parseInt(durationArg) > 0) {
        durationDays = parseInt(durationArg);
      } else {
        return reply(`🤔 Duração inválida. Use um número de dias (ex: 30) ou a palavra "permanente".\nExemplo: ${prefix}addaluguel 30`);
      }

      const result = setGroupRental(from, durationDays);
      await reply(result.message);

    } catch (e) {
      console.error("Erro no comando addaluguel:", e);
      await reply("❌ Ocorreu um erro inesperado ao adicionar o aluguel.");
    }
    break;

  case 'gerarcodigo':
    if (!isOwner) return reply("🚫 Apenas o Dono principal pode gerar códigos!");
    try {
      const parts = q.trim().split(' ');
      const durationArg = parts[0]?.toLowerCase();
      const targetGroupArg = parts[1];
      let durationDays = null;
      let targetGroupId = null;
      if (!durationArg) {
          return reply(`🤔 Uso: ${prefix}gerarcodigo <dias|permanente> [id_do_grupo_opcional]`);
      }
      if (durationArg === 'permanente') {
        durationDays = 'permanent';
      } else if (!isNaN(parseInt(durationArg)) && parseInt(durationArg) > 0) {
        durationDays = parseInt(durationArg);
      } else {
        return reply('🤔 Duração inválida. Use um número de dias (ex: 7) ou a palavra "permanente".');
      }

      if (targetGroupArg) {
          if (targetGroupArg.includes('@g.us')) {
              targetGroupId = targetGroupArg;
          } else if (/^\d+$/.test(targetGroupArg)) {
              targetGroupId = targetGroupArg + '@g.us';
          } else {
              const mentionedJid = info.message?.extendedTextMessage?.contextInfo?.mentionedJid?.[0];
              if (mentionedJid && mentionedJid.endsWith('@g.us')) {
                  targetGroupId = mentionedJid;
              } else {
                  return reply('🤔 ID do grupo alvo inválido. Forneça o ID completo (numero@g.us) ou deixe em branco para um código genérico.');
              }
          }
      }
      const result = generateActivationCode(durationDays, targetGroupId);
      await reply(result.message);
    } catch (e) {
      console.error("Erro no comando gerarcodigo:", e);
      await reply("❌ Ocorreu um erro inesperado ao gerar o código.");
    }
    break;
   
  
  case 'code-gen': try {
  if(!isPremium) return reply('Apenas usuários premium.');
  if(!q) return reply("Falta digitar o prompt 🤔");
  await reply('Aguarde um momentinho... ☀️');
  const response = await axios.get(`https://api.cognima.com.br/api/ia/code-gen?key=CognimaTeamFreeKey&q=${q}`, { responseType: 'arraybuffer' });
  const mimeType = response.headers['content-type'];
  const contentDisposition = response.headers['content-disposition'];
  let nomeArquivo = Date.now();
  if (contentDisposition) {
    const match = contentDisposition.match(/filename="?([^"]+)"?/);
    if (match) nomeArquivo = match[1];
  };
  if (!nomeArquivo.includes('.')) {
    const extensoes = { 'application/json': 'json', 'text/plain': 'txt', 'application/javascript': 'js', 'application/zip': 'zip', 'application/pdf': 'pdf' };
    nomeArquivo += '.' + (extensoes[mimeType] || 'bin');
  };
  await nazu.sendMessage(from, { document: response.data, mimetype: mimeType, fileName: nomeArquivo }, { quoted: info });
  } catch(e) {
  console.error(e);
  await reply("🐝 Oh não! Aconteceu um errinho inesperado aqui. Tente de novo daqui a pouquinho, por favor! 🥺");
  };
  break
  
  case 'cog':
  try {
    if (!q) return await reply('Falta o prompt 🥱');
    const resultPriv = await ia.makeCognimaRequest('cognimai', q, `cog_${sender.split('@')[0]}`);
    if (!resultPriv.success) return reply("ocorreu um erro 💔");
    let responseText = resultPriv.reply;
    await reply(responseText);
  } catch (e) {
    console.error(e);
    await reply("🐝 Oh não! Aconteceu um errinho inesperado aqui. Tente de novo daqui a pouquinho, por favor! 🥺");
  }
  break;
  
  //FERRAMENTAS
  case 'encurtalink': case 'tinyurl': try {
  if(!q) return reply(`❌️ *Forma incorreta, use está como exemplo:* ${prefix + command} https://instagram.com/hiudyyy_`);
  anu = await axios.get(`https://tinyurl.com/api-create.php?url=${q}`);
  reply(`${anu.data}`);
  } catch(e) {
  console.error(e);
  await reply("🐝 Oh não! Aconteceu um errinho inesperado aqui. Tente de novo daqui a pouquinho, por favor! 🥺");
  };
  break

  case 'nick': case 'gerarnick': case 'nickgenerator': try {
  if(!q) return reply('Digite o nick após o comando.');
  datzn = await styleText(q);
  await reply(datzn.join('\n'));
  } catch(e) {
  console.error(e);
  await reply("🐝 Oh não! Aconteceu um errinho inesperado aqui. Tente de novo daqui a pouquinho, por favor! 🥺");
  };
  break
  
  case 'printsite': case 'ssweb': try{
  if(!q) return reply(`Cade o link?`)
  await nazu.sendMessage(from, {image: {url: `https://image.thum.io/get/fullpage/${q}`}}, {quoted: info})
  } catch(e) {
  console.error(e);
  await reply("🐝 Oh não! Aconteceu um errinho inesperado aqui. Tente de novo daqui a pouquinho, por favor! 🥺");
  };
  break
  
  case 'upload':case 'imgpralink':case 'videopralink':case 'gerarlink': try {
  if(!isQuotedImage && !isQuotedVideo && !isQuotedDocument && !isQuotedAudio) return reply(`Marque um video, uma foto, um audio ou um documento`);
  var foto1 = isQuotedImage ? info.message.extendedTextMessage.contextInfo.quotedMessage.imageMessage : {};
  var video1 = isQuotedVideo ? info.message.extendedTextMessage.contextInfo.quotedMessage.videoMessage : {};
  var docc1 = isQuotedDocument ? info.message.extendedTextMessage.contextInfo.quotedMessage.documentMessage: {};
  var audio1 = isQuotedAudio ? info.message.extendedTextMessage.contextInfo.quotedMessage.audioMessage : "";
  let media = {};
  if(isQuotedDocument) {
  media = await getFileBuffer(docc1, "document");
  } else if(isQuotedVideo) {
  media = await getFileBuffer(video1, "video");
  } else if(isQuotedImage) {
  media = await getFileBuffer(foto1, "image");
  } else if(isQuotedAudio) {
  media = await getFileBuffer(audio1, "audio");
  };
  let linkz = await upload(media);
  await reply(`${linkz}`);
  } catch(e) {
  console.error(e);
  await reply("🐝 Oh não! Aconteceu um errinho inesperado aqui. Tente de novo daqui a pouquinho, por favor! 🥺");
  }
  break

  //DOWNLOADS
  case 'assistir': try {
  if(!q) return reply('Cadê o nome do filme ou episódio de série? 🤔');
  await reply('Um momento, estou buscando as informações para você 🕵️‍♂️');
  datyz = await FilmesDL(q);
  if(!datyz || !datyz.url) return reply('Desculpe, não consegui encontrar nada. Tente com outro nome de filme ou série. 😔');
  await nazu.sendMessage(from, {image: { url: datyz.img },caption: `Aqui está o que encontrei! 🎬\n\n*Nome*: ${datyz.name}\n\nSe tudo estiver certo, você pode assistir no link abaixo:\n${datyz.url}`}, { quoted: info });
  } catch(e) {
  console.error(e);
  await reply("🐝 Oh não! Aconteceu um errinho inesperado aqui. Tente de novo daqui a pouquinho, por favor! 🥺");
  };
  break;

  case 'mcplugin':case 'mcplugins': try {
  if(!q) return reply('Cadê o nome do plugin para eu pesquisar? 🤔');
  datz = await mcPlugin(q);
  if(!datz.ok) return reply(datz.msg);
  await nazu.sendMessage(from, {image: {url: datz.image}, caption: `🔍 Encontrei esse plugin aqui:\n\n*Nome*: _${datz.name}_\n*Publicado por*: _${datz.creator}_\n*Descrição*: _${datz.desc}_\n*Link para download*: _${datz.url}_\n\n> 💖 `}, {quoted: info});
  } catch(e) {
  console.error(e);
  await reply("🐝 Oh não! Aconteceu um errinho inesperado aqui. Tente de novo daqui a pouquinho, por favor! 🥺");
  };
  break
  
  case 'shazam':
  try {
    if ((isMedia && !info.message.imageMessage && !info.message.videoMessage) || isQuotedAudio) {
      const muk = isQuotedAudio ? info.message.extendedTextMessage.contextInfo.quotedMessage.audioMessage : info.message.audioMessage;
      await reply('Aguarde um momentinho... ☀️');
      const buffi = await getFileBuffer(muk, 'audio');
      const Slakzin = await ia.Shazam(buffi);
      const videoInfo = await youtube.search(`${Slakzin.result.title} - ${Slakzin.result.artist}`);
      const views = typeof videoInfo.data.views === 'number' ? videoInfo.data.views.toLocaleString('pt-BR') : videoInfo.data.views;
      const description = videoInfo.data.description ? videoInfo.data.description.slice(0, 100) + (videoInfo.data.description.length > 100 ? '...' : '') : 'Sem descrição disponível';
      const caption = `🎵 *Música Encontrada* 🎵\n\n📌 *Título:* ${videoInfo.data.title}\n👤 *Artista/Canal:* ${videoInfo.data.author.name}\n⏱ *Duração:* ${videoInfo.data.timestamp} (${videoInfo.data.seconds} segundos)\n👀 *Visualizações:* ${views}\n📅 *Publicado:* ${videoInfo.data.ago}\n📜 *Descrição:* ${description}\n🔗 *Link:* ${videoInfo.data.url}\n\n🎧 *Baixando e processando sua música, aguarde...*`;
      await nazu.sendMessage(from, { image: { url: videoInfo.data.thumbnail }, caption: caption, footer: `${nomebot} • Versão ${botVersion}` }, { quoted: info });
      const dlRes = await youtube.mp3(videoInfo.data.url);
      if (!dlRes.ok) {
        return reply(`❌ Erro ao baixar o áudio: ${dlRes.msg}`);
      };
      try {
        await nazu.sendMessage(from, { audio: dlRes.buffer, mimetype: 'audio/mpeg' }, { quoted: info });
      } catch (audioError) {
        if (String(audioError).includes("ENOSPC") || String(audioError).includes("size")) {
          await reply('📦 Arquivo muito grande para enviar como áudio, enviando como documento...');
          await nazu.sendMessage(from, { document: dlRes.buffer, fileName: `${dlRes.filename}`, mimetype: 'audio/mpeg' }, { quoted: info });
        } else {
          throw audioError;
        };
      };
    } else {
      await reply('Use o comando marcando um audio... ☀️');
    };
  } catch(e) {
  console.error(e);
  await reply("🐝 Oh não! Aconteceu um errinho inesperado aqui. Tente de novo daqui a pouquinho, por favor! 🥺");
  };
  break
  
  case 'play':
  case 'ytmp3':
  try {
    if (!q) {
      return reply(`📝 Digite o nome da música ou um link do YouTube.\n\n📌 *Exemplo:* ${prefix + command} Back to Black`);
    }

    let videoUrl;
    let videoInfo;
    
    if (q.includes('youtube.com') || q.includes('youtu.be')) {
      videoUrl = q;
      await reply('Aguarde um momentinho... ☀️');
      const dlRes = await youtube.mp3(videoUrl);
      if (!dlRes.ok) {
        return reply(`❌ Erro ao baixar o áudio: ${dlRes.msg}`);
      };
      try {
        await nazu.sendMessage(from, { audio: dlRes.buffer, mimetype: 'audio/mpeg' }, { quoted: info });
      } catch (audioError) {
        if (String(audioError).includes("ENOSPC") || String(audioError).includes("size")) {
          await reply('📦 Arquivo muito grande para enviar como áudio, enviando como documento...');
          await nazu.sendMessage(from, { document: dlRes.buffer, fileName: `${dlRes.filename}`, mimetype: 'audio/mpeg' }, { quoted: info });
        } else {
          throw audioError;
        };
      };
      return
    } else {
      videoInfo = await youtube.search(q);
      if (!videoInfo.ok) {
        return reply(`❌ Erro na pesquisa: ${videoInfo.msg}`);
      }
      videoUrl = videoInfo.data.url;
    }

    if (!videoInfo.ok) {
      return reply(`❌ Não foi possível encontrar informações sobre o vídeo: ${videoInfo.msg}`);
    }
    
    if (videoInfo.data.seconds > 1800) {
      return reply(`⚠️ Este vídeo é muito longo (${videoInfo.data.timestamp}).\nPor favor, escolha um vídeo com menos de 30 minutos.`);
    };
    
    const views = typeof videoInfo.data.views === 'number' ? videoInfo.data.views.toLocaleString('pt-BR') : videoInfo.data.views;
    
    const description = videoInfo.data.description ? videoInfo.data.description.slice(0, 100) + (videoInfo.data.description.length > 100 ? '...' : '') : 'Sem descrição disponível';
    
    const caption = `🎵 *Música Encontrada* 🎵\n\n📌 *Título:* ${videoInfo.data.title}\n👤 *Artista/Canal:* ${videoInfo.data.author.name}\n⏱ *Duração:* ${videoInfo.data.timestamp} (${videoInfo.data.seconds} segundos)\n👀 *Visualizações:* ${views}\n📅 *Publicado:* ${videoInfo.data.ago}\n📜 *Descrição:* ${description}\n🔗 *Link:* ${videoInfo.data.url}\n\n🎧 *Baixando e processando sua música, aguarde...*`;

    await nazu.sendMessage(from, { image: { url: videoInfo.data.thumbnail }, caption: caption, footer: `${nomebot} • Versão ${botVersion}` }, { quoted: info });
    
    const dlRes = await youtube.mp3(videoUrl);
    if (!dlRes.ok) {
      return reply(`❌ Erro ao baixar o áudio: ${dlRes.msg}`);
    };
    
    try {
      await nazu.sendMessage(from, { audio: dlRes.buffer, mimetype: 'audio/mpeg' }, { quoted: info });
    } catch (audioError) {
      if (String(audioError).includes("ENOSPC") || String(audioError).includes("size")) {
        await reply('📦 Arquivo muito grande para enviar como áudio, enviando como documento...');
        await nazu.sendMessage(from, { document: dlRes.buffer, fileName: `${dlRes.filename}`, mimetype: 'audio/mpeg' }, { quoted: info });
      } else {
        throw audioError;
      };
    };

  } catch (error) {
    if (String(error).includes("age")) {
      return reply(`🔞 Este conteúdo possui restrição de idade e não pode ser baixado.`);
    }
    
    console.error('Erro no comando play/ytmp3:', error);
    reply("❌ Ocorreu um erro ao processar sua solicitação. Por favor, tente novamente mais tarde.");
  }
  break;

case 'playvid':
case 'ytmp4':
  try {
    if (!q) return reply(`Digite o nome do vídeo ou um link do YouTube.\n> Ex: ${prefix + command} Back to Black`);
    let videoUrl;
    if (q.includes('youtube.com') || q.includes('youtu.be')) {
      videoUrl = q;
      await reply('Aguarde um momentinho... ☀️');
      const dlRes = await youtube.mp4(videoUrl);
      if (!dlRes.ok) return reply(dlRes.msg);
      try {
        await nazu.sendMessage(from, { video: dlRes.buffer, fileName: `${dlRes.filename}`,  mimetype: 'video/mp4' }, { quoted: info });
    } catch (videoError) {
      if (String(videoError).includes("ENOSPC") || String(videoError).includes("size")) {
        await reply('Arquivo muito grande, enviando como documento...');
        await nazu.sendMessage(from, { document: dlRes.buffer, fileName: `${dlRes.filename}`, mimetype: 'video/mp4' }, { quoted: info });
      } else {
        throw videoError;
      }
    }
    return
    } else {
      const searchResult = await youtube.search(q);
      if (!searchResult.ok) return reply(searchResult.msg);
      videoUrl = searchResult.data.url;
    }
    const videoInfo = (await youtube.search(q));
    if (!videoInfo.ok) return reply(videoInfo.msg);
    const caption = `
🎬 *Vídeo Encontrado* 🎬

📌 *Título:* ${videoInfo.data.title}
👤 *Artista/Canal:* ${videoInfo.data.author.name}
⏱ *Duração:* ${videoInfo.data.timestamp} (${videoInfo.data.seconds} segundos)
👀 *Visualizações:* ${videoInfo.data.views.toLocaleString()}
📅 *Publicado:* ${videoInfo.data.ago}
📜 *Descrição:* ${videoInfo.data.description.slice(0, 100)}${videoInfo.data.description.length > 100 ? '...' : ''}
🔗 *Link:* ${videoInfo.data.url}

📹 *Enviando seu vídeo, aguarde!*`;
    await nazu.sendMessage(from, { image: { url: videoInfo.data.thumbnail }, caption: caption, footer: `By: ${nomebot}` }, { quoted: info });
    const dlRes = await youtube.mp4(videoUrl);
    if (!dlRes.ok) return reply(dlRes.msg);
    try {
      await nazu.sendMessage(from, { video: dlRes.buffer, fileName: `${dlRes.filename}`, mimetype: 'video/mp4' }, { quoted: info });
    } catch (videoError) {
      if (String(videoError).includes("ENOSPC") || String(videoError).includes("size")) {
        await reply('Arquivo muito grande, enviando como documento...');
        await nazu.sendMessage(from, { document: dlRes.buffer, fileName: `${dlRes.filename}`, mimetype: 'video/mp4' }, { quoted: info });
      } else {
        throw videoError;
      }
    }
  } catch (e) {
    console.error(e);
    reply("Ocorreu um erro 💔");
  }
  break;

  case 'letra': case 'lyrics': try {
  if(!q) return reply('cade o nome da musica?');
  await reply('Aguarde um momentinho... ☀️');
  await reply(await Lyrics(q));
  } catch (e) {
    console.error(e);
    reply("ocorreu um erro 💔");
  };
  break;
  
  case 'tiktok': case 'tiktokaudio': case 'tiktokvideo': case 'tiktoks': case 'tiktoksearch': case 'ttk': case 'tkk':
   try {
    if (!q) return reply(`Digite um nome ou o link de um vídeo.\n> Ex: ${prefix}${command} Gato`);
    await reply('Aguarde um momentinho... ☀️');
    let isTikTokUrl = /^https?:\/\/(?:www\.|m\.|vm\.|t\.)?tiktok\.com\//.test(q);
    let datinha = await (isTikTokUrl ? tiktok.dl(q) : tiktok.search(q));
    if (!datinha.ok) return reply(datinha.msg);
    let bahzz = [];
    if(datinha.urls.length > 1) {
    for (const urlz of datinha.urls) {
        bahzz.push({type: datinha.type, [datinha.type]: { url: urlz }});
    };
    await nazu.sendAlbumMessage(from, bahzz, { quoted: info });
    } else {
    await nazu.sendMessage(from, { [datinha.type]: { url: datinha.urls[0] }}, {quoted: info});
    }
    if (datinha.audio) await nazu.sendMessage(from, { audio: { url: datinha.audio }, mimetype: 'audio/mp4' }, { quoted: info });
   } catch (e) {
    console.error(e);
    reply("ocorreu um erro 💔");
   }
   break;
   
   case 'instagram': case 'igdl': case 'ig': case 'instavideo': case 'igstory':
  try {
    if (!q) return reply(`Digite um link do Instagram.\n> Ex: ${prefix}${command} https://www.instagram.com/reel/DFaq_X7uoiT/?igsh=M3Q3N2ZyMWU1M3Bo`);
    await reply('Aguarde um momentinho... ☀️');
    const datinha = await igdl.dl(q);
    if (!datinha.ok) return reply(datinha.msg);
    let bahzz = [];
    if(datinha.data.length > 1) {
    await Promise.all(datinha.data.map(urlz => bahzz.push({type: urlz.type, [urlz.type]: urlz.buff})));
    await nazu.sendAlbumMessage(from, bahzz, { quoted: info });
    } else {
    await nazu.sendMessage(from, {[datinha.data[0].type]: datinha.data[0].buff}, {quoted: info});
    };
  } catch (e) {
    console.error(e);
    reply("ocorreu um erro 💔");
  }
  break;

  case 'pinterest': case 'pin':
  try {
    if (!q) return reply('Digite o termo para pesquisar no Pinterest. Exemplo: '+prefix+'pinterest gatinhos /3');
    const [searchTerm, limitStr] = q.split('/').map(s => s.trim());
    let maxImages = 5;
    if (limitStr && !isNaN(parseInt(limitStr))) {
      maxImages = Math.max(1, Math.min(parseInt(limitStr), 10));
    };
    const datinha = await (/^https?:\/\/(?:[a-zA-Z0-9-]+\.)?pinterest\.\w{2,6}(?:\.\w{2})?\/pin\/\d+|https?:\/\/pin\.it\/[a-zA-Z0-9]+/.test(searchTerm) ? pinterest.dl(searchTerm) : pinterest.search(searchTerm));
    if (!datinha.ok || !datinha.urls || datinha.urls.length === 0) {
      return reply('Nenhuma imagem encontrada para o termo pesquisado. 😕');
    };
    const imagesToSend = datinha.urls.slice(0, maxImages).map(url => ({ image: { url }, caption: `📌 Resultado da pesquisa por "${searchTerm}"` }));
    await nazu.sendAlbumMessage(from, imagesToSend, { quoted: info });
    await reply(`✅ Enviadas ${imagesToSend.length} image${imagesToSend.length > 1 ? 'ns' : 'm'} do Pinterest em um álbum!`);
  } catch (e) {
    console.error('Erro no comando pinterest:', e);
    await reply("Ocorreu um erro ao pesquisar no Pinterest 💔");
  }
  break;
   
  case 'menu': case 'help': case 'comandos': case 'commands':
    try {
      const menuVideoPath = __dirname + '/../midias/menu.mp4';
      const menuImagePath = __dirname + '/../midias/menu.jpg';
      const useVideo = fs.existsSync(menuVideoPath);
      const mediaPath = useVideo ? menuVideoPath : menuImagePath;
      const mediaBuffer = fs.readFileSync(mediaPath);
      const menuText = await menu(prefix, nomebot, pushname);
      await nazu.sendMessage(from, { [useVideo ? 'video' : 'image']: mediaBuffer, caption: menuText, gifPlayback: useVideo, mimetype: useVideo ? 'video/mp4' : 'image/jpeg' }, { quoted: info });
    } catch (error) {
      console.error('Erro ao enviar menu:', error);
      const menuText = await menu(prefix, nomebot, pushname);
      await reply(`${menuText}\n\n⚠️ *Nota*: Ocorreu um erro ao carregar a mídia do menu.`);
    }
  break;

  case 'alteradores': case 'menualterador': case 'menualteradores': case 'changersmenu': case 'changers':
    try {
      await sendMenuWithMedia('alteradores', menuAlterador);
    } catch (error) {
      console.error('Erro ao enviar menu de alteradores:', error);
      await reply("❌ Ocorreu um erro ao carregar o menu de alteradores");
    }
  break;

  case 'menuia': case 'aimenu': case 'menuias':
    try {
      await sendMenuWithMedia('ia', menuIa);
    } catch (error) {
      console.error('Erro ao enviar menu de IA:', error);
      await reply("❌ Ocorreu um erro ao carregar o menu de IA");
    }
  break;
    
  case 'menubn': case 'menubrincadeira': case 'menubrincadeiras': case 'gamemenu':
    try {
      let menuContent = await menubn(prefix, nomebot, pushname, isModoLite);
      await sendMenuWithMedia('brincadeiras', async () => menuContent);
    } catch (error) {
      console.error('Erro ao enviar menu de brincadeiras:', error);
      await reply("❌ Ocorreu um erro ao carregar o menu de brincadeiras");
    }
  break;
    
  case 'menudown': case 'menudownload': case 'menudownloads': case 'downmenu': case 'downloadmenu':
    try {
      await sendMenuWithMedia('downloads', menudown);
    } catch (error) {
      console.error('Erro ao enviar menu de downloads:', error);
      await reply("❌ Ocorreu um erro ao carregar o menu de downloads");
    }
  break;
    
  case 'ferramentas': case 'menuferramentas': case 'menuferramenta': case 'toolsmenu': case 'tools':
    try {
      await sendMenuWithMedia('ferramentas', menuFerramentas);
    } catch (error) {
      console.error('Erro ao enviar menu de ferramentas:', error);
      await reply("❌ Ocorreu um erro ao carregar o menu de ferramentas");
    }
  break;
    
  case 'menuadm': case 'menuadmin': case 'menuadmins': case 'admmenu':
    try {
      await sendMenuWithMedia('admin', menuadm);
    } catch (error) {
      console.error('Erro ao enviar menu de administração:', error);
      await reply("❌ Ocorreu um erro ao carregar o menu de administração");
    }
  break;
    
  case 'menumembros': case 'menumemb': case 'menugeral': case 'membmenu': case 'membermenu':
    try {
      await sendMenuWithMedia('membros', menuMembros);
    } catch (error) {
      console.error('Erro ao enviar menu de membros:', error);
      await reply("❌ Ocorreu um erro ao carregar o menu de membros");
    }
  break;
    
  case 'menudono': case 'ownermenu':
    try {
      if (!isOwner) {
        await reply("⚠️ Este menu é exclusivo para o dono do bot.");
        return;
      };
      await sendMenuWithMedia('dono', menuDono);
    } catch (error) {
      console.error('Erro ao enviar menu do dono:', error);
      await reply("❌ Ocorreu um erro ao carregar o menu do dono");
    }
  break;
    
  case 'stickermenu': case 'menusticker': case 'menufig':
    try {
      await sendMenuWithMedia('stickers', menuSticker);
    } catch (error) {
      console.error('Erro ao enviar menu de stickers:', error);
      await reply("❌ Ocorreu um erro ao carregar o menu de stickers");
    }
  break;

  async function sendMenuWithMedia(menuType, menuFunction) {
    const menuVideoPath = __dirname + '/../midias/menu.mp4';
    const menuImagePath = __dirname + '/../midias/menu.jpg';
    
    const useVideo = fs.existsSync(menuVideoPath);
    const mediaPath = useVideo ? menuVideoPath : menuImagePath;
    
    const mediaBuffer = fs.readFileSync(mediaPath);

    const menuText = typeof menuFunction === 'function' ? (typeof menuFunction.then === 'function' ? await menuFunction : await menuFunction(prefix, nomebot, pushname)) : 'Menu não disponível';

    await nazu.sendMessage(from, { [useVideo ? 'video' : 'image']: mediaBuffer, caption: menuText, gifPlayback: useVideo, mimetype: useVideo ? 'video/mp4' : 'image/jpeg' }, { quoted: info });
  };
   
   
  case 'antipv3':
  try {
    if (!isOwner) return reply("Este comando é apenas para o meu dono 💔");
    antipvData.mode = antipvData.mode === 'antipv3' ? null : 'antipv3';
    fs.writeFileSync(__dirname + '/../database/antipv.json', JSON.stringify(antipvData, null, 2));
    await reply(`✅ Antipv3 ${antipvData.mode ? 'ativado' : 'desativado'}! O bot agora ${antipvData.mode ? 'bloqueia usuários que usam comandos no privado' : 'responde normalmente no privado'}.`);
  } catch (e) {
    console.error(e);
    await reply("Ocorreu um erro 💔");
  }
  break;
  
  case 'antipv2':
  try {
    if (!isOwner) return reply("Este comando é apenas para o meu dono 💔");
    antipvData.mode = antipvData.mode === 'antipv2' ? null : 'antipv2';
    fs.writeFileSync(__dirname + '/../database/antipv.json', JSON.stringify(antipvData, null, 2));
    await reply(`✅ Antipv2 ${antipvData.mode ? 'ativado' : 'desativado'}! O bot agora ${antipvData.mode ? 'avisa que comandos só funcionam em grupos no privado' : 'responde normalmente no privado'}.`);
  } catch (e) {
    console.error(e);
    await reply("Ocorreu um erro 💔");
  }
  break;

  case 'antipvmessage':
  try {
    if (!isOwner) return reply('🚫 Este comando é apenas para o dono do bot!');
    if (!q) return reply(`Por favor, forneça a nova mensagem para o antipv. Exemplo: ${prefix}antipvmessage Comandos no privado estão desativados!`);

    const antipvFile = DATABASE_DIR + '/antipv.json';
    let antipvData = loadJsonFile(antipvFile, { mode: 'off', message: '🚫 Este comando só funciona em grupos!' });
    
    antipvData.message = q.trim();
    fs.writeFileSync(antipvFile, JSON.stringify(antipvData, null, 2));
    await reply(`✅ Mensagem do antipv atualizada para: "${antipvData.message}"`);
  } catch (e) {
    console.error('Erro no comando setantipvmensagem:', e);
    await reply("Ocorreu um erro ao configurar a mensagem do antipv 💔");
  }
  break;
  
  case 'antipv':
  try {
    if (!isOwner) return reply("Este comando é apenas para o meu dono 💔");
    antipvData.mode = antipvData.mode === 'antipv' ? null : 'antipv';
    fs.writeFileSync(__dirname + '/../database/antipv.json', JSON.stringify(antipvData, null, 2));
    await reply(`✅ Antipv ${antipvData.mode ? 'ativado' : 'desativado'}! O bot agora ${antipvData.mode ? 'ignora mensagens no privado' : 'responde normalmente no privado'}.`);
  } catch (e) {
    console.error(e);
    await reply("Ocorreu um erro 💔");
  }
  break;
  
  case 'entrar':
  try {
    if (!isOwner) return reply("Este comando é apenas para o meu dono 💔");
    if (!q || !q.includes('chat.whatsapp.com')) return reply('Digite um link de convite válido! Exemplo: '+prefix+'entrar https://chat.whatsapp.com/...');
    const code = q.split('https://chat.whatsapp.com/')[1];
    await nazu.groupAcceptInvite(code).then((res) => {
      reply(`✅ Entrei no grupo com sucesso!`);
    }).catch((err) => {
      reply('❌ Erro ao entrar no grupo. Link inválido ou permissão negada.');
    });
  } catch (e) {
    console.error(e);
    await reply("Ocorreu um erro 💔");
  }
  break;
  
  case 'tm':
  try {
    if (!isOwner) return reply("Este comando é apenas para o meu dono 💔");
    if (!q && !isQuotedImage && !isQuotedVideo) return reply('Digite uma mensagem ou marque uma imagem/vídeo! Exemplo: '+prefix+'tm Olá a todos!');
    let message = {};
    if (isQuotedImage) {
      const image = await getFileBuffer(info.message.extendedTextMessage.contextInfo.quotedMessage.imageMessage, 'image');
      message = { image, caption: q || 'Transmissão do dono!' };
    } else if (isQuotedVideo) {
      const video = await getFileBuffer(info.message.extendedTextMessage.contextInfo.quotedMessage.videoMessage, 'video');
      message = { video, caption: q || 'Transmissão do dono!' };
    } else {
      message = { text: q };
    }
    const groups = await nazu.groupFetchAllParticipating();
    for (const group of Object.values(groups)) {
      await new Promise(resolve => setTimeout(resolve, Math.floor(Math.random() * (30000 - 10000) + 10000)));
      await nazu.sendMessage(group.id, message);
    }
    await reply(`✅ Transmissão enviada para ${Object.keys(groups).length} grupos!`);
  } catch (e) {
    console.error(e);
    await reply("Ocorreu um erro 💔");
  }
  break;
  
  case 'cases':
  if (!isOwner) return reply("Este comando é apenas para o meu dono");
  try {
    const indexContent = fs.readFileSync(__dirname + '/index.js', 'utf-8');
    const caseRegex = /case\s+'([^']+)'\s*:/g;
    const cases = new Set();
    let match;
    while ((match = caseRegex.exec(indexContent)) !== null) {
      cases.add(match[1]);
    };
    const multiCaseRegex = /case\s+'([^']+)'\s*:\s*case\s+'([^']+)'\s*:/g;
    while ((match = multiCaseRegex.exec(indexContent)) !== null) {
      cases.add(match[1]);
      cases.add(match[2]);
    };
    const caseList = Array.from(cases).sort();
    await reply(`📜 *Lista de Comandos (Cases)*:\n\n${caseList.join('\n')}\n\nTotal: ${caseList.length} comandos`);
  } catch (e) {
    console.error(e);
    await reply("🐝 Oh não! Aconteceu um errinho inesperado aqui. Tente de novo daqui a pouquinho, por favor! 🥺");
  }
  break;

  case 'getcase':
  if (!isOwner) return reply("Este comando é apenas para o meu dono");
  try {
    if (!q) return reply('❌ Digite o nome do comando. Exemplo: '+prefix+'getcase menu');
    caseCode = 'case '+`'${cases}'`+fs.readFileSync("./index.js").toString().split('case \''+cases+'\'')[1].split("bre"+"ak")[0]+"brea"+"k";
    await nazu.sendMessage(from, { document: Buffer.from(caseCode, 'utf-8'), mimetype: 'text/plain', fileName: `${q}.txt` }, { quoted: info });
  } catch (e) {
    console.error(e);
    await reply("🐝 Oh não! Aconteceu um errinho inesperado aqui. Tente de novo daqui a pouquinho, por favor! 🥺");
  }
  break;
  
  case 'boton':
  case 'botoff':
  if (!isOwner) return reply("Este comando é apenas para o meu dono");
  try {
    const botStateFile = __dirname + '/../database/botState.json';
    
    const isOn = botState.status === 'on';
    if (command === 'boton' && isOn) {
      return reply('🌟 O bot já está ativado!');
    }
    if (command === 'botoff' && !isOn) {
      return reply('🌙 O bot já está desativado!');
    }

    botState.status = command === 'boton' ? 'on' : 'off';
    fs.writeFileSync(botStateFile, JSON.stringify(botState, null, 2));

    const message = command === 'boton' ? '✅ *Bot ativado!* Agora todos podem usar os comandos.' : '✅ *Bot desativado!* Apenas o dono pode usar comandos.';
    
    await reply(message);
  } catch (e) {
    console.error(e);
    await reply("🐝 Oh não! Aconteceu um errinho inesperado aqui. Tente de novo daqui a pouquinho, por favor! 🥺");
  }
  break;

  case 'blockcmdg':
  if (!isOwner) return reply("Este comando é apenas para o meu dono");
  try {
    const cmdToBlock = q?.toLowerCase().split(' ')[0];
    const reason = q?.split(' ').slice(1).join(' ') || 'Sem motivo informado';
    if (!cmdToBlock) return reply('❌ Informe o comando a bloquear! Ex.: '+prefix+'blockcmd sticker');
    const blockFile = __dirname + '/../database/globalBlocks.json';
    globalBlocks.commands = globalBlocks.commands || {};
    globalBlocks.commands[cmdToBlock] = { reason, timestamp: Date.now() };
    fs.writeFileSync(blockFile, JSON.stringify(globalBlocks, null, 2));
    await reply(`✅ Comando *${cmdToBlock}* bloqueado globalmente!\nMotivo: ${reason}`);
  } catch (e) {
    console.error(e);
    await reply("🐝 Oh não! Aconteceu um errinho inesperado aqui. Tente de novo daqui a pouquinho, por favor! 🥺");
  }
  break;

  case 'unblockcmdg':
  if (!isOwner) return reply("Este comando é apenas para o meu dono");
  try {
    const cmdToUnblock = q?.toLowerCase().split(' ')[0];
    if (!cmdToUnblock) return reply('❌ Informe o comando a desbloquear! Ex.: '+prefix+'unblockcmd sticker');
    const blockFile = __dirname + '/../database/globalBlocks.json';
    if (!globalBlocks.commands || !globalBlocks.commands[cmdToUnblock]) {
      return reply(`❌ O comando *${cmdToUnblock}* não está bloqueado!`);
    }
    delete globalBlocks.commands[cmdToUnblock];
    fs.writeFileSync(blockFile, JSON.stringify(globalBlocks, null, 2));
    await reply(`✅ Comando *${cmdToUnblock}* desbloqueado globalmente!`);
  } catch (e) {
    console.error(e);
    await reply("🐝 Oh não! Aconteceu um errinho inesperado aqui. Tente de novo daqui a pouquinho, por favor! 🥺");
  }
  break;

  case 'blockuserg':
  if (!isOwner) return reply("Este comando é apenas para o meu dono");
  try {
    reason = q ? q.includes('@') ? q.includes(' ') ? q.split(' ').slice(1).join(' ') : "Não informado" : q : 'Não informado';
    menc_os3 = menc_os2.includes(' ') ? menc_os2.split(' ')[0] : menc_os2;
    if(!menc_os3) return reply("Marque alguém 🙄");
    const blockFile = __dirname + '/../database/globalBlocks.json';
    globalBlocks.users = globalBlocks.users || {};
    globalBlocks.users[menc_os3] = { reason, timestamp: Date.now() };
    fs.writeFileSync(blockFile, JSON.stringify(globalBlocks, null, 2));
    await reply(`✅ Usuário @${menc_os3.split('@')[0]} bloqueado globalmente!\nMotivo: ${reason}`, { mentions: [menc_os3] });
  } catch (e) {
    console.error(e);
    await reply("🐝 Oh não! Aconteceu um errinho inesperado aqui. Tente de novo daqui a pouquinho, por favor! 🥺");
  }
  break;

  case 'unblockuserg':
  if (!isOwner) return reply("Este comando é apenas para o meu dono");
  try {
    if(!menc_os2) return reply("Marque alguém 🙄");
    const blockFile = __dirname + '/../database/globalBlocks.json';
    if (!globalBlocks.users || (!globalBlocks.users[menc_os2] && !globalBlocks.users[menc_os2.split('@')[0]])) {
      return reply(`❌ O usuário @${menc_os2.split('@')[0]} não está bloqueado!`, { mentions: [menc_os2] });
    }
    if (globalBlocks.users[menc_os2]) {
    delete globalBlocks.users[menc_os2];
    } else if (globalBlocks.users[menc_os2.split('@')[0]]) {
    delete globalBlocks.users[menc_os2.split('@')[0]];
    }
    fs.writeFileSync(blockFile, JSON.stringify(globalBlocks, null, 2));
    await reply(`✅ Usuário @${menc_os2.split('@')[0]} desbloqueado globalmente!`, { mentions: [menc_os2] });
  } catch (e) {
    console.error(e);
    await reply("🐝 Oh não! Aconteceu um errinho inesperado aqui. Tente de novo daqui a pouquinho, por favor! 🥺");
  }
  break;

  case 'listblocks':
  if (!isOwner) return reply("Este comando é apenas para o meu dono");
  try {
    const blockFile = __dirname + '/../database/globalBlocks.json';
    const blockedCommands = globalBlocks.commands ? Object.entries(globalBlocks.commands).map(([cmd, data]) => `🔧 *${cmd}* - Motivo: ${data.reason}`).join('\n') : 'Nenhum comando bloqueado.';
    const blockedUsers = globalBlocks.users ? Object.entries(globalBlocks.users).map(([user, data]) => {const userId = user.split('@')[0]; return `👤 *${userId}* - Motivo: ${data.reason}`;}).join('\n') : 'Nenhum usuário bloqueado.';
    const message = `🔒 *Bloqueios Globais - ${nomebot}* 🔒\n\n📜 *Comandos Bloqueados*:\n${blockedCommands}\n\n👥 *Usuários Bloqueados*:\n${blockedUsers}`;    
    await reply(message);
  } catch (e) {
    console.error(e);
    await reply("🐝 Oh não! Aconteceu um errinho inesperado aqui. Tente de novo daqui a pouquinho, por favor! 🥺");
  }
  break;

  case 'seradm': try {
  if(!isOwner) return reply("Este comando é apenas para o meu dono");
  await nazu.groupParticipantsUpdate(from, [sender], "promote");
  } catch(e) {
  console.error(e);
  await reply("🐝 Oh não! Aconteceu um errinho inesperado aqui. Tente de novo daqui a pouquinho, por favor! 🥺");
  };
  break

  case 'sermembro': try {
  if(!isOwner) return reply("Este comando é apenas para o meu dono");
  await nazu.groupParticipantsUpdate(from, [sender], "demote");
  } catch(e) {
  console.error(e);
  await reply("🐝 Oh não! Aconteceu um errinho inesperado aqui. Tente de novo daqui a pouquinho, por favor! 🥺");
  };
  break

   case 'prefixo':case 'numerodono':case 'nomedono':case 'nomebot': try {
    if(!isOwner) return reply("Este comando é apenas para o meu dono");
    if (!q) return reply(`Uso correto: ${prefix}${command} <valor>`);
     let config = JSON.parse(fs.readFileSync(__dirname + '/config.json'));
     config[command] = q;
     fs.writeFileSync(__dirname + '/config.json', JSON.stringify(config, null, 2));
     reply(`✅ ${command} atualizado para: *${q}*`);
   } catch (e) {
   console.error(e);
   reply("ocorreu um erro 💔");
   };
  break;
  
  case 'fotomenu':case 'videomenu':case 'mediamenu':case 'midiamenu': try {
   if(!isOwner) return reply("Este comando é apenas para o meu dono");
   if(fs.existsSync(__dirname+'/../midias/menu.jpg')) fs.unlinkSync(__dirname+'/../midias/menu.jpg');
   if(fs.existsSync(__dirname+'/../midias/menu.mp4')) fs.unlinkSync(__dirname+'/../midias/menu.mp4');
   var RSM = info.message?.extendedTextMessage?.contextInfo?.quotedMessage;
    var boij2 = RSM?.imageMessage || info.message?.imageMessage || RSM?.viewOnceMessageV2?.message?.imageMessage || info.message?.viewOnceMessageV2?.message?.imageMessage || info.message?.viewOnceMessage?.message?.imageMessage || RSM?.viewOnceMessage?.message?.imageMessage;
   var boij = RSM?.videoMessage || info.message?.videoMessage || RSM?.viewOnceMessageV2?.message?.videoMessage || info.message?.viewOnceMessageV2?.message?.videoMessage || info.message?.viewOnceMessage?.message?.videoMessage || RSM?.viewOnceMessage?.message?.videoMessage;
    if (!boij && !boij2) return reply(`Marque uma imagem ou um vídeo, com o comando: ${prefix + command} (mencionando a mídia)`);
    var isVideo2 = !!boij;
    var buffer = await getFileBuffer(isVideo2 ? boij : boij2, isVideo2 ? 'video' : 'image');
    fs.writeFileSync(__dirname+'/../midias/menu.' + (isVideo2 ? 'mp4' : 'jpg'), buffer);
    await reply('✅ Mídia do menu atualizada com sucesso.');
  } catch(e) {
   console.error(e);
   reply("ocorreu um erro 💔");
  }
  break
  
  case 'listagp': case 'listgp':
  try {
    if (!isOwner) return reply('⛔ Desculpe, este comando é exclusivo para o meu dono!')    
    const getGroups = await nazu.groupFetchAllParticipating()
    const groups = Object.entries(getGroups).slice(0).map(entry => entry[1])
    const sortedGroups = groups.sort((a, b) => a.subject.localeCompare(b.subject))    
    let teks = `🌟 *Lista de Grupos e Comunidades* 🌟\n📊 *Total de Grupos:* ${sortedGroups.length}\n\n`    
    for (let i = 0; i < sortedGroups.length; i++) {
      teks += `🔹 *${i + 1}. ${sortedGroups[i].subject}*\n` + `🆔 *ID:* ${sortedGroups[i].id}\n` + `👥 *Participantes:* ${sortedGroups[i].participants.length}\n\n`
    };
    await reply(teks)
  } catch (e) {
    console.log(e)
    await reply("🐝 Oh não! Aconteceu um errinho inesperado aqui. Tente de novo daqui a pouquinho, por favor! 🥺");
  }
  break
  
  case 'bangp':case 'unbangp':case 'desbangp': try {
  if(!isGroup) return reply("isso so pode ser usado em grupo 💔");
  if(!isOwner) return reply("Este comando é apenas para o meu dono");
  banGpIds[from] = !banGpIds[from];
  if(banGpIds[from]) {
  await reply('🚫 Grupo banido, apenas usuarios premium ou meu dono podem utilizar o bot aqui agora.');
  } else {
  await reply('✅ Grupo desbanido, todos podem utilizar o bot novamente.');
  };
  fs.writeFileSync(__dirname + `/../database/dono/bangp.json`, JSON.stringify(banGpIds));
  } catch(e) {
  console.error(e);
  await reply("🐝 Oh não! Aconteceu um errinho inesperado aqui. Tente de novo daqui a pouquinho, por favor! 🥺");
  };
  break
  
  case 'addpremium':case 'addvip':
  try {
    if (!isOwner) return reply("Este comando é apenas para o meu dono");
    if (!menc_os2) return reply("Marque alguém 🙄");
    if(!!premiumListaZinha[menc_os2]) return reply('O usuário ja esta na lista premium.');
    premiumListaZinha[menc_os2] = true;
    await nazu.sendMessage(from, {text: `✅ @${menc_os2.split('@')[0]} foi adicionado(a) a lista premium.`, mentions: [menc_os2] }, { quoted: info });
    fs.writeFileSync(__dirname + `/../database/dono/premium.json`, JSON.stringify(premiumListaZinha));
  } catch (e) {
    console.error(e);
    reply("ocorreu um erro 💔");
  }
  break;
  
  case 'delpremium':case 'delvip':case 'rmpremium':case 'rmvip':
  try {
    if(!isOwner) return reply("Este comando é apenas para o meu dono");
    if(!menc_os2) return reply("Marque alguém 🙄");
    if(!premiumListaZinha[menc_os2]) return reply('O usuário não esta na lista premium.');
    delete premiumListaZinha[menc_os2];
    await nazu.sendMessage(from, {text: `🫡 @${menc_os2.split('@')[0]} foi removido(a) da lista premium.`, mentions: [menc_os2] }, { quoted: info });
    fs.writeFileSync(__dirname + `/../database/dono/premium.json`, JSON.stringify(premiumListaZinha));
  } catch (e) {
    console.error(e);
    reply("ocorreu um erro 💔");
  }
  break;
  
  case 'addpremiumgp':case 'addvipgp':
  try {
    if (!isOwner) return reply("Este comando é apenas para o meu dono");
    if (!isGroup) return reply("isso so pode ser usado em grupo 💔");
    if(!!premiumListaZinha[from]) return reply('O grupo ja esta na lista premium.');
    premiumListaZinha[from] = true;
    await nazu.sendMessage(from, {text: `✅ O grupo foi adicionado a lista premium.` }, { quoted: info });
    fs.writeFileSync(__dirname + `/../database/dono/premium.json`, JSON.stringify(premiumListaZinha));
  } catch (e) {
    console.error(e);
    reply("ocorreu um erro 💔");
  }
  break;
  
  case 'delpremiumgp':case 'delvipgp':case 'rmpremiumgp':case 'rmvipgp':
  try {
    if(!isOwner) return reply("Este comando é apenas para o meu dono");
    if (!isGroup) return reply("isso so pode ser usado em grupo 💔");
    if(!premiumListaZinha[from]) return reply('O grupo não esta na lista premium.');
    delete premiumListaZinha[from];
    await nazu.sendMessage(from, {text: `🫡 O grupo foi removido da lista premium.` }, { quoted: info });
    fs.writeFileSync(__dirname + `/../database/dono/premium.json`, JSON.stringify(premiumListaZinha));
  } catch (e) {
    console.error(e);
    reply("ocorreu um erro 💔");
  }
  break;
  
  case 'listapremium': case 'listavip': case 'premiumlist': case 'listpremium':
  try {
    if (!isOwner) return reply('⛔ Desculpe, este comando é exclusivo para o meu dono!')

    const premiumList = premiumListaZinha || {}

    const usersPremium = Object.keys(premiumList).filter(id => id.includes('@s.whatsapp.net'))
    const groupsPremium = Object.keys(premiumList).filter(id => id.includes('@g.us'))

    let teks = `✨ *Lista de Membros Premium* ✨\n\n`

    teks += `👤 *Usuários Premium* (${usersPremium.length})\n`
    if (usersPremium.length > 0) {
      usersPremium.forEach((user, i) => {
        const userNumber = user.split('@')[0]
        teks += `🔹 ${i + 1}. @${userNumber}\n`
      })
    } else {
      teks += `   Nenhum usuário premium encontrado.\n`
    };

    teks += `\n👥 *Grupos Premium* (${groupsPremium.length})\n`
    if (groupsPremium.length > 0) {
      for (let i = 0; i < groupsPremium.length; i++) {
        try {
          const groupInfo = await nazu.groupMetadata(groupsPremium[i])
          teks += `🔹 ${i + 1}. ${groupInfo.subject}\n`
        } catch {
          teks += `🔹 ${i + 1}. Grupo ID: ${groupsPremium[i]}\n`
        }
      }
    } else {
      teks += `   Nenhum grupo premium encontrado.\n`
    };

    await nazu.sendMessage(from, { text: teks, mentions: usersPremium }, { quoted: info })

  } catch (e) {
    console.error(e)
    await reply('😔 Ops, algo deu errado. Tente novamente mais tarde!');
  };
  break
  
  //COMANDOS GERAIS
  case 'rvisu':case 'open':case 'revelar': try {
  var RSMM = info.message?.extendedTextMessage?.contextInfo?.quotedMessage
  var boij22 = RSMM?.imageMessage || info.message?.imageMessage || RSMM?.viewOnceMessageV2?.message?.imageMessage || info.message?.viewOnceMessageV2?.message?.imageMessage || info.message?.viewOnceMessage?.message?.imageMessage || RSMM?.viewOnceMessage?.message?.imageMessage;
  var boijj = RSMM?.videoMessage || info.message?.videoMessage || RSMM?.viewOnceMessageV2?.message?.videoMessage || info.message?.viewOnceMessageV2?.message?.videoMessage || info.message?.viewOnceMessage?.message?.videoMessage || RSMM?.viewOnceMessage?.message?.videoMessage;
  var boij33 = RSMM?.audioMessage || info.message?.audioMessage || RSMM?.viewOnceMessageV2?.message?.audioMessage || info.message?.viewOnceMessageV2?.message?.audioMessage || info.message?.viewOnceMessage?.message?.audioMessage || RSMM?.viewOnceMessage?.message?.audioMessage;
  if(boijj) {
  var px = boijj;
  px.viewOnce = false;
  px.video = {url: px.url};
  await nazu.sendMessage(from,px,{quoted:info});
  } else if(boij22) {
  var px = boij22;
  px.viewOnce = false;
  px.image = {url: px.url};
  await nazu.sendMessage(from,px,{quoted:info});
  } else if(boij33) {
  var px = boij33;
  px.viewOnce = false;
  px.audio = {url: px.url};
  await nazu.sendMessage(from,px,{quoted:info});
  } else {
  return reply('Por favor, *mencione uma imagem, video ou áudio em visualização única* para executar o comando.');
  };
  } catch(e) {
  console.error(e);
  await reply("🐝 Oh não! Aconteceu um errinho inesperado aqui. Tente de novo daqui a pouquinho, por favor! 🥺");
  };
  break
  
  case 'rankativog':
  try {
    const userTotals = {};

    const groupFiles = fs.readdirSync(__dirname + '/../database/grupos').filter(file => file.endsWith('.json'));
    for (const file of groupFiles) {
      try {
        const groupData = JSON.parse(fs.readFileSync(__dirname + `/../database/grupos/${file}`));
        if (groupData.contador && Array.isArray(groupData.contador)) {
          groupData.contador.forEach(user => {
            const userId = user.id;
            if (!userTotals[userId]) {
              userTotals[userId] = {
                name: user.pushname || userId.split('@')[0],
                messages: 0,
                commands: 0,
                stickers: 0
              };
            }
            userTotals[userId].messages += (user.msg || 0);
            userTotals[userId].commands += (user.cmd || 0);
            userTotals[userId].stickers += (user.figu || 0);
          });
        }
      } catch (e) {
        console.error(`Erro ao ler ${file}:`, e);
      };
    };

    const rankedUsers = Object.entries(userTotals) .map(([id, data]) => ({ id, name: data.name, total: data.messages + data.commands + data.stickers, messages: data.messages, commands: data.commands, stickers: data.stickers})).filter(user => user.total > 0).sort((a, b) => b.total - a.total).slice(0, 5);
      
    const rankMessage = rankedUsers.length > 0 ? rankedUsers.map((user, index) => { const emoji = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : '🏅'; return `${emoji} *${index + 1}. @${user.id.split('@')[0]}* - ${user.total} interações\n` + `   💬 Msgs: ${user.messages} | ⚒️ Cmds: ${user.commands} | 🎨 Figus: ${user.stickers}`; }).join('\n\n') : 'Nenhum dado de atividade registrado.';

    const finalMessage = `🏆 *Ranking Global de Atividade - ${nomebot}* 🏆\n\n${rankMessage}\n\n✨ *Total de Usuários*: ${Object.keys(userTotals).length}\n📊 *Bot*: ${nomebot} by ${nomedono} ✨`;

    await nazu.sendMessage(from, { text: finalMessage, mentions: rankedUsers.map(user => user.id).filter(id => id.includes('@s.whatsapp.net')) }, { quoted: info });
  } catch (e) {
    console.error(e);
    await reply("🐝 Oh não! Aconteceu um errinho inesperado aqui. Tente de novo daqui a pouquinho, por favor! 🥺");
  }
break;

  case 'rankativos': 
  case 'rankativo': try {
    if (!isGroup) return reply("isso so pode ser usado em grupo 💔");
    blue67 = groupData.contador.sort((a, b) => ((a.figu == undefined ? a.figu = 0 : a.figu + a.msg + a.cmd) < (b.figu == undefined ? b.figu = 0 : b.figu + b.cmd + b.msg)) ? 0 : -1);
    menc = [];
    blad = `*🏆 Rank dos ${blue67.length < 10 ? blue67.length : 10} mais ativos do grupo:*\n`;
    for (i6 = 0; i6 < (blue67.length < 10 ? blue67.length : 10); i6++) {
        if (i6 != null) blad += `\n*🏅 ${i6 + 1}º Lugar:* @${blue67[i6].id.split('@')[0]}\n- mensagens encaminhadas: *${blue67[i6].msg}*\n- comandos executados: *${blue67[i6].cmd}*\n- Figurinhas encaminhadas: *${blue67[i6].figu}*\n`;
        if(!groupData.mark) groupData.mark = {};
        if(!['0', 'marca'].includes(groupData.mark[blue67[i6].id])) {
        menc.push(blue67[i6].id);
        };
    };
    await nazu.sendMessage(from, {text: blad, mentions: menc}, {quoted: info});
  } catch(e) {
  console.error(e);
  await reply("🐝 Oh não! Aconteceu um errinho inesperado aqui. Tente de novo daqui a pouquinho, por favor! 🥺");
  };
  break;
  
  case 'rankinativos': 
  case 'rankinativo': try {
    if (!isGroup) return reply("isso so pode ser usado em grupo 💔");
    blue67 = groupData.contador.sort((a, b) => {
  const totalA = (a.figu ?? 0) + a.msg + a.cmd;
  const totalB = (b.figu ?? 0) + b.msg + b.cmd;
  return totalA - totalB;
});
    menc = [];
    blad = `*🗑️ Rank dos ${blue67.length < 10 ? blue67.length : 10} mais inativos do grupo:*\n`;
    for (i6 = 0; i6 < (blue67.length < 10 ? blue67.length : 10); i6++) {
        if (i6 != null) blad += `\n*🏅 ${i6 + 1}º Lugar:* @${blue67[i6].id.split('@')[0]}\n- mensagens encaminhadas: *${blue67[i6].msg}*\n- comandos executados: *${blue67[i6].cmd}*\n- Figurinhas encaminhadas: *${blue67[i6].figu}*\n`;
        if(!groupData.mark) groupData.mark = {};
        if(!['0', 'marca'].includes(groupData.mark[blue67[i6].id])) {
        menc.push(blue67[i6].id);
        };
    };
    await nazu.sendMessage(from, {text: blad, mentions: menc}, {quoted: info});
  } catch(e) {
  console.error(e);
  reply("ocorreu um erro 💔");
  };
  break;
  
  case 'totalcmd':
  case 'totalcomando': try {
    fs.readFile(__dirname + '/index.js', 'utf8', async (err, data) => {
      if (err) throw err;
      const comandos = [...data.matchAll(/case [`'"](\w+)[`'"]/g)].map(m => m[1]);
      await nazu.sendMessage(from, {image: {url: `https://api.cognima.com.br/api/banner/counter?key=CognimaTeamFreeKey&num=${String(comandos.length)}&theme=miku`}, caption: `╭〔 🤖 *Meus Comandos* 〕╮\n`+`┣ 📌 Total: *${comandos.length}* comandos\n`+`╰━━━━━━━━━━━━━━━╯`}, { quoted: info });
    });
    } catch(e) {
    console.error(e);
    await reply("🐝 Oh não! Aconteceu um errinho inesperado aqui. Tente de novo daqui a pouquinho, por favor! 🥺");
    }
  break;
 
 case 'meustatus':
  try {
    let groupMessages = 0;
    let groupCommands = 0;
    let groupStickers = 0;
    if (isGroup && groupData.contador && Array.isArray(groupData.contador)) {
      const userData = groupData.contador.find(u => u.id === sender);
      if (userData) {
        groupMessages = userData.msg || 0;
        groupCommands = userData.cmd || 0;
        groupStickers = userData.figu || 0;
      };
    };
    let totalMessages = 0;
    let totalCommands = 0;
    let totalStickers = 0;
    const groupFiles = fs.readdirSync(__dirname + '/../database/grupos').filter(file => file.endsWith('.json'));
    for (const file of groupFiles) {
      try {
        const groupData = JSON.parse(fs.readFileSync(__dirname + `/../database/grupos/${file}`));
        if (groupData.contador && Array.isArray(groupData.contador)) {
          const userData = groupData.contador.find(u => u.id === sender);
          if (userData) {
            totalMessages += (userData.msg || 0);
            totalCommands += (userData.cmd || 0);
            totalStickers += (userData.figu || 0);
          };
        };
      } catch (e) {
        console.error(`Erro ao ler ${file}:`, e);
      };
    };
    const userName = pushname || sender.split('@')[0];
    const userStatus = isOwner ? 'Dono' : isPremium ? 'Premium' : isGroupAdmin ? 'Admin' : 'Membro';
    let profilePic = null;
    try {
      profilePic = await nazu.profilePictureUrl(sender, 'image');
    } catch (e) {};
    const statusMessage = `📊 *Meu Status - ${userName}* 📊\n\n👤 *Nome*: ${userName}\n📱 *Número*: @${sender.split('@')[0]}\n⭐ *Status*: ${userStatus}\n\n${isGroup ? `\n📌 *No Grupo: ${groupName}*\n💬 Mensagens: ${groupMessages}\n⚒️ Comandos: ${groupCommands}\n🎨 Figurinhas: ${groupStickers}\n` : ''}\n\n🌐 *Geral (Todos os Grupos)*\n💬 Mensagens: ${totalMessages}\n⚒️ Comandos: ${totalCommands}\n🎨 Figurinhas: ${totalStickers}\n\n✨ *Bot*: ${nomebot} by ${nomedono} ✨`;
    if (profilePic) {
      await nazu.sendMessage(from, { image: { url: profilePic }, caption: statusMessage, mentions: [sender] }, { quoted: info });
    } else {
      await nazu.sendMessage(from, { text: statusMessage, mentions: [sender] }, { quoted: info });
    };
  } catch (e) {
    console.error(e);
    await reply("🐝 Oh não! Aconteceu um errinho inesperado aqui. Tente de novo daqui a pouquinho, por favor! 🥺");
  };
  break;

  case 'infoserver':
  if (!isOwner) {
    await reply('🚫 *Ops! Você não tem permissão!* 😅\n\n🌸 *Este comando é só para o dono*\nInformações do servidor são confidenciais! ✨');
    break;
  }

  const serverUptime = process.uptime();
  const serverUptimeFormatted = formatUptime(serverUptime, true);

  const serverMemUsage = process.memoryUsage();
  const serverMemUsed = (serverMemUsage.heapUsed / 1024 / 1024).toFixed(2);
  const serverMemTotal = (serverMemUsage.heapTotal / 1024 / 1024).toFixed(2);
  const serverMemRss = (serverMemUsage.rss / 1024 / 1024).toFixed(2);
  const serverMemExternal = (serverMemUsage.external / 1024 / 1024).toFixed(2);

  const serverCpuUsage = process.cpuUsage();
  const serverCpuUser = (serverCpuUsage.user / 1000000).toFixed(2);
  const serverCpuSystem = (serverCpuUsage.system / 1000000).toFixed(2);

  const serverOsInfo = {
    platform: os.platform(),
    arch: os.arch(),
    release: os.release(),
    hostname: os.hostname(),
    type: os.type(),
    endianness: os.endianness()
  };

  const serverFreeMemory = (os.freemem() / 1024 / 1024 / 1024).toFixed(2);
  const serverTotalMemory = (os.totalmem() / 1024 / 1024 / 1024).toFixed(2);
  const serverLoadAvg = os.loadavg();
  const serverCpuCount = os.cpus().length;
  const serverCpuModel = os.cpus()[0]?.model || 'Desconhecido';

  const serverNetworkInterfaces = os.networkInterfaces();
  const serverInterfaces = Object.keys(serverNetworkInterfaces).length;

  const currentServerTime = new Date().toLocaleString('pt-BR', {
    timeZone: 'America/Sao_Paulo',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });

  const nodeVersion = process.version;
  const osUptime = (os.uptime() / 3600).toFixed(2);
  let networkDetails = '';
  for (const [name, interfaces] of Object.entries(serverNetworkInterfaces)) {
    interfaces.forEach(iface => {
      networkDetails += `├ ${name} (${iface.family}): ${iface.address}\n`;
    });
  }
  
  let diskInfo = { totalGb: 0, freeGb: 0, usedGb: 0, percentUsed: 0 };
  try {
    diskInfo = await getDiskSpaceInfo();
  } catch (error) {
    console.error('Erro ao obter informações de disco:', error);
  }
  const diskFree = diskInfo.freeGb;
  const diskTotal = diskInfo.totalGb;
  const diskUsed = diskInfo.usedGb;
  const diskUsagePercent = diskInfo.percentUsed;

  const startUsage = process.cpuUsage();
  await new Promise(resolve => setTimeout(resolve, 1000));
  const endUsage = process.cpuUsage(startUsage);
  const cpuPercent = ((endUsage.user + endUsage.system) / 10000).toFixed(1);

  const startTime = Date.now();
  const endTime = Date.now();
  const latency = endTime - startTime;

  let networkLatency = 'N/A';
  try {
    const startNetworkTest = Date.now();
    await new Promise((resolve, reject) => {
      const req = https.get('https://www.google.com', res => {
        res.on('data', () => {});
        res.on('end', () => resolve());
      });
      req.on('error', err => reject(err));
      req.setTimeout(5000, () => reject(new Error('Timeout')));
    });
    const endNetworkTest = Date.now();
    networkLatency = `${endNetworkTest - startNetworkTest}ms`;
  } catch (error) {
    networkLatency = 'Erro ao testar';
    console.error('Erro ao testar latência de rede:', error);
  }

  let infoServerMessage = `🌸 ═════════════════════ 🌸\n`;
  infoServerMessage += `    *INFORMAÇÕES DO SERVIDOR*\n`;
  infoServerMessage += `🌸 ═════════════════════ 🌸\n\n`;

  infoServerMessage += `🖥️ *Sistema Operacional:* 🏠\n`;
  infoServerMessage += `├ 🟢 Node.js: ${nodeVersion}\n`;
  infoServerMessage += `├ 💻 Plataforma: ${serverOsInfo.platform}\n`;
  infoServerMessage += `├ 🏗️ Arquitetura: ${serverOsInfo.arch}\n`;
  infoServerMessage += `├ 🔧 Tipo: ${serverOsInfo.type}\n`;
  infoServerMessage += `├ 📋 Release: ${serverOsInfo.release}\n`;
  infoServerMessage += `├ 🏷️ Hostname: ${serverOsInfo.hostname}\n`;
  infoServerMessage += `├ 🔄 Endianness: ${serverOsInfo.endianness}\n`;
  infoServerMessage += `├ ⏳ Sistema online há: ${osUptime} horas\n`;
  infoServerMessage += `└ 📅 Hora atual: ${currentServerTime}\n\n`;

  infoServerMessage += `⚡ *Processador (CPU):* 🧠\n`;
  infoServerMessage += `├ 🔢 Núcleos: ${serverCpuCount}\n`;
  infoServerMessage += `├ 🏷️ Modelo: ${serverCpuModel}\n`;
  infoServerMessage += `├ 👤 Tempo usuário: ${serverCpuUser}s\n`;
  infoServerMessage += `├ ⚙️ Tempo sistema: ${serverCpuSystem}s\n`;
  infoServerMessage += `├ 📈 Uso CPU atual: ${cpuPercent}%\n`;
  infoServerMessage += `├ 📊 Load 1min: ${serverLoadAvg[0].toFixed(2)}\n`;
  infoServerMessage += `├ 📈 Load 5min: ${serverLoadAvg[1].toFixed(2)}\n`;
  infoServerMessage += `└ 📉 Load 15min: ${serverLoadAvg[2].toFixed(2)}\n\n`;

  const memoryUsagePercent = (((serverTotalMemory - serverFreeMemory) / serverTotalMemory) * 100).toFixed(1);
  const memoryEmoji = memoryUsagePercent > 80 ? '⚠️' : '✅';
  const memoryBar = '█'.repeat(memoryUsagePercent / 10) + '-'.repeat(10 - memoryUsagePercent / 10);
  infoServerMessage += `💾 *Memória do Sistema:* 🧠\n`;
  infoServerMessage += `├ 🆓 RAM Livre: ${serverFreeMemory} GB\n`;
  infoServerMessage += `├ 📊 RAM Total: ${serverTotalMemory} GB\n`;
  infoServerMessage += `├ 📈 RAM Usada: ${(serverTotalMemory - serverFreeMemory).toFixed(2)} GB\n`;
  infoServerMessage += `└ ${memoryEmoji} Uso: [${memoryBar}] ${memoryUsagePercent}%\n\n`;

  const botMemoryUsagePercent = ((serverMemUsed / serverMemTotal) * 100).toFixed(1);
  const botMemoryEmoji = botMemoryUsagePercent > 80 ? '⚠️' : '✅';
  const botMemoryBar = '█'.repeat(botMemoryUsagePercent / 10) + '-'.repeat(10 - botMemoryUsagePercent / 10);
  infoServerMessage += `🤖 *Memória da ${nomebot}:* 💖\n`;
  infoServerMessage += `├ 🧠 Heap Usado: ${serverMemUsed} MB\n`;
  infoServerMessage += `├ 📦 Heap Total: ${serverMemTotal} MB\n`;
  infoServerMessage += `├ 🏠 RSS: ${serverMemRss} MB\n`;
  infoServerMessage += `├ 🔗 Externo: ${serverMemExternal} MB\n`;
  infoServerMessage += `└ ${botMemoryEmoji} Eficiência: [${botMemoryBar}] ${botMemoryUsagePercent}%\n\n`;

  infoServerMessage += `🌐 *Rede e Conectividade:* 🔗\n`;
  infoServerMessage += `├ 🔌 Interfaces: ${serverInterfaces}\n`;
  infoServerMessage += networkDetails;
  infoServerMessage += `├ 📡 Status: Online\n`;
  infoServerMessage += `├ ⏱️ Latência de Rede: ${networkLatency}\n`;
  infoServerMessage += `└ 🛡️ Firewall: Ativo\n\n`;

  const diskEmoji = diskUsagePercent > 80 ? '⚠️' : '✅';
  const diskBar = '█'.repeat(diskUsagePercent / 10) + '-'.repeat(10 - diskUsagePercent / 10);
  infoServerMessage += `💽 *Armazenamento:* 💿\n`;
  infoServerMessage += `├ 🆓 Livre: ${diskFree} GB\n`;
  infoServerMessage += `├ 📊 Total: ${diskTotal} GB\n`;
  infoServerMessage += `├ 📈 Usado: ${diskUsed} GB\n`;
  infoServerMessage += `└ ${diskEmoji} Uso: [${diskBar}] ${diskUsagePercent}%\n\n`;

  infoServerMessage += `⏰ *Tempo e Latência:* 🕐\n`;
  infoServerMessage += `├ ⏱️ Latência do Bot: ${latency}ms\n`;
  infoServerMessage += `└ 🚀 Bot online há: ${serverUptimeFormatted}\n`;

  await reply(infoServerMessage);
  break;
      
  case 'statusbot':
  case 'infobot':
  case 'botinfo':
  try {
    const botUptime = formatUptime(process.uptime(), true);
    const botMemUsage = process.memoryUsage();
    const memUsed = (botMemUsage.heapUsed / 1024 / 1024).toFixed(2);
    const memTotal = (botMemUsage.heapTotal / 1024 / 1024).toFixed(2);

    const allGroups = await nazu.groupFetchAllParticipating();
    const totalGroups = Object.keys(allGroups).length;
    let totalUsers = 0;
    Object.values(allGroups).forEach(group => {
      totalUsers += group.participants.length;
    });

    const botStatus = botState.status === 'on' ? '✅ Online' : '❌ Offline';
    const rentalMode = isRentalModeActive() ? '✅ Ativo' : '❌ Desativo';
    const nodeVersion = process.version;
    const platform = os.platform();

    let totalCommands = 0;
    try {
      const indexContent = fs.readFileSync(__dirname + '/index.js', 'utf-8');
      const comandos = [...indexContent.matchAll(/case [`'"](\w+)[`'"]/g)].map(m => m[1]);
      totalCommands = comandos.length;
    } catch (e) {
      totalCommands = 'N/A';
    }
    
    const premiumUsers = Object.keys(premiumListaZinha).filter(key => key.includes('@s.whatsapp.net')).length;
    const premiumGroups = Object.keys(premiumListaZinha).filter(key => key.includes('@g.us')).length;
    const blockedUsers = Object.keys(globalBlocks.users || {}).length;
    const blockedCommands = Object.keys(globalBlocks.commands || {}).length;
    
    const currentTime = new Date().toLocaleString('pt-BR', {
      timeZone: 'America/Sao_Paulo'
    });

    const lines = [
      "╭───🤖 STATUS DO BOT ───╮",
      `┊ 🏷️ Nome: ${nomebot}`,
      `┊ 👨‍💻 Dono: ${nomedono}`,
      `┊ 🆚 Versão: ${botVersion}`,
      `┊ 🟢 Status: ${botStatus}`,
      `┊ ⏰ Online há: ${botUptime}`,
      `┊ 🖥️ Plataforma: ${platform}`,
      `┊ 🟢 Node.js: ${nodeVersion}`,
      "┊",
      "┊ 📊 *Estatísticas:*",
      `┊ • 👥 Grupos: ${totalGroups}`,
      `┊ • 👤 Usuários: ${totalUsers}`,
      `┊ • ⚒️ Comandos: ${totalCommands}`,
      `┊ • 💎 Users Premium: ${premiumUsers}`,
      `┊ • 💎 Grupos Premium: ${premiumGroups}`,
      "┊",
      "┊ 🛡️ *Segurança:*",
      `┊ • 🚫 Users Bloqueados: ${blockedUsers}`,
      `┊ • 🚫 Cmds Bloqueados: ${blockedCommands}`,
      `┊ • 🏠 Modo Aluguel: ${rentalMode}`,
      "┊",
      "┊ 💾 *Sistema:*",
      `┊ • 🧠 RAM Usada: ${memUsed}MB`,
      `┊ • 📦 RAM Total: ${memTotal}MB`,
      `┊ • 🕐 Hora Atual: ${currentTime}`,
      "╰───────────────╯"
    ].join("\n");
    
    await reply(lines);
  } catch (e) {
    console.error("Erro em statusbot:", e);
    await reply("🐝 Oh não! Aconteceu um errinho inesperado aqui. Tente de novo daqui a pouquinho, por favor! 🥺");
  };
  break;
  
  case 'topcmd':
  case 'topcmds':
  case 'comandosmaisusados':
  try {
    const topCommands = commandStats.getMostUsedCommands(10);
    const menuVideoPath = __dirname + '/../midias/menu.mp4';
    const menuImagePath = __dirname + '/../midias/menu.jpg';
    const useVideo = fs.existsSync(menuVideoPath);
    const mediaPath = useVideo ? menuVideoPath : menuImagePath;
    const mediaBuffer = fs.readFileSync(mediaPath);
    const menuText = await menuTopCmd(prefix, nomebot, pushname, topCommands);
    await nazu.sendMessage(from, { [useVideo ? 'video' : 'image']: mediaBuffer, caption: menuText, gifPlayback: useVideo, mimetype: useVideo ? 'video/mp4' : 'image/jpeg' }, { quoted: info });
  } catch (e) {
    console.error(e);
    await reply("🐝 Oh não! Aconteceu um errinho inesperado aqui. Tente de novo daqui a pouquinho, por favor! 🥺");
  }
  break;
  
  case 'cmdinfo':
  case 'comandoinfo':
  try {
    if (!q) return reply(`Por favor, especifique um comando para ver suas estatísticas.\nExemplo: ${prefix}cmdinfo menu`);
    
    const cmdName = q.startsWith(prefix) ? q.slice(prefix.length) : q;

    const stats = commandStats.getCommandStats(cmdName);
    
    if (!stats) {
      return reply(`❌ Comando *${cmdName}* não encontrado ou nunca foi usado.`);
    }

    const topUsersText = stats.topUsers.length > 0 ? stats.topUsers.map((user, index) => { return `${index + 1}º @${user.userId.split('@')[0]} - ${user.count} usos`; }).join('\n') : 'Nenhum usuário registrado';
    
    const lastUsed = new Date(stats.lastUsed).toLocaleString('pt-BR');
    
    const infoMessage = `📊 *Estatísticas do Comando: ${prefix}${stats.name}* 📊\n\n` + `📈 *Total de Usos*: ${stats.count}\n` + `👥 *Usuários Únicos*: ${stats.uniqueUsers}\n` + `🕒 *Último Uso*: ${lastUsed}\n\n` + `🏆 *Top Usuários*:\n${topUsersText}\n\n` + `✨ *Bot*: ${nomebot} by ${nomedono} ✨`;
    
    await nazu.sendMessage(from, { text: infoMessage, mentions: stats.topUsers.map(u => u.userId) }, { quoted: info });
    
  } catch (e) {
    console.error(e);
    await reply("🐝 Oh não! Aconteceu um errinho inesperado aqui. Tente de novo daqui a pouquinho, por favor! 🥺");
  }
  break;
  
  case 'statusgp':
  case 'dadosgp':
    try {
      if (!isGroup) 
        return reply("❌ Este comando só funciona em grupos!");

      const meta = await nazu.groupMetadata(from);
      const subject = meta.subject || "—";
      const desc = meta.desc?.toString() || "Sem descrição";
      const createdAt = meta.creation ? new Date(meta.creation * 1000).toLocaleString('pt-BR') : "Desconhecida";

      const ownerJid = meta.owner || meta.participants.find(p => p.admin && p.isCreator)?.id || "unknown@s.whatsapp.net";
      const ownerTag = `@${ownerJid.split('@')[0]}`;

      const totalMembers = meta.participants.length;
      const totalAdmins  = groupAdmins.length;

      let totalMsgs = 0, totalCmds = 0, totalFigs = 0;
      (groupData.contador || []).forEach(u => {
        totalMsgs += u.msg   || 0;
        totalCmds += u.cmd   || 0;
        totalFigs += u.figu  || 0;
      });

      const rentGlob   = isRentalModeActive();
      const rentInfo   = getGroupRentalStatus(from);
      const rentStatus = rentGlob ? (rentInfo.active ? `✅ Ativo até ${rentInfo.permanent ? 'Permanente' : new Date(rentInfo.expiresAt).toLocaleDateString('pt-BR')}` : "❌ Expirado") : "❌ Desativado";
      const isPremGp = !!premiumListaZinha[from] ? "✅" : "❌";

      const toggles = [
        ["Antiporn",       isAntiPorn],
        ["AntiLink",       isAntiLinkGp],
        ["AntiLinkHard",   groupData.antilinkhard],
        ["AntiDoc",        groupData.antidoc],
        ["AntiLoc",        groupData.antiloc],
        ["AutoDL",         groupData.autodl],
        ["AutoSticker",    groupData.autoSticker],
        ["Modo Brincadeira", isModoBn],
        ["Só Admins",      groupData.soadm],
        ["Modo Lite",      isModoLite]
      ].filter(([_,v]) => typeof v === 'boolean').map(([k,v]) => `┊ ${v ? '✅':'❌'} ${k}`).join('\n');
      
      const lines = [
        "╭───📊 STATUS DO GRUPO ───╮",
        `┊ 📝 Nome: ${subject}`,
        `┊ 🆔 ID: ${from.split('@')[0]}`,
        `┊ 👑 Dono: ${ownerTag}`,
        `┊ 📅 Criado: ${createdAt}`,
        `┊ 📄 Desc: ${desc.slice(0,35)}${desc.length>35?'...':''}`,
        `┊ 👥 Membros: ${totalMembers}`,
        `┊ 👮 Admins: ${totalAdmins}`,
        `┊ 💎 Premium: ${isPremGp}`,
        `┊ 🏠 Aluguel: ${rentStatus}`,
        "┊",
        "┊ 📊 *Estatísticas:*",
        `┊ • 💬 Mensagens: ${totalMsgs}`,
        `┊ • ⚒️ Comandos: ${totalCmds}`,
        `┊ • 🎨 Figurinhas: ${totalFigs}`,
        "┊",
        "┊ ⚙️ *Configurações:*",
        toggles,
        "╰───────────────╯"
      ].join("\n");

      await reply(lines, { mentions: [ ownerJid ] });
    } catch (e) {
      console.error("Erro em statusgp:", e);
    await reply("🐝 Oh não! Aconteceu um errinho inesperado aqui. Tente de novo daqui a pouquinho, por favor! 🥺");
  }
  break;
  
  case 'dono':
  try {
    const TextinDonoInfo = `╭⊰ 🌸 『 *INFORMAÇÕES DONO* 』\n┊\n┊👤 *Dono*: ${nomedono}\n┊📱 *Número Dono*: wa.me/${numerodono.replace(/\D/g, '')}\n┊👨‍💻 *Criador*: Hiudy\n┊\n╰─┈┈┈┈┈◜❁◞┈┈┈┈┈─╯`;
    await reply(TextinDonoInfo);
  } catch (e) {
    console.error(e);
    await reply("🐝 Oh não! Aconteceu um errinho inesperado aqui. Tente de novo daqui a pouquinho, por favor! 🥺");
  }
  break;
  
case 'ping':
  try {
    const nodeVersao = process.version;

    const timestamp = Date.now();
    const speedConverted = (timestamp - (info.messageTimestamp * 1000)) / 1000;

    const uptimeBot = formatUptime(process.uptime(), true);
    const uptimeSistema = formatUptime(os.uptime(), true);

    const ramTotalGb = (os.totalmem() / 1024 / 1024 / 1024).toFixed(2);
    const ramLivreGb = (os.freemem() / 1024 / 1024 / 1024).toFixed(2);
    const ramSistemaUsadaGb = (ramTotalGb - ramLivreGb).toFixed(2);
    const ramUsadaPorcentagem = ((ramSistemaUsadaGb / ramTotalGb) * 100).toFixed(0);
    const ramBotProcessoMb = (process.memoryUsage().rss / 1024 / 1024).toFixed(2);

    const criarBarra = (porcentagem, tamanho = 10) => {
      const preenchido = Math.round((porcentagem / 100) * tamanho);
      return '█'.repeat(preenchido) + '░'.repeat(tamanho - preenchido);
    };

    const ramBarra = criarBarra(ramUsadaPorcentagem);

    const isAndroid = () =>
      process.platform === 'android' || process.env.TERMUX_VERSION || fs.existsSync('/system/build.prop');

    let cpuModel = 'Desconhecido';
    let cpuCores = 'N/A';
    let cpuLoad = null;

    const cpus = os.cpus?.() || [];
    if (!isAndroid()) {
      if (cpus.length > 0) {
        const cpuInfo = cpus[0];
        cpuModel = (cpuInfo.model ?? '').replace(/\(R\)/g, '®').replace(/\(TM\)/g, '™') || 'Desconhecido';
        cpuCores = cpus.length;
        cpuLoad = (os.loadavg?.()[0] ?? 0).toFixed(2);
      }
    } else {
      try {
        const info = fs.readFileSync('/proc/cpuinfo', 'utf8');
        const match = info.match(/^Hardware\s*:\s*(.+)$/m) || info.match(/^model name\s*:\s*(.+)$/m);
        if (match) cpuModel = match[1].trim();
        const matches = info.match(/^processor\s*:/gm);
        if (matches) cpuCores = matches.length;
      } catch { }
    }

    const getGroups = await nazu.groupFetchAllParticipating();
    const totalGrupos = Object.keys(getGroups).length;

    let diskSpace = null;
    let diskBarra = null;

    if (!isAndroid()) {
      diskSpace = await getDiskSpaceInfo();
      const diskUsedPercentage = parseFloat(diskSpace.percentUsed);
      diskBarra = criarBarra(diskUsedPercentage);
    }

    let statusEmoji = '🟢';
    let statusTexto = 'Excelente';

    if (speedConverted > 2) {
      statusEmoji = '🟡';
      statusTexto = 'Bom';
    }
    if (speedConverted > 5) {
      statusEmoji = '🟠';
      statusTexto = 'Médio';
    }
    if (speedConverted > 8) {
      statusEmoji = '🔴';
      statusTexto = 'Ruim';
    }

    let mensagem = `
╭━━「 ${statusEmoji} *STATUS DO BOT* ${statusEmoji} 」
┊
┊ 🤖 *Informações do Bot*
┊ ├ 📛 Nome: *${nomebot}*
┊ ├ 🔰 Versão: *${botVersion}*
┊ ├ 🔑 Prefixo: *${prefixo}*
┊ ├ 👑 Dono: *${nomedono}*
┊ ├ 📊 Grupos: *${totalGrupos}*
┊ ╰ ⏱️ Online há: *${uptimeBot}*
┊
┊ 📡 *Conexão* ${statusEmoji}
┊ ├ 📶 Latência: *${speedConverted.toFixed(3)}s*
┊ ╰ 📊 Status: *${statusTexto}*
┊
┊ 💻 *Sistema*
┊ ├ 🏢 OS: *${os.platform()} (${os.release()})*
┊ ├ 🔩 Arquitetura: *${os.arch()}*
┊ ├ 🧠 Processador: *${cpuModel}*
┊ ├ 📊 Núcleos: *${cpuCores}*
`;

    if (!isAndroid() && cpuLoad !== null) {
      mensagem += `┊ ├ ⚙️ Carga CPU: *${cpuLoad}%*\n`;
    }

    mensagem += `┊ ╰ ⏱️ Uptime: *${uptimeSistema}*\n\n`;

    mensagem += `┊ 📊 *Recursos*\n`;
    mensagem += `┊ ├ ${ramBarra} RAM: *${ramSistemaUsadaGb}/${ramTotalGb} GB (${ramUsadaPorcentagem}%)*\n`;
    mensagem += `┊ ├ 💾 RAM Bot: *${ramBotProcessoMb} MB*\n`;

    if (!isAndroid() && diskBarra !== null && diskSpace !== null) {
      mensagem += `┊ ├ ${diskBarra} Disco: *${diskSpace.usedGb}/${diskSpace.totalGb} GB (${diskSpace.percentUsed})*\n`;
    }

    mensagem += `┊ ╰ 🔄 Node.js: *${nodeVersao}*\n`;
    mensagem += `┊\n╰━━「 ${nomebot} 」`;

    mensagem = mensagem.trim();

    const pingImageUrl = `https://api.cognima.com.br/api/banner/counter?key=CognimaTeamFreeKey&num=${String(speedConverted.toFixed(3)).replace('.', '')}&theme=original`;

    await nazu.sendMessage(from, { image: { url: pingImageUrl }, caption: mensagem }, { quoted: info });

  } catch (e) {
    console.error("Erro no comando ping:", e);
    await reply("❌ Ocorreu um erro ao processar o comando ping");
  };
  break;

  case 'toimg':
  if(!isQuotedSticker) return reply('Por favor, *mencione um sticker* para executar o comando.');
  try {
  buff = await getFileBuffer(info.message.extendedTextMessage.contextInfo.quotedMessage.stickerMessage, 'sticker');
  await nazu.sendMessage(from, {image: buff}, {quoted: info});
  } catch(error) {
  await reply("🐝 Oh não! Aconteceu um errinho inesperado aqui. Tente de novo daqui a pouquinho, por favor! 🥺");
  };
  break

  case 'qc': try {
  if(!q) return reply('Falta o texto.');
   let ppimg = "";
   try {
   ppimg = await nazu.profilePictureUrl(sender, 'image');
   } catch {
   ppimg = 'https://telegra.ph/file/b5427ea4b8701bc47e751.jpg'
   };
  const json = {"type": "quote","format": "png","backgroundColor": "#FFFFFF","width": 512,"height": 768,"scale": 2,"messages": [{"entities": [],"avatar": true,"from": {"id": 1,"name": pushname,"photo": {"url": ppimg}},"text": q,"replyMessage": {}}]};
  res = await axios.post('https://bot.lyo.su/quote/generate', json, {headers: {'Content-Type': 'application/json'}});
  await sendSticker(nazu, from, { sticker: Buffer.from(res.data.result.image, 'base64'), author: `『${pushname}』\n『${nomebot}』\n『${nomedono}』\n『cognima.com.br』`, packname: '👤 Usuario(a)ᮀ۟❁’￫\n🤖 Botᮀ۟❁’￫\n👑 Donoᮀ۟❁’￫\n🌐 Siteᮀ۟❁’￫', type: 'image' }, {quoted: info });
  } catch(e) {
  console.error(e);
  await reply("🐝 Oh não! Aconteceu um errinho inesperado aqui. Tente de novo daqui a pouquinho, por favor! 🥺");
  };
  break;
  
  case 'emojimix': try {
  emoji1 = q.split(`/`)[0];emoji2 = q.split(`/`)[1];
  if(!q || !emoji1 || !emoji2) return reply(`Formato errado, utilize:\n${prefix}${command} emoji1/emoji2\nEx: ${prefix}${command} 🤓/🙄`);
  datzc = await emojiMix(emoji1, emoji2);
  await sendSticker(nazu, from, { sticker: {url: datzc}, author: `『${pushname}』\n『${nomebot}』\n『${nomedono}』\n『cognima.com.br』`, packname: '👤 Usuario(a)ᮀ۟❁’￫\n🤖 Botᮀ۟❁’￫\n👑 Donoᮀ۟❁’￫\n🌐 Siteᮀ۟❁’￫', type: 'image'}, { quoted: info });
  } catch(e) {
  console.error(e);
  await reply("🐝 Oh não! Aconteceu um errinho inesperado aqui. Tente de novo daqui a pouquinho, por favor! 🥺");
  };
  break;
  
  case 'ttp': try {
  if(!q) return reply('Cadê o texto?');
  cor = ["f702ff","ff0202","00ff2e","efff00","00ecff","3100ff","ffb400","ff00b0","00ff95","efff00"];
  fonte = ["Days%20One","Domine","Exo","Fredoka%20One","Gentium%20Basic","Gloria%20Hallelujah","Great%20Vibes","Orbitron","PT%20Serif","Pacifico"];
  cores = cor[Math.floor(Math.random() * (cor.length))];
  fontes = fonte[Math.floor(Math.random() * (fonte.length))];
  await sendSticker(nazu, from, { sticker: {url: `https://huratera.sirv.com/PicsArt_08-01-10.00.42.png?profile=Example-Text&text.0.text=${q}&text.0.outline.color=000000&text.0.outline.blur=0&text.0.outline.opacity=55&text.0.color=${cores}&text.0.font.family=${fontes}&text.0.background.color=ff0000`}, author: `『${pushname}』\n『${nomebot}』\n『${nomedono}』\n『cognima.com.br』`, packname: '👤 Usuario(a)ᮀ۟❁’￫\n🤖 Botᮀ۟❁’￫\n👑 Donoᮀ۟❁’￫\n🌐 Siteᮀ۟❁’￫', type: 'image'}, { quoted: info });
  } catch(e) {
  console.error(e);
  await reply("🐝 Oh não! Aconteceu um errinho inesperado aqui. Tente de novo daqui a pouquinho, por favor! 🥺");
  };
  break;
  
  case 'brat': try {
  if(!q) return reply('falta o texto');
  await sendSticker(nazu, from, { sticker: {url: `https://api.cognima.com.br/api/image/brat?key=CognimaTeamFreeKey&texto=${encodeURIComponent(q)}`}, author: `『${pushname}』\n『${nomebot}』\n『${nomedono}』\n『cognima.com.br』`, packname: '👤 Usuario(a)ᮀ۟❁’￫\n🤖 Botᮀ۟❁’￫\n👑 Donoᮀ۟❁’￫\n🌐 Siteᮀ۟❁’￫', type: 'image'}, { quoted: info });
  } catch(e) {
  console.error(e);
  };
  break;
  
  case 'st':case 'stk':case 'sticker':case 's': try {
    var RSM = info.message?.extendedTextMessage?.contextInfo?.quotedMessage;
    var boij2 = RSM?.imageMessage || info.message?.imageMessage || RSM?.viewOnceMessageV2?.message?.imageMessage || info.message?.viewOnceMessageV2?.message?.imageMessage || info.message?.viewOnceMessage?.message?.imageMessage || RSM?.viewOnceMessage?.message?.imageMessage;
   var boij = RSM?.videoMessage || info.message?.videoMessage || RSM?.viewOnceMessageV2?.message?.videoMessage || info.message?.viewOnceMessageV2?.message?.videoMessage || info.message?.viewOnceMessage?.message?.videoMessage || RSM?.viewOnceMessage?.message?.videoMessage;
    if (!boij && !boij2) return reply(`Marque uma imagem ou um vídeo de até 9.9 segundos para fazer figurinha, com o comando: ${prefix + command} (mencionando a mídia)`);
    var isVideo2 = !!boij;
    if (isVideo2 && boij.seconds > 9.9) return reply(`O vídeo precisa ter no máximo 9.9 segundos para ser convertido em figurinha.`);
    var buffer = await getFileBuffer(isVideo2 ? boij : boij2, isVideo2 ? 'video' : 'image')
    await sendSticker(nazu, from, { sticker: buffer, author: `『${pushname}』\n『${nomebot}』\n『${nomedono}』\n『cognima.com.br』`, packname: '👤 Usuario(a)ᮀ۟❁’￫\n🤖 Botᮀ۟❁’￫\n👑 Donoᮀ۟❁’￫\n🌐 Siteᮀ۟❁’￫', type: isVideo2 ? 'video' : 'image'}, { quoted: info });
  } catch(e) {
  console.error(e);
  await reply("🐝 Oh não! Aconteceu um errinho inesperado aqui. Tente de novo daqui a pouquinho, por favor! 🥺");
  };
  break
  
  case 'st2':case 'stk2':case 'sticker2':case 's2': try {
    var RSM = info.message?.extendedTextMessage?.contextInfo?.quotedMessage;
    var boij2 = RSM?.imageMessage || info.message?.imageMessage || RSM?.viewOnceMessageV2?.message?.imageMessage || info.message?.viewOnceMessageV2?.message?.imageMessage || info.message?.viewOnceMessage?.message?.imageMessage || RSM?.viewOnceMessage?.message?.imageMessage;
   var boij = RSM?.videoMessage || info.message?.videoMessage || RSM?.viewOnceMessageV2?.message?.videoMessage || info.message?.viewOnceMessageV2?.message?.videoMessage || info.message?.viewOnceMessage?.message?.videoMessage || RSM?.viewOnceMessage?.message?.videoMessage;
    if (!boij && !boij2) return reply(`Marque uma imagem ou um vídeo de até 9.9 segundos para fazer figurinha, com o comando: ${prefix + command} (mencionando a mídia)`);
    var isVideo2 = !!boij;
    if (isVideo2 && boij.seconds > 9.9) return reply(`O vídeo precisa ter no máximo 9.9 segundos para ser convertido em figurinha.`);
    var buffer = await getFileBuffer(isVideo2 ? boij : boij2, isVideo2 ? 'video' : 'image')
    await sendSticker(nazu, from, { sticker: buffer, author: `『${pushname}』\n『${nomebot}』\n『${nomedono}』\n『cognima.com.br』`, packname: '👤 Usuario(a)ᮀ۟❁’￫\n🤖 Botᮀ۟❁’￫\n👑 Donoᮀ۟❁’￫\n🌐 Siteᮀ۟❁’￫', type: isVideo2 ? 'video' : 'image', forceSquare: true}, { quoted: info });
  } catch(e) {
  console.error(e);
  await reply("🐝 Oh não! Aconteceu um errinho inesperado aqui. Tente de novo daqui a pouquinho, por favor! 🥺");
  };
  break

  case 'figualeatoria':case 'randomsticker': try {
    await nazu.sendMessage(from, { sticker: { url: `https://raw.githubusercontent.com/badDevelopper/Testfigu/main/fig (${Math.floor(Math.random() * 8051)}).webp`}}, {quoted: info});
  } catch(e) {
    console.error(e);
    await reply("🐝 Oh não! Aconteceu um errinho inesperado aqui. Tente de novo daqui a pouquinho, por favor! 🥺");
  };
  break;
  
  case 'rename':case 'roubar': try {
   if(!isQuotedSticker) return reply('Você usou de forma errada... Marque uma figurinha.')
   author = q.split(`/`)[0];packname = q.split(`/`)[1];
   if(!q || !author || !packname) return reply(`Formato errado, utilize:\n${prefix}${command} Autor/Pack\nEx: ${prefix}${command} By:/Hiudy`);
   encmediats = await getFileBuffer(info.message.extendedTextMessage.contextInfo.quotedMessage.stickerMessage, 'sticker');
   await sendSticker(nazu, from, { sticker: `data:image/jpeg;base64,${encmediats.toString('base64')}`, author: packname, packname: author, rename: true}, { quoted: info });
  } catch(e) {
  console.error(e);
  await reply("🐝 Oh não! Aconteceu um errinho inesperado aqui. Tente de novo daqui a pouquinho, por favor! 🥺");
  };
  break;
  
  case 'rgtake': try {
  const [author, pack] = q.split('/');
  if (!q || !author || !pack) return reply(`Formato errado, utilize:\n${prefix}${command} Autor/Pack\nEx: ${prefix}${command} By:/Hiudy`);
  const filePath = __dirname + '/../database/users/take.json';
  const dataTake = fs.existsSync(filePath) ? JSON.parse(fs.readFileSync(filePath, 'utf-8')) : {};
  dataTake[sender] = { author, pack };
  fs.writeFileSync(filePath, JSON.stringify(dataTake, null, 2), 'utf-8');
  reply(`Autor e pacote salvos com sucesso!\nAutor: ${author}\nPacote: ${pack}`);
  } catch(e) {
  console.error(e);
  await reply("🐝 Oh não! Aconteceu um errinho inesperado aqui. Tente de novo daqui a pouquinho, por favor! 🥺");
  };
  break;
  
  case 'take': try {
  if (!isQuotedSticker) return reply('Você usou de forma errada... Marque uma figurinha.');
  const filePath = __dirname + '/../database/users/take.json';
  if (!fs.existsSync(filePath)) return reply('Nenhum autor e pacote salvos. Use o comando *rgtake* primeiro.');
  const dataTake = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
  if (!dataTake[sender]) return reply('Você não tem autor e pacote salvos. Use o comando *rgtake* primeiro.');
  const { author, pack } = dataTake[sender];
  const encmediats = await getFileBuffer(info.message.extendedTextMessage.contextInfo.quotedMessage.stickerMessage, 'sticker');
  await sendSticker(nazu, from, { sticker: `data:image/jpeg;base64,${encmediats.toString('base64')}`, author: pack, packname: author, rename: true }, { quoted: info });
  } catch(e) {
  console.error(e);
  await reply("🐝 Oh não! Aconteceu um errinho inesperado aqui. Tente de novo daqui a pouquinho, por favor! 🥺");
  };
  break;
  
  case 'mention':
  try {
    if (!isGroup) return reply("isso so pode ser usado em grupo 💔");
    if (!q) return reply(`📢 *Configuração de Marcações*\n\n🔧 Escolha como deseja ser mencionado:\n\n✅ *${prefix}mention all* → Marcado em tudo (marcações e jogos).\n📢 *${prefix}mention marca* → Apenas em marcações de administradores.\n🎮 *${prefix}mention games* → Somente em jogos do bot.\n🚫 *${prefix}mention 0* → Não será mencionado em nenhuma ocasião.`);
    let options = {  all: '✨ Você agora será mencionado em todas as interações do bot, incluindo marcações de administradores e os jogos!', marca: '📢 A partir de agora, você será mencionado apenas quando um administrador marcar.',games: '🎮 Você optou por ser mencionado somente em jogos do bot.', 0: '🔕 Silêncio ativado! Você não será mais mencionado pelo bot, nem em marcações nem em jogos.'};
    if (options[q.toLowerCase()] !== undefined) {
      if(!groupData.mark) groupData.mark = {};
      groupData.mark[sender] = q.toLowerCase();
      fs.writeFileSync(__dirname + `/../database/grupos/${from}.json`, JSON.stringify(groupData, null, 2));
      return reply(`*${options[q.toLowerCase()]}*`);
    }

    reply(`❌ Opção inválida! Use *${prefix}mention* para ver as opções.`);
  } catch (e) {
    console.error(e);
    reply("ocorreu um erro 💔");
  }
  break;

  case 'deletar': case 'delete': case 'del':  case 'd':
  if (!isGroupAdmin) return reply("Comando restrito a Administradores ou Moderadores com permissão. 💔");
  if(!menc_prt) return reply("Marque uma mensagem.");
  let stanzaId, participant;
    if (info.message.extendedTextMessage) {
        stanzaId = info.message.extendedTextMessage.contextInfo.stanzaId;
        participant = info.message.extendedTextMessage.contextInfo.participant || menc_prt;
    } else if (info.message.viewOnceMessage) {
        stanzaId = info.key.id;
        participant = info.key.participant || menc_prt;
    };
    try {
        await nazu.sendMessage(from, { delete: { remoteJid: from, fromMe: false, id: stanzaId, participant: participant } });
    } catch (error) {
        reply("ocorreu um erro 💔");
    };
  break

 case 'blockuser':
  if (!isGroup) return reply("isso so pode ser usado em grupo 💔");
  if (!isGroupAdmin) return reply("você precisa ser adm 💔");
  try {
    if (!menc_os2) return reply("Marque alguém 🙄");
    reason = q  ? q.includes('@')  ? q.includes(' ') ? q.split(' ').slice(1).join(' ')  : "Não informado" : q : 'Não informado';
    menc_os3 = menc_os2.includes(' ') ? menc_os2.split(' ')[0] : menc_os2;
    groupData.blockedUsers = groupData.blockedUsers || {};
    groupData.blockedUsers[menc_os3] = { reason, timestamp: Date.now() };
    fs.writeFileSync(groupFile, JSON.stringify(groupData, null, 2));
    await reply(`✅ Usuário @${menc_os3.split('@')[0]} bloqueado no grupo!\nMotivo: ${reason}`, { mentions: [menc_os3] });
  } catch (e) {
    console.error(e);
    await reply("🐝 Oh não! Aconteceu um errinho inesperado aqui. Tente de novo daqui a pouquinho, por favor! 🥺");
  };
  break;

  case 'unblockuser':
  if (!isGroup) return reply("isso so pode ser usado em grupo 💔");
  if (!isGroupAdmin) return reply("você precisa ser adm 💔");
  try {
    if (!menc_os2) return reply("Marque alguém 🙄");
    if (!groupData.blockedUsers || (!groupData.blockedUsers[menc_os2] && !groupData.blockedUsers[menc_os2.split('@')[0]])) return reply(`❌ O usuário @${menc_os2.split('@')[0]} não está bloqueado no grupo!`, { mentions: [menc_os2] });
    if (!delete groupData.blockedUsers[menc_os2]) {
    delete groupData.blockedUsers[menc_os2.split('@')[0]];
    }
    fs.writeFileSync(groupFile, JSON.stringify(groupData, null, 2));
    await reply(`✅ Usuário @${menc_os2.split('@')[0]} desbloqueado no grupo!`, { mentions: [menc_os2] });
  } catch (e) {
    console.error(e);
    await reply("🐝 Oh não! Aconteceu um errinho inesperado aqui. Tente de novo daqui a pouquinho, por favor! 🥺");
  }
  break;

  case 'listblocksgp': case 'blocklist':
  if (!isGroup) return reply("isso so pode ser usado em grupo 💔");
  if (!isGroupAdmin) return reply("você precisa ser adm 💔");
  try {
    const blockedUsers = groupData.blockedUsers ? Object.entries(groupData.blockedUsers).map(([user, data]) => `👤 *${user.split('@')[0]}* - Motivo: ${data.reason}`).join('\n') : 'Nenhum usuário bloqueado no grupo.';
    const message = `🔒 *Usuários Bloqueados no Grupo - ${groupName}* 🔒\n\n${blockedUsers}`;
    await reply(message);
  } catch (e) {
    console.error(e);
    await reply("🐝 Oh não! Aconteceu um errinho inesperado aqui. Tente de novo daqui a pouquinho, por favor! 🥺");
  }
  break;

  case 'banir':
  case 'ban':
  case 'b':
  case 'kick':
  try {
    if (!isGroup) return reply("isso so pode ser usado em grupo 💔");
    if (!isGroupAdmin) return reply("Comando restrito a Administradores ou Moderadores com permissão. 💔");
    if (!isBotAdmin) return reply("Eu preciso ser adm 💔");
    if (!menc_os2) return reply("Marque alguém 🙄");
    if (menc_os2 === nmrdn) return reply("❌ Não posso banir o dono do bot.");
    await nazu.groupParticipantsUpdate(from, [menc_os2], 'remove');
    reply(`✅ Usuário banido com sucesso!${(q && q.length > 0) ? '\n\nMotivo: '+q : ''}`);
  } catch (e) {
    console.error(e);
    reply("ocorreu um erro 💔");
  }
  break;
  
    case 'linkgp':
    case 'linkgroup': try {
    if (!isGroup) return reply("isso so pode ser usado em grupo 💔");
    if (!isGroupAdmin) return reply("Comando restrito a Administradores ou Moderadores com permissão. 💔");
    if (!isBotAdmin) return reply("Eu preciso ser adm 💔");
    linkgc = await nazu.groupInviteCode(from)
    await reply('https://chat.whatsapp.com/'+linkgc)
    } catch(e) {
    console.error(e);
    await reply("🐝 Oh não! Aconteceu um errinho inesperado aqui. Tente de novo daqui a pouquinho, por favor! 🥺");
    };
    break

  case 'promover': case 'promote':
  try {
    if (!isGroup) return reply("isso so pode ser usado em grupo 💔");
    if (!isGroupAdmin) return reply("Comando restrito a Administradores ou Moderadores com permissão. 💔");
    if (!isBotAdmin) return reply("Eu preciso ser adm 💔");
    if (!menc_os2) return reply("Marque alguém 🙄");
    await nazu.groupParticipantsUpdate(from, [menc_os2], 'promote');
    reply(`✅ Usuário promovido a administrador!`);
  } catch (e) {
    console.error(e);
    reply("ocorreu um erro 💔");
  }
  break;

  case 'rebaixar': case 'demote':
  try {
    if (!isGroup) return reply("isso so pode ser usado em grupo 💔");
    if (!isGroupAdmin) return reply("Comando restrito a Administradores ou Moderadores com permissão. 💔");
    if (!isBotAdmin) return reply("Eu preciso ser adm 💔");
    if (!menc_os2) return reply("Marque alguém 🙄");
    await nazu.groupParticipantsUpdate(from, [menc_os2], 'demote');
    reply(`✅ Usuário rebaixado com sucesso!`);
  } catch (e) {
    console.error(e);
    reply("ocorreu um erro 💔");
  }
  break;

  case 'setname':
  try {
    if (!isGroup) return reply("isso so pode ser usado em grupo 💔");
    if (!isGroupAdmin) return reply("Comando restrito a Administradores ou Moderadores com permissão. 💔");
    if (!isBotAdmin) return reply("Eu preciso ser adm 💔");
    const newName = q.trim();
    if (!newName) return reply('❌ Digite um novo nome para o grupo.');
    await nazu.groupUpdateSubject(from, newName);
    reply(`✅ Nome do grupo alterado para: *${newName}*`);
  } catch (e) {
    console.error(e);
    reply("ocorreu um erro 💔");
  }
  break;

  case 'setdesc':
  try {
    if (!isGroup) return reply("isso so pode ser usado em grupo 💔");
    if (!isGroupAdmin) return reply("Comando restrito a Administradores ou Moderadores com permissão. 💔");
    if (!isBotAdmin) return reply("Eu preciso ser adm 💔");
    const newDesc = q.trim();
    if (!newDesc) return reply('❌ Digite uma nova descrição para o grupo.');
    await nazu.groupUpdateDescription(from, newDesc);
    reply(`✅ Descrição do grupo alterada!`);
  } catch (e) {
    console.error(e);
    reply("ocorreu um erro 💔");
  }
  break;
  
  case 'marcar': case 'mark':
  if (!isGroup) return reply("isso so pode ser usado em grupo 💔");
  if (!isGroupAdmin) return reply("Comando restrito a Administradores ou Moderadores com permissão. 💔");
  if (!isBotAdmin) return reply("Eu preciso ser adm 💔");
  try {
    let path = __dirname + '/../database/grupos/' + from + '.json';
    let data = fs.existsSync(path) ? JSON.parse(fs.readFileSync(path)) : { mark: {} };
    if(!data.mark) data.mark = {};
    let membros = AllgroupMembers.filter(m => !['0', 'games'].includes(data.mark[m]));
    if (!membros.length) return reply('❌ Nenhum membro para mencionar.');
    let msg = `📢 *Membros mencionados:* ${q ? `\n💬 *Mensagem:* ${q}` : ''}\n\n`;
    await nazu.sendMessage(from, {text: msg + membros.map(m => `➤ @${m.split('@')[0]}`).join('\n'), mentions: membros});
  } catch (e) {
    console.error(e);
    reply("ocorreu um erro 💔");
  }
  break;
  
  case 'fechargp': case 'closegp':
  try {
    if (!isGroup) return reply("Este comando só funciona em grupos.");
    if (!isGroupAdmin) return reply("Apenas administradores podem agendar o fechamento do grupo.");
    if (!isBotAdmin) return reply("⚠️ Eu preciso ser administrador para fechar o grupo!");
    if (!q) return reply(`Por favor, forneça o horário no formato HH:MM. Exemplo: ${groupPrefix}fechargp 22:00`);

    const [hour, minute] = q.split(':').map(n => parseInt(n.trim()));
    if (isNaN(hour) || isNaN(minute) || hour < 0 || hour > 23 || minute < 0 || minute > 59) {
      return reply("🤔 Formato de horário inválido! Use HH:MM (ex: 22:00).");
    }

    const actions = loadJsonFile(DIR_PROGRAM, []);
    actions.push({
      tipo: 'acao_repetida',
      acao: 'FECHAR_GRUPO',
      frequencia: 'diaria',
      from: from,
      sender: sender,
      hora: { hora: String(hour).padStart(2, '0'), minuto: String(minute).padStart(2, '0') }
    });
    
    fs.writeFileSync(DIR_PROGRAM, JSON.stringify(actions, null, 2));
    await reply(`✅ Grupo será fechado diariamente às ${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')} (BRT)!`);
  } catch (e) {
    console.error('Erro no comando fechargp:', e);
    await reply("Ocorreu um erro ao agendar o fechamento do grupo 💔");
  }
  break;

  case 'abrirgp': case 'opengp':
  try {
    if (!isGroup) return reply("Este comando só funciona em grupos.");
    if (!isGroupAdmin) return reply("Apenas administradores podem agendar a abertura do grupo.");
    if (!isBotAdmin) return reply("⚠️ Eu preciso ser administrador para abrir o grupo!");
    if (!q) return reply(`Por favor, forneça o horário no formato HH:MM. Exemplo: ${groupPrefix}abrirgp 08:00`);

    const [hour, minute] = q.split(':').map(n => parseInt(n.trim()));
    if (isNaN(hour) || isNaN(minute) || hour < 0 || hour > 23 || minute < 0 || minute > 59) {
      return reply("🤔 Formato de horário inválido! Use HH:MM (ex: 08:00).");
    }

    const actions = loadJsonFile(DIR_PROGRAM, []);
    actions.push({
      tipo: 'acao_repetida',
      acao: 'ABRIR_GRUPO',
      frequencia: 'diaria',
      from: from,
      sender: sender,
      hora: { hora: String(hour).padStart(2, '0'), minuto: String(minute).padStart(2, '0') }
    });
    
    fs.writeFileSync(DIR_PROGRAM, JSON.stringify(actions, null, 2));
    await reply(`✅ Grupo será aberto diariamente às ${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')} (BRT)!`);
  } catch (e) {
    console.error('Erro no comando abrirgp:', e);
    await reply("Ocorreu um erro ao agendar a abertura do grupo 💔");
  }
  break;

  case 'grupo': case 'gp': case 'group': try {
  if (!isGroup) return reply("isso so pode ser usado em grupo 💔");
  if (!isGroupAdmin) return reply("Comando restrito a Administradores ou Moderadores com permissão. 💔");
  if (!isBotAdmin) return reply("Eu preciso ser adm 💔");
  if(q.toLowerCase() === 'a' || q.toLowerCase() === 'o' || q.toLowerCase() === 'open' || q.toLowerCase() === 'abrir') {
  await nazu.groupSettingUpdate(from, 'not_announcement');
  await reply('Grupo aberto.');
  } else if(q.toLowerCase() === 'f' || q.toLowerCase() === 'c' || q.toLowerCase() === 'close' || q.toLowerCase() === 'fechar') {
  await nazu.groupSettingUpdate(from, 'announcement');
  await reply('Grupo fechado.');
  }} catch(e) {
  console.error(e);
  await reply("🐝 Oh não! Aconteceu um errinho inesperado aqui. Tente de novo daqui a pouquinho, por favor! 🥺");
  };
  break
  
  case 'sorteio': case 'sortear': case 'raffle':
  if (!isGroup) return reply("isso so pode ser usado em grupo 💔");
  if (!isGroupAdmin) return reply("Comando restrito a Administradores ou Moderadores com permissão. 💔");
  if (!isBotAdmin) return reply("Eu preciso ser adm 💔");
  if(!q) return reply(`❌ Digite os dados após o comando...\n${prefix}${command} Dados Sorteio | Ganhadores\n\nExemplos:\n${prefix}${command} 100 Reais\n${prefix}${command} 100 Reais | 2`);
  try {
    if(q.includes('|')) {
      const quantidadeMenb = Number(q.split('|')[1]);
      let TextSort = `🥳 Parabéns aos ganhadores do sorteio\n\n💰 Prêmio: ${q.split('|')[0]}\n👑 Ganhadores: `;
      let MentionsSort = [];
      let TextArray = [];
      for(i=0;i<quantidadeMenb;i++) {
        const menb = AllgroupMembers[Math.floor(Math.random() * AllgroupMembers.length)];
        if(!MentionsSort.includes(menb)) {
          TextArray.push(`@${menb.split('@')[0]}`);
        } else {
          i--;
        };
      };
      TextSort += TextArray.join(', ');
      await nazu.sendMessage(from, {text: TextSort, mentions: MentionsSort});
    } else {
      const menb = AllgroupMembers[Math.floor(Math.random() * AllgroupMembers.length)];
      await nazu.sendMessage(from, {text: `🥳 Parabéns ao ganhador do sorteio\n\n💰 Prêmio: ${q}\n👑 Ganhador: @${menb.split('@')[0]}`, mentions: [menb]});
    };
  } catch(error) {
    console.error(error);
    await reply("🐝 Oh não! Aconteceu um errinho inesperado aqui. Tente de novo daqui a pouquinho, por favor! 🥺");
  };
  break
  
  case 'totag':
  case 'cita':
  case 'hidetag': try {
  if (!isGroup) return reply("isso so pode ser usado em grupo 💔");
  if (!isGroupAdmin) return reply("Comando restrito a Administradores ou Moderadores com permissão. 💔");
  if (!isBotAdmin) return reply("Eu preciso ser adm 💔");
    
    var DFC4 = "";
    var rsm4 = info.message?.extendedTextMessage?.contextInfo?.quotedMessage;
    var pink4 = isQuotedImage ? rsm4?.imageMessage : info.message?.imageMessage;
    var blue4 = isQuotedVideo ? rsm4?.videoMessage : info.message?.videoMessage;
    var purple4 = isQuotedDocument ? rsm4?.documentMessage : info.message?.documentMessage;
    var yellow4 = isQuotedDocW ? rsm4?.documentWithCaptionMessage?.message?.documentMessage : info.message?.documentWithCaptionMessage?.message?.documentMessage;
    var aud_d4 = isQuotedAudio ? rsm4.audioMessage : "";
    var figu_d4 = isQuotedSticker ? rsm4.stickerMessage : "";
    var red4 = isQuotedMsg && !aud_d4 && !figu_d4 && !pink4 && !blue4 && !purple4 && !yellow4 ? rsm4.conversation : info.message?.conversation;
    var green4 = rsm4?.extendedTextMessage?.text || info?.message?.extendedTextMessage?.text;
    let path = __dirname + '/../database/grupos/' + from + '.json';
    let data = fs.existsSync(path) ? JSON.parse(fs.readFileSync(path)) : { mark: {} };
    if(!data.mark) data.mark = {};
    var MRC_TD4 = AllgroupMembers.filter(m => !['0', 'games'].includes(data.mark[m]));

    if (pink4 && !aud_d4 && !purple4) {
        var DFC4 = pink4;
        pink4.caption = q.length > 1 ? q : pink4.caption.replace(new RegExp(prefix + command, "gi"), ` `);
        pink4.image = { url: pink4.url };
        pink4.mentions = MRC_TD4;
    } else if (blue4 && !aud_d4 && !purple4) {
        var DFC4 = blue4;
        blue4.caption = q.length > 1 ? q.trim() : blue4.caption.replace(new RegExp(prefix + command, "gi"), ` `).trim();
        blue4.video = { url: blue4.url };
        blue4.mentions = MRC_TD4;
    } else if (red4 && !aud_d4 && !purple4) {
        var black4 = {};
        black4.text = red4.replace(new RegExp(prefix + command, "gi"), ` `).trim();
        black4.mentions = MRC_TD4;
        var DFC4 = black4;
    } else if (!aud_d4 && !figu_d4 && green4 && !purple4) {
        var brown4 = {};
        brown4.text = green4.replace(new RegExp(prefix + command, "gi"), ` `).trim();
        brown4.mentions = MRC_TD4;
        var DFC4 = brown4;
    } else if (purple4) {
        var DFC4 = purple4;
        purple4.document = { url: purple4.url };
        purple4.mentions = MRC_TD4;
    } else if (yellow4 && !aud_d4) {
        var DFC4 = yellow4;
        yellow4.caption = q.length > 1 ? q.trim() : yellow4.caption.replace(new RegExp(prefix + command, "gi"), `${pushname}\n\n`).trim();
        yellow4.document = { url: yellow4.url };
        yellow4.mentions = MRC_TD4;
    } else if (figu_d4 && !aud_d4) {
        var DFC4 = figu_d4;
        figu_d4.sticker = { url: figu_d4.url };
        figu_d4.mentions = MRC_TD4;
    } else if (aud_d4) {
        var DFC4 = aud_d4;
        aud_d4.audio = { url: aud_d4.url };
        aud_d4.mentions = MRC_TD4;
        aud_d4.ptt = true;
    };
    await nazu.sendMessage(from, DFC4).catch((error) => {});
    } catch(e) {
    console.error(e);
    await reply("🐝 Oh não! Aconteceu um errinho inesperado aqui. Tente de novo daqui a pouquinho, por favor! 🥺");
    };
    break;

   case 'antilinkhard':
  try {
    if (!isGroup) return reply("Isso só pode ser usado em grupo 💔");
    if (!isGroupAdmin) return reply("Você precisa ser adm 💔");
    if (!isBotAdmin) return reply("Eu preciso ser adm para isso 💔");
    groupData.antilinkhard = !groupData.antilinkhard;
    fs.writeFileSync(groupFile, JSON.stringify(groupData, null, 2));
    await reply(`✅ Antilinkhard ${groupData.antilinkhard ? 'ativado' : 'desativado'}! Qualquer link enviado resultará em banimento.`);
  } catch (e) {
    console.error(e);
    await reply("Ocorreu um erro 💔");
  }
  break;
  
  case 'antidelete':
  try {
    if (!isGroup) return reply("Isso só pode ser usado em grupo 💔");
    if (!isGroupAdmin) return reply("Você precisa ser adm 💔");
    if (!isBotAdmin) return reply("Eu preciso ser adm para isso 💔");
    groupData.antidel = !groupData.antidel;
    fs.writeFileSync(groupFile, JSON.stringify(groupData, null, 2));
    await reply(`✅ Antidelete ${groupData.antidel ? 'ativado' : 'desativado'}!`);
  } catch (e) {
    console.error(e);
    await reply("Ocorreu um erro 💔");
  }
  break;

  case 'autodl':
  try {
    if (!isGroup) return reply("Isso só pode ser usado em grupo 💔");
    if (!isGroupAdmin) return reply("Você precisa ser adm 💔");
    groupData.autodl = !groupData.autodl;
    fs.writeFileSync(groupFile, JSON.stringify(groupData, null, 2));
    await reply(`✅ Autodl ${groupData.autodl ? 'ativado' : 'desativado'}! Links suportados serão baixados automaticamente.`);
  } catch (e) {
    console.error(e);
    await reply("Ocorreu um erro 💔");
  }
  break;
  
  case 'cmdlimit':
  try {
    if (!isGroup) return reply("Isso só pode ser usado em grupo 💔");
    if (!isGroupAdmin) return reply("Você precisa ser adm 💔");
    if (!q) return reply(`Digite o limite de comandos por dia ou "off" para desativar.\nExemplo: `+prefix+`cmdlimit 10`);
    cmdLimitData[from] = cmdLimitData[from] || { users: {} };
    if (q.toLowerCase() === 'off') {
      cmdLimitData[from].enabled = false;
      delete cmdLimitData[from].limit;
    } else {
      const limit = parseInt(q);
      if (isNaN(limit) || limit < 1) return reply('Limite inválido! Use um número maior que 0 ou "off".');
      cmdLimitData[from].enabled = true;
      cmdLimitData[from].limit = limit;
    }
    fs.writeFileSync(__dirname + '/../database/cmdlimit.json', JSON.stringify(cmdLimitData, null, 2));
    await reply(`✅ Limite de comandos ${cmdLimitData[from].enabled ? `definido para ${cmdLimitData[from].limit} por dia` : 'desativado'}!`);
  } catch (e) {
    console.error(e);
    await reply("Ocorreu um erro 💔");
  }
  break;
  
  case 'antipt':
  try {
    if (!isGroup) return reply("Isso só pode ser usado em grupo 💔");
    if (!isGroupAdmin) return reply("Você precisa ser adm 💔");
    if (!isBotAdmin) return reply("Eu preciso ser adm para isso 💔");
    groupData.antipt = !groupData.antipt;
    fs.writeFileSync(groupFile, JSON.stringify(groupData, null, 2));
    await reply(`✅ AntiPT ${groupData.antipt ? 'ativado' : 'desativado'}! Membros de Portugal serão banidos.`);
  } catch (e) {
    console.error(e);
    await reply("Ocorreu um erro 💔");
  }
  break;
  
 case 'antifake':
  try {
    if (!isGroup) return reply("Isso só pode ser usado em grupo 💔");
    if (!isGroupAdmin) return reply("Você precisa ser adm 💔");
    if (!isBotAdmin) return reply("Eu preciso ser adm para isso 💔");
    groupData.antifake = !groupData.antifake;
    fs.writeFileSync(groupFile, JSON.stringify(groupData, null, 2));
    await reply(`✅ Antifake ${groupData.antifake ? 'ativado' : 'desativado'}! Membros de fora do Brasil/Portugal serão banidos.`);
  } catch (e) {
    console.error(e);
    await reply("Ocorreu um erro 💔");
  }
  break;

  case 'antidoc':
  try {
    if (!isGroup) return reply("Isso só pode ser usado em grupo 💔");
    if (!isGroupAdmin) return reply("Você precisa ser adm 💔");
    if (!isBotAdmin) return reply("Eu preciso ser adm para isso 💔");
    groupData.antidoc = !groupData.antidoc;
    fs.writeFileSync(groupFile, JSON.stringify(groupData, null, 2));
    await reply(`✅ Antidoc ${groupData.antidoc ? 'ativado' : 'desativado'}! Documentos enviados resultarão em banimento.`);
  } catch (e) {
    console.error(e);
    await reply("Ocorreu um erro 💔");
  }
  break;
  
  case 'x9':
  try {
    if (!isGroup) return reply("Isso só pode ser usado em grupo 💔");
    if (!isGroupAdmin) return reply("Você precisa ser adm 💔");
    groupData.x9 = !groupData.x9;
    fs.writeFileSync(groupFile, JSON.stringify(groupData, null, 2));
    await reply(`✅ Modo X9 ${groupData.x9 ? 'ativado' : 'desativado'}! Agora eu aviso sobre promoções e rebaixamentos.`);
  } catch (e) {
    console.error(e);
    await reply("Ocorreu um erro 💔");
  }
  break;
  
  case 'limitmessage':
  try {
    if (!isGroup) return reply("Este comando só funciona em grupos 💔");
    if (!isGroupAdmin) return reply("Apenas administradores podem usar este comando 🚫");

    if (!q) {
      return reply(`📝 Configure o limite de mensagens! Exemplo: ${prefix}limitmessage 5 1m ban\n` + `Formato: ${prefix}limitmessage <quantidade> <tempo> <ação>\n` + `Tempo: s (segundos), m (minutos), h (horas)\n` + `Ação: ban (banimento direto) ou adv (advertências)`);
    }

    const args = q.trim().split(' ');
    if (args.length !== 3) {
      return reply("� ❌ Formato inválido! Use: " + `${prefix}limitmessage <quantidade> <tempo> <ação>`);
    }

    const limit = parseInt(args[0]);
    const timeInput = args[1].toLowerCase();
    const action = args[2].toLowerCase();

    if (!['ban', 'adv'].includes(action)) {
      return reply("❌ Ação inválida! Use 'ban' para banimento direto ou 'adv' para advertências.");
    }

    let intervalSeconds;
    const timeMatch = timeInput.match(/^(\d+)(s|m|h)$/);
    if (!timeMatch) {
      return reply("❌ Tempo inválido! Use formatos como 20s, 1m ou 2h.");
    }

    const timeValue = parseInt(timeMatch[1]);
    const timeUnit = timeMatch[2];
    if (timeUnit === 's') intervalSeconds = timeValue;
    else if (timeUnit === 'm') intervalSeconds = timeValue * 60;
    else if (timeUnit === 'h') intervalSeconds = timeValue * 3600;

    if (isNaN(limit) || limit <= 0) {
      return reply("❌ Quantidade de mensagens deve ser um número positivo!");
    }

    groupData.messageLimit = {
      enabled: true,
      limit: limit,
      interval: intervalSeconds,
      action: action,
      warnings: groupData.messageLimit?.warnings || {},
      users: groupData.messageLimit?.users || {}
    };
    fs.writeFileSync(groupFile, JSON.stringify(groupData, null, 2));
    const actionText = action === 'ban' ? 'banimento direto' : 'advertências (ban após 3)';
    await reply(`✅ Limite de mensagens configurado: ${limit} mensagens a cada ${timeInput} com ${actionText}!`);
  } catch (e) {
    console.error('Erro no comando limitmessage:', e);
    await reply("🐝 Oh não! Aconteceu um errinho inesperado aqui. Tente de novo daqui a pouquinho, por favor! 🥺");
  }
  break;

case 'dellimitmessage':
  try {
    if (!isGroup) return reply("Este comando só funciona em grupos 💔");
    if (!isGroupAdmin) return reply("Apenas administradores podem usar este comando 🚫");

    if (!groupData.messageLimit?.enabled) {
      return reply("📴 O limite de mensagens não está ativo neste grupo.");
    }

    delete groupData.messageLimit;
    fs.writeFileSync(groupFile, JSON.stringify(groupData, null, 2));
    await reply("🗑️ Sistema de limite de mensagens desativado com sucesso!");
  } catch (e) {
    console.error('Erro no comando dellimitmessage:', e);
    await reply("🐝 Oh não! Aconteceu um errinho inesperado aqui. Tente de novo daqui a pouquinho, por favor! 🥺");
  }
  break;

  case 'setprefix':
  try {
    if (!isGroup) return reply("Este comando só funciona em grupos.");
    if (!isGroupAdmin) return reply("Apenas administradores podem alterar o prefixo.");
    if (!q) return reply(`Por favor, forneça o novo prefixo. Exemplo: ${groupPrefix}setprefix !`);
    
    const newPrefix = q.trim();
    if (newPrefix.length > 1) {
      return reply("🤔 O prefixo deve ter no máximo 1 digito.");
    };
    
    if (newPrefix.includes(' ')) {
      return reply("🤔 O prefixo não pode conter espaços.");
    };

    groupData.customPrefix = newPrefix;
    fs.writeFileSync(groupFile, JSON.stringify(groupData, null, 2));
    await reply(`✅ Prefixo do bot alterado para "${newPrefix}" neste grupo!`);
  } catch (e) {
    console.error('Erro no comando setprefix:', e);
    await reply("Ocorreu um erro ao alterar o prefixo 💔");
  }
  break;
  
  case 'antiflood':
  try {
    if (!isGroup) return reply("Isso só pode ser usado em grupo 💔");
    if (!isGroupAdmin) return reply("Você precisa ser adm 💔");
    if (!q) return reply(`Digite o intervalo em segundos ou "off" para desativar.\nExemplo: `+prefix+`antiflood 5`);
    antifloodData[from] = antifloodData[from] || { users: {} };
    if (q.toLowerCase() === 'off') {
      antifloodData[from].enabled = false;
      delete antifloodData[from].interval;
    } else {
      const interval = parseInt(q);
      if (isNaN(interval) || interval < 1) return reply('Intervalo inválido! Use um número maior que 0 ou "off".');
      antifloodData[from].enabled = true;
      antifloodData[from].interval = interval;
    }
    fs.writeFileSync(__dirname + '/../database/antiflood.json', JSON.stringify(antifloodData, null, 2));
    await reply(`✅ Antiflood ${antifloodData[from].enabled ? `ativado com intervalo de ${antifloodData[from].interval} segundos` : 'desativado'}!`);
  } catch (e) {
    console.error(e);
    await reply("Ocorreu um erro 💔");
  }
  break;

 case 'antiloc':
  try {
    if (!isGroup) return reply("Isso só pode ser usado em grupo 💔");
    if (!isGroupAdmin) return reply("Você precisa ser adm 💔");
    if (!isBotAdmin) return reply("Eu preciso ser adm para isso 💔");
    groupData.antiloc = !groupData.antiloc;
    fs.writeFileSync(groupFile, JSON.stringify(groupData, null, 2));
    await reply(`✅ Antiloc ${groupData.antiloc ? 'ativado' : 'desativado'}! Localizações enviadas resultarão em banimento.`);
  } catch (e) {
    console.error(e);
    await reply("Ocorreu um erro 💔");
  }
  break;
  
    case 'modobrincadeira': case 'modobrincadeiras': case 'modobn': case 'gamemode': try {
    if (!isGroup) return reply("isso so pode ser usado em grupo 💔");
    if (!isGroupAdmin) return reply("você precisa ser adm 💔");
    const groupFilePath = __dirname + `/../database/grupos/${from}.json`;
    if (!groupData.modobrincadeira || groupData.modobrincadeira === undefined) {
        groupData.modobrincadeira = true;
    } else {
        groupData.modobrincadeira = !groupData.modobrincadeira;
    };
    fs.writeFileSync(groupFilePath, JSON.stringify(groupData));
    if (groupData.modobrincadeira) {
        await reply('🎉 *Modo de Brincadeiras ativado!* Agora o grupo está no modo de brincadeiras. Divirta-se!');
    } else {
        await reply('⚠️ *Modo de Brincadeiras desativado!* O grupo não está mais no modo de brincadeiras.');
    }} catch(e) {
    console.error(e);
    await reply("🐝 Oh não! Aconteceu um errinho inesperado aqui. Tente de novo daqui a pouquinho, por favor! 🥺");
    };
    break;
    
    case 'bemvindo': case 'bv': case 'boasvindas': case 'welcome': try {
    if (!isGroup) return reply("isso so pode ser usado em grupo 💔");
    if (!isGroupAdmin) return reply("você precisa ser adm 💔");
    const groupFilePath = __dirname + `/../database/grupos/${from}.json`;   
    if (!groupData.bemvindo || groupData.bemvindo === undefined) {
        groupData.bemvindo = true;
    } else {
        groupData.bemvindo = !groupData.bemvindo;
    };
    fs.writeFileSync(groupFilePath, JSON.stringify(groupData));
    if (groupData.bemvindo) {
        await reply(`✅ *Boas-vindas ativadas!* Agora, novos membros serão recebidos com uma mensagem personalizada.\n📝 Para configurar a mensagem, use: *${prefixo}legendabv*`);
    } else {
        await reply('⚠️ *Boas-vindas desativadas!* O grupo não enviará mais mensagens para novos membros.');
    }} catch(e) {
    console.error(e);
    await reply("🐝 Oh não! Aconteceu um errinho inesperado aqui. Tente de novo daqui a pouquinho, por favor! 🥺");
    };
    break;
    
    case 'banghost':
    try {
    if (!isGroup) return reply("❌ Só pode ser usado em grupos.");
    if (!isGroupAdmin) return reply("❌ Apenas administradores.");
    if (!isBotAdmin) return reply("❌ Preciso ser administrador.");

    const limite = parseInt(q);
    if (isNaN(limite) || limite < 0) return reply("⚠️ Use um número válido. Ex: "+prefix+"banghost 1");

    const arquivoGrupo = `${GRUPOS_DIR}/${from}.json`;
    if (!fs.existsSync(arquivoGrupo)) return reply("📂 Sem dados de mensagens.");

    const dados = JSON.parse(fs.readFileSync(arquivoGrupo));
    const contador = dados.contador;
    if (!Array.isArray(contador)) return reply("⚠️ Contador não disponível.");

    const admins = groupAdmins || [];
    const fantasmas = contador.filter(u => (u.msg || 0) <= limite && !admins.includes(u.id) && u.id !== botNumber && u.id !== sender && u.id !== nmrdn).map(u => u.id);

    if (!fantasmas.length) return reply(`🎉 Nenhum fantasma com até ${limite} msg.`);

    const antes = (await nazu.groupMetadata(from)).participants.map(p => p.id || p.jid);
    try {
      await nazu.groupParticipantsUpdate(from, fantasmas, 'remove');
    } catch (e) {
      console.error("Erro ao remover:", e);
    }
    const depois = (await nazu.groupMetadata(from)).participants.map(p => p.id || p.jid);
    const removidos = fantasmas.filter(jid => antes.includes(jid) && !depois.includes(jid)).length;

    reply(removidos === 0 ? `⚠️ Nenhum fantasma pôde ser removido com até ${limite} msg.` : `✅ ${removidos} fantasma(s) removido(s).`);

  } catch (e) {
    console.error("Erro no banghost:", e);
    reply("💥 Erro ao tentar remover fantasmas.");
  }
  break;
  
   case 'fotobv':
   case 'welcomeimg': {
  if (!isGroup) return reply("isso so pode ser usado em grupo 💔");
  if (!isGroupAdmin) return reply("você precisa ser adm 💔");
  if ((!isQuotedImage && !isImage) && (!q || q.trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '') !== 'banner')) return reply(`❌ Marque uma imagem ou envie uma imagem com o comando ou digite \`${prefix}${command} banner\``);

  try {
    if(isQuotedImage || isImage) {
      const imgMessage = isQuotedImage ? info.message.extendedTextMessage.contextInfo.quotedMessage.imageMessage : info.message.imageMessage;
      const media = await getFileBuffer(imgMessage, 'image');
      const uploadResult = await upload(media);
      if (!uploadResult) throw new Error('Falha ao fazer upload da imagem');
      if (!groupData.welcome) groupData.welcome = {};
      groupData.welcome.image = uploadResult;
      fs.writeFileSync(__dirname + `/../database/grupos/${from}.json`, JSON.stringify(groupData, null, 2));
      await reply('✅ Foto de boas-vindas configurada com sucesso!');
    } else if(q.trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '') === 'banner') {
      if (!groupData.welcome) groupData.welcome = {};
      groupData.welcome.image = 'banner';
      fs.writeFileSync(__dirname + `/../database/grupos/${from}.json`, JSON.stringify(groupData, null, 2));
      await reply('✅ Foto de boas-vindas configurada com sucesso!');
    } else {
      await reply(`❌ Marque uma imagem ou envie uma imagem com o comando ou digite \`${prefix}${command} banner\``);
    };
  } catch (error) {
    console.error(error);
    reply("ocorreu um erro 💔");
  }
}
break;

   case 'fotosaida': case 'fotosaiu': case 'imgsaiu': case 'exitimg': {
     if (!isGroup) return reply("isso so pode ser usado em grupo 💔");
     if (!isGroupAdmin) return reply("você precisa ser adm 💔");
     if (!isQuotedImage && !isImage) return reply('❌ Marque uma imagem ou envie uma imagem com o comando!');
     try {
       const media = await getFileBuffer(
         isQuotedImage ? info.message.extendedTextMessage.contextInfo.quotedMessage.imageMessage : info.message.imageMessage,
         'image'
       );
       const uploadResult = await upload(media);
       if (!uploadResult) throw new Error('Falha ao fazer upload da imagem');
       if (!groupData.exit) groupData.exit = {};
       groupData.exit.image = uploadResult;
       fs.writeFileSync(__dirname + `/../database/grupos/${from}.json`, JSON.stringify(groupData, null, 2));
       await reply('✅ Foto de saída configurada com sucesso!');
     } catch (error) {
       console.error(error);
       reply("ocorreu um erro 💔");
     };
   };
   break;
 
   case 'limpar': case 'clean':
  try {
    if (!isGroup) return reply("Isso só pode ser usado em grupo 💔");
    if (!isGroupAdmin) return reply("Você precisa ser adm 💔");
    if (!isBotAdmin) return reply("Eu preciso ser adm para isso 💔");
    const linhasEmBranco = Array(500).fill('‎ ').join('\n');
    const mensagem = `${linhasEmBranco}\n🧹 Limpeza concluída!`;
    await reply(mensagem);
  } catch (e) {
    console.error(e);
    await reply("Ocorreu um erro ao limpar o chat 💔");
  }
  break;

case 'removerfotobv': case 'rmfotobv': case 'delfotobv': case 'rmwelcomeimg':
  try {
    if (!isGroup) return reply("Isso só pode ser usado em grupo 💔");
    if (!isGroupAdmin) return reply("Você precisa ser administrador 💔");
    const groupFilePath = __dirname + `/../database/grupos/${from}.json`;
    let groupData = fs.existsSync(groupFilePath) ? JSON.parse(fs.readFileSync(groupFilePath)) : { welcome: {} };
    if (!groupData.welcome?.image) return reply("❌ Não há imagem de boas-vindas configurada.");
    delete groupData.welcome.image;
    fs.writeFileSync(groupFilePath, JSON.stringify(groupData, null, 2));
    reply("✅ A imagem de boas-vindas foi removida com sucesso!");
  } catch (e) {
    console.error(e);
    reply("Ocorreu um erro 💔");
  }
  break;

case 'removerfotosaiu': case 'rmfotosaiu': case 'delfotosaiu': case 'rmexitimg':
  try {
    if (!isGroup) return reply("Isso só pode ser usado em grupo 💔");
    if (!isGroupAdmin) return reply("Você precisa ser administrador 💔");
    const groupFilePath = __dirname + `/../database/grupos/${from}.json`;
    let groupData = fs.existsSync(groupFilePath) ? JSON.parse(fs.readFileSync(groupFilePath)) : { exit: {} };
    if (!groupData.exit?.image) return reply("❌ Não há imagem de saída configurada.");
    delete groupData.exit.image;
    fs.writeFileSync(groupFilePath, JSON.stringify(groupData, null, 2));
    reply("✅ A imagem de saída foi removida com sucesso!");
  } catch (e) {
    console.error(e);
    reply("Ocorreu um erro 💔");
  }
  break;
  
   case 'configsaida': case 'textsaiu': case 'legendasaiu': case 'exitmsg': {
     if (!isGroup) return reply("isso so pode ser usado em grupo 💔");
     if (!isGroupAdmin) return reply("você precisa ser adm 💔");
     if (!q) return reply(`📝 Para configurar a mensagem de saída, use:\n${prefix}${command} <mensagem>\n\nVocê pode usar:\n#numerodele# - Menciona quem saiu\n#nomedogp# - Nome do grupo\n#membros# - Total de membros\n#desc# - Descrição do grupo`);
     try {
       if (!groupData.exit) groupData.exit = {};
       groupData.exit.enabled = true;
       groupData.exit.text = q;
       fs.writeFileSync(__dirname + `/../database/grupos/${from}.json`, JSON.stringify(groupData, null, 2));
       await reply('✅ Mensagem de saída configurada com sucesso!\n\n📝 Mensagem definida como:\n' + q);
     } catch (error) {
       console.error(error);
       await reply("🐝 Oh não! Aconteceu um errinho inesperado aqui. Tente de novo daqui a pouquinho, por favor! 🥺");
     }
   }
   break;

   case 'saida': case 'exit': {
     if (!isGroup) return reply("isso so pode ser usado em grupo 💔");
     if (!isGroupAdmin) return reply("você precisa ser adm 💔");
     try {
       if (!groupData.exit) groupData.exit = {};
       groupData.exit.enabled = !groupData.exit.enabled;
       fs.writeFileSync(__dirname + `/../database/grupos/${from}.json`, JSON.stringify(groupData, null, 2));
       await reply(groupData.exit.enabled ? '✅ Mensagens de saída ativadas!' : '❌ Mensagens de saída desativadas!');
     } catch (error) {
       console.error(error);
       await reply("🐝 Oh não! Aconteceu um errinho inesperado aqui. Tente de novo daqui a pouquinho, por favor! 🥺");
     };
   };
   break;
  
  case 'parcerias': case 'partnerships':
  try {
    if (!isGroup) return reply("Este comando só funciona em grupos.");
    if (!isGroupAdmin) return reply("Apenas administradores podem usar este comando.");
    if (!parceriasData.active) {
      return reply("O sistema de parcerias não está ativo neste grupo.");
    }
    if (Object.keys(parceriasData.partners).length === 0) {
      return reply("Não há parcerias ativas neste grupo.");
    }
    let message = "📋 *Lista de Parcerias Ativas* 📋\n\n";
    for (const [userId, data] of Object.entries(parceriasData.partners)) {
      message += `👤 @${userId.split('@')[0]} - Limite: ${data.limit} links | Enviados: ${data.count}\n`;
    }
    await reply(message, { mentions: Object.keys(parceriasData.partners) });
  } catch (e) {
    console.error('Erro no comando parcerias:', e);
    await reply("Ocorreu um erro ao listar as parcerias 💔");
  }
  break;

case 'addparceria': case 'addpartnership':
  try {
    if (!isGroup) return reply("Este comando só funciona em grupos.");
    if (!isGroupAdmin) return reply("Apenas administradores podem usar este comando.");
    if (!q) return reply(`Uso: ${prefix}addparceria @usuário limite ou marcando uma mensagem com ${prefix}addparceria limite`);
    let userId, limit;
    if (menc_os2) {
      userId = menc_os2;
      limit = parseInt(args[1]);
    } else if (isQuotedMsg) {
      userId = info.message.extendedTextMessage.contextInfo.participant;
      limit = parseInt(q);
    } else {
      return reply("Por favor, marque um usuário ou responda a uma mensagem.");
    }
    if (!userId || isNaN(limit) || limit < 1) {
      return reply("Uso inválido. Certifique-se de marcar um usuário e especificar um limite válido (número maior que 0).");
    }
    if (!AllgroupMembers.includes(userId)) {
      return reply(`@${userId.split('@')[0]} não está no grupo.`, { mentions: [userId] });
    }
    parceriasData.partners[userId] = { limit, count: 0 };
    saveParceriasData(from, parceriasData);
    await reply(`✅ @${userId.split('@')[0]} foi adicionado como parceiro com limite de ${limit} links de grupos.`, { mentions: [userId] });
  } catch (e) {
    console.error('Erro no comando addparceria:', e);
    await reply("Ocorreu um erro ao adicionar a parceria 💔");
  }
  break;

case 'delparceria': case 'delpartnership':
  try {
    if (!isGroup) return reply("Este comando só funciona em grupos.");
    if (!isGroupAdmin) return reply("Apenas administradores podem usar este comando.");
    let userId;
    if (menc_os2) {
      userId = menc_os2;
    } else if (isQuotedMsg) {
      userId = info.message.extendedTextMessage.contextInfo.participant;
    } else {
      return reply("Por favor, marque um usuário ou responda a uma mensagem.");
    }
    if (!parceriasData.partners[userId]) {
      return reply(`@${userId.split('@')[0]} não é um parceiro.`, { mentions: [userId] });
    }
    delete parceriasData.partners[userId];
    saveParceriasData(from, parceriasData);
    await reply(`✅ @${userId.split('@')[0]} não é mais um parceiro.`, { mentions: [userId] });
  } catch (e) {
    console.error('Erro no comando delparceria:', e);
    await reply("Ocorreu um erro ao remover a parceria 💔");
  }
  break;

case 'modoparceria':
  try {
    if (!isGroup) return reply("Este comando só funciona em grupos.");
    if (!isGroupAdmin) return reply("Apenas administradores podem usar este comando.");
    parceriasData.active = !parceriasData.active;
    saveParceriasData(from, parceriasData);
    await reply(`✅ Sistema de parcerias ${parceriasData.active ? 'ativado' : 'desativado'} com sucesso!`);
  } catch (e) {
    console.error('Erro no comando modoparceria:', e);
    await reply("Ocorreu um erro ao alterar o modo de parcerias 💔");
  }
  break;
  
  case 'antifig':
  try {
    if (!isGroup) return reply("Este comando só funciona em grupos.");
    if (!isGroupAdmin) return reply("Apenas administradores podem gerenciar o antifig.");
    groupData.antifig = groupData.antifig || {};
    groupData.antifig.enabled = !groupData.antifig.enabled;
    fs.writeFileSync(groupFile, JSON.stringify(groupData, null, 2));
    const status = groupData.antifig.enabled ? "ativado" : "desativado";
    await reply(`✅ Antifig ${status}! Figurinhas ${groupData.antifig.enabled ? "serão apagadas e o remetente receberá advertências" : "agora são permitidas"}.`);
  } catch (e) {
    console.error('Erro no comando antifig:', e);
    await reply("Ocorreu um erro ao gerenciar o antifig 💔");
  }
  break;
  
  case 'addblacklist': case 'blacklist':
  try {
    if (!isGroup) return reply("Isso só pode ser usado em grupo 💔");
    if (!isGroupAdmin) return reply("Você precisa ser administrador 💔");
    if (!menc_os2) return reply("Marque um usuário 🙄");
    const reason = q.includes(' ') ? q.split(' ').slice(1).join(' ') : "Motivo não informado";
    const groupFilePath = __dirname + `/../database/grupos/${from}.json`;
    let groupData = fs.existsSync(groupFilePath) ? JSON.parse(fs.readFileSync(groupFilePath)) : { blacklist: {} };
    groupData.blacklist = groupData.blacklist || {};
    if (groupData.blacklist[menc_os2]) return reply("❌ Este usuário já está na blacklist.");
    groupData.blacklist[menc_os2] = { reason, timestamp: Date.now() };
    fs.writeFileSync(groupFilePath, JSON.stringify(groupData, null, 2));
    reply(`✅ @${menc_os2.split('@')[0]} foi adicionado à blacklist.\nMotivo: ${reason}`, { mentions: [menc_os2] });
  } catch (e) {
    console.error(e);
    reply("Ocorreu um erro 💔");
  }
  break;

case 'delblacklist': case 'unblacklist':
  try {
    if (!isGroup) return reply("Isso só pode ser usado em grupo 💔");
    if (!isGroupAdmin) return reply("Você precisa ser administrador 💔");
    if (!menc_os2) return reply("Marque um usuário 🙄");
    const groupFilePath = __dirname + `/../database/grupos/${from}.json`;
    let groupData = fs.existsSync(groupFilePath) ? JSON.parse(fs.readFileSync(groupFilePath)) : { blacklist: {} };
    groupData.blacklist = groupData.blacklist || {};
    if (!groupData.blacklist[menc_os2]) return reply("❌ Este usuário não está na blacklist.");
    delete groupData.blacklist[menc_os2];
    fs.writeFileSync(groupFilePath, JSON.stringify(groupData, null, 2));
    reply(`✅ @${menc_os2.split('@')[0]} foi removido da blacklist.`, { mentions: [menc_os2] });
  } catch (e) {
    console.error(e);
    reply("Ocorreu um erro 💔");
  }
  break;

case 'listblacklist':
  try {
    if (!isGroup) return reply("Isso só pode ser usado em grupo 💔");
    if (!isGroupAdmin) return reply("Você precisa ser administrador 💔");
    const groupFilePath = __dirname + `/../database/grupos/${from}.json`;
    let groupData = fs.existsSync(groupFilePath) ? JSON.parse(fs.readFileSync(groupFilePath)) : { blacklist: {} };
    groupData.blacklist = groupData.blacklist || {};
    if (Object.keys(groupData.blacklist).length === 0) return reply("📋 A blacklist está vazia.");
    let text = "📋 *Lista de Usuários na Blacklist*\n\n";
    for (const [user, data] of Object.entries(groupData.blacklist)) {
      text += `👤 @${user.split('@')[0]}\n📝 Motivo: ${data.reason}\n🕒 Adicionado em: ${new Date(data.timestamp).toLocaleString()}\n\n`;
    }
    reply(text, { mentions: Object.keys(groupData.blacklist) });
  } catch (e) {
    console.error(e);
    reply("Ocorreu um erro 💔");
  }
  break;
  
  case 'adv':
case 'advertir': case 'warning':
  try {
    if (!isGroup) return reply("Isso só pode ser usado em grupo 💔");
    if (!isGroupAdmin) return reply("Você precisa ser administrador 💔");
    if (!menc_os2) return reply("Marque um usuário 🙄");
    if (menc_os2 === botNumber) return reply("❌ Não posso advertir a mim mesma!");
    const reason = q.includes(' ') ? q.split(' ').slice(1).join(' ') : "Motivo não informado";
    const groupFilePath = __dirname + `/../database/grupos/${from}.json`;
    let groupData = fs.existsSync(groupFilePath) ? JSON.parse(fs.readFileSync(groupFilePath)) : { warnings: {} };
    groupData.warnings = groupData.warnings || {};
    groupData.warnings[menc_os2] = groupData.warnings[menc_os2] || [];
    groupData.warnings[menc_os2].push({
      reason,
      timestamp: Date.now(),
      issuer: sender
    });
    const warningCount = groupData.warnings[menc_os2].length;
    fs.writeFileSync(groupFilePath, JSON.stringify(groupData, null, 2));
    if (warningCount >= 3) {
      await nazu.groupParticipantsUpdate(from, [menc_os2], 'remove');
      delete groupData.warnings[menc_os2];
      fs.writeFileSync(groupFilePath, JSON.stringify(groupData, null, 2));
      reply(`🚫 @${menc_os2.split('@')[0]} recebeu 3 advertências e foi banido!\nÚltima advertência: ${reason}`, { mentions: [menc_os2] });
    } else {
      reply(`⚠️ @${menc_os2.split('@')[0]} recebeu uma advertência (${warningCount}/3).\nMotivo: ${reason}`, { mentions: [menc_os2] });
    }
  } catch (e) {
    console.error(e);
    reply("Ocorreu um erro 💔");
  }
  break;

case 'removeradv': case 'rmadv': case 'unwarning':
  try {
    if (!isGroup) return reply("Isso só pode ser usado em grupo 💔");
    if (!isGroupAdmin) return reply("Você precisa ser administrador 💔");
    if (!menc_os2) return reply("Marque um usuário 🙄");
    const groupFilePath = __dirname + `/../database/grupos/${from}.json`;
    let groupData = fs.existsSync(groupFilePath) ? JSON.parse(fs.readFileSync(groupFilePath)) : { warnings: {} };
    groupData.warnings = groupData.warnings || {};
    if (!groupData.warnings[menc_os2] || groupData.warnings[menc_os2].length === 0) return reply("❌ Este usuário não tem advertências.");
    groupData.warnings[menc_os2].pop();
    if (groupData.warnings[menc_os2].length === 0) delete groupData.warnings[menc_os2];
    fs.writeFileSync(groupFilePath, JSON.stringify(groupData, null, 2));
    reply(`✅ Uma advertência foi removida de @${menc_os2.split('@')[0]}. Advertências restantes: ${groupData.warnings[menc_os2]?.length || 0}/3`, { mentions: [menc_os2] });
  } catch (e) {
    console.error(e);
    reply("Ocorreu um erro 💔");
  }
  break;

case 'listadv': case 'warninglist':
  try {
    if (!isGroup) return reply("Isso só pode ser usado em grupo 💔");
    if (!isGroupAdmin) return reply("Você precisa ser administrador 💔");
    const groupFilePath = __dirname + `/../database/grupos/${from}.json`;
    let groupData = fs.existsSync(groupFilePath) ? JSON.parse(fs.readFileSync(groupFilePath)) : { warnings: {} };
    groupData.warnings = groupData.warnings || {};
    if (Object.keys(groupData.warnings).length === 0) return reply("📋 Não há advertências ativas no grupo.");
    let text = "📋 *Lista de Advertências*\n\n";
    for (const [user, warnings] of Object.entries(groupData.warnings)) {
      try {
      if(Array.isArray(warnings)) {
      text += `👤 @${user.split('@')[0]} (${warnings.length}/3)\n`;
      warnings.forEach((warn, index) => {
        text += `  ${index + 1}. Motivo: ${warn.reason}\n`;
        text += `     Por: @${warn.issuer.split('@')[0]}\n`;
        text += `     Em: ${new Date(warn.timestamp).toLocaleString()}\n`;
      });
      text += "\n";
     } 
      } catch(e) {}
    }
    reply(text, {
  mentions: [
    ...Object.keys(groupData.warnings),
    ...Object.values(groupData.warnings).flatMap(w =>
      Array.isArray(w) ? w.map(warn => warn.issuer) : []
    )
  ]
});
  } catch (e) {
    console.error(e);
    reply("Ocorreu um erro 💔");
  }
  break;

    case 'soadm': case 'onlyadm': case 'soadmin': try {
    if (!isGroup) return reply("isso so pode ser usado em grupo 💔");
    if (!isGroupAdmin) return reply("você precisa ser adm 💔");
    const groupFilePath = __dirname + `/../database/grupos/${from}.json`;   
    if (!groupData.soadm || groupData.soadm === undefined) {
        groupData.soadm = true;
    } else {
        groupData.soadm = !groupData.soadm;
    };
    fs.writeFileSync(groupFilePath, JSON.stringify(groupData));
    if (groupData.soadm) {
        await reply(`✅ *Modo apenas adm ativado!* Agora apenas administrdores do grupo poderam utilizar o bot*`);
    } else {
        await reply('⚠️ *Modo apenas adm desativado!* Agora todos os membros podem utilizar o bot novamente.');
    }} catch(e) {
    console.error(e);
    reply("ocorreu um erro 💔");
    };
    break;
    
    case 'modolite': case 'litemode': try {
      if (!isGroup) return reply("Isso só pode ser usado em grupo 💔");
      if (!isGroupAdmin) return reply("Você precisa ser administrador 💔");
      
      const groupFilePath = __dirname + `/../database/grupos/${from}.json`;
      
      if (!groupData.modolite) {
          groupData.modolite = true;
          if (groupData.hasOwnProperty('modoliteOff')) {
              delete groupData.modoliteOff;
          }
      } else {
          groupData.modolite = !groupData.modolite;
          if (!groupData.modolite) {
              groupData.modoliteOff = true;
          } else if (groupData.hasOwnProperty('modoliteOff')) {
              delete groupData.modoliteOff;
          }
      }
      
      fs.writeFileSync(groupFilePath, JSON.stringify(groupData, null, 2));
      
      if (groupData.modolite) {
          await reply('👶 *Modo Lite ativado!* O conteúdo inapropriado para crianças será filtrado neste grupo.');
      } else {
          await reply('🔞 *Modo Lite desativado!* O conteúdo do menu de brincadeiras será exibido completamente.');
      }
    } catch(e) {
      console.error(e);
      await reply("Ocorreu um erro 💔");
    }
    break;
    
    case 'modoliteglobal': try {
      if (!isOwner) return reply("Este comando é apenas para o meu dono 💔");
      
      const modoLiteFile = __dirname + '/../database/modolite.json';
      
      modoLiteGlobal.status = !modoLiteGlobal.status;

      if (!modoLiteGlobal.status) {
        modoLiteGlobal.forceOff = true;
      } else if (modoLiteGlobal.hasOwnProperty('forceOff')) {
        delete modoLiteGlobal.forceOff;
      }
      
      fs.writeFileSync(modoLiteFile, JSON.stringify(modoLiteGlobal, null, 2));
      
      if (modoLiteGlobal.status) {
        await reply('👶 *Modo Lite ativado globalmente!* O conteúdo inapropriado para crianças será filtrado em todos os grupos (a menos que seja explicitamente desativado em algum grupo).');
      } else {
        await reply('🔞 *Modo Lite desativado globalmente!* O conteúdo do menu de brincadeiras será exibido completamente (a menos que seja explicitamente ativado em algum grupo).');
      }
    } catch(e) {
      console.error(e);
      await reply("Ocorreu um erro 💔");
    }
    break;
    
    case 'antilinkgp':
    try {
    if (!isGroup) return reply("isso so pode ser usado em grupo 💔");
    if (!isGroupAdmin) return reply("você precisa ser adm 💔");
    if (!isBotAdmin) return reply("Eu preciso ser adm 💔");
    const groupFilePath = __dirname + `/../database/grupos/${from}.json`;
    let groupData = fs.existsSync(groupFilePath) ? JSON.parse(fs.readFileSync(groupFilePath)) : { antilinkgp: false };
    groupData.antilinkgp = !groupData.antilinkgp;
    fs.writeFileSync(groupFilePath, JSON.stringify(groupData));
    const message = groupData.antilinkgp ? `✅ *Antilinkgp foi ativado com sucesso!*\n\nAgora, se alguém enviar links de outros grupos, será banido automaticamente. Mantenha o grupo seguro! 🛡️` : `✅ *Antilinkgp foi desativado.*\n\nLinks de outros grupos não serão mais bloqueados. Use com cuidado! ⚠️`;
     reply(`${message}`);
    } catch (e) {
     console.error(e);
     reply("ocorreu um erro 💔");
    }
    break;
    
    case 'antiporn':
    try {
    if (!isGroup) return reply("isso so pode ser usado em grupo 💔");
    if (!isGroupAdmin) return reply("você precisa ser adm 💔");
    if (!isBotAdmin) return reply("Eu preciso ser adm 💔");
    const groupFilePath = __dirname + `/../database/grupos/${from}.json`;
    let groupData = fs.existsSync(groupFilePath) ? JSON.parse(fs.readFileSync(groupFilePath)) : { antiporn: false };
    groupData.antiporn = !groupData.antiporn;
    fs.writeFileSync(groupFilePath, JSON.stringify(groupData));
    const message = groupData.antiporn ? `✅ *Antiporn foi ativado com sucesso!*\n\nAgora, se alguém enviar conteúdo adulto (NSFW), será banido automaticamente. Mantenha o grupo seguro e adequado! 🛡️` : `✅ *Antiporn foi desativado.*\n\nConteúdo adulto não será mais bloqueado. Use com responsabilidade! ⚠️`;
    reply(`${message}`);
    } catch (e) {
     console.error(e);
     reply("ocorreu um erro 💔");
    }
    break;
    
    case 'autosticker':
    try {
    if (!isGroup) return reply("Isso só pode ser usado em grupo 💔");
    if (!isGroupAdmin) return reply("Você precisa ser administrador 💔");
    const groupFilePath = __dirname + `/../database/grupos/${from}.json`;
    let groupData = fs.existsSync(groupFilePath) ? JSON.parse(fs.readFileSync(groupFilePath)) : {};
    groupData.autoSticker = !groupData.autoSticker;
    fs.writeFileSync(groupFilePath, JSON.stringify(groupData, null, 2));
    reply(`✅ Auto figurinhas ${groupData.autoSticker ? 'ativadas' : 'desativadas'}! ${groupData.autoSticker ? 'Todas as imagens e vídeos serão convertidos em figurinhas.' : ''}`);
   } catch (e) {
    console.error(e);
    reply("Ocorreu um erro 💔");
   }
   break;
    
    case 'autorepo': case 'autoresposta':
    try {
    if (!isGroup) return reply("Isso só pode ser usado em grupo 💔");
    if (!isGroupAdmin) return reply("Você precisa ser administrador 💔");
    const groupFilePath = __dirname + `/../database/grupos/${from}.json`;
    let groupData = fs.existsSync(groupFilePath) ? JSON.parse(fs.readFileSync(groupFilePath)) : {};
    groupData.autorepo = !groupData.autorepo;
    fs.writeFileSync(groupFilePath, JSON.stringify(groupData, null, 2));
    reply(`✅ Auto resposta ${groupData.autorepo ? 'ativada' : 'desativada'}!`);
   } catch (e) {
    console.error(e);
    reply("Ocorreu um erro 💔");
   }
   break;
   
   case 'assistente': case 'assistent':
    try {
    if (!isGroup) return reply("Isso só pode ser usado em grupo 💔");
    if (!isGroupAdmin) return reply("Você precisa ser administrador 💔");
    const groupFilePath = __dirname + `/../database/grupos/${from}.json`;
    let groupData = fs.existsSync(groupFilePath) ? JSON.parse(fs.readFileSync(groupFilePath)) : {};
    groupData.assistente = !groupData.assistente;
    fs.writeFileSync(groupFilePath, JSON.stringify(groupData, null, 2));
    reply(`✅ *Assistente ${groupData.assistente ? 'ativada' : 'desativada'} com sucesso!*\n\n⚠️ Esta é uma funcionalidade *experimental (beta)* e ainda está em fase de testes. Podem ocorrer erros ou comportamentos inesperados. Caso encontre algo estranho, avise um administrador!\n\n🧠 Ao ativar essa IA, você concorda que ela pode *aprender com base nos padrões de conversa do grupo* para oferecer respostas mais relevantes e contextuais.`);
   } catch (e) {
    console.error(e);
    reply("Ocorreu um erro 💔");
   }
   break;
  
    case 'antigore':
    try {
    if (!isGroup) return reply("isso so pode ser usado em grupo 💔");
    if (!isGroupAdmin) return reply("você precisa ser adm 💔");
    if (!isBotAdmin) return reply("Eu preciso ser adm 💔");
    const groupFilePath = __dirname + `/../database/grupos/${from}.json`;
    let groupData = fs.existsSync(groupFilePath) ? JSON.parse(fs.readFileSync(groupFilePath)) : { antigore: false };
    groupData.antigore = !groupData.antigore;
    fs.writeFileSync(groupFilePath, JSON.stringify(groupData));
    const message = groupData.antigore ? `✅ *Antigore foi ativado com sucesso!*\n\nAgora, se alguém enviar conteúdo gore, será banido automaticamente. Mantenha o grupo seguro e saudável! 🛡️` : `✅ *Antigore foi desativado.*\n\nConteúdo gore não será mais bloqueado. Use com cuidado! ⚠️`;
    reply(`${message}`);
  } catch (e) {
    console.error(e);
    reply("ocorreu um erro 💔");
  }
  break;
    
    case 'legendabv': case 'textbv': case 'welcomemsg': try {
    if (!isGroup) return reply("isso so pode ser usado em grupo 💔");
    if (!isGroupAdmin) return reply("você precisa ser adm 💔");
    const groupFilePath = __dirname + `/../database/grupos/${from}.json`;
    if (!q) return reply(`📝 *Configuração da Mensagem de Boas-Vindas*\n\nPara definir uma mensagem personalizada, digite o comando seguido do texto desejado. Você pode usar as seguintes variáveis:\n\n- *#numerodele#* → Marca o novo membro.\n- *#nomedogp#* → Nome do grupo.\n- *#desc#* → Descrição do grupo.\n- *#membros#* → Número total de membros no grupo.\n\n📌 *Exemplo:*\n${prefixo}legendabv Bem-vindo(a) #numerodele# ao grupo *#nomedogp#*! Agora somos #membros# membros. Leia a descrição: #desc#`);
    groupData.textbv = q;
    fs.writeFileSync(groupFilePath, JSON.stringify(groupData));
    reply(`✅ *Mensagem de boas-vindas configurada com sucesso!*\n\n📌 Nova mensagem:\n"${groupData.textbv}"`);
    } catch(e) {
    console.error(e);
    await reply("🐝 Oh não! Aconteceu um errinho inesperado aqui. Tente de novo daqui a pouquinho, por favor! 🥺");
    };
  break;
  
  case 'mute':
  case 'mutar':
  try {
    if (!isGroup) return reply("isso so pode ser usado em grupo 💔");
    if (!isGroupAdmin) return reply("você precisa ser adm 💔");
    if (!isBotAdmin) return reply("Eu preciso ser adm 💔");
    if (!menc_os2) return reply("Marque alguém 🙄");
    const groupFilePath = __dirname + `/../database/grupos/${from}.json`;
    let groupData = fs.existsSync(groupFilePath) ? JSON.parse(fs.readFileSync(groupFilePath)) : { mutedUsers: {} };
    groupData.mutedUsers = groupData.mutedUsers || {};
    groupData.mutedUsers[menc_os2] = true;
    fs.writeFileSync(groupFilePath, JSON.stringify(groupData));
    await nazu.sendMessage(from, {text: `✅ @${menc_os2.split('@')[0]} foi mutado. Se enviar mensagens, será banido.`, mentions: [menc_os2] }, { quoted: info });
  } catch (e) {
    console.error(e);
    reply("ocorreu um erro 💔");
  }
  break;
  
  case 'desmute':
  case 'desmutar':
  case 'unmute':
  try {
    if (!isGroup) return reply("isso so pode ser usado em grupo 💔");
    if (!isGroupAdmin) return reply("você precisa ser adm 💔");
    if (!menc_os2) return reply("Marque alguém 🙄");
    const groupFilePath = __dirname + `/../database/grupos/${from}.json`;
    let groupData = fs.existsSync(groupFilePath) ? JSON.parse(fs.readFileSync(groupFilePath)) : { mutedUsers: {} };
    groupData.mutedUsers = groupData.mutedUsers || {};
    if (groupData.mutedUsers[menc_os2]) {
      delete groupData.mutedUsers[menc_os2];
      fs.writeFileSync(groupFilePath, JSON.stringify(groupData));
      await nazu.sendMessage(from, {text: `✅ @${menc_os2.split('@')[0]} foi desmutado e pode enviar mensagens novamente.`, mentions: [menc_os2]}, { quoted: info });
    } else {
      reply('❌ Este usuário não está mutado.');
    }
  } catch (e) {
    console.error(e);
    reply("ocorreu um erro 💔");
  }
  break;
  
  case 'blockcmd':
  try {
    if (!isGroup) return reply("isso so pode ser usado em grupo 💔");
    if (!isGroupAdmin) return reply("você precisa ser adm 💔");
    if (!q) return reply(`❌ Digite o comando que deseja bloquear. Exemplo: ${prefix}blockcmd sticker`);
    const groupFilePath = __dirname + `/../database/grupos/${from}.json`;
    let groupData = fs.existsSync(groupFilePath) ? JSON.parse(fs.readFileSync(groupFilePath)) : { blockedCommands: {} };
    groupData.blockedCommands = groupData.blockedCommands || {};
    groupData.blockedCommands[q.trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replaceAll(prefix, '')] = true;
    fs.writeFileSync(groupFilePath, JSON.stringify(groupData));
    reply(`✅ O comando *${q.trim()}* foi bloqueado e só pode ser usado por administradores.`);
  } catch (e) {
    console.error(e);
    reply("ocorreu um erro 💔");
  }
  break;
    
  case 'unblockcmd':
  try {
    if (!isGroup) return reply("isso so pode ser usado em grupo 💔");
    if (!isGroupAdmin) return reply("você precisa ser adm 💔");
    if (!q) return reply(`❌ Digite o comando que deseja desbloquear. Exemplo: ${prefix}unblockcmd sticker`);
    const groupFilePath = __dirname + `/../database/grupos/${from}.json`;
    let groupData = fs.existsSync(groupFilePath) ? JSON.parse(fs.readFileSync(groupFilePath)) : { blockedCommands: {} };
    groupData.blockedCommands = groupData.blockedCommands || {};
    if (groupData.blockedCommands[q.trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replaceAll(prefix, '')]) {
      delete groupData.blockedCommands[q.trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replaceAll(prefix, '')];
      fs.writeFileSync(groupFilePath, JSON.stringify(groupData));
      reply(`✅ O comando *${q.trim()}* foi desbloqueado e pode ser usado por todos.`);
    } else {
      reply('❌ Este comando não está bloqueado.');
    }
  } catch (e) {
    console.error(e);
    reply("ocorreu um erro 💔");
  }
  break;

    case 'ttt': case 'jogodavelha': {
    if (!isGroup) return reply("isso so pode ser usado em grupo 💔");
    if (!menc_os2) return reply("Marque alguém 🙄");
    const result = await tictactoe.invitePlayer(from, sender, menc_os2);
    await nazu.sendMessage(from, {
        text: result.message,
        mentions: result.mentions
    });
    break;
   };
   
   case 'chance':
    try {
    if (!isGroup) return reply("Isso só pode ser usado em grupo 💔");
    if (!isModoBn) return reply('❌ O modo brincadeira não está ativo nesse grupo.');
    if (!q) return reply(`Digite algo para eu calcular a chance! Exemplo: ${prefix}chance chover hoje`);
    const chance = Math.floor(Math.random() * 101);
    await reply(`📊 A chance de "${q}" acontecer é: *${chance}%*!`);
  } catch (e) {
    console.error(e);
    await reply("Ocorreu um erro 💔");
  }
  break;
  
  case 'quando':
  try {
    if (!isGroup) return reply("Isso só pode ser usado em grupo 💔");
    if (!isModoBn) return reply('❌ O modo brincadeira não está ativo nesse grupo.');
    if (!q) return reply('Digite algo para eu prever quando vai acontecer! Exemplo: '+prefix+'quando vou ficar rico');
    const tempos = ['hoje', 'amanhã', 'na próxima semana', 'no próximo mês', 'no próximo ano', 'nunca'];
    const tempo = tempos[Math.floor(Math.random() * tempos.length)];
    await reply(`🕒 "${q}" vai acontecer: *${tempo}*!`);
  } catch (e) {
    console.error(e);
    await reply("Ocorreu um erro 💔");
  }
  break;
  
  case 'casal':
  try {
    if (!isGroup) return reply("Isso só pode ser usado em grupo 💔");
    if (!isModoBn) return reply('❌ O modo brincadeira não está ativo nesse grupo.');
    if (AllgroupMembers.length < 2) return reply('❌ Preciso de pelo menos 2 membros no grupo!');
    let path = __dirname + '/../database/grupos/' + from + '.json';
    let data = fs.existsSync(path) ? JSON.parse(fs.readFileSync(path)) : { mark: {} };
    let membros = AllgroupMembers.filter(m => !['0', 'marca'].includes(data.mark[m]));
    const membro1 = membros[Math.floor(Math.random() * membros.length)];
    let membro2 = membros[Math.floor(Math.random() * membros.length)];
    while (membro2 === membro1) {
      membro2 = membros[Math.floor(Math.random() * membros.length)];
    };
    const shipLevel = Math.floor(Math.random() * 101);
    const chance = Math.floor(Math.random() * 101);
    await reply(`💕 *Casal do momento* 💕\n@${membro1.split('@')[0]} + @${membro2.split('@')[0]}\n\n🌟 Nível de ship: *${shipLevel}%*\n🎯 Chance de dar certo: *${chance}%*`, { mentions: [membro1, membro2] });
  } catch (e) {
    console.error(e);
    await reply("Ocorreu um erro 💔");
  }
  break;
  
  case 'shipo':
   try {
    if (!isGroup) return reply("Isso só pode ser usado em grupo 💔");
    if (!isModoBn) return reply('❌ O modo brincadeira não está ativo nesse grupo.');
    if (!menc_os2) return reply('Marque alguém para eu encontrar um par! Exemplo: '+prefix+'shipo @fulano');
    if (AllgroupMembers.length < 2) return reply('❌ Preciso de pelo menos 2 membros no grupo!');
    let path = __dirname + '/../database/grupos/' + from + '.json';
    let data = fs.existsSync(path) ? JSON.parse(fs.readFileSync(path)) : { mark: {} };
    let membros = AllgroupMembers.filter(m => !['0', 'marca'].includes(data.mark[m]));
    let par = membros[Math.floor(Math.random() * membros.length)];
    while (par === menc_os2) {
      par = membros[Math.floor(Math.random() * membros.length)];
    };
    const shipLevel = Math.floor(Math.random() * 101);
    const chance = Math.floor(Math.random() * 101);
    await reply(`💞 *Ship perfeito* 💞\n@${menc_os2.split('@')[0]} + @${par.split('@')[0]}\n\n🌟 Nível de ship: *${shipLevel}%*\n🎯 Chance de dar certo: *${chance}%*`, { mentions: [menc_os2, par] });
  } catch (e) {
    console.error(e);
    await reply("Ocorreu um erro 💔");
  }
  break;
  
  case 'sn':
  try {
    if (!isGroup) return reply("Isso só pode ser usado em grupo 💔");
    if (!isModoBn) return reply('❌ O modo brincadeira não está ativo nesse grupo.');
    if (!q) return reply('Faça uma pergunta! Exemplo: '+prefix+'sn Vou ganhar na loteria?');
    const resposta = Math.random() > 0.5 ? 'Sim' : 'Não';
    await reply(`🎯 ${resposta}!`);
  } catch (e) {
    console.error(e);
    await reply("Ocorreu um erro 💔");
  }
  break;
  
  case 'admins': case 'admin': case 'adm': case 'adms':
  if (!isGroup) return reply("isso so pode ser usado em grupo 💔");
  try {
    let membros = groupAdmins;
    let msg = `📢 *Mencionando os admins do grupo:* ${q ? `\n💬 *Mensagem:* ${q}` : ''}\n\n`;
    await nazu.sendMessage(from, {text: msg + membros.map(m => `➤ @${m.split('@')[0]}`).join('\n'), mentions: membros});
  } catch (e) {
    console.error(e);
    reply("ocorreu um erro 💔");
  }
  break;
  
  case 'invite':
case 'indicacao':
case 'bonus':
  try {
    const linkConvite = `https://wa.me/553399285117?text=Olá! Tenho interesse em alugar a bot ou ter a minha própria. Você poderia me passar mais informações? Fui indicado(a) por: ${sender.split('@')[0]}`;
    const anu = await axios.get(`https://tinyurl.com/api-create.php?url=${linkConvite}`);

    await reply(
      `💸 *Quer ganhar dinheiro apenas compartilhando um link?*\n\n` +
      `Com o *Sistema de Indicações da Nazuna*, você pode transformar seus contatos em renda extra!\n\n` +
      `🔹 Ganhe indicando usuários que desejam alugar uma bot, ter a própria ou adquirir qualquer outro serviço.\n\n` +
      `💰 *Quais são seus ganhos?*\n` +
      `• 15% do valor total que o indicado gastar, *ou*\n` +
      `• 25% do valor convertido em *créditos* para uso em nossos produtos (Hospedagem, API, Aluguel, IA, etc.)\n\n` +
      `📨 *Seu link de indicação personalizado está aqui:*\n${anu.data}\n\n` +
      `*Importante:*\n` +
      `> Este sistema pertence ao criador da bot (*Hiudy*). O dono da bot que você está utilizando *não tem responsabilidade* sobre o sistema de indicações, exceto se estiver diretamente envolvido com o criador.\n` +
      `> As indicações são válidas apenas se realizadas através do *seu link exclusivo* de convite.`
    );
  } catch (e) {
    console.error(e);
    await reply("⚠️ Ocorreu um erro ao gerar seu link. Tente novamente mais tarde.");
  }
  break;
  
  case 'perfil':
  try {
    const target = sender;

    const targetId = target.split('@')[0];
    const targetName = `@${targetId}`;

    const levels = {
      puta: Math.floor(Math.random() * 101),
      gado: Math.floor(Math.random() * 101),
      corno: Math.floor(Math.random() * 101),
      sortudo: Math.floor(Math.random() * 101),
      carisma: Math.floor(Math.random() * 101),
      rico: Math.floor(Math.random() * 101),
      gostosa: Math.floor(Math.random() * 101),
      feio: Math.floor(Math.random() * 101)
    };

    const pacoteValue = `R$ ${(Math.random() * 10000 + 1).toFixed(2).replace('.', ',')}`;

    const humors = ['😎 Tranquilão', '🔥 No fogo', '😴 Sonolento', '🤓 Nerd mode', '😜 Loucura total', '🧘 Zen'];
    const randomHumor = humors[Math.floor(Math.random() * humors.length)];

    let profilePic = 'https://raw.githubusercontent.com/nazuninha/uploads/main/outros/1747053564257_bzswae.bin';
    try {
      profilePic = await nazu.profilePictureUrl(target, 'image');
    } catch (error) {
      console.warn(`Falha ao obter foto do perfil de ${targetName}:`, error.message);
    }

    let bio = 'Sem bio disponível';
    let bioSetAt = '';
    try {
      const statusData = await nazu.fetchStatus(target);
      const status = statusData?.[0]?.status;
      if (status) {
        bio = status.status || bio;
        bioSetAt = new Date(status.setAt).toLocaleString('pt-BR', {
          dateStyle: 'short',
          timeStyle: 'short'
        });
      };
    } catch (error) {
      console.warn(`Falha ao obter status/bio de ${targetName}:`, error.message);
    };

    const perfilText = `📋 Perfil de ${targetName} 📋\n\n👤 *Nome*: ${pushname || 'Desconhecido'}\n📱 *Número*: ${targetId}\n📜 *Bio*: ${bio}${bioSetAt ? `\n🕒 *Bio atualizada em*: ${bioSetAt}` : ''}\n💰 *Valor do Pacote*: ${pacoteValue} 🫦\n😸 *Humor*: ${randomHumor}\n\n🎭 *Níveis*:\n  • Puta: ${levels.puta}%\n  • Gado: ${levels.gado}%\n  • Corno: ${levels.corno}%\n  • Sortudo: ${levels.sortudo}%\n  • Carisma: ${levels.carisma}%\n  • Rico: ${levels.rico}%\n  • Gostosa: ${levels.gostosa}%\n  • Feio: ${levels.feio}%`.trim();
    
    const userStatus = isOwner ? 'Meu dono' : isPremium ? 'Usuario premium' : isGroupAdmin ? 'Admin do grupo' : 'Membro comum';
    
    const PosAtivo = groupData.contador.sort((a, b) => ((a.figu == undefined ? a.figu = 0 : a.figu + a.msg + a.cmd) < (b.figu == undefined ? b.figu = 0 : b.figu + b.cmd + b.msg)) ? 0 : -1).findIndex(item => item.id === sender) + 1;
    
    const card = await new Banner.discordProfile().setUsername(pushname).setAvatar(profilePic).setDiscriminator(String(PosAtivo)+' RankAtivo').setCustomField('BIOGRAFIA', bio).setCustomField('CARGO', userStatus).setBanner('https://raw.githubusercontent.com/nazuninha/uploads/main/outros/1750259175074_ftrfhj.bin').setStatus('online').build();
    
    await nazu.sendMessage(from, { image: card, caption: perfilText, mentions: [target] }, { quoted: info });
  } catch (error) {
    console.error('Erro ao processar comando perfil:', error);
    await reply('Ocorreu um erro ao gerar o perfil 💔');
  }
  break;
  
  case 'ppt':
  try {
    if (!q) return reply('Escolha: pedra, papel ou tesoura! Exemplo: '+prefix+'ppt pedra');
    const escolhas = ['pedra', 'papel', 'tesoura'];
    if (!escolhas.includes(q.toLowerCase())) return reply('Escolha inválida! Use: pedra, papel ou tesoura.');
    const botEscolha = escolhas[Math.floor(Math.random() * 3)];
    const usuarioEscolha = q.toLowerCase();
    let resultado;
    if (usuarioEscolha === botEscolha) {
      resultado = 'Empate! 🤝';
    } else if (
      (usuarioEscolha === 'pedra' && botEscolha === 'tesoura') ||
      (usuarioEscolha === 'papel' && botEscolha === 'pedra') ||
      (usuarioEscolha === 'tesoura' && botEscolha === 'papel')
    ) {
      resultado = 'Você ganhou! 🎉';
    } else {
      resultado = 'Eu ganhei! 😎';
    }
    await reply(`🖐️ *Pedra, Papel, Tesoura* 🖐️\n\nVocê: ${usuarioEscolha}\nEu: ${botEscolha}\n\n${resultado}`);
  } catch (e) {
    console.error(e);
    await reply("Ocorreu um erro 💔");
  }
  break;
  
   case 'eununca': try {
    if (!isGroup) return reply("isso so pode ser usado em grupo 💔");
    if (!isModoBn) return reply('❌ O modo brincadeira não esta ativo nesse grupo');
    await nazu.sendMessage(from, {poll: {name: toolsJson().iNever[Math.floor(Math.random() * toolsJson().iNever.length)],values: ["Eu nunca", "Eu ja"], selectableCount: 1}, messageContextInfo: { messageSecret: Math.random()}}, {from, options: {userJid: nazu?.user?.id}})
   } catch(e) {
   console.error(e);
   await reply("🐝 Oh não! Aconteceu um errinho inesperado aqui. Tente de novo daqui a pouquinho, por favor! 🥺");
   };
   break
   
   case 'vab': try {
   if (!isGroup) return reply("isso so pode ser usado em grupo 💔");
   if (!isModoBn) return reply('❌ O modo brincadeira não esta ativo nesse grupo');
   const vabs = vabJson()[Math.floor(Math.random() * vabJson().length)];
   await nazu.sendMessage(from, {poll: {name: 'O que você prefere?',values: [vabs.option1, vabs.option2], selectableCount: 1}, messageContextInfo: { messageSecret: Math.random()}}, {from, options: {userJid: nazu?.user?.id}})
   } catch(e) {
   console.error(e);
   await reply("🐝 Oh não! Aconteceu um errinho inesperado aqui. Tente de novo daqui a pouquinho, por favor! 🥺");
   };
   break
   
   case 'surubao': case 'suruba': try {
   if (isModoLite) return nazu.react('❌');
   if(!isGroup) return reply(`Apenas em grupos`);
   if(!isModoBn) return reply('O modo brincadeira nao esta ativo no grupo')
   if (!q) return reply(`Eita, coloque o número de pessoas após o comando.`)
   if (Number(q) > 15) return reply("Coloque um número menor, ou seja, abaixo de *15*.")
   emojiskk = ["🥵", "😈", "🫣", "😏"];
   emojis2 = emojiskk[Math.floor(Math.random() * emojiskk.length)];
   frasekk = [`tá querendo relações sexuais a ${q}, topa?`, `quer que *${q}* pessoas venham de *chicote, algema e corda de alpinista*.`, `quer que ${q} pessoas der tapa na cara, lhe chame de cachorra e fud3r bem gostosinho...`]
   let path = __dirname + '/../database/grupos/' + from + '.json';
   let data = fs.existsSync(path) ? JSON.parse(fs.readFileSync(path)) : { mark: {} };
   let membros = AllgroupMembers.filter(m => !['0', 'marca'].includes(data.mark[m]));
   context = frasekk[Math.floor(Math.random() * frasekk.length)]  
   ABC = `${emojis2} @${sender.split('@')[0]} ${context}\n\n`
   mencts = [sender];
   for (var i = 0; i < q; i++) {
   menb = membros[Math.floor(Math.random() * membros.length)];
   ABC += `@${menb.split("@")[0]}\n`;
   mencts.push(menb);
  };
  await nazu.sendMessage(from, {image: {url: 'https://raw.githubusercontent.com/nazuninha/uploads/main/outros/1747545773146_rrv7of.bin'}, caption: ABC, mentions: mencts});
  } catch(e) {
  console.error(e);
  await reply("🐝 Oh não! Aconteceu um errinho inesperado aqui. Tente de novo daqui a pouquinho, por favor! 🥺");
  };
  break;

case 'suicidio': try {
await reply(`*É uma pena que tenha tomado essa decisão ${pushname}, vamos sentir saudades... 😕*`)
setTimeout(async() => { 
await nazu.groupParticipantsUpdate(from, [sender], "remove")  
}, 2000)
setTimeout(async() => {
await reply(`*Ainda bem que morreu, não aguentava mais essa praga kkkkkk*`)
}, 3000)
} catch(e) {
  console.error(e);
  await reply("🐝 Oh não! Aconteceu um errinho inesperado aqui. Tente de novo daqui a pouquinho, por favor! 🥺");
  };
  break;

   case 'gay': case 'burro': case 'inteligente': case 'otaku': case 'fiel': case 'infiel': case 'corno':  case 'gado': case 'gostoso': case 'feio': case 'rico': case 'pobre': case 'pirocudo': case 'pirokudo': case 'nazista': case 'ladrao': case 'safado': case 'vesgo': case 'bebado': case 'machista': case 'homofobico': case 'racista': case 'chato': case 'sortudo': case 'azarado': case 'forte': case 'fraco': case 'pegador': case 'otario': case 'macho': case 'bobo': case 'nerd': case 'preguicoso': case 'trabalhador': case 'brabo': case 'lindo': case 'malandro': case 'simpatico': case 'engracado': case 'charmoso': case 'misterioso': case 'carinhoso': case 'desumilde': case 'humilde': case 'ciumento': case 'corajoso': case 'covarde': case 'esperto': case 'talarico': case 'chorao': case 'brincalhao': case 'bolsonarista': case 'petista': case 'comunista': case 'lulista': case 'traidor': case 'bandido': case 'cachorro': case 'vagabundo': case 'pilantra': case 'mito': case 'padrao': case 'comedia': case 'psicopata': case 'fortao': case 'magrelo': case 'bombado': case 'chefe': case 'presidente': case 'rei': case 'patrao': case 'playboy': case 'zueiro': case 'gamer': case 'programador': case 'visionario': case 'billionario': case 'poderoso': case 'vencedor': case 'senhor': try {
    if (isModoLite && ['pirocudo', 'pirokudo', 'gostoso', 'nazista', 'machista', 'homofobico', 'racista'].includes(command)) return nazu.react('❌');
    if (!isGroup) return reply("isso so pode ser usado em grupo 💔");
    if (!isModoBn) return reply('❌ O modo brincadeira não esta ativo nesse grupo');
    let gamesData = fs.existsSync(__dirname + '/funcs/json/games.json') ? JSON.parse(fs.readFileSync(__dirname + '/funcs/json/games.json')) : { games: {} };
    const target = menc_os2 ? menc_os2 : sender;
    const targetName = `@${target.split('@')[0]}`;
    const level = Math.floor(Math.random() * 101);
    let responses = fs.existsSync(__dirname + '/funcs/json/gamestext.json') ? JSON.parse(fs.readFileSync(__dirname + '/funcs/json/gamestext.json')) : {};
    const responseText = responses[command].replaceAll('#nome#', targetName).replaceAll('#level#', level) || `📊 ${targetName} tem *${level}%* de ${command}! 🔥`;
    const media = gamesData.games[command]
    if (media?.image) {
        await nazu.sendMessage(from, { image: media.image, caption: responseText, mentions: [target] });
    } else if (media?.video) {
        await nazu.sendMessage(from, { video: media.video, caption: responseText, mentions: [target], gifPlayback: true});
    } else {
        await nazu.sendMessage(from, {text: responseText, mentions: [target]});
    };
} catch(e) {
console.error(e);
await reply("🐝 Oh não! Aconteceu um errinho inesperado aqui. Tente de novo daqui a pouquinho, por favor! 🥺");
};
break;

   case 'lesbica': case 'burra': case 'inteligente': case 'otaku': case 'fiel': case 'infiel': case 'corna': case 'gado': case 'gostosa': case 'feia': case 'rica': case 'pobre': case 'bucetuda': case 'nazista': case 'ladra': case 'safada': case 'vesga': case 'bebada': case 'machista': case 'homofobica': case 'racista': case 'chata': case 'sortuda': case 'azarada': case 'forte': case 'fraca': case 'pegadora': case 'otaria': case 'boba': case 'nerd': case 'preguicosa': case 'trabalhadora': case 'braba': case 'linda': case 'malandra': case 'simpatica': case 'engracada': case 'charmosa': case 'misteriosa': case 'carinhosa': case 'desumilde': case 'humilde': case 'ciumenta': case 'corajosa': case 'covarde': case 'esperta': case 'talarica': case 'chorona': case 'brincalhona': case 'bolsonarista': case 'petista': case 'comunista': case 'lulista': case 'traidora': case 'bandida': case 'cachorra': case 'vagabunda': case 'pilantra': case 'mito': case 'padrao': case 'comedia': case 'psicopata': case 'fortona': case 'magrela': case 'bombada': case 'chefe': case 'presidenta': case 'rainha': case 'patroa': case 'playboy': case 'zueira': case 'gamer': case 'programadora': case 'visionaria': case 'bilionaria': case 'poderosa': case 'vencedora': case 'senhora': try {
    if (isModoLite && ['bucetuda', 'cachorra', 'vagabunda', 'racista', 'nazista', 'gostosa', 'machista', 'homofobica'].includes(command)) return nazu.react('❌');
    if (!isGroup) return reply("isso so pode ser usado em grupo 💔");
    if (!isModoBn) return reply('❌ O modo brincadeira não esta ativo nesse grupo');
    let gamesData = fs.existsSync(__dirname + '/funcs/json/games.json') ? JSON.parse(fs.readFileSync(__dirname + '/funcs/json/games.json')) : { games: {} };
    const target = menc_os2 ? menc_os2 : sender;
    const targetName = `@${target.split('@')[0]}`;
    const level = Math.floor(Math.random() * 101);
    let responses = fs.existsSync(__dirname + '/funcs/json/gamestext2.json') ? JSON.parse(fs.readFileSync(__dirname + '/funcs/json/gamestext2.json')) : {};
    const responseText = responses[command].replaceAll('#nome#', targetName).replaceAll('#level#', level) || `📊 ${targetName} tem *${level}%* de ${command}! 🔥`;
    const media = gamesData.games[command]
    if (media?.image) {
        await nazu.sendMessage(from, { image: media.image, caption: responseText, mentions: [target] });
    } else if (media?.video) {
        await nazu.sendMessage(from, { video: media.video, caption: responseText, mentions: [target], gifPlayback: true});
    } else {
        await nazu.sendMessage(from, {text: responseText, mentions: [target]});
    };
} catch(e) {
console.error(e);
await reply("🐝 Oh não! Aconteceu um errinho inesperado aqui. Tente de novo daqui a pouquinho, por favor! 🥺");
};
break;

case 'rankgay': case 'rankburro': case 'rankinteligente': case 'rankotaku': case 'rankfiel': case 'rankinfiel': case 'rankcorno': case 'rankgado': case 'rankgostoso': case 'rankrico': case 'rankpobre': case 'rankforte': case 'rankpegador': case 'rankmacho': case 'ranknerd': case 'ranktrabalhador': case 'rankbrabo': case 'ranklindo': case 'rankmalandro': case 'rankengracado': case 'rankcharmoso': case 'rankvisionario': case 'rankpoderoso': case 'rankvencedor':case 'rankgays': case 'rankburros': case 'rankinteligentes': case 'rankotakus': case 'rankfiels': case 'rankinfieis': case 'rankcornos': case 'rankgados': case 'rankgostosos': case 'rankricos': case 'rankpobres': case 'rankfortes': case 'rankpegadores': case 'rankmachos': case 'ranknerds': case 'ranktrabalhadores': case 'rankbrabos': case 'ranklindos': case 'rankmalandros': case 'rankengracados': case 'rankcharmosos': case 'rankvisionarios': case 'rankpoderosos': case 'rankvencedores': try {
   if (isModoLite && ['rankgostoso', 'rankgostosos', 'ranknazista'].includes(command)) return nazu.react('❌');
    if (!isGroup) return reply("isso so pode ser usado em grupo 💔");
    if (!isModoBn) return reply('❌ O modo brincadeira não está ativo nesse grupo.');
    let path = __dirname + '/../database/grupos/' + from + '.json';
    let gamesData = fs.existsSync(__dirname + '/funcs/json/games.json') ? JSON.parse(fs.readFileSync(__dirname + '/funcs/json/games.json')) : { ranks: {} };
    let data = fs.existsSync(path) ? JSON.parse(fs.readFileSync(path)) : { mark: {} };
    let membros = AllgroupMembers.filter(m => !['0', 'marca'].includes(data.mark[m]));
    if (membros.length < 5) return reply('❌ Membros insuficientes para formar um ranking.');
    let top5 = membros.sort(() => Math.random() - 0.5).slice(0, 5);
    let cleanedCommand = command.endsWith('s') ? command.slice(0, -1) : command;
    let ranksData = fs.existsSync(__dirname + '/funcs/json/ranks.json') ? JSON.parse(fs.readFileSync(__dirname + '/funcs/json/ranks.json')) : { ranks: {} };
    let responseText = ranksData[cleanedCommand] || `📊 *Ranking de ${cleanedCommand.replace('rank', '')}*:\n\n`;
    top5.forEach((m, i) => {
        responseText += `🏅 *#${i + 1}* - @${m.split('@')[0]}\n`;
    });
    let media = gamesData.ranks[cleanedCommand];
    if (media?.image) {
        await nazu.sendMessage(from, { image: media.image, caption: responseText, mentions: top5 });
    } else if (media?.video) {
        await nazu.sendMessage(from, { video: media.video, caption: responseText, mentions: top5, gifPlayback: true });
    } else {
        await nazu.sendMessage(from, { text: responseText, mentions: top5 });
    }
} catch(e) {
console.error(e);
await reply("🐝 Oh não! Aconteceu um errinho inesperado aqui. Tente de novo daqui a pouquinho, por favor! 🥺");
};
break;

case 'ranklesbica': case 'rankburra': case 'rankinteligente': case 'rankotaku': case 'rankfiel': case 'rankinfiel': case 'rankcorna': case 'rankgada': case 'rankgostosa': case 'rankrica': case 'rankpobre': case 'rankforte': case 'rankpegadora': case 'ranknerd': case 'ranktrabalhadora': case 'rankbraba': case 'ranklinda': case 'rankmalandra': case 'rankengracada': case 'rankcharmosa': case 'rankvisionaria': case 'rankpoderosa': case 'rankvencedora':case 'ranklesbicas': case 'rankburras': case 'rankinteligentes': case 'rankotakus': case 'rankfiels': case 'rankinfieis': case 'rankcornas': case 'rankgads': case 'rankgostosas': case 'rankricas': case 'rankpobres': case 'rankfortes': case 'rankpegadoras': case 'ranknerds': case 'ranktrabalhadoras': case 'rankbrabas': case 'ranklindas': case 'rankmalandras': case 'rankengracadas': case 'rankcharmosas': case 'rankvisionarias': case 'rankpoderosas': case 'rankvencedoras': try {
    if (isModoLite && ['rankgostosa', 'rankgostosas', 'ranknazista'].includes(command)) return nazu.react('❌');
    if (!isGroup) return reply("isso so pode ser usado em grupo 💔");
    if (!isModoBn) return reply('❌ O modo brincadeira não está ativo nesse grupo.');
    let path = __dirname + '/../database/grupos/' + from + '.json';
    let gamesData = fs.existsSync(__dirname + '/funcs/json/games.json') ? JSON.parse(fs.readFileSync(__dirname + '/funcs/json/games.json')) : { ranks: {} };
    let data = fs.existsSync(path) ? JSON.parse(fs.readFileSync(path)) : { mark: {} };
    let membros = AllgroupMembers.filter(m => !['0', 'marca'].includes(data.mark[m]));
    if (membros.length < 5) return reply('❌ Membros insuficientes para formar um ranking.');
    let top5 = membros.sort(() => Math.random() - 0.5).slice(0, 5);
    let cleanedCommand = command.endsWith('s') ? command.slice(0, -1) : command;
    let ranksData = fs.existsSync(__dirname + '/funcs/json/ranks.json') ? JSON.parse(fs.readFileSync(__dirname + '/funcs/json/ranks.json')) : { ranks: {} };
    let responseText = ranksData[cleanedCommand]+'\n\n' || `📊 *Ranking de ${cleanedCommand.replace('rank', '')}*:\n\n`;
    top5.forEach((m, i) => {
        responseText += `🏅 *#${i + 1}* - @${m.split('@')[0]}\n`;
    });
    let media = gamesData.ranks[cleanedCommand];
    if (media?.image) {
        await nazu.sendMessage(from, { image: media.image, caption: responseText, mentions: top5 });
    } else if (media?.video) {
        await nazu.sendMessage(from, { video: media.video, caption: responseText, mentions: top5, gifPlayback: true });
    } else {
        await nazu.sendMessage(from, { text: responseText, mentions: top5 });
    }
} catch(e) {
console.error(e);
await reply("🐝 Oh não! Aconteceu um errinho inesperado aqui. Tente de novo daqui a pouquinho, por favor! 🥺");
};
break;

case 'chute': case 'chutar': case 'tapa': case 'soco': case 'socar': case 'beijo': case 'beijar': case 'beijob': case 'beijarb': case 'abraco': case 'abracar': case 'mata': case 'matar': case 'tapar': case 'goza': case 'gozar': case 'mamar': case 'mamada': case 'cafune': case 'morder': case 'mordida': case 'lamber': case 'lambida': case 'explodir': case 'sexo': try {
    const comandosImpróprios = ['sexo', 'surubao', 'goza', 'gozar', 'mamar', 'mamada', 'beijob', 'beijarb', 'tapar'];
    if (isModoLite && comandosImpróprios.includes(command)) return nazu.react('❌');
    
    if (!isGroup) return reply("isso so pode ser usado em grupo 💔");
    if (!isModoBn) return reply('❌ O modo brincadeira não está ativo nesse grupo.');
    if(!menc_os2) return reply('Marque um usuário.');
    let gamesData = fs.existsSync(__dirname + '/funcs/json/games.json') ? JSON.parse(fs.readFileSync(__dirname + '/funcs/json/games.json')) : { games2: {} };
    let GamezinData = fs.existsSync(__dirname + '/funcs/json/markgame.json') ? JSON.parse(fs.readFileSync(__dirname + '/funcs/json/markgame.json')) : { ranks: {} };
    let responseText = GamezinData[command].replaceAll('#nome#', `@${menc_os2.split('@')[0]}`) || `Voce acabou de dar um(a) ${command} no(a) @${menc_os2.split('@')[0]}`;
    let media = gamesData.games2[command];
    if (media?.image) {
        await nazu.sendMessage(from, { image: media.image, caption: responseText, mentions: [menc_os2] });
    } else if (media?.video) {
        await nazu.sendMessage(from, { video: media.video, caption: responseText, mentions: [menc_os2], gifPlayback: true });
    } else {
        await nazu.sendMessage(from, { text: responseText, mentions: [menc_os2] });
    };
} catch(e) {
console.error(e);
await reply("🐝 Oh não! Aconteceu um errinho inesperado aqui. Tente de novo daqui a pouquinho, por favor! 🥺");
};
   break;

  case 'afk':
    try {
      if (!isGroup) return reply("Este comando só funciona em grupos.");
      const reason = q.trim();
      groupData.afkUsers = groupData.afkUsers || {};
      groupData.afkUsers[sender] = {
        reason: reason || 'Não especificado',
        since: Date.now()
      };
      fs.writeFileSync(groupFile, JSON.stringify(groupData, null, 2));
      let afkSetMessage = `😴 Você está AFK.`;
      if (reason) afkSetMessage += `
Motivo: ${reason}`;
      await reply(afkSetMessage);
  } catch (e) {
      console.error('Erro no comando afk:', e);
      await reply("Ocorreu um erro ao definir AFK 💔");
  }
  break;
  
  case 'voltei':
    try {
      if (!isGroup) return reply("Este comando só funciona em grupos.");
      if (groupData.afkUsers && groupData.afkUsers[sender]) {
        delete groupData.afkUsers[sender];
        fs.writeFileSync(groupFile, JSON.stringify(groupData, null, 2));
        await reply(`👋 Bem-vindo(a) de volta! Seu status AFK foi removido.`);
    } else {
        await reply("Você não estava AFK.");
      }
  } catch (e) {
      console.error('Erro no comando voltei:', e);
      await reply("Ocorreu um erro ao remover AFK 💔");
  }
  break;
  
  case 'regras':
    try {
      if (!isGroup) return reply("Este comando só funciona em grupos.");
      if (!groupData.rules || groupData.rules.length === 0) {
        return reply("📜 Nenhuma regra definida para este grupo ainda.");
      }
      let rulesMessage = `📜 *Regras do Grupo ${groupName}* 📜

`;
      groupData.rules.forEach((rule, index) => {
        rulesMessage += `${index + 1}. ${rule}
`;
      });
      await reply(rulesMessage);
  } catch (e) {
      console.error('Erro no comando regras:', e);
      await reply("Ocorreu um erro ao buscar as regras 💔");
  }
  break;

  case 'addregra': case 'addrule':
    try {
      if (!isGroup) return reply("Este comando só funciona em grupos.");
      if (!isGroupAdmin) return reply("Apenas administradores podem adicionar regras.");
      if (!q) return reply(`📝 Por favor, forneça o texto da regra. Ex: ${prefix}addregra Proibido spam.`);
      groupData.rules = groupData.rules || [];
      groupData.rules.push(q);
      fs.writeFileSync(groupFile, JSON.stringify(groupData, null, 2));
      await reply(`✅ Regra adicionada com sucesso!
${groupData.rules.length}. ${q}`);
  } catch (e) {
      console.error('Erro no comando addregra:', e);
      await reply("Ocorreu um erro ao adicionar a regra 💔");
  }
  break;
  
  case 'delregra': case 'delrule':
    try {
      if (!isGroup) return reply("Este comando só funciona em grupos.");
      if (!isGroupAdmin) return reply("Apenas administradores podem remover regras.");
      if (!q || isNaN(parseInt(q))) return reply(`🔢 Por favor, forneça o número da regra a ser removida. Ex: ${prefix}delregra 3`);
      
      groupData.rules = groupData.rules || [];
      const ruleNumber = parseInt(q);
      if (ruleNumber < 1 || ruleNumber > groupData.rules.length) {
        return reply(`❌ Número de regra inválido. Use ${prefix}regras para ver a lista. Atualmente existem ${groupData.rules.length} regras.`);
      }
      const removedRule = groupData.rules.splice(ruleNumber - 1, 1);
      fs.writeFileSync(groupFile, JSON.stringify(groupData, null, 2));
      await reply(`🗑️ Regra "${removedRule}" removida com sucesso!`);
    } catch (e) {
      console.error('Erro no comando delregra:', e);
      await reply("Ocorreu um erro ao remover a regra 💔");
    }
    break;

  case 'addmod':
    try {
      if (!isGroup) return reply("Este comando só funciona em grupos.");
      if (!isGroupAdmin) return reply("Apenas administradores podem adicionar moderadores.");
      if (!menc_os2) return reply(`Marque o usuário que deseja promover a moderador. Ex: ${prefix}addmod @usuario`);
      const modToAdd = menc_os2;
      if (groupData.moderators.includes(modToAdd)) {
        return reply(`@${modToAdd.split('@')[0]} já é um moderador.`, { mentions: [modToAdd] });
      }
      groupData.moderators.push(modToAdd);
      fs.writeFileSync(groupFile, JSON.stringify(groupData, null, 2));
      await reply(`✅ @${modToAdd.split('@')[0]} foi promovido a moderador do grupo!`, { mentions: [modToAdd] });
  } catch (e) {
      console.error('Erro no comando addmod:', e);
      await reply("Ocorreu um erro ao adicionar moderador 💔");
  }
break;

  case 'delmod':
    try {
      if (!isGroup) return reply("Este comando só funciona em grupos.");
      if (!isGroupAdmin) return reply("Apenas administradores podem remover moderadores.");
      if (!menc_os2) return reply(`Marque o usuário que deseja remover de moderador. Ex: ${prefix}delmod @usuario`);
      const modToRemove = menc_os2;
      const modIndex = groupData.moderators.indexOf(modToRemove);
      if (modIndex === -1) {
        return reply(`@${modToRemove.split('@')[0]} não é um moderador.`, { mentions: [modToRemove] });
      }
      groupData.moderators.splice(modIndex, 1);
      fs.writeFileSync(groupFile, JSON.stringify(groupData, null, 2));
      await reply(`✅ @${modToRemove.split('@')[0]} não é mais um moderador do grupo.`, { mentions: [modToRemove] });
  } catch (e) {
      console.error('Erro no comando delmod:', e);
      await reply("Ocorreu um erro ao remover moderador 💔");
  }
  break;

  case 'listmods': case 'modlist':
    try {
      if (!isGroup) return reply("Este comando só funciona em grupos.");
      if (groupData.moderators.length === 0) {
        return reply("🛡️ Não há moderadores definidos para este grupo.");
      }
      let modsMessage = `🛡️ *Moderadores do Grupo ${groupName}* 🛡️

`;
      const mentionedUsers = [];
      groupData.moderators.forEach((modJid) => {
        modsMessage += `➥ @${modJid.split('@')[0]}
`;
        mentionedUsers.push(modJid);
      });
      await reply(modsMessage, { mentions: mentionedUsers });
  } catch (e) {
      console.error('Erro no comando listmods:', e);
      await reply("Ocorreu um erro ao listar moderadores 💔");
  }
  break;

  case 'grantmodcmd': case 'addmodcmd':
    try {
      if (!isGroup) return reply("Este comando só funciona em grupos.");
      if (!isGroupAdmin) return reply("Apenas administradores podem gerenciar permissões de moderador.");
      if (!q) return reply(`Por favor, especifique o comando para permitir aos moderadores. Ex: ${prefix}grantmodcmd ban`);
      const cmdToAllow = q.trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, "").replaceAll(prefix, "");
      if (groupData.allowedModCommands.includes(cmdToAllow)) {
        return reply(`Comando "${cmdToAllow}" já está permitido para moderadores.`);
      }
      groupData.allowedModCommands.push(cmdToAllow);
      fs.writeFileSync(groupFile, JSON.stringify(groupData, null, 2));
      await reply(`✅ Moderadores agora podem usar o comando: ${prefix}${cmdToAllow}`);
  } catch (e) {
      console.error('Erro no comando grantmodcmd:', e);
      await reply("Ocorreu um erro ao permitir comando para moderadores 💔");
  }
  break;

  case 'revokemodcmd': case 'delmodcmd':
    try {
      if (!isGroup) return reply("Este comando só funciona em grupos.");
      if (!isGroupAdmin) return reply("Apenas administradores podem gerenciar permissões de moderador.");
      if (!q) return reply(`Por favor, especifique o comando para proibir aos moderadores. Ex: ${prefix}revokemodcmd ban`);
      const cmdToDeny = q.trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, "").replaceAll(prefix, "");
      const cmdIndex = groupData.allowedModCommands.indexOf(cmdToDeny);
      if (cmdIndex === -1) {
        return reply(`Comando "${cmdToDeny}" não estava permitido para moderadores.`);
      }
      groupData.allowedModCommands.splice(cmdIndex, 1);
      fs.writeFileSync(groupFile, JSON.stringify(groupData, null, 2));
      await reply(`✅ Moderadores não podem mais usar o comando: ${prefix}${cmdToDeny}`);
  } catch (e) {
      console.error('Erro no comando revokemodcmd:', e);
      await reply("Ocorreu um erro ao proibir comando para moderadores 💔");
  }
  break;

  case 'listmodcmds':
    try {
      if (!isGroup) return reply("Este comando só funciona em grupos.");
      if (groupData.allowedModCommands.length === 0) {
        return reply("🔧 Nenhum comando específico permitido para moderadores neste grupo.");
      }
      let cmdsMessage = `🔧 *Comandos Permitidos para Moderadores em ${groupName}* 🔧\n\n`;
      groupData.allowedModCommands.forEach((cmd) => {
        cmdsMessage += `➥ ${prefix}${cmd}\n`;
      });
      await reply(cmdsMessage);
  } catch (e) {
      console.error('Erro no comando listmodcmds:', e);
      await reply("Ocorreu um erro ao listar comandos de moderadores 💔");
  }
  break;

  case 'clima':
    try {
      if (!q) return reply('Digite o nome da cidade para pesquisar o clima.');
      const geocodingResponse = await axios.get(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(q)}&count=1`);
      if (!geocodingResponse.data.results || geocodingResponse.data.results.length === 0) {
        return reply(`Cidade "${q}" não encontrada.`);
      }
      const { latitude, longitude, name } = geocodingResponse.data.results[0];
      const weatherResponse = await axios.get(`https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=weathercode,temperature_2m,relativehumidity_2m,windspeed_10m,winddirection_10m`);
      const { temperature_2m: temperature, relativehumidity_2m: relativehumidity, windspeed_10m: windspeed, winddirection_10m: winddirection, weathercode } = weatherResponse.data.current;

      let weatherDescription;
      switch (weathercode) {
        case 0:
          weatherDescription = "Céu limpo";
          break;
        case 1:
          weatherDescription = "Predominantemente limpo";
          break;
        case 2:
          weatherDescription = "Parcialmente nublado";
          break;
        case 3:
          weatherDescription = "Nublado";
          break;
        case 45:
          weatherDescription = "Nevoeiro";
          break;
        case 48:
          weatherDescription = "Nevoeiro com geada";
          break;
        case 51:
          weatherDescription = "Chuvisco leve";
          break;
        case 53:
          weatherDescription = "Chuvisco moderado";
          break;
        case 55:
          weatherDescription = "Chuvisco intenso";
          break;
        case 56:
          weatherDescription = "Chuvisco leve com geada";
          break;
        case 57:
          weatherDescription = "Chuvisco intenso com geada";
          break;
        case 61:
          weatherDescription = "Chuva leve";
          break;
        case 63:
          weatherDescription = "Chuva moderada";
          break;
        case 65:
          weatherDescription = "Chuva intensa";
          break;
        case 66:
          weatherDescription = "Chuva leve com geada";
          break;
        case 67:
          weatherDescription = "Chuva intensa com geada";
          break;
        case 71:
          weatherDescription = "Neve leve";
          break;
        case 73:
          weatherDescription = "Neve moderada";
          break;
        case 75:
          weatherDescription = "Neve intensa";
          break;
        case 77:
          weatherDescription = "Grãos de neve";
          break;
        case 80:
          weatherDescription = "Pancadas de chuva leve";
          break;
        case 81:
          weatherDescription = "Pancadas de chuva moderada";
          break;
        case 82:
          weatherDescription = "Pancadas de chuva intensa";
          break;
        case 85:
          weatherDescription = "Pancadas de neve leve";
          break;
        case 86:
          weatherDescription = "Pancadas de neve intensa";
          break;
        case 95:
          weatherDescription = "Tempestade";
          break;
        case 96:
          weatherDescription = "Tempestade com granizo leve";
          break;
        case 99:
          weatherDescription = "Tempestade com granizo intenso";
          break;
        default:
          weatherDescription = "Condição desconhecida";
      }
      
      let weatherEmoji;
      switch (weathercode) {
        case 0:
          weatherEmoji = "☀️";
          break;
        case 1:
        case 2:
          weatherEmoji = "🌤️";
          break;
        case 3:
          weatherEmoji = "☁️";
          break;
        case 45:
        case 48:
          weatherEmoji = "🌫️";
          break;
        case 51:
        case 53:
        case 55:
        case 56:
        case 57:
          weatherEmoji = "🌧️";
          break;
        case 61:
        case 63:
        case 65:
        case 66:
        case 67:
          weatherEmoji = "🌧️";
          break;
        case 71:
        case 73:
        case 75:
        case 77:
        case 85:
        case 86:
          weatherEmoji = "❄️";
          break;
        case 80:
        case 81:
        case 82:
          weatherEmoji = "🌧️";
          break;
        case 95:
        case 96:
        case 99:
          weatherEmoji = "⛈️";
          break;
        default:
          weatherEmoji = "🌈";
      }

      let windDirectionEmoji;
      if (winddirection >= 337.5 || winddirection < 22.5) {
        windDirectionEmoji = "⬆️";
      } else if (winddirection >= 22.5 && winddirection < 67.5) {
        windDirectionEmoji = "↗️";
      } else if (winddirection >= 67.5 && winddirection < 112.5) {
        windDirectionEmoji = "➡️";
      } else if (winddirection >= 112.5 && winddirection < 157.5) {
        windDirectionEmoji = "↘️";
      } else if (winddirection >= 157.5 && winddirection < 202.5) {
        windDirectionEmoji = "⬇️";
      } else if (winddirection >= 202.5 && winddirection < 247.5) {
        windDirectionEmoji = "↙️";
      } else if (winddirection >= 247.5 && winddirection < 292.5) {
        windDirectionEmoji = "⬅️";
      } else {
        windDirectionEmoji = "↖️";
      }

      const weatherInfo = `🌦️ *Clima em ${name}*

🌡️ *Temperatura:* ${temperature}°C
💧 *Umidade:* ${relativehumidity}%
💨 *Vento:* ${windspeed} km/h ${windDirectionEmoji}
${weatherEmoji} *${weatherDescription}*`;
      await reply(weatherInfo);
    } catch (e) {
      console.error(e);
      await reply("Ocorreu um erro ao pesquisar o clima 💔");
    }
    break;
    
 default:
  if (isCmd && isAutoRepo) await nazu.react('❌');
  if (!isCmd && isAutoRepo) {
    if (['prefix', 'prefixo'].includes(budy2)) {
      await reply(`✨ Aqui está o meu prefixo para usar os comandos: 『 ${prefix} 』 ✨`);
    } else if (['b dia', 'bom dia'].includes(budy2)) {
      await reply('🌞 Bom dia! Espero que seu dia seja incrível! 😊');
    } else if (['b noite', 'boa noite'].includes(budy2)) {
      await reply('🌙 Boa noite! Que sua noite seja cheia de paz e estrelas! 🌟');
    } else if (['b tarde', 'boa tarde'].includes(budy2)) {
      await reply('🌅 Boa tarde! Como posso te ajudar a tornar o dia ainda melhor? 😄');
    };
  };
 };
  } catch(error) {
    console.error('==== ERRO NO PROCESSAMENTO DA MENSAGEM ====');
    console.error('Tipo de erro:', error.name);
    console.error('Mensagem:', error.message);
    console.error('Stack trace:', error.stack);
  };
};


function getDiskSpaceInfo() {
  try {
    const platform = os.platform();
    let totalBytes = 0;
    let freeBytes = 0;
    const defaultResult = { totalGb: 'N/A', freeGb: 'N/A', usedGb: 'N/A', percentUsed: 'N/A' };

    if (platform === 'win32') {
      try {
      const scriptPath = __dirname;
      const driveLetter = pathz.parse(scriptPath).root.charAt(0);
      const command = `fsutil volume diskfree ${driveLetter}:`;
      const output = execSync(command).toString();
      const lines = output.split('\n');
        
      const freeLine = lines.find(line => line.includes('Total # of free bytes'));
      const totalLine = lines.find(line => line.includes('Total # of bytes'));
        
      if (freeLine) freeBytes = parseFloat(freeLine.split(':')[1].trim().replace(/\./g, ''));
      if (totalLine) totalBytes = parseFloat(totalLine.split(':')[1].trim().replace(/\./g, ''));
      } catch (winError) {
        console.error("Erro ao obter espaço em disco no Windows:", winError);
        return defaultResult;
      }
    } else if (platform === 'linux' || platform === 'darwin') {
      try {
        const command = 'df -k .';
      const output = execSync(command).toString();
      const lines = output.split('\n');
        
      if (lines.length > 1) {
        const parts = lines[1].split(/\s+/);
          totalBytes = parseInt(parts[1]) * 1024;
          freeBytes = parseInt(parts[3]) * 1024;
        }
      } catch (unixError) {
        console.error("Erro ao obter espaço em disco no Linux/macOS:", unixError);
        return defaultResult;
      }
    } else {
      console.warn(`Plataforma ${platform} não suportada para informações de disco`);
      return defaultResult;
    };
    
    if (totalBytes > 0 && freeBytes >= 0) {
      const usedBytes = totalBytes - freeBytes;
      const totalGb = (totalBytes / 1024 / 1024 / 1024).toFixed(2);
      const freeGb = (freeBytes / 1024 / 1024 / 1024).toFixed(2);
      const usedGb = (usedBytes / 1024 / 1024 / 1024).toFixed(2);
      const percentUsed = ((usedBytes / totalBytes) * 100).toFixed(1) + '%';
      
      return { totalGb, freeGb, usedGb, percentUsed };
    } else {
      console.warn("Valores inválidos de espaço em disco:", { totalBytes, freeBytes });
      return defaultResult;
    }
    } catch (error) {
    console.error("Erro ao obter informações de disco:", error);
    return { totalGb: 'N/A', freeGb: 'N/A', usedGb: 'N/A', percentUsed: 'N/A' };
  };
};

/*
cron.schedule('* * * * *', async () => {
  try {
    if (!fs.existsSync(DIR_PROGRAM)) {
      fs.writeFileSync(DIR_PROGRAM, JSON.stringify([], null, 2));
    }

    let actions = [];
    try {
      const data = fs.readFileSync(DIR_PROGRAM, 'utf-8');
      actions = JSON.parse(data);
    } catch (err) {
      console.error('Erro ao ler/parsear prog_actions.json:', err);
      return;
    }

    const now = new Date();
    const offsetBRT = -3 * 60;
    const nowBRT = new Date(now.getTime() + offsetBRT * 60 * 1000);
    const current = {
      year: nowBRT.getUTCFullYear(),
      month: nowBRT.getUTCMonth() + 1,
      day: nowBRT.getUTCDate(),
      hour: nowBRT.getUTCHours(),
      minute: nowBRT.getUTCMinutes(),
      dayOfWeek: ['domingo', 'segunda', 'terca', 'quarta', 'quinta', 'sexta', 'sabado'][nowBRT.getUTCDay()]
    };

    let updatedActions = [...actions];
    let actionsToRemove = [];

    for (let i = 0; i < actions.length; i++) {
      const action = actions[i];

      let shouldExecute = false;

      if (action.tipo === 'acao_repetida') {
        const [actionHour, actionMinute] = [Number(action.hora.hora), Number(action.hora.minuto)];
        if (actionHour === current.hour && actionMinute === current.minute) {
          if (action.frequencia === 'diaria') {
            shouldExecute = true;
          } else if (action.frequencia === 'semanal' && action.dia_da_semana === current.dayOfWeek) {
            shouldExecute = true;
          } else if (action.frequencia === 'mensal' && Number(action.dia_do_mes) === current.day) {
            shouldExecute = true;
          }
        }
      } else if (action.tipo === 'lembrete' || action.tipo === 'grupo') {
        if (
          Number(action.data.ano) === current.year &&
          Number(action.data.mes) === current.month &&
          Number(action.data.dia) === current.day &&
          Number(action.hora.hora) === current.hour &&
          Number(action.hora.minuto) === current.minute
        ) {
          shouldExecute = true;
          actionsToRemove.push(i);
        }
      }

      if (!shouldExecute) continue;

      try {
        if (action.tipo === 'lembrete') {
          const destino = action.destino === 'privado' ? action.sender : action.from;
          const mention = action.sender.startsWith('@') ? action.sender : `@${action.sender}`;
          await SocketActions.sendMessage(destino, {
            text: `${action.texto}\n\n${mention}`,
            mentions: [action.sender]
          });
        } else if (action.tipo === 'grupo') {
          await SocketActions.groupSettingUpdate(
            action.from,
            action.acao === 'abrir' ? 'not_announcement' : 'announcement'
          );
        } else if (action.tipo === 'acao_repetida') {
          if (action.acao === 'ENVIAR_LEMBRETE') {
            const destino = action.dados_acao.destino === 'privado' ? action.sender : action.from;
            const mention = action.sender.startsWith('@') ? action.sender : `@${action.sender.split('@')[0]}`;
            await SocketActions.sendMessage(destino, {
              text: `${action.dados_acao.lembrete}\n\n${mention}`,
              mentions: [action.sender]
            });
          }
        }
      } catch (err) {
        console.error(`Erro ao processar ação ${action.tipo}:`, err);
      }
    }

    updatedActions = updatedActions.filter((_, index) => !actionsToRemove.includes(index));

    fs.writeFileSync(DIR_PROGRAM, JSON.stringify(updatedActions, null, 2));
  } catch (err) {
    console.error('Erro na execução do cron:', err);
  }
});
*/

module.exports = NazuninhaBotExec;
