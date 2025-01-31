const express= require("express")
const router= express.Router();
const collectionController= require('../controllers/collectionController');
const jwt_helpers= require('../helpers/jwt_helper')

//;route cannot return
router.get('/:id', collectionController.getCollectionDetails)
router.post('/add' ,collectionController.addNewCollection)
router.get('/groupData/:id' ,collectionController.groupingData)
router.patch("/edit/:id", collectionController.editCollection)
router.get('/statistic/:id' ,collectionController.statistic)
router.post("/searchValues/:id", collectionController.searchValues)
router.delete("/delete/:userId/:id", collectionController.deleteCollection)
router.get('/sort/:id',collectionController.sortCollection)
module.exports =  router
