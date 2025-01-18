// routes/practice.js
const express = require('express');
const router = express.Router();
const Practice = require('../models/Practice');
const auth = require('../middleware/auth');
const mongoose = require('mongoose');
const fs = require('fs').promises;
const { ObjectId } = mongoose.Types;

// Yeni pratik oluştur
router.post('/practices', auth, async (req, res) => {
  try {
    const { pratikAdi, questions, duyguAnaliz, bilgiAnaliz } = req.body;
    
    const practice = new Practice({
      userId: req.user.id,
      pratikAdi,
      questions: questions.map(q => ({
        text: q.text,
        emotionData: [],
        analysisResults: {},
        bilgiAnalizi: {}
      })),
      duyguAnaliz,
      bilgiAnaliz
    });
    
    await practice.save();
    
    res.status(201).json({
      message: 'Yeni pratik başarıyla oluşturuldu.',
      practice: {
        id: practice._id,
        pratikAdi: practice.pratikAdi,
        createdAt: practice.createdAt
      }
    });
  } catch (error) {
    console.error('Pratik oluşturma hatası:', error);
    res.status(400).json({ message: 'Pratik oluşturulamadı.', error: error.message });
  }
});

router.get('/practices', auth, async (req, res) => {
  try {
    const { limit = 10, skip = 0 } = req.query;
    
    const practices = await Practice.find({ 
      userId: req.user.id 
    })
    .sort({ createdAt: -1 }) // En yeniden eskiye sırala
    .limit(parseInt(limit))
    .skip(parseInt(skip));

    const total = await Practice.countDocuments({ userId: req.user.id });
    
    res.json({
      practices,
      total,
      hasMore: total > (parseInt(skip) + practices.length),
      duyguAnaliz: practices[0]?.duyguAnaliz || 0,
      bilgiAnaliz: practices[0]?.bilgiAnaliz || 0
    });

  } catch (error) {
    console.error('Pratik getirme hatası:', error);
    res.status(500).json({ message: 'Pratikler getirilemedi', error: error.message });
  }
});
/*


All Rights Reserved
                       TALENT TRACK AI






*/

// Tüm pratikleri getir (paginate ile)
router.get('/practices', auth, async (req, res) => {
  try {
    const { limit = 500, skip = 0 } = req.query;
    
    const practices = await Practice.find({ 
      userId: req.user.id 
    })
    .sort({ createdAt: -1 })
    .limit(parseInt(limit))
    .skip(parseInt(skip));

    const total = await Practice.countDocuments({ userId: req.user.id });
    
    res.json({
      practices,
      total,
      hasMore: total > (parseInt(skip) + practices.length)
    });

  } catch (error) {
    res.status(500).json({ message: 'Pratikler getirilemedi', error: error.message });
  }
});

// Tek bir pratiğin detayını getir
router.get('/practices/:id', auth, async (req, res) => {
  try {
    const practice = await Practice.findOne({
      _id: req.params.id,
      userId: req.user.id
    });

    if (!practice) {
      return res.status(404).json({ message: 'Pratik bulunamadı' });
    }

    res.json(practice);
  } catch (error) {
    res.status(500).json({ message: 'Pratik getirilemedi', error: error.message });
  }
});


module.exports = router;