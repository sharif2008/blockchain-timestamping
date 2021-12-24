'use strict';

/**
 * Module Dependencies
 */


var multer = require('multer');
var sha256File = require('sha256-file');
const { uuid } = require('uuidv4');
var path = require('path');

var uploadStorage = multer.diskStorage({
    limits: { fileSize: 1000000 }, // 1MB
    destination: function (req, file, callback) {
        callback(null, './uploads');
    },
    filename: function (req, file, callback) {
        callback(null, uuid() + path.extname(file.originalname));
    }
});

var uploader = multer({ storage: uploadStorage }).single('document');

module.exports = router => {

    router.post('/upload', (req, res) => {
        uploader(req, res, function (err) {
            if (err) {
                return res.json({ status: false, "msg": "Error uploading file." + err });
            }
            let hash = sha256File('./uploads/' + req.file.filename);
            res.json({
                "status": "true",
                'fileName': req.file.originalname,
                'mimetype': req.file.mimetype,
                'uuid': path.basename(req.file.filename, path.extname(req.file.filename)),
                'hash': hash,
                'msg': "File is uploaded successfully",
            });
        });
    });

};

