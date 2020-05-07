import React, {
  createContext,
  useState,
  useCallback,
  useContext,
  useEffect,
} from 'react';

import AsyncStorage from '@react-native-community/async-storage';

interface Product {
  id: string;
  title: string;
  image_url: string;
  price: number;
  quantity: number;
}

interface CartContext {
  products: Product[];
  addToCart(item: Omit<Product, 'quantity'>): void;
  increment(id: string): void;
  decrement(id: string): void;
}

const CartContext = createContext<CartContext | null>(null);

const CartProvider: React.FC = ({ children }) => {
  const [products, setProducts] = useState<Product[]>([]);

  useEffect(() => {
    async function loadProducts(): Promise<void> {
      const storagedProducts = await AsyncStorage.getItem(
        '@GoMarketPlace:products',
      );
      if (storagedProducts) {
        setProducts(JSON.parse(storagedProducts));
      }
    }

    loadProducts();
  }, []);

  const addToCart = useCallback(
    async product => {
      let cartStored: Product[] = [];
      let prodIndex = -1;

      prodIndex = cartStored.findIndex(item => item.id === product.id);
      cartStored = [...products];

      if (prodIndex !== -1) {
        cartStored[prodIndex].quantity += 1;
      } else {
        cartStored.push({ ...product, quantity: 1 });
      }

      setProducts(cartStored);

      await AsyncStorage.setItem(
        '@GoMarketPlace:products',
        JSON.stringify(products),
      );
    },
    [products],
  );

  const increment = useCallback(
    async id => {
      const cartStored = products.map(product => {
        if (product.id !== id) return product;

        const updateProduct = {
          ...product,
          quantity: product.quantity + 1,
        };

        return updateProduct;
      });

      setProducts(cartStored);

      await AsyncStorage.setItem(
        '@GoMarketPlace:products',
        JSON.stringify(products),
      );
    },
    [products],
  );

  const decrement = useCallback(
    async id => {
      const cartStored = products
        .map(product => {
          if (product.id !== id) return product;

          const updatedProduct = {
            ...product,
            quantity: product.quantity - 1,
          };

          return updatedProduct;
        })
        .filter(product => product.quantity > 0);

      setProducts(cartStored);

      await AsyncStorage.setItem(
        '@GoMarketPlace:products',
        JSON.stringify(products),
      );
    },
    [products],
  );

  const value = React.useMemo(
    () => ({ addToCart, increment, decrement, products }),
    [products, addToCart, increment, decrement],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};

function useCart(): CartContext {
  const context = useContext(CartContext);

  if (!context) {
    throw new Error(`useCart must be used within a CartProvider`);
  }

  return context;
}

export { CartProvider, useCart };
