const db = require('../models');
const Address = db.Address;

/* ============================================================
   CRIAR ENDEREÇO (com GPS)
   ============================================================ */

const createAddress = async (req, res) => {
  try {
    const { 
      label, 
      province, 
      municipality, 
      street, 
      number, 
      neighborhood, 
      reference, 
      isDefault,
      latitude,
      longitude
    } = req.body;

    const userId = req.user.id;

    // Se marcou como padrão, desmarcar outros
    if (isDefault) {
      await Address.update(
        { isDefault: false },
        { where: { userId } }
      );
    }

    // Criar endereço com coordenadas
    const address = await Address.create({
      userId,
      label,
      province,
      municipality,
      street,
      number,
      neighborhood,
      reference,
      isDefault,
      latitude,
      longitude
    });

    console.log(`✅ Endereço criado com GPS: ${latitude}, ${longitude}`);

    res.status(201).json({
      success: true,
      message: 'Endereço criado com sucesso',
      data: address
    });

  } catch (error) {
    console.error('Erro ao criar endereço:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao criar endereço',
      error: error.message
    });
  }
};

/* ============================================================
   LISTAR ENDEREÇOS
   ============================================================ */

const getUserAddresses = async (req, res) => {
  try {
    const userId = req.user.id;

    const addresses = await Address.findAll({
      where: { userId },
      order: [['isDefault', 'DESC']]
    });

    res.json({
      success: true,
      data: addresses
    });

  } catch (error) {
    console.error("Erro ao buscar endereços:", error);
    res.status(500).json({
      success: false,
      message: "Erro ao buscar endereços",
      error: error.message
    });
  }
};

/* ============================================================
   ATUALIZAR ENDEREÇO (🆕 COM VALIDAÇÃO DE GPS)
   ============================================================ */

const updateAddress = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    const address = await Address.findOne({ where: { id, userId } });

    if (!address) {
      return res.status(404).json({
        success: false,
        message: "Endereço não encontrado"
      });
    }

    const { isDefault, latitude, longitude } = req.body;

    // Se marcou como padrão, desmarcar outros
    if (isDefault) {
      await Address.update({ isDefault: false }, { where: { userId } });
    }

    // 🆕 VALIDAR GPS SE ENVIADO
    if (latitude !== undefined || longitude !== undefined) {
      // Verificar se ambos foram enviados
      if (latitude !== undefined && longitude === undefined) {
        return res.status(400).json({
          success: false,
          message: 'Latitude e longitude devem ser enviadas juntas'
        });
      }
      
      if (longitude !== undefined && latitude === undefined) {
        return res.status(400).json({
          success: false,
          message: 'Latitude e longitude devem ser enviadas juntas'
        });
      }

      // Validar tipo
      if (typeof latitude !== 'number' || typeof longitude !== 'number') {
        return res.status(400).json({
          success: false,
          message: 'Coordenadas GPS devem ser números'
        });
      }

      // Validar range válido
      if (latitude < -90 || latitude > 90) {
        return res.status(400).json({
          success: false,
          message: 'Latitude deve estar entre -90 e 90'
        });
      }

      if (longitude < -180 || longitude > 180) {
        return res.status(400).json({
          success: false,
          message: 'Longitude deve estar entre -180 e 180'
        });
      }

      console.log(`📍 Atualizando GPS do endereço ${id}: ${latitude}, ${longitude}`);
    }

    // Atualizar endereço
    await address.update(req.body);

    res.json({
      success: true,
      message: "Endereço atualizado com sucesso!",
      data: address
    });

  } catch (error) {
    console.error("Erro ao atualizar endereço:", error);
    res.status(500).json({
      success: false,
      message: "Erro ao atualizar endereço",
      error: error.message
    });
  }
};

/* ============================================================
   DELETAR ENDEREÇO
   ============================================================ */

const deleteAddress = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    const deleted = await Address.destroy({
      where: { id, userId }
    });

    if (!deleted) {
      return res.status(404).json({
        success: false,
        message: "Endereço não encontrado"
      });
    }

    res.json({
      success: true,
      message: "Endereço removido com sucesso!"
    });

  } catch (error) {
    console.error("Erro ao deletar endereço:", error);
    res.status(500).json({
      success: false,
      message: "Erro ao remover endereço",
      error: error.message
    });
  }
};

/* ============================================================
   EXPORTAÇÃO
   ============================================================ */

module.exports = {
  createAddress,
  getUserAddresses,
  updateAddress,
  deleteAddress
};