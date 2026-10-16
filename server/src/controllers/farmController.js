const farmService = require('C:/Go/Farm/server/src/services/farmService.js');

function getState(req, res) {
  try {
    const data = farmService.getFarmState(req.user.id);
    return res.status(200).json({
      success: true,
      data
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
}

function plant(req, res) {
  try {
    const { plotIndex, seedId } = req.body;
    if (plotIndex === undefined || !seedId) {
      return res.status(400).json({ success: false, message: 'Thiếu plotIndex hoặc seedId' });
    }
    const data = farmService.plantCrop(req.user.id, Number(plotIndex), seedId);
    return res.status(200).json({
      success: true,
      message: 'Gieo hạt thành công!',
      data
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message
    });
  }
}

function water(req, res) {
  try {
    const { plotIndex } = req.body;
    if (plotIndex === undefined) {
      return res.status(400).json({ success: false, message: 'Thiếu plotIndex' });
    }
    const data = farmService.waterPlot(req.user.id, Number(plotIndex));
    return res.status(200).json({
      success: true,
      message: 'Tưới nước thành công!',
      data
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message
    });
  }
}

function harvest(req, res) {
  try {
    const { plotIndex } = req.body;
    if (plotIndex === undefined) {
      return res.status(400).json({ success: false, message: 'Thiếu plotIndex' });
    }
    const data = farmService.harvestCrop(req.user.id, Number(plotIndex));
    return res.status(200).json({
      success: true,
      message: 'Thu hoạch thành công!',
      data
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message
    });
  }
}

function getLayout(req, res) {
  try {
    const layout = farmService.getFarmLayout(req.user.id);
    return res.status(200).json({
      success: true,
      data: layout
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
}

function saveLayout(req, res) {
  try {
    const { layout } = req.body;
    if (!layout) {
      return res.status(400).json({ success: false, message: 'Thiếu dữ liệu layout' });
    }
    const saved = farmService.saveFarmLayout(req.user.id, layout);
    return res.status(200).json({
      success: true,
      message: 'Lưu bố cục trang trại thành công!',
      data: saved
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message
    });
  }
}

module.exports = {
  getState,
  plant,
  water,
  harvest,
  getLayout,
  saveLayout
};
