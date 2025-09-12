import React, { useEffect, useState } from 'react';
import { getProducts } from './services/api';

function App() {
  const [products, setProducts] = useState([]);

  useEffect(() => {
    getProducts().then(response => {
      setProducts(response.data);
    });
  }, []);

  return (
    <div>
      <h1>E-commerce Platform</h1>
      {products.map(product => (
        <div key={product.id}>
          {product.name} - ${product.price}
        </div>
      ))}
    </div>
  );
}

export default App;