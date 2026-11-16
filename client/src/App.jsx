import { useState } from 'react';
import './App.css';
import BookForm from './BookForm';
import BookList from './BookList';

export default function App() {
  const [refreshKey, setRefreshKey] = useState(0);
  const triggerRefresh = () => setRefreshKey((k) => k + 1);

  return (
    <div className="container">
      <header className="header">
        <h1>Электронная библиотека</h1>
        <p>Загружайте книги в PDF с обложками и читайте их прямо в браузере</p>
      </header>

      <BookForm onAdded={triggerRefresh} />
      <BookList refreshKey={refreshKey} onDeleted={triggerRefresh} />
    </div>
  );
}
