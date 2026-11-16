import { useState } from 'react';

export default function BookForm({ onAdded }) {
  const [title, setTitle] = useState('');
  const [author, setAuthor] = useState('');
  const [cover, setCover] = useState(null);
  const [pdf, setPdf] = useState(null);
  const [preview, setPreview] = useState('');
  const [progress, setProgress] = useState(0);
  const [message, setMessage] = useState('');
  const [isError, setIsError] = useState(false);

  const showMsg = (text, error = false) => {
    setMessage(text);
    setIsError(error);
  };

  const handleCoverChange = (e) => {
    const f = e.target.files && e.target.files[0];
    if (!f) return;

    if (!['image/jpeg', 'image/png', 'image/webp'].includes(f.type)) {
      return showMsg('Обложка должна быть в формате JPG, PNG или WEBP', true);
    }
    if (f.size > 2 * 1024 * 1024) {
      return showMsg('Максимальный размер обложки — 2 МБ', true);
    }

    setCover(f);
    setPreview(URL.createObjectURL(f));
    setMessage('');
  };

  const handlePdfChange = (e) => {
    const f = e.target.files && e.target.files[0];
    if (!f) return;

    if (f.type !== 'application/pdf') {
      return showMsg('Файл книги должен быть в формате PDF', true);
    }
    if (f.size > 15 * 1024 * 1024) {
      return showMsg('Максимальный размер PDF — 15 МБ', true);
    }

    setPdf(f);
    setMessage('');
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!title.trim() || !author.trim() || !cover || !pdf) {
      return showMsg('Заполните все текстовые поля и выберите оба файла', true);
    }

    const fd = new FormData();
    fd.append('title', title);
    fd.append('author', author);
    fd.append('cover', cover);
    fd.append('pdf', pdf);

    // Используем XMLHttpRequest для отслеживания прогресса загрузки
    const xhr = new XMLHttpRequest();
    xhr.open('POST', 'http://localhost:3000/api/books');

    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable) {
        const percent = Math.round((event.loaded / event.total) * 100);
        setProgress(percent);
      }
    };

    xhr.onload = () => {
      try {
        const data = JSON.parse(xhr.responseText);
        if (xhr.status >= 200 && xhr.status < 300) {
          setTitle('');
          setAuthor('');
          setCover(null);
          setPdf(null);
          setPreview('');
          setProgress(0);
          e.target.reset();
          showMsg('Книга успешно добавлена в библиотеку!', false);
          if (onAdded) onAdded();
        } else {
          setProgress(0);
          showMsg(data.error || 'Ошибка загрузки', true);
        }
      } catch {
        setProgress(0);
        showMsg('Ошибка обработки ответа сервера', true);
      }
    };

    xhr.onerror = () => {
      setProgress(0);
      showMsg('Нет соединения с сервером (проверьте node server.js)', true);
    };

    xhr.send(fd);
  };

  return (
    <form className="form-card" onSubmit={handleSubmit}>
      <h2>Добавить новую книгу</h2>

      <div className="form-grid">
        <div className="form-group">
          <label>Название книги</label>
          <input
            className="input-text"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Например: Чистый код"
          />
        </div>

        <div className="form-group">
          <label>Автор</label>
          <input
            className="input-text"
            type="text"
            value={author}
            onChange={(e) => setAuthor(e.target.value)}
            placeholder="Например: Роберт Мартин"
          />
        </div>
      </div>

      <div className="form-grid">
        <div className="form-group">
          <label>Обложка (JPG, PNG, WEBP до 2 МБ)</label>
          <div className="file-box">
            <input type="file" accept="image/*" onChange={handleCoverChange} />
            {preview && <img className="preview-img" src={preview} alt="Предпросмотр" />}
          </div>
        </div>

        <div className="form-group">
          <label>Электронная книга (PDF до 15 МБ)</label>
          <div className="file-box">
            <input type="file" accept="application/pdf" onChange={handlePdfChange} />
            {pdf && (
              <p className="file-info">
                Файл: <strong>{pdf.name}</strong> ({(pdf.size / (1024 * 1024)).toFixed(2)} МБ)
              </p>
            )}
          </div>
        </div>
      </div>

      <button className="btn-submit" type="submit">
        Загрузить в библиотеку
      </button>

      {progress > 0 && (
        <div style={{ marginTop: 14 }}>
          <progress value={progress} max="100" style={{ width: '100%', height: 18 }} />
          <div style={{ fontSize: '0.85rem', color: '#475569', marginTop: 4 }}>
            Загрузка: {progress}%
          </div>
        </div>
      )}

      {message && (
        <div className={`message ${isError ? 'error' : ''}`}>
          {message}
        </div>
      )}
    </form>
  );
}
