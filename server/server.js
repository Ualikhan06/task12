const express = require('express');
const multer = require('multer');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const { Pool } = require('pg');

const app = express();
app.use(cors());
app.use(express.json());

fs.mkdirSync('uploads', { recursive: true });
app.use('/uploads', express.static('uploads'));

const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'postgres',
  password: '123', // <-- Укажите ваш пароль от PostgreSQL
  port: 5432,
});

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads'),
  filename: (req, file, cb) => {
    const uniqueName = Date.now() + '-' + Math.round(Math.random() * 1e6) + path.extname(file.originalname);
    cb(null, uniqueName);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 15 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.fieldname === 'cover') {
      const ok = ['image/jpeg', 'image/png', 'image/webp'].includes(file.mimetype);
      return cb(ok ? null : new Error('Обложка должна быть JPG, PNG или WEBP'), ok);
    }
    if (file.fieldname === 'pdf') {
      const ok = file.mimetype === 'application/pdf';
      return cb(ok ? null : new Error('Файл книги должен быть в формате PDF'), ok);
    }
    cb(new Error('Неизвестное поле'), false);
  }
});

// Получить все книги
app.get('/api/books', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        id, 
        title, 
        author, 
        cover_url AS "coverUrl", 
        pdf_url AS "pdfUrl", 
        pdf_size AS "pdfSize", 
        created_at AS "createdAt"
      FROM public.books 
      ORDER BY id DESC
    `);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Ошибка чтения БД: ' + err.message });
  }
});

// Добавить книгу
app.post(
  '/api/books',
  upload.fields([
    { name: 'cover', maxCount: 1 },
    { name: 'pdf', maxCount: 1 }
  ]),
  async (req, res) => {
    try {
      const { title, author } = req.body;
      const coverFile = req.files?.cover?.[0];
      const pdfFile = req.files?.pdf?.[0];

      if (!coverFile || !pdfFile) {
        return res.status(400).json({ error: 'Нужно выбрать и обложку, и PDF-файл' });
      }
      if (!title || !author) {
        return res.status(400).json({ error: 'Заполните название книги и автора' });
      }

      const coverUrl = '/uploads/' + coverFile.filename;
      const pdfUrl = '/uploads/' + pdfFile.filename;

      const result = await pool.query(
        `INSERT INTO public.books (title, author, cover_url, pdf_url, pdf_size)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING id, title, author, cover_url AS "coverUrl", pdf_url AS "pdfUrl", pdf_size AS "pdfSize"`,
        [title, author, coverUrl, pdfUrl, pdfFile.size]
      );

      res.json(result.rows[0]);
    } catch (err) {
      res.status(500).json({ error: 'Ошибка сохранения в БД: ' + err.message });
    }
  }
);

// Удалить книгу
app.delete('/api/books/:id', async (req, res) => {
  try {
    const id = Number(req.params.id);
    const findRes = await pool.query('SELECT cover_url, pdf_url FROM public.books WHERE id = $1', [id]);

    if (findRes.rows.length === 0) {
      return res.status(404).json({ error: 'Книга не найдена' });
    }

    const book = findRes.rows[0];
    [book.cover_url, book.pdf_url].forEach((fileUrl) => {
      const fullPath = path.join(__dirname, fileUrl);
      if (fs.existsSync(fullPath)) fs.unlinkSync(fullPath);
    });

    await pool.query('DELETE FROM public.books WHERE id = $1', [id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Ошибка удаления: ' + err.message });
  }
});

app.use((err, req, res, next) => {
  res.status(400).json({ error: err.message });
});

app.listen(3000, () => console.log('Сервер с PostgreSQL запущен: http://localhost:3000'));
