import { Storage } from '@google-cloud/storage';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import multer from 'multer';
import dotenv from 'dotenv';

dotenv.config();

// Configuration de Google Cloud Storage
const storage = new Storage({
    credentials: {
        type: process.env.GCS_TYPE,
        project_id: process.env.GCS_PROJECT_ID,
        private_key_id: process.env.GCS_PRIVATE_KEY_ID,
        private_key: process.env.GCS_PRIVATE_KEY.replace(/\\n/g, '\n'),
        client_email: process.env.GCS_CLIENT_EMAIL,
        client_id: process.env.GCS_CLIENT_ID,
        auth_uri: process.env.GCS_AUTH_URI,
        token_uri: process.env.GCS_TOKEN_URI,
        auth_provider_x509_cert_url: process.env.GCS_AUTH_PROVIDER_X509_CERT_URL,
        client_x509_cert_url: process.env.GCS_CLIENT_X509_CERT_URL
    },
    projectId: process.env.GCS_PROJECT_ID
});

const bucket = storage.bucket('monpetitroadtrip'); // Remplacez par le nom de votre bucket

// Configuration de multer pour gérer les uploads de fichiers
export const uploadPhotos = multer({ storage: multer.memoryStorage() }).array('photos', 10); // Limite à 10 fichiers

// Fonction pour uploader un fichier sur Google Cloud Storage
export const uploadToGCS = (file, entityId) => {
    return new Promise((resolve, reject) => {
        const newFileName = `${entityId}/${uuidv4()}-${path.extname(file.originalname)}`;
        const blob = bucket.file(newFileName);
        const blobStream = blob.createWriteStream({
            resumable: false,
            contentType: file.mimetype,
            metadata: {
                contentType: file.mimetype
            }
        });

        blobStream.on('error', (err) => {
            reject(err);
        });

        blobStream.on('finish', async () => {
            const [url] = await blob.getSignedUrl({
                action: 'read',
                expires: '03-01-2500' // Vous pouvez ajuster la date d'expiration selon vos besoins
            });
            resolve(url);
        });

        blobStream.end(file.buffer);
    });
};

// Fonction pour uploader des photos pour une entité
export const uploadEntityPhotos = async (req, res, entity, entityId) => {
    try {
        const photoUrls = await Promise.all(req.files.map(file => uploadToGCS(file, entityId)));

        entity.photos = entity.photos.concat(photoUrls);
        await entity.save();

        res.json(entity);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
};

// Fonction pour supprimer un fichier de Google Cloud Storage
export const deleteFromGCS = (fileUrl) => {
    return new Promise((resolve, reject) => {
        let fileName;
        if (fileUrl.startsWith('https://storage.googleapis.com/')) {
            fileName = fileUrl.split('/').slice(4).join('/').split('?')[0];
        } else if (fileUrl.startsWith('https://storage.cloud.google.com/')) {
            fileName = fileUrl.split('/').slice(4).join('/').split('?')[0];
        } else if (fileUrl.startsWith('gs://')) {
            fileName = fileUrl.split('/').slice(3).join('/');
        } else {
            return reject(new Error('Invalid URL format'));
        }

        console.log(`Deleting file: ${fileName}`);

        const file = bucket.file(fileName);

        file.delete((err) => {
            if (err) {
                console.error(`Error deleting file: ${err.message}`);
                if (err.code === 404) {
                    reject(new Error('No such object'));
                } else {
                    reject(err);
                }
            } else {
                console.log(`File deleted successfully: ${fileName}`);
                resolve();
            }
        });
    });
};

// Fonction pour supprimer une photo d'une entité
export const deleteEntityPhoto = async (req, res, entity) => {
    try {
        const photoUrl = req.body.photoUrl;
        try {
            await deleteFromGCS(photoUrl);
        } catch (err) {
            if (err.message === 'No such object') {
                return res.status(404).json({ msg: 'Photo not found in Google Cloud Storage' });
            } else {
                throw err;
            }
        }

        entity.photos = entity.photos.filter(url => url !== photoUrl);
        await entity.save();

        res.json(entity);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
};