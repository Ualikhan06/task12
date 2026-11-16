import { useEffect, useState } from 'react';

export default function BookList({ refreshKey, onDeleted }) {
  const [books, setBooks] = useState([]);
  const [serverError, setServerError] = useState('');

  useEffect(() => {
    fetch('http://localhost:3000/api/books')
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setBooks(data);
          setServerError('');
        } else {
          setBooks([]);
          setServerError(data.error || 'Сервер вернул некорректные данные');
        }
      })
      .catch(() => {
        setBooks([]);
        setServerError('Не удалось подключиться к серверу на порту 3000');
      });
  }, [refreshKey]);

  const handleDelete = async (id) => {
    await fetch(`http://localhost:3000/api/books/${id}`, { method: 'DELETE' });
    if (onDeleted) onDeleted();
  };

  return (
    <div>
      <div className="catalog-header">
        <h2>Каталог книг</h2>
        <span className="badge">Всего: {books.length}</span>
      </div>

      {serverError && (
        <div className="message error" style={{ marginBottom: 20 }}>
          <strong>Ошибка базы данных / сервера:</strong> {serverError}
        </div>
      )}

      {!serverError && books.length === 0 ? (
        <div className="empty-state">
          В библиотеке пока нет книг. Загрузите первую книгу через форму выше!
        </div>
      ) : (
        <div className="books-grid">
          {books.map((book) => (
            <div className="book-card" key={book.id}>
              <img
                className="book-cover"
                src={'http://localhost:3000' + book.coverUrl}
                alt={book.title}
              />
              <div className="book-body">
                <div>
                  <h3 className="book-title">{book.title}</h3>
                  <p className="book-author">{book.author}</p>
                  <p className="book-meta">
                    PDF • {(book.pdfSize / (1024 * 1024)).toFixed(2)} МБ
                  </p>
                </div>

                <div className="book-actions">
                  <a
                    className="btn-read"
                    href={'http://localhost:3000' + book.pdfUrl}
                    target="_blank"
                    rel="noreferrer"
                  >
                    Читать
                  </a>
                  <button
                    className="btn-delete"
                    onClick={() => handleDelete(book.id)}
                  >
                    Удалить
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
