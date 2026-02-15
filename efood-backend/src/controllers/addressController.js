//const Address = require('../models/Address');
//const Address = require('../models');

const db = require('../models');
const Address = db.Address;
/* ============================================================
   DEFINIÇÃO CORRETA DAS FUNÇÕES (SEM exports.)
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


/* ============================================================ */

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


/* ============================================================ */

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

        const { isDefault } = req.body;

        if (isDefault) {
            await Address.update({ isDefault: false }, { where: { userId } });
        }

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


/* ============================================================ */

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
   EXPORTAÇÃO CORRETA E COMPATÍVEL COM Express
   ============================================================ */

module.exports = {
    createAddress,
    getUserAddresses,
    updateAddress,
    deleteAddress
};
